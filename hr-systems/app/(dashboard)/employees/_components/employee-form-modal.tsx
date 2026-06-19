"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface Role { id: number; name: string; label: string }
interface DeptOption { id: number; name: string }
interface TeamOption { id: number; name: string }
interface CareerTrackOption { id: number; name: string; color: string | null; levels: { id: number; name: string; seniority: number }[] }

interface EmployeeItem {
  id: number;
  fullName: string;
  emailCompany: string;
  employeeCode?: string | null;
  departmentId?: number | null;
  teamId?: number | null;
  company?: string | null;
  emailGoogle?: string | null;
  emailPrivate?: string | null;
  mobileCompany?: string | null;
  payType: string;
  hourlyRate?: any;
  monthlySalary?: any;
  maxHoursMonth: number;
  bonusMPct: any;
  bonusAPct: any;
  bonusTPct: any;
  startDate?: string | null;
  status: string;
  managerId?: number | null;
  careerTrackId?: number | null;
  careerLevelId?: number | null;
  driveLink1?: string | null;
  role?: Role | null;
  careerTrack?: { id: number; name: string } | null;
  careerLevel?: { id: number; name: string } | null;
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
}

interface Props {
  employee: EmployeeItem | null;
  roles: Role[];
  managers: { id: number; fullName: string }[];
  departments: DeptOption[];
  teams: TeamOption[];
  onClose: () => void;
  onSaved: (emp: any) => void;
}

type Tab = "basic" | "profile" | "contract" | "bank" | "salary";

const TABS: { k: Tab; l: string }[] = [
  { k: "basic",    l: "Thông tin" },
  { k: "profile",  l: "Hồ sơ" },
  { k: "contract", l: "Hợp đồng" },
  { k: "bank",     l: "Ngân hàng" },
  { k: "salary",   l: "Lương" },
];

function d(v?: string | null) { return v ? String(v).slice(0, 10) : ""; }

