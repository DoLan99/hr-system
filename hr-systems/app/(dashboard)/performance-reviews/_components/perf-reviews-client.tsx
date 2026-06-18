"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, ClipboardList, Download, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { CreateCycleModal } from "./create-cycle-modal";
import { ReviewFormModal } from "./review-form-modal";

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

interface ReviewListItem {
  id: number;
  status: string;
  cycleId: number;
  employeeId: number;
  selfTotalScore: string | number | null;
  mgrTotalScore: string | number | null;
  finalizedAt: string | null;
  cycle: { id: number; name: string; periodStart: string; periodEnd: string; status: string };
  employee: { id: number; fullName: string; department: string | null };
  mgrReviewer: { id: number; fullName: string } | null;
}

const AV_COLORS = [
  "linear-gradient(135deg,#8b7bff,#4f7aff)",
  "linear-gradient(135deg,#f97316,#fbbf24)",
  "linear-gradient(135deg,#22c55e,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#a855f7)",
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}

function reviewStatusClass(status: string) {
  if (status === "COMPLETED") return "completed";
  if (status === "SELF_DONE") return "manager";
  return "self";
}

function reviewStatusLabel(status: string) {
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "SELF_DONE") return "Chờ manager";
  return "Chờ tự đánh giá";
}

function scoreClass(s: number | null) {
  if (s === null) return "none";
  if (s >= 8.5) return "great";
  if (s >= 7) return "good";
  if (s >= 5) return "avg";
  return "low";
}

function scoreColor(s: number | null) {
  if (!s) return "var(--border)";
  if (s >= 8.5) return "var(--ok)";
  if (s >= 7) return "var(--accent)";
  if (s >= 5) return "var(--warn)";
  return "var(--danger)";
}

function ScoreRing({ score, size = 52 }: { score: number | null; size?: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = score ? score / 10 : 0;
  const dash = circ * (1 - pct);
  const color = scoreColor(score);
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
        <circle className="ring-bg" cx="24" cy="24" r={r} />
        <circle
          className="ring-fill"
          cx="24" cy="24" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
        />
      </svg>
      <div className="ring-text">
        <span className="ring-val" style={{ color }}>{score ?? "—"}</span>
        {score && <span className="ring-max">/10</span>}
      </div>
    </div>
  );
}

function cycleSteps(cycleStatus: string) {
  const all = [
    { l: "Mở chu kỳ" },
    { l: "Tự đánh giá" },
    { l: "Manager review" },
    { l: "Hiệu chỉnh" },
    { l: "Công bố" },
  ];
  let activeIdx = 0;
  if (cycleStatus === "OPEN") activeIdx = 2;
  else if (cycleStatus === "CLOSED") activeIdx = 5;
  return all.map((s, i) => ({
    ...s,
    state: i < activeIdx ? "done" : i === activeIdx ? "active" : "todo",
  }));
}

