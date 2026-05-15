"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Trash2, ExternalLink, Clock, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { MessageFormModal } from "./message-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string }
interface CustomerOption { id: number; customerName?: string | null; businessName?: string | null }
interface MessageItem {
  id: number;
  date: string;
  channel?: string | null;
  customerId?: number | null;
  subject?: string | null;
  messageSummary?: string | null;
  actionRequired?: string | null;
  assignedToId?: number | null;
  dueDate?: string | null;
  status: string;
  linkFile?: string | null;
  tags?: string | null;
  valueType?: string | null;
  supportTime?: number | null;
  benefitTime?: number | null;
  netTime?: number | null;
  followUpNote?: string | null;
  companyAnswer?: string | null;
  closedDate?: string | null;
  customer?: { id: number; customerName?: string | null; businessName?: string | null } | null;
  assignedTo?: { id: number; fullName: string } | null;
}

interface Props {
  initialMessages: MessageItem[];
  employees: Employee[];
  customers: CustomerOption[];
  currentUserId: number;
}

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-700",
  SLACK: "bg-purple-100 text-purple-700",
  PHONE: "bg-green-100 text-green-700",
  ZALO: "bg-cyan-100 text-cyan-700",
  CHAT: "bg-yellow-100 text-yellow-700",
  OTHER: "bg-slate-100 text-slate-600",
};
const VALUE_COLORS: Record<string, string> = {
  A: "bg-red-100 text-red-700",
  B: "bg-yellow-100 text-yellow-700",
  C: "bg-slate-100 text-slate-500",
};

export function MessagesClient({ initialMessages, employees, customers, currentUserId }: Props) {
  const { data: session } = useSession();
  const { t, locale } = useLocale();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const dateFnsLocale = locale === "vi" ? viLocale : undefined;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    OPEN: { label: t("messageStatus.OPEN"), color: "text-blue-600", icon: <Circle className="w-3.5 h-3.5" /> },
    IN_PROGRESS: { label: t("messageStatus.IN_PROGRESS"), color: "text-yellow-600", icon: <Clock className="w-3.5 h-3.5" /> },
    CLOSED: { label: t("messageStatus.CLOSED"), color: "text-green-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  };

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterChannel, setFilterChannel] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);

  const filtered = useMemo(() => messages.filter(m => {
    if (filterStatus !== "ALL" && m.status !== filterStatus) return false;
    if (filterChannel !== "ALL" && m.channel !== filterChannel) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.subject?.toLowerCase().includes(q) ?? false) ||
        (m.messageSummary?.toLowerCase().includes(q) ?? false) ||
        (m.customer?.customerName?.toLowerCase().includes(q) ?? false) ||
        (m.tags?.toLowerCase().includes(q) ?? false);
    }
    return true;
  }), [messages, search, filterStatus, filterChannel]);

  async function handleDelete(id: number) {
    if (!confirm(t("messages.deleteConfirm"))) return;
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  async function toggleStatus(m: MessageItem) {
    const nextStatus = m.status === "OPEN" ? "IN_PROGRESS" : m.status === "IN_PROGRESS" ? "CLOSED" : "OPEN";
    const res = await fetch(`/api/messages/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    if (res.ok) upsert(json.data);
  }

  function upsert(m: MessageItem) {
    setMessages(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
      return [m, ...prev];
    });
  }

  const stats = {
    open: messages.filter(m => m.status === "OPEN").length,
    inProgress: messages.filter(m => m.status === "IN_PROGRESS").length,
    closed: messages.filter(m => m.status === "CLOSED").length,
    totalNetTime: messages.reduce((s, m) => s + (m.netTime ?? 0), 0),
  };

  const channels = [...new Set(messages.map(m => m.channel).filter(Boolean))] as string[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("messages.title")}</h1>
          <p className="text-sm text-slate-500">{t("messages.subtitle")}</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> {t("messages.add")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("messageStatus.OPEN"), value: stats.open, color: "text-blue-600" },
          { label: t("messageStatus.IN_PROGRESS"), value: stats.inProgress, color: "text-yellow-600" },
          { label: t("messageStatus.CLOSED"), value: stats.closed, color: "text-green-600" },
          { label: t("messages.netTime"), value: stats.totalNetTime, color: "text-slate-800" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("common.search")}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {s === "ALL" ? t("common.all") : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
        {channels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterChannel("ALL")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterChannel === "ALL" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-600")}>
              {t("messages.allChannels")}
            </button>
            {channels.map(c => (
              <button key={c} onClick={() => setFilterChannel(c)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  filterChannel === c ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-600")}>
                {t(`messageChannel.${c}`) || c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(m => {
          const statusCfg = statusConfig[m.status] ?? statusConfig.OPEN;
          const custName = m.customer?.customerName || m.customer?.businessName;
          const isOverdue = m.dueDate && m.status !== "CLOSED" && new Date(m.dueDate) < new Date();
          return (
            <div key={m.id} className={cn(
              "bg-white rounded-xl border p-4 transition",
              isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-100 hover:border-blue-200"
            )}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleStatus(m)}
                  className={cn("mt-0.5 transition hover:opacity-70 shrink-0", statusCfg.color)}>
                  {statusCfg.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.channel && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", CHANNEL_COLORS[m.channel] ?? "bg-slate-100 text-slate-600")}>
                        {t(`messageChannel.${m.channel}`) || m.channel}
                      </span>
                    )}
                    {m.valueType && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-bold", VALUE_COLORS[m.valueType] ?? "bg-slate-100 text-slate-500")}>
                        {m.valueType}
                      </span>
                    )}
                    {m.subject && <span className="text-sm font-semibold text-slate-900 truncate">{m.subject}</span>}
                    {custName && <span className="text-xs text-slate-500">{custName}</span>}
                    <span className="text-xs text-slate-400 ml-auto shrink-0">
                      {format(new Date(m.date), "dd/MM/yyyy", { locale: dateFnsLocale })}
                    </span>
                  </div>
                  {m.messageSummary && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{m.messageSummary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                    {m.assignedTo && <span>{m.assignedTo.fullName}</span>}
                    {m.dueDate && (
                      <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                        {t("messages.due")} {format(new Date(m.dueDate), "dd/MM/yyyy", { locale: dateFnsLocale })}
                      </span>
                    )}
                    {m.netTime !== null && m.netTime !== undefined && (
                      <span className={m.netTime >= 0 ? "text-green-600" : "text-red-500"}>
                        {t("messages.net")} {m.netTime}p
                      </span>
                    )}
                    {m.linkFile && (
                      <a href={m.linkFile} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-blue-600 hover:underline">
                        <ExternalLink className="w-3 h-3" /> File
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingMessage(m)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {isManager && (
                    <button onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">{t("messages.noMessages")}</div>
        )}
      </div>

      {(creating || editingMessage) && (
        <MessageFormModal
          message={editingMessage}
          employees={employees}
          customers={customers}
          currentUserId={currentUserId}
          onClose={() => { setCreating(false); setEditingMessage(null); }}
          onSaved={m => { upsert(m); setCreating(false); setEditingMessage(null); }}
        />
      )}
    </div>
  );
}
