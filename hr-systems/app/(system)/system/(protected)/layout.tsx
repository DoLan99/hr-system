import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { SystemShell } from "./_shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/system/login");
  return <SystemShell user={session}>{children}</SystemShell>;
}
