import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantSlug, buildTenantUrl } from "@/lib/tenant";

/**
 * /welcome acts as a router that resolves to the user's tenant dashboard:
 *
 * - Not signed in → /sign-in
 * - No org yet → /onboarding
 * - On root (no subdomain) → redirect to {slug}.host/dashboard
 * - On tenant subdomain, valid member → /dashboard
 * - On tenant subdomain, NOT a member → ErrorCard with link to their own org
 * - On tenant subdomain, org slug not found in DB → ErrorCard
 */
export default async function WelcomePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const tenantSlug = await getTenantSlug();

  // Case 1: no subdomain — find user's org and bounce there
  if (!tenantSlug) {
    const employee = await prisma.employee.findFirst({
      where: { clerkUserId: user.id },
      include: { organization: true },
    });

    if (!employee) {
      redirect("/onboarding");
    }

    redirect(await buildTenantUrl(employee.organization.slug, "/dashboard"));
  }

  // Case 2: on tenant subdomain — verify slug exists
  const org = await prisma.organization.findUnique({ where: { slug: tenantSlug } });
  if (!org) {
    return (
      <ErrorCard title="Workspace không tồn tại">
        Subdomain <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">{tenantSlug}</code>{" "}
        chưa được đăng ký.
      </ErrorCard>
    );
  }

  // Case 3: on tenant subdomain — verify membership
  const employee = await prisma.employee.findFirst({
    where: { clerkUserId: user.id, organizationId: org.id },
  });

  if (!employee) {
    const userOwnOrg = await prisma.employee.findFirst({
      where: { clerkUserId: user.id },
      include: { organization: true },
    });

    return (
      <ErrorCard title="Bạn không thuộc workspace này">
        Tài khoản <strong>{user.emailAddresses[0]?.emailAddress}</strong> không phải thành viên của{" "}
        <strong>{org.name}</strong>.
        {userOwnOrg && (
          <>
            {" "}
            Workspace của bạn:{" "}
            <a
              href={await buildTenantUrl(userOwnOrg.organization.slug, "/dashboard")}
              className="text-blue-600 dark:text-blue-400 underline"
            >
              {userOwnOrg.organization.slug}.jobihome.vn
            </a>
          </>
        )}
      </ErrorCard>
    );
  }

  // Case 4: all good → land in dashboard
  redirect("/dashboard");
}

function ErrorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-4 text-gray-900 dark:text-gray-100">
        <h1 className="text-xl font-bold text-red-600 dark:text-red-400">{title}</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">{children}</p>
      </div>
    </div>
  );
}
