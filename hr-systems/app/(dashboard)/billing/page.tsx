import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { PLANS, BANK_INFO, formatVnd, daysUntilTrialEnds } from "@/lib/pricing";
import { BillingClient } from "./_components/billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { organization, role, employee } = await requireAuth();

  const memberCount = await prisma.employee.count({
    where: { organizationId: organization.id, status: { not: "INACTIVE" } },
  });

  const isOwnerOrAdmin = employee.isOwner || role.name === "SUPER_ADMIN" || role.name === "ADMIN";

  return (
    <BillingClient
      currentPlan={organization.plan}
      status={organization.status}
      trialEndsAt={organization.trialEndsAt?.toISOString() ?? null}
      seatLimit={organization.seatLimit}
      memberCount={memberCount}
      orgSlug={organization.slug}
      orgName={organization.name}
      isOwnerOrAdmin={isOwnerOrAdmin}
      plans={PLANS}
      bankInfo={{
        bankName: BANK_INFO.bankName,
        accountNumber: BANK_INFO.accountNumber,
        accountHolder: BANK_INFO.accountHolder,
        branch: BANK_INFO.branch,
      }}
      trialDaysLeft={daysUntilTrialEnds(organization.trialEndsAt)}
    />
  );
}
