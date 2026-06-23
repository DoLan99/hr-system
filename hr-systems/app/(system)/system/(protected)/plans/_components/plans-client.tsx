"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface PlanConfig {
  id: string;
  name: string;
  priceVnd: number;
  seatLimit: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedBy: string | null;
}

interface Props { initialPlans: PlanConfig[] }

const PLAN_COLOR: Record<string, { accent: string; bg: string; border: string }> = {
  FREE:    { accent: "#94a3b8", bg: "rgba(148,163,184,.06)", border: "rgba(148,163,184,.2)" },
  STARTER: { accent: "#60a5fa", bg: "rgba(96,165,250,.06)",  border: "rgba(96,165,250,.2)"  },
  TEAM:    { accent: "#34d399", bg: "rgba(52,211,153,.06)",  border: "rgba(52,211,153,.2)"  },
};

function parseFeatures(f: unknown): string[] {
  if (Array.isArray(f)) return f as string[];
  try { return JSON.parse(String(f)); } catch { return []; }
}

export function PlansClient({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans);
  const [editing, setEditing] = useState<PlanConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [dName, setDName]         = useState("");
  const [dPrice, setDPrice]       = useState(0);
  const [dSeats, setDSeats]       = useState(1);
  const [dFeatures, setDFeatures] = useState<string[]>([]);

  function openEdit(plan: PlanConfig) {
    setEditing(plan);
    setDName(plan.name);
    setDPrice(plan.priceVnd);
    setDSeats(plan.seatLimit);
    setDFeatures([...parseFeatures(plan.features)]);
  }

  function closeEdit() { setEditing(null); }

  function updateFeature(idx: number, val: string) {
    setDFeatures(prev => prev.map((f, i) => i === idx ? val : f));
  }

  function removeFeature(idx: number) {
    setDFeatures(prev => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dName, priceVnd: dPrice, seatLimit: dSeats,
          features: dFeatures.filter(f => f.trim()),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setPlans(prev => prev.map(p => p.id === editing.id ? { ...p, ...json.data } : p));
        closeEdit();
        toast({ title: `Đã cập nhật gói ${dName}`, variant: "success" });
      } else {
        toast({ title: json.error ?? "Lỗi", variant: "error" });
      }
    } finally { setSaving(false); }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* plan table */
        .pt-wrap{background:#131a2e;border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden}
        .pt-head{display:grid;grid-template-columns:180px 1fr 110px 110px 130px 90px;gap:0;border-bottom:1px solid rgba(255,255,255,.07)}
        .pt-head span{padding:11px 18px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(180,200,255,.35)}
        .pt-row{display:grid;grid-template-columns:180px 1fr 110px 110px 130px 90px;gap:0;border-bottom:1px solid rgba(255,255,255,.05);transition:background .12s}
        .pt-row:last-child{border-bottom:none}
        .pt-row:hover{background:rgba(255,255,255,.02)}
        .pt-cell{padding:16px 18px;display:flex;align-items:center;font-size:.86rem;color:rgba(220,235,255,.85)}
        .pt-cell.feat{align-items:flex-start;flex-direction:column;gap:4px}
        .pt-plan-id{font-size:.68rem;font-weight:800;letter-spacing:.07em;padding:3px 8px;border-radius:6px;display:inline-block}
        .pt-plan-name{font-size:.95rem;font-weight:800;color:#e8eeff;margin-top:3px}
        .pt-price{font-size:.95rem;font-weight:700;color:#e8eeff;font-variant-numeric:tabular-nums}
        .pt-price-free{color:rgba(180,200,255,.4);font-size:.86rem}
        .pt-seat{font-size:1rem;font-weight:800;color:#e8eeff}
        .pt-feat-tag{font-size:.74rem;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.06);color:rgba(180,200,255,.6);white-space:nowrap}
        .pt-edit-btn{height:30px;padding:0 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(180,200,255,.7);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
        .pt-edit-btn:hover{background:rgba(255,255,255,.07);color:#e8eeff;border-color:rgba(255,255,255,.2)}
        /* modal */
        .pm-overlay{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.65);backdrop-filter:blur(4px)}
        .pm-box{background:#131a2e;border:1px solid rgba(255,255,255,.1);border-radius:16px;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.6)}
        .pm-header{padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:10}
        .pm-title{font-size:1rem;font-weight:800;color:#e8eeff}
        .pm-body{padding:22px 24px;display:flex;flex-direction:column;gap:16px}
        .pm-footer{padding:16px 24px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:flex-end;gap:8px}
        .pm-field{display:flex;flex-direction:column;gap:6px}
        .pm-label{font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(180,200,255,.45)}
        .pm-input{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 13px;color:#e8eeff;font-family:inherit;font-size:.88rem;outline:none;transition:border .15s;width:100%;box-sizing:border-box}
        .pm-input:focus{border-color:rgba(99,130,255,.6)}
        .pm-feat-row{display:flex;gap:8px;align-items:center}
        .pm-feat-row .pm-input{flex:1}
        .pm-rm{width:30px;height:30px;border-radius:7px;border:none;background:rgba(239,68,68,.1);color:#f87171;cursor:pointer;font-size:1.1rem;line-height:1;flex-shrink:0;transition:background .12s}
        .pm-rm:hover{background:rgba(239,68,68,.2)}
        .pm-add{background:rgba(255,255,255,.03);border:1.5px dashed rgba(255,255,255,.1);border-radius:9px;padding:9px;color:rgba(180,200,255,.4);font-size:.82rem;cursor:pointer;width:100%;font-family:inherit;transition:all .15s}
        .pm-add:hover{border-color:rgba(99,130,255,.4);color:rgba(180,200,255,.8)}
        .pm-btn{height:36px;padding:0 18px;border-radius:9px;font-size:.86rem;font-weight:700;cursor:pointer;font-family:inherit;border:none;transition:all .15s}
        .pm-btn.cancel{background:rgba(255,255,255,.05);color:rgba(180,200,255,.6);border:1px solid rgba(255,255,255,.1)}
        .pm-btn.cancel:hover{background:rgba(255,255,255,.08)}
        .pm-btn.primary{background:#3b5bdb;color:#fff}
        .pm-btn.primary:hover{background:#4c6ef5}
        .pm-btn:disabled{opacity:.4;cursor:not-allowed}
      ` }} />

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#e8eeff", letterSpacing: "-.02em", margin: 0 }}>
          Quản lý gói dịch vụ
        </h1>
        <p style={{ fontSize: ".84rem", color: "rgba(180,200,255,.4)", marginTop: 5 }}>
          Cấu hình tên, giá và giới hạn cho từng gói. Thay đổi có hiệu lực ngay trên trang billing của khách hàng.
        </p>
      </div>

      {/* Table */}
      <div className="pt-wrap">
        <div className="pt-head">
          <span>Gói</span>
          <span>Tính năng</span>
          <span>Giá / tháng</span>
          <span>Thành viên</span>
          <span>Cập nhật</span>
          <span></span>
        </div>
        {plans.map(plan => {
          const c = PLAN_COLOR[plan.id] ?? PLAN_COLOR.FREE;
          const feats = parseFeatures(plan.features);
          return (
            <div key={plan.id} className="pt-row">
              {/* Plan id + name */}
              <div className="pt-cell" style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                <span className="pt-plan-id" style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
                  {plan.id}
                </span>
                <span className="pt-plan-name">{plan.name}</span>
              </div>

              {/* Features */}
              <div className="pt-cell feat">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {feats.slice(0, 4).map((f, i) => (
                    <span key={i} className="pt-feat-tag">{f}</span>
                  ))}
                  {feats.length > 4 && (
                    <span className="pt-feat-tag" style={{ color: c.accent }}>+{feats.length - 4} nữa</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="pt-cell">
                {plan.priceVnd === 0
                  ? <span className="pt-price-free">Miễn phí</span>
                  : <span className="pt-price" style={{ color: c.accent }}>{plan.priceVnd.toLocaleString("vi-VN")}đ</span>
                }
              </div>

              {/* Seat limit */}
              <div className="pt-cell">
                <span className="pt-seat">{plan.seatLimit}</span>
                <span style={{ fontSize: ".74rem", color: "rgba(180,200,255,.35)", marginLeft: 5 }}>người</span>
              </div>

              {/* Updated */}
              <div className="pt-cell" style={{ flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                {plan.updatedBy
                  ? <>
                      <span style={{ fontSize: ".8rem", color: "rgba(180,200,255,.7)" }}>{plan.updatedBy}</span>
                      <span style={{ fontSize: ".72rem", color: "rgba(180,200,255,.3)" }}>
                        {new Date(plan.updatedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </>
                  : <span style={{ fontSize: ".76rem", color: "rgba(180,200,255,.25)" }}>—</span>
                }
              </div>

              {/* Edit button */}
              <div className="pt-cell" style={{ justifyContent: "center" }}>
                <button className="pt-edit-btn" onClick={() => openEdit(plan)}>
                  Sửa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor modal */}
      {editing && (() => {
        const c = PLAN_COLOR[editing.id] ?? PLAN_COLOR.FREE;
        return (
          <div className="pm-overlay" onClick={e => e.target === e.currentTarget && closeEdit()}>
            <div className="pm-box">
              <div className="pm-header">
                <span className="pt-plan-id" style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
                  {editing.id}
                </span>
                <span className="pm-title">Chỉnh sửa gói {editing.name}</span>
              </div>

              <div className="pm-body">
                <div className="pm-field">
                  <label className="pm-label">Tên gói</label>
                  <input className="pm-input" value={dName} onChange={e => setDName(e.target.value)} placeholder="VD: Starter" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="pm-field">
                    <label className="pm-label">Giá (VNĐ / tháng)</label>
                    <input className="pm-input" type="number" min={0} step={1000} value={dPrice}
                      onChange={e => setDPrice(Number(e.target.value))} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Giới hạn thành viên</label>
                    <input className="pm-input" type="number" min={1} max={9999} value={dSeats}
                      onChange={e => setDSeats(Number(e.target.value))} />
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Tính năng ({dFeatures.filter(f => f.trim()).length})</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dFeatures.map((f, i) => (
                      <div key={i} className="pm-feat-row">
                        <input className="pm-input" value={f}
                          onChange={e => updateFeature(i, e.target.value)}
                          placeholder={`Tính năng ${i + 1}`} />
                        <button className="pm-rm" onClick={() => removeFeature(i)}>×</button>
                      </div>
                    ))}
                    <button className="pm-add" onClick={() => setDFeatures(prev => [...prev, ""])}>
                      + Thêm tính năng
                    </button>
                  </div>
                </div>
              </div>

              <div className="pm-footer">
                <button className="pm-btn cancel" onClick={closeEdit} disabled={saving}>Hủy</button>
                <button className="pm-btn primary" onClick={save} disabled={saving || !dName.trim()}>
                  {saving ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
