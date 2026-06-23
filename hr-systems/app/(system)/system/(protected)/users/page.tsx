import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminUsersClient } from "./_components/admin-users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session || session.type !== "SUPER_ADMIN") redirect("/system/upgrade-requests");

  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, fullName: true, email: true, type: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return <AdminUsersClient initialUsers={JSON.parse(JSON.stringify(users))} currentId={session.id} />;
}
