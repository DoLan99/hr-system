"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type PlanConfig, type PlanId } from "@/lib/pricing";

type OrgStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";

interface OrgData {
  id: string; clerkOrgId: string; slug: string; name: string;
  plan: PlanId; status: OrgStatus; seatLimit: number;
  trialEndsAt: string | null; createdAt: string;
  counts: { employees: number; tasks: number; customers: number; timeLogs: number };
  owners: { id: number; fullName: string; emailCompany: string; clerkUserId: string }[];
}

interface Props {
  org: OrgData;
  plans: Record<PlanId, PlanConfig>;
  trialDaysLeft: number;
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: "rgba(34,197,94,.12)",  color: "#22c55e" },
  TRIAL:     { bg: "rgba(245,158,11,.12)", color: "#f59e0b" },
  SUSPENDED: { bg: "rgba(239,68,68,.12)",  color: "#ef4444" },
  CANCELLED: { bg: "rgba(148,163,184,.12)",color: "#94a3b8" },
};
const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  FREE:    { bg: "rgba(148,163,184,.12)", color: "#94a3b8" },
  STARTER: { bg: "rgba(59,91,219,.12)",   color: "#6582ff" },
  TEAM:    { bg: "rgba(167,139,250,.12)", color: "#a78bfa" },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase();
}

