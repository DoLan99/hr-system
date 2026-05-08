import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  time: z.string().nullable().optional(),
  channel: z.enum(["EMAIL", "SLACK", "PHONE", "ZALO", "CHAT", "OTHER"]).nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  subject: z.string().optional(),
  messageSummary: z.string().optional(),
  actionRequired: z.string().optional(),
  assignedToId: z.number().int().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  linkFile: z.string().nullable().optional(),
  followUpNote: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  valueType: z.enum(["A", "B", "C"]).nullable().optional(),
  companyAnswer: z.string().nullable().optional(),
  supportTime: z.number().int().nullable().optional(),
  benefitTime: z.number().int().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const existing = await prisma.message.findUnique({ where: { id: Number(params.id) } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const supportTime = d.supportTime !== undefined ? d.supportTime : existing.supportTime;
  const benefitTime = d.benefitTime !== undefined ? d.benefitTime : existing.benefitTime;
  const netTime = (benefitTime ?? 0) - (supportTime ?? 0);

  const closedDate = d.status === "CLOSED" && existing.status !== "CLOSED" ? new Date() : undefined;

  const updated = await prisma.message.update({
    where: { id: Number(params.id) },
    data: {
      ...(d.date && { date: new Date(d.date) }),
      ...(d.time !== undefined && { time: d.time ? new Date(`1970-01-01T${d.time}:00`) : null }),
      ...(d.channel !== undefined && { channel: d.channel }),
      ...(d.customerId !== undefined && { customerId: d.customerId }),
      ...(d.subject !== undefined && { subject: d.subject }),
      ...(d.messageSummary !== undefined && { messageSummary: d.messageSummary }),
      ...(d.actionRequired !== undefined && { actionRequired: d.actionRequired }),
      ...(d.assignedToId !== undefined && { assignedToId: d.assignedToId }),
      ...(d.dueDate !== undefined && { dueDate: d.dueDate ? new Date(d.dueDate) : null }),
      ...(d.status && { status: d.status }),
      ...(d.linkFile !== undefined && { linkFile: d.linkFile }),
      ...(d.followUpNote !== undefined && { followUpNote: d.followUpNote }),
      ...(d.tags !== undefined && { tags: d.tags }),
      ...(d.valueType !== undefined && { valueType: d.valueType }),
      ...(d.companyAnswer !== undefined && { companyAnswer: d.companyAnswer }),
      ...(d.supportTime !== undefined && { supportTime: d.supportTime }),
      ...(d.benefitTime !== undefined && { benefitTime: d.benefitTime }),
      netTime,
      ...(closedDate && { closedDate }),
    },
    include: {
      customer: { select: { id: true, customerName: true, businessName: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.message.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
