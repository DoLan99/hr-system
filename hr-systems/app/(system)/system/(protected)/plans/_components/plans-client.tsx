"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface PlanConfig {
  id: string; name: string; priceVnd: number; seatLimit: number;
  features: string[]; isActive: boolean; sortOrder: number;
  updatedAt: string; updatedBy: string | null;
}
interface Props { initialPlans: PlanConfig[] }

const PLAN_COLOR: Record<string, { accent: string; bg: string }> = {
  FREE:    { accent: "#94a3b8", bg: "rgba(148,163,184,.1)" },
  STARTER: { accent: "var(--accent)", bg: "var(--accent-soft)" },
  TEAM:    { accent: "#a78bfa", bg: "rgba(167,139,250,.1)" },
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
    setEditing(plan); setDName(plan.name); setDPrice(plan.priceVnd);
    setDSeats(plan.seatLimit); setDFeatures([...parseFeatures(plan.features)]);
  }
  function closeEdit() { setEditing(null); }
  function updateFeature(idx: number, val: string) { setDFeatures(prev => prev.map((f, i) => i === idx ? val : f)); }
  function removeFeature(idx: number) { setDFeatures(prev => prev.filter((_, i) => i !== idx)); }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dName, priceVnd: dPrice, seatLimit: dSeats, features: dFeatures.filter(f => f.trim()) }),
      });
      const json = await res.json();
      if (res.ok) {
        setPlans(prev => prev.map(p => p.id === editing.id ? { ...p, ...json.data } : p));
        closeEdit(); toast({ title: `Đã cập nhật gói ${dName}`, variant: "success" });
      } else { toast({ title: json.error ?? "Lỗi", variant: "error" }); }
    } finally { setSaving(false); }
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Quản lý gói dịch vụ</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 5 }}>
          Cấu hình tên, giá và giới hạn cho từng gói. Thay đổi có hiệu lực ngay trên trang billing của khách hàng.
        </p>
      </div>

      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 130px 120px 150px 90px", borderBottom: "1px solid var(--border)", background: "var(--content)" }}>
          {["GÓI","TÍNH NĂNG","GIÁ / THÁNG","THÀNH VIÊN","CẬP NHẬT",""].map(h => (
            <span key={h} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)" }}>{h}</span>
          ))}
        </div>

        {plans.map(plan => {
          const c = PLAN_COLOR[plan.id] ?? PLAN_COLOR.FREE;
          const feats = parseFeatures(plan.features);
          return (
            <div key={plan.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 130px 120px 150px 90px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", padding: "2px 8px", borderRadius: 6, display: "inline-block", width: "fit-content", color: c.accent, background: c.bg }}>{plan.id}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{plan.name}</span>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {feats.slice(0, 4).map((f, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 5, background: "var(--content)", border: "1px solid var(--border)", color: "var(--text-2)", whiteSpace: "nowrap" }}>{f}</span>
                  ))}
                  {feats.length > 4 && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 5, color: c.accent, background: c.bg, fontWeight: 600 }}>+{feats.length - 4} nữa</span>}
                </div>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center" }}>
                {plan.priceVnd === 0
                  ? <span style={{ fontSize: 13, color: "var(--text-3)" }}>Miễn phí</span>
                  : <span style={{ fontSize: 15, fontWeight: 700, color: c.accent }}>{plan.priceVnd.toLocaleString("vi-VN")}đ</span>
                }
              </div>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{plan.seatLimit}</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>người</span>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                {plan.updatedBy
                  ? <><span style={{ fontSize: 12, color: "var(--text-2)" }}>{plan.updatedBy}</span><span style={{ fontSize: 11, color: "var(--text-3)" }}>{new Date(plan.updatedAt).toLocaleDateString("vi-VN")}</span></>
                  : <span style={{ fontSize: 12, color: "var(--text-3)" }}>—</span>
                }
              </div>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button onClick={() => openEdit(plan)} style={{
                  height: 30, padding: "0 14px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-2)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}>Sửa</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (() => {
        const c = PLAN_COLOR[editing.id] ?? PLAN_COLOR.FREE;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && closeEdit()}>
            <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", padding: "2px 8px", borderRadius: 6, color: c.accent, background: c.bg }}>{editing.id}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Chỉnh sửa gói {editing.name}</span>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Tên gói"><Input value={dName} onChange={e => setDName(e.target.value)} placeholder="VD: Starter" /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Giá (VNĐ / tháng)"><Input type="number" min={0} step={1000} value={dPrice} onChange={e => setDPrice(Number(e.target.value))} /></Field>
                  <Field label="Giới hạn thành viên"><Input type="number" min={1} max={9999} value={dSeats} onChange={e => setDSeats(Number(e.target.value))} /></Field>
                </div>
                <Field label={`Tính năng (${dFeatures.filter(f => f.trim()).length})`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dFeatures.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Input value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`Tính năng ${i + 1}`} />
                        <button onClick={() => removeFeature(i)} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: "rgba(239,68,68,.1)", color: "#ef4444", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => setDFeatures(prev => [...prev, ""])} style={{
                      background: "var(--content)", border: "1.5px dashed var(--border)", borderRadius: 9,
                      padding: 9, color: "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    }}>+ Thêm tính năng</button>
                  </div>
                </Field>
              </div>
              <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <MBtn ghost onClick={closeEdit} disabled={saving}>Hủy</MBtn>
                <MBtn onClick={save} disabled={saving || !dName.trim()}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</MBtn>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)" }}>{label}</label>
      {children}
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      background: "var(--content)", border: "1.5px solid var(--border)", borderRadius: 9,
      padding: "9px 13px", color: "var(--text)", fontFamily: "inherit", fontSize: 13,
      outline: "none", width: "100%", boxSizing: "border-box" as const,
    }} />
  );
}
function MBtn({ onClick, disabled, children, ghost }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; ghost?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 36, padding: "0 18px", borderRadius: 9, fontSize: 13, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? .5 : 1,
      background: ghost ? "var(--content)" : "var(--accent)",
      color: ghost ? "var(--text-2)" : "var(--accent-ink)",
      border: ghost ? "1px solid var(--border)" : "none", transition: "opacity .15s",
    }}>{children}</button>
  );
}
