import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { WorkRulesClient } from "./_components/work-rules-client";

export const dynamic = "force-dynamic";

export default async function WorkRulesPage() {
  const { organization } = await requireAuth();

  const rules = await prisma.workRule.findMany({
    where: { organizationId: organization.id },
    orderBy: { ruleNo: "asc" },
  });

  return <WorkRulesClient initialRules={JSON.parse(JSON.stringify(rules))} />;
}
