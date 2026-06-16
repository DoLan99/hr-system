import { redirect } from "next/navigation";
import { rawPrisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { TrialBanner } from "@/components/layout/trial-banner";
import { ActivityTracker } from "@/components/tracking/activity-tracker";
import { TimerProvider } from "@/lib/contexts/timer-context";
import { SidebarProvider } from "@/lib/contexts/sidebar-context";
import { CurrentUserProvider, CurrentUserData } from "@/lib/contexts/current-user-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clerkUser, employee, organization, role } = await requireAuth();

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );

  const memberCount = await rawPrisma.employee.count({
    where: { organizationId: organization.id, status: { not: "INACTIVE" } },
  });

  const userData: CurrentUserData = {
    employeeId: employee.id,
    clerkUserId: clerkUser.id,
    fullName: employee.fullName,
    email: employee.emailCompany || primaryEmail?.emailAddress || "",
    avatarUrl: employee.avatarUrl ?? clerkUser.imageUrl ?? null,
    isOwner: employee.isOwner,
    membershipRole: employee.membershipRole,
    role: {
      id: role.id,
      name: role.name,
      label: role.label,
    },
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      plan: organization.plan,
      status: organization.status,
      seatLimit: organization.seatLimit,
      trialEndsAt: organization.trialEndsAt?.toISOString() ?? null,
      memberCount,
    },
  };

  return (
    <CurrentUserProvider user={userData}>
      <TimerProvider>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden" style={{ background: "var(--dash-bg)", fontFamily: "var(--font-be-vietnam, 'Be Vietnam Pro'), system-ui, sans-serif" }}>
            <ActivityTracker />
            <NavigationProgress />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Topbar />
              <TrialBanner />
              <main className="flex-1 overflow-y-auto p-3 sm:p-5 scrollbar-thin" style={{ background: "var(--dash-bg)", color: "var(--dash-text)" }}>{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </TimerProvider>
    </CurrentUserProvider>
  );
}
