import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const stepSchema = z.object({
  stepOrder: z.number().int().min(1),
  name: z.string().min(1),
  approverType: z.enum(["ROLE", "SPECIFIC_EMPLOYEE", "DEPARTMENT_HEAD", "DIRECT_MANAGER"]),
  approverRef: z.string().nullable().optional(),
  slaHours: z.number().int().min(1).nullable().optional(),
  stepType: z.enum(["any", "all"]).optional().default("any"),
  notifyOnReject: z.boolean().optional().default(true),
  approverRefs: z.array(z.string()).optional().default([]),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  targetType: z.enum(["LEAVE", "DOCUMENT", "PURCHASE", "TIMELOG", "CUSTOM"]),
  triggers: z.array(z.string()).optional().default([]),
  conditions: z.array(z.object({ field: z.string(), op: z.string(), val: z.string() })).optional().default([]),
  notificationsConfig: z.object({
    onSubmit: z.boolean(), onApprove: z.boolean(), onReject: z.boolean(), onDeadline: z.boolean(),
  }).optional(),
  steps: z.array(stepSchema).min(1),
});

// GET /api/workflows/templates
export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const templates = await prisma.workflowTemplate.findMany({
    where: { organizationId: auth.orgId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: templates });
});

// POST /api/workflows/templates
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { steps, conditions, notificationsConfig, ...rest } = parsed.data;

  const template = await prisma.workflowTemplate.create({
    data: {
      ...rest,
      conditions: conditions as any,
      notificationsConfig: notificationsConfig as any,
      organizationId: auth.orgId,
      steps: { create: steps },
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return NextResponse.json({ data: template }, { status: 201 });
});
