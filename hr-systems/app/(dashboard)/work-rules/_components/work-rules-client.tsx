"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { useToast } from "@/lib/hooks/use-toast";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface RuleConfig {
  workDays?: number[];
  startTime?: string; endTime?: string; breakStart?: string; breakEnd?: string;
  minHours?: number; minHoursWeek?: number; breakPaid?: boolean;
  checkinOpen?: string; checkinClose?: string; checkoutOpen?: string;
  graceIn?: number; graceOut?: number; calcMethod?: string;
  autoCheckout?: boolean; autoCheckoutTime?: string;
  penaltyLate?: boolean; lateThreshold?: number; lateDeduct?: number;
  otEnabled?: boolean; otStart?: number; otMax?: number;
  otTier1?: number; otTier2?: number; otWeekend?: number; otHoliday?: number;
  leaveCarryover?: boolean; leaveAutoSick?: boolean;
  customHolidays?: Array<{ date: string; name: string; type: string }>;
}

interface Rule { id: number; ruleNo: number; title: string; description: string; effectiveDate?: string | null; updatedAt: string; config?: RuleConfig | null; }
interface Props { initialRules: Rule[] }

const DAYS = ["T2","T3","T4","T5","T6","T7","CN"];

const NATIONAL_HOLIDAYS = [
  { date: "2026-01-01", name: "Tết Dương lịch",           type: "national" },
  { date: "2026-01-29", name: "Mùng 1 Tết",               type: "national" },
  { date: "2026-01-30", name: "Mùng 2 Tết",               type: "national" },
  { date: "2026-01-31", name: "Mùng 3 Tết",               type: "national" },
  { date: "2026-04-18", name: "Giỗ Tổ Hùng Vương",        type: "national" },
  { date: "2026-04-30", name: "Ngày Giải phóng miền Nam",  type: "national" },
  { date: "2026-05-01", name: "Quốc tế Lao động",          type: "national" },
  { date: "2026-09-02", name: "Quốc khánh",               type: "national" },
];

const LEAVE_TYPES_DEFAULT = [
  { id: "LT1", name: "Phép năm",           color: "#3B5BDB", days: 12,  paid: true },
  { id: "LT2", name: "Nghỉ ốm",            color: "#dc2626", days: 5,   paid: true },
  { id: "LT3", name: "Nghỉ cưới",          color: "#be185d", days: 3,   paid: true },
  { id: "LT4", name: "Nghỉ tang",          color: "#64748b", days: 3,   paid: true },
  { id: "LT5", name: "Nghỉ không lương",   color: "#94a3b8", days: 999, paid: false },
  { id: "LT6", name: "Nghỉ thai sản (nữ)", color: "#0891b2", days: 180, paid: true },
];

