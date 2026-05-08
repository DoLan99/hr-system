import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkRulesClient } from "./_components/work-rules-client";

export const dynamic = "force-dynamic";

export default async function WorkRulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rules = await prisma.workRule.findMany({ orderBy: { ruleNo: "asc" } });

  return <WorkRulesClient initialRules={JSON.parse(JSON.stringify(rules))} />;
}
