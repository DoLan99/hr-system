import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";

const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"] as const;

const createSchema = z.object({
  proposedCode: z.string().min(2).regex(/^[A-Z0-9_]+$/),
  proposedTitle: z.string().min(1),
  description: z.string().min(1),
  proposedTaskType: z.enum(TASK_TYPES),
  proposedEstimate: z.number().int().positive(),
  evidenceVideoLink: z.string().min(1),
  exampleTaskIds: z.array(z.number().int()).optional(),
  reasonNote: z.string().min(1),
});

const include = {
  employee: { select: { id: true, fullName: true, avatarUrl: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);

  const where: any = {};
  if (status) where.status = status;

  if (isAdmin) {
    // see all
  } else if (isSubManager) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    where.employeeId = { in: managedIds ? [...managedIds, userId] : [userId] };
  } else {
    where.employeeId = userId;
  }

  const items = await prisma.templateSuggestion.findMany({
    where,
    include,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const created = await prisma.templateSuggestion.create({
    data: {
      ...parsed.data,
      employeeId: Number(session.user.id),
      exampleTaskIds: parsed.data.exampleTaskIds ?? [],
    },
    include,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
