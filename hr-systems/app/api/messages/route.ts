import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  tags: z.string().optional(),
  valueType: z.enum(["A", "B", "C"]).optional(),
  supportTime: z.number().int().optional(),
  benefitTime: z.number().int().optional(),
});

// GET /api/messages?status=OPEN&customerId=&assignedToId=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const assignedToId = searchParams.get("assignedToId");
  const channel = searchParams.get("channel");
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = Number(customerId);
  if (assignedToId) where.assignedToId = Number(assignedToId);
  if (channel) where.channel = channel;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { messageSummary: { contains: search, mode: "insensitive" } },
      { actionRequired: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      customer: { select: { id: true, customerName: true, businessName: true } },
      assignedTo: { select: { id: true, fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: messages });
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  // netTime = benefitTime - supportTime
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
      assignedToId: d.assignedToId ?? Number(session.user.id),
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      status: d.status ?? "OPEN",
      linkFile: d.linkFile,
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

  return NextResponse.json({ data: message }, { status: 201 });
}
