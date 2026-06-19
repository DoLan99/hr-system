"use client";

import React, { useState, useMemo, useEffect } from "react";
import { EmployeeFormModal } from "./_components/employee-form-modal";

const AV_COLORS = [
  "#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669",
  "#d97706","#dc2626","#0f766e","#b45309","#1d4ed8",
  "#6d28d9","#047857","#be185d","#0369a1",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

function getPerfColor(p: number) {
  if (p >= 9) return "#4ade80";
  if (p >= 8) return "#60a5fa";
  if (p >= 7) return "#fbbf24";
  return "#f87171";
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang làm việc", ON_LEAVE: "Nghỉ phép", PROBATION: "Thử việc", INACTIVE: "Đã nghỉ",
  active: "Đang làm việc", on_leave: "Nghỉ phép", probation: "Thử việc", inactive: "Đã nghỉ",
};

function statusBadgeClass(status: string) {
  const s = status?.toLowerCase();
  if (s === "active") return "badge active";
  if (s === "on_leave" || s === "leave") return "badge pending";
  if (s === "probation") return "badge processing";
  if (s === "inactive") return "badge inactive";
  return "badge";
}

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  avatarUrl?: string | null;
  emailCompany?: string | null;
  emailGoogle?: string | null;
  emailPrivate?: string | null;
  mobileCompany?: string | null;
  startDate?: string | null;
  status: string;
  departmentId?: number | null;
  teamId?: number | null;
  managerId?: number | null;
  company?: string | null;
  driveLink1?: string | null;
  // personal
  dob?: string | null;
  gender?: string | null;
  nationality?: string | null;
  permanentAddr?: string | null;
  currentAddr?: string | null;
  cccd?: string | null;
  cccdDate?: string | null;
  cccdPlace?: string | null;
  // contract
  contractType?: string | null;
  contractNo?: string | null;
  contractStart?: string | null;
  contractEnd?: string | null;
  // bank
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  // emergency
  emergencyName?: string | null;
  emergencyRel?: string | null;
  emergencyPhone?: string | null;
  // photos
  photoPortrait?: string | null;
  photoCccdFront?: string | null;
  photoCccdBack?: string | null;
  // salary
  payType?: string | null;
  hourlyRate?: string | null;
  monthlySalary?: string | null;
  maxHoursMonth?: number | null;
  bonusMPct?: string | null;
  bonusAPct?: string | null;
  bonusTPct?: string | null;
  dept?: { id: string; name: string } | null;
  role?: { id: string; name: string; label?: string | null } | null;
  manager?: { id: string; fullName: string } | null;
};

type Department = { id: string; name: string };
type Role = { id: string; name: string; label?: string | null };

type Props = {
  initialEmployees: Employee[];
  departments: Department[];
  roles: Role[];
  teams?: { id: string; name: string }[];
};

