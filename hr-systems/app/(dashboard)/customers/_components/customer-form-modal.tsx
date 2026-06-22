"use client";

import { useState } from "react";

interface Employee { id: number; fullName: string }
interface CustomerItem {
  id: number;
  customerName?: string | null;
  businessName?: string | null;
  custId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  plz?: string | null;
  website?: string | null;
  vatTaxId?: string | null;
  preferredLanguage?: string | null;
  status: string;
  responsibleStaffId?: number | null;
  customerSince?: string | null;
  contractRenewDate?: string | null;
  notes?: string | null;
}

interface Props {
  customer: CustomerItem | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: (c: any) => void;
}

const STATUSES = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "PROSPECT", label: "Tiềm năng" },
  { value: "INACTIVE", label: "Không hoạt động" },
];

const LANGUAGES = ["Vietnamese", "English", "German", "French", "Japanese", "Chinese"];

export function CustomerFormModal({ customer, employees, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"info" | "contact">("info");
  const [form, setForm] = useState({
    customerName: customer?.customerName ?? "",
    businessName: customer?.businessName ?? "",
    custId: customer?.custId ?? "",
    contactPerson: customer?.contactPerson ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    plz: customer?.plz ?? "",
    website: customer?.website ?? "",
    vatTaxId: customer?.vatTaxId ?? "",
    preferredLanguage: customer?.preferredLanguage ?? "",
    status: customer?.status ?? "ACTIVE",
    responsibleStaffId: String(customer?.responsibleStaffId ?? ""),
    customerSince: customer?.customerSince ? String(customer.customerSince).slice(0, 10) : "",
    contractRenewDate: customer?.contractRenewDate ? String(customer.contractRenewDate).slice(0, 10) : "",
    notes: customer?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        customerName: form.customerName || undefined,
        businessName: form.businessName || undefined,
        custId: form.custId || undefined,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        plz: form.plz || undefined,
        website: form.website || undefined,
        vatTaxId: form.vatTaxId || undefined,
        preferredLanguage: form.preferredLanguage || undefined,
        status: form.status,
        responsibleStaffId: form.responsibleStaffId ? Number(form.responsibleStaffId) : undefined,
        customerSince: form.customerSince || null,
        contractRenewDate: form.contractRenewDate || null,
        notes: form.notes || undefined,
      };
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra");
        return;
      }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .cm-modal{width:100%;max-width:560px;max-height:92vh;background:var(--elev);border:1px solid var(--border-2);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
        .cm-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .cm-head .ico{width:32px;height:32px;border-radius:8px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
        .cm-head .ico svg{width:17px;height:17px;color:#fff}
        .cm-head h3{font-size:1rem;font-weight:700;color:var(--text)}
        .cm-head .x{margin-left:auto;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none}
        .cm-head .x:hover{background:var(--content);color:var(--text)}
        .cm-head .x svg{width:17px;height:17px}
        .cm-tabs{display:flex;gap:0;padding:0 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .cm-tab{background:none;border:none;padding:10px 14px;margin-bottom:-1px;font-family:inherit;font-size:.82rem;font-weight:600;color:var(--text-3);cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
        .cm-tab:hover{color:var(--text-2)}
        .cm-tab.on{color:var(--accent-ink);border-bottom-color:var(--accent)}
        .cm-body{flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:14px}
        .cm-foot{flex-shrink:0;display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--border)}
        .cm-field{display:flex;flex-direction:column;gap:6px}
        .cm-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
        .cm-field input,.cm-field select,.cm-field textarea{font-family:inherit;font-size:.9rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
        .cm-field input:focus,.cm-field select:focus,.cm-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .cm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:500px){.cm-row{grid-template-columns:1fr}}
        .cm-err{font-size:.78rem;color:var(--danger);background:var(--danger-soft);padding:8px 12px;border-radius:8px;border-left:3px solid var(--danger)}
        .spin{animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      ` }} />

      <form className="cm-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="cm-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
          </div>
          <h3>{customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</h3>
          <button type="button" className="x" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="cm-tabs">
          <button type="button" className={`cm-tab${tab === "info" ? " on" : ""}`} onClick={() => setTab("info")}>
            Thông tin
          </button>
          <button type="button" className={`cm-tab${tab === "contact" ? " on" : ""}`} onClick={() => setTab("contact")}>
            Liên hệ & Địa chỉ
          </button>
        </div>

        <div className="cm-body">
          {tab === "info" && (
            <>
              <div className="cm-row">
                <div className="cm-field">
                  <label>Tên khách hàng</label>
                  <input value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="cm-field">
                  <label>Tên doanh nghiệp</label>
                  <input value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="ABC Co., Ltd" />
                </div>
              </div>

              <div className="cm-row">
                <div className="cm-field">
                  <label>Mã KH</label>
                  <input value={form.custId} onChange={e => set("custId", e.target.value)} placeholder="KH001" />
                </div>
                <div className="cm-field">
                  <label>MST</label>
                  <input value={form.vatTaxId} onChange={e => set("vatTaxId", e.target.value)} />
                </div>
              </div>

              <div className="cm-row">
                <div className="cm-field">
                  <label>Trạng thái</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label>Nhân viên phụ trách</label>
                  <select value={form.responsibleStaffId} onChange={e => set("responsibleStaffId", e.target.value)}>
                    <option value="">— Không có —</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="cm-row">
                <div className="cm-field">
                  <label>Khách từ</label>
                  <input type="date" value={form.customerSince} onChange={e => set("customerSince", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>Gia hạn hợp đồng</label>
                  <input type="date" value={form.contractRenewDate} onChange={e => set("contractRenewDate", e.target.value)} />
                </div>
              </div>

              <div className="cm-field">
                <label>Ngôn ngữ ưu tiên</label>
                <select value={form.preferredLanguage} onChange={e => set("preferredLanguage", e.target.value)}>
                  <option value="">— Chọn —</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="cm-field">
                <label>Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Ghi chú về khách hàng…"
                  style={{ minHeight: 70, resize: "vertical" }}
                />
              </div>
            </>
          )}

          {tab === "contact" && (
            <>
              <div className="cm-row">
                <div className="cm-field">
                  <label>Người liên hệ</label>
                  <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>Điện thoại</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
              </div>

              <div className="cm-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>

              <div className="cm-field">
                <label>Website</label>
                <input type="url" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://…" />
              </div>

              <div className="cm-field">
                <label>Địa chỉ</label>
                <input value={form.address} onChange={e => set("address", e.target.value)} />
              </div>

              <div className="cm-row">
                <div className="cm-field">
                  <label>Thành phố</label>
                  <input value={form.city} onChange={e => set("city", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>PLZ</label>
                  <input value={form.plz} onChange={e => set("plz", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {error && <div className="cm-err">{error}</div>}
        </div>

        <div className="cm-foot">
          <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="abtn primary" disabled={loading}>
            {loading && (
              <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {customer ? "Cập nhật" : "Thêm khách hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
