"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CreateCycleModal } from "./create-cycle-modal";

interface Cycle {
  id: number;
  name: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  selfDueDate: string | null;
  managerDueDate: string | null;
  createdBy: { fullName: string };
  statusCounts: { PENDING: number; SELF_DONE: number; COMPLETED: number };
}

interface KpiScore {
  score: number | null;
  confidence: "high" | "medium" | "low";
  sampleSize: number;
  reason?: string;
}
interface KpiSnapshot {
  scoreWorkSpeed:  KpiScore;
  scoreQuality:    KpiScore;
  scoreDeadlines:  KpiScore;
  scoreLearning:   KpiScore;
  scoreInitiative: KpiScore;
  computedAt?: string;
}

interface ReviewListItem {
  id: number;
  status: string;
  cycleId: number;
  employeeId: number;
  selfTotalScore: string | number | null;
  mgrTotalScore: string | number | null;
  selfComment?: string | null;
  mgrComment?: string | null;
  kpiSnapshot?: KpiSnapshot | null;
  finalizedAt: string | null;
  cycle: { id: number; name: string; periodStart: string; periodEnd: string; status: string };
  employee: { id: number; fullName: string; department: string | null };
  mgrReviewer: { id: number; fullName: string } | null;
}

const AV_COLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#b45309"];

