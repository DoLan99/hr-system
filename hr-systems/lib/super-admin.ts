import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function getSuperAdminIds(): string[] {
  const raw = process.env.SUPER_ADMIN_CLERK_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function isSuperAdminClerkId(clerkUserId: string | null | undefined): Promise<boolean> {
  if (!clerkUserId) return false;
  return getSuperAdminIds().includes(clerkUserId);
}

export async function requireSuperAdmin() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const isSA = await isSuperAdminClerkId(user.id);
  if (!isSA) redirect("/dashboard?error=super-admin-only");

  return user;
}

export async function isSuperAdminAuthed(): Promise<boolean> {
  const session = await auth();
  if (!session.userId) return false;
  return isSuperAdminClerkId(session.userId);
}
