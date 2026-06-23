import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { SystemLoginForm } from "./_form";

export default async function SystemLoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getAdminSession();
  if (session) redirect(searchParams.next ?? "/system/upgrade-requests");
  return <SystemLoginForm />;
}
