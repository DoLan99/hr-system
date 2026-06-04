import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { SystemLabelsClient } from "./_components/system-labels-client";
import { DEFAULT_LABELS, CATEGORY_META, type LabelCategory } from "@/lib/system-labels";

export const metadata = { title: "System Labels — HR System" };

export default async function SystemLabelsPage() {
  const { organization, role } = await requireAuth();
  if (!ADMIN_ROLES.includes(role.name)) redirect("/dashboard");

  const dbRows = await prisma.systemLabel.findMany({
    where: { organizationId: organization.id },
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