const CRITERIA = [
  { id: "speed",    kpiKey: "scoreWorkSpeed",  name: "Tốc độ",     desc: "Tasks hoàn thành / sprint",        color: "#3B5BDB", svg: '<path d="M13 2L3 14h7l-1 8 10-12h-7z" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: "quality",  kpiKey: "scoreQuality",    name: "Chất lượng", desc: "Tỷ lệ pass review lần đầu",        color: "#059669", svg: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { id: "ontime",   kpiKey: "scoreDeadlines",  name: "Đúng hạn",   desc: "% task giao đúng deadline",        color: "#d97706", svg: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>' },
  { id: "learning", kpiKey: "scoreLearning",   name: "Học hỏi",    desc: "Kỹ năng mới, đóng góp kiến thức", color: "#7c3aed", svg: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
  { id: "proactive",kpiKey: "scoreInitiative", name: "Chủ động",   desc: "Tự đề xuất cải tiến, hỗ trợ team",color: "#be185d", svg: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke-linecap="round"/>' },
];

const STATUS_LBL: Record<string, string> = {
  PENDING: "Chưa bắt đầu", SELF_DONE: "Chờ manager review",
  MANAGER_DONE: "Chờ xác nhận", COMPLETED: "Hoàn thành",
};
const STATUS_CLS: Record<string, string> = {
  PENDING: "rs-pending", SELF_DONE: "rs-self_done",
  MANAGER_DONE: "rs-manager_done", COMPLETED: "rs-completed",
};
const CARD_CLS: Record<string, string> = {
  PENDING: "status-pending", SELF_DONE: "status-self_done",
  MANAGER_DONE: "status-manager_done", COMPLETED: "status-completed",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function avColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}
function scoreColor(s: number | null) {
  if (!s) return "var(--text-3)";
  if (s >= 9) return "#22c55e";
  if (s >= 8) return "var(--accent-ink)";
  if (s >= 7) return "var(--warn)";
  return "var(--danger)";
}

const PAGE_CSS = `
.pf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.pf-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:15px 17px;display:flex;align-items:center;gap:13px}
.pf-stat .psi{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.pf-stat .psi svg{width:18px;height:18px}
.pf-stat .psv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
.pf-stat .psl{font-size:.78rem;color:var(--text-3);margin-top:1px}
.pf-stat .psd{font-size:.74rem;font-weight:600;margin-top:2px}
.psd.ok{color:var(--ok)}.psd.warn{color:var(--warn)}.psd.danger{color:var(--danger)}
.pf-layout{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
.pf-main{display:flex;flex-direction:column;gap:16px}
.pf-side{display:flex;flex-direction:column;gap:16px}
.pf-tabs{display:flex;gap:4px;margin-bottom:18px;flex-wrap:wrap}
.pf-tab{font-size:.85rem;font-weight:500;padding:8px 16px;border-radius:9px;color:var(--text-2);cursor:pointer;transition:all .15s;border:1px solid transparent;background:none;font-family:inherit}
.pf-tab:hover{color:var(--text);background:var(--elev);border-color:var(--border)}
.pf-tab.on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600;border-color:var(--accent-soft-2)}
.pp{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.pp-head{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:10px}
.pp-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;margin:0;color:var(--text)}
.pp-head h3 svg{width:15px;height:15px;color:var(--accent-ink)}
.rev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.rev-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 18px 18px 22px;transition:border-color .18s,transform .18s,box-shadow .18s;cursor:pointer;position:relative;overflow:hidden}
.rev-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow)}
.rev-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:99px 0 0 99px}
.rev-card.status-pending::before{background:var(--warn)}
.rev-card.status-self_done::before{background:var(--accent)}
.rev-card.status-manager_done::before{background:var(--ok)}
.rev-card.status-completed::before{background:#22c55e}
.rc-top{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.rc-av{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;font-size:.85rem;font-weight:700;color:#fff;flex-shrink:0}
.rc-name{font-weight:700;font-size:.96rem;color:var(--text)}
.rc-role{font-size:.76rem;color:var(--text-3);margin-top:2px}
.rc-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:3px 9px;border-radius:99px;margin-left:auto;flex-shrink:0}
.rs-pending{background:var(--warn-soft);color:var(--warn)}
.rs-self_done{background:var(--accent-soft);color:var(--accent-ink)}
.rs-manager_done,.rs-completed{background:var(--ok-soft);color:var(--ok)}
.score-bars{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}
.sb-row{display:flex;align-items:center;gap:8px}
.sb-lbl{font-size:.74rem;color:var(--text-3);width:80px;flex-shrink:0}
.sb-track{flex:1;height:6px;border-radius:99px;background:var(--border);overflow:hidden}
.sb-fill{height:100%;border-radius:99px;transition:width .6s}
.sb-val{font-family:var(--font-mono);font-size:.74rem;font-weight:700;color:var(--text);width:30px;text-align:right;flex-shrink:0}
.rc-score{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--border)}
.mini-donut{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.mini-donut .inner{width:38px;height:38px;border-radius:50%;background:var(--elev);display:grid;place-items:center;font-family:var(--font-mono);font-size:.88rem;font-weight:800;color:var(--text)}
.rc-meta{font-size:.78rem;color:var(--text-2);line-height:1.5}
.rc-meta b{color:var(--text)}
.rank-list{display:flex;flex-direction:column;gap:6px}
.rank-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;transition:background .12s;cursor:pointer}
.rank-row:hover{background:var(--content)}
.rank-n{font-family:var(--font-mono);font-size:.72rem;color:var(--text-3);width:18px;text-align:right;flex-shrink:0}
.rank-av{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:.66rem;font-weight:700;color:#fff;flex-shrink:0}
.rank-info{flex:1;min-width:0}
.rank-name{font-weight:600;font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rank-role{font-size:.72rem;color:var(--text-3)}
.rank-score{font-family:var(--font-mono);font-size:.9rem;font-weight:800}
.pf-scrim{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:59;opacity:0;pointer-events:none;transition:opacity .25s}
.pf-scrim.on{opacity:1;pointer-events:auto}
.pf-detail{position:fixed;top:0;right:0;bottom:0;width:520px;max-width:96vw;background:var(--elev);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:60;transform:translateX(110%);transition:transform .32s cubic-bezier(.22,1,.36,1);box-shadow:-20px 0 60px rgba(0,0,0,.35)}
.pf-detail.open{transform:translateX(0)}
.pd-head{display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid var(--border);flex-shrink:0}
.pd-close{width:30px;height:30px;border-radius:8px;border:none;background:none;color:var(--text-3);cursor:pointer;display:grid;place-items:center;margin-left:auto;font-family:inherit}
.pd-close:hover{background:var(--content);color:var(--text)}
.pd-tabs{display:flex;gap:2px;padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
.pd-tab{font-size:.8rem;font-weight:500;padding:6px 13px;border-radius:7px;color:var(--text-2);cursor:pointer;border:1px solid transparent;background:none;font-family:inherit;transition:all .15s}
.pd-tab:hover{color:var(--text);background:var(--content)}
.pd-tab.on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600;border-color:var(--accent-soft-2)}
.pd-body{flex:1;overflow-y:auto;display:flex;flex-direction:column}
.pd-sect{padding:18px;border-bottom:1px solid var(--border)}
.pd-sect:last-child{border-bottom:none}
.pd-sect-h{font-family:var(--font-mono);font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px}
.pd-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px dashed var(--border);font-size:.85rem;gap:16px}
.pd-row:last-child{border-bottom:none}
.pd-row .pl{color:var(--text-3);flex-shrink:0;min-width:110px}
.pd-row .pv{color:var(--text);font-weight:500;text-align:right}
.big-score{display:flex;align-items:center;gap:20px;padding:18px}
.bs-donut{width:90px;height:90px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.bs-donut .bsi{width:68px;height:68px;border-radius:50%;background:var(--elev);display:grid;place-items:center;font-family:var(--font-mono);font-size:1.5rem;font-weight:800;color:var(--text)}
.bs-info{flex:1}
.bs-label{font-size:.78rem;color:var(--text-3);margin-bottom:4px}
.bs-sources{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.bs-src{font-size:.74rem;font-weight:500;padding:3px 9px;border-radius:99px;background:var(--content);border:1px solid var(--border)}
.crit-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed var(--border)}
.crit-row:last-child{border-bottom:none}
.crit-ico{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;flex-shrink:0}
.crit-ico svg{width:13px;height:13px}
.crit-lbl{font-size:.85rem;font-weight:600;flex:1}
.crit-desc{font-size:.74rem;color:var(--text-3);margin-top:2px}
.crit-scores{display:flex;gap:8px;flex-shrink:0;align-items:center}
.cs-item{display:flex;flex-direction:column;align-items:center;gap:2px}
.cs-v{font-family:var(--font-mono);font-size:.88rem;font-weight:800}
.cs-l{font-size:.62rem;color:var(--text-3)}
.review-form{display:flex;flex-direction:column;gap:14px;padding:18px}
.rf-label{font-size:.82rem;font-weight:600;color:var(--text-2);margin-bottom:5px}
.rf-score-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px}
.score-btn{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;font-family:var(--font-mono);font-size:.88rem;font-weight:700;border:1.5px solid var(--border-2);background:var(--content);color:var(--text-2);cursor:pointer;transition:all .15s}
.score-btn:hover{border-color:var(--accent);color:var(--accent-ink)}
.score-btn.on{background:var(--accent);border-color:var(--accent);color:#fff}
.rf-textarea{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:10px 13px;font-family:inherit;font-size:.85rem;color:var(--text);outline:none;resize:vertical;min-height:80px;width:100%;transition:border-color .15s,box-shadow .15s}
.rf-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.rf-textarea::placeholder{color:var(--text-3)}
.cb-banner{display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--accent-soft);border:1px solid var(--accent-soft-2);border-radius:var(--r-lg);margin-bottom:18px}
.cb-ico{width:38px;height:38px;border-radius:10px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
.cb-ico svg{width:18px;height:18px;color:#fff}
.cb-name{font-weight:700;font-size:.95rem;color:var(--text)}
.cb-sub{font-size:.8rem;color:var(--text-2)}
.cb-progress{margin-left:auto;text-align:right}
.cb-pct{font-family:var(--font-mono);font-size:1.1rem;font-weight:800;color:var(--accent-ink)}
.cb-plbl{font-size:.74rem;color:var(--text-3)}
.pf-empty{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:48px 0;text-align:center;color:var(--text-3);font-size:.88rem}
@media(max-width:1000px){.pf-layout{grid-template-columns:1fr}.pf-side{display:grid;grid-template-columns:1fr 1fr}}
@media(max-width:700px){.pf-stats{grid-template-columns:1fr 1fr}.rev-grid{grid-template-columns:1fr}.pf-detail{width:100vw}.pf-side{grid-template-columns:1fr}}
`;

function MiniDonut({ score, size = 52 }: { score: number | null; size?: number }) {
  const pct = score ? Math.round((score / 10) * 100) : 0;
  const color = score ? scoreColor(score) : "var(--border)";
  return (
    <div className="mini-donut" style={{ background: `conic-gradient(${color} calc(${pct}*1%),var(--border) 0)`, width: size, height: size }}>
      <div className="inner" style={{ width: size * 0.73, height: size * 0.73, fontSize: size < 60 ? ".88rem" : "1.5rem" }}>
        {score ?? "—"}
      </div>
    </div>
  );
}

function kpiAvg(snap: KpiSnapshot | null | undefined): number | null {
  if (!snap) return null;
  const vals = CRITERIA.map(c => (snap as any)[c.kpiKey]?.score as number | null).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}

function ReviewCard({ r, onClick }: { r: ReviewListItem; onClick: () => void }) {
  const selfScore = r.selfTotalScore != null ? Number(r.selfTotalScore) : null;
  const mgrScore  = r.mgrTotalScore  != null ? Number(r.mgrTotalScore)  : null;
  const autoAvg   = kpiAvg(r.kpiSnapshot);
  const displayScore = mgrScore ?? selfScore ?? autoAvg;
  const pct = displayScore ? Math.round((displayScore / 10) * 100) : 0;

  return (
    <div className={`rev-card ${CARD_CLS[r.status] ?? "status-pending"}`} onClick={onClick}>
      <div className="rc-top">
        <span className="rc-av" style={{ background: avColor(r.employee.fullName) }}>
          {initials(r.employee.fullName)}
        </span>
        <div>
          <div className="rc-name">{r.employee.fullName}</div>
          <div className="rc-role">{r.employee.department ?? "—"}</div>
        </div>
        <span className={`rc-status ${STATUS_CLS[r.status] ?? "rs-pending"}`}>
          {STATUS_LBL[r.status] ?? r.status}
        </span>
      </div>

      <div className="score-bars">
        {CRITERIA.map(c => {
          const val = r.kpiSnapshot ? ((r.kpiSnapshot as any)[c.kpiKey]?.score as number | null) : null;
          const display = val ?? displayScore;
          return (
            <div key={c.id} className="sb-row">
              <span className="sb-lbl">{c.name}</span>
              <div className="sb-track">
                <div className="sb-fill" style={{ width: display ? `${(display / 10) * 100}%` : "0%", background: c.color }} />
              </div>
              <span className="sb-val" style={{ color: c.color }}>{display ?? "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="rc-score">
        <div
          className="mini-donut"
          style={{ background: `conic-gradient(${displayScore ? scoreColor(displayScore) : "var(--border)"} calc(${pct}*1%),var(--border) 0)` }}
        >
          <div className="inner">{displayScore ?? "—"}</div>
        </div>
        <div className="rc-meta">
          {mgrScore  != null ? <div><b>Manager</b> {mgrScore}/10</div>  : <div style={{ color: "var(--text-3)" }}>Manager chưa review</div>}
          {selfScore != null ? <div><b>Self</b> {selfScore}/10</div>    : <div style={{ color: "var(--text-3)" }}>Self-review chưa nộp</div>}
          {autoAvg   != null ? <div><b>Auto-KPI</b> {autoAvg}/10</div> : null}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  review,
  isManager,
  currentEmployeeId,
  onClose,
  onSaved,
}: {
  review: ReviewListItem | null;
  isManager: boolean;
  currentEmployeeId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "self" | "manager">("overview");
  const [mgrScores, setMgrScores] = useState<Record<string, number>>({ speed: 8, quality: 8, ontime: 8, learning: 8, proactive: 8 });
  const [mgrComment, setMgrComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const isOpen = review !== null;

  const selfScore = review?.selfTotalScore != null ? Number(review.selfTotalScore) : null;
  const mgrScore  = review?.mgrTotalScore  != null ? Number(review.mgrTotalScore)  : null;
  const autoAvg   = kpiAvg(review?.kpiSnapshot);
  const displayScore = mgrScore ?? selfScore ?? autoAvg;

  const mgrTotal = Math.round(
    Object.values(mgrScores).reduce((a, b) => a + b, 0) / CRITERIA.length * 10
  ) / 10;

  async function handleSubmitMgr() {
    if (!review) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/performance-reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mgrTotalScore: mgrTotal, mgrComment }),
      });
      if (res.ok) {
        setToast("Đã lưu manager review");
        setTimeout(() => { setToast(""); onSaved(); }, 1200);
      } else {
        setToast("Lỗi khi lưu");
        setTimeout(() => setToast(""), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={`pf-scrim${isOpen ? " on" : ""}`} onClick={onClose} />
      <aside className={`pf-detail${isOpen ? " open" : ""}`}>
        {review && (
          <>
            <div className="pd-head">
              <div className="rc-av" style={{ background: avColor(review.employee.fullName), width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontSize: ".88rem", fontWeight: 700, flexShrink: 0 }}>
                {initials(review.employee.fullName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{review.employee.fullName}</div>
                <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                  {review.employee.department ?? "—"} · {review.cycle.name}
                </div>
              </div>
              <button className="pd-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>

            <div className="pd-tabs">
              {(["overview", "self", "manager"] as const).map(t => (
                <button key={t} className={`pd-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
                  {t === "overview" ? "Tổng quan" : t === "self" ? "Tự đánh giá" : "Manager review"}
                </button>
              ))}
            </div>

            <div className="pd-body">
              {/* Overview */}
              {tab === "overview" && (
                <>
                  <div className="big-score pd-sect" style={{ padding: 18 }}>
                    <div
                      className="bs-donut"
                      style={{ background: `conic-gradient(${displayScore ? scoreColor(displayScore) : "var(--border)"} calc(${displayScore ? Math.round(displayScore / 10 * 100) : 0}*1%),var(--border) 0)` }}
                    >
                      <div className="bsi">{displayScore ?? "—"}</div>
                    </div>
                    <div className="bs-info">
                      <div className="bs-label">{mgrScore != null ? "Điểm cuối (manager)" : selfScore != null ? "Điểm tự đánh giá" : autoAvg != null ? "Auto-KPI" : "Chưa có điểm"}</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: displayScore ? scoreColor(displayScore) : "var(--text-3)" }}>
                        {displayScore != null ? `${displayScore}/10` : "—"}
                      </div>
                      <div className="bs-sources">
                        {autoAvg   != null && <span className="bs-src">Auto-KPI: {autoAvg}</span>}
                        {selfScore != null && <span className="bs-src">Self: {selfScore}</span>}
                        {mgrScore  != null && <span className="bs-src">Mgr: {mgrScore}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="pd-sect">
                    <div className="pd-sect-h">Thông tin chung</div>
                    <div className="pd-row"><span className="pl">Trạng thái</span><span className="pv"><span className={`rc-status ${STATUS_CLS[review.status] ?? "rs-pending"}`}>{STATUS_LBL[review.status] ?? review.status}</span></span></div>
                    <div className="pd-row"><span className="pl">Chu kỳ</span><span className="pv">{review.cycle.name}</span></div>
                    <div className="pd-row"><span className="pl">Thời gian</span><span className="pv">{format(new Date(review.cycle.periodStart), "dd/MM/yyyy")} – {format(new Date(review.cycle.periodEnd), "dd/MM/yyyy")}</span></div>
                    <div className="pd-row"><span className="pl">Manager</span><span className="pv">{review.mgrReviewer?.fullName ?? "—"}</span></div>
                    {review.finalizedAt && <div className="pd-row"><span className="pl">Hoàn tất</span><span className="pv">{format(new Date(review.finalizedAt), "dd/MM/yyyy HH:mm")}</span></div>}
                  </div>

                  <div className="pd-sect">
                    <div className="pd-sect-h">5 tiêu chí Auto-KPI</div>
                    {CRITERIA.map(c => {
                      const kpi = review.kpiSnapshot ? (review.kpiSnapshot as any)[c.kpiKey] as KpiScore : null;
                      const kpiVal = kpi?.score ?? null;
                      return (
                        <div key={c.id} className="crit-row">
                          <div className="crit-ico" style={{ background: c.color + "22", color: c.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: c.svg }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="crit-lbl">{c.name}</div>
                            <div className="crit-desc">{c.desc}</div>
                            {kpi?.reason && <div style={{ fontSize: ".7rem", color: "var(--text-3)", marginTop: 2, fontStyle: "italic" }}>{kpi.reason}</div>}
                          </div>
                          <div className="crit-scores">
                            {kpiVal != null && (
                              <div className="cs-item">
                                <span className="cs-v" style={{ color: c.color }}>{kpiVal}</span>
                                <span className="cs-l">auto</span>
                              </div>
                            )}
                            {selfScore != null && (
                              <div className="cs-item">
                                <span className="cs-v" style={{ color: scoreColor(selfScore) }}>{selfScore}</span>
                                <span className="cs-l">self</span>
                              </div>
                            )}
                            {mgrScore != null && (
                              <div className="cs-item">
                                <span className="cs-v" style={{ color: scoreColor(mgrScore) }}>{mgrScore}</span>
                                <span className="cs-l">mgr</span>
                              </div>
                            )}
                            {kpiVal == null && selfScore == null && mgrScore == null && (
                              <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {review.kpiSnapshot?.computedAt && (
                      <div style={{ fontSize: ".7rem", color: "var(--text-3)", marginTop: 10, textAlign: "right" }}>
                        Tính lúc {new Date(review.kpiSnapshot.computedAt).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Self */}
              {tab === "self" && (
                <div className="pd-sect">
                  {selfScore != null ? (
                    <>
                      <div className="pd-sect-h">Kết quả tự đánh giá</div>
                      {CRITERIA.map(c => (
                        <div key={c.id} className="crit-row">
                          <div className="crit-ico" style={{ background: c.color + "22", color: c.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: c.svg }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="crit-lbl">{c.name}</div>
                            <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginTop: 5 }}>
                              <div style={{ height: "100%", width: `${(selfScore / 10) * 100}%`, background: c.color, borderRadius: 99 }} />
                            </div>
                          </div>
                          <span className="cs-v" style={{ color: c.color, marginLeft: 10 }}>{selfScore}</span>
                        </div>
                      ))}
                      {review.selfComment && (
                        <>
                          <div className="pd-sect-h" style={{ marginTop: 16 }}>Nhận xét</div>
                          <p style={{ fontSize: ".86rem", color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{review.selfComment}</p>
                        </>
                      )}
                    </>
                  ) : review.employeeId === currentEmployeeId ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="36" height="36" style={{ display: "block", margin: "0 auto 10px", opacity: 0.4 }}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
                      Bạn chưa hoàn thành tự đánh giá.
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>
                      Nhân viên chưa hoàn thành tự đánh giá.
                    </div>
                  )}
                </div>
              )}

              {/* Manager */}
              {tab === "manager" && (
                <div>
                  {isManager && review.status === "SELF_DONE" ? (
                    <div className="review-form">
                      <div className="pd-sect-h" style={{ margin: 0 }}>Chấm điểm theo tiêu chí</div>
                      {CRITERIA.map(c => (
                        <div key={c.id}>
                          <div className="rf-label" style={{ color: c.color }}>{c.name}</div>
                          <div className="rf-score-row">
                            {[1,2,3,4,5,6,7,8,9,10].map(v => (
                              <button
                                key={v}
                                type="button"
                                className={`score-btn${mgrScores[c.id] === v ? " on" : ""}`}
                                onClick={() => setMgrScores(p => ({ ...p, [c.id]: v }))}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: ".82rem", color: "var(--text-3)" }}>Tổng điểm</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: scoreColor(mgrTotal) }}>{mgrTotal}/10</span>
                      </div>
                      <div>
                        <div className="rf-label">Nhận xét manager</div>
                        <textarea
                          className="rf-textarea"
                          placeholder="Nhận xét chi tiết về hiệu suất trong chu kỳ này…"
                          value={mgrComment}
                          onChange={e => setMgrComment(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleSubmitMgr}
                        disabled={submitting}
                        style={{ padding: "11px 0", borderRadius: 9, background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: ".88rem", opacity: submitting ? 0.7 : 1, fontFamily: "inherit" }}
                      >
                        {submitting ? "Đang lưu…" : "Lưu Manager Review"}
                      </button>
                    </div>
                  ) : mgrScore != null ? (
                    <div className="pd-sect">
                      <div className="pd-sect-h">Kết quả manager review</div>
                      {CRITERIA.map(c => (
                        <div key={c.id} className="crit-row">
                          <div className="crit-ico" style={{ background: c.color + "22", color: c.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: c.svg }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="crit-lbl">{c.name}</div>
                            <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginTop: 5 }}>
                              <div style={{ height: "100%", width: `${(mgrScore / 10) * 100}%`, background: c.color, borderRadius: 99 }} />
                            </div>
                          </div>
                          <span className="cs-v" style={{ color: c.color, marginLeft: 10 }}>{mgrScore}</span>
                        </div>
                      ))}
                      {review.mgrComment && (
                        <>
                          <div className="pd-sect-h" style={{ marginTop: 16 }}>Nhận xét</div>
                          <p style={{ fontSize: ".86rem", color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{review.mgrComment}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="pd-sect" style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>
                      {review.status === "PENDING" ? "Nhân viên chưa hoàn thành tự đánh giá." : "Chưa có manager review."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {toast && (
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 18px", fontSize: ".84rem", fontWeight: 600, boxShadow: "var(--shadow)", whiteSpace: "nowrap", color: "var(--text)" }}>
                {toast}
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

export function PerformanceReviewsClient({ isManager, currentEmployeeId }: { isManager: boolean; currentEmployeeId: number }) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openReview, setOpenReview] = useState<ReviewListItem | null>(null);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [tab, setTab] = useState<"overview" | "self" | "manager" | "history">("overview");
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcMsg, setRecalcMsg] = useState("");

  const fetchAll = useCallback(async () => {
    async function safeJson(url: string) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!text) return null;
        try { return JSON.parse(text); } catch { return null; }
      } catch { return null; }
    }
    const reqs = [safeJson("/api/performance-reviews")];
    if (isManager) reqs.push(safeJson("/api/performance-reviews/cycles"));
    const [myRes, cyclesRes] = await Promise.all(reqs);
    const myData = (myRes?.data ?? []) as ReviewListItem[];
    setAllReviews(myData);
    if (isManager) {
      const cyclesData = (cyclesRes?.data ?? []) as Cycle[];
      setCycles(cyclesData);
      if (cyclesData.length) setCycleIdx(cyclesData.length - 1);
    }
  }, [isManager]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const cycle = cycles[cycleIdx] ?? null;
  const reviewsForCycle = cycle
    ? allReviews.filter(r => r.cycleId === cycle.id)
    : isManager ? [] : allReviews;
  const myReviews = allReviews.filter(r => r.employeeId === currentEmployeeId);
  const displayList = isManager ? reviewsForCycle : myReviews;

  const completed = displayList.filter(r => r.status === "COMPLETED").length;
  const selfDone = displayList.filter(r => r.status === "SELF_DONE").length;
  const pending = displayList.filter(r => r.status === "PENDING").length;
  const scored = displayList.filter(r => r.mgrTotalScore != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + Number(r.mgrTotalScore), 0) / scored.length * 10) / 10
    : null;

  async function handleRecalc() {
    if (!cycle || recalcLoading) return;
    setRecalcLoading(true);
    setRecalcMsg("");
    try {
      const res = await fetch(`/api/performance-reviews/cycles/${cycle.id}/recalculate`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setRecalcMsg(`Đã tính lại ${json.updated} nhân viên`);
        await fetchAll();
      } else {
        setRecalcMsg("Lỗi khi tính lại");
      }
    } catch {
      setRecalcMsg("Lỗi kết nối");
    } finally {
      setRecalcLoading(false);
      setTimeout(() => setRecalcMsg(""), 3000);
    }
  }

  const ranked = [...displayList]
    .filter(r => r.mgrTotalScore != null)
    .sort((a, b) => Number(b.mgrTotalScore) - Number(a.mgrTotalScore));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "var(--text-3)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="18" height="18" style={{ marginRight: 8, animation: "spin .8s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Đang tải…
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Đánh giá Hiệu suất</h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4, marginBottom: 0 }}>
            Performance review định kỳ · <b>{completed}</b> hoàn thành · <b>{pending}</b> chờ đánh giá
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {cycles.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: "5px 10px" }}>
              <button onClick={() => setCycleIdx(i => Math.max(0, i - 1))} disabled={cycleIdx === 0} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", display: "grid", placeItems: "center", padding: 2 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ fontSize: ".84rem", fontWeight: 600, color: "var(--text)", minWidth: 80, textAlign: "center" }}>{cycle?.name ?? "—"}</span>
              <button onClick={() => setCycleIdx(i => Math.min(cycles.length - 1, i + 1))} disabled={cycleIdx === cycles.length - 1} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", display: "grid", placeItems: "center", padding: 2 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
          {isManager && (
            <button
              onClick={() => setShowCreate(true)}
              className="abtn primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
              Tạo chu kỳ mới
            </button>
          )}
        </div>
      </div>

      {/* Cycle banner */}
      {cycle && (
        <div className="cb-banner">
          <div className="cb-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </div>
          <div>
            <div className="cb-name">{cycle.name}</div>
            <div className="cb-sub">{format(new Date(cycle.periodStart), "dd/MM/yyyy")} – {format(new Date(cycle.periodEnd), "dd/MM/yyyy")}</div>
          </div>
          <div className="cb-progress">
            <div className="cb-pct">{displayList.length > 0 ? Math.round((completed / displayList.length) * 100) : 0}%</div>
            <div className="cb-plbl">Hoàn thành</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pf-stats">
        {[
          { color: "#22c55e", svg: '<path d="M5 12l5 5L20 6"/>', val: completed, label: "Hoàn thành",       sub: `${cycle?.name ?? "chu kỳ này"}`, dc: "ok" },
          { color: "#3B5BDB", svg: '<circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke-linecap="round"/>', val: selfDone, label: "Chờ manager review", sub: "Đã nộp self-review", dc: "" },
          { color: "#f59e0b", svg: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>', val: pending, label: "Chưa bắt đầu", sub: "", dc: pending > 0 ? "warn" : "" },
          { color: "#7c3aed", svg: '<path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/>', val: avgScore ?? "—", label: "Điểm TB team", sub: `${scored.length} đã chấm`, dc: "ok" },
        ].map((s, i) => (
          <div key={i} className="pf-stat">
            <span className="psi" style={{ background: s.color + "22", color: s.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" dangerouslySetInnerHTML={{ __html: s.svg }} />
            </span>
            <div>
              <div className="psv">{s.val}</div>
              <div className="psl">{s.label}</div>
              {s.sub && <div className={`psd ${s.dc}`}>{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="pf-tabs">
        {(["overview", "self", "manager", "history"] as const).map(t => (
          <button key={t} className={`pf-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "Tổng quan" : t === "self" ? "Self-review" : t === "manager" ? "Manager review" : "Lịch sử"}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="pf-layout">
        <div className="pf-main">
          {displayList.length > 0 ? (
            <div className="pp">
              <div className="pp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Đánh giá thành viên
                </h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>{displayList.length} nhân viên</span>
              </div>
              <div style={{ padding: 14 }}>
                <div className="rev-grid">
                  {displayList.map(r => (
                    <ReviewCard key={r.id} r={r} onClick={() => setOpenReview(r)} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="pf-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="36" height="36" style={{ display: "block", margin: "0 auto 10px", opacity: 0.35 }}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              {isManager ? "Chưa có đánh giá trong chu kỳ này." : "Chưa có chu kỳ đánh giá nào. Đợi manager khởi tạo."}
            </div>
          )}
        </div>

        {/* Side */}
        <div className="pf-side">
          {/* Ranking */}
          <div className="pp">
            <div className="pp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>
                Xếp hạng {cycle?.name ?? ""}
              </h3>
            </div>
            <div style={{ padding: "12px 14px" }}>
              {ranked.length > 0 ? (
                <div className="rank-list">
                  {ranked.map((r, i) => (
                    <div key={r.id} className="rank-row" onClick={() => setOpenReview(r)}>
                      <span className="rank-n">{i + 1}</span>
                      <span className="rank-av" style={{ background: avColor(r.employee.fullName) }}>{initials(r.employee.fullName)}</span>
                      <div className="rank-info">
                        <div className="rank-name">{r.employee.fullName}</div>
                        <div className="rank-role">{r.employee.department ?? "—"}</div>
                      </div>
                      <span className="rank-score" style={{ color: scoreColor(Number(r.mgrTotalScore)) }}>{Number(r.mgrTotalScore)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: ".8rem", color: "var(--text-3)", textAlign: "center", padding: "12px 0", margin: 0 }}>Chưa có kết quả</p>
              )}
            </div>
          </div>

          {/* Criteria legend */}
          <div className="pp">
            <div className="pp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                5 tiêu chí Auto-KPI
              </h3>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: ".78rem", color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                Điểm được tính <b>tự động</b> từ dữ liệu task & time log, kết hợp self-review và manager review.
              </p>
              {CRITERIA.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: c.color + "22", color: c.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" dangerouslySetInnerHTML={{ __html: c.svg }} />
                  </span>
                  <div>
                    <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--text-3)" }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="pp">
            <div className="pp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
                Thao tác nhanh
              </h3>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="abtn ghost" style={{ height: 36, fontSize: ".83rem", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
                Nhắc nhở self-review
              </button>
              <button className="abtn ghost" style={{ height: 36, fontSize: ".83rem", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export kết quả CSV
              </button>
              {isManager && (
                <button
                  className="abtn ghost"
                  style={{ height: 36, fontSize: ".83rem", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 8, opacity: (!cycle || recalcLoading) ? 0.5 : 1 }}
                  onClick={handleRecalc}
                  disabled={!cycle || recalcLoading}
                  title={!cycle ? "Chọn chu kỳ trước" : ""}
                >
                  {recalcLoading ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  )}
                  {recalcLoading ? "Đang tính lại…" : "Tính lại Auto-KPI"}
                </button>
              )}
              {recalcMsg && (
                <div style={{ fontSize: ".76rem", color: recalcMsg.startsWith("Lỗi") ? "var(--danger)" : "var(--ok)", padding: "4px 8px", borderRadius: 6, background: recalcMsg.startsWith("Lỗi") ? "var(--danger-soft)" : "var(--ok-soft)" }}>
                  {recalcMsg}
                </div>
              )}
              {isManager && (
                <button className="abtn ghost" style={{ height: 36, fontSize: ".83rem", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Kết thúc chu kỳ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateCycleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      <DetailPanel
        review={openReview}
        isManager={isManager}
        currentEmployeeId={currentEmployeeId}
        onClose={() => setOpenReview(null)}
        onSaved={() => { setOpenReview(null); fetchAll(); }}
      />
    </>
  );
}
