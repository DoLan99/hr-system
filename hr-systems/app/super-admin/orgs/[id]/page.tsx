import { notFound } from "next/navigation";
import { rawPrisma } from "@/lib/prisma";
import { PLANS, daysUntilTrialEnds } from "@/lib/pricing";
import { OrgManageClient } from "./_components/org-manage-client";

export const dynamic = "force-dynamic";

export default async function OrgManagePage({ params }: { params: { id: string } }) {
  const org = await rawPrisma.organization.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { employees: true, tasks: true, customers: true, timeLogs: true } },
      employees: {
        where: { isOwner: true },
        select: { id: true, fullName: true, emailCompany: true, clerkUserId: true },
        take: 5,
      },
    },
  });

  if (!org) notFound();

  return (
    <OrgManageClient
      org={{
        id: org.id,
        clerkOrgId: org.clerkOrgId,
        slug: org.slug,
        name: org.name,
        plan: org.plan,
        status: org.status,
        seatLimit: org.seatLimit,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
        createdAt: org.createdAt.toISOString(),
        counts: org._count,
        owners: org.employees,
      }}
      plans={PLANS}
      trialDaysLeft={daysUntilTrialEnds(org.trialEndsAt)}
    />
  );
}
