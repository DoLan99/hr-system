"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ExternalLink, Clock, CheckCircle2, Circle, Reply } from "lucide-react";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { MessageFormModal } from "./message-form-modal";
import { ReplyModal } from "./reply-modal";

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
  isOverdue?: boolean;
  senderName?: string | null;
  senderContact?: string | null;
  customer?: { id: number; customerName?: string | null; businessName?: string | null } | null;
  assignedTo?: { id: number; fullName: string } | null;
}

interface Props {
  initialMessages: MessageItem[];
  initialTotal: number;
  pageSize: number;
  employees: Employee[];
  customers: CustomerOption[];
  currentUserId: number;
  isManager: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-100 dark:bg-blue-950/60 text-blue-700",
  SLACK: "bg-purple-100 dark:bg-purple-950/60 text-purple-700",
  PHONE: "bg-green-100 dark:bg-green-950/60 text-green-700",
  ZALO: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700",
  CHAT: "bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700",
  OTHER: "bg-slate-100 dark:bg-slate-800 text-slate-600",
};
const VALUE_COLORS: Record<string, string> = {
  A: "bg-red-100 dark:bg-red-950/60 text-red-700",
  B: "bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700",
  C: "bg-slate-100 dark:bg-slate-800 text-slate-500",
};

export function MessagesClient({ initialMessages, initialTotal, pageSize, employees, customers, currentUserId, isManager }: Props) {
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "vi" ? viLocale : undefined;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    OPEN: { label: t("messageStatus.OPEN"), color: "text-blue-600", icon: <Circle className="w-3.5 h-3.5" /> },
    IN_PROGRESS: { label: t("messageStatus.IN_PROGRESS"), color: "text-yellow-600", icon: <Clock className="w-3.5 h-3.5" /> },
    CLOSED: { label: t("messageStatus.CLOSED"), color: "text-green-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  };

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterChannel, setFilterChannel] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<MessageItem | null>(null);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({ page: String(nextPage), limit: String(pageSize) });
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterChannel !== "ALL") params.set("channel", filterChannel);
      const res = await fetch(`/api/messages?${params}`);
      const json = await res.json();
      if (res.ok) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          return [...prev, ...json.data.filter((m: MessageItem) => !ids.has(m.id))];
        });
        setTotal(json.total);
        setCurrentPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  }

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
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4">
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
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200")}>
              {s === "ALL" ? t("common.all") : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
        {channels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterChannel("ALL")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterChannel === "ALL" ? "bg-gray-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600")}>
              {t("messages.allChannels")}
            </button>
            {channels.map(c => (
              <button key={c} onClick={() => setFilterChannel(c)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  filterChannel === c ? "bg-gray-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600")}>
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
          const isOverdue = m.isOverdue ?? (m.dueDate && m.status !== "CLOSED" && new Date(m.dueDate) < new Date());
          return (
            <div key={m.id} className={cn(
              "bg-white dark:bg-slate-900 rounded-xl border p-4 transition",
              isOverdue ? "border-red-200 dark:border-red-800 bg-red-50/30" : "border-slate-100 dark:border-slate-800 hover:border-blue-200"
            )}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleStatus(m)}
                  className={cn("mt-0.5 transition hover:opacity-70 shrink-0", statusCfg.color)}>
                  {statusCfg.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.channel && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", CHANNEL_COLORS[m.channel] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600")}>
                        {t(`messageChannel.${m.channel}`) || m.channel}
                      </span>
                    )}
                    {m.valueType && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-bold", VALUE_COLORS[m.valueType] ?? "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                        {m.valueType}
                      </span>
                    )}
                    {m.subject && <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{m.subject}</span>}
                    {custName && <span className="text-xs text-slate-500">{custName}</span>}
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                      {format(new Date(m.date), "dd/MM/yyyy", { locale: dateFnsLocale })}
                    </span>
                  </div>
                  {m.messageSummary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{m.messageSummary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                    {m.senderName && <span className="text-slate-500">Từ: {m.senderName}</span>}
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
                        className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline">
                        <ExternalLink className="w-3 h-3" /> File
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {m.channel && ["EMAIL", "ZALO", "OTHER"].includes(m.channel) && (
                    <button onClick={() => setReplyingMessage(m)}
                      className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                      title="Trả lời">
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setEditingMessage(m)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
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
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">{t("messages.noMessages")}</div>
        )}
      </div>

      {messages.length < total && (
        <div className="flex justify-center pt-2">
          <button onClick={loadMore} disabled={loadingMore}
            className="px-5 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition">
            {loadingMore ? "Đang tải..." : `Tải thêm (${messages.length}/${total})`}
          </button>
        </div>
      )}

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

      {replyingMessage && (
        <ReplyModal
          message={replyingMessage}
          onClose={() => setReplyingMessage(null)}
        />
      )}
    </div>
  );
}
