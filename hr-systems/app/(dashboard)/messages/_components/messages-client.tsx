"use client";

import { useState, useMemo, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { MessageFormModal } from "./message-form-modal";

interface Employee { id: number; fullName: string; emailCompany?: string | null; department?: string | null }
interface CustomerOption { id: number; customerName?: string | null; businessName?: string | null }

interface MessageBubble {
  id: number;
  content: string;
  date: string;
  isMine: boolean;
  senderName?: string | null;
  attachments: { id: string; name: string; size: number | null; url: string }[];
  status: string;
}

interface Conversation {
  key: string;
  name: string;
  role: string;
  avatarSeed: string;
  channel: string | null;
  type: "cust" | "team";
  customerId: number | null;
  senderContact: string | null;
  senderName: string | null;
  email: string | null;
  phone: string | null;
  otherEmployeeId: number | null;
  unread: number;
  lastMessageId: number;
  lastDate: string;
  messages: MessageBubble[];
  attachments: { name: string; size: number | null; url: string }[];
  /** Virtual conversation = chưa có Message nào trong DB (tạo từ employee search). */
  isVirtual?: boolean;
}

interface Props {
  conversations: Conversation[];
  employees: Employee[];
  customers: CustomerOption[];
  currentUserId: number;
  currentUserName: string;
  isManager: boolean;
}

const GRADIENTS = [
  "linear-gradient(135deg,#3B5BDB,#5275e6)",
  "linear-gradient(135deg,#a78bfa,#8b5cf6)",
  "linear-gradient(135deg,#4ADE80,#16a34a)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#22d3ee,#0891b2)",
  "linear-gradient(135deg,#f472b6,#db2777)",
  "linear-gradient(135deg,#8b7bff,#4f7aff)",
  "linear-gradient(135deg,#34d399,#059669)",
];

// Channel meta — match brand colors/letters from template_demo/template admin/messages.html
// Note: in this codebase MessageChannel.OTHER is treated as Microsoft Teams (see /api/messages/[id]/reply route).
const SOURCE_META: Record<string, { label: string; short: string; color: string; letter: string }> = {
  ZALO:  { label: "Zalo",      short: "Zalo",   color: "#0068FF", letter: "Z" },
  OTHER: { label: "Teams",     short: "Teams",  color: "#464EB8", letter: "T" }, // Microsoft Teams
  CHAT:  { label: "G.Chat",    short: "G.Chat", color: "#1A73E8", letter: "G" }, // Google Chat
  EMAIL: { label: "Email",     short: "Email",  color: "#D93025", letter: "@" },
  SLACK: { label: "Slack",     short: "Slack",  color: "#4A154B", letter: "S" },
  PHONE: { label: "Phone",     short: "Phone",  color: "#16a34a", letter: "P" },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function fmtTime(d: string) {
  const date = new Date(d);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Hôm qua";
  const diff = differenceInDays(new Date(), date);
  if (diff < 7) return format(date, "EEE", { locale: viLocale });
  return format(date, "dd/MM");
}

function fmtDayDivider(d: string) {
  const date = new Date(d);
  if (isToday(date)) return "Hôm nay";
  if (isYesterday(date)) return "Hôm qua";
  return format(date, "dd MMM yyyy", { locale: viLocale });
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function SourceIcon({ channel, size = 18 }: { channel: string | null; size?: number }) {
  if (!channel) return null;
  const meta = SOURCE_META[channel] ?? SOURCE_META.OTHER;
  return (
    <svg viewBox="0 0 40 40" fill="none" width={size} height={size}>
      <rect width="40" height="40" rx="10" fill={meta.color} />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800" fontFamily="sans-serif">{meta.letter}</text>
    </svg>
  );
}

export function MessagesClient({ conversations: initialConversations, employees, customers, currentUserId, currentUserName, isManager }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeKey, setActiveKey] = useState<string | null>(initialConversations[0]?.key ?? null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "cust" | "team">("all");
  const [srcFilter, setSrcFilter] = useState<string>("all");
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showInfoMobile, setShowInfoMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const threadBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const filtered = useMemo(() => {
    return conversations.filter(c => {
      if (srcFilter !== "all" && c.channel !== srcFilter) return false;
      if (filter === "unread" && c.unread === 0) return false;
      if (filter === "cust" && c.type !== "cust") return false;
      if (filter === "team" && c.type !== "team") return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [
          c.name,
          c.role,
          c.senderName,
          c.senderContact,
          c.email,
          c.phone,
          // also search inside message contents
          ...c.messages.map(m => m.content),
        ]
          .filter(Boolean)
          .map(s => String(s).toLowerCase())
          .join("  ");
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, search, filter, srcFilter]);

  const active = useMemo(
    () => conversations.find(c => c.key === activeKey) ?? null,
    [conversations, activeKey]
  );

  // Employees not yet in any conversation (for "Bắt đầu chat mới" section)
  const employeesNotInConvo = useMemo(() => {
    const inConvo = new Set(
      conversations
        .filter(c => c.type === "team" && c.otherEmployeeId != null)
        .map(c => c.otherEmployeeId as number)
    );
    return employees.filter(e => !inConvo.has(e.id));
  }, [conversations, employees]);

  const employeeMatches = useMemo(() => {
    if (!search.trim()) return [] as Employee[];
    const q = search.trim().toLowerCase();
    return employeesNotInConvo.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      (e.emailCompany?.toLowerCase().includes(q) ?? false) ||
      (e.department?.toLowerCase().includes(q) ?? false)
    ).slice(0, 20);
  }, [employeesNotInConvo, search]);

  function startChatWithEmployee(emp: Employee) {
    const lo = Math.min(currentUserId, emp.id);
    const hi = Math.max(currentUserId, emp.id);
    const key = `team:${lo}:${hi}`;
    // If conversation already exists (just no messages yet shown), reuse it
    const existing = conversations.find(c => c.key === key);
    if (existing) {
      setActiveKey(key);
      setSearch("");
      return;
    }
    const virtual: Conversation = {
      key,
      name: emp.fullName,
      role: emp.department || "Nội bộ",
      avatarSeed: emp.fullName,
      channel: "CHAT",
      type: "team",
      customerId: null,
      senderContact: null,
      senderName: null,
      email: emp.emailCompany ?? null,
      phone: null,
      otherEmployeeId: emp.id,
      unread: 0,
      lastMessageId: 0,
      lastDate: new Date().toISOString(),
      messages: [],
      attachments: [],
      isVirtual: true,
    };
    setConversations(prev => [virtual, ...prev]);
    setActiveKey(key);
    setSearch("");
  }

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: conversations.length };
    for (const c of conversations) {
      const k = c.channel ?? "OTHER";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [conversations]);

  const sourceTabs = useMemo(() => {
    const channels = new Set(conversations.map(c => c.channel).filter(Boolean) as string[]);
    return [{ k: "all", l: "Tất cả" }, ...Array.from(channels).map(k => ({ k, l: SOURCE_META[k]?.short ?? k }))];
  }, [conversations]);

  // Auto-scroll to bottom when active conversation changes or new messages arrive
  useEffect(() => {
    if (threadBodyRef.current) {
      threadBodyRef.current.scrollTop = threadBodyRef.current.scrollHeight;
    }
  }, [activeKey, active?.messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!composer.trim() || !active || sending) return;
    const text = composer.trim();
    const isFirstMessage = active.messages.length === 0 || active.lastMessageId === 0;
    setSending(true);
    try {
      let res: Response;
      if (isFirstMessage && active.otherEmployeeId != null) {
        // Brand-new internal chat: create the very first Message via POST /api/messages
        res = await fetch(`/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date().toISOString(),
            channel: "CHAT",
            assignedToId: active.otherEmployeeId,
            messageSummary: text,
            status: "OPEN",
          }),
        });
      } else {
        res = await fetch(`/api/messages/${active.lastMessageId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
      }
      const json = await res.json();
      if (!res.ok) {
        alert(typeof json.error === "string" ? json.error : "Gửi thất bại");
        return;
      }
      setComposer("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  function selectConversation(key: string) {
    setActiveKey(key);
    setShowInfoMobile(false);
  }

  // Build day-grouped bubbles for active conversation
  // gated on `mounted` so SSR/client outputs match (date-fns uses local TZ)
  const threadGroups = useMemo(() => {
    if (!active || !mounted) return [];
    const out: { day: string; items: MessageBubble[] }[] = [];
    let lastDay = "";
    for (const msg of active.messages) {
      const day = fmtDayDivider(msg.date);
      if (day !== lastDay) {
        out.push({ day, items: [] });
        lastDay = day;
      }
      out[out.length - 1].items.push(msg);
    }
    return out;
  }, [active, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .msg-wrap{position:absolute;inset:0;display:flex}
        .msg-app{flex:1;display:grid;grid-template-columns:360px 1fr 300px;min-height:0;height:100%;background:var(--dash-bg);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
        @media(max-width:1180px){.msg-app{grid-template-columns:340px 1fr}.msg-info{display:none}}
        @media(max-width:760px){.msg-app{grid-template-columns:1fr}.msg-app.show-thread .conv-pane{display:none}.msg-app:not(.show-thread) .thread-pane{display:none}}

        .conv-pane{border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0;background:var(--elev)}
        .conv-head{padding:14px 14px 10px;flex-shrink:0;border-bottom:1px solid var(--border)}
        .ch-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ch-top h2{font-size:1.1rem;font-weight:800;letter-spacing:-.02em;color:var(--text)}
        .ch-new{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--accent);color:#fff;cursor:pointer;border:none;transition:background .15s,transform .15s}
        .ch-new:hover{background:var(--accent-2);transform:translateY(-1px)}
        .ch-new svg{width:16px;height:16px}

        .src-tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
        .src-tabs::-webkit-scrollbar{display:none}
        .src-tab{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 9px;border-radius:8px;border:1.5px solid var(--border);background:var(--content);font-size:.74rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;flex-shrink:0}
        .src-tab:hover{border-color:var(--border-2);color:var(--text)}
        .src-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .src-tab .si{width:18px;height:18px;flex-shrink:0;display:grid;place-items:center}
        .src-tab .src-tab-cnt{font-family:var(--font-mono);font-size:.62rem;opacity:.65;margin-left:1px}

        .conv-search{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;background:var(--content);border:1px solid var(--border);border-radius:9px;color:var(--text-3)}
        .conv-search svg{width:14px;height:14px;flex-shrink:0}
        .conv-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.84rem;color:var(--text);width:100%}
        .conv-search input::placeholder{color:var(--text-3)}

        .conv-filters{display:flex;gap:4px;padding:8px 10px;flex-shrink:0;border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
        .conv-filters::-webkit-scrollbar{display:none}
        .conv-fil{font-size:.74rem;font-weight:600;color:var(--text-3);padding:5px 10px;border-radius:99px;cursor:pointer;border:1.5px solid transparent;background:none;transition:all .15s;white-space:nowrap;flex-shrink:0;font-family:inherit}
        .conv-fil:hover{background:var(--content);color:var(--text-2);border-color:var(--border)}
        .conv-fil.on{background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent-soft-2)}

        .conv-list{flex:1;overflow-y:auto;min-height:0}
        .conv-section-h{font-family:var(--font-mono);font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding:11px 16px 6px;background:var(--elev)}
        .conv-item{display:flex;gap:11px;padding:13px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;position:relative;background:none;border-left:none;border-right:none;border-top:none;text-align:left;width:100%;font-family:inherit}
        .conv-item:hover{background:var(--content)}
        .conv-item.on{background:var(--accent-soft)}
        .conv-item.on::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
        .conv-av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:.86rem;font-weight:700;flex-shrink:0;position:relative}
        .src-badge{position:absolute;bottom:-1px;right:-1px;width:18px;height:18px;border-radius:5px;overflow:hidden;display:grid;place-items:center;border:2px solid var(--elev)}
        .conv-item.on .src-badge{border-color:var(--accent-soft)}
        .conv-mid{flex:1;min-width:0}
        .conv-row1{display:flex;align-items:center;gap:6px;margin-bottom:3px}
        .conv-name{font-size:.88rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;text-align:left}
        .conv-time{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono);flex-shrink:0}
        .conv-preview{font-size:.8rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px}
        .conv-preview.unread{color:var(--text);font-weight:600}
        .conv-badge{flex-shrink:0;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--accent);color:#fff;font-size:.66rem;font-weight:700;display:grid;place-items:center;font-family:var(--font-mono)}
        .conv-tag{font-size:.62rem;font-weight:700;padding:1px 7px;border-radius:99px;flex-shrink:0}
        .conv-tag.cust{background:var(--accent-soft);color:var(--accent-ink)}
        .conv-tag.team{background:rgba(74,222,128,.13);color:var(--ok)}

        .thread-pane{display:flex;flex-direction:column;min-height:0;background:var(--content)}
        .thread-head{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--elev)}
        .thread-back{display:none;width:32px;height:32px;border-radius:8px;place-items:center;color:var(--text-2);border:none;background:none;cursor:pointer}
        .thread-back svg{width:18px;height:18px}
        @media(max-width:760px){.thread-back{display:grid}}
        .thread-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:.82rem;font-weight:700;flex-shrink:0}
        .thread-info-mini{flex:1;min-width:0}
        .thread-name{font-size:.95rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .thread-status{font-size:.74rem;color:var(--text-3);font-family:var(--font-mono);display:flex;align-items:center;gap:5px;margin-top:2px}
        .thread-actions{display:flex;gap:4px}
        .thread-actions button{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;color:var(--text-3);border:1px solid transparent;background:none;cursor:pointer;transition:all .15s;font-family:inherit}
        .thread-actions button:hover{background:var(--content);color:var(--text);border-color:var(--border)}
        .thread-actions button svg{width:17px;height:17px}

        .thread-body{flex:1;overflow-y:auto;min-height:0;padding:22px 24px;display:flex;flex-direction:column;gap:4px}
        .day-div{display:flex;align-items:center;gap:12px;margin:14px 0 10px}
        .day-div::before,.day-div::after{content:"";flex:1;height:1px;background:var(--border)}
        .day-div span{font-family:var(--font-mono);font-size:.68rem;color:var(--text-3);padding:0 8px}

        .bubble-group{display:flex;flex-direction:column;align-self:flex-start;max-width:78%;margin-top:8px}
        .bubble-group.me{align-self:flex-end}
        .msg-grp{display:flex;gap:10px}
        .bubble-group.me .msg-grp{flex-direction:row-reverse}
        .mg-av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:.7rem;font-weight:700;flex-shrink:0;align-self:flex-end}
        .bubble-group.me .mg-av{display:none}
        .mg-bubbles{display:flex;flex-direction:column;gap:3px;min-width:0;align-items:flex-start}
        .bubble-group.me .mg-bubbles{align-items:flex-end}
        .bubble{padding:9px 13px;border-radius:14px;font-size:.88rem;line-height:1.5;color:var(--text);word-wrap:break-word;overflow-wrap:break-word;position:relative;white-space:pre-wrap;max-width:100%}
        .bubble-group:not(.me) .bubble{background:var(--elev);border:1px solid var(--border);border-bottom-left-radius:5px}
        .bubble-group.me .bubble{background:var(--accent);color:#fff;border-bottom-right-radius:5px}
        .bubble-time{font-size:.66rem;color:var(--text-3);font-family:var(--font-mono);margin-top:4px;padding-left:42px}
        .bubble-group.me .bubble-time{text-align:right;padding-left:0;padding-right:4px}
        .bubble.attach{display:flex;align-items:center;gap:10px;padding:11px 13px}
        .bubble.attach .att-ic{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.15);display:grid;place-items:center;flex-shrink:0}
        .bubble-group:not(.me) .bubble.attach .att-ic{background:var(--accent-soft);color:var(--accent-ink)}
        .bubble.attach .att-ic svg{width:16px;height:16px}
        .bubble.attach .att-meta{flex:1;min-width:0}
        .bubble.attach .att-name{font-size:.84rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .bubble.attach .att-size{font-size:.72rem;opacity:.7;font-family:var(--font-mono)}
        .bubble.attach a{color:inherit;text-decoration:none}

        .composer{flex-shrink:0;border-top:1px solid var(--border);padding:14px 20px;background:var(--elev)}
        .composer-box{display:flex;align-items:flex-end;gap:10px;background:var(--content);border:1.5px solid var(--border-2);border-radius:14px;padding:8px 8px 8px 14px;transition:border-color .15s,box-shadow .15s}
        .composer-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .composer-box textarea{flex:1;background:none;border:none;outline:none;font-family:inherit;font-size:.9rem;color:var(--text);resize:none;max-height:120px;line-height:1.5;padding:6px 0;width:100%}
        .composer-box textarea::placeholder{color:var(--text-3)}
        .send-btn{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:background .15s,transform .15s;flex-shrink:0;font-family:inherit}
        .send-btn:hover:not(:disabled){background:var(--accent-2);transform:scale(1.05)}
        .send-btn:disabled{background:var(--border);color:var(--text-3);cursor:default;transform:none}
        .send-btn svg{width:18px;height:18px}

        .empty-state{flex:1;display:grid;place-items:center;color:var(--text-3);font-size:.92rem;padding:40px;text-align:center}

        .msg-info{border-left:1px solid var(--border);display:flex;flex-direction:column;min-height:0;overflow-y:auto;background:var(--elev)}
        .info-hero{text-align:center;padding:26px 20px 20px;border-bottom:1px solid var(--border)}
        .info-av{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:1.5rem;font-weight:800;margin:0 auto 12px}
        .info-name{font-size:1.02rem;font-weight:700;color:var(--text)}
        .info-role{font-size:.78rem;color:var(--text-3);font-family:var(--font-mono);margin-top:3px}
        .info-quick{display:flex;justify-content:center;gap:8px;margin-top:16px}
        .info-quick button,.info-quick a{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:var(--text-2);background:var(--content);border:1px solid var(--border);cursor:pointer;transition:all .15s;text-decoration:none}
        .info-quick button:hover,.info-quick a:hover{border-color:var(--accent);color:var(--accent-ink);transform:translateY(-1px)}
        .info-quick svg{width:17px;height:17px}
        .info-sec{padding:16px 20px;border-bottom:1px solid var(--border)}
        .info-sec h4{font-family:var(--font-mono);font-size:.64rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px}
        .info-field{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:.84rem;color:var(--text-2)}
        .info-field svg{width:15px;height:15px;color:var(--text-3);flex-shrink:0}
        .info-field b{color:var(--text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
        .info-file{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:.82rem;color:var(--text);text-decoration:none}
        .info-file:hover .if-name{color:var(--accent-ink)}
        .info-file .if-ic{width:32px;height:32px;border-radius:8px;background:var(--content);border:1px solid var(--border);display:grid;place-items:center;flex-shrink:0;color:var(--accent-ink)}
        .info-file .if-ic svg{width:15px;height:15px}
        .info-file .if-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
        .info-file .if-size{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono)}
      ` }} />

      <div style={{ position: "relative", height: "calc(100vh - 100px)", minHeight: 400 }}>
      <div className={`msg-wrap`}>
      <div className={`msg-app${showInfoMobile ? " show-thread" : ""}`}>
        {/* LEFT — conversation list */}
        <div className="conv-pane">
          <div className="conv-head">
            <div className="ch-top">
              <h2>Tin nhắn</h2>
              <button className="ch-new" onClick={() => setCreating(true)} title="Tin nhắn mới">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            </div>
            <div className="src-tabs">
              {sourceTabs.map(tab => {
                const meta = tab.k !== "all" ? (SOURCE_META[tab.k] ?? SOURCE_META.OTHER) : null;
                return (
                  <button key={tab.k} className={`src-tab${srcFilter === tab.k ? " on" : ""}`} onClick={() => setSrcFilter(tab.k)}>
                    {meta ? (
                      <span className="si"><SourceIcon channel={tab.k} size={18} /></span>
                    ) : (
                      <span className="si">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                    )}
                    <span>{tab.l}</span>
                    <span className="src-tab-cnt">{sourceCounts[tab.k] ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="conv-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm hội thoại…" />
            </div>
          </div>

          <div className="conv-filters">
            <button className={`conv-fil${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>Tất cả</button>
            <button className={`conv-fil${filter === "unread" ? " on" : ""}`} onClick={() => setFilter("unread")}>Chưa đọc</button>
            <button className={`conv-fil${filter === "cust" ? " on" : ""}`} onClick={() => setFilter("cust")}>Khách hàng</button>
            <button className={`conv-fil${filter === "team" ? " on" : ""}`} onClick={() => setFilter("team")}>Nội bộ</button>
          </div>

          <div className="conv-list">
            {filtered.length === 0 && employeeMatches.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-3)", fontSize: ".84rem" }}>
                {search.trim() ? "Không khớp hội thoại hay nhân viên nào." : "Không có hội thoại."}
              </div>
            ) : (
              <>
                {filtered.length > 0 && search.trim() && (
                  <div className="conv-section-h">Hội thoại</div>
                )}
                {filtered.map(c => {
                  const last = c.messages[c.messages.length - 1];
                  const preview = last
                    ? (last.attachments.length > 0 ? `📎 ${last.attachments[0].name}` : (last.isMine ? "Bạn: " : "") + (last.content || "(không nội dung)"))
                    : (c.isVirtual ? "Chưa có tin nhắn — gõ để bắt đầu" : "");
                  return (
                    <button key={c.key} className={`conv-item${activeKey === c.key ? " on" : ""}`} onClick={() => selectConversation(c.key)}>
                      <div className="conv-av" style={{ background: gradientFor(c.avatarSeed) }}>
                        {initials(c.avatarSeed)}
                        {c.channel && !c.isVirtual && (
                          <span className="src-badge">
                            <SourceIcon channel={c.channel} size={14} />
                          </span>
                        )}
                      </div>
                      <div className="conv-mid">
                        <div className="conv-row1">
                          <span className="conv-name">{c.name}</span>
                          {!c.isVirtual && (
                            <span className="conv-time" suppressHydrationWarning>{mounted ? fmtTime(c.lastDate) : ""}</span>
                          )}
                        </div>
                        <div className={`conv-preview${c.unread > 0 ? " unread" : ""}`}>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</span>
                          {c.unread > 0 ? (
                            <span className="conv-badge">{c.unread}</span>
                          ) : (
                            <span className={`conv-tag ${c.type}`}>{c.type === "cust" ? "KH" : "Team"}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {employeeMatches.length > 0 && (
                  <>
                    <div className="conv-section-h">Bắt đầu chat mới ({employeeMatches.length})</div>
                    {employeeMatches.map(emp => (
                      <button
                        key={`emp:${emp.id}`}
                        className="conv-item"
                        onClick={() => startChatWithEmployee(emp)}
                      >
                        <div className="conv-av" style={{ background: gradientFor(emp.fullName) }}>
                          {initials(emp.fullName)}
                        </div>
                        <div className="conv-mid">
                          <div className="conv-row1">
                            <span className="conv-name">{emp.fullName}</span>
                          </div>
                          <div className="conv-preview" style={{ color: "var(--text-3)" }}>
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {emp.department || emp.emailCompany || "Nhân viên"}
                            </span>
                            <span className="conv-tag team">Mới</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* CENTER — thread */}
        <div className="thread-pane">
          {!active ? (
            <div className="empty-state">
              Chọn 1 hội thoại để bắt đầu trò chuyện.
            </div>
          ) : (
            <>
              <div className="thread-head">
                <button className="thread-back" onClick={() => setActiveKey(null)} aria-label="Quay lại">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div className="thread-av" style={{ background: gradientFor(active.avatarSeed) }}>
                  {initials(active.avatarSeed)}
                </div>
                <div className="thread-info-mini">
                  <div className="thread-name">{active.name}</div>
                  <div className="thread-status">
                    {active.channel && <SourceIcon channel={active.channel} size={12} />}
                    <span>{active.role}</span>
                  </div>
                </div>
                <div className="thread-actions">
                  {active.phone && (
                    <a href={`tel:${active.phone}`} title="Gọi">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                    </a>
                  )}
                  {active.email && (
                    <a href={`mailto:${active.email}`} title="Email">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 6l10 7L22 6" /></svg>
                    </a>
                  )}
                  <button onClick={() => setShowInfoMobile(v => !v)} title="Thông tin">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
                  </button>
                </div>
              </div>

              <div className="thread-body" ref={threadBodyRef}>
                {threadGroups.map(group => (
                  <div key={group.day}>
                    <div className="day-div"><span>{group.day}</span></div>
                    {group.items.map(msg => (
                      <div key={msg.id} className={`bubble-group${msg.isMine ? " me" : ""}`}>
                        <div className="msg-grp">
                          {!msg.isMine && (
                            <div className="mg-av" style={{ background: gradientFor(active.avatarSeed) }}>
                              {initials(active.avatarSeed)}
                            </div>
                          )}
                          <div className="mg-bubbles">
                            {msg.content && (
                              <div className="bubble">{msg.content}</div>
                            )}
                            {msg.attachments.map(a => (
                              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="bubble attach">
                                <div className="att-ic">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                </div>
                                <div className="att-meta">
                                  <div className="att-name">{a.name}</div>
                                  <div className="att-size">{fmtSize(a.size)}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="bubble-time" suppressHydrationWarning>{mounted ? format(new Date(msg.date), "HH:mm") : ""}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <form className="composer" onSubmit={handleSend}>
                <div className="composer-box">
                  <textarea
                    value={composer}
                    onChange={e => setComposer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                    rows={1}
                    placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
                  />
                  <button type="submit" className="send-btn" disabled={!composer.trim() || sending} aria-label="Gửi">
                    {sending ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .8s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* RIGHT — info pane */}
        {active && (
          <div className="msg-info">
            <div className="info-hero">
              <div className="info-av" style={{ background: gradientFor(active.avatarSeed) }}>
                {initials(active.avatarSeed)}
              </div>
              <div className="info-name">{active.name}</div>
              <div className="info-role">{active.role}</div>
              <div className="info-quick">
                {active.phone && (
                  <a href={`tel:${active.phone}`} title="Gọi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                  </a>
                )}
                {active.email && (
                  <a href={`mailto:${active.email}`} title="Email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 6l10 7L22 6" /></svg>
                  </a>
                )}
              </div>
            </div>

            <div className="info-sec">
              <h4>Thông tin</h4>
              {active.channel && (
                <div className="info-field">
                  <SourceIcon channel={active.channel} size={15} />
                  <span>Kênh: <b>{SOURCE_META[active.channel]?.label ?? active.channel}</b></span>
                </div>
              )}
              {active.senderContact && (
                <div className="info-field">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
                  <span><b>{active.senderContact}</b></span>
                </div>
              )}
              {active.email && (
                <div className="info-field">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 6l10 7L22 6" /></svg>
                  <span><b>{active.email}</b></span>
                </div>
              )}
              {active.phone && (
                <div className="info-field">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                  <span><b>{active.phone}</b></span>
                </div>
              )}
            </div>

            {active.attachments.length > 0 && (
              <div className="info-sec">
                <h4>File ({active.attachments.length})</h4>
                {active.attachments.slice(0, 10).map((a, idx) => (
                  <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer" className="info-file">
                    <div className="if-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="if-name">{a.name}</div>
                    <div className="if-size">{fmtSize(a.size)}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      </div>

      {creating && (
        <MessageFormModal
          message={null}
          employees={employees}
          customers={customers}
          currentUserId={currentUserId}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh(); }}
        />
      )}
    </>
  );
}
