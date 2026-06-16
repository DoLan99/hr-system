"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TASK_TYPE_COLORS, approvalStatusLabel } from "@/lib/time-logs";
import { useLocale } from "@/lib/i18n/context";
import { TimeLogFormModal } from "./time-log-form-modal";
import { ApproveLogModal } from "./approve-log-modal";

type Task = {
  id: number;
  code: string;
  title: string;
  taskType: string;
  estimatedTime: number | null;
  actualTimeTotal: number;
  requiresVideo: boolean;
  status: string;
  assignedTo: { id: number; fullName: string };
};

type TimeLogItem = {
  id: number;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  creditedMinutes: number | null;
  approvalStatus: "AUTO_APPROVED" | "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  videoLink: string | null;
  rating: number | null;
  rejectionReason: string | null;
  employee: { id: number; fullName: string; avatarUrl: string | null };
  task: {
    id: number;
    code: string;
    title: string;
    taskType: string;
    billable: boolean;
    customer: { id: number; customerName: string | null; businessName: string | null } | null;
  };
  approvedBy: { id: number; fullName: string } | null;
};

type Kpis = {
  todayHours: string;
  tasksTrackedToday: number;
  activeMembersToday: number;
  avgPerDay: number;
};

type Props = {
  initialItems: TimeLogItem[];
  tasks: Task[];
  initialDate: string;
  initialTaskId: number | null;
  currentUserId: number;
  isManager: boolean;
  kpis: Kpis;
};

function fmtMin(min: number | null) {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m === 0 ? `${h}h` : `${h}h ${m}ph`) : `${m}ph`;
}

function fmtTime(dt: string | null | undefined): string {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toTimeString().slice(0, 5);
  } catch { return "—"; }
}

function viDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dow = days[d.getDay()];
  const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (diff === 0) return `Hôm nay, ${label}`;
  if (diff === 1) return `Hôm qua, ${label}`;
  return `${dow}, ${label}`;
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

