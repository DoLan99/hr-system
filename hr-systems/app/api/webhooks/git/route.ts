import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * POST /api/webhooks/git
 *
 * Webhook nhận push event từ GitHub/GitLab. Parse mã `TSK-xxxx` trong
 * commit message, map sang Employee qua email tác giả, và tự tạo TimeLog
 * marker để cộng dồn `actualTimeTotal`.
 *
 * Xác thực (chọn 1):
 *  - GitHub: header `X-Hub-Signature-256` = `sha256=` + HMAC(body, GIT_WEBHOOK_SECRET)
 *  - Đơn giản: header `Authorization: Bearer ${GIT_WEBHOOK_SECRET}`
 *
 * Mỗi commit → 1 TimeLog với:
 *  - durationMinutes = GIT_COMMIT_DEFAULT_MINUTES (default 15)
 *  - approvalStatus = PENDING (chờ manager duyệt)
 *  - note = "🔗 Git commit: <msg> (<sha7>)"
 */

const DEFAULT_MINUTES = Number(process.env.GIT_COMMIT_DEFAULT_MINUTES ?? "15");
const TASK_CODE_RE = /\bTSK-\d{3,}\b/gi;

const commitSchema = z.object({
  id: z.string(),
  message: z.string(),
  timestamp: z.string().optional(),
  url: z.string().optional(),
  author: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

const payloadSchema = z.object({
  commits: z.array(commitSchema).default([]),
  // GitHub uses 'sender'/'pusher'; GitLab uses 'user_email'. We don't rely on these.
});

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifyAuth(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.GIT_WEBHOOK_SECRET;
  if (!secret) return false;

  // GitHub signature
  const sig = req.headers.get("x-hub-signature-256");
  if (sig) {
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqual(sig, expected);
  }

  // Bearer token fallback
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyAuth(req, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const results: Array<{ commit: string; taskCode: string; status: "linked" | "skipped"; reason?: string }> = [];

  for (const commit of parsed.data.commits) {
    const codes = Array.from(new Set((commit.message.match(TASK_CODE_RE) ?? []).map((c) => c.toUpperCase())));
    if (codes.length === 0) continue;

    const authorEmail = commit.author?.email?.toLowerCase().trim();
    let employee: { id: number } | null = null;
    if (authorEmail) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { emailCompany: { equals: authorEmail, mode: "insensitive" } },
            { emailGoogle: { equals: authorEmail, mode: "insensitive" } },
            { emailPrivate: { equals: authorEmail, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
    }

    if (!employee) {
      for (const c of codes) results.push({ commit: commit.id, taskCode: c, status: "skipped", reason: "unknown author email" });
      continue;
    }

    const commitDate = commit.timestamp ? new Date(commit.timestamp) : new Date();
    const dayStart = new Date(commitDate);
    dayStart.setHours(0, 0, 0, 0);
    const sha7 = commit.id.slice(0, 7);

    for (const code of codes) {
      const task = await prisma.task.findUnique({ where: { code }, select: { id: true } });
      if (!task) {
        results.push({ commit: commit.id, taskCode: code, status: "skipped", reason: "task not found" });
        continue;
      }

      // Dedup: nếu đã có TimeLog với note chứa sha7 + code → bỏ qua
      const existing = await prisma.timeLog.findFirst({
        where: {
          taskId: task.id,
          employeeId: employee.id,
          note: { contains: sha7 },
        },
        select: { id: true },
      });
      if (existing) {
        results.push({ commit: commit.id, taskCode: code, status: "skipped", reason: "already linked" });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.timeLog.create({
          data: {
            taskId: task.id,
            employeeId: employee.id,
            date: dayStart,
            startTime: commitDate,
            endTime: commitDate,
            durationMinutes: DEFAULT_MINUTES,
            note: `🔗 Git commit: ${commit.message.split("\n")[0].slice(0, 200)} (${sha7})`,
            creditedMinutes: null,
            approvalStatus: "PENDING",
          },
        });
        await tx.task.update({
          where: { id: task.id },
          data: {
            actualTimeTotal: { increment: DEFAULT_MINUTES },
            lastUpdate: new Date(),
          },
        });
      });

      results.push({ commit: commit.id, taskCode: code, status: "linked" });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: parsed.data.commits.length,
    linked: results.filter((r) => r.status === "linked").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  });
}
