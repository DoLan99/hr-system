import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getActorId, getOrgId } from "./request-context";

export const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

export type RequireResult =
  | { ok: true; actorId: number; orgId: string; roleName: string; isManager: boolean; isAdmin: boolean }
  | { ok: false; response: NextResponse };

export async function requireApiAuth(): Promise<RequireResult> {
  const actorId = getActorId();
  const orgId = getOrgId();
  if (!actorId || !orgId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const me = await prisma.employee.findFirst({
    where: { id: actorId },
    select: { role: { select: { name: true } } },
  });

  const roleName = me?.role.name ?? "";

  return {
    ok: true,
    actorId,
    orgId,
    roleName,
    isManager: MANAGER_ROLES.includes(roleName),
    isAdmin: ADMIN_ROLES.includes(roleName),
  };
}

export async function requireManager(): Promise<RequireResult> {
  const result = await requireApiAuth();
  if (!result.ok) return result;
  if (!result.isManager) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
