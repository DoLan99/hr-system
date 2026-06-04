import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcActualWorked } from "@/lib/office-time";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const timeStr = z.string().regex(/^\d{2}:\d{2}$/).nullable().optional();

const editSchema = z.object({
  startWork1: timeStr,
  startLunch: timeStr,
  startWork2: timeStr,
  startAfternoonBreak: timeStr,
  startWork3: timeStr,
  endWorkday: timeStr,
  explanation: z.string().optional(),
});

function parseTime(base: Date, t: string | null | undefined): Date | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.officeTime.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  if (!isManager && existing.employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const base = existing.date;

  const updateData: Record<string, any> = {};
  if (d.explanation !== undefined) updateData.explanation = d.explanation;

  if ("startWork1" in d) updateData.startWork1 = parseTime(base, d.startWork1);
  if ("startLunch" in d) updateData.startLunch = parseTime(base, d.startLunch);
  if ("startWork2" in d) updateData.startWork2 = parseTime(base, d.startWork2);
  if ("startAfternoonBreak" in d) updateData.startAfternoonBreak = parseTime(base, d.startAfternoonBreak);
  if ("startWork3" in d) updateData.startWork3 = parseTime(base, d.startWork3);
  if ("endWorkday" in d) updateData.endWorkday = parseTime(base, d.endWorkday);

  if (!isManager) {
    updateData.approvalStatus = "PENDING";
    updateData.approvedById = null;
    updateData.approvedAt = null;
  }

  const record = await prisma.officeTime.update({ where: { id }, data: updateData });

  const actualWorked = calcActualWorked(record);
  const delta = actualWorked > 0 ? record.timeLogsTotal - actualWorked : null;

  const updated = await prisma.officeTime.update({
    where: { id },
    data: { actualWorked, delta },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  await prisma.officeTime.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