export function OrgManageClient({ org, plans, trialDaysLeft }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [planDraft, setPlanDraft] = useState<PlanId>(org.plan);
  const [statusDraft, setStatusDraft] = useState<OrgStatus>(org.status);
  const [seatLimitDraft, setSeatLimitDraft] = useState(org.seatLimit);
  const [trialExtendDays, setTrialExtendDays] = useState(30);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function action(body: Record<string, unknown>, successMessage: string) {
    startTransition(async () => {
      const res = await fetch(`/api/super-admin/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(typeof json.error === "string" ? json.error : "Có lỗi xảy ra", false); return; }
      showToast(successMessage);
      router.refresh();
    });
  }

  const sc = STATUS_COLOR[org.status] ?? STATUS_COLOR.CANCELLED;
  const pc = PLAN_COLOR[org.plan] ?? PLAN_COLOR.FREE;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: toast.ok ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
          border: `1px solid ${toast.ok ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
          color: toast.ok ? "#22c55e" : "#ef4444",
          borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.ok
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={15} height={15}><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/super-admin/orgs" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}><polyline points="15 18 9 12 15 6"/></svg>
          Workspaces
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: pc.bg, border: `1px solid ${pc.color}44`,
            display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800, color: pc.color, flexShrink: 0,
          }}>
            {initials(org.name)}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>{org.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <code style={{ fontSize: 12, color: "var(--text-3)" }}>{org.slug}.jobihome.vn</code>
              <span style={{ fontSize: 11, fontWeight: 600, color: pc.color, background: pc.bg, borderRadius: 6, padding: "1px 8px" }}>{org.plan}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: "1px 8px" }}>{org.status}</span>
              {org.status === "TRIAL" && trialDaysLeft <= 3 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.1)", borderRadius: 6, padding: "1px 8px" }}>⚠ {trialDaysLeft}d left</span>
              )}
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
            Tạo {new Date(org.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Thành viên", value: `${org.counts.employees}/${org.seatLimit}`, warn: org.counts.employees >= org.seatLimit },
          { label: "Khách hàng", value: org.counts.customers },
          { label: "Tasks", value: org.counts.tasks },
          { label: "Time Logs", value: org.counts.timeLogs },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--elev)", border: `1px solid ${s.warn ? "rgba(245,158,11,.3)" : "var(--border)"}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.warn ? "#f59e0b" : "var(--text)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick activate */}
      <Card title="⚡ Kích hoạt thanh toán">
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>Khách chuyển khoản → chọn gói → kích hoạt. Tự set ACTIVE + gia hạn 30 ngày + seatLimit.</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Select value={planDraft} onChange={e => setPlanDraft(e.target.value as PlanId)}>
            {Object.values(plans).map(p => <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>)}
          </Select>
          <Btn
            color="#22c55e"
            disabled={isPending}
            onClick={() => action({ plan: planDraft, status: "ACTIVE", extendTrialDays: 30, seatLimit: plans[planDraft].seatLimit }, `Đã kích hoạt ${planDraft} + 30 ngày`)}
          >
            {isPending ? "…" : "✓ Kích hoạt + 30 ngày"}
          </Btn>
        </div>
      </Card>

      {/* Plan */}
      <Card title="Gói dịch vụ">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Select value={planDraft} onChange={e => setPlanDraft(e.target.value as PlanId)}>
            {Object.values(plans).map(p => <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>)}
          </Select>
          <Btn disabled={isPending} onClick={() => action({ plan: planDraft, seatLimit: plans[planDraft].seatLimit }, `Đã đổi sang ${planDraft}`)}>
            {isPending ? "…" : "Đổi gói"}
          </Btn>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          Hiện tại: <strong style={{ color: "var(--text-2)" }}>{org.plan}</strong> · Seat limit: {org.seatLimit}
        </div>
      </Card>

      {/* Status */}
      <Card title="Trạng thái">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {(["ACTIVE","TRIAL","SUSPENDED","CANCELLED"] as const).map(s => {
            const c = STATUS_COLOR[s];
            return (
              <button key={s} onClick={() => setStatusDraft(s)} style={{
                border: `1.5px solid ${statusDraft === s ? c.color : "var(--border)"}`,
                background: statusDraft === s ? c.bg : "transparent",
                color: statusDraft === s ? c.color : "var(--text-3)",
                borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}>{s}</button>
            );
          })}
          <Btn disabled={isPending || statusDraft === org.status} onClick={() => action({ status: statusDraft }, `Đã đổi thành ${statusDraft}`)}>
            {isPending ? "…" : "Lưu trạng thái"}
          </Btn>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          Hiện tại: <span style={{ fontWeight: 700, color: sc.color }}>{org.status}</span>
        </div>
      </Card>

      {/* Trial */}
      <Card title="Gia hạn Trial / Subscription">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setTrialExtendDays(d)} style={{
              border: `1.5px solid ${trialExtendDays === d ? "var(--accent)" : "var(--border)"}`,
              background: trialExtendDays === d ? "var(--accent-soft)" : "transparent",
              color: trialExtendDays === d ? "var(--accent)" : "var(--text-3)",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            }}>{d}d</button>
          ))}
          <input
            type="number" min={1} max={365} value={trialExtendDays}
            onChange={e => setTrialExtendDays(Number(e.target.value))}
            style={{ width: 72, ...inputStyle }}
          />
          <Btn disabled={isPending || !trialExtendDays} onClick={() => action({ extendTrialDays: trialExtendDays }, `Đã gia hạn thêm ${trialExtendDays} ngày`)}>
            {isPending ? "…" : "Gia hạn"}
          </Btn>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          {org.trialEndsAt
            ? <>Hết hạn: <strong style={{ color: "var(--text-2)" }}>{new Date(org.trialEndsAt).toLocaleDateString("vi-VN")}</strong> {org.status === "TRIAL" && <>(còn <strong style={{ color: trialDaysLeft <= 3 ? "#ef4444" : "#f59e0b" }}>{trialDaysLeft} ngày</strong>)</>}</>
            : "Chưa có trial"
          }
        </div>
      </Card>

      {/* Seat limit */}
      <Card title="Seat Limit (override)">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="number" min={1} max={1000} value={seatLimitDraft} onChange={e => setSeatLimitDraft(Number(e.target.value))} style={{ width: 100, ...inputStyle }} />
          <Btn disabled={isPending || seatLimitDraft === org.seatLimit} onClick={() => action({ seatLimit: seatLimitDraft }, `Đã đổi seat limit = ${seatLimitDraft}`)}>
            {isPending ? "…" : "Lưu"}
          </Btn>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
          Hiện tại: <strong style={{ color: org.counts.employees >= org.seatLimit ? "#f59e0b" : "var(--text-2)" }}>{org.counts.employees}/{org.seatLimit}</strong> seats
        </div>
      </Card>

      {/* Owners */}
      <Card title="Owners">
        {org.owners.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Chưa có owner</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {org.owners.map(o => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--content)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                  {initials(o.fullName)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{o.fullName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{o.emailCompany}</div>
                </div>
                <code style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)", background: "var(--border)", borderRadius: 5, padding: "2px 6px" }}>
                  {o.clerkUserId.slice(0, 24)}…
                </code>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card title="Vùng nguy hiểm">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn
            color="#ef4444"
            disabled={isPending || org.status === "SUSPENDED"}
            onClick={() => {
              if (confirm(`Tạm dừng workspace "${org.name}"?`))
                action({ status: "SUSPENDED" }, "Đã tạm dừng workspace");
            }}
          >
            Tạm dừng workspace
          </Btn>
          <Btn
            color="#ef4444"
            disabled={isPending || org.status === "CANCELLED"}
            onClick={() => {
              if (confirm(`Huỷ workspace "${org.name}"? Hành động này không thể hoàn tác dễ dàng.`))
                action({ status: "CANCELLED" }, "Đã huỷ workspace");
            }}
          >
            Huỷ workspace
          </Btn>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={onChange} style={{
      background: "var(--content)", border: "1px solid var(--border)", borderRadius: 9,
      padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", cursor: "pointer", fontFamily: "inherit",
    }}>
      {children}
    </select>
  );
}

function Btn({ onClick, disabled, children, color }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; color?: string }) {
  const bg = color ?? "var(--accent)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color ? `${color}18` : "var(--accent-soft)",
      border: `1px solid ${color ? `${color}44` : "transparent"}`,
      color: color ?? "var(--accent)",
      borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? .5 : 1, transition: "opacity .15s",
    }}>
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--content)", border: "1px solid var(--border)", borderRadius: 9,
  padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "inherit",
};
