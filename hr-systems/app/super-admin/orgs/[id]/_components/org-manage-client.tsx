"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type PlanConfig, type PlanId } from "@/lib/pricing";

type OrgStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";

interface OrgData {
  id: string;
  clerkOrgId: string;
  slug: string;
  name: string;
  plan: PlanId;
  status: OrgStatus;
  seatLimit: number;
  trialEndsAt: string | null;
  createdAt: string;
  counts: { employees: number; tasks: number; customers: number; timeLogs: number };
  owners: { id: number; fullName: string; emailCompany: string; clerkUserId: string }[];
}

interface Props {
  org: OrgData;
  plans: Record<PlanId, PlanConfig>;
  trialDaysLeft: number;
}

export function OrgManageClient({ org, plans, trialDaysLeft }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [planDraft, setPlanDraft] = useState<PlanId>(org.plan);
  const [statusDraft, setStatusDraft] = useState<OrgStatus>(org.status);
  const [seatLimitDraft, setSeatLimitDraft] = useState(org.seatLimit);
  const [trialExtendDays, setTrialExtendDays] = useState(0);

  const action = (body: any, successMessage: string) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/super-admin/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra");
        return;
      }
      alert(successMessage);
      router.refresh();
    });
  };

  const setPlan = () => {
    const newSeatLimit = plans[planDraft].seatLimit;
    action({ plan: planDraft, seatLimit: newSeatLimit }, `Đã đổi plan thành ${planDraft}`);
  };

  const setStatus = () => action({ status: statusDraft }, `Đã đổi status thành ${statusDraft}`);

  const setSeatLimit = () => action({ seatLimit: seatLimitDraft }, `Đã đổi seat limit = ${seatLimitDraft}`);

  const extendTrial = () => action({ extendTrialDays: trialExtendDays }, `Đã gia hạn trial thêm ${trialExtendDays} ngày`);

  const activatePayment = () => action(
    { plan: planDraft, status: "ACTIVE", extendTrialDays: 30, seatLimit: plans[planDraft].seatLimit },
    `Đã kích hoạt ${planDraft} thêm 30 ngày`,
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/super-admin/orgs" className="text-sm text-blue-600 hover:underline">← Back to orgs</Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{org.name}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          <code>{org.slug}.jobihome.vn</code> · created {new Date(org.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>

      {error && (
        <div className="px-4 py-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Employees" value={`${org.counts.employees}/${org.seatLimit}`} />
        <Stat label="Customers" value={org.counts.customers} />
        <Stat label="Tasks" value={org.counts.tasks} />
        <Stat label="Time Logs" value={org.counts.timeLogs} />
      </div>

      {/* Quick actions */}
      <Section title="⚡ Quick action — Khách đã chuyển khoản">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Khi khách hàng chuyển khoản xong → chọn plan → click button. Sẽ tự đặt status=ACTIVE, gia hạn 30 ngày, set seatLimit theo plan.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={planDraft}
            onChange={(e) => setPlanDraft(e.target.value as PlanId)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
          >
            {Object.values(plans).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>
            ))}
          </select>
          <button
            onClick={activatePayment}
            disabled={isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {isPending ? "..." : "✓ Kích hoạt + 30 ngày"}
          </button>
        </div>
      </Section>

      {/* Plan */}
      <Section title="Plan">
        <div className="flex items-center gap-3">
          <select
            value={planDraft}
            onChange={(e) => setPlanDraft(e.target.value as PlanId)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
          >
            {Object.values(plans).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>
            ))}
          </select>
          <button onClick={setPlan} disabled={isPending} className="btn-secondary px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
            Đổi plan (chỉ plan, không reset trial)
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Hiện tại: <strong>{org.plan}</strong> · Seat limit: {org.seatLimit}</p>
      </Section>

      {/* Status */}
      <Section title="Status">
        <div className="flex items-center gap-3">
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value as OrgStatus)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button onClick={setStatus} disabled={isPending} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
            Đổi status
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Hiện tại: <strong>{org.status}</strong></p>
      </Section>

      {/* Trial */}
      <Section title="Gia hạn Trial / Subscription">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={365}
            value={trialExtendDays || ""}
            onChange={(e) => setTrialExtendDays(Number(e.target.value))}
            placeholder="Số ngày"
            className="px-3 py-2 w-32 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
          />
          <button onClick={extendTrial} disabled={isPending || !trialExtendDays} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">
            Gia hạn
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Trial kết thúc: <strong>{org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString("vi-VN") : "không có"}</strong>
          {org.trialEndsAt && ` (còn ${trialDaysLeft} ngày)`}
        </p>
      </Section>

      {/* Seat limit */}
      <Section title="Seat Limit (override)">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={1000}
            value={seatLimitDraft}
            onChange={(e) => setSeatLimitDraft(Number(e.target.value))}
            className="px-3 py-2 w-32 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900"
          />
          <button onClick={setSeatLimit} disabled={isPending} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
            Đổi seat limit
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Hiện tại: {org.counts.employees}/{org.seatLimit} seats</p>
      </Section>

      <Section title="Owners">
        {org.owners.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có owner</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {org.owners.map((o) => (
              <li key={o.id} className="flex items-center gap-2">
                <span className="font-medium">{o.fullName}</span>
                <span className="text-slate-500">·</span>
                <code className="text-xs">{o.emailCompany}</code>
                <span className="text-slate-500">·</span>
                <code className="text-xs text-slate-400">{o.clerkUserId.slice(0, 20)}...</code>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}
