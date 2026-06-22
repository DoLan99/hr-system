import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logMessageAudit } from "@/lib/message-audit";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().min(1),
  time: z.string().optional(),
  channel: z.enum(["EMAIL", "SLACK", "PHONE", "ZALO", "CHAT", "OTHER"]).optional(),
  customerId: z.number().int().optional(),
  subject: z.string().optional(),
  messageSummary: z.string().optional(),
  actionRequired: z.string().optional(),
  assignedToId: z.number().int().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
  linkFile: z.string().optional(),
  followUpNote: z.string().optional(),
  companyAnswer: z.string().optional(),
  tags: z.string().optional(),
  valueType: z.enum(["A", "B", "C"]).optional(),
  supportTime: z.number().int().min(0).optional(),
  benefitTime: z.number().int().min(0).optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const assignedToId = searchParams.get("assignedToId");
  const channel = searchParams.get("channel");
  const search = searchParams.get("search") ?? "";
  const overdue = searchParams.get("overdue") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  const where: any = {};

  if (!isManager) where.assignedToId = auth.actorId;

  if (status) where.status = status;
  if (customerId) where.customerId = Number(customerId);
  if (assignedToId) where.assignedToId = Number(assignedToId);
  if (channel) where.channel = channel;
  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { not: "CLOSED" };
  }
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { messageSummary: { contains: search, mode: "insensitive" } },
      { actionRequired: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  const now = new Date();
  const data = messages.map(m => ({
    ...m,
    isOverdue: !!(m.dueDate && m.status !== "CLOSED" && m.dueDate < now),
  }));

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const netTime = (d.benefitTime ?? 0) - (d.supportTime ?? 0);

  const message = await prisma.message.create({
    data: {
      date: new Date(d.date),
      time: d.time ? new Date(`1970-01-01T${d.time}:00`) : null,
      channel: d.channel,
      customerId: d.customerId,
      subject: d.subject,
      messageSummary: d.messageSummary,
      actionRequired: d.actionRequired,
      assignedToId: d.assignedToId ?? auth.actorId,
      senderEmployeeId: auth.actorId,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      status: d.status ?? "OPEN",
      linkFile: d.linkFile,
      followUpNote: d.followUpNote,
      companyAnswer: d.companyAnswer,
      tags: d.tags,
      valueType: d.valueType,
      supportTime: d.supportTime,
      benefitTime: d.benefitTime,
      netTime,
    },
    include: {
      customer: { select: { id: true, customerName: true, businessName: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
  });

  await logMessageAudit({ messageId: message.id, actorId: auth.actorId, action: "CREATED" });

  return NextResponse.json({ data: message }, { status: 201 });
});
