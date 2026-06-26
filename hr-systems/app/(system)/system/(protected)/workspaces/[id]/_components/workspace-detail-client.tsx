"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type PlanConfig, type PlanId } from "@/lib/pricing";

/* ─── types ─── */
type OrgStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";

type OrgData = {
  id: string; slug: string; name: string; plan: PlanId; status: OrgStatus;
  seatLimit: number; trialEndsAt: string | null; createdAt: string;
  counts: { employees: number; tasks: number; timeLogs: number; customers: number };
};

type Employee = {
  id: number; fullName: string; emailCompany: string; department: string | null;
  isOwner: boolean; createdAt: string;
  role: { name: string } | null;
};

type Task = {
  id: number; code: string; title: string; status: string; priority: string;
  createdAt: string;
  assignee: { fullName: string } | null;
};

type TimeLog = {
  id: number; date: string; durationMinutes: number; note: string | null;
  task: { code: string; title: string } | null;
  employee: { fullName: string };
};

type Doc = {
  id: string; name: string; mimeType: string | null; size: number | null; createdAt: string;
  category: string | null;
  uploadedBy: { fullName: string };
};

interface Props {
  org: OrgData;
  employees: Employee[];
  tasks: Task[];
  timeLogs: TimeLog[];
  docs: Doc[];
  plans: Record<PlanId, PlanConfig>;
  trialDaysLeft: number;
}

/* ─── constants ─── */
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
const TASK_STATUS_COLOR: Record<string, string> = {
  BACKLOG: "#94a3b8", TODO: "#60a5fa", IN_PROGRESS: "#f59e0b", IN_REVIEW: "#a78bfa",
  DONE: "#22c55e", CANCELLED: "#ef4444",
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#94a3b8", NORMAL: "#60a5fa", HIGH: "#f59e0b", URGENT: "#ef4444",
};

function initials(name: string) { return name.split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase(); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("vi-VN"); }
function fmtDur(min: number) {
  if (min < 60) return `${min}p`;
  const h = Math.floor(min / 60); const m = min % 60;
  return m ? `${h}h${m}p` : `${h}h`;
}
function fmtSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const TABS = [
  { id: "manage",    label: "Quản lý" },
  { id: "employees", label: "Nhân viên" },
  { id: "tasks",     label: "Tasks" },
  { id: "timelogs",  label: "Time Logs" },
  { id: "docs",      label: "Tài liệu" },
];

