"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

type DriveItem = {
  id: string;
  name: string;
  size?: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  "@microsoft.graph.downloadUrl"?: string;
};

type BreadcrumbItem = { id: string; name: string };

// ── File type metadata ──────────────────────────────────────────
const EXT_META: Record<string, { color: string; bg: string; label: string; group: string }> = {
  pdf:  { color: "#ef4444", bg: "rgba(239,68,68,.12)",   label: "PDF",  group: "pdf" },
  doc:  { color: "#3B5BDB", bg: "rgba(59,91,219,.12)",   label: "DOC",  group: "doc" },
  docx: { color: "#3B5BDB", bg: "rgba(59,91,219,.12)",   label: "DOCX", group: "doc" },
  xls:  { color: "#22c55e", bg: "rgba(34,197,94,.12)",   label: "XLS",  group: "xls" },
  xlsx: { color: "#22c55e", bg: "rgba(34,197,94,.12)",   label: "XLSX", group: "xls" },
  png:  { color: "#a78bfa", bg: "rgba(167,139,250,.12)", label: "PNG",  group: "img" },
  jpg:  { color: "#f472b6", bg: "rgba(244,114,182,.12)", label: "JPG",  group: "img" },
  jpeg: { color: "#f472b6", bg: "rgba(244,114,182,.12)", label: "JPG",  group: "img" },
  gif:  { color: "#f472b6", bg: "rgba(244,114,182,.12)", label: "GIF",  group: "img" },
  mp4:  { color: "#22d3ee", bg: "rgba(34,211,238,.12)",  label: "MP4",  group: "other" },
  zip:  { color: "#94a3b8", bg: "rgba(148,163,184,.12)", label: "ZIP",  group: "other" },
  txt:  { color: "#cbd5e1", bg: "rgba(203,213,225,.10)", label: "TXT",  group: "other" },
  sql:  { color: "#f59e0b", bg: "rgba(245,158,11,.12)",  label: "SQL",  group: "other" },
};

