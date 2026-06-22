import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

// GET /api/workflows/pending — inbox: các yêu cầu cần tôi duyệt
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  // Tìm tất cả approval chưa có action, trong instance đang RUNNING
  // mà actor là approver hoặc actor là manager của org
  const approvals = await prisma.workflowApproval.findMany({
    where: {
      action: null,
      instance: {
        organizationId: auth.orgId,
        status: "RUNNING",
      },
      ...(isManager ? {} : { approverId: auth.actorId }),
    },
    include: {
      instance: {
        select: {
          id: true,
          status: true,
          currentStep: true,
          startedAt: true,
          organizationId: true,
          template: { select: { name: true, targetType: true } },
          initiator: { select: { id: true, fullName: true, department: true } },
        },
      },
      step: { select: { name: true, stepOrder: true, slaHours: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  // Chỉ lấy bước hiện tại của mỗi instance
  const filtered = approvals.filter(
    (a) => a.stepOrder === a.instance.currentStep,
  );

  return NextResponse.json({ data: filtered });
});
