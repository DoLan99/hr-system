import { notFound } from "next/navigation";
import { rawPrisma } from "@/lib/prisma";
import { PLANS, daysUntilTrialEnds } from "@/lib/pricing";
import { WorkspaceDetailClient } from "./_components/workspace-detail-client";

export const dynamic = "force-dynamic";

export default async function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const [org, employees, tasks, timeLogs, docs] = await Promise.all([
    rawPrisma.organization.findUnique({
      where: { id: params.id },
      include: { _count: { select: { employees: true, tasks: true, timeLogs: true, customers: true } } },
    }),
    rawPrisma.employee.findMany({
      where: { organizationId: params.id },
      orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
      include: { role: { select: { name: true } } },
    }),
    rawPrisma.task.findMany({
      where: { organizationId: params.id },
      orderBy: { lastUpdate: "desc" },
      take: 50,
      include: { assignedTo: { select: { fullName: true } } },
    }),
    rawPrisma.timeLog.findMany({
      where: { organizationId: params.id },
      orderBy: { date: "desc" },
      take: 50,
      include: {
        employee: { select: { fullName: true } },
        task: { select: { code: true, title: true } },
      },
    }),
    rawPrisma.systemDocument.findMany({
      where: { organizationId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { uploadedBy: { select: { fullName: true } } },
    }),
  ]);

  if (!org) notFound();

  return (
    <WorkspaceDetailClient
      org={{
        id: org.id, slug: org.slug, name: org.name,
        plan: org.plan as "FREE" | "STARTER" | "TEAM",
        status: org.status as "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL",
        seatLimit: org.seatLimit,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
        createdAt: org.createdAt.toISOString(),
        counts: org._count,
      }}
      employees={employees.map(e => ({
        id: e.id, fullName: e.fullName, emailCompany: e.emailCompany,
        department: e.department, isOwner: e.isOwner,
        createdAt: e.createdAt.toISOString(), role: e.role,
      }))}
      tasks={tasks.map(t => ({
        id: t.id, code: t.code, title: t.title, status: t.status,
        priority: t.priority, createdAt: t.lastUpdate.toISOString(),
        assignee: t.assignedTo,
      }))}
      timeLogs={timeLogs.map(l => ({
        id: l.id, date: l.date.toISOString(), durationMinutes: l.durationMinutes,
        note: l.note, task: l.task, employee: l.employee,
      }))}
      docs={docs.map(d => ({
        id: d.id, name: d.name, mimeType: d.mimeType, size: d.size,
        createdAt: d.createdAt.toISOString(), category: d.category,
        uploadedBy: d.uploadedBy,
      }))}
      plans={PLANS}
      trialDaysLeft={daysUntilTrialEnds(org.trialEndsAt)}
    />
  );
}
