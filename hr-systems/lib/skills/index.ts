import { prisma } from "@/lib/prisma";

export const SKILL_LEVELS: Record<number, string> = {
  1: "Beginner",
  2: "Novice",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

export const IMPORTANCE_WEIGHT: Record<string, number> = {
  CRITICAL: 1.0,
  IMPORTANT: 0.7,
  NICE_TO_HAVE: 0.3,
};

export interface SkillGap {
  skillId: number;
  skillName: string;
  category: string | null;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importance: "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE";
  met: boolean;
}

export interface RoleReadiness {
  roleId: number;
  roleName: string;
  roleLabel: string;
  seniority: number;
  isCurrent: boolean;
  totalRequirements: number;
  metRequirements: number;
  criticalGaps: number;
  readinessPct: number;
  status: "ready" | "almost" | "developing" | "early";
  gaps: SkillGap[];
}

interface EmployeeSkillRecord {
  skillId: number;
  currentLevel: number;
}

interface RoleRequirementRecord {
  skillId: number;
  requiredLevel: number;
  importance: "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE";
  skill: { id: number; name: string; category: string | null };
}

function computeRoleReadiness(
  reqs: RoleRequirementRecord[],
  empSkillMap: Map<number, number>,
): { gaps: SkillGap[]; metCount: number; criticalGaps: number; readinessPct: number } {
  const gaps: SkillGap[] = reqs.map(req => {
    const currentLevel = empSkillMap.get(req.skillId) ?? 0;
    const met = currentLevel >= req.requiredLevel;
    return {
      skillId: req.skillId,
      skillName: req.skill.name,
      category: req.skill.category,
      currentLevel,
      requiredLevel: req.requiredLevel,
      gap: Math.max(0, req.requiredLevel - currentLevel),
      importance: req.importance,
      met,
    };
  });

  let totalWeight = 0;
  let metWeight = 0;
  let criticalGaps = 0;
  let metCount = 0;
  for (const g of gaps) {
    const w = IMPORTANCE_WEIGHT[g.importance];
    totalWeight += w;
    if (g.met) {
      metWeight += w;
      metCount += 1;
    } else if (g.importance === "CRITICAL") {
      criticalGaps += 1;
    }
  }

  const readinessPct = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 100;

  return { gaps, metCount, criticalGaps, readinessPct };
}

export async function computeCareerPath(orgId: string, employeeId: number): Promise<{
  current: { roleId: number; roleName: string; gaps: SkillGap[]; readinessPct: number } | null;
  candidates: RoleReadiness[];
}> {
  const employee = await prisma.employee.findFirst({
    where: { organizationId: orgId, id: employeeId },
    select: { roleId: true, role: { select: { id: true, name: true, label: true, seniority: true } } },
  });
  if (!employee) return { current: null, candidates: [] };

  const [allRoles, empSkills] = await Promise.all([
    prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        skillRequirements: {
          include: { skill: { select: { id: true, name: true, category: true } } },
        },
      },
      orderBy: [{ seniority: "asc" }, { label: "asc" }],
    }),
    prisma.employeeSkill.findMany({
      where: { organizationId: orgId, employeeId },
      select: { skillId: true, currentLevel: true },
    }),
  ]);

  const empSkillMap = new Map(empSkills.map((e: EmployeeSkillRecord) => [e.skillId, e.currentLevel]));

  const currentRole = allRoles.find(r => r.id === employee.roleId);
  let current: { roleId: number; roleName: string; gaps: SkillGap[]; readinessPct: number } | null = null;
  if (currentRole) {
    const { gaps, readinessPct } = computeRoleReadiness(currentRole.skillRequirements as any, empSkillMap);
    current = { roleId: currentRole.id, roleName: currentRole.label, gaps, readinessPct };
  }

  const candidates: RoleReadiness[] = allRoles.map(role => {
    const { gaps, metCount, criticalGaps, readinessPct } = computeRoleReadiness(role.skillRequirements as any, empSkillMap);
    let status: RoleReadiness["status"];
    if (criticalGaps === 0 && readinessPct >= 90) status = "ready";
    else if (criticalGaps === 0 && readinessPct >= 70) status = "almost";
    else if (readinessPct >= 50) status = "developing";
    else status = "early";

    return {
      roleId: role.id,
      roleName: role.name,
      roleLabel: role.label,
      seniority: role.seniority,
      isCurrent: role.id === employee.roleId,
      totalRequirements: role.skillRequirements.length,
      metRequirements: metCount,
      criticalGaps,
      readinessPct,
      status,
      gaps,
    };
  });

  return { current, candidates };
}
