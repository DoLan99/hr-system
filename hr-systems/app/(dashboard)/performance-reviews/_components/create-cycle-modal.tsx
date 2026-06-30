"use client";

import { useState } from "react";

const CSS = `
.cm-scrim{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:79}
.cm-card{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px}
.cm-box{position:relative;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:480px;padding:26px;display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow-lg)}
.cm-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;font-family:inherit}
.cm-close:hover{background:var(--content);color:var(--text)}
.cm-title{font-size:1rem;font-weight:800;color:var(--text);margin:0}
.cm-sub{font-size:.76rem;color:var(--text-3);margin-top:2px}
.cm-f{display:flex;flex-direction:column;gap:5px}
.cm-f label{font-size:.81rem;font-weight:600;color:var(--text-2)}
.cm-f input,.cm-f select{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;font-family:inherit;font-size:.88rem;color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.cm-f input:focus,.cm-f select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.cm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cm-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:6px;border-top:1px solid var(--border)}
.cm-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.cm-type-btn{padding:8px 0;border-radius:9px;border:1.5px solid var(--border-2);background:var(--content);color:var(--text-2);font-family:inherit;font-size:.82rem;font-weight:500;cursor:pointer;transition:all .15s;text-align:center}
.cm-type-btn:hover{border-color:var(--accent);color:var(--text)}
.cm-type-btn.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink);font-weight:700}
.cm-q-row{display:flex;gap:6px}
.cm-q-btn{flex:1;padding:7px 0;border-radius:8px;border:1.5px solid var(--border-2);background:var(--content);color:var(--text-2);font-family:var(--font-mono);font-size:.82rem;font-weight:700;cursor:pointer;transition:all .15s;text-align:center}
.cm-q-btn:hover{border-color:var(--accent);color:var(--accent-ink)}
.cm-q-btn.on{border-color:var(--accent);background:var(--accent);color:#fff}
.cm-note{display:flex;align-items:flex-start;gap:9px;padding:10px 13px;background:var(--accent-soft);border:1px solid var(--accent-soft-2);border-radius:9px;font-size:.76rem;color:var(--accent-ink);line-height:1.6}
.cm-err{font-size:.78rem;color:var(--danger);background:var(--danger-soft);padding:8px 12px;border-radius:8px;border-left:3px solid var(--danger)}
`;

export function CreateCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [periodType, setPeriodType] = useState<"QUARTERLY" | "ANNUAL" | "CUSTOM">("QUARTERLY");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(Math.ceil((now.getMonth() + 1) / 3) as any);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selfDueDate, setSelfDueDate] = useState("");
  const [managerDueDate, setManagerDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body: any = { periodType, year };
      if (periodType === "QUARTERLY") body.quarter = quarter;
      if (periodType === "CUSTOM") {
        body.periodStart = periodStart;
        body.periodEnd = periodEnd;
      }
      if (selfDueDate) body.selfDueDate = selfDueDate;
      if (managerDueDate) body.managerDueDate = managerDueDate;

      const res = await fetch("/api/performance-reviews/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? JSON.stringify(json.error) ?? "Lỗi tạo cycle");
        return;
      }
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cm-scrim" onClick={onClose} />
      <div className="cm-card" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <form className="cm-box" onSubmit={handleSubmit}>
          <button type="button" className="cm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div>
            <h2 className="cm-title">Tạo chu kỳ review mới</h2>
            <p className="cm-sub">Tự động sinh review cho tất cả nhân viên ACTIVE</p>
          </div>

          {/* Period type */}
          <div className="cm-f">
            <label>Loại chu kỳ</label>
            <div className="cm-type-grid">
              {([
                { val: "QUARTERLY", label: "Theo quý" },
                { val: "ANNUAL",    label: "Theo năm" },
                { val: "CUSTOM",    label: "Tùy chỉnh" },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  className={`cm-type-btn${periodType === opt.val ? " on" : ""}`}
                  onClick={() => setPeriodType(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year + Quarter */}
          <div className="cm-grid">
            <div className="cm-f">
              <label>Năm</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2020} max={2100}
              />
            </div>
            {periodType === "QUARTERLY" && (
              <div className="cm-f">
                <label>Quý</label>
                <div className="cm-q-row">
                  {([1, 2, 3, 4] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      className={`cm-q-btn${quarter === q ? " on" : ""}`}
                      onClick={() => setQuarter(q)}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom date range */}
          {periodType === "CUSTOM" && (
            <div className="cm-grid">
              <div className="cm-f">
                <label>Ngày bắt đầu</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
              </div>
              <div className="cm-f">
                <label>Ngày kết thúc</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
              </div>
            </div>
          )}

          {/* Due dates */}
          <div className="cm-grid">
            <div className="cm-f">
              <label>Hạn nộp self-review</label>
              <input type="date" value={selfDueDate} onChange={e => setSelfDueDate(e.target.value)} />
            </div>
            <div className="cm-f">
              <label>Hạn manager review</label>
              <input type="date" value={managerDueDate} onChange={e => setManagerDueDate(e.target.value)} />
            </div>
          </div>

          {/* Note */}
          <div className="cm-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
            Hệ thống sẽ tính Auto-KPI (Tốc độ / Chất lượng / Đúng hạn / Học hỏi / Chủ động) và đính kèm vào mỗi review. Quá trình có thể mất vài giây.
          </div>

          {error && <div className="cm-err">{error}</div>}

          <div className="cm-foot">
            <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="abtn primary" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13" style={{ animation: "spin .8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
              Tạo & mở cycle
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
