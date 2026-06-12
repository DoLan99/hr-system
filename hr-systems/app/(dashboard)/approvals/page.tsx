import { requireAuth } from "@/lib/current-user";
import { ApprovalInbox } from "./_components/approval-inbox";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAuth();

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Phê duyệt</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Các yêu cầu đang chờ bạn xem xét
        </p>
      </div>
      <ApprovalInbox />
    </div>
  );
}
