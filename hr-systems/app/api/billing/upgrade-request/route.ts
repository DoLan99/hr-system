import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const schema = z.object({
  targetPlan:    z.string().min(1),
  currentPlan:   z.string().min(1),
  priceVnd:      z.number().int().positive(),
  transferNote:  z.string().min(1),
  requesterName: z.string().min(1),
  requesterEmail:z.string().email(),
  orgName:       z.string().min(1),
  orgSlug:       z.string().min(1),
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  // Upsert: nếu đã có PENDING cho org này thì update, tránh spam
  const existing = await prisma.upgradeRequest.findFirst({
    where: { organizationId: auth.orgId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const record = existing
    ? await prisma.upgradeRequest.update({
        where: { id: existing.id },
        data: { targetPlan: d.targetPlan, priceVnd: d.priceVnd, transferNote: d.transferNote, updatedAt: new Date() },
      })
    : await prisma.upgradeRequest.create({
        data: {
          organizationId: auth.orgId,
          orgName:        d.orgName,
          orgSlug:        d.orgSlug,
          requesterName:  d.requesterName,
          requesterEmail: d.requesterEmail,
          currentPlan:    d.currentPlan,
          targetPlan:     d.targetPlan,
          priceVnd:       d.priceVnd,
          transferNote:   d.transferNote,
        },
      });

  // Gửi email admin nếu có RESEND_API_KEY
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL ?? "support@jobihome.vn";
  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "noreply@jobihome.vn",
        to: adminEmail,
        subject: `[Upgrade Request] ${d.orgName} → ${d.targetPlan}`,
        html: `
          <h2>Yêu cầu nâng cấp gói</h2>
          <table>
            <tr><td><b>Workspace:</b></td><td>${d.orgName} (${d.orgSlug})</td></tr>
            <tr><td><b>Người yêu cầu:</b></td><td>${d.requesterName} &lt;${d.requesterEmail}&gt;</td></tr>
            <tr><td><b>Gói hiện tại:</b></td><td>${d.currentPlan}</td></tr>
            <tr><td><b>Gói muốn nâng:</b></td><td>${d.targetPlan}</td></tr>
            <tr><td><b>Số tiền:</b></td><td>${d.priceVnd.toLocaleString("vi-VN")}đ</td></tr>
            <tr><td><b>Nội dung CK:</b></td><td>${d.transferNote}</td></tr>
          </table>
          <p><a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3003"}/admin/upgrade-requests">Xem và duyệt tại Admin Panel →</a></p>
        `,
      }),
    }).catch(() => {}); // fire-and-forget, không fail request nếu email lỗi
  }

  return NextResponse.json({ data: record }, { status: 201 });
});
