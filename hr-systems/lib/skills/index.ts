import { prisma } from "@/lib/prisma";
export { SKILL_LEVELS, IMPORTANCE_WEIGHT } from "./constants";

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

export interface CareerLevelReadiness {
  levelId: number;
  levelName: string;
  seniority: number;
  isCurrent: boolean;
  totalRequirements: number;
  metRequirements: number;
  criticalGaps: number;
  readinessPct: number;
  status: "ready" | "almost" | "developing" | "early";
  gaps: SkillGap[];
}

export interface CareerPathResult {
  trackId: number;
  trackName: string;
  trackColor: string | null;
  currentLevelName: string | null;
  levels: CareerLevelReadiness[];
}

function computeLevelReadiness(
  reqs: Array<{ skillId: number; requiredLevel: number; importance: string; skill: { id: number; name: string; category: string | null } }>,
  empSkillMap: Map<number, number>,
) {
  const WEIGHT: Record<string, number> = { CRITICAL: 3, IMPORTANT: 2, NICE_TO_HAVE: 1 };
  const gaps: SkillGap[] = reqs.map(req => {
    const currentLevel = empSkillMap.get(req.skillId) ?? 0;
    return {
      skillId: req.skillId,
      skillName: req.skill.name,
      category: req.skill.category,
      currentLevel,
      requiredLevel: req.requiredLevel,
      gap: Math.max(0, req.requiredLevel - currentLevel),
      importance: req.importance as SkillGap["importance"],
      met: currentLevel >= req.requiredLevel,
    };
  });

  let totalWeight = 0, metWeight = 0, criticalGaps = 0, metCount = 0;
  for (const g of gaps) {
    const w = WEIGHT[g.importance] ?? 2;
    totalWeight += w;
    if (g.met) { metWeight += w; metCount++; }
    else if (g.importance === "CRITICAL") criticalGaps++;
  }

  const readinessPct = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 100;
  return { gaps, metCount, criticalGaps, readinessPct };
}

export async function computeCareerPath(
  orgId: string,
  employeeId: number,
): Promise<CareerPathResult | null> {
  const employee = await prisma.employee.findFirst({
    where: { organizationId: orgId, id: employeeId },
    select: { careerTrackId: true, careerLevelId: true },
  });

  if (!employee?.careerTrackId) return null;

  const [track, empSkills] = await Promise.all([
    prisma.careerTrack.findFirst({
      where: { id: employee.careerTrackId, organizationId: orgId },
      include: {
        levels: {
          orderBy: { seniority: "asc" },
          include: {
            skillRequirements: {
              include: { skill: { select: { id: true, name: true, category: true } } },
            },
          },
        },
      },
    }),
    prisma.employeeSkill.findMany({
      where: { organizationId: orgId, employeeId },
      select: { skillId: true, currentLevel: true },
    }),
  ]);

  if (!track) return null;

  const empSkillMap = new Map(empSkills.map(e => [e.skillId, e.currentLevel]));

  const levels: CareerLevelReadiness[] = track.levels.map(level => {
    const { gaps, metCount, criticalGaps, readinessPct } = computeLevelReadiness(
      level.skillRequirements as any,
      empSkillMap,
    );

    let status: CareerLevelReadiness["status"];
    if (criticalGaps === 0 && readinessPct >= 90) status = "ready";
    else if (criticalGaps === 0 && readinessPct >= 70) status = "almost";
    else if (readinessPct >= 50) status = "developing";
    else status = "early";

    return {
      levelId: level.id,
      levelName: level.name,
      seniority: level.seniority,
      isCurrent: level.id === employee.careerLevelId,
      totalRequirements: level.skillRequirements.length,
      metRequirements: metCount,
      criticalGaps,
      readinessPct,
      status,
      gaps,
    };
  });

  const currentLevel = track.levels.find(l => l.id === employee.careerLevelId);

  return {
    trackId: track.id,
    trackName: track.name,
    trackColor: track.color,
    currentLevelName: currentLevel?.name ?? null,
    levels,
  };
}