function CycleProgress({ cycleStatus }: { cycleStatus: string }) {
  const steps = cycleSteps(cycleStatus);
  return (
    <div className="cycle-progress">
      {steps.map((s, i) => (
        <div key={i} className={`cp-step ${s.state}`}>
          <div className={`cp-dot ${s.state}`}>
            {s.state === "done"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M5 12l5 5L20 6" /></svg>
              : s.state === "active"
              ? <span style={{ fontSize: ".72rem" }}>▶</span>
              : <span style={{ fontFamily: "var(--font-mono)", fontSize: ".66rem" }}>{i + 1}</span>
            }
          </div>
          <span className="cp-lbl">{s.l}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewDrawer({
  review,
  isManager,
  currentEmployeeId,
  onClose,
  onSaved,
}: {
  review: ReviewListItem;
  isManager: boolean;
  currentEmployeeId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "self" | "manager">("overview");
  const [mgrScores, setMgrScores] = useState({ speed: 5, quality: 5, ontime: 5, learning: 5, initiative: 5 });
  const [mgrComment, setMgrComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const selfScore = review.selfTotalScore != null ? Number(review.selfTotalScore) : null;
  const mgrScore = review.mgrTotalScore != null ? Number(review.mgrTotalScore) : null;
  const displayScore = mgrScore ?? selfScore;

  const mgrTotal = Math.round(Object.values(mgrScores).reduce((a, b) => a + b, 0) / 5 * 10) / 10;

  const CRITERIA = [
    { k: "speed", l: "Tốc độ", desc: "Hoàn thành task nhanh" },
    { k: "quality", l: "Chất lượng", desc: "Code sạch, ít bug" },
    { k: "ontime", l: "Đúng hạn", desc: "% task trước deadline" },
    { k: "learning", l: "Học hỏi", desc: "Kỹ năng mới liên tục" },
    { k: "initiative", l: "Chủ động", desc: "Đề xuất giải pháp" },
  ];

  async function handleSubmitMgr() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/performance-reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mgrTotalScore: mgrTotal, mgrComment }),
      });
      if (res.ok) {
        setToast({ msg: "Đã lưu manager review", type: "ok" });
        setTimeout(() => { setToast(null); onSaved(); }, 1200);
      } else {
        setToast({ msg: "Lỗi khi lưu", type: "err" });
        setTimeout(() => setToast(null), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const emp = review.employee;
  const isOwnReview = review.employeeId === currentEmployeeId;

  return (
    <>
      <div className="rd-back open" onClick={onClose} />
      <div className="rd-drawer open">
        <div className="rd-head">
          <div className="pc-av" style={{ background: avColor(emp.fullName), width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontSize: ".9rem", fontWeight: 700, flexShrink: 0 }}>
            {initials(emp.fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{emp.fullName}</div>
            <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
              {emp.department ?? "—"} · {review.cycle.name}
            </div>
          </div>
          <button className="rd-close" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="rd-tabs">
          {(["overview", "self", "manager"] as const).map(t => (
            <button key={t} className={`rd-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
              {t === "overview" ? "Tổng quan" : t === "self" ? "Tự đánh giá" : "Manager review"}
            </button>
          ))}
        </div>

        <div className="rd-body">
          {/* Overview pane */}
          <div className={`rd-pane${tab === "overview" ? " on" : ""}`} style={{ overflowY: "auto" }}>
            <p className="dsec">Thông tin chung</p>
            <div className="drow"><span className="dl">Trạng thái</span><span className="dv"><span className={`perf-status ${reviewStatusClass(review.status)}`}>{reviewStatusLabel(review.status)}</span></span></div>
            <div className="drow"><span className="dl">Chu kỳ</span><span className="dv">{review.cycle.name}</span></div>
            <div className="drow"><span className="dl">Thời gian</span><span className="dv">{format(new Date(review.cycle.periodStart), "dd/MM/yyyy")} – {format(new Date(review.cycle.periodEnd), "dd/MM/yyyy")}</span></div>
            <div className="drow"><span className="dl">Manager</span><span className="dv">{review.mgrReviewer?.fullName ?? "—"}</span></div>
            {review.finalizedAt && <div className="drow"><span className="dl">Hoàn tất</span><span className="dv">{format(new Date(review.finalizedAt), "dd/MM/yyyy HH:mm")}</span></div>}

            <p className="dsec" style={{ marginTop: 20 }}>Điểm số</p>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 18 }}>
              <ScoreRing score={displayScore} size={72} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".82rem", color: "var(--text-2)", marginBottom: 6 }}>
                  {mgrScore != null ? "Điểm manager" : selfScore != null ? "Điểm tự đánh giá" : "Chưa có điểm"}
                </div>
                {selfScore != null && <div className="drow" style={{ padding: "6px 0" }}><span className="dl">Tự đánh giá</span><span className="dv" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{selfScore}/10</span></div>}
                {mgrScore != null && <div className="drow" style={{ padding: "6px 0" }}><span className="dl">Manager</span><span className="dv" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ok)" }}>{mgrScore}/10</span></div>}
              </div>
            </div>

            <div className="ai-suggestion">
              <div className="ai-head">
                <Sparkles size={15} /> Gợi ý KPI tiếp theo
              </div>
              <div className="ai-kpi-list">
                <div className="ai-kpi">Cải thiện tốc độ hoàn thành task và độ chính xác ước tính thời gian</div>
                <div className="ai-kpi">Nâng cao chất lượng code qua code review và unit tests</div>
                <div className="ai-kpi">Chủ động đề xuất giải pháp cải thiện quy trình team</div>
              </div>
            </div>
          </div>

          {/* Self pane */}
          <div className={`rd-pane${tab === "self" ? " on" : ""}`} style={{ overflowY: "auto" }}>
            {review.status === "PENDING" && isOwnReview ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: ".88rem" }}>
                <ClipboardList size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
                Bạn chưa hoàn thành tự đánh giá.<br />
                <button
                  onClick={() => onClose()}
                  style={{ marginTop: 14, padding: "8px 20px", borderRadius: 8, background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700, border: "none", cursor: "pointer", fontSize: ".85rem" }}
                >
                  Mở form đánh giá
                </button>
              </div>
            ) : selfScore != null ? (
              <>
                <p className="dsec">Tự đánh giá</p>
                <div className="dcard">
                  {CRITERIA.map(c => (
                    <div key={c.k} className="sc-input-row">
                      <div className="sil">{c.l}<span>{c.desc}</span></div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(selfScore / 10) * 100}%`, background: "linear-gradient(90deg,#a78bfa,#8b5cf6)", borderRadius: 99 }} />
                      </div>
                      <span className="sival" style={{ color: "#a78bfa" }}>{selfScore}</span>
                    </div>
                  ))}
                </div>
                <p className="dsec">Nhận xét</p>
                <div style={{ fontSize: ".86rem", color: "var(--text-2)", lineHeight: 1.7 }}>Chưa có nhận xét tự đánh giá.</div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: ".88rem" }}>Chưa có dữ liệu tự đánh giá.</div>
            )}
          </div>

          {/* Manager pane */}
          <div className={`rd-pane${tab === "manager" ? " on" : ""}`} style={{ overflowY: "auto" }}>
            {isManager && review.status === "SELF_DONE" ? (
              <>
                <p className="dsec">Chấm điểm theo tiêu chí</p>
                <div className="dcard">
                  {CRITERIA.map(c => (
                    <div key={c.k} className="sc-input-row">
                      <div className="sil">{c.l}<span>{c.desc}</span></div>
                      <input
                        type="range" min={0} max={10} step={0.5}
                        value={(mgrScores as any)[c.k]}
                        onChange={e => setMgrScores(prev => ({ ...prev, [c.k]: Number(e.target.value) }))}
                      />
                      <span className="sival">{(mgrScores as any)[c.k]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", color: "var(--text-3)" }}>Tổng điểm:</span>
                  <span className={`score-pill ${scoreClass(mgrTotal)}`}>{mgrTotal}/10</span>
                </div>
                <p className="dsec">Nhận xét manager</p>
                <textarea
                  className="rv-ta"
                  placeholder="Nhận xét chi tiết về hiệu suất của nhân viên trong chu kỳ này…"
                  value={mgrComment}
                  onChange={e => setMgrComment(e.target.value)}
                />
                <button
                  onClick={handleSubmitMgr}
                  disabled={submitting}
                  style={{ marginTop: 16, width: "100%", padding: "11px 0", borderRadius: 9, background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: ".88rem", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Đang lưu…" : "Lưu Manager Review"}
                </button>
              </>
            ) : mgrScore != null ? (
              <>
                <p className="dsec">Kết quả manager review</p>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
                  <ScoreRing score={mgrScore} size={64} />
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: scoreColor(mgrScore) }}>{mgrScore}/10</div>
                    <div style={{ fontSize: ".76rem", color: "var(--text-3)" }}>Điểm manager</div>
                    <span className={`score-pill ${scoreClass(mgrScore)}`} style={{ marginTop: 6, display: "inline-flex" }}>
                      {mgrScore >= 8.5 ? "Xuất sắc" : mgrScore >= 7 ? "Tốt" : mgrScore >= 5 ? "Trung bình" : "Cần cải thiện"}
                    </span>
                  </div>
                </div>
                <div className="dcard">
                  {CRITERIA.map(c => (
                    <div key={c.k} className="sc-input-row">
                      <div className="sil">{c.l}<span>{c.desc}</span></div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(mgrScore / 10) * 100}%`, background: "linear-gradient(90deg,var(--ok),#4ade80)", borderRadius: 99 }} />
                      </div>
                      <span className="sival" style={{ color: "var(--ok)" }}>{mgrScore}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: ".88rem" }}>
                {review.status === "PENDING" ? "Nhân viên chưa hoàn thành tự đánh giá." : "Chưa có manager review."}
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className={`toast show ${toast.type}`} style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
            {toast.msg}
          </div>
        )}
      </div>
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
  const [legacyReviewId, setLegacyReviewId] = useState<number | null>(null);

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
  }, [isManager, currentEmployeeId]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "var(--text-3)" }}>
        <Loader2 size={18} style={{ marginRight: 8 }} className="animate-spin" /> Đang tải…
      </div>
    );
  }

  const cycle = cycles[cycleIdx] ?? null;
  const reviewsForCycle = cycle
    ? allReviews.filter(r => r.cycleId === cycle.id)
    : isManager
    ? []
    : allReviews;

  const myReviews = allReviews.filter(r => r.employeeId === currentEmployeeId);

  // KPI numbers
  const completed = reviewsForCycle.filter(r => r.status === "COMPLETED").length;
  const total = reviewsForCycle.length;
  const scored = reviewsForCycle.filter(r => r.mgrTotalScore != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + Number(r.mgrTotalScore), 0) / scored.length * 10) / 10
    : null;
  const topPerformer = scored.length
    ? scored.reduce((a, b) => Number(a.mgrTotalScore) > Number(b.mgrTotalScore) ? a : b)
    : null;
  const pending = reviewsForCycle.filter(r => r.status !== "COMPLETED").length;

  const displayList = isManager ? reviewsForCycle : myReviews;

  return (
    <div>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Đánh giá Hiệu suất</h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4, marginBottom: 0 }}>
            Performance review định kỳ · <b>{completed}</b> hoàn thành · <b>{pending}</b> chờ đánh giá
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {cycles.length > 0 && (
            <div className="cycle-sel">
              <button onClick={() => setCycleIdx(i => Math.max(0, i - 1))} disabled={cycleIdx === 0}><ChevronLeft size={16} /></button>
              <span className="cval">{cycle?.name ?? "—"}</span>
              <button onClick={() => setCycleIdx(i => Math.min(cycles.length - 1, i + 1))} disabled={cycleIdx === cycles.length - 1}><ChevronRight size={16} /></button>
            </div>
          )}
          {isManager && (
            <button
              onClick={() => setShowCreate(true)}
              className="abtn"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700, border: "none", cursor: "pointer", fontSize: ".84rem" }}
            >
              <Plus size={15} /> Tạo chu kỳ mới
            </button>
          )}
        </div>
      </div>

      {/* Cycle progress */}
      {cycle && <CycleProgress cycleStatus={cycle.status} />}

      {/* KPI cards */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>Hoàn thành</div>
          <div className="kv">{completed}/{total || 0}</div>
          <div className="kc up">{cycle?.name ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" /></svg></div>Điểm TB</div>
          <div className="kv">{avgScore != null ? `${avgScore}/10` : "—"}</div>
          <div className="kc up">{scored.length} đã chấm</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M8 20h8a4 4 0 0 0-8 0z" /></svg></div>Top performer</div>
          <div className="kv" style={{ fontSize: "1.3rem" }}>{topPerformer?.employee.fullName?.split(" ").pop() ?? "—"}</div>
          <div className="kc up">{topPerformer ? `${Number(topPerformer.mgrTotalScore)}/10` : "—"}</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></div>Chờ đánh giá</div>
          <div className="kv">{pending}</div>
          <div className="kc warn">{cycle?.selfDueDate ? `Hạn ${format(new Date(cycle.selfDueDate), "dd/MM")}` : "—"}</div>
        </div>
      </div>

      {/* Members grid */}
      {displayList.length > 0 && (
        <>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            Đánh giá thành viên <span style={{ flex: 1, height: 1, background: "var(--border)", display: "block" }} />
          </div>
          <div className="perf-grid">
            {displayList.map(r => {
              const sc = r.mgrTotalScore != null ? Number(r.mgrTotalScore) : r.selfTotalScore != null ? Number(r.selfTotalScore) : null;
              const stClass = reviewStatusClass(r.status);
              return (
                <div key={r.id} className={`perf-card ${stClass}`} onClick={() => setOpenReview(r)}>
                  <div className="perf-card-top">
                    <div className="pc-who">
                      <div className="pc-av" style={{ background: avColor(r.employee.fullName) }}>
                        {initials(r.employee.fullName)}
                      </div>
                      <div>
                        <div className="pc-name">{r.employee.fullName}</div>
                        <div className="pc-role">{r.employee.department ?? "—"}</div>
                      </div>
                    </div>
                    <ScoreRing score={sc} />
                  </div>

                  {/* Simple criteria bar using total score */}
                  <div className="criteria-bars">
                    {[["Tốc độ", sc], ["Chất lượng", sc], ["Đúng hạn", sc]].map(([label, val]) => (
                      <div key={label as string} className="cr-bar-row">
                        <span className="cr-lbl">{label as string}</span>
                        <div className="cr-track">
                          <div className="cr-fill" style={{ width: val ? `${(val as number / 10) * 100}%` : "0%", background: scoreColor(val as number | null) }} />
                        </div>
                        <span className="cr-val">{val ?? "—"}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className={`perf-status ${stClass}`}>{reviewStatusLabel(r.status)}</span>
                    {sc != null && <span className={`score-pill ${scoreClass(sc)}`}>{sc}/10</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {displayList.length === 0 && !loading && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "48px 0", textAlign: "center" }}>
          <ClipboardList size={36} style={{ margin: "0 auto 10px", display: "block", color: "var(--text-3)", opacity: 0.4 }} />
          <p style={{ color: "var(--text-3)", fontSize: ".88rem" }}>
            {isManager ? "Chưa có đánh giá trong chu kỳ này." : "Chưa có chu kỳ đánh giá nào. Đợi manager khởi tạo."}
          </p>
        </div>
      )}

      {showCreate && (
        <CreateCycleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      {openReview && (
        <ReviewDrawer
          review={openReview}
          isManager={isManager}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setOpenReview(null)}
          onSaved={() => { setOpenReview(null); fetchAll(); }}
        />
      )}

      {legacyReviewId && (
        <ReviewFormModal
          reviewId={legacyReviewId}
          isManager={isManager}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setLegacyReviewId(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
