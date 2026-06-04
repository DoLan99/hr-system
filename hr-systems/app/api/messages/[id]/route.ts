import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logMessageAudit, diffObjects } from "@/lib/message-audit";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

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
  supportTime: z.number().int().min(0).nullable().optional(),
  benefitTime: z.number().int().min(0).nullable().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const existing = await prisma.message.findFirst({ where: { id: Number(params.id) } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  if (!isManager && existing.assignedToId !== auth.actorId) {
    return NextResponse.json({ error: "Không có quyền chỉnh sửa tin nhắn này" }, { status: 403 });
  }

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

  const auditFields = ["status", "assignedToId", "subject", "dueDate", "supportTime", "benefitTime", "valueType"];
  const changes = diffObjects(existing as any, updated as any, auditFields);
  const action = d.status && d.status !== existing.status ? "STATUS_CHANGED" : "UPDATED";
  await logMessageAudit({ messageId: updated.id, actorId: auth.actorId, action, changes });

  const isOverdue = !!(updated.dueDate && updated.status !== "CLOSED" && updated.dueDate < new Date());
  return NextResponse.json({ data: { ...updated, isOverdue } });
});

export const DELETE = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  if (!MANAGER_ROLES.includes(auth.roleName)) {
    return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
  }

  await logMessageAudit({ messageId: Number(params.id), actorId: auth.actorId, action: "DELETED" });
  await prisma.message.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
