"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, Edit2, X, Save } from "lucide-react";

interface Skill {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
}

export function CatalogTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/skills").then(r => r.json());
    setSkills(res.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm("Disable skill này khỏi catalog?")) return;
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…</div>;
  }

  const byCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{skills.length} skill trong catalog</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Thêm skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-sm text-slate-500">
          Chưa có skill nào. Bắt đầu bằng cách thêm các skill phổ biến (vd: "React", "TypeScript", "PostgreSQL", "Communication"…).
        </div>
      ) : (
        Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{cat}</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map(s => (
                <div key={s.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                    {s.description && <p className="text-[11px] text-slate-500 truncate">{s.description}</p>}
                  </div>
                  <button onClick={() => setEditing(s)} className="p-1.5 text-slate-400 hover:text-blue-600 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showCreate && (
        <SkillFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchData(); }}
        />
      )}
      {editing && (
        <SkillFormModal
          skill={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function SkillFormModal({ skill, onClose, onSaved }: { skill?: Skill; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(skill?.name ?? "");
  const [category, setCategory] = useState(skill?.category ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const url = skill ? `/api/skills/${skill.id}` : "/api/skills";
      const method = skill ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: category || null, description: description || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {skill ? "Sửa skill" : "Thêm skill mới"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={save} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tên skill *</label>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="vd: React, PostgreSQL, Communication"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Nhóm</label>
            <input value={category} onChange={e => setCategory(e.target.value)}
              placeholder="vd: Frontend, Backend, Soft Skills, Tools"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mô tả</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" />
          </div>
          {error && <p className="text-xs text-red-600">{typeof error === "string" ? error : JSON.stringify(error)}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
