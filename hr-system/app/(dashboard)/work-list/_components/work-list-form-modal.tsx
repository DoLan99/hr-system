"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RichTextEditor = dynamic(
  () => import("@/components/shared/rich-text-editor").then(m => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-40 border border-slate-300 rounded-lg bg-slate-50 animate-pulse" /> }
);

const PRIORITY_OPTS = [
  { value: "CRITICAL", label: "🔴 Critical" },
  { value: "HIGH", label: "🟠 High" },
  { value: "NORMAL", label: "🔵 Normal" },
  { value: "LOW", label: "⚪ Low" },
];

const STATUS_OPTS = [
  { value: "NOT_STARTED", label: "Chưa bắt đầu" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "BLOCKED", label: "Bị block" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

const CATEGORY_OPTS = [
  { value: "Bug", label: "Bug" },
  { value: "Feature", label: "Feature" },
  { value: "Improvement", label: "Improvement" },
  { value: "Design", label: "Design" },
  { value: "Testing", label: "Testing" },
  { value: "DevOps", label: "DevOps" },
  { value: "Support", label: "Support" },
  { value: "Other", label: "Other" },
];

interface WorkListItem {
  wlId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  taskCode?: string | null;
  stdTime?: number | null;
  linkTemplate?: string | null;
  note1?: string | null;
  note2?: string | null;
  assignedToId: number;
  testerId?: number | null;
  priority: string;
  status?: string;
  dueDate?: string | null;
  customerId?: number | null;
  dateAssigned?: string;
}

interface Props {
  open: boolean;
  item?: WorkListItem | null;
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; name: string }[];
  onClose: () => void;
  onSaved: (item: any) => void;
}

function emptyForm() {
  return {
    title: "",
    description: "",
    category: "",
    taskCode: "",
    stdTime: "" as any,
    linkTemplate: "",
    note1: "",
    note2: "",
    assignedToId: "" as any,
    testerId: "" as any,
    priority: "NORMAL",
    status: "NOT_STARTED",
    dueDate: "",
    customerId: "" as any,
    dateAssigned: new Date().toISOString().slice(0, 10),
  };
}

function toDateStr(val: any) {
  if (!val) return "";
  try { return new Date(val).toISOString().slice(0, 10); } catch { return ""; }
}

export function WorkListFormModal({ open, item, employees, customers, onClose, onSaved }: Props) {
  const isEdit = !!item?.wlId;
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        title: item.title,
        description: item.description ?? "",
        category: item.category ?? "",
        taskCode: item.taskCode ?? "",
        stdTime: item.stdTime ?? ("" as any),
        linkTemplate: item.linkTemplate ?? "",
        note1: item.note1 ?? "",
        note2: item.note2 ?? "",
        assignedToId: item.assignedToId,
        testerId: item.testerId ?? ("" as any),
        priority: item.priority,
        status: item.status ?? "NOT_STARTED",
        dueDate: toDateStr(item.dueDate),
        customerId: item.customerId ?? ("" as any),
        dateAssigned: toDateStr(item.dateAssigned) || new Date().toISOString().slice(0, 10),
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [open, item]);

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Bắt buộc";
    if (!form.assignedToId) e.assignedToId = "Chọn nhân viên";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/work-list/${item!.wlId}` : "/api/work-list";
      const method = isEdit ? "PUT" : "POST";
      const body: any = {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        taskCode: form.taskCode || undefined,
        stdTime: form.stdTime ? Number(form.stdTime) : undefined,
        linkTemplate: form.linkTemplate || undefined,
        note1: form.note1 || undefined,
        note2: form.note2 || undefined,
        assignedToId: Number(form.assignedToId),
        testerId: form.testerId ? Number(form.testerId) : null,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        dateAssigned: form.dateAssigned || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) return;
      onSaved(json.data);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? `Sửa ${item!.wlId}` : "Tạo Work List mới"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {/* Row: Task Code + Std Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã task</label>
              <input
                value={form.taskCode}
                onChange={e => set("taskCode", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: DEV110, MKT001..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian chuẩn (phút)</label>
              <input
                type="number"
                min={0}
                value={form.stdTime}
                onChange={e => set("stdTime", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: 120"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên task <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.title ? "border-red-400" : "border-slate-300"
              )}
              placeholder="Mô tả ngắn công việc..."
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description - CKEditor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
            <RichTextEditor
              value={form.description}
              onChange={val => set("description", val)}
            />
          </div>

          {/* Row: Assigned To + Tester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Người xử lý <span className="text-red-500">*</span>
              </label>
              <select
                value={form.assignedToId}
                onChange={e => set("assignedToId", e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white",
                  errors.assignedToId ? "border-red-400" : "border-slate-300"
                )}
              >
                <option value="">-- Chọn --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
              {errors.assignedToId && <p className="text-red-500 text-xs mt-1">{errors.assignedToId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tester</label>
              <select
                value={form.testerId}
                onChange={e => set("testerId", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Không có --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại</label>
              <select
                value={form.category}
                onChange={e => set("category", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn loại --</option>
                {CATEGORY_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={e => set("priority", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PRIORITY_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Status + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUS_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set("dueDate", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: Date Assigned + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giao</label>
              <input
                type="date"
                value={form.dateAssigned}
                onChange={e => set("dateAssigned", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {customers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                <select
                  value={form.customerId}
                  onChange={e => set("customerId", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Không liên kết --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Link Template */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link template / tài liệu</label>
            <input
              value={form.linkTemplate}
              onChange={e => set("linkTemplate", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Row: Note 1 + Note 2 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú 1</label>
              <input
                value={form.note1}
                onChange={e => set("note1", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: for Dev"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú 2</label>
              <input
                value={form.note2}
                onChange={e => set("note2", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ghi chú thêm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