function extOf(name: string) { return (name.split(".").pop() ?? "").toLowerCase(); }
function extMeta(name: string) {
  const e = extOf(name);
  return EXT_META[e] ?? { color: "#94a3b8", bg: "rgba(148,163,184,.12)", label: (e || "FILE").toUpperCase(), group: "other" };
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ── SVG icons ──────────────────────────────────────────────────
const IcoFile = ({ color = "currentColor", size = 16 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" width={size} height={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
  </svg>
);
const IcoFolder = ({ color = "currentColor", size = 16 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" width={size} height={size}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoSearch = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
  </svg>
);
const IcoGrid = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={size} height={size}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcoList = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
);
const IcoUpload = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IcoFolderPlus = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/>
  </svg>
);
const IcoDownload = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcoTrash = ({ size = 13 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
  </svg>
);
const IcoShare = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
  </svg>
);
const IcoClose = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={size} height={size}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IcoStar = ({ filled = false, size = 12 }: { filled?: boolean; size?: number }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke="currentColor" strokeWidth={2} width={size} height={size}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IcoRefresh = ({ spin = false, size = 14 }: { spin?: boolean; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={size} height={size}
    style={spin ? { animation: "spin 1s linear infinite" } : undefined}>
    <polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.7-5.5L23 4"/>
  </svg>
);

// ── Main component ──────────────────────────────────────────────
export function FileBrowser({ isManager, connected = true }: { isManager: boolean; connected?: boolean }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: "root", name: "OneDrive" }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [viewItem, setViewItem] = useState<DriveItem | null>(null);
  const [detailItem, setDetailItem] = useState<DriveItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [fileType, setFileType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const qc = useQueryClient();
  const { toast } = useToast();
  const currentFolder = breadcrumbs[breadcrumbs.length - 1];

  const { data: filesData, isFetching } = useQuery({
    queryKey: ["drive-files", currentFolder.id, isSearching ? searchQuery : null],
    queryFn: async () => {
      if (isSearching && searchQuery.trim().length >= 2) {
        const res = await fetch(`/api/drive/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
      const res = await fetch(`/api/drive/files?parentId=${currentFolder.id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 30_000,
  });

  const allItems: DriveItem[] = filesData?.data ?? [];
  const folders = allItems.filter((i) => i.folder);
  let files = allItems.filter((i) => !i.folder);
  if (fileType !== "all") files = files.filter((i) => extMeta(i.name).group === fileType);
  if (sortBy === "name") files = [...files].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "size") files = [...files].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  else files = [...files].sort((a, b) => b.lastModifiedDateTime.localeCompare(a.lastModifiedDateTime));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drive/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drive-files"] }); toast({ title: "Đã xóa file" }); },
    onError: (e) => toast({ title: "Lỗi xóa", description: String(e), variant: "error" }),
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/drive/folders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: currentFolder.id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive-files"] });
      setShowNewFolder(false); setNewFolderName("");
      toast({ title: "Đã tạo thư mục" });
    },
    onError: (e) => toast({ title: "Lỗi tạo thư mục", description: String(e), variant: "error" }),
  });

  const shareMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch("/api/drive/share", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type: "view", expirationHours: 24 }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      const url = data.data?.link?.webUrl;
      if (url) { navigator.clipboard.writeText(url); toast({ title: "Đã copy link chia sẻ (24h)" }); }
    },
    onError: (e) => toast({ title: "Lỗi tạo link", description: String(e), variant: "error" }),
  });

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append("file", file); fd.append("parentId", currentFolder.id);
      try {
        const res = await fetch("/api/drive/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        toast({ title: `Đã upload: ${file.name}` });
      } catch (e) { toast({ title: `Lỗi upload ${file.name}`, description: String(e), variant: "error" }); }
    }
    qc.invalidateQueries({ queryKey: ["drive-files"] });
  }, [currentFolder.id, qc, toast]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        main:has(.doc-layout){overflow:hidden!important;padding:0!important;display:flex;flex-direction:column}
        .doc-layout{display:grid;grid-template-columns:260px 1fr;flex:1;min-height:0;overflow:hidden}
        @media(max-width:860px){.doc-layout{grid-template-columns:1fr}}

        .doc-sidebar{border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--side,var(--elev));overflow:hidden}
        .doc-sidebar-head{padding:16px;flex-shrink:0;border-bottom:1px solid var(--border)}
        .doc-sidebar-head h3{font-size:.94rem;font-weight:700;margin-bottom:10px;color:var(--text)}
        .doc-search-sm{display:flex;align-items:center;gap:7px;height:32px;padding:0 10px;background:var(--content);border:1px solid var(--border);border-radius:8px;color:var(--text-3)}
        .doc-search-sm input{background:none;border:none;outline:none;font-family:inherit;font-size:.8rem;color:var(--text);width:100%}
        .doc-folders{flex:1;overflow-y:auto;padding:8px 0}
        .folder-item{display:flex;align-items:center;gap:9px;padding:8px 16px;cursor:pointer;transition:background .12s;position:relative}
        .folder-item:hover{background:var(--content)}
        .folder-item.on{background:var(--accent-soft)}
        .folder-item.on::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
        .folder-item .fi-ico{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;flex-shrink:0}
        .folder-item .fi-name{font-size:.84rem;font-weight:600;color:var(--text);flex:1}
        .folder-item .fi-cnt{font-family:var(--font-mono);font-size:.66rem;color:var(--text-3);flex-shrink:0}
        .folder-divider{height:1px;background:var(--border);margin:6px 12px}
        .add-folder-btn{margin:8px 12px;display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:8px;border:1.5px dashed var(--border-2);color:var(--text-3);font-size:.8rem;cursor:pointer;font-family:inherit;background:none;transition:border-color .15s,color .15s;width:calc(100% - 24px)}
        .add-folder-btn:hover{border-color:var(--accent);color:var(--accent-ink)}

        .doc-main{display:flex;flex-direction:column;overflow:hidden;flex:1;background:var(--content)}
        .doc-main-head{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--elev);flex-wrap:wrap}
        .doc-main-head h2{font-size:1rem;font-weight:700;color:var(--text)}
        .breadcrumb{display:flex;align-items:center;gap:6px;font-size:.8rem;color:var(--text-3)}
        .breadcrumb .bc-sep{opacity:.5}
        .breadcrumb .bc-btn{background:none;border:none;cursor:pointer;color:var(--accent-ink);font-family:inherit;font-size:.8rem;padding:0}
        .breadcrumb .bc-cur{color:var(--text);font-weight:600}
        .doc-main-actions{display:flex;gap:7px;margin-left:auto;flex-shrink:0}
        .view-toggle{display:inline-flex;background:var(--elev);border:1px solid var(--border);border-radius:8px;padding:2px;gap:1px}
        .view-toggle button{width:30px;height:28px;border-radius:6px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;transition:background .15s,color .15s}
        .view-toggle button.on{background:var(--accent-soft);color:var(--accent-ink)}

        .doc-filter-bar{display:flex;align-items:center;gap:8px;padding:10px 22px;border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap;background:var(--elev)}
        .type-chip{font-size:.76rem;font-weight:600;color:var(--text-3);padding:4px 11px;border-radius:99px;border:1.5px solid transparent;cursor:pointer;font-family:inherit;transition:all .15s;background:none}
        .type-chip:hover{background:var(--content);color:var(--text-2)}
        .type-chip.on{background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent-soft)}
        .doc-sort{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:.76rem;color:var(--text-3)}
        .doc-sort select{font-family:inherit;font-size:.76rem;color:var(--text);background:var(--elev);border:1px solid var(--border);border-radius:7px;padding:4px 8px;outline:none;cursor:pointer}

        .doc-content-scroll{flex:1;overflow-y:auto;padding:20px 22px}
        .doc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
        @media(max-width:1200px){.doc-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:900px){.doc-grid{grid-template-columns:repeat(2,1fr)}}

        .doc-folder-card{background:var(--elev);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;cursor:pointer;transition:border-color .18s,transform .18s,box-shadow .15s;display:flex;align-items:center;gap:12px}
        .doc-folder-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,50,.25)}
        .dfc-ico{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
        .dfc-name{font-size:.86rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dfc-cnt{font-family:var(--font-mono);font-size:.68rem;color:var(--text-3)}

        .doc-file-card{background:var(--elev);border:1.5px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:border-color .18s,transform .18s,box-shadow .15s;display:flex;flex-direction:column}
        .doc-file-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,50,.28)}
        .doc-file-card.selected{border-color:var(--accent);background:var(--accent-soft)}
        .file-preview{height:100px;display:grid;place-items:center;position:relative;overflow:hidden}
        .file-ext-badge{position:absolute;top:8px;left:8px;font-family:var(--font-mono);font-size:.62rem;font-weight:800;padding:2px 7px;border-radius:5px;text-transform:uppercase}
        .file-star{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:6px;display:grid;place-items:center;cursor:pointer;border:none;background:rgba(0,0,0,.2);color:rgba(255,255,255,.6);transition:background .12s,color .12s}
        .file-star:hover{background:rgba(0,0,0,.4);color:#fbbf24}
        .file-card-body{padding:11px 13px;flex:1}
        .file-card-name{font-size:.84rem;font-weight:600;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .file-card-meta{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono)}
        .file-card-foot{display:flex;align-items:center;gap:8px;padding:8px 13px;border-top:1px solid var(--border)}
        .file-av{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.5rem;font-weight:700;flex-shrink:0}
        .file-owner{font-size:.7rem;color:var(--text-3);flex:1}
        .file-card-actions{display:flex;gap:3px;opacity:0;transition:opacity .15s}
        .doc-file-card:hover .file-card-actions{opacity:1}
        .fca-btn{width:24px;height:24px;border-radius:6px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;transition:background .12s,color .12s}
        .fca-btn:hover{background:var(--content);color:var(--text)}

        .doc-list{display:flex;flex-direction:column}
        .doc-list-item{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s}
        .doc-list-item:hover{background:var(--elev);margin:0 -22px;padding:10px 22px}
        .dli-ico{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
        .dli-name{font-size:.86rem;font-weight:600;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dli-type{font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:2px 7px;border-radius:5px;text-transform:uppercase;width:48px;text-align:center;flex-shrink:0}
        .dli-size{font-family:var(--font-mono);font-size:.74rem;color:var(--text-3);width:70px;text-align:right;flex-shrink:0}
        .dli-date{font-family:var(--font-mono);font-size:.72rem;color:var(--text-3);flex-shrink:0;width:100px;text-align:right}
        .dli-actions{display:flex;gap:3px;opacity:0;transition:opacity .15s}
        .doc-list-item:hover .dli-actions{opacity:1}

        .doc-detail-panel{width:280px;border-left:1px solid var(--border);background:var(--elev);display:flex;flex-direction:column;overflow-y:auto;flex-shrink:0;transition:width .25s}
        .doc-detail-panel.hidden{width:0;overflow:hidden;border-left:none}
        .dd-head{padding:16px;border-bottom:1px solid var(--border);flex-shrink:0}
        .dd-head h4{font-size:.88rem;font-weight:700;margin-bottom:6px;word-break:break-all;color:var(--text)}
        .dd-preview{height:130px;display:grid;place-items:center;border-bottom:1px solid var(--border);flex-shrink:0}
        .dd-sec{padding:14px 16px;border-bottom:1px solid var(--border)}
        .dd-sec h5{font-family:var(--font-mono);font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px}
        .dd-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:.82rem}
        .dd-row .dl{color:var(--text-3)}
        .dd-row .dv{color:var(--text);font-weight:500;font-family:var(--font-mono);font-size:.78rem}
        .file-tag{font-size:.62rem;padding:2px 7px;border-radius:99px;background:var(--content);border:1px solid var(--border);color:var(--text-3)}

        .doc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:60px 20px;color:var(--text-3)}
        .doc-empty svg{opacity:.35}

        .doc-new-folder-row{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--accent-soft);border-radius:10px;margin-bottom:14px}
        .doc-new-folder-row input{flex:1;background:transparent;border:none;outline:none;font-family:inherit;font-size:.88rem;color:var(--text)}
      ` }} />

      <div className="doc-layout">
        {/* ── SIDEBAR ── */}
        <div className="doc-sidebar">
          <div className="doc-sidebar-head">
            <h3>Thư mục</h3>
            <div className="doc-search-sm">
              <IcoSearch />
              <input type="text" placeholder="Tìm thư mục…" />
            </div>
          </div>

          <div className="doc-folders">
            {/* Special: root */}
            <div
              className={`folder-item${currentFolder.id === "root" ? " on" : ""}`}
              onClick={() => setBreadcrumbs([{ id: "root", name: "OneDrive" }])}
            >
              <div className="fi-ico" style={{ background: currentFolder.id === "root" ? "var(--accent-soft)" : "var(--content)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={currentFolder.id === "root" ? "var(--accent-ink)" : "var(--text-3)"} strokeWidth={2} strokeLinecap="round" width={14} height={14}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="fi-name">Tất cả tài liệu</div>
              <div className="fi-cnt">{allItems.filter(i => !i.folder).length}</div>
            </div>

            <div className="folder-divider" />

            {/* Dynamic OneDrive folders */}
            {folders.map((f, i) => {
              const colors = ["#3B5BDB","#22c55e","#f59e0b","#a78bfa","#22d3ee","#f472b6","#ef4444"];
              const color = colors[i % colors.length];
              const isOn = currentFolder.id === f.id;
              return (
                <div key={f.id} className={`folder-item${isOn ? " on" : ""}`}
                  onClick={() => setBreadcrumbs(prev => {
                    const idx = prev.findIndex(b => b.id === f.id);
                    if (idx >= 0) return prev.slice(0, idx + 1);
                    return [...prev, { id: f.id, name: f.name }];
                  })}>
                  <div className="fi-ico" style={{ background: isOn ? "var(--accent-soft)" : color + "22" }}>
                    <IcoFolder color={isOn ? "var(--accent-ink)" : color} size={14} />
                  </div>
                  <div className="fi-name">{f.name}</div>
                  <div className="fi-cnt">{f.folder?.childCount ?? 0}</div>
                </div>
              );
            })}
          </div>

          <button className="add-folder-btn" onClick={() => setShowNewFolder(true)}>
            <IcoFolderPlus size={13} /> Thêm thư mục
          </button>
        </div>

        {/* ── MAIN ── */}
        <div style={{ display: "flex", overflow: "hidden", flex: 1 }}>
          <div className="doc-main">
            {/* Header */}
            <div className="doc-main-head">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2>{currentFolder.name === "root" ? "Tất cả tài liệu" : currentFolder.name}</h2>
                <div className="breadcrumb">
                  <button className="bc-btn" onClick={() => setBreadcrumbs([{ id: "root", name: "OneDrive" }])}>Tài liệu</button>
                  {breadcrumbs.slice(1).map((b, i) => (
                    <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="bc-sep">›</span>
                      {i === breadcrumbs.length - 2
                        ? <span className="bc-cur">{b.name}</span>
                        : <button className="bc-btn" onClick={() => setBreadcrumbs(prev => prev.slice(0, i + 2))}>{b.name}</button>
                      }
                    </span>
                  ))}
                </div>
              </div>
              <div className="doc-main-actions">
                <label className="abtn ghost" style={{ gap: 7, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                  <IcoUpload size={14} /> Tải lên
                  <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files)} />
                </label>
                <button className="abtn primary" style={{ gap: 7 }} onClick={() => setShowNewFolder(true)}>
                  <IcoFolderPlus size={14} /> Thư mục mới
                </button>
                <div className="view-toggle">
                  <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} title="Lưới"><IcoGrid /></button>
                  <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} title="Danh sách"><IcoList /></button>
                </div>
                <button onClick={() => qc.invalidateQueries({ queryKey: ["drive-files"] })} className="abtn ghost" style={{ padding: "6px 10px" }} title="Làm mới">
                  <IcoRefresh spin={isFetching} size={14} />
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="doc-filter-bar">
              {[
                { k: "all", label: "Tất cả" },
                { k: "pdf", label: "PDF" },
                { k: "doc", label: "Word" },
                { k: "xls", label: "Excel" },
                { k: "img", label: "Hình ảnh" },
                { k: "other", label: "Khác" },
              ].map(ft => (
                <button key={ft.k} className={`type-chip${fileType === ft.k ? " on" : ""}`} onClick={() => setFileType(ft.k)}>{ft.label}</button>
              ))}
              <div className="doc-sort">
                <span>Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">Mới nhất</option>
                  <option value="name">Tên A–Z</option>
                  <option value="size">Kích thước</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="doc-content-scroll">
              {/* New folder input */}
              {showNewFolder && (
                <div className="doc-new-folder-row">
                  <IcoFolderPlus size={15} />
                  <input autoFocus placeholder="Tên thư mục mới…" value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim());
                      if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
                    }} />
                  <button className="abtn primary" style={{ fontSize: ".8rem", padding: "4px 12px" }}
                    disabled={createFolderMutation.isPending || !newFolderName.trim()}
                    onClick={() => createFolderMutation.mutate(newFolderName.trim())}>Tạo</button>
                  <button className="abtn ghost" style={{ fontSize: ".8rem", padding: "4px 10px" }}
                    onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>Hủy</button>
                </div>
              )}

              {!connected ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-soft)", display: "grid", placeItems: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth={1.5} strokeLinecap="round" width={32} height={32}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Kết nối Microsoft 365</div>
                    <div style={{ fontSize: ".84rem", color: "var(--text-3)", maxWidth: 340 }}>Kết nối tài khoản Microsoft 365 để quản lý tài liệu trực tiếp từ OneDrive và SharePoint ngay trong ứng dụng.</div>
                  </div>
                  <a href="/api/auth/microsoft" className="abtn primary" style={{ gap: 8, fontSize: ".88rem", padding: "9px 20px" }}>
                    <svg width={16} height={16} viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
                    Kết nối với Microsoft 365
                  </a>
                  <div style={{ display: "flex", gap: 20, fontSize: ".76rem", color: "var(--text-3)" }}>
                    <span>✓ OneDrive cá nhân & công ty</span>
                    <span>✓ SharePoint Sites</span>
                    <span>✓ Xem Word/Excel/PDF</span>
                  </div>
                </div>
              ) : isFetching && allItems.length === 0 ? (
                <div className="doc-empty"><IcoRefresh spin size={32} /><p>Đang tải...</p></div>
              ) : view === "grid" ? (
                <GridView
                  folders={folders} files={files} starred={starred}
                  selectedId={detailItem?.id ?? null}
                  onFolderClick={(f) => setBreadcrumbs(prev => [...prev, { id: f.id, name: f.name }])}
                  onFileClick={(f) => setDetailItem(prev => prev?.id === f.id ? null : f)}
                  onToggleStar={(id) => setStarred(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                  onDownload={(f) => { const url = f["@microsoft.graph.downloadUrl"]; if (url) window.open(url, "_blank"); }}
                  onDelete={(f) => { if (confirm(`Xóa "${f.name}"?`)) deleteMutation.mutate(f.id); }}
                  isManager={isManager}
                />
              ) : (
                <ListView
                  folders={folders} files={files} starred={starred}
                  onFolderClick={(f) => setBreadcrumbs(prev => [...prev, { id: f.id, name: f.name }])}
                  onFileClick={(f) => setDetailItem(prev => prev?.id === f.id ? null : f)}
                  onDownload={(f) => { const url = f["@microsoft.graph.downloadUrl"]; if (url) window.open(url, "_blank"); }}
                  onShare={(f) => shareMutation.mutate(f.id)}
                  onDelete={(f) => { if (confirm(`Xóa "${f.name}"?`)) deleteMutation.mutate(f.id); }}
                  isManager={isManager}
                />
              )}
            </div>
          </div>

          {/* ── DETAIL PANEL ── */}
          <div className={`doc-detail-panel${detailItem ? "" : " hidden"}`}>
            {detailItem && <DetailPanel item={detailItem} onClose={() => setDetailItem(null)}
              onDownload={() => { const url = detailItem["@microsoft.graph.downloadUrl"]; if (url) window.open(url, "_blank"); }}
              onShare={() => shareMutation.mutate(detailItem.id)}
              onView={() => setViewItem(detailItem)}
            />}
          </div>
        </div>
      </div>

      {viewItem && <OfficeViewerModal item={viewItem} onClose={() => setViewItem(null)} />}
    </>
  );
}

// ── Grid View ──────────────────────────────────────────────────
function GridView({ folders, files, starred, selectedId, onFolderClick, onFileClick, onToggleStar, onDownload, onDelete, isManager }: {
  folders: DriveItem[]; files: DriveItem[]; starred: Set<string>; selectedId: string | null;
  onFolderClick: (f: DriveItem) => void; onFileClick: (f: DriveItem) => void;
  onToggleStar: (id: string) => void; onDownload: (f: DriveItem) => void; onDelete: (f: DriveItem) => void;
  isManager: boolean;
}) {
  const colors = ["#3B5BDB","#22c55e","#f59e0b","#a78bfa","#22d3ee","#f472b6","#ef4444"];
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="doc-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} width={48} height={48}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p style={{ fontSize: ".9rem" }}>Thư mục trống</p>
      </div>
    );
  }
  return (
    <>
      {folders.length > 0 && (
        <div className="doc-grid">
          {folders.map((f, i) => {
            const color = colors[i % colors.length];
            return (
              <div key={f.id} className="doc-folder-card" onClick={() => onFolderClick(f)}>
                <div className="dfc-ico" style={{ background: color + "22" }}>
                  <IcoFolder color={color} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="dfc-name">{f.name}</div>
                  <div className="dfc-cnt">{f.folder?.childCount ?? 0} mục</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {files.length > 0 && (
        <div className="doc-grid">
          {files.map((f) => {
            const m = extMeta(f.name);
            const isStarred = starred.has(f.id);
            return (
              <div key={f.id} className={`doc-file-card${selectedId === f.id ? " selected" : ""}`} onClick={() => onFileClick(f)}>
                <div className="file-preview" style={{ background: m.bg }}>
                  <IcoFile color={m.color} size={40} />
                  <span className="file-ext-badge" style={{ background: m.color + "22", color: m.color }}>{m.label}</span>
                  <button className="file-star" onClick={(e) => { e.stopPropagation(); onToggleStar(f.id); }}>
                    <IcoStar filled={isStarred} size={12} />
                  </button>
                </div>
                <div className="file-card-body">
                  <div className="file-card-name" title={f.name}>{f.name}</div>
                  <div className="file-card-meta">{formatSize(f.size)} · {formatDate(f.lastModifiedDateTime)}</div>
                </div>
                <div className="file-card-foot">
                  <div className="file-av">{initials(f.name)}</div>
                  <div className="file-owner" style={{ fontSize: ".7rem", color: "var(--text-3)", flex: 1 }}>OneDrive</div>
                  <div className="file-card-actions">
                    <button className="fca-btn" title="Tải về" onClick={(e) => { e.stopPropagation(); onDownload(f); }}>
                      <IcoDownload size={12} />
                    </button>
                    {isManager && (
                      <button className="fca-btn" title="Xóa" onClick={(e) => { e.stopPropagation(); onDelete(f); }}>
                        <IcoTrash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── List View ──────────────────────────────────────────────────
function ListView({ folders, files, onFolderClick, onFileClick, onDownload, onShare, onDelete, isManager }: {
  folders: DriveItem[]; files: DriveItem[]; starred: Set<string>;
  onFolderClick: (f: DriveItem) => void; onFileClick: (f: DriveItem) => void;
  onDownload: (f: DriveItem) => void; onShare: (f: DriveItem) => void; onDelete: (f: DriveItem) => void;
  isManager: boolean;
}) {
  const colors = ["#3B5BDB","#22c55e","#f59e0b","#a78bfa","#22d3ee"];
  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="doc-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} width={48} height={48}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p style={{ fontSize: ".9rem" }}>Thư mục trống</p>
      </div>
    );
  }
  return (
    <div className="doc-list">
      {folders.map((f, i) => (
        <div key={f.id} className="doc-list-item" onClick={() => onFolderClick(f)}>
          <div className="dli-ico" style={{ background: colors[i % colors.length] + "22" }}>
            <IcoFolder color={colors[i % colors.length]} size={16} />
          </div>
          <div className="dli-name">📁 {f.name}</div>
          <div className="dli-type" style={{ background: "var(--border)", color: "var(--text-3)" }}>DIR</div>
          <div className="dli-size">{f.folder?.childCount ?? 0} mục</div>
          <div className="dli-date">—</div>
          <div className="dli-actions" />
        </div>
      ))}
      {files.map((f) => {
        const m = extMeta(f.name);
        return (
          <div key={f.id} className="doc-list-item" onClick={() => onFileClick(f)}>
            <div className="dli-ico" style={{ background: m.bg }}>
              <IcoFile color={m.color} size={16} />
            </div>
            <div className="dli-name">{f.name}</div>
            <div className="dli-type" style={{ background: m.bg, color: m.color }}>{m.label}</div>
            <div className="dli-size">{formatSize(f.size)}</div>
            <div className="dli-date">{formatDate(f.lastModifiedDateTime)}</div>
            <div className="dli-actions">
              <button className="fca-btn" title="Tải về" onClick={(e) => { e.stopPropagation(); onDownload(f); }}>
                <IcoDownload size={13} />
              </button>
              <button className="fca-btn" title="Chia sẻ" onClick={(e) => { e.stopPropagation(); onShare(f); }}>
                <IcoShare size={13} />
              </button>
              {isManager && (
                <button className="fca-btn" title="Xóa" onClick={(e) => { e.stopPropagation(); onDelete(f); }}>
                  <IcoTrash size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────
function DetailPanel({ item, onClose, onDownload, onShare, onView }: {
  item: DriveItem; onClose: () => void; onDownload: () => void; onShare: () => void; onView: () => void;
}) {
  const m = extMeta(item.name);
  const canView = /\.(docx?|xlsx?|pptx?|pdf)$/i.test(item.name);
  return (
    <>
      <div className="dd-head" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4>{item.name}</h4>
          <span className="file-ext-badge" style={{ background: m.bg, color: m.color, position: "static", marginTop: 2, display: "inline-block" }}>{m.label}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, flexShrink: 0 }}>
          <IcoClose size={15} />
        </button>
      </div>
      <div className="dd-preview" style={{ background: m.bg }}>
        <IcoFile color={m.color} size={60} />
      </div>
      <div className="dd-sec">
        <h5>Chi tiết</h5>
        <div className="dd-row"><span className="dl">Kích thước</span><span className="dv">{formatSize(item.size)}</span></div>
        <div className="dd-row"><span className="dl">Ngày sửa</span><span className="dv">{formatDate(item.lastModifiedDateTime)}</span></div>
        <div className="dd-row"><span className="dl">Ngày tạo</span><span className="dv">{formatDate(item.createdDateTime)}</span></div>
        <div className="dd-row"><span className="dl">Loại</span><span className="dv">{m.label}</span></div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {canView && (
          <button className="abtn ghost" style={{ width: "100%", gap: 7, justifyContent: "center" }} onClick={onView}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Xem trước
          </button>
        )}
        <button className="abtn primary" style={{ width: "100%", gap: 7, justifyContent: "center" }} onClick={onDownload}>
          <IcoDownload size={14} /> Tải về
        </button>
        <button className="abtn ghost" style={{ width: "100%", gap: 7, justifyContent: "center" }} onClick={onShare}>
          <IcoShare size={14} /> Chia sẻ
        </button>
      </div>
    </>
  );
}

// ── Office Viewer Modal ────────────────────────────────────────
function OfficeViewerModal({ item, onClose }: { item: DriveItem; onClose: () => void }) {
  const isOffice = /\.(docx?|xlsx?|pptx?)$/i.test(item.name);
  const downloadUrl = item["@microsoft.graph.downloadUrl"];
  const embedUrl = isOffice && downloadUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
    : downloadUrl;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "rgba(0,0,0,.85)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--elev)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 600, fontSize: ".92rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60vw" }}>{item.name}</span>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="abtn ghost" style={{ gap: 6 }}>
              <IcoDownload size={13} /> Tải về
            </a>
          )}
          <button onClick={onClose} className="abtn ghost" style={{ padding: "6px 10px" }}>
            <IcoClose size={15} />
          </button>
        </div>
      </div>
      {embedUrl ? (
        <iframe src={embedUrl} style={{ flex: 1, width: "100%", border: "none" }} title={item.name} allowFullScreen />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
          Không thể xem trước file này
        </div>
      )}
    </div>
  );
}