export function EmployeeFormModal({ employee: emp, roles, managers, departments, teams, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!emp;
  const [tab, setTab] = useState<Tab>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [careerTracks, setCareerTracks] = useState<CareerTrackOption[]>([]);

  useEffect(() => {
    fetch("/api/career-tracks").then(r => r.ok ? r.json() : null)
      .then(d => d?.data && setCareerTracks(d.data))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    // basic
    fullName:      emp?.fullName ?? "",
    emailCompany:  emp?.emailCompany ?? "",
    roleId:        String(emp?.role?.id ?? roles[0]?.id ?? ""),
    employeeCode:  emp?.employeeCode ?? "",
    departmentId:  String(emp?.departmentId ?? (emp as any)?.dept?.id ?? ""),
    teamId:        String(emp?.teamId ?? (emp as any)?.team?.id ?? ""),
    company:       emp?.company ?? "",
    emailGoogle:   emp?.emailGoogle ?? "",
    emailPrivate:  emp?.emailPrivate ?? "",
    mobileCompany: emp?.mobileCompany ?? "",
    managerId:     String(emp?.managerId ?? (emp as any)?.manager?.id ?? ""),
    careerTrackId: String(emp?.careerTrackId ?? (emp as any)?.careerTrack?.id ?? ""),
    careerLevelId: String(emp?.careerLevelId ?? (emp as any)?.careerLevel?.id ?? ""),
    startDate:     d(emp?.startDate),
    status:        emp?.status ?? "ACTIVE",
    driveLink1:    emp?.driveLink1 ?? "",
    // personal / profile
    dob:           d(emp?.dob),
    gender:        emp?.gender ?? "",
    nationality:   emp?.nationality ?? "",
    permanentAddr: emp?.permanentAddr ?? "",
    currentAddr:   emp?.currentAddr ?? "",
    cccd:          emp?.cccd ?? "",
    cccdDate:      d(emp?.cccdDate),
    cccdPlace:     emp?.cccdPlace ?? "",
    emergencyName: emp?.emergencyName ?? "",
    emergencyRel:  emp?.emergencyRel ?? "",
    emergencyPhone:emp?.emergencyPhone ?? "",
    // contract
    contractType:  emp?.contractType ?? "",
    contractNo:    emp?.contractNo ?? "",
    contractStart: d(emp?.contractStart),
    contractEnd:   d(emp?.contractEnd),
    // bank
    bankName:      emp?.bankName ?? "",
    bankBranch:    emp?.bankBranch ?? "",
    bankAccount:   emp?.bankAccount ?? "",
    bankHolder:    emp?.bankHolder ?? "",
    // salary
    payType:       emp?.payType ?? "HOURLY",
    hourlyRate:    emp?.hourlyRate ? String(Number(emp.hourlyRate)) : "",
    monthlySalary: emp?.monthlySalary ? String(Number(emp.monthlySalary)) : "",
    maxHoursMonth: String(emp?.maxHoursMonth ?? 160),
    bonusMPct:     String(Number(emp?.bonusMPct ?? 0)),
    bonusAPct:     String(Number(emp?.bonusAPct ?? 0)),
    bonusTPct:     String(Number(emp?.bonusTPct ?? 0)),
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Auto-generate employee code when department changes (create mode only)
  useEffect(() => {
    if (isEdit) return;
    const params = new URLSearchParams();
    if (form.departmentId) params.set("departmentId", form.departmentId);
    fetch(`/api/employees/code-preview?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.code && setForm(p => ({ ...p, employeeCode: d.code })))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.departmentId, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const body: any = {
        fullName: form.fullName,
        roleId: Number(form.roleId),
        employeeCode: form.employeeCode || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        teamId: form.teamId ? Number(form.teamId) : null,
        company: form.company || undefined,
        emailGoogle: form.emailGoogle || undefined,
        emailPrivate: form.emailPrivate || undefined,
        mobileCompany: form.mobileCompany || undefined,
        payType: form.payType,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined,
        maxHoursMonth: Number(form.maxHoursMonth),
        bonusMPct: Number(form.bonusMPct),
        bonusAPct: Number(form.bonusAPct),
        bonusTPct: Number(form.bonusTPct),
        managerId: form.managerId ? Number(form.managerId) : null,
        careerTrackId: form.careerTrackId ? Number(form.careerTrackId) : null,
        careerLevelId: form.careerLevelId ? Number(form.careerLevelId) : null,
        startDate: form.startDate || undefined,
        status: form.status,
        driveLink1: form.driveLink1 || undefined,
        // personal
        dob: form.dob || null,
        gender: form.gender || null,
        nationality: form.nationality || null,
        permanentAddr: form.permanentAddr || null,
        currentAddr: form.currentAddr || null,
        cccd: form.cccd || null,
        cccdDate: form.cccdDate || null,
        cccdPlace: form.cccdPlace || null,
        emergencyName: form.emergencyName || null,
        emergencyRel: form.emergencyRel || null,
        emergencyPhone: form.emergencyPhone || null,
        // contract
        contractType: form.contractType || null,
        contractNo: form.contractNo || null,
        contractStart: form.contractStart || null,
        contractEnd: form.contractEnd || null,
        // bank
        bankName: form.bankName || null,
        bankBranch: form.bankBranch || null,
        bankAccount: form.bankAccount || null,
        bankHolder: form.bankHolder || null,
      };
      body.emailCompany = form.emailCompany;
      const url = isEdit ? `/api/employees/${emp!.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const text = await res.text().catch(() => "");
      let json: any = {};
      try { if (text) json = JSON.parse(text); } catch { /* ignore */ }
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : (text || "Lỗi không xác định")); return; }
      toast({ title: isEdit ? "Đã cập nhật nhân viên" : "Đã thêm nhân viên", description: form.fullName });
      onSaved(json.data);
    } finally { setLoading(false); }
  }

  return (
    <div className="dm-modal open">
      <div className="dm-scrim" onClick={onClose} />
      <div className="dm-card" style={{ maxWidth: 560, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <h2>{isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</h2>
        <button className="dm-close" type="button" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={16} height={16}><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* tabs */}
        <div style={{ display:"flex", gap:2, borderBottom:"1px solid var(--border)", margin:"0 -26px", padding:"0 26px", flexShrink:0, overflowX:"auto" }}>
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              style={{
                padding:"8px 14px", fontSize:".82rem", fontWeight:600, fontFamily:"inherit",
                borderBottom:`2px solid ${tab === t.k ? "var(--accent)" : "transparent"}`,
                color: tab === t.k ? "var(--accent-ink)" : "var(--text-3)",
                background:"none", border:"none",
                cursor:"pointer", whiteSpace:"nowrap", marginBottom:-1,
              }}>
              {t.l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:14, paddingTop:18 }}>
          {error && <div style={{ background:"var(--danger-soft)", color:"var(--danger)", borderRadius:9, padding:"10px 14px", fontSize:".85rem" }}>{error}</div>}

          {/* ── Thông tin cơ bản ── */}
          {tab === "basic" && (
            <>
              <div className="dm-grid">
                <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                  <label>Họ và tên *</label>
                  <input value={form.fullName} onChange={e => set("fullName", e.target.value)} required placeholder="Nguyễn Văn A" />
                </div>
                <div className="dm-f">
                  <label style={{ display:"flex", alignItems:"center", gap:6 }}>
                    Mã nhân viên
                    {!isEdit && <span style={{ fontSize:".72rem", color:"var(--text-3)", fontWeight:400 }}>tự sinh theo phòng ban</span>}
                  </label>
                  <input
                    value={form.employeeCode}
                    onChange={e => set("employeeCode", e.target.value)}
                    placeholder={isEdit ? "" : "Tự động sinh..."}
                    style={!isEdit ? { fontFamily:"var(--font-mono)", background:"var(--elev)", color:"var(--accent-ink)", fontWeight:700 } : undefined}
                  />
                </div>
                <div className="dm-f">
                  <label>SĐT công ty</label>
                  <input value={form.mobileCompany} onChange={e => set("mobileCompany", e.target.value)} placeholder="09xx xxx xxx" />
                </div>
              </div>
              <div className="dm-f">
                <label>Email công ty {!isEdit && "*"}</label>
                <input
                  type="email"
                  value={form.emailCompany}
                  onChange={e => set("emailCompany", e.target.value)}
                  required={!isEdit}
                  placeholder="nva@congty.vn"
                />
              </div>
              {!isEdit && (
                <div style={{ background:"var(--accent-soft)", color:"var(--accent-ink)", borderRadius:9, padding:"10px 14px", fontSize:".82rem" }}>
                  ✉ Nhân viên dùng email này để đăng ký tại trang <b>/sign-up</b> và sẽ tự động được thêm vào workspace.
                </div>
              )}
              <div className="dm-grid">
                <div className="dm-f">
                  <label>Vai trò *</label>
                  <select value={form.roleId} onChange={e => set("roleId", e.target.value)}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div className="dm-f">
                  <label>Trạng thái</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}>
                    <option value="ACTIVE">Đang làm việc</option>
                    <option value="PROBATION">Thử việc</option>
                    <option value="INACTIVE">Đã nghỉ</option>
                  </select>
                </div>
                <div className="dm-f">
                  <label>Phòng ban</label>
                  <select value={form.departmentId} onChange={e => set("departmentId", e.target.value)}>
                    <option value="">— Chọn phòng ban —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="dm-f">
                  <label>Nhóm</label>
                  <select value={form.teamId} onChange={e => set("teamId", e.target.value)}>
                    <option value="">— Chọn nhóm —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="dm-f">
                  <label>Quản lý trực tiếp</label>
                  <select value={form.managerId} onChange={e => set("managerId", e.target.value)}>
                    <option value="">— Không có —</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                </div>
                <div className="dm-f">
                  <label>Career Track</label>
                  <select value={form.careerTrackId} onChange={e => { set("careerTrackId", e.target.value); set("careerLevelId", ""); }}>
                    <option value="">— Chưa gán —</option>
                    {careerTracks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="dm-f">
                  <label>Career Level</label>
                  <select value={form.careerLevelId} onChange={e => set("careerLevelId", e.target.value)} disabled={!form.careerTrackId}>
                    <option value="">— Chưa gán —</option>
                    {(careerTracks.find(t => String(t.id) === form.careerTrackId)?.levels ?? [])
                      .sort((a, b) => a.seniority - b.seniority)
                      .map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                    }
                  </select>
                </div>
                <div className="dm-f">
                  <label>Ngày vào làm</label>
                  <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Email Google</label>
                  <input type="email" value={form.emailGoogle} onChange={e => set("emailGoogle", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Email cá nhân</label>
                  <input type="email" value={form.emailPrivate} onChange={e => set("emailPrivate", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── Hồ sơ cá nhân ── */}
          {tab === "profile" && (
            <>
              <div className="dm-grid">
                <div className="dm-f">
                  <label>Ngày sinh</label>
                  <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Giới tính</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)}>
                    <option value="">— Chọn —</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                  <label>Quốc tịch</label>
                  <input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="Việt Nam" />
                </div>
                <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                  <label>Địa chỉ thường trú</label>
                  <input value={form.permanentAddr} onChange={e => set("permanentAddr", e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" />
                </div>
                <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                  <label>Địa chỉ hiện tại</label>
                  <input value={form.currentAddr} onChange={e => set("currentAddr", e.target.value)} placeholder="Để trống nếu giống thường trú" />
                </div>
              </div>
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div style={{ fontSize:".78rem", fontWeight:700, color:"var(--text-3)", marginBottom:12, textTransform:"uppercase", letterSpacing:".06em", fontFamily:"var(--font-mono)" }}>Căn cước công dân (CCCD)</div>
                <div className="dm-grid">
                  <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                    <label>Số CCCD</label>
                    <input value={form.cccd} onChange={e => set("cccd", e.target.value)} placeholder="012345678901" maxLength={12} />
                  </div>
                  <div className="dm-f">
                    <label>Ngày cấp</label>
                    <input type="date" value={form.cccdDate} onChange={e => set("cccdDate", e.target.value)} />
                  </div>
                  <div className="dm-f">
                    <label>Nơi cấp</label>
                    <input value={form.cccdPlace} onChange={e => set("cccdPlace", e.target.value)} placeholder="Công an TP.HCM" />
                  </div>
                </div>
              </div>
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div style={{ fontSize:".78rem", fontWeight:700, color:"var(--text-3)", marginBottom:12, textTransform:"uppercase", letterSpacing:".06em", fontFamily:"var(--font-mono)" }}>Liên hệ khẩn cấp</div>
                <div className="dm-grid">
                  <div className="dm-f">
                    <label>Họ tên</label>
                    <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)} placeholder="Nguyễn Văn B" />
                  </div>
                  <div className="dm-f">
                    <label>Quan hệ</label>
                    <input value={form.emergencyRel} onChange={e => set("emergencyRel", e.target.value)} placeholder="Bố / Mẹ / Vợ…" />
                  </div>
                  <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                    <label>Điện thoại</label>
                    <input value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} placeholder="09xx xxx xxx" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Hợp đồng ── */}
          {tab === "contract" && (
            <div className="dm-grid">
              <div className="dm-f">
                <label>Loại hợp đồng</label>
                <select value={form.contractType} onChange={e => set("contractType", e.target.value)}>
                  <option value="">— Chọn —</option>
                  <option value="probation">Thử việc</option>
                  <option value="full">Toàn thời gian</option>
                  <option value="part">Bán thời gian</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div className="dm-f">
                <label>Số hợp đồng</label>
                <input value={form.contractNo} onChange={e => set("contractNo", e.target.value)} placeholder="HD-2026-001" />
              </div>
              <div className="dm-f">
                <label>Ngày ký</label>
                <input type="date" value={form.contractStart} onChange={e => set("contractStart", e.target.value)} />
              </div>
              <div className="dm-f">
                <label>Ngày hết hạn</label>
                <input type="date" value={form.contractEnd} onChange={e => set("contractEnd", e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Ngân hàng ── */}
          {tab === "bank" && (
            <div className="dm-grid">
              <div className="dm-f">
                <label>Ngân hàng</label>
                <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="Vietcombank" />
              </div>
              <div className="dm-f">
                <label>Chi nhánh</label>
                <input value={form.bankBranch} onChange={e => set("bankBranch", e.target.value)} placeholder="CN Hoàn Kiếm" />
              </div>
              <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                <label>Số tài khoản</label>
                <input value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} placeholder="1234567890" />
              </div>
              <div className="dm-f" style={{ gridColumn:"1/-1" }}>
                <label>Tên chủ tài khoản</label>
                <input value={form.bankHolder} onChange={e => set("bankHolder", e.target.value.toUpperCase())} placeholder="NGUYEN VAN A" style={{ textTransform:"uppercase" }} />
              </div>
            </div>
          )}

          {/* ── Lương & KPI ── */}
          {tab === "salary" && (
            <>
              <div className="dm-f">
                <label>Loại lương</label>
                <div style={{ display:"flex", gap:8 }}>
                  {[["HOURLY","Theo giờ"],["MONTHLY","Cố định tháng"],["CONTRACT","Hợp đồng"]].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => set("payType", v)}
                      style={{
                        flex:1, padding:"8px 0", borderRadius:9, fontSize:".82rem", fontWeight:600,
                        border:`1.5px solid ${form.payType === v ? "var(--accent)" : "var(--border-2)"}`,
                        background: form.payType === v ? "var(--accent-soft)" : "var(--content)",
                        color: form.payType === v ? "var(--accent-ink)" : "var(--text-2)",
                        cursor:"pointer", fontFamily:"inherit",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="dm-grid">
                {form.payType === "HOURLY" && (
                  <div className="dm-f">
                    <label>Giá giờ (USD)</label>
                    <input type="number" min={0} step="0.01" value={form.hourlyRate} onChange={e => set("hourlyRate", e.target.value)} placeholder="10.00" />
                  </div>
                )}
                {form.payType === "MONTHLY" && (
                  <div className="dm-f">
                    <label>Lương cố định (USD)</label>
                    <input type="number" min={0} step="0.01" value={form.monthlySalary} onChange={e => set("monthlySalary", e.target.value)} placeholder="2000.00" />
                  </div>
                )}
                <div className="dm-f">
                  <label>Giờ tối đa / tháng</label>
                  <input type="number" min={1} value={form.maxHoursMonth} onChange={e => set("maxHoursMonth", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Bonus M (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusMPct} onChange={e => set("bonusMPct", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Bonus A (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusAPct} onChange={e => set("bonusAPct", e.target.value)} />
                </div>
                <div className="dm-f">
                  <label>Bonus T (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusTPct} onChange={e => set("bonusTPct", e.target.value)} />
                </div>
              </div>
              <div className="dm-f">
                <label>Drive Link</label>
                <input value={form.driveLink1} onChange={e => set("driveLink1", e.target.value)} placeholder="https://drive.google.com/…" />
              </div>
            </>
          )}

          <div className="dm-foot">
            <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="abtn primary" disabled={loading}>
              {loading && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14} style={{ animation:"spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
              {isEdit ? "Lưu thay đổi" : "Thêm nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
