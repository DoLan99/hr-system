"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Rule {
  id: number;
  ruleNo: number;
  title: string;
  description: string;
  effectiveDate?: string | null;
  updatedAt: string;
}

interface Props { initialRules: Rule[] }

function RuleModal({ rule, onClose, onSaved }: {
  rule: Rule | null;
  onClose: () => void;
  onSaved: (r: any) => void;
}) {
  const [form, setForm] = useState({
    ruleNo: String(rule?.ruleNo ?? ""),
    title: rule?.title ?? "",
    description: rule?.description ?? "",
    effectiveDate: rule?.effectiveDate ? String(rule.effectiveDate).slice(0, 10) : "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ruleNo: Number(form.ruleNo),
        title: form.title,
        description: form.description,
        effectiveDate: form.effectiveDate || undefined,
      };
      const url = rule ? `/api/work-rules/${rule.id}` : "/api/work-rules";
      const method = rule ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">{rule ? "Sửa quy tắc" : "Thêm quy tắc"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Số thứ tự</label>
              <input type="number" min={1} value={form.ruleNo}
                onChange={e => setForm(p => ({ ...p, ruleNo: e.target.value }))}
                required className="form-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Ngày hiệu lực</label>
              <input type="date" value={form.effectiveDate}
                onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))}
                className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Tiêu đề</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required className="form-input" placeholder="Tiêu đề quy tắc..." />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Nội dung</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={5} required className="form-input resize-none"
              placeholder="Mô tả chi tiết quy tắc..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WorkRulesClient({ initialRules }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);

  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [creating, setCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Xóa quy tắc này?")) return;
    await fetch(`/api/work-rules/${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function upsert(r: Rule) {
    setRules(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      const next = idx >= 0 ? [...prev] : [r, ...prev];
      if (idx >= 0) next[idx] = r;
      return next.sort((a, b) => a.ruleNo - b.ruleNo);
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Quy tắc làm việc</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quy định nội bộ của công ty</p>
        </div>
        {isManager && (
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Thêm quy tắc
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {rules.map((r, idx) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card group">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[13px] font-bold shrink-0 border border-blue-100">
                {r.ruleNo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-[13.5px] font-semibold text-slate-900">{r.title}</h3>
                      {r.effectiveDate && (
                        <span className="text-[11.5px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Hiệu lực {format(new Date(r.effectiveDate), "dd/MM/yyyy", { locale: vi })}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{r.description}</p>
                  </div>
                  {isManager && (
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingRule(r)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">Chưa có quy tắc nào</div>
        )}
      </div>

      {(creating || editingRule) && (
        <RuleModal
          rule={editingRule}
          onClose={() => { setCreating(false); setEditingRule(null); }}
          onSaved={r => { upsert(r); setCreating(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}
