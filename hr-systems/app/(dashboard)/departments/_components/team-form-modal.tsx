"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface Employee { id: number; fullName: string }
interface DeptOption { id: number; name: string }

interface Props {
  team?: {
    id: number; name: string; code?: string | null;
    departments: { department: { id: number; name: string } }[];
    leadId?: number | null; description?: string | null; isActive: boolean;
  } | null;
  departments: DeptOption[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (t: any) => void;
}

export function TeamFormModal({ team, departments, employees, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState(team?.name ?? "");
  const [code, setCode] = useState(team?.code ?? "");
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<number>>(
    new Set(team?.departments.map(d => d.department.id) ?? [])
  );
  const [leadId, setLeadId] = useState<number | null>(team?.leadId ?? null);
  const [description, setDescription] = useState(team?.description ?? "");
  const [isActive, setIsActive] = useState(team?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleDept(id: number) {
    setSelectedDeptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = team ? `/api/teams/${team.id}` : "/api/teams";
      const method = team ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code || undefined,
          departmentIds: Array.from(selectedDeptIds),
          leadId,
          description: description || undefined,
          isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? json.error ?? "Lỗi lưu"); return; }
      toast({ title: team ? "Đã cập nhật nhóm" : "Đã thêm nhóm", description: name, variant: "default" });
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dm-modal open">
      <div className="dm-scrim" onClick={onClose} />
      <div className="dm-card">
        <h2>{team ? "Sửa nhóm" : "Thêm nhóm"}</h2>
        <button className="dm-close" type="button" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={16} height={16}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {error && (
            <div style={{ background:"var(--danger-soft)", color:"var(--danger)", borderRadius:9, padding:"10px 14px", fontSize:".85rem" }}>
              {error}
            </div>
          )}

          <div className="dm-grid">
            <div className="dm-f" style={{ gridColumn:"1 / -1" }}>
              <label>Tên nhóm *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="VD: Backend Team" />
            </div>
            <div className="dm-f">
              <label>Mã nhóm</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="VD: BE" />
            </div>
            <div className="dm-f">
              <label>Trạng thái</label>
              <select value={isActive ? "1" : "0"} onChange={e => setIsActive(e.target.value === "1")}>
                <option value="1">Hoạt động</option>
                <option value="0">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="dm-f">
            <label>Phòng ban liên kết <span style={{ fontWeight:400, color:"var(--text-3)" }}>(có thể chọn nhiều)</span></label>
            {departments.length === 0 ? (
              <div style={{ fontSize:".82rem", color:"var(--text-3)", fontStyle:"italic" }}>Chưa có phòng ban nào</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, maxHeight:140, overflowY:"auto" }}>
                {departments.map(d => {
                  const checked = selectedDeptIds.has(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDept(d.id)}
                      style={{
                        display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                        borderRadius:9, border:`1.5px solid ${checked ? "var(--accent)" : "var(--border-2)"}`,
                        background: checked ? "var(--accent-soft)" : "var(--content)",
                        color: checked ? "var(--accent-ink)" : "var(--text-2)",
                        fontSize:".82rem", fontWeight:600, textAlign:"left", cursor:"pointer",
                        transition:"all .15s", fontFamily:"inherit",
                      }}>
                      <span style={{
                        width:16, height:16, borderRadius:5, flexShrink:0, display:"grid", placeItems:"center",
                        background: checked ? "var(--accent)" : "var(--border-2)",
                        color:"#fff",
                      }}>
                        {checked && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" width={10} height={10}><path d="M5 12l5 5L20 7" /></svg>
                        )}
                      </span>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dm-f">
            <label>Trưởng nhóm</label>
            <select value={leadId ?? ""} onChange={e => setLeadId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Chưa chọn —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div className="dm-f">
            <label>Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} style={{ height:"auto", padding:"10px 12px", resize:"none" }} placeholder="Mô tả nhiệm vụ nhóm..." />
          </div>

          <div className="dm-foot">
            <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="abtn primary" disabled={loading}>
              {loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14} style={{ animation:"spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
