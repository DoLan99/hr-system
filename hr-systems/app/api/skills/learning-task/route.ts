import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { SKILL_LEVELS } from "@/lib/skills/constants";

const schema = z.object({
  skillId: z.number().int(),
  employeeId: z.number().int().optional(),
  fromLevel: z.number().int().min(0).max(5),
  toLevel: z.number().int().min(1).max(5),
  estimatedHours: z.number().min(0.5).max(200).default(8),
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const targetEmployeeId = parsed.data.employeeId ?? auth.actorId;
  if (!isManager && targetEmployeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const skill = await prisma.skill.findFirst({
    where: { id: parsed.data.skillId, organizationId: auth.orgId },
  });
  if (!skill) return NextResponse.json({ error: "Skill không tồn tại" }, { status: 404 });

  const last = await prisma.task.findFirst({
    where: { organizationId: auth.orgId },
    orderBy: { id: "desc" },
    select: { code: true },
  });
  const seq = last ? Number(last.code.replace("TSK-", "")) + 1 : 1;
  const code = `TSK-${String(seq).padStart(4, "0")}`;

  const fromLabel = SKILL_LEVELS[parsed.data.fromLevel] ?? `Level ${parsed.data.fromLevel}`;
  const toLabel = SKILL_LEVELS[parsed.data.toLevel] ?? `Level ${parsed.data.toLevel}`;
  const title = `Học ${skill.name} (${fromLabel} → ${toLabel})`;
  const description = `Auto-generated từ skill gap.\nSkill: ${skill.name}${skill.category ? ` (${skill.category})` : ""}\nLevel hiện tại: ${fromLabel}\nLevel cần: ${toLabel}`;
  const estimatedMinutes = Math.round(parsed.data.estimatedHours * 60);

  const task = await prisma.task.create({
    data: {
      organizationId: auth.orgId,
      code,
      title,
      description,
      taskType: "LEARNING",
      priority: "NORMAL",
      status: "BACKLOG",
      estimatedTime: estimatedMinutes,
      assignedToId: targetEmployeeId,
      assignedById: auth.actorId,
      requiresVideo: true,
    },
    select: { id: true, code: true, title: true, status: true, estimatedTime: true, taskType: true },
  });

  return NextResponse.json({ data: task });
});
