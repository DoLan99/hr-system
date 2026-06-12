import { prisma } from "@/lib/prisma";
import type { WorkflowApprover, WorkflowTargetType } from "@prisma/client";

/**
 * Khởi động một workflow instance từ template phù hợp với targetType.
 * Gọi từ bất kỳ route nào khi tạo Leave/Document/... cần duyệt.
 * Trả về instance ID nếu có template, null nếu org chưa cấu hình workflow.
 */
export async function triggerWorkflow({
  orgId,
  targetType,
  targetId,
  initiatorId,
}: {
  orgId: string;
  targetType: WorkflowTargetType;
  targetId: string;
  initiatorId: number;
}): Promise<string | null> {
  const template = await prisma.workflowTemplate.findFirst({
    where: { organizationId: orgId, targetType, isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  if (!template || template.steps.length === 0) return null;

  const firstStep = template.steps[0];

  const instance = await prisma.workflowInstance.create({
    data: {
      templateId: template.id,
      organizationId: orgId,
      targetType,
      targetId,
      initiatorId,
      currentStep: firstStep.stepOrder,
      approvals: {
        create: template.steps.map((step) => ({
          stepId: step.id,
          stepOrder: step.stepOrder,
          dueAt: step.slaHours
            ? new Date(Date.now() + step.slaHours * 3600 * 1000)
            : null,
        })),
      },
    },
  });

  return instance.id;
}

/**
 * Lấy approver thực tế của bước hiện tại dựa theo approverType.
 * Trả về employeeId cần được gán vào WorkflowApproval.approverId.
 */
export async function resolveApprover(
  step: { approverType: WorkflowApprover; approverRef: string | null },
  initiatorId: number,
  orgId: string,
): Promise<number | null> {
  switch (step.approverType) {
    case "SPECIFIC_EMPLOYEE":
      return step.approverRef ? Number(step.approverRef) : null;

    case "ROLE": {
      if (!step.approverRef) return null;
      const emp = await prisma.employee.findFirst({
        where: { organizationId: orgId, roleId: Number(step.approverRef), status: "ACTIVE" },
        select: { id: true },
        orderBy: { id: "asc" },
      });
      return emp?.id ?? null;
    }

    case "DIRECT_MANAGER":
    case "DEPARTMENT_HEAD": {
      const initiator = await prisma.employee.findUnique({
        where: { id: initiatorId },
        select: { dept: { select: { headId: true } } },
      });
      return initiator?.dept?.headId ?? null;
    }

    default:
      return null;
  }
}

/**
 * Xử lý action approve/reject trên instance hiện tại.
 * Tự động chuyển bước kế tiếp hoặc đóng instance.
 */
export async function processApprovalAction({
  instanceId,
  actorId,
  action,
  comment,
}: {
  instanceId: string;
  actorId: number;
  action: "APPROVED" | "REJECTED";
  comment?: string;
}): Promise<{ status: "ADVANCED" | "COMPLETED" | "REJECTED" }> {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: {
      template: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      approvals: { orderBy: { stepOrder: "asc" } },
    },
  });

  if (!instance) throw new Error("Instance không tồn tại");
  if (instance.status !== "RUNNING") throw new Error("Instance đã kết thúc");

  const currentApproval = instance.approvals.find(
    (a) => a.stepOrder === instance.currentStep && !a.action,
  );
  if (!currentApproval) throw new Error("Không tìm thấy approval bước hiện tại");

  // Ghi action
  await prisma.workflowApproval.update({
    where: { id: currentApproval.id },
    data: { action, approverId: actorId, comment, actedAt: new Date() },
  });

  if (action === "REJECTED") {
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: "REJECTED", completedAt: new Date() },
    });
    return { status: "REJECTED" };
  }

  // Tìm bước kế tiếp
  const steps = instance.template.steps;
  const nextStep = steps.find((s) => s.stepOrder > instance.currentStep);

  if (!nextStep) {
    // Đã qua hết tất cả bước
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: "APPROVED", completedAt: new Date() },
    });
    return { status: "COMPLETED" };
  }

  // Chuyển sang bước tiếp
  await prisma.workflowInstance.update({
    where: { id: instanceId },
    data: { currentStep: nextStep.stepOrder },
  });

  return { status: "ADVANCED" };
}