export function WorkRulesClient({ initialRules }: Props) {
  const user = useCurrentUser();
  const { toast } = useToast();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [activeRuleId, setActiveRuleId] = useState<number | null>(initialRules[0]?.id ?? null);
  const activeRule = rules.find(r => r.id === activeRuleId);

  const [activeTab, setActiveTab] = useState<"schedule"|"attendance"|"overtime"|"leave"|"holidays">("schedule");
  const [configSaving, setConfigSaving] = useState(false);

  // Schedule
  const [workDays, setWorkDays] = useState([0,1,2,3,4]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [minHours, setMinHours] = useState(8);
  const [minHoursWeek, setMinHoursWeek] = useState(40);
  const [breakPaid, setBreakPaid] = useState(false);

  // Attendance
  const [checkinOpen, setCheckinOpen] = useState("07:30");
  const [checkinClose, setCheckinClose] = useState("09:30");
  const [checkoutOpen, setCheckoutOpen] = useState("16:30");
  const [graceIn, setGraceIn] = useState(15);
  const [graceOut, setGraceOut] = useState(15);
  const [calcMethod, setCalcMethod] = useState("fixed");
  const [autoCheckout, setAutoCheckout] = useState(true);
  const [autoCheckoutTime, setAutoCheckoutTime] = useState("21:00");
  const [penaltyLate, setPenaltyLate] = useState(true);
  const [lateThreshold, setLateThreshold] = useState(15);
  const [lateDeduct, setLateDeduct] = useState(30);

  // Overtime
  const [otEnabled, setOtEnabled] = useState(true);
  const [otStart, setOtStart] = useState(8);
  const [otMax, setOtMax] = useState(4);
  const [otTier1, setOtTier1] = useState(1.5);
  const [otTier2, setOtTier2] = useState(2.0);
  const [otWeekend, setOtWeekend] = useState(2.0);
  const [otHoliday, setOtHoliday] = useState(3.0);

  // Leave
  const [leaveCarryover, setLeaveCarryover] = useState(true);
  const [leaveAutoSick, setLeaveAutoSick] = useState(false);

  // Holidays
  const [customHolidays, setCustomHolidays] = useState<Array<{date:string;name:string;type:string}>>([]);

  const loadConfig = useCallback((cfg: RuleConfig | null | undefined) => {
    const c = cfg ?? {};
    setWorkDays(c.workDays ?? [0,1,2,3,4]);
    setStartTime(c.startTime ?? "08:00");
    setEndTime(c.endTime ?? "17:00");
    setBreakStart(c.breakStart ?? "12:00");
    setBreakEnd(c.breakEnd ?? "13:00");
    setMinHours(c.minHours ?? 8);
    setMinHoursWeek(c.minHoursWeek ?? 40);
    setBreakPaid(c.breakPaid ?? false);
    setCheckinOpen(c.checkinOpen ?? "07:30");
    setCheckinClose(c.checkinClose ?? "09:30");
    setCheckoutOpen(c.checkoutOpen ?? "16:30");
    setGraceIn(c.graceIn ?? 15);
    setGraceOut(c.graceOut ?? 15);
    setCalcMethod(c.calcMethod ?? "fixed");
    setAutoCheckout(c.autoCheckout ?? true);
    setAutoCheckoutTime(c.autoCheckoutTime ?? "21:00");
    setPenaltyLate(c.penaltyLate ?? true);
    setLateThreshold(c.lateThreshold ?? 15);
    setLateDeduct(c.lateDeduct ?? 30);
    setOtEnabled(c.otEnabled ?? true);
    setOtStart(c.otStart ?? 8);
    setOtMax(c.otMax ?? 4);
    setOtTier1(c.otTier1 ?? 1.5);
    setOtTier2(c.otTier2 ?? 2.0);
    setOtWeekend(c.otWeekend ?? 2.0);
    setOtHoliday(c.otHoliday ?? 3.0);
    setLeaveCarryover(c.leaveCarryover ?? true);
    setLeaveAutoSick(c.leaveAutoSick ?? false);
    setCustomHolidays(c.customHolidays ?? []);
  }, []);

  useEffect(() => {
    const rule = rules.find(r => r.id === activeRuleId);
    loadConfig(rule?.config);
  }, [activeRuleId, rules, loadConfig]);
  const [holDate, setHolDate] = useState("");
  const [holName, setHolName] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [form, setForm] = useState({ ruleNo: "", title: "", description: "", effectiveDate: "" });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditRule(null);
    setForm({ ruleNo: String(rules.length + 1), title: "", description: "", effectiveDate: "" });
    setShowModal(true);
  }
  function openEdit(r: Rule) {
    setEditRule(r);
    setForm({ ruleNo: String(r.ruleNo), title: r.title, description: r.description, effectiveDate: r.effectiveDate?.slice(0,10) ?? "" });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = { ruleNo: Number(form.ruleNo), title: form.title, description: form.description, effectiveDate: form.effectiveDate || undefined };
      const url = editRule ? `/api/work-rules/${editRule.id}` : "/api/work-rules";
      const res = await fetch(url, { method: editRule ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) {
        const r: Rule = json.data;
        setRules(prev => {
          const idx = prev.findIndex(x => x.id === r.id);
          const next = idx >= 0 ? prev.map((x, i) => i === idx ? r : x) : [r, ...prev];
          return next.sort((a, b) => a.ruleNo - b.ruleNo);
        });
        setActiveRuleId(r.id);
        setShowModal(false);
        toast({ title: editRule ? "Đã cập nhật quy định" : "Đã tạo quy định mới", variant: "success" });
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa quy định này?")) return;
    await fetch(`/api/work-rules/${id}`, { method: "DELETE" });
    const remaining = rules.filter(r => r.id !== id);
    setRules(remaining);
    setActiveRuleId(remaining[0]?.id ?? null);
    toast({ title: "Đã xóa quy định" });
  }

  const allHolidays = [...NATIONAL_HOLIDAYS, ...customHolidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wr-layout{display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start}
        @media(max-width:900px){.wr-layout{grid-template-columns:1fr}}

        .pol-list{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;position:sticky;top:84px}
        .pol-head{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-bottom:1px solid var(--border)}
        .pol-head h3{font-size:.86rem;font-weight:700;color:var(--text)}
        .pol-item{display:flex;align-items:center;gap:11px;padding:12px 15px;cursor:pointer;transition:background .12s;border-bottom:1px solid var(--border);position:relative}
        .pol-item:last-child{border-bottom:none}
        .pol-item:hover{background:var(--content)}
        .pol-item.active{background:var(--accent-soft)}
        .pol-item.active::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent);border-radius:0 3px 3px 0}
        .pol-ico{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
        .pol-name{font-weight:600;font-size:.86rem;color:var(--text)}
        .pol-sub{font-size:.72rem;color:var(--text-3);margin-top:1px}
        .pol-badge{margin-left:auto;font-family:var(--font-mono);font-size:.66rem;color:var(--accent-ink);background:var(--accent-soft);border:1px solid var(--accent-soft);border-radius:99px;padding:2px 7px;white-space:nowrap;flex-shrink:0}

        .wr-panel{display:flex;flex-direction:column;gap:16px;padding-bottom:74px}
        .wr-tabs{display:flex;gap:4px;flex-wrap:wrap;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:10px}
        .wr-tab{font-size:.83rem;font-weight:500;padding:7px 16px;border-radius:9px;color:var(--text-2);transition:all .15s;cursor:pointer;border:none;background:none;font-family:inherit}
        .wr-tab:hover{background:var(--content);color:var(--text)}
        .wr-tab.on{background:var(--accent);color:#fff;font-weight:600}

        .ws{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
        .ws-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}
        .ws-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--text)}
        .ws-body{padding:18px}

        .sched-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:640px){.sched-grid{grid-template-columns:1fr}}
        .sf{display:flex;flex-direction:column;gap:5px}
        .sf label{font-size:.8rem;font-weight:600;color:var(--text-2)}
        .sf input[type=text],.sf input[type=time],.sf input[type=number],.sf select,.sf textarea{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;font-family:inherit;font-size:.9rem;color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
        .sf input:focus,.sf select:focus,.sf textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .hint{font-size:.74rem;color:var(--text-3);margin-top:3px}

        .day-pick{display:flex;gap:6px;flex-wrap:wrap}
        .dp{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:.8rem;font-weight:700;cursor:pointer;border:1.5px solid var(--border-2);color:var(--text-2);transition:all .15s;user-select:none}
        .dp:hover{border-color:var(--accent);color:var(--accent-ink)}
        .dp.on{background:var(--accent);border-color:var(--accent);color:#fff}
        .dp.off{background:var(--content);color:var(--text-3)}

        .ts-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed var(--border);flex-wrap:wrap}
        .ts-row:last-child{border-bottom:none}
        .ts-label{font-size:.84rem;font-weight:600;min-width:160px;color:var(--text)}
        .ts-sub{font-size:.76rem;color:var(--text-3);margin-top:2px}
        .ts-inputs{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap}
        .ts-inputs input[type=time]{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:8px 11px;font-family:var(--font-mono);font-size:.88rem;color:var(--text);outline:none;width:120px}
        .ts-inputs input[type=time]:focus{border-color:var(--accent)}
        .ts-sep,.ts-unit{font-size:.8rem;color:var(--text-3)}
        .ts-inputs input[type=number]{width:72px;background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:8px 10px;font-family:var(--font-mono);font-size:.88rem;color:var(--text);outline:none}

        .tog-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)}
        .tog-row:last-child{border-bottom:none}
        .tog-info .tl{font-size:.87rem;font-weight:600;color:var(--text)}
        .tog-info .ts{font-size:.76rem;color:var(--text-3);margin-top:2px}
        .wr-toggle{position:relative;width:40px;height:22px;flex-shrink:0;display:inline-block;cursor:pointer}
        .wr-toggle input{opacity:0;width:0;height:0;position:absolute}
        .wr-toggle .tk{position:absolute;inset:0;border-radius:99px;background:var(--border-2);cursor:pointer;transition:background .2s}
        .wr-toggle .th{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none}
        .wr-toggle input:checked~.tk{background:var(--accent)}
        .wr-toggle input:checked~.th{transform:translateX(18px)}

        .ot-tiers{display:flex;flex-direction:column;gap:8px}
        .ot-tier{display:flex;align-items:center;gap:12px;background:var(--content);border:1px solid var(--border);border-radius:10px;padding:10px 14px}
        .ot-tier .olab{font-size:.82rem;font-weight:600;flex:1;color:var(--text)}
        .ot-tier .oval{font-family:var(--font-mono);font-size:.88rem;color:var(--accent-ink);font-weight:700}
        .ot-tier input[type=number]{width:68px;background:var(--elev);border:1.5px solid var(--border-2);border-radius:7px;padding:5px 8px;font-family:var(--font-mono);font-size:.86rem;color:var(--text);outline:none;text-align:center}

        .holiday-list{display:flex;flex-direction:column;gap:8px}
        .hol-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--content);border:1px solid var(--border);border-radius:10px}
        .hol-date{font-family:var(--font-mono);font-size:.78rem;color:var(--text-3);width:90px;flex-shrink:0}
        .hol-name{font-size:.86rem;font-weight:500;flex:1;color:var(--text)}
        .hol-type-badge{font-family:var(--font-mono);font-size:.66rem;padding:2px 8px;border-radius:99px}
        .hol-type-badge.national{background:var(--ok-soft);color:var(--ok)}
        .hol-type-badge.custom{background:var(--accent-soft);color:var(--accent-ink)}
        .hol-del{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;margin-left:auto}
        .hol-del:hover{background:rgba(239,68,68,.12);color:#ef4444}

        .leave-type-list{display:flex;flex-direction:column;gap:8px}
        .lt-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--content);border:1px solid var(--border);border-radius:10px}
        .lt-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        .lt-name{font-weight:600;font-size:.87rem;flex:1;color:var(--text)}
        .lt-days{display:flex;align-items:center;gap:8px}
        .lt-days input[type=number]{width:56px;background:var(--elev);border:1.5px solid var(--border-2);border-radius:7px;padding:5px 8px;font-family:var(--font-mono);font-size:.86rem;color:var(--text);text-align:center;outline:none}
        .lt-paid{font-size:.72rem;font-family:var(--font-mono);padding:2px 8px;border-radius:99px}
        .lt-paid.yes{background:var(--ok-soft);color:var(--ok)}
        .lt-paid.no{background:var(--border);color:var(--text-3)}

        .info-strip{display:flex;align-items:center;gap:10px;background:var(--accent-soft);border:1px solid var(--accent-soft);border-radius:10px;padding:11px 14px;font-size:.83rem;color:var(--accent-ink)}

        .save-bar{position:fixed;bottom:0;left:var(--side-w,264px);right:0;background:color-mix(in srgb,var(--content) 90%,transparent);backdrop-filter:blur(14px);border-top:1px solid var(--border);padding:12px 28px;display:flex;align-items:center;justify-content:flex-end;gap:10px;z-index:40}

        .wm-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s}
        .wm-modal.open{opacity:1;pointer-events:auto}
        .wm-scrim{position:absolute;inset:0;background:rgba(0,0,0,.55)}
        .wm-card{position:relative;z-index:1;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:440px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
        .wm-card h2{font-size:1rem;font-weight:800;color:var(--text)}
        .wm-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer}
        .wm-close:hover{background:var(--content)}
        .wm-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:8px;border-top:1px solid var(--border)}
      ` }} />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>Work Rules</h1>
          <p style={{ fontSize: ".86rem", color: "var(--text-3)", marginTop: 4 }}>Cấu hình lịch làm việc, quy tắc chấm công, tăng ca, nghỉ phép và ngày lễ.</p>
        </div>
        {isManager && (
          <button className="abtn primary" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={14} height={14}><path d="M12 5v14M5 12h14"/></svg>
            Tạo quy định
          </button>
        )}
      </div>

      <div className="wr-layout">
        {/* ── LEFT: rule list ── */}
        <div className="pol-list">
          <div className="pol-head">
            <h3>Quy định ({rules.length})</h3>
          </div>
          {rules.length === 0 ? (
            <div style={{ padding: "24px 16px", fontSize: ".82rem", color: "var(--text-3)", textAlign: "center" }}>Chưa có quy định nào</div>
          ) : (
            rules.map(r => (
              <div key={r.id} className={`pol-item${r.id === activeRuleId ? " active" : ""}`} onClick={() => setActiveRuleId(r.id)}>
                <span className="pol-ico" style={{ background: "rgba(59,91,219,.12)", color: "#3B5BDB" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
                    <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pol-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                  <div className="pol-sub">{r.effectiveDate ? `Từ ${r.effectiveDate.slice(0,10)}` : "Không giới hạn"}</div>
                </div>
                <span className="pol-badge">#{r.ruleNo}</span>
              </div>
            ))
          )}
        </div>

        {/* ── RIGHT: editor ── */}
        <div className="wr-panel">
          {activeRule ? (
            <>
              {/* Rule header */}
              <div className="ws" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(59,91,219,.12)", color: "#3B5BDB", display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 800, fontSize: "1.1rem", fontFamily: "var(--font-mono)" }}>
                    {activeRule.ruleNo}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.01em" }}>{activeRule.title}</div>
                    {activeRule.effectiveDate && (
                      <div style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: 4 }}>Hiệu lực từ {activeRule.effectiveDate.slice(0,10)}</div>
                    )}
                  </div>
                  {isManager && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem" }} onClick={() => openEdit(activeRule)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                        Sửa
                      </button>
                      <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", color: "#ef4444", borderColor: "rgba(239,68,68,.3)" }} onClick={() => handleDelete(activeRule.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M3 6h18M19 6l-1 14H6L5 6"/></svg>
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
                {activeRule.description && (
                  <p style={{ marginTop: 14, fontSize: ".87rem", color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{activeRule.description}</p>
                )}
              </div>

              {/* Tabs */}
              <div className="wr-tabs">
                {(["schedule","attendance","overtime","leave","holidays"] as const).map((tab, i) => (
                  <button key={tab} className={`wr-tab${activeTab === tab ? " on" : ""}`} onClick={() => setActiveTab(tab)}>
                    {["Lịch làm việc","Chấm công","Tăng ca","Nghỉ phép","Ngày lễ"][i]}
                  </button>
                ))}
              </div>

              {/* SCHEDULE */}
              {activeTab === "schedule" && (
                <>
                  <div className="ws">
                    <div className="ws-head">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        Ngày làm việc trong tuần
                      </h3>
                    </div>
                    <div className="ws-body">
                      <div className="sf" style={{ marginBottom: 18 }}>
                        <label>Chọn các ngày làm việc</label>
                        <div className="day-pick">
                          {DAYS.map((d, i) => (
                            <div key={i} className={`dp${workDays.includes(i) ? " on" : " off"}`}
                              onClick={() => setWorkDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())}>
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="sched-grid">
                        <div className="sf"><label>Giờ bắt đầu</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}/><div className="hint">Giờ vào làm chính thức</div></div>
                        <div className="sf"><label>Giờ kết thúc</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}/><div className="hint">Giờ tan làm chính thức</div></div>
                        <div className="sf"><label>Nghỉ trưa từ</label><input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)}/></div>
                        <div className="sf"><label>Nghỉ trưa đến</label><input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)}/></div>
                        <div className="sf"><label>Số giờ tối thiểu / ngày</label><input type="number" value={minHours} min={1} max={12} onChange={e => setMinHours(+e.target.value)}/><div className="hint">Bên dưới ngưỡng → thiếu giờ</div></div>
                        <div className="sf"><label>Số giờ tối thiểu / tuần</label><input type="number" value={minHoursWeek} min={1} max={60} onChange={e => setMinHoursWeek(+e.target.value)}/></div>
                      </div>
                      <div className="tog-row" style={{ marginTop: 8 }}>
                        <div className="tog-info"><div className="tl">Nghỉ trưa tính lương</div><div className="ts">Nếu bật, giờ nghỉ trưa vẫn được tính vào giờ làm việc</div></div>
                        <label className="wr-toggle"><input type="checkbox" checked={breakPaid} onChange={e => setBreakPaid(e.target.checked)}/><span className="tk"/><span className="th"/></label>
                      </div>
                    </div>
                  </div>
                  <div className="info-strip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                    Thay đổi lịch làm việc sẽ ảnh hưởng đến tính toán tăng ca và lương từ kỳ tiếp theo.
                  </div>
                </>
              )}

              {/* ATTENDANCE */}
              {activeTab === "attendance" && (
                <>
                  <div className="ws">
                    <div className="ws-head">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                        Khung giờ check-in / check-out
                      </h3>
                    </div>
                    <div className="ws-body">
                      <div className="ts-row"><div><div className="ts-label">Cửa sổ check-in</div><div className="ts-sub">Khoảng thời gian nhân viên có thể check-in</div></div><div className="ts-inputs"><input type="time" value={checkinOpen} onChange={e => setCheckinOpen(e.target.value)}/><span className="ts-sep">→</span><input type="time" value={checkinClose} onChange={e => setCheckinClose(e.target.value)}/></div></div>
                      <div className="ts-row"><div><div className="ts-label">Cửa sổ check-out</div><div className="ts-sub">Check-out chỉ được phép sau giờ này</div></div><div className="ts-inputs"><input type="time" value={checkoutOpen} onChange={e => setCheckoutOpen(e.target.value)}/><span className="ts-unit">trở đi</span></div></div>
                      <div className="ts-row"><div><div className="ts-label">Ân hạn đến muộn</div><div className="ts-sub">Số phút cho phép đến muộn không bị phạt</div></div><div className="ts-inputs"><input type="number" value={graceIn} min={0} max={120} onChange={e => setGraceIn(+e.target.value)}/><span className="ts-unit">phút</span></div></div>
                      <div className="ts-row"><div><div className="ts-label">Ân hạn về sớm</div><div className="ts-sub">Số phút cho phép về sớm không bị phạt</div></div><div className="ts-inputs"><input type="number" value={graceOut} min={0} max={120} onChange={e => setGraceOut(+e.target.value)}/><span className="ts-unit">phút</span></div></div>
                    </div>
                  </div>
                  <div className="ws">
                    <div className="ws-head">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/></svg>
                        Phương thức & Hình phạt
                      </h3>
                    </div>
                    <div className="ws-body">
                      <div className="sf" style={{ marginBottom: 16 }}>
                        <label>Phương thức tính giờ làm</label>
                        <select value={calcMethod} onChange={e => setCalcMethod(e.target.value)}>
                          <option value="fixed">Fixed schedule — theo khung giờ</option>
                          <option value="timelog">Time log — cộng dồn time log</option>
                        </select>
                        <div className="hint">Fixed: trừ thẳng giờ không có mặt. Time log: cộng tổng thời gian bấm giờ.</div>
                      </div>
                      <div className="tog-row"><div className="tog-info"><div className="tl">Tự động check-out cuối ngày</div><div className="ts">Hệ thống tự đóng session nếu nhân viên quên check-out</div></div><label className="wr-toggle"><input type="checkbox" checked={autoCheckout} onChange={e => setAutoCheckout(e.target.checked)}/><span className="tk"/><span className="th"/></label></div>
                      {autoCheckout && <div className="sf" style={{ margin: "10px 0" }}><label>Giờ auto check-out</label><input type="time" value={autoCheckoutTime} onChange={e => setAutoCheckoutTime(e.target.value)}/></div>}
                      <div className="tog-row"><div className="tog-info"><div className="tl">Phạt đến muộn</div><div className="ts">Trừ giờ công khi vào muộn quá ngưỡng</div></div><label className="wr-toggle"><input type="checkbox" checked={penaltyLate} onChange={e => setPenaltyLate(e.target.checked)}/><span className="tk"/><span className="th"/></label></div>
                      {penaltyLate && <div className="ts-row" style={{ marginTop: 4 }}><div><div className="ts-label">Ngưỡng đến muộn</div></div><div className="ts-inputs"><input type="number" value={lateThreshold} min={1} max={60} onChange={e => setLateThreshold(+e.target.value)}/><span className="ts-unit">phút → trừ</span><input type="number" value={lateDeduct} min={1} onChange={e => setLateDeduct(+e.target.value)}/><span className="ts-unit">phút công</span></div></div>}
                    </div>
                  </div>
                </>
              )}

              {/* OVERTIME */}
              {activeTab === "overtime" && (
                <div className="ws">
                  <div className="ws-head">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><path d="M13 2L3 14h7l-1 8 10-12h-7z" strokeLinejoin="round"/></svg>
                      Cấu hình tăng ca
                    </h3>
                  </div>
                  <div className="ws-body">
                    <div className="tog-row"><div className="tog-info"><div className="tl">Bật tính tăng ca</div><div className="ts">Tự động tính lương tăng ca dựa trên giờ làm vượt định mức</div></div><label className="wr-toggle"><input type="checkbox" checked={otEnabled} onChange={e => setOtEnabled(e.target.checked)}/><span className="tk"/><span className="th"/></label></div>
                    <div className="sched-grid" style={{ marginTop: 14 }}>
                      <div className="sf"><label>Tăng ca bắt đầu sau</label><input type="number" value={otStart} min={1} max={16} onChange={e => setOtStart(+e.target.value)}/><div className="hint">Số giờ làm tối thiểu trước khi tính OT</div></div>
                      <div className="sf"><label>OT tối đa / ngày</label><input type="number" value={otMax} min={0} max={12} onChange={e => setOtMax(+e.target.value)}/><div className="hint">Giới hạn giờ tăng ca được ghi nhận</div></div>
                    </div>
                    <div className="sf" style={{ margin: "16px 0 10px" }}><label>Hệ số lương tăng ca</label></div>
                    <div className="ot-tiers">
                      <div className="ot-tier"><div className="olab"><b>Bậc 1:</b> {otStart}h đầu tiên ngoài giờ (ngày thường)<div style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 2 }}>Áp dụng cho OT đầu</div></div><span className="oval">×</span><input type="number" value={otTier1} min={1} max={5} step={0.25} onChange={e => setOtTier1(+e.target.value)}/></div>
                      <div className="ot-tier"><div className="olab"><b>Bậc 2:</b> Tiếp theo (ngày thường)<div style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 2 }}>Sau bậc 1</div></div><span className="oval">×</span><input type="number" value={otTier2} min={1} max={5} step={0.25} onChange={e => setOtTier2(+e.target.value)}/></div>
                      <div className="ot-tier"><div className="olab"><b>Cuối tuần (T7, CN)</b><div style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 2 }}>Mọi giờ làm ngày nghỉ tuần</div></div><span className="oval">×</span><input type="number" value={otWeekend} min={1} max={5} step={0.25} onChange={e => setOtWeekend(+e.target.value)}/></div>
                      <div className="ot-tier"><div className="olab"><b>Ngày lễ / Tết</b><div style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 2 }}>Mọi giờ làm ngày lễ quốc gia</div></div><span className="oval">×</span><input type="number" value={otHoliday} min={1} max={5} step={0.25} onChange={e => setOtHoliday(+e.target.value)}/></div>
                    </div>
                  </div>
                </div>
              )}

              {/* LEAVE */}
              {activeTab === "leave" && (
                <>
                  <div className="ws">
                    <div className="ws-head">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        Loại nghỉ phép & số ngày
                      </h3>
                    </div>
                    <div className="ws-body">
                      <div className="leave-type-list">
                        {LEAVE_TYPES_DEFAULT.map(lt => (
                          <div key={lt.id} className="lt-row">
                            <span className="lt-dot" style={{ background: lt.color }}/>
                            <div className="lt-name">{lt.name}</div>
                            <div className="lt-days">
                              <input type="number" defaultValue={lt.days >= 999 ? "" : lt.days} placeholder="∞" min={0}/>
                              {lt.days < 999 && <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>ngày/năm</span>}
                            </div>
                            <span className={`lt-paid ${lt.paid ? "yes" : "no"}`}>{lt.paid ? "Có lương" : "Không lương"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ws">
                    <div className="ws-head"><h3>Cài đặt phép chung</h3></div>
                    <div className="ws-body">
                      <div className="tog-row"><div className="tog-info"><div className="tl">Phép năm cộng dồn sang năm sau</div><div className="ts">Số ngày phép dư được chuyển sang năm sau (tối đa 5 ngày)</div></div><label className="wr-toggle"><input type="checkbox" checked={leaveCarryover} onChange={e => setLeaveCarryover(e.target.checked)}/><span className="tk"/><span className="th"/></label></div>
                      <div className="tog-row"><div className="tog-info"><div className="tl">Tự động duyệt nghỉ ốm</div><div className="ts">Đơn nghỉ ốm dưới 2 ngày không cần manager duyệt</div></div><label className="wr-toggle"><input type="checkbox" checked={leaveAutoSick} onChange={e => setLeaveAutoSick(e.target.checked)}/><span className="tk"/><span className="th"/></label></div>
                    </div>
                  </div>
                </>
              )}

              {/* HOLIDAYS */}
              {activeTab === "holidays" && (
                <div className="ws">
                  <div className="ws-head">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><path d="M12 2l3.1 6.3 7.3 1.1-5.2 5.1 1.2 7.1-6.4-3.4-6.4 3.4 1.2-7.1-5.2-5.1 7.3-1.1z"/></svg>
                      Ngày lễ & Ngày nghỉ bù 2026
                    </h3>
                    <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>{NATIONAL_HOLIDAYS.length} quốc lễ · {customHolidays.length} nội bộ</span>
                  </div>
                  <div className="ws-body">
                    <div className="holiday-list">
                      {allHolidays.map((h, i) => (
                        <div key={i} className="hol-row">
                          <span className="hol-date">{h.date}</span>
                          <span className="hol-name">{h.name}</span>
                          <span className={`hol-type-badge ${h.type}`}>{h.type === "national" ? "Quốc lễ" : "Nội bộ"}</span>
                          {h.type === "custom" && (
                            <button className="hol-del" onClick={() => setCustomHolidays(prev => prev.filter(x => x !== h))}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M3 6h18M19 6l-1 14H6L5 6"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
                      <input type="date" value={holDate} onChange={e => setHolDate(e.target.value)}
                        style={{ background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "8px 11px", fontFamily: "var(--font-mono)", fontSize: ".86rem", color: "var(--text)", outline: "none", minWidth: 140 }}/>
                      <input type="text" placeholder="Tên ngày nghỉ nội bộ…" value={holName} onChange={e => setHolName(e.target.value)}
                        style={{ flex: 1, background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "8px 11px", fontFamily: "inherit", fontSize: ".86rem", color: "var(--text)", outline: "none" }}/>
                      <button className="abtn primary" style={{ height: 36, fontSize: ".82rem" }}
                        onClick={() => { if (!holDate || !holName.trim()) return; setCustomHolidays(prev => [...prev, { date: holDate, name: holName.trim(), type: "custom" }]); setHolDate(""); setHolName(""); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}><path d="M12 5v14M5 12h14"/></svg>
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} width={48} height={48} style={{ display: "block", margin: "0 auto 12px", opacity: .3 }}>
                <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <p style={{ fontSize: ".9rem" }}>Chọn quy định để xem chi tiết</p>
              {isManager && <p style={{ fontSize: ".82rem", marginTop: 6 }}>hoặc <button onClick={openCreate} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-ink)", fontFamily: "inherit", fontSize: ".82rem" }}>tạo quy định mới</button></p>}
            </div>
          )}
        </div>
      </div>

      {/* Save bar */}
      {activeRule && (
        <div className="save-bar">
          <span style={{ fontSize: ".82rem", color: "var(--text-3)" }}>Thay đổi sẽ áp dụng cho tất cả nhân viên trong quy định này</span>
          <button className="abtn ghost" style={{ height: 36 }} onClick={() => loadConfig(activeRule.config)}>Đặt lại</button>
          <button className="abtn primary" style={{ height: 36 }} disabled={configSaving} onClick={async () => {
            const config: RuleConfig = {
              workDays, startTime, endTime, breakStart, breakEnd, minHours, minHoursWeek, breakPaid,
              checkinOpen, checkinClose, checkoutOpen, graceIn, graceOut, calcMethod,
              autoCheckout, autoCheckoutTime, penaltyLate, lateThreshold, lateDeduct,
              otEnabled, otStart, otMax, otTier1, otTier2, otWeekend, otHoliday,
              leaveCarryover, leaveAutoSick, customHolidays,
            };
            setConfigSaving(true);
            try {
              const res = await fetch(`/api/work-rules/${activeRule.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config }),
              });
              const text = await res.text();
              const json = text ? JSON.parse(text) : {};
              if (res.ok) {
                setRules(prev => prev.map(r => r.id === activeRule.id ? { ...r, config: json.data?.config } : r));
                toast({ title: "Đã lưu cấu hình ✓", variant: "success" });
              } else {
                const msg = json?.error ? JSON.stringify(json.error) : `HTTP ${res.status}`;
                toast({ title: `Lưu thất bại: ${msg}`, variant: "error" });
              }
            } finally { setConfigSaving(false); }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={14} height={14}><path d="M5 12l5 5L20 6"/></svg>
            {configSaving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {/* Modal */}
      <div className={`wm-modal${showModal ? " open" : ""}`}>
        <div className="wm-scrim" onClick={() => setShowModal(false)}/>
        <div className="wm-card">
          <h2>{editRule ? "Sửa quy định" : "Tạo quy định mới"}</h2>
          <button className="wm-close" onClick={() => setShowModal(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={15} height={15}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div className="sched-grid">
            <div className="sf"><label>Số thứ tự *</label><input type="number" min={1} value={form.ruleNo} onChange={e => setForm(p => ({ ...p, ruleNo: e.target.value }))}/></div>
            <div className="sf"><label>Ngày hiệu lực</label><input type="date" value={form.effectiveDate} onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))}/></div>
          </div>
          <div className="sf"><label>Tiêu đề quy định *</label><input type="text" placeholder="VD: Quy định giờ làm việc…" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/></div>
          <div className="sf"><label>Nội dung</label><textarea rows={4} placeholder="Mô tả chi tiết quy định…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/></div>
          <div className="wm-foot">
            <button className="abtn ghost" onClick={() => setShowModal(false)}>Hủy</button>
            <button className="abtn primary" disabled={saving || !form.title.trim()} onClick={handleSave}>
              {saving ? "Đang lưu…" : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}><path d="M5 12l5 5L20 6"/></svg>{editRule ? "Cập nhật" : "Tạo"}</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
