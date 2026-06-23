import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { BANK_INFO, daysUntilTrialEnds, type PlanConfig, type PlanId } from "@/lib/pricing";
import { BillingClient } from "./_components/billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { organization, role, employee } = await requireAuth();

  const [memberCount, upgradeRequests, dbPlans] = await Promise.all([
    prisma.employee.count({
      where: { organizationId: organization.id, status: { not: "INACTIVE" } },
    }),
    prisma.upgradeRequest.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Build plans record từ DB, fallback về hardcode nếu DB trống
  const plans: Record<PlanId, PlanConfig> = {} as Record<PlanId, PlanConfig>;
  for (const p of dbPlans) {
    plans[p.id as PlanId] = {
      id: p.id as PlanId,
      name: p.name,
      priceVnd: p.priceVnd,
      priceLabel: p.priceVnd === 0 ? "Miễn phí" : `${p.priceVnd.toLocaleString("vi-VN")}đ / tháng`,
      seatLimit: p.seatLimit,
      features: p.features as string[],
    };
  }

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
      plans={plans}
      bankInfo={{
        bankName: BANK_INFO.bankName,
        accountNumber: BANK_INFO.accountNumber,
        accountHolder: BANK_INFO.accountHolder,
        branch: BANK_INFO.branch,
      }}
      trialDaysLeft={daysUntilTrialEnds(organization.trialEndsAt)}
      userEmail={employee.emailCompany}
      userName={employee.fullName}
      upgradeRequests={JSON.parse(JSON.stringify(upgradeRequests))}
    />
  );
}
