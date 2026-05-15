import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ADMIN_ROLES } from "@/lib/managed-scope";

const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"] as const;

const createSchema = z.object({
  code: z.string().min(2).regex(/^[A-Z0-9_]+$/, "Code phải UPPER_SNAKE_CASE"),
  title: z.string().min(1),
  description: z.string().optional(),
  defaultTaskType: z.enum(TASK_TYPES).default("NORMAL"),
  defaultEstimatedTime: z.number().int().nullable().optional(),
  defaultPriority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  requiresVideo: z.boolean().nullable().optional(),
  department: z.string().optional(),
  linkTemplate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const department = searchParams.get("department");
  const activeOnly = searchParams.get("activeOnly") !== "false"; // default true

  const where: any = {};
  if (activeOnly) where.isActive = true;
  if (department && department !== "all") where.department = department;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.taskTemplate.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { usageCount: "desc" }, { code: "asc" }],
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const canManage = ADMIN_ROLES.includes(userRole) || userRole === "MANAGER" || userRole === "TEAM_LEAD";
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const exists = await prisma.taskTemplate.findUnique({ where: { code: d.code } });
  if (exists) return NextResponse.json({ error: "Code đã tồn tại" }, { status: 409 });

  const created = await prisma.taskTemplate.create({
    data: {
      ...d,
      createdById: Number(session.user.id),
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
