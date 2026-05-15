import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { SystemLabelsClient } from "./_components/system-labels-client";
import { DEFAULT_LABELS, CATEGORY_META, type LabelCategory } from "@/lib/system-labels";

export const metadata = { title: "System Labels — HR System" };

export default async function SystemLabelsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (!ADMIN_ROLES.includes(role)) redirect("/dashboard");

  const dbRows = await prisma.systemLabel.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const categories = Object.keys(CATEGORY_META) as LabelCategory[];

  const initialData = categories.map((category) => {
    const defaults = DEFAULT_LABELS[category];
    const dbMap = Object.fromEntries(dbRows.filter((r: any) => r.category === category).map((r: any) => [r.key, r]));

    const entries = Object.entries(defaults).map(([key, def], i) => {
      const db = dbMap[key];
      return {
        category,
        key,
        defaultLabel: def.label,
        defaultColor: def.color,
        label: db?.label ?? def.label,
        color: db?.color ?? def.color,
        isActive: db?.isActive ?? true,
        sortOrder: db?.sortOrder ?? i,
        inDb: !!db,
      };
    });

    return { category, meta: CATEGORY_META[category], entries };
  });

  return <SystemLabelsClient initialData={initialData} />;
}
