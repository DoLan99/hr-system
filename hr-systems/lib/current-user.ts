import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { rawPrisma } from "@/lib/prisma";
import { getTenantSlug, buildTenantUrl } from "@/lib/tenant";

export type AuthedEmployee = NonNullable<Awaited<ReturnType<typeof requireAuth>>>;

/**
 * Try to claim a pending Employee record for this Clerk user. Used as a
 * fallback when the Clerk webhook isn't reachable (e.g. dev mode without
 * ngrok). Matches by email + organizationId, then updates clerkUserId.
 *
 * Returns the claimed Employee or null if no pending record found.
 */
async function tryClaimPendingEmployee(
  clerkUserId: string,
  email: string,
  organizationId: string,
) {
  const pending = await rawPrisma.employee.findFirst({
    where: {
      organizationId,
      emailCompany: email,
      clerkUserId: { startsWith: "pending:" },
    },
  });
  if (!pending) return null;

  return rawPrisma.employee.update({
    where: { id: pending.id },
    data: { clerkUserId, status: "ACTIVE" },
    include: { organization: true, role: true },
  });
}

export async function getAuth() {
  const user = await currentUser();
  if (!user) return null;

  const tenantSlug = await getTenantSlug();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  if (!tenantSlug) {
    const anyEmployee = await rawPrisma.employee.findFirst({
      where: { clerkUserId: user.id },
      include: { organization: true, role: true },
    });
    return {
      clerkUser: user,
      tenantSlug: null as string | null,
      organization: anyEmployee?.organization ?? null,
      employee: anyEmployee,
    };
  }

  let employee = await rawPrisma.employee.findFirst({
    where: { clerkUserId: user.id, organization: { slug: tenantSlug } },
    include: { organization: true, role: true },
  });

  if (!employee && primaryEmail) {
    const org = await rawPrisma.organization.findUnique({ where: { slug: tenantSlug } });
    if (org) {
      employee = await tryClaimPendingEmployee(user.id, primaryEmail, org.id);
    }
  }

  return {
    clerkUser: user,
    tenantSlug,
    organization: employee?.organization ?? null,
    employee: employee ?? null,
  };
}

export async function requireAuth() {
  const auth = await getAuth();
  if (!auth) redirect("/sign-in");

  if (!auth.employee) {
    if (!auth.tenantSlug) {
      redirect("/onboarding");
    }

    const userOwnOrg = await rawPrisma.employee.findFirst({
      where: { clerkUserId: auth.clerkUser.id },
      include: { organization: true },
    });

    if (userOwnOrg) {
      redirect(await buildTenantUrl(userOwnOrg.organization.slug, "/welcome"));
    }
    redirect("/onboarding");
  }

  return {
    clerkUser: auth.clerkUser,
    organization: auth.employee.organization,
    employee: auth.employee,
    role: auth.employee.role,
  };
}
