import { requireAuth } from "@/lib/current-user";
import { ApprovalInbox } from "./_components/approval-inbox";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAuth();

  return <ApprovalInbox />;
}
