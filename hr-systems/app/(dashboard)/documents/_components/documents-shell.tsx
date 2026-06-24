"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { FileBrowser } from "./file-browser";

const LS_KEY = "jh-doc-categories";
const FOLDER_PALETTE = ["#3B5BDB","#22c55e","#f59e0b","#a78bfa","#22d3ee","#f472b6","#ef4444","#94a3b8"];
function paletteColor(i: number) { return FOLDER_PALETTE[i % FOLDER_PALETTE.length]; }

// ── Types ──────────────────────────────────────────────────────
type SystemDoc = {
  id: string;
  name: string;
  description?: string | null;
  fileUrl: string;
  mimeType?: string | null;
  size?: number | null;
  category?: string | null;
  createdAt: string;
  employeeId?: number | null;
  employee?: { id: number; fullName: string } | null;
  uploadedBy: { id: number; fullName: string };
};

// ── File type meta (same as template) ─────────────────────────
const EXT_META: Record<string, { color: string; bg: string; label: string; ico: string }> = {
  pdf:  { color:"#ef4444", bg:"rgba(239,68,68,.12)",   label:"PDF",  ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 13h4M10 17h4M10 9h1"/>' },
  doc:  { color:"#3B5BDB", bg:"rgba(59,91,219,.12)",   label:"DOC",  ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>' },
  docx: { color:"#3B5BDB", bg:"rgba(59,91,219,.12)",   label:"DOCX", ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>' },
  xls:  { color:"#22c55e", bg:"rgba(34,197,94,.12)",   label:"XLS",  ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13l6 6M15 13l-6 6"/>' },
  xlsx: { color:"#22c55e", bg:"rgba(34,197,94,.12)",   label:"XLSX", ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>' },
  png:  { color:"#a78bfa", bg:"rgba(167,139,250,.12)", label:"PNG",  ico:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' },
  jpg:  { color:"#f472b6", bg:"rgba(244,114,182,.12)", label:"JPG",  ico:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' },
  jpeg: { color:"#f472b6", bg:"rgba(244,114,182,.12)", label:"JPG",  ico:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' },
  zip:  { color:"#94a3b8", bg:"rgba(148,163,184,.12)", label:"ZIP",  ico:'<path d="M21 8v13H3V8"/><path d="M23 3H1l2 5h18z"/>' },
  txt:  { color:"#cbd5e1", bg:"rgba(203,213,225,.10)", label:"TXT",  ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>' },
};
const DEFAULT_META = { color:"#94a3b8", bg:"rgba(148,163,184,.12)", label:"FILE", ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>' };
function extOf(name: string) { return (name.split(".").pop() ?? "").toLowerCase(); }
function extMeta(name: string) { return EXT_META[extOf(name)] ?? { ...DEFAULT_META, label: (extOf(name) || "FILE").toUpperCase() }; }
function formatSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function initials(name: string) { return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase(); }

// ── Folder/Category definitions ────────────────────────────────
const FOLDERS = [
  { id: "all",      name: "Tất cả",    icon: "root",  special: true },
  { id: "starred",  name: "Yêu thích", icon: "star",  special: true },
  { id: "recent",   name: "Gần đây",   icon: "clock", special: true },
];
const CATEGORIES = [
  { id: "contract", name: "Hợp đồng",   color: "#3B5BDB" },
  { id: "policy",   name: "Quy định",   color: "#22c55e" },
  { id: "report",   name: "Báo cáo",    color: "#f59e0b" },
  { id: "hr",       name: "Nhân sự",    color: "#a78bfa" },
  { id: "other",    name: "Khác",       color: "#94a3b8" },
];
const SPECIAL_ICONS: Record<string, string> = {
  root:  '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  star:  '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>',
  folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
};

// ── Upload modal ───────────────────────────────────────────────
type CategoryDef = { id: string; name: string; color: string; parentId?: string };
function UploadModal({ onClose, defaultCategory, allCategories, onSuccess }: { onClose: () => void; defaultCategory?: string; allCategories: CategoryDef[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? allCategories[0]?.id ?? "other");
  const [scope, setScope] = useState<"org" | "employee">("org");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<{ id: number; fullName: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: empData } = useQuery({
    queryKey: ["employees-search", employeeSearch],
    queryFn: async () => {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(employeeSearch)}&limit=10`);
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: scope === "employee" && employeeSearch.length >= 1,
    staleTime: 30_000,
  });
  const employees: { id: number; fullName: string }[] = empData?.data ?? [];

  async function handleSubmit() {
    if (!file) { toast({ title: "Chọn file trước", variant: "error" }); return; }
    if (scope === "employee" && !selectedEmp) { toast({ title: "Chọn nhân viên", variant: "error" }); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name);
    if (description) fd.append("description", description);
    fd.append("category", category);
    if (scope === "employee" && selectedEmp) fd.append("employeeId", String(selectedEmp.id));
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi upload" }));
      toast({ title: err.error ?? "Lỗi upload", variant: "error" });
      return;
    }
    toast({ title: "Đã tải lên thành công" });
    onSuccess();
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)" }} onClick={onClose}>
      <div style={{ background:"var(--elev)",border:"1px solid var(--border)",borderRadius:14,padding:24,width:440,maxWidth:"95vw",boxShadow:"var(--shadow-lg)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
          <span style={{ fontWeight:700,fontSize:15,color:"var(--text)" }}>Tải lên tài liệu</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",lineHeight:1,fontSize:18,padding:4 }}>✕</button>
        </div>

        <div style={{ border:"2px dashed var(--border-2)",borderRadius:10,padding:"18px 12px",textAlign:"center",cursor:"pointer",marginBottom:14,transition:"border-color .2s,background .2s" }}
          onClick={() => fileRef.current?.click()}
          onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLDivElement).style.background = "var(--accent-soft)"; }}
          onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-2)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
          <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name); } }} />
          {file ? (
            <div style={{ fontSize:13,color:"var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth={1.8} width={28} height={28} style={{ margin:"0 auto 6px" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <div style={{ fontWeight:600 }}>{file.name}</div>
              <div style={{ color:"var(--text-3)",fontSize:12,marginTop:2 }}>{formatSize(file.size)}</div>
            </div>
          ) : (
            <div style={{ color:"var(--text-3)",fontSize:13 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={32} height={32} style={{ margin:"0 auto 8px",opacity:.5 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p style={{ fontWeight:500,margin:"0 0 3px" }}>Nhấn để chọn file</p>
              <span style={{ fontSize:12,opacity:.7 }}>Tối đa 20MB</span>
            </div>
          )}
        </div>

        {[
          { label: "Tên tài liệu", el: <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên hiển thị…" style={{ width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--content)",color:"var(--text)",fontSize:13,boxSizing:"border-box" as const,outline:"none",fontFamily:"inherit" }} /> },
          { label: "Mô tả (tùy chọn)", el: <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả ngắn…" style={{ width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--content)",color:"var(--text)",fontSize:13,resize:"vertical",boxSizing:"border-box" as const,outline:"none",fontFamily:"inherit" }} /> },
        ].map(({ label, el }) => (
          <div key={label} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11,color:"var(--text-3)",display:"block",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em" }}>{label}</label>
            {el}
          </div>
        ))}

        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:11,color:"var(--text-3)",display:"block",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em" }}>Danh mục</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--content)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"inherit" }}>
            {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,color:"var(--text-3)",display:"block",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em" }}>Phạm vi</label>
          <div style={{ display:"flex",gap:6 }}>
            {(["org","employee"] as const).map(s => (
              <button key={s} onClick={() => setScope(s)} style={{ flex:1,padding:"7px 0",borderRadius:8,border:`1.5px solid ${scope===s?"var(--accent)":"var(--border)"}`,background:scope===s?"var(--accent)":"transparent",color:scope===s?"#fff":"var(--text-2)",fontSize:12,cursor:"pointer",fontWeight:scope===s?700:500,transition:"all .15s",fontFamily:"inherit" }}>
                {s==="org" ? "Tổ chức" : "Gắn nhân viên"}
              </button>
            ))}
          </div>
        </div>

        {scope === "employee" && (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11,color:"var(--text-3)",display:"block",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em" }}>Nhân viên</label>
            {selectedEmp ? (
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--content)" }}>
                <span style={{ fontSize:13,flex:1,color:"var(--text)" }}>{selectedEmp.fullName}</span>
                <button onClick={() => setSelectedEmp(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",fontSize:16,lineHeight:1,padding:2 }}>✕</button>
              </div>
            ) : (
              <div style={{ position:"relative" }}>
                <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Tìm nhân viên…" style={{ width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--content)",color:"var(--text)",fontSize:13,boxSizing:"border-box" as const,outline:"none",fontFamily:"inherit" }} />
                {employees.length > 0 && (
                  <div style={{ position:"absolute",top:"100%",left:0,right:0,background:"var(--elev)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"var(--shadow)",zIndex:10,marginTop:2 }}>
                    {employees.map(e => (
                      <button key={e.id} onClick={() => { setSelectedEmp(e); setEmployeeSearch(""); }} style={{ display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--text)",fontFamily:"inherit",transition:"background .1s" }}
                        onMouseOver={ev => (ev.currentTarget.style.background="var(--content)")} onMouseOut={ev => (ev.currentTarget.style.background="none")}>
                        {e.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={uploading} style={{ width:"100%",padding:"10px 0",borderRadius:9,background:"var(--accent)",color:"#fff",border:"none",cursor:uploading?"not-allowed":"pointer",fontSize:14,fontWeight:700,opacity:uploading?.7:1,fontFamily:"inherit",transition:"opacity .15s" }}>
          {uploading ? "Đang tải lên…" : "Tải lên"}
        </button>
      </div>
    </div>
  );
}

// ── Main shell ─────────────────────────────────────────────────
export function DocumentsShell({ isManager, oneDriveConnected }: { isManager: boolean; oneDriveConnected: boolean }) {
  const [source, setSource] = useState<"system" | "onedrive">("system");
  const [selFolder, setSelFolder] = useState("all");
  const [fileType, setFileType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selDoc, setSelDoc] = useState<SystemDoc | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [customCategories, setCustomCategories] = useState<CategoryDef[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setCustomCategories(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveCustomCategories(cats: CategoryDef[]) {
    setCustomCategories(cats);
    try { localStorage.setItem(LS_KEY, JSON.stringify(cats)); } catch { /* ignore */ }
  }

  const SPECIAL_IDS = new Set(["all", "starred", "recent"]);
  const isSpecialFolder = (id: string) => SPECIAL_IDS.has(id);

  function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const allExisting = [...CATEGORIES, ...customCategories];
    const color = paletteColor(allExisting.length);
    // If currently in a real folder (not special), create as subfolder
    const parentId = (!isSpecialFolder(selFolder) && selFolder !== "all") ? selFolder : undefined;
    const newCat: CategoryDef = { id, name, color, ...(parentId ? { parentId } : {}) };
    saveCustomCategories([...customCategories, newCat]);
    setNewFolderName("");
    setShowNewFolder(false);
    setSelFolder(id);
  }

  function handleDeleteFolder(id: string) {
    // Also delete all subfolders recursively
    const toDelete = new Set<string>();
    const collect = (fid: string) => {
      toDelete.add(fid);
      customCategories.filter(c => c.parentId === fid).forEach(c => collect(c.id));
    };
    collect(id);
    saveCustomCategories(customCategories.filter(c => !toDelete.has(c.id)));
    if (toDelete.has(selFolder)) setSelFolder("all");
  }

  const allCategories: CategoryDef[] = [...CATEGORIES, ...customCategories];

  // Get full label path for current folder
  function getFolderPath(id: string): string {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return "Tài liệu";
    if (cat.parentId) return getFolderPath(cat.parentId) + " › " + cat.name;
    return cat.name;
  }

  // Get all descendant ids of a folder (for doc count)
  function getDescendantIds(id: string): string[] {
    const children = allCategories.filter(c => c.parentId === id);
    return [id, ...children.flatMap(c => getDescendantIds(c.id))];
  }

  // Doc count: folder + all subfolders
  const catDocCount = (id: string) => {
    const ids = getDescendantIds(id);
    return allDocs.filter(d => d.category && ids.includes(d.category)).length;
  };

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isFetching } = useQuery({
    queryKey: ["sys-docs", selFolder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selFolder !== "all" && selFolder !== "starred" && selFolder !== "recent") {
        params.set("category", selFolder);
      }
      const res = await fetch(`/api/documents?${params}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: source === "system",
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sys-docs"] }); setSelDoc(null); toast({ title: "Đã xóa tài liệu" }); },
    onError: e => toast({ title: "Lỗi xóa", description: String(e), variant: "error" }),
  });

  const allDocs: SystemDoc[] = data?.data ?? [];

  // Apply folder filter (include subfolder docs when in a parent folder)
  let docs = allDocs;
  if (selFolder === "recent") docs = [...allDocs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  // fileType filter
  if (fileType !== "all") {
    const typeMap: Record<string, string[]> = { pdf:["pdf"], doc:["doc","docx"], xls:["xls","xlsx"], img:["png","jpg","jpeg","gif"] };
    const exts = typeMap[fileType] ?? [];
    if (exts.length) docs = docs.filter(d => exts.includes(extOf(d.name)));
    else docs = docs.filter(d => !Object.values(typeMap).flat().includes(extOf(d.name)));
  }
  // sort
  if (sortBy === "name") docs = [...docs].sort((a,b) => a.name.localeCompare(b.name));
  else if (sortBy === "size") docs = [...docs].sort((a,b) => (b.size??0) - (a.size??0));
  else docs = [...docs].sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const folderLabel = selFolder === "all" ? "Tất cả tài liệu"
    : selFolder === "starred" ? "Yêu thích"
    : selFolder === "recent" ? "Gần đây"
    : allCategories.find(c => c.id === selFolder)?.name ?? "Tài liệu";

  function getFolderDepth(id: string, depth = 0): number {
    const cat = allCategories.find(c => c.id === id);
    if (!cat?.parentId) return depth;
    return getFolderDepth(cat.parentId, depth + 1);
  }

  function renderFolderTree(cats: CategoryDef[], parentId: string | undefined, depth: number): React.ReactNode {
    const filtered = cats
      .filter(c => c.parentId === parentId && (!folderSearch || c.name.toLowerCase().includes(folderSearch.toLowerCase()) || cats.some(sub => sub.parentId === c.id)))
      .sort((a, b) => {
        // Built-in categories first
        const aBuiltIn = CATEGORIES.some(bc => bc.id === a.id);
        const bBuiltIn = CATEGORIES.some(bc => bc.id === b.id);
        if (aBuiltIn && !bBuiltIn) return -1;
        if (!aBuiltIn && bBuiltIn) return 1;
        return a.name.localeCompare(b.name);
      });

    return filtered.map(c => {
      const col = c.color;
      const isCustom = customCategories.some(cc => cc.id === c.id);
      const paddingLeft = 36 + depth * 14;
      const icoSize = depth === 0 ? 22 : 18;
      const children = allCategories.filter(cc => cc.parentId === c.id);
      const isExpanded = selFolder === c.id || getDescendantIds(c.id).includes(selFolder);

      return (
        <div key={c.id}>
          <div
            className={`folder-item${selFolder===c.id?" on":""}`}
            style={{ paddingLeft, paddingRight: 8 }}
            onClick={() => setSelFolder(c.id)}
          >
            <div className="fi-ico" style={{ width: icoSize, height: icoSize, borderRadius: 5, background: selFolder===c.id ? "var(--accent-soft)" : `${col}22`, flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={selFolder===c.id?"var(--accent-ink)":col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={icoSize-8} height={icoSize-8} dangerouslySetInnerHTML={{ __html: SPECIAL_ICONS.folder }} />
            </div>
            <span className="fi-name" style={{ fontSize: depth === 0 ? ".84rem" : ".78rem" }}>{c.name}</span>
            <span className="fi-cnt">{catDocCount(c.id)}</span>
            {isCustom && (
              <button
                onClick={e => { e.stopPropagation(); if(confirm(`Xóa thư mục "${c.name}"?`)) handleDeleteFolder(c.id); }}
                style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",opacity:0,padding:"2px 3px",lineHeight:1,fontSize:12,flexShrink:0 }}
                className="folder-del-btn"
              >✕</button>
            )}
          </div>
          {/* Render children when expanded */}
          {(isExpanded || children.length > 0) && renderFolderTree(cats, c.id, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="doc-layout">
      {/* ── SIDEBAR ── */}
      <div className="doc-sidebar">
        <div className="doc-sidebar-head">
          <h3>Nguồn tài liệu</h3>
          <div className="doc-search-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input type="text" placeholder="Tìm thư mục…" value={folderSearch} onChange={e => setFolderSearch(e.target.value)} />
          </div>
        </div>

        <div className="doc-folders">
          {/* System source */}
          <button className={`folder-source-btn${source==="system"?" on":""}`} onClick={() => { setSource("system"); setSelFolder("all"); }}>
            <div className="fi-ico" style={{ background: source==="system" ? "var(--accent-soft)" : "var(--content)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={source==="system"?"var(--accent-ink)":"var(--text-3)"} strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="5" rx="1"/></svg>
            </div>
            <span className="fi-name">Hệ thống</span>
          </button>

          {/* System subfolders — shown when source=system */}
          {source === "system" && (
            <>
              {FOLDERS.map(f => (
                <div key={f.id} className={`folder-item sub${selFolder===f.id?" on":""}`} onClick={() => setSelFolder(f.id)}>
                  <div className="fi-ico" style={{ background: selFolder===f.id ? "var(--accent-soft)" : "var(--content)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={selFolder===f.id?"var(--accent-ink)":"var(--text-3)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: SPECIAL_ICONS[f.icon] }} />
                  </div>
                  <span className="fi-name">{f.name}</span>
                  <span className="fi-cnt">{f.id==="all" ? allDocs.length : f.id==="recent" ? Math.min(8,allDocs.length) : ""}</span>
                </div>
              ))}
              <div className="folder-divider" />
              {/* Recursive folder tree */}
              {renderFolderTree(allCategories, undefined, 0)}

              {/* New folder inline input — shown at the right indent level */}
              {showNewFolder && (() => {
                const parentIsSpecial = isSpecialFolder(selFolder) || selFolder === "all";
                const depth = parentIsSpecial ? 0 : getFolderDepth(selFolder);
                const indent = 36 + depth * 14;
                return (
                  <div style={{ padding:`4px 10px 6px ${indent}px`, display:"flex", flexDirection:"column", gap:5 }}>
                    <input
                      ref={newFolderRef}
                      autoFocus
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      onKeyDown={e => { if(e.key==="Enter") handleCreateFolder(); if(e.key==="Escape") { setShowNewFolder(false); setNewFolderName(""); } }}
                      placeholder="Tên thư mục…"
                      style={{ width:"100%",padding:"6px 9px",borderRadius:6,border:"1.5px solid var(--accent)",background:"var(--content)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const }}
                    />
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={handleCreateFolder} style={{ flex:1,background:"var(--accent)",border:"none",color:"#fff",borderRadius:6,padding:"5px 0",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>OK</button>
                      <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} style={{ flex:1,background:"none",border:"1px solid var(--border)",color:"var(--text-3)",borderRadius:6,padding:"5px 0",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Hủy</button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          <div className="folder-divider" />

          {/* OneDrive source */}
          <button className={`folder-source-btn${source==="onedrive"?" on":""}`} onClick={() => setSource("onedrive")}>
            <div className="fi-ico" style={{ background: source==="onedrive" ? "var(--accent-soft)" : "var(--content)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={source==="onedrive"?"var(--accent-ink)":"var(--text-3)"} strokeWidth={2} strokeLinecap="round" dangerouslySetInnerHTML={{ __html: SPECIAL_ICONS.cloud }} />
            </div>
            <span className="fi-name">OneDrive</span>
            {!oneDriveConnected && <span className="folder-source-badge">Chưa kết nối</span>}
          </button>
        </div>

        {source === "system" && (
          <button className="add-folder-btn" onClick={() => { setShowNewFolder(true); setTimeout(() => newFolderRef.current?.focus(), 50); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>
            {!isSpecialFolder(selFolder) && selFolder !== "all"
              ? `Thư mục con trong "${allCategories.find(c=>c.id===selFolder)?.name ?? ""}"`
              : "Thêm thư mục"}
          </button>
        )}
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ display:"flex",overflow:"hidden",flex:1 }}>
        {source === "onedrive" ? (
          <div style={{ flex:1,overflow:"hidden" }}>
            <FileBrowser isManager={isManager} connected={oneDriveConnected} />
          </div>
        ) : (
          <>
            <div className="doc-main" style={{ flex:1 }}>
              {/* Header */}
              <div className="doc-main-head">
                <div style={{ flex:1,minWidth:0 }}>
                  <h2>{folderLabel}</h2>
                  <div className="breadcrumb">
                    <span style={{ cursor:"pointer",color:"var(--accent-ink)" }} onClick={() => setSelFolder("all")}>Tài liệu</span>
                    {selFolder !== "all" && !isSpecialFolder(selFolder) && (() => {
                      // Build ancestor chain
                      const chain: CategoryDef[] = [];
                      let cur = allCategories.find(c => c.id === selFolder);
                      while (cur) { chain.unshift(cur); cur = cur.parentId ? allCategories.find(c => c.id === cur!.parentId) : undefined; }
                      return chain.map((c, i) => (
                        <span key={c.id} style={{ display:"contents" }}>
                          <span className="bc-sep">›</span>
                          {i < chain.length - 1
                            ? <span style={{ cursor:"pointer",color:"var(--accent-ink)" }} onClick={() => setSelFolder(c.id)}>{c.name}</span>
                            : <span className="bc-cur">{c.name}</span>
                          }
                        </span>
                      ));
                    })()}
                    {isSpecialFolder(selFolder) && selFolder !== "all" && <><span className="bc-sep">›</span><span className="bc-cur">{folderLabel}</span></>}
                  </div>
                </div>
                <div className="doc-main-actions">
                  <button className="abtn ghost" style={{ gap:7,display:"flex",alignItems:"center" }} onClick={() => setShowUpload(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={15} height={15}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Tải lên
                  </button>
                  <div className="view-toggle">
                    <button className={view==="grid"?"on":""} onClick={() => setView("grid")} title="Lưới">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    </button>
                    <button className={view==="list"?"on":""} onClick={() => setView("list")} title="Danh sách">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="doc-filter-bar">
                {[
                  { id:"all", label:"Tất cả" },
                  { id:"pdf", label:"PDF" },
                  { id:"doc", label:"Word" },
                  { id:"xls", label:"Excel" },
                  { id:"img", label:"Hình ảnh" },
                  { id:"other", label:"Khác" },
                ].map(t => (
                  <button key={t.id} className={`type-chip${fileType===t.id?" on":""}`} onClick={() => setFileType(t.id)}>{t.label}</button>
                ))}
                <div className="doc-sort">
                  <span>Sắp xếp:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="date">Mới nhất</option>
                    <option value="name">Tên A–Z</option>
                    <option value="size">Kích thước</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="doc-grid-wrap">
                {isFetching && docs.length === 0 ? (
                  <div style={{ textAlign:"center",color:"var(--text-3)",paddingTop:60,fontSize:14 }}>Đang tải…</div>
                ) : docs.length === 0 ? (
                  <div style={{ textAlign:"center",color:"var(--text-3)",paddingTop:60 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={48} height={48} style={{ margin:"0 auto 12px",opacity:.3 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                    <p style={{ fontSize:14,fontWeight:500 }}>Chưa có tài liệu nào</p>
                    <button className="abtn primary" style={{ marginTop:16,gap:7,display:"inline-flex",alignItems:"center" }} onClick={() => setShowUpload(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Tải lên ngay
                    </button>
                  </div>
                ) : view === "list" ? (
                  <div className="doc-list">
                    {docs.map(doc => {
                      const m = extMeta(doc.name);
                      return (
                        <div key={doc.id} className="doc-list-item" onClick={() => setSelDoc(doc === selDoc ? null : doc)}>
                          <div className="dli-ico" style={{ background: m.bg }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth={2} dangerouslySetInnerHTML={{ __html: m.ico }} />
                          </div>
                          <div className="dli-name">{doc.name}</div>
                          <div className="dli-type" style={{ background: m.bg, color: m.color }}>{m.label}</div>
                          <div className="dli-size">{formatSize(doc.size)}</div>
                          <div className="dli-date">{formatDate(doc.createdAt)}</div>
                          <div className="dli-owner" title={doc.uploadedBy.fullName}>{initials(doc.uploadedBy.fullName)}</div>
                          <div className="dli-actions">
                            <a href={doc.fileUrl} download={doc.name} className="fca-btn" title="Tải về" onClick={e => e.stopPropagation()}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                            {isManager && (
                              <button className="fca-btn" title="Xóa" style={{ color:"#ef4444" }} onClick={e => { e.stopPropagation(); if(confirm("Xóa tài liệu này?")) deleteMutation.mutate(doc.id); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="doc-grid">
                    {docs.map(doc => {
                      const m = extMeta(doc.name);
                      return (
                        <div key={doc.id} className={`doc-file-card${selDoc?.id===doc.id?" selected":""}`} onClick={() => setSelDoc(doc === selDoc ? null : doc)}>
                          <div className="file-preview" style={{ background: m.bg }}>
                            {doc.mimeType?.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={doc.fileUrl} alt={doc.name} style={{ width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit",position:"absolute",inset:0 }} />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth={1.5} width={40} height={40} dangerouslySetInnerHTML={{ __html: m.ico }} />
                            )}
                            <span className="file-ext-badge" style={{ background:`${m.color}22`, color: m.color }}>{m.label}</span>
                          </div>
                          <div className="file-card-body">
                            <div className="file-card-name" title={doc.name}>{doc.name}</div>
                            <div className="file-card-meta">{formatSize(doc.size)} · {formatDate(doc.createdAt)}</div>
                            {doc.employee && (
                              <div className="file-card-tags">
                                <span className="file-tag">{doc.employee.fullName}</span>
                              </div>
                            )}
                            {doc.category && (
                              <div className="file-card-tags" style={{ marginTop: doc.employee ? 3 : 6 }}>
                                <span className="file-tag">{CATEGORIES.find(c=>c.id===doc.category)?.name ?? doc.category}</span>
                              </div>
                            )}
                          </div>
                          <div className="file-card-foot">
                            <div className="file-av">{initials(doc.uploadedBy.fullName)}</div>
                            <div className="file-owner">{doc.uploadedBy.fullName}</div>
                            <div className="file-card-actions">
                              <a href={doc.fileUrl} download={doc.name} className="fca-btn" title="Tải về" onClick={e => e.stopPropagation()}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </a>
                              {isManager && (
                                <button className="fca-btn" title="Xóa" style={{ color:"#ef4444" }} onClick={e => { e.stopPropagation(); if(confirm("Xóa tài liệu này?")) deleteMutation.mutate(doc.id); }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── DETAIL PANEL ── */}
            <div className={`doc-detail${selDoc ? "" : " hidden"}`}>
              {selDoc && (() => {
                const m = extMeta(selDoc.name);
                return (
                  <>
                    <div className="dd-head">
                      <h4>{selDoc.name}</h4>
                      <span className="file-ext-badge" style={{ background: m.bg, color: m.color, position:"static" }}>{m.label}</span>
                    </div>
                    <div className="dd-preview" style={{ background: m.bg, overflow:"hidden", position:"relative" }}>
                      {selDoc.mimeType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selDoc.fileUrl} alt={selDoc.name} style={{ width:"100%",height:"100%",objectFit:"contain",position:"absolute",inset:0 }} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth={1.2} width={60} height={60} dangerouslySetInnerHTML={{ __html: m.ico }} />
                      )}
                    </div>
                    <div className="dd-sec">
                      <h5>Chi tiết</h5>
                      <div className="dd-row"><span className="dl">Kích thước</span><span className="dv">{formatSize(selDoc.size)}</span></div>
                      <div className="dd-row"><span className="dl">Ngày tạo</span><span className="dv">{formatDate(selDoc.createdAt)}</span></div>
                      <div className="dd-row"><span className="dl">Người tạo</span><span className="dv">{selDoc.uploadedBy.fullName}</span></div>
                      {selDoc.employee && <div className="dd-row"><span className="dl">Nhân viên</span><span className="dv">{selDoc.employee.fullName}</span></div>}
                      {selDoc.category && <div className="dd-row"><span className="dl">Danh mục</span><span className="dv">{CATEGORIES.find(c=>c.id===selDoc.category)?.name ?? selDoc.category}</span></div>}
                    </div>
                    {selDoc.description && (
                      <div className="dd-sec">
                        <h5>Mô tả</h5>
                        <p style={{ fontSize:13,color:"var(--text-2)",lineHeight:1.5 }}>{selDoc.description}</p>
                      </div>
                    )}
                    <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:8 }}>
                      <a href={selDoc.fileUrl} download={selDoc.name} className="abtn primary" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,textDecoration:"none" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Tải về
                      </a>
                      {isManager && (
                        <button className="abtn ghost" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,color:"#ef4444",borderColor:"rgba(239,68,68,.3)" }} onClick={() => { if(confirm("Xóa tài liệu này?")) deleteMutation.mutate(selDoc.id); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                          Xóa
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal
          defaultCategory={selFolder !== "all" && selFolder !== "starred" && selFolder !== "recent" ? selFolder : undefined}
          allCategories={allCategories}
          onClose={() => setShowUpload(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["sys-docs"] })}
        />
      )}
    </div>
  );
}
