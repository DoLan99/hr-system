import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RolesClient } from "./_components/roles-client";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const roles = await prisma.role.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { id: "asc" },
  });

  return <RolesClient initialRoles={JSON.parse(JSON.stringify(roles))} />;
}
