import { requireAuth } from "@/lib/current-user";
import { ApprovalInbox } from "./_components/approval-inbox";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAuth();

  return (
    <>
      <div className="page-head" style={{ marginBottom: 22 }}>
        <h1>Hộp duyệt</h1>
        <p>Các yêu cầu đang chờ bạn xem xét</p>
      </div>
      <ApprovalInbox />
    </>
  );
}