export function TimeLogsClient({
  initialItems, tasks, initialDate, initialTaskId,
  currentUserId, isManager, kpis,
}: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(initialDate);
  const [range, setRange] = useState<"week" | "last7" | "month">("week");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectedTaskId, setPreselectedTaskId] = useState<number | null>(initialTaskId);
  const [approving, setApproving] = useState<TimeLogItem | null>(null);

  async function refresh() {
    const res = await fetch(`/api/time-logs?date=${date}`).then(r => r.json());
    setItems(res.data ?? []);
  }

  async function deleteLog(id: number) {
    if (!confirm(t("timeLogs.deleteLog"))) return;
    await fetch(`/api/time-logs/${id}`, { method: "DELETE" });
    refresh();
  }

  // Unique members from items
  const members = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach(l => map.set(l.employee.id, l.employee.fullName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(l => {
      if (memberFilter !== "ALL" && String(l.employee.id) !== memberFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.task.code.toLowerCase().includes(q) &&
            !l.task.title.toLowerCase().includes(q) &&
            !l.employee.fullName.toLowerCase().includes(q) &&
            !(l.note ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, memberFilter, search]);

  // Group by date
  const groups = useMemo(() => {
    const map: Record<string, TimeLogItem[]> = {};
    filtered.forEach(l => {
      const d = new Date(l.date).toISOString().slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const totalFiltered = filtered.reduce((s, l) => s + l.durationMinutes, 0);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <>
      <style>{`
        .tl-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:22px}
        .range-seg{display:inline-flex;background:var(--elev);border:1px solid var(--border);border-radius:9px;padding:3px;gap:2px}
        .range-seg button{height:30px;padding:0 14px;border-radius:7px;font-family:inherit;font-size:.82rem;font-weight:600;color:var(--text-3);background:none;border:none;cursor:pointer;transition:background .15s,color .15s}
        .range-seg button.on{background:var(--accent-soft);color:var(--accent-ink)}
        .mf-chip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.8rem;font-weight:500;color:var(--text-2);cursor:pointer;font-family:inherit;transition:border-color .15s,background .15s,color .15s}
        .mf-chip:hover{border-color:var(--border-2);color:var(--text)}
        .mf-chip.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink);font-weight:600}
        .mf-av{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.58rem;font-weight:700;flex-shrink:0}
        .tl-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;background:var(--elev);border:1px solid var(--border);border-radius:9px;color:var(--text-3);min-width:180px}
        .tl-search svg{width:14px;height:14px;flex-shrink:0}
        .tl-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.82rem;color:var(--text);width:100%}
        .tl-search input::placeholder{color:var(--text-3)}
        .tl-groups{display:flex;flex-direction:column;gap:16px}
        .tl-group-head{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r) var(--r) 0 0;cursor:pointer;user-select:none;transition:background .15s}
        .tl-group-head:hover{background:var(--elev-2,var(--elev))}
        .tl-group.collapsed .tl-group-head{border-radius:var(--r)}
        .tl-date-badge{font-weight:700;font-size:.88rem;color:var(--text)}
        .tl-day-label{font-size:.74rem;color:var(--text-3);font-family:var(--font-mono)}
        .tl-day-total{margin-left:auto;font-family:var(--font-mono);font-size:.84rem;font-weight:700;color:var(--accent-ink)}
        .tl-day-cnt{font-size:.72rem;color:var(--text-3);margin-right:2px}
        .tl-chev{width:20px;height:20px;display:grid;place-items:center;color:var(--text-3);transition:transform .2s;flex-shrink:0}
        .tl-chev svg{width:15px;height:15px}
        .tl-group.collapsed .tl-chev{transform:rotate(-90deg)}
        .tl-group.collapsed .tl-table-wrap{display:none}
        .tl-table-wrap{border:1px solid var(--border);border-top:none;border-radius:0 0 var(--r) var(--r);overflow-x:auto}
        .tl-table{width:100%;border-collapse:collapse;min-width:680px}
        .tl-table th{text-align:left;padding:9px 14px;font-family:var(--font-mono);font-size:.66rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);font-weight:600;background:var(--content);border-bottom:1px solid var(--border);white-space:nowrap}
        .tl-table td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
        .tl-table tbody tr:last-child td{border-bottom:none}
        .tl-table tbody tr:hover{background:var(--content)}
        .tl-task-id{font-family:var(--font-mono);font-size:.72rem;color:var(--accent-ink);display:block}
        .tl-task-name{font-size:.86rem;font-weight:500;color:var(--text);display:block;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tl-time{font-family:var(--font-mono);font-size:.82rem;color:var(--text-2);white-space:nowrap}
        .tl-dur{font-family:var(--font-mono);font-size:.84rem;font-weight:700;color:var(--text);white-space:nowrap}
        .tl-note-cell{font-size:.82rem;color:var(--text-3);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tl-actions{display:flex;gap:4px;opacity:0;transition:opacity .15s}
        .tl-table tbody tr:hover .tl-actions{opacity:1}
        .tl-act-btn{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:1px solid transparent;cursor:pointer;font-family:inherit;flex-shrink:0;background:none;transition:background .15s,color .15s,border-color .15s}
        .tl-act-btn:hover{background:var(--elev-2,var(--content));color:var(--text);border-color:var(--border)}
        .tl-act-btn.del:hover{color:var(--danger);border-color:rgba(255,107,107,0.3);background:var(--danger-soft)}
        .tl-act-btn svg{width:14px;height:14px}
        .tl-summary{display:flex;align-items:center;justify-content:flex-end;gap:20px;padding:12px 16px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r);margin-top:8px}
        .tl-summary .sl{font-size:.8rem;color:var(--text-3)}
        .tl-summary .sv{font-family:var(--font-mono);font-size:.88rem;font-weight:700;color:var(--text)}
        .tl-empty{text-align:center;padding:56px 20px;color:var(--text-3)}
        .tl-empty svg{width:48px;height:48px;margin:0 auto 16px;opacity:.3}
        .tl-empty p{font-size:.95rem;font-weight:500;color:var(--text-2)}
        .tl-empty span{font-size:.83rem;margin-top:6px;display:block}
      `}</style>

      {/* Page head */}
      <div className="page-head" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:"16px", flexWrap:"wrap", marginBottom:"22px" }}>
        <div>
          <h1>Time Logs</h1>
          <p>Tổng <b>{fmtMin(filtered.reduce((s, l) => s + l.durationMinutes, 0))}</b> · {filtered.length} log đang hiển thị</p>
        </div>
        <button className="abtn primary" onClick={() => { setPreselectedTaskId(null); setCreateOpen(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
          Log Time
        </button>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          {
            ico: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/></>,
            lab: "Giờ hôm nay", val: `${kpis.todayHours}h`, chg: "▲ timer đang chạy", cls: "up",
          },
          {
            ico: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
            lab: "Tasks đang track", val: kpis.tasksTrackedToday, chg: "hôm nay", cls: "flat",
          },
          {
            ico: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/></>,
            lab: "Thành viên active", val: kpis.activeMembersToday, chg: "hôm nay", cls: "flat",
          },
          {
            ico: <><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></>,
            lab: "TB giờ / ngày", val: fmtMin(kpis.avgPerDay), chg: "tuần này", cls: "flat",
          },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt">
              <span className="ki">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.ico}</svg>
              </span>
              {k.lab}
            </div>
            <div className="kv">{k.val}</div>
            <div className={`kc ${k.cls}`}>{k.chg}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tl-bar">
        <div className="range-seg">
          {[
            { k: "week", l: "Tuần này" },
            { k: "last7", l: "7 ngày qua" },
            { k: "month", l: `Tháng ${new Date().getMonth() + 1}` },
          ].map(r => (
            <button key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k as any)}>
              {r.l}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
          <button className={`mf-chip${memberFilter === "ALL" ? " on" : ""}`} onClick={() => setMemberFilter("ALL")}>
            Tất cả
          </button>
          {members.map(m => (
            <button key={m.id} className={`mf-chip${memberFilter === String(m.id) ? " on" : ""}`}
              onClick={() => setMemberFilter(String(m.id))}>
              <span className="mf-av">{initials(m.name)}</span>
              {m.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        <div className="tl-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
          <input type="text" placeholder="Lọc nhanh task, thành viên…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Groups */}
      <div className="tl-groups">
        {groups.length === 0 ? (
          <div className="tl-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/>
            </svg>
            <p>Không có time log nào</p>
            <span>Thay đổi bộ lọc hoặc bấm &quot;Log Time&quot; để thêm mới.</span>
          </div>
        ) : (
          groups.map(([dateKey, grpItems]) => {
            const isToday = dateKey === todayStr;
            const dayMins = grpItems.reduce((s, l) => s + l.durationMinutes, 0);
            const isCollapsed = collapsed[dateKey];

            return (
              <div key={dateKey} className={`tl-group${isCollapsed ? " collapsed" : ""}`}>
                <div className="tl-group-head" onClick={() => setCollapsed(prev => ({ ...prev, [dateKey]: !prev[dateKey] }))}>
                  <span className="tl-date-badge">{dateKey.split("-").reverse().slice(0, 2).join("/")}</span>
                  <span className="tl-day-label">{viDateLabel(dateKey)}</span>
                  {isToday && (
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:".66rem", fontWeight:700, padding:"2px 8px", borderRadius:99, background:"var(--ok-soft)", color:"var(--ok)", marginLeft:4 }}>
                      LIVE ▶
                    </span>
                  )}
                  <span className="tl-day-cnt" style={{ marginLeft:"auto" }}>{grpItems.length} mục ·</span>
                  <span className="tl-day-total">{fmtMin(dayMins)}</span>
                  <span className="tl-chev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </div>
                <div className="tl-table-wrap">
                  <table className="tl-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Thành viên</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        <th>Thời gian</th>
                        <th>Ghi chú</th>
                        <th style={{ width:70 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {grpItems.map(l => (
                        <tr key={l.id}>
                          <td>
                            <span className="tl-task-id">{l.task.code}</span>
                            <span className="tl-task-name" title={l.task.title}>{l.task.title}</span>
                          </td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                              <span style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#8b7bff,#4f7aff)", display:"grid", placeItems:"center", color:"#fff", fontSize:".66rem", fontWeight:700, flexShrink:0 }}>
                                {initials(l.employee.fullName)}
                              </span>
                              <span style={{ fontSize:".84rem", color:"var(--text-2)" }}>{l.employee.fullName}</span>
                            </div>
                          </td>
                          <td className="tl-time">{fmtTime(l.startTime)}</td>
                          <td className="tl-time">{fmtTime(l.endTime)}</td>
                          <td><span className="tl-dur">{fmtMin(l.durationMinutes)}</span></td>
                          <td className="tl-note-cell" title={l.note ?? ""}>{l.note ?? <span style={{ color:"var(--border-2)" }}>—</span>}</td>
                          <td>
                            <div className="tl-actions">
                              {isManager && l.approvalStatus === "PENDING" && (
                                <button className="tl-act-btn" onClick={() => setApproving(l)} title="Duyệt">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12l5 5L20 6"/></svg>
                                </button>
                              )}
                              {(l.employee.id === currentUserId || isManager) && (
                                <button className="tl-act-btn del" onClick={() => deleteLog(l.id)} title="Xóa">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="tl-summary">
          <span className="sl">Tổng logs hiển thị:</span>
          <span className="sv">{filtered.length} log</span>
          <span className="sl">Tổng thời gian:</span>
          <span className="sv">{fmtMin(totalFiltered)}</span>
        </div>
      )}

      <TimeLogFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tasks={tasks}
        preselectedTaskId={preselectedTaskId}
        defaultDate={date}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <ApproveLogModal
        log={approving}
        onClose={() => setApproving(null)}
        onDone={() => {
          setApproving(null);
          refresh();
        }}
      />
    </>
  );
}
