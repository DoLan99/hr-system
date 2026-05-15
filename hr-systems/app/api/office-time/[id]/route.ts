import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcActualWorked } from "@/lib/office-time";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

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

// PUT /api/office-time/[id] — manual edit (employee sửa giờ + giải thích, manager override)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.officeTime.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const base = existing.date;

  const updateData: Record<string, any> = {};
  if (d.explanation !== undefined) updateData.explanation = d.explanation;

  // Chỉ update field nào được gửi (không null = có giá trị mới, null = xóa)
  if ("startWork1" in d) updateData.startWork1 = parseTime(base, d.startWork1);
  if ("startLunch" in d) updateData.startLunch = parseTime(base, d.startLunch);
  if ("startWork2" in d) updateData.startWork2 = parseTime(base, d.startWork2);
  if ("startAfternoonBreak" in d) updateData.startAfternoonBreak = parseTime(base, d.startAfternoonBreak);
  if ("startWork3" in d) updateData.startWork3 = parseTime(base, d.startWork3);
  if ("endWorkday" in d) updateData.endWorkday = parseTime(base, d.endWorkday);

  // Reset approval nếu employee tự sửa
  if (!isManager) {
    updateData.approvalStatus = "PENDING";
    updateData.approvedById = null;
    updateData.approvedAt = null;
  }

  const record = await prisma.officeTime.update({
    where: { id },
    data: updateData,
  });

  // Recalc
  const actualWorked = calcActualWorked(record);
  const delta = actualWorked > 0 ? record.timeLogsTotal - actualWorked : null;

  const updated = await prisma.officeTime.update({
    where: { id },
    data: { actualWorked, delta },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/office-time/[id] — manager only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  await prisma.officeTime.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