const CONTRACT_LABEL: Record<string, string> = { full:"Toàn thời gian", probation:"Thử việc", part:"Bán thời gian", freelance:"Freelance" };

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function PhotoSlot({ label, icon, empId, photoType, savedUrl, onUploaded }: {
  label: string;
  icon: React.ReactNode;
  empId: string;
  photoType: string;
  savedUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(savedUrl ?? null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // upload
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", photoType);
      const res = await fetch(`/api/employees/${empId}/photos`, { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) onUploaded(json.url);
    } finally { setUploading(false); }
  }

  return (
    <div className="photo-slot" title={label}>
      {preview
        ? <img src={preview} className="ps-preview" alt={label} />
        : <>
            <span className="ps-ico">{icon}</span>
            <span className="ps-lbl">{label}</span>
          </>}
      {uploading && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", display:"grid", placeItems:"center", borderRadius:8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" width={22} height={22} style={{ animation:"spin 1s linear infinite" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
      )}
      <input type="file" accept="image/*,image/heic" onChange={handleFile} />
    </div>
  );
}

function EmpDetailPanel({ emp, edTab, setEdTab, onClose, onEdit, onPhotoUploaded }: {
  emp: Employee; edTab: string; setEdTab: (t: string) => void;
  onClose: () => void; onEdit: () => void;
  onPhotoUploaded: (field: "photoPortrait"|"photoCccdFront"|"photoCccdBack", url: string) => void;
}) {
  const [stats, setStats] = useState<{ tasksDone: number; leaveDays: number; score: string | null; quarter: string } | null>(null);
  type EmpSkill = { id: number; currentLevel: number; notes?: string | null; skill: { id: number; name: string; category?: string | null } };
  const [empSkills, setEmpSkills] = useState<EmpSkill[]>([]);
  const [allSkills, setAllSkills] = useState<{ id: number; name: string; category?: string | null }[]>([]);
  const [skillLoading, setSkillLoading] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [pickSkillId, setPickSkillId] = useState("");
  const [pickLevel, setPickLevel] = useState("1");

  useEffect(() => {
    setStats(null);
    fetch(`/api/employees/${emp.id}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => {});
  }, [emp.id]);

  useEffect(() => {
    if (edTab !== "skills") return;
    setSkillLoading(true);
    Promise.all([
      fetch(`/api/employees/${emp.id}/skills`).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`/api/skills`).then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([es, as]) => {
      setEmpSkills(es.data ?? []);
      setAllSkills(as.data ?? []);
    }).finally(() => setSkillLoading(false));
  }, [emp.id, edTab]);

  async function handleAddSkill() {
    if (!pickSkillId) return;
    const res = await fetch(`/api/employees/${emp.id}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: Number(pickSkillId), currentLevel: Number(pickLevel) }),
    });
    if (res.ok) {
      const json = await res.json();
      setEmpSkills(prev => {
        const exists = prev.findIndex(s => s.skill.id === json.data.skill.id);
        return exists >= 0 ? prev.map((s, i) => i === exists ? json.data : s) : [...prev, json.data];
      });
      setAddingSkill(false);
      setPickSkillId("");
      setPickLevel("1");
    }
  }

  async function handleRemoveSkill(skillId: number) {
    await fetch(`/api/employees/${emp.id}/skills?skillId=${skillId}`, { method: "DELETE" });
    setEmpSkills(prev => prev.filter(s => s.skill.id !== skillId));
  }

  const color = getColor(emp.id);
  const initials = getInitials(emp.fullName);
  const email = emp.emailCompany || emp.emailGoogle || "—";
  const phone = emp.mobileCompany || "—";
  const roleName = emp.role?.label || emp.role?.name || "—";
  const deptName = emp.dept?.name || "—";
  const joinDate = fmtDate(emp.startDate);
  const joinY = emp.startDate ? (new Date().getFullYear() - new Date(emp.startDate).getFullYear()) : null;

  const daysLeft = emp.contractEnd
    ? Math.ceil((new Date(emp.contractEnd).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <>
      <div className="ed-head">
        <span style={{ fontSize:".84rem", fontFamily:"var(--font-mono)", color:"var(--text-3)" }}>Hồ sơ nhân viên</span>
        <button className="abtn ghost" style={{ height:30, fontSize:".8rem", marginLeft:"auto", marginRight:6 }} onClick={onEdit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Sửa
        </button>
        <button className="x" onClick={onClose} style={{ marginLeft:0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="ed-tabs">
        {[["overview","Tổng quan"],["profile","Hồ sơ"],["contract","Hợp đồng"],["bank","Ngân hàng"],["salary","Lương"]].map(([k,l]) => (
          <button key={k} className={`ed-tab${edTab === k ? " on" : ""}`} onClick={() => setEdTab(k)}>{l}</button>
        ))}
      </div>

      <div className="ed-body">
        {/* Hero */}
        <div className="ed-hero">
          <div className="av" style={{ background: color }}>
            {emp.avatarUrl
              ? <img src={emp.avatarUrl} alt={emp.fullName} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:16 }} />
              : initials}
          </div>
          <div className="info">
            <div className="name">{emp.fullName}</div>
            <div className="role">{roleName} · {deptName}</div>
            <div className="badges">
              <span className={statusBadgeClass(emp.status)}>{STATUS_LABEL[emp.status] || emp.status}</span>
              {emp.employeeCode && (
                <span style={{ fontSize:".74rem", fontFamily:"var(--font-mono)", color:"var(--text-3)", background:"var(--content)", padding:"2px 8px", borderRadius:6, border:"1px solid var(--border)" }}>
                  {emp.employeeCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab: Tổng quan */}
        {edTab === "overview" && (
          <>
            <div>
              <div className="ed-sect-h">Thông tin làm việc</div>
              <div className="ed-row"><span className="lbl">Mã NV</span><span className="val" style={{ fontFamily:"var(--font-mono)" }}>{emp.employeeCode || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Email</span><span className="val">{email}</span></div>
              <div className="ed-row"><span className="lbl">Điện thoại</span><span className="val">{phone}</span></div>
              <div className="ed-row"><span className="lbl">Phòng ban</span><span className="val">{deptName}</span></div>
              <div className="ed-row"><span className="lbl">Ngày vào làm</span><span className="val">{joinDate}{joinY !== null && joinY > 0 ? ` · ${joinY}+ năm` : ""}</span></div>
              <div className="ed-row"><span className="lbl">Trạng thái</span><span className={statusBadgeClass(emp.status)}>{STATUS_LABEL[emp.status] || emp.status}</span></div>
              {emp.manager && <div className="ed-row"><span className="lbl">Quản lý</span><span className="val">{emp.manager.fullName}</span></div>}
            </div>
            <div>
              <div className="ed-sect-h">Hiệu suất {stats?.quarter ?? ""}</div>
              <div className="ed-kpi-row">
                <div className="ed-kpi">
                  <div className="n" style={{ color: stats?.score ? getPerfColor(Number(stats.score)) : "var(--text-2)" }}>
                    {stats ? (stats.score ?? "—") : "…"}
                  </div>
                  <div className="l">Điểm KPI</div>
                </div>
                <div className="ed-kpi">
                  <div className="n">{stats ? stats.tasksDone : "…"}</div>
                  <div className="l">Tasks done</div>
                </div>
                <div className="ed-kpi">
                  <div className="n">{stats ? stats.leaveDays : "…"}</div>
                  <div className="l">Ngày phép</div>
                </div>
              </div>
            </div>
            <div>
              <div className="ed-sect-h">Thao tác nhanh</div>
              <div className="ed-actions">
                <a href={`mailto:${email}`} className="abtn primary" style={{ height:32, fontSize:".8rem", textDecoration:"none" }}>✉ Email</a>
                <a href={`/performance-reviews`} className="abtn ghost" style={{ height:32, fontSize:".8rem", textDecoration:"none" }}>★ Review</a>
              </div>
            </div>
          </>
        )}

        {/* Tab: Hồ sơ */}
        {edTab === "profile" && (
          <>
            <div>
              <div className="ed-sect-h">Thông tin cá nhân</div>
              <div className="ed-row"><span className="lbl">Ngày sinh</span><span className="val">{fmtDate(emp.dob)}</span></div>
              <div className="ed-row"><span className="lbl">Giới tính</span><span className="val">{emp.gender || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Quốc tịch</span><span className="val">{emp.nationality || "Việt Nam"}</span></div>
              <div className="ed-row"><span className="lbl">Địa chỉ thường trú</span><span className="val" style={{ textAlign:"right", maxWidth:"60%" }}>{emp.permanentAddr || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Địa chỉ hiện tại</span><span className="val" style={{ textAlign:"right", maxWidth:"60%" }}>{emp.currentAddr || "—"}</span></div>
            </div>
            <div>
              <div className="ed-sect-h">Căn cước công dân (CCCD)</div>
              <div className="ed-row"><span className="lbl">Số CCCD</span><span className="val" style={{ fontFamily:"var(--font-mono)", letterSpacing:".05em" }}>{emp.cccd || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Ngày cấp</span><span className="val">{fmtDate(emp.cccdDate)}</span></div>
              <div className="ed-row"><span className="lbl">Nơi cấp</span><span className="val" style={{ textAlign:"right", maxWidth:"60%", fontSize:".8rem" }}>{emp.cccdPlace || "—"}</span></div>
            </div>
            <div>
              <div className="ed-sect-h">Ảnh định danh</div>
              <div className="photo-slots">
                {([
                  { lbl:"Ảnh chân dung",  type:"portrait",   field:"photoPortrait"  as const, saved: emp.photoPortrait,  ico:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><circle cx={12} cy={10} r={3}/><path d="M6 21c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
                  { lbl:"CCCD mặt trước", type:"cccd_front", field:"photoCccdFront" as const, saved: emp.photoCccdFront, ico:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><circle cx={8.5} cy={8.5} r={1.5}/><path d="M21 15l-5-5L5 21"/></svg> },
                  { lbl:"CCCD mặt sau",   type:"cccd_back",  field:"photoCccdBack"  as const, saved: emp.photoCccdBack,  ico:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={2}/><circle cx={8.5} cy={8.5} r={1.5}/><path d="M21 15l-5-5L5 21"/></svg> },
                ] as const).map(({ lbl, type, field, saved, ico }) => (
                  <PhotoSlot key={type} label={lbl} icon={ico} empId={emp.id} photoType={type} savedUrl={saved} onUploaded={(url) => onPhotoUploaded(field, url)} />
                ))}
              </div>
              <p style={{ fontSize:".74rem", color:"var(--text-3)", marginTop:8 }}>Hỗ trợ JPG, PNG, HEIC — tối đa 5MB mỗi ảnh</p>
            </div>
            <div>
              <div className="ed-sect-h">Liên hệ khẩn cấp</div>
              <div className="ed-row"><span className="lbl">Họ tên</span><span className="val">{emp.emergencyName || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Quan hệ</span><span className="val">{emp.emergencyRel || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Điện thoại</span><span className="val">{emp.emergencyPhone || "—"}</span></div>
            </div>
          </>
        )}

        {/* Tab: Hợp đồng */}
        {edTab === "contract" && (
          <>
            <div>
              <div className="ed-sect-h">Hợp đồng lao động</div>
              <div className="ed-row"><span className="lbl">Loại hợp đồng</span><span className="val">{CONTRACT_LABEL[emp.contractType || ""] || emp.contractType || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Số hợp đồng</span><span className="val" style={{ fontFamily:"var(--font-mono)" }}>{emp.contractNo || "—"}</span></div>
              <div className="ed-row"><span className="lbl">Ngày ký</span><span className="val">{fmtDate(emp.contractStart)}</span></div>
              <div className="ed-row">
                <span className="lbl">Ngày hết hạn</span>
                <span className="val">
                  {fmtDate(emp.contractEnd)}
                  {daysLeft !== null && (
                    <span style={{ marginLeft:8, fontSize:".78rem", color: daysLeft < 0 ? "var(--danger)" : daysLeft < 90 ? "var(--warn)" : "var(--ok)" }}>
                      {daysLeft < 0 ? "Đã hết hạn" : `còn ${daysLeft} ngày`}
                    </span>
                  )}
                </span>
              </div>
              <div className="ed-row"><span className="lbl">Ngày vào làm</span><span className="val">{joinDate}</span></div>
              <div className="ed-row"><span className="lbl">Trạng thái</span><span className={statusBadgeClass(emp.status)}>{STATUS_LABEL[emp.status] || emp.status}</span></div>
            </div>
          </>
        )}

        {/* Tab: Ngân hàng */}
        {edTab === "bank" && (
          <div>
            <div className="ed-sect-h">Tài khoản ngân hàng</div>
            <div className="ed-row"><span className="lbl">Ngân hàng</span><span className="val">{emp.bankName || "—"}</span></div>
            <div className="ed-row"><span className="lbl">Chi nhánh</span><span className="val">{emp.bankBranch || "—"}</span></div>
            <div className="ed-row"><span className="lbl">Số tài khoản</span><span className="val" style={{ fontFamily:"var(--font-mono)", letterSpacing:".08em" }}>{emp.bankAccount || "—"}</span></div>
            <div className="ed-row"><span className="lbl">Chủ tài khoản</span><span className="val" style={{ textTransform:"uppercase" }}>{emp.bankHolder || "—"}</span></div>
          </div>
        )}

        {/* Tab: Lương */}
        {edTab === "salary" && (
          <div>
            <div className="ed-sect-h">Thông tin lương</div>
            <div className="ed-row">
              <span className="lbl">Loại lương</span>
              <span className="val">
                {emp.payType === "HOURLY" ? "Theo giờ" : emp.payType === "MONTHLY" ? "Cố định tháng" : emp.payType === "CONTRACT" ? "Hợp đồng" : "—"}
              </span>
            </div>
            {emp.payType === "HOURLY" && (
              <div className="ed-row">
                <span className="lbl">Giá giờ</span>
                <span className="val" style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent-ink)" }}>
                  {emp.hourlyRate ? `$${Number(emp.hourlyRate).toFixed(2)}/h` : "—"}
                </span>
              </div>
            )}
            {emp.payType === "MONTHLY" && (
              <div className="ed-row">
                <span className="lbl">Lương tháng</span>
                <span className="val" style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent-ink)" }}>
                  {emp.monthlySalary ? `$${Number(emp.monthlySalary).toLocaleString()}/tháng` : "—"}
                </span>
              </div>
            )}
            <div className="ed-row"><span className="lbl">Giờ tối đa/tháng</span><span className="val">{emp.maxHoursMonth ?? "—"} h</span></div>
            <div className="ed-sect-h" style={{ marginTop:16 }}>Hệ số thưởng</div>
            <div className="ed-row"><span className="lbl">Bonus M</span><span className="val">{emp.bonusMPct ? `${emp.bonusMPct}%` : "—"}</span></div>
            <div className="ed-row"><span className="lbl">Bonus A</span><span className="val">{emp.bonusAPct ? `${emp.bonusAPct}%` : "—"}</span></div>
            <div className="ed-row"><span className="lbl">Bonus T</span><span className="val">{emp.bonusTPct ? `${emp.bonusTPct}%` : "—"}</span></div>
          </div>
        )}

        {/* Tab: Kỹ năng */}
        {edTab === "skills" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div className="ed-sect-h" style={{ marginBottom:0 }}>Kỹ năng ({empSkills.length})</div>
              <button className="abtn ghost" style={{ height:28, fontSize:".78rem" }} onClick={() => setAddingSkill(v => !v)}>
                {addingSkill ? "Hủy" : "+ Thêm"}
              </button>
            </div>

            {addingSkill && (
              <div style={{ background:"var(--elev)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <select
                    value={pickSkillId}
                    onChange={e => setPickSkillId(e.target.value)}
                    style={{ flex:1, padding:"7px 10px", borderRadius:8, border:"1px solid var(--border-2)", background:"var(--content)", color:"var(--text)", fontSize:".84rem", fontFamily:"inherit" }}
                  >
                    <option value="">— Chọn kỹ năng —</option>
                    {allSkills.filter(s => !empSkills.find(es => es.skill.id === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={pickLevel}
                    onChange={e => setPickLevel(e.target.value)}
                    style={{ width:90, padding:"7px 10px", borderRadius:8, border:"1px solid var(--border-2)", background:"var(--content)", color:"var(--text)", fontSize:".84rem", fontFamily:"inherit" }}
                  >
                    {[1,2,3,4,5].map(l => <option key={l} value={l}>Lv {l}</option>)}
                  </select>
                </div>
                <button className="abtn primary" style={{ height:32, fontSize:".82rem" }} onClick={handleAddSkill} disabled={!pickSkillId}>
                  Thêm kỹ năng
                </button>
              </div>
            )}

            {skillLoading ? (
              <div style={{ color:"var(--text-3)", fontSize:".85rem", textAlign:"center", padding:"20px 0" }}>Đang tải...</div>
            ) : empSkills.length === 0 ? (
              <div style={{ color:"var(--text-3)", fontSize:".85rem", textAlign:"center", padding:"20px 0" }}>Chưa có kỹ năng nào</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {empSkills.map(es => (
                  <div key={es.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--elev)", borderRadius:9, border:"1px solid var(--border)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".85rem", fontWeight:600, color:"var(--text)" }}>{es.skill.name}</div>
                      {es.skill.category && <div style={{ fontSize:".74rem", color:"var(--text-3)" }}>{es.skill.category}</div>}
                    </div>
                    <div style={{ display:"flex", gap:3 }}>
                      {[1,2,3,4,5].map(l => (
                        <div key={l} style={{ width:10, height:10, borderRadius:"50%", background: l <= es.currentLevel ? "var(--accent)" : "var(--border-2)" }} />
                      ))}
                    </div>
                    <span style={{ fontSize:".74rem", color:"var(--text-3)", minWidth:28, textAlign:"center" }}>Lv{es.currentLevel}</span>
                    <button onClick={() => handleRemoveSkill(es.skill.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", padding:2, lineHeight:1, fontSize:"1rem" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export function EmployeesClient({ initialEmployees, departments, roles, teams = [] }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeDept, setActiveDept] = useState("Tất cả");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [edTab, setEdTab] = useState("overview");
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [addingEmp, setAddingEmp] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(
    initialEmployees.map(e => ({ ...e, id: String(e.id) }))
  );

  // KPI stats
  const total = employees.length;
  const activeCount = employees.filter((e) => e.status?.toLowerCase() === "active").length;
  const onLeaveCount = employees.filter((e) =>
    ["on_leave", "leave"].includes(e.status?.toLowerCase())
  ).length;
  const deptCount = new Set(employees.map((e) => e.dept?.name).filter(Boolean)).size;

  // Dept tabs
  const deptNames = ["Tất cả", ...departments.map((d) => d.name)];

  // Filtered employees
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (activeDept !== "Tất cả" && e.dept?.name !== activeDept) return false;
      if (statusFilter && e.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (roleFilter && !(e.role?.name?.toLowerCase().includes(roleFilter.toLowerCase()) || e.role?.label?.toLowerCase().includes(roleFilter.toLowerCase()))) return false;
      const q = search.toLowerCase();
      if (q) {
        const name = e.fullName?.toLowerCase() || "";
        const email = (e.emailCompany || e.emailGoogle || "").toLowerCase();
        const dept = e.dept?.name?.toLowerCase() || "";
        if (!name.includes(q) && !email.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [employees, activeDept, statusFilter, roleFilter, search]);

  return (
    <>
      {/* page-actions */}
      <div className="page-actions">
        <div>
          <h1>Nhân sự</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-3)", marginTop: 3 }}>
            Quản lý toàn bộ thành viên, phòng ban và hồ sơ nhân viên.
          </p>
        </div>
        <div className="page-actions-right">
          <button className="abtn ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button className="abtn primary" onClick={() => setAddingEmp(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 22 }}>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3"/>
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/>
                <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/>
              </svg>
            </span>
            Tổng nhân viên
          </div>
          <div className="kv">{total}</div>
          <div className="kc up">+1 tháng này</div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </span>
            Đang làm việc
          </div>
          <div className="kv">{activeCount}</div>
          <div className="kc up">{total > 0 ? Math.round((activeCount / total) * 100) : 0}% tổng</div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
              </svg>
            </span>
            Đang nghỉ phép
          </div>
          <div className="kv">{onLeaveCount}</div>
          <div className="kc flat">
            Thử việc: {employees.filter((e) => e.status?.toLowerCase() === "probation").length}
          </div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            Phòng ban
          </div>
          <div className="kv">{deptCount}</div>
          <div className="kc flat">{deptCount} phòng ban</div>
        </div>
      </div>

      {/* toolbar */}
      <div className="tools" style={{ marginBottom: 0 }}>
        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Grid
          </button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            List
          </button>
        </div>

        <select
          className="fchip"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 36, padding: "0 13px", borderRadius: 9, background: "var(--elev)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang làm việc</option>
          <option value="on_leave">Nghỉ phép</option>
          <option value="probation">Thử việc</option>
          <option value="inactive">Đã nghỉ việc</option>
        </select>

        <select
          className="fchip"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ height: 36, padding: "0 13px", borderRadius: 9, background: "var(--elev)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>{r.label || r.name}</option>
          ))}
        </select>

        <div className="spacer" />

        <div className="tsearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4-4"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm tên, email, phòng ban…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "0.84rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} nhân viên
        </div>
      </div>

      {/* dept tabs */}
      <div className="stabs" style={{ marginTop: 6, marginBottom: 18 }}>
        {deptNames.map((dept) => {
          const count =
            dept === "Tất cả"
              ? employees.length
              : employees.filter((e) => e.dept?.name === dept).length;
          return (
            <button
              key={dept}
              className={`stab${activeDept === dept ? " on" : ""}`}
              onClick={() => setActiveDept(dept)}
            >
              {dept}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  background: activeDept === dept ? "rgba(255,255,255,0.2)" : "var(--content)",
                  border: "1px solid var(--border)",
                  borderRadius: 99,
                  padding: "1px 7px",
                  color: activeDept === dept ? "inherit" : "var(--text-3)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* grid view */}
      {view === "grid" && (
        <div className="emp-grid">
          {filtered.map((emp) => {
            const initials = getInitials(emp.fullName);
            const color = getColor(emp.id);
            const email = emp.emailCompany || emp.emailGoogle || "";
            const roleName = emp.role?.label || emp.role?.name || "";
            const deptName = emp.dept?.name || "";
            const perf = 0; // no perf field in schema yet

            return (
              <div key={emp.id} className="emp-card" onClick={() => { setSelectedEmp(emp); setEdTab("overview"); }} style={{ cursor:"pointer" }}>
                <div className="eav" style={{ background: color }}>
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.fullName} />
                  ) : (
                    initials
                  )}
                </div>
                <div className="en">{emp.fullName}</div>
                <div className="er">{roleName || email}</div>
                {deptName && <span className="ed">{deptName}</span>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <span className={statusBadgeClass(emp.status)}>
                    {STATUS_LABEL[emp.status] || emp.status}
                  </span>
                  <span className="ep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }}>
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/>
                    </svg>
                    <span style={{ color: getPerfColor(perf) }}>—</span>
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
              Không tìm thấy nhân viên nào
            </div>
          )}
        </div>
      )}

      {/* list view */}
      {view === "list" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Ngày vào</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const initials = getInitials(emp.fullName);
                const color = getColor(emp.id);
                const email = emp.emailCompany || emp.emailGoogle || "";
                const roleName = emp.role?.label || emp.role?.name || "—";
                const deptName = emp.dept?.name || "—";
                const joinDate = emp.startDate
                  ? new Date(emp.startDate).toLocaleDateString("vi-VN")
                  : "—";

                return (
                  <tr key={emp.id} style={{ cursor: "pointer", transition: "background 0.12s" }} onClick={() => { setSelectedEmp(emp); setEdTab("overview"); }}>
                    <td>
                      <div
                        className="td-av"
                        style={{ width: 34, height: 34, borderRadius: 9, background: color, display: "grid", placeItems: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}
                      >
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} />
                        ) : (
                          initials
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="td-bold">{emp.fullName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{email}</div>
                    </td>
                    <td>{deptName}</td>
                    <td style={{ color: "var(--text)" }}>{roleName}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{joinDate}</td>
                    <td>
                      <span className={statusBadgeClass(emp.status)}>
                        {STATUS_LABEL[emp.status] || emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee detail panel */}
      <div className={`emp-scrim${selectedEmp ? " on" : ""}`} onClick={() => setSelectedEmp(null)} />
      <aside className={`emp-detail${selectedEmp ? " open" : ""}`}>
        {selectedEmp && <EmpDetailPanel
          emp={selectedEmp} edTab={edTab} setEdTab={setEdTab}
          onClose={() => setSelectedEmp(null)}
          onEdit={() => setEditingEmp(selectedEmp)}
          onPhotoUploaded={(field, url) => {
            setSelectedEmp(prev => prev ? { ...prev, [field]: url } : prev);
            setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, [field]: url } : e));
          }}
        />}
      </aside>

      {/* Add modal */}
      {addingEmp && (
        <EmployeeFormModal
          employee={null}
          roles={roles as any}
          managers={employees.map(e => ({ id: Number(e.id), fullName: e.fullName }))}
          departments={departments as any}
          teams={teams as any}
          onClose={() => setAddingEmp(false)}
          onSaved={(saved) => {
            const normalized = { ...saved, id: String(saved.id) } as Employee;
            setEmployees(prev => [...prev, normalized]);
            setSelectedEmp(normalized);
            setEdTab("overview");
            setAddingEmp(false);
          }}
        />
      )}

      {/* Edit modal */}
      {editingEmp && (
        <EmployeeFormModal
          key={`edit-${editingEmp.id}`}
          employee={editingEmp as any}
          roles={roles as any}
          managers={employees.map(e => ({ id: Number(e.id), fullName: e.fullName }))}
          departments={departments as any}
          teams={teams as any}
          onClose={() => setEditingEmp(null)}
          onSaved={(saved) => {
            const normalized = { ...saved, id: String(saved.id) } as Employee;
            setEmployees(prev => prev.map(e => e.id === normalized.id ? normalized : e));
            setSelectedEmp(normalized);
            setEditingEmp(null);
          }}
        />
      )}
    </>
  );
}