export function WorkspaceDetailClient({ org, employees, tasks, timeLogs, docs, plans, trialDaysLeft }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState("manage");

  const [planDraft, setPlanDraft] = useState<PlanId>(org.plan);
  const [statusDraft, setStatusDraft] = useState<OrgStatus>(org.status);
  const [seatDraft, setSeatDraft] = useState(org.seatLimit);
  const [extendDays, setExtendDays] = useState(30);

  const sc = STATUS_COLOR[org.status] ?? STATUS_COLOR.CANCELLED;
  const pc = PLAN_COLOR[org.plan] ?? PLAN_COLOR.FREE;

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  }
  function action(body: Record<string, unknown>, msg: string) {
    startTransition(async () => {
      const res = await fetch(`/api/super-admin/orgs/${org.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(typeof json.error === "string" ? json.error : "Có lỗi xảy ra", false); return; }
      showToast(msg); router.refresh();
    });
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: toast.ok ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)", border: `1px solid ${toast.ok ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`, color: toast.ok ? "#22c55e" : "#ef4444", borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.ok ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14}><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <Link href="/system/workspaces" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><polyline points="15 18 9 12 15 6"/></svg>
          Workspaces
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: pc.bg, border: `1px solid ${pc.color}44`, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 800, color: pc.color, flexShrink: 0 }}>
            {initials(org.name)}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>{org.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <code style={{ fontSize: 12, color: "var(--text-3)" }}>{org.slug}.jobihome.vn</code>
              <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, borderRadius: 6, padding: "1px 8px" }}>{org.plan}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: "1px 8px" }}>{org.status}</span>
              {org.status === "TRIAL" && trialDaysLeft <= 3 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.1)", borderRadius: 6, padding: "1px 8px" }}>⚠ {trialDaysLeft}d left</span>
              )}
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>Tạo {fmtDate(org.createdAt)}</div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Nhân viên", value: `${org.counts.employees}/${org.seatLimit}`, warn: org.counts.employees >= org.seatLimit },
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 16px", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? "var(--accent)" : "var(--text-3)",
            background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === t.id ? "var(--accent)" : "transparent"}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s", marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Quản lý ── */}
      {activeTab === "manage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Quick activate */}
          <Card title="⚡ Kích hoạt thanh toán">
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>Khách chuyển khoản xong → chọn gói → kích hoạt. Tự set ACTIVE + 30 ngày + seatLimit.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Sel value={planDraft} onChange={v => setPlanDraft(v as PlanId)}>
                {Object.values(plans).map(p => <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>)}
              </Sel>
              <Btn onClick={() => action({ plan: planDraft, status: "ACTIVE", extendTrialDays: 30, seatLimit: plans[planDraft].seatLimit }, `Đã kích hoạt ${planDraft} + 30 ngày`)} disabled={isPending} accent>
                {isPending ? "…" : "✓ Kích hoạt + 30 ngày"}
              </Btn>
            </div>
          </Card>

          {/* Plan */}
          <Card title="Gói dịch vụ">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Sel value={planDraft} onChange={v => setPlanDraft(v as PlanId)}>
                {Object.values(plans).map(p => <option key={p.id} value={p.id}>{p.name} — {p.priceLabel}</option>)}
              </Sel>
              <Btn onClick={() => action({ plan: planDraft, seatLimit: plans[planDraft].seatLimit }, `Đã đổi sang ${planDraft}`)} disabled={isPending}>Đổi gói</Btn>
            </div>
            <Sub>Hiện tại: <b>{org.plan}</b> · Seat limit: {org.seatLimit}</Sub>
          </Card>

          {/* Status */}
          <Card title="Trạng thái">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {(["ACTIVE","TRIAL","SUSPENDED","CANCELLED"] as const).map(s => {
                const c = STATUS_COLOR[s];
                return (
                  <button key={s} onClick={() => setStatusDraft(s)} style={{ border: `1.5px solid ${statusDraft === s ? c.color : "var(--border)"}`, background: statusDraft === s ? c.bg : "transparent", color: statusDraft === s ? c.color : "var(--text-3)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>{s}</button>
                );
              })}
              <Btn onClick={() => action({ status: statusDraft }, `Đã đổi thành ${statusDraft}`)} disabled={isPending || statusDraft === org.status}>Lưu</Btn>
            </div>
            <Sub>Hiện tại: <b style={{ color: sc.color }}>{org.status}</b></Sub>
          </Card>

          {/* Trial */}
          <Card title="Gia hạn Trial / Subscription">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {[7,14,30,60,90].map(d => (
                <button key={d} onClick={() => setExtendDays(d)} style={{ border: `1.5px solid ${extendDays === d ? "var(--accent)" : "var(--border)"}`, background: extendDays === d ? "var(--accent-soft)" : "transparent", color: extendDays === d ? "var(--accent)" : "var(--text-3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>{d}d</button>
              ))}
              <input type="number" min={1} max={365} value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} style={{ width: 72, ...inputSt }} />
              <Btn onClick={() => action({ extendTrialDays: extendDays }, `Đã gia hạn thêm ${extendDays} ngày`)} disabled={isPending || !extendDays}>Gia hạn</Btn>
            </div>
            <Sub>{org.trialEndsAt ? <>Hết hạn: <b>{fmtDate(org.trialEndsAt)}</b> {org.status === "TRIAL" && <>(còn <b style={{ color: trialDaysLeft <= 3 ? "#ef4444" : "#f59e0b" }}>{trialDaysLeft} ngày</b>)</>}</> : "Chưa có trial"}</Sub>
          </Card>

          {/* Seat limit */}
          <Card title="Seat Limit">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="number" min={1} max={1000} value={seatDraft} onChange={e => setSeatDraft(Number(e.target.value))} style={{ width: 100, ...inputSt }} />
              <Btn onClick={() => action({ seatLimit: seatDraft }, `Đã đổi seat limit = ${seatDraft}`)} disabled={isPending || seatDraft === org.seatLimit}>Lưu</Btn>
            </div>
            <Sub>Hiện tại: <b style={{ color: org.counts.employees >= org.seatLimit ? "#f59e0b" : "var(--text-2)" }}>{org.counts.employees}/{org.seatLimit}</b> seats</Sub>
          </Card>

          {/* Danger */}
          <Card title="Vùng nguy hiểm">
            <div style={{ display: "flex", gap: 10 }}>
              <Btn danger disabled={isPending || org.status === "SUSPENDED"} onClick={() => { if (confirm(`Tạm dừng "${org.name}"?`)) action({ status: "SUSPENDED" }, "Đã tạm dừng workspace"); }}>Tạm dừng</Btn>
              <Btn danger disabled={isPending || org.status === "CANCELLED"} onClick={() => { if (confirm(`Huỷ workspace "${org.name}"? Không thể hoàn tác dễ dàng.`)) action({ status: "CANCELLED" }, "Đã huỷ workspace"); }}>Huỷ workspace</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Nhân viên ── */}
      {activeTab === "employees" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-3)" }}>{employees.length} nhân viên</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--content)" }}>
                {["Nhân viên","Email","Phòng ban","Vai trò","Loại","Ngày tạo"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{initials(e.fullName)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{e.fullName}</div>
                        {e.isOwner && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>OWNER</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{e.emailCompany}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{e.department ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{e.role?.name ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: e.isOwner ? "#f59e0b" : "var(--text-3)", background: e.isOwner ? "rgba(245,158,11,.1)" : "var(--content)", borderRadius: 6, padding: "2px 7px" }}>
                      {e.isOwner ? "Owner" : "Member"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)" }}>{fmtDate(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Tasks ── */}
      {activeTab === "tasks" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-3)" }}>{tasks.length} tasks gần nhất</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--content)" }}>
                {["Mã","Tiêu đề","Trạng thái","Ưu tiên","Người nhận","Ngày tạo"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "var(--accent)" }}>{t.code}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text)", maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TASK_STATUS_COLOR[t.status] ?? "#94a3b8", background: `${TASK_STATUS_COLOR[t.status] ?? "#94a3b8"}18`, borderRadius: 6, padding: "2px 7px" }}>{t.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLOR[t.priority] ?? "#94a3b8" }}>{t.priority}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{t.assignee?.fullName ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)" }}>{fmtDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Time Logs ── */}
      {activeTab === "timelogs" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-3)" }}>{timeLogs.length} time log gần nhất</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--content)" }}>
                {["Nhân viên","Task","Ngày","Thời lượng","Ghi chú"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeLogs.map(l => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>{initials(l.employee.fullName)}</div>
                      <span style={{ color: "var(--text-2)" }}>{l.employee.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    {l.task ? <><span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{l.task.code}</span> <span style={{ color: "var(--text-3)" }}>{l.task.title.slice(0, 30)}{l.task.title.length > 30 ? "…" : ""}</span></> : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{fmtDate(l.date)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 13 }}>{fmtDur(l.durationMinutes)}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)", maxWidth: 200 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.note ?? "—"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Tài liệu ── */}
      {activeTab === "docs" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-3)" }}>{docs.length} tài liệu</div>
          {docs.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Chưa có tài liệu nào</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--content)" }}>
                  {["Tên tài liệu","Danh mục","Loại","Kích thước","Người tạo","Ngày tạo"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>{d.name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{d.category ?? "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-3)" }}>{d.mimeType?.split("/")[1]?.toUpperCase() ?? "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{fmtSize(d.size)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-2)" }}>{d.uploadedBy.fullName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)" }}>{fmtDate(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── shared micro-components ─── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}
function Sub({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>{children}</div>;
}
function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
      {children}
    </select>
  );
}
function Btn({ onClick, disabled, children, accent, danger }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; accent?: boolean; danger?: boolean }) {
  const color = danger ? "#ef4444" : accent ? "var(--accent-ink)" : "var(--accent)";
  const bg = danger ? "rgba(239,68,68,.12)" : accent ? "var(--accent)" : "var(--accent-soft)";
  const border = danger ? "1px solid rgba(239,68,68,.3)" : "none";
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: bg, border, color, borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? .5 : 1, transition: "opacity .15s" }}>{children}</button>
  );
}
const inputSt: React.CSSProperties = { background: "var(--content)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", fontFamily: "inherit" };
