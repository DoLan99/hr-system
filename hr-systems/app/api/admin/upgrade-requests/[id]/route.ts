import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getAdminSession } from "@/lib/admin-auth";

const actionSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().optional(),
});

const PLAN_MAP: Record<string, "FREE" | "STARTER" | "TEAM"> = {
  FREE: "FREE", STARTER: "STARTER", TEAM: "TEAM",
};

const SEAT_LIMIT: Record<string, number> = {
  FREE: 1, STARTER: 10, TEAM: 25,
};

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "SUPPORT"].includes(session.type))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { action, note } = parsed.data;
  const id = Number(params.id);

  const request = await prisma.upgradeRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "PENDING")
    return NextResponse.json({ error: "Already processed" }, { status: 409 });

  const updated = await prisma.upgradeRequest.update({
    where: { id },
    data: { status: action, note: note ?? null, approvedAt: action === "APPROVED" ? new Date() : null },
  });

  if (action === "APPROVED") {
    const newPlan = PLAN_MAP[request.targetPlan.toUpperCase()] ?? "STARTER";
    // Đọc seatLimit từ DB config, fallback về hardcode
    const planCfg = await prisma.planConfig.findUnique({ where: { id: newPlan } });
    const seatLimit = planCfg?.seatLimit ?? SEAT_LIMIT[newPlan] ?? 10;
    await prisma.organization.update({
      where: { id: request.organizationId },
      data: { plan: newPlan, status: "ACTIVE", seatLimit },
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && request.requesterEmail) {
    const approved = action === "APPROVED";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "noreply@jobihome.vn",
        to: request.requesterEmail,
        subject: approved ? `✅ Gói ${request.targetPlan} đã được kích hoạt` : `❌ Yêu cầu nâng gói không được duyệt`,
        html: approved
          ? `<p>Xin chào <b>${request.requesterName}</b>,</p><p>Workspace <b>${request.orgName}</b> đã được nâng cấp lên gói <b>${request.targetPlan}</b> thành công!</p><p>Cảm ơn bạn đã sử dụng jobihome.vn 🎉</p>`
          : `<p>Xin chào <b>${request.requesterName}</b>,</p><p>Yêu cầu nâng gói của workspace <b>${request.orgName}</b> chưa được duyệt.${note ? `<br>Lý do: ${note}` : ""}</p><p>Vui lòng liên hệ <a href="mailto:support@jobihome.vn">support@jobihome.vn</a> để được hỗ trợ.</p>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ data: updated });
});
