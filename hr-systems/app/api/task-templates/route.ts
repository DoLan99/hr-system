import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const createSchema = z.object({
  code: z.string().min(2).regex(/^[A-Z0-9_]+$/, "Code phải UPPER_SNAKE_CASE"),
  title: z.string().min(1),
  description: z.string().optional(),
  defaultTaskType: z.string().default("TASK"),
  defaultEstimatedTime: z.number().int().nullable().optional(),
  defaultPriority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  requiresVideo: z.boolean().nullable().optional(),
  department: z.string().nullable().optional(),
  linkTemplate: z.string().optional(),
  defaultChecklist: z.array(z.string()).nullable().optional(),
  defaultLabels: z.array(z.string()).nullable().optional(),
  defaultAssigneeId: z.number().int().nullable().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const department = searchParams.get("department");
  const activeOnly = searchParams.get("activeOnly") !== "false";

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
    include: {
      _count: { select: { tasks: true } },
      createdBy: { select: { id: true, fullName: true } },
      defaultAssignee: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: items });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const canManage = ADMIN_ROLES.includes(auth.roleName) || auth.roleName === "MANAGER" || auth.roleName === "TEAM_LEAD";
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const exists = await prisma.taskTemplate.findFirst({ where: { code: d.code } });
  if (exists) return NextResponse.json({ error: "Code đã tồn tại" }, { status: 409 });

  const created = await prisma.taskTemplate.create({
    data: {
      organizationId: auth.orgId,
      code: d.code,
      title: d.title,
      description: d.description,
      defaultTaskType: d.defaultTaskType,
      defaultEstimatedTime: d.defaultEstimatedTime,
      defaultPriority: d.defaultPriority,
      requiresVideo: d.requiresVideo,
      department: d.department,
      linkTemplate: d.linkTemplate,
      defaultChecklist: d.defaultChecklist ?? undefined,
      defaultLabels: d.defaultLabels ?? undefined,
      defaultAssigneeId: d.defaultAssigneeId,
      createdById: auth.actorId,
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
});
