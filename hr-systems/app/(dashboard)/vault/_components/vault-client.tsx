"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Copy, Lock, Globe, RotateCcw, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { VaultFormModal } from "./vault-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string }
interface CustomerOption { id: number; customerName?: string | null; businessName?: string | null }
interface VaultItem {
  id: number;
  scope: string;
  entityName?: string | null;
  customerId?: number | null;
  serviceApp?: string | null;
  loginUrl?: string | null;
  username?: string | null;
  emailUsed?: string | null;
  twoFaMethod?: string | null;
  ownerId?: number | null;
  rotationDays?: number | null;
  notes?: string | null;
  lastUpdated: string;
  customer?: { id: number; customerName?: string | null } | null;
  owner?: { id: number; fullName: string } | null;
}

interface Props {
  initialVaults: VaultItem[];
  employees: Employee[];
  customers: CustomerOption[];
  isManager: boolean;
}

export function VaultClient({ initialVaults, employees, customers, isManager }: Props) {
  const [vaults, setVaults] = useState<VaultItem[]>(initialVaults);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editingVault, setEditingVault] = useState<VaultItem | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [revealedPass, setRevealedPass] = useState<string>("");
  const [copied, setCopied] = useState<number | null>(null);

  const filtered = useMemo(() => vaults.filter(v => {
    if (filterScope !== "ALL" && v.scope !== filterScope) return false;
    if (search) {
      const q = search.toLowerCase();
      return (v.entityName?.toLowerCase().includes(q) ?? false) ||
        (v.serviceApp?.toLowerCase().includes(q) ?? false) ||
        (v.username?.toLowerCase().includes(q) ?? false) ||
        (v.emailUsed?.toLowerCase().includes(q) ?? false);
    }
    return true;
  }), [vaults, search, filterScope]);

  async function handleReveal(id: number) {
    if (revealedId === id) { setRevealedId(null); setRevealedPass(""); return; }
    const res = await fetch(`/api/vault/${id}`);
    const json = await res.json();
    if (res.ok) { setRevealedId(id); setRevealedPass(json.data.password); }
  }

  async function handleCopy(id: number, pass: string) {
    await navigator.clipboard.writeText(pass);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa mục này?")) return;
    await fetch(`/api/vault/${id}`, { method: "DELETE" });
    setVaults(prev => prev.filter(v => v.id !== id));
  }

  function upsert(v: VaultItem) {
    setVaults(prev => {
      const idx = prev.findIndex(x => x.id === v.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = v; return next; }
      return [v, ...prev];
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Password Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lưu trữ mật khẩu được mã hóa</p>
        </div>
        {isManager && (
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Thêm
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
            className="form-input pl-9" />
        </div>
        <div className="flex gap-1.5">
          {["ALL", "COMPANY", "CUSTOMER"].map(s => (
            <button key={s} onClick={() => setFilterScope(s)}
              className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition",
                filterScope === s ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {s === "ALL" ? "Tất cả" : s === "COMPANY" ? "Công ty" : "Khách hàng"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filtered.map(v => {
          const isRevealed = revealedId === v.id;
          const daysSinceUpdate = Math.floor((Date.now() - new Date(v.lastUpdated).getTime()) / 86400000);
          const isExpiring = v.rotationDays && daysSinceUpdate >= v.rotationDays;
          return (
            <div key={v.id} className={cn(
              "bg-white rounded-xl border p-4 space-y-3 shadow-card transition hover:shadow-card-md",
              isExpiring ? "border-amber-200 bg-amber-50/20" : "border-slate-200"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-md font-semibold",
                      v.scope === "COMPANY" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200")}>
                      {v.scope === "COMPANY" ? "Công ty" : "Khách hàng"}
                    </span>
                    <p className="font-semibold text-slate-900 text-[13.5px] truncate">
                      {v.entityName || v.serviceApp || "—"}
                    </p>
                  </div>
                  {v.serviceApp && v.entityName && (
                    <p className="text-[12px] text-slate-500 mt-0.5">{v.serviceApp}</p>
                  )}
                  {v.customer && <p className="text-[12px] text-slate-500">{v.customer.customerName}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {isManager && (
                    <button onClick={() => setEditingVault(v)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isManager && (
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-[12px] text-slate-600">
                {v.username && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 shrink-0">Username</span>
                    <span className="font-mono text-slate-700 truncate">{v.username}</span>
                  </div>
                )}
                {v.emailUsed && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 shrink-0">Email</span>
                    <span className="truncate">{v.emailUsed}</span>
                  </div>
                )}
                {v.twoFaMethod && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 shrink-0">2FA</span>
                    <span>{v.twoFaMethod}</span>
                  </div>
                )}
              </div>

              {/* Password reveal */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className={cn("flex-1 font-mono text-[12px] truncate", isRevealed ? "text-slate-900" : "text-slate-400 tracking-widest")}>
                  {isRevealed ? revealedPass : "••••••••••"}
                </span>
                <button onClick={() => handleReveal(v.id)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition" title={isRevealed ? "Ẩn" : "Hiện"}>
                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {isRevealed && (
                  <button onClick={() => handleCopy(v.id, revealedPass)}
                    className="p-1 text-slate-400 hover:text-slate-700 transition">
                    {copied === v.id
                      ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11.5px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="font-medium text-slate-500">{v.owner?.fullName}</span>
                <div className="flex items-center gap-1.5">
                  {isExpiring && <RotateCcw className="w-3 h-3 text-amber-500" />}
                  <span className={isExpiring ? "text-amber-600 font-medium" : ""}>
                    {daysSinceUpdate}d trước
                  </span>
                </div>
                {v.loginUrl && (
                  <a href={v.loginUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline">
                    <Globe className="w-3 h-3" /> Link
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">Không có mục nào</div>
      )}

      {(creating || editingVault) && (
        <VaultFormModal
          vault={editingVault}
          customers={customers}
          employees={employees}
          onClose={() => { setCreating(false); setEditingVault(null); }}
          onSaved={v => { upsert(v); setCreating(false); setEditingVault(null); }}
        />
      )}
    </div>
  );
}
