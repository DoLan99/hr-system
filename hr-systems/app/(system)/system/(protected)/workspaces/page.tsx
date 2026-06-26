import { rawPrisma } from "@/lib/prisma";
import { WorkspacesClient } from "./_components/workspaces-client";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage({ searchParams }: { searchParams: { status?: string } }) {
  const orgs = await rawPrisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employees: true, tasks: true, timeLogs: true } } },
  });

  const serialized = orgs.map(o => ({
    id: o.id, name: o.name, slug: o.slug, plan: o.plan, status: o.status,
    seatLimit: o.seatLimit, trialEndsAt: o.trialEndsAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(), _count: o._count,
  }));

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Workspaces</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Tất cả {orgs.length} workspace — xem chi tiết và quản lý từng org</p>
      </div>
      <WorkspacesClient orgs={serialized} initialStatus={searchParams.status} />
    </div>
  );
}
