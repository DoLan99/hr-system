"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
  FolderPlus,
  Search,
  Download,
  Trash2,
  Share2,
  Eye,
  ChevronRight,
  Home,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
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

function fileIcon(item: DriveItem) {
  if (item.folder) return <Folder className="h-5 w-5 text-yellow-400" />;
  const mime = item.file?.mimeType ?? "";
  if (mime.includes("spreadsheet") || item.name.endsWith(".xlsx"))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (mime.includes("wordprocessingml") || item.name.endsWith(".docx"))
    return <FileText className="h-5 w-5 text-blue-500" />;
  if (mime.startsWith("image/"))
    return <FileImage className="h-5 w-5 text-pink-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function FileBrowser({ isManager }: { isManager: boolean }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: "root", name: "OneDrive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [viewItem, setViewItem] = useState<DriveItem | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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

  const items: DriveItem[] = filesData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drive/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive-files"] });
      toast({ title: "Đã xóa file" });
    },
    onError: (e) => toast({ title: "Lỗi xóa file", description: String(e), variant: "error" }),
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: currentFolder.id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive-files"] });
      setShowNewFolder(false);
      setNewFolderName("");
      toast({ title: "Đã tạo thư mục" });
    },
    onError: (e) => toast({ title: "Lỗi tạo thư mục", description: String(e), variant: "error" }),
  });

  const shareMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch("/api/drive/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type: "view", expirationHours: 24 }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      const url = data.data?.link?.webUrl;
      if (url) {
        navigator.clipboard.writeText(url);
        toast({ title: "Đã copy link chia sẻ (hết hạn sau 24h)" });
      }
    },
    onError: (e) => toast({ title: "Lỗi tạo link", description: String(e), variant: "error" }),
  });

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("parentId", currentFolder.id);
        try {
          const res = await fetch("/api/drive/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error(await res.text());
          toast({ title: `Đã upload: ${file.name}` });
        } catch (e) {
          toast({ title: `Lỗi upload ${file.name}`, description: String(e), variant: "error" });
        }
      }
      qc.invalidateQueries({ queryKey: ["drive-files"] });
    },
    [currentFolder.id, qc, toast],
  );

  const navigateTo = (item: DriveItem) => {
    if (!item.folder) return;
    setBreadcrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
  };

  const navigateToBreadcrumb = (idx: number) => {
    setBreadcrumbs((prev) => prev.slice(0, idx + 1));
  };

  const isOfficFile = (item: DriveItem) =>
    /\.(docx?|xlsx?|pptx?)$/i.test(item.name);
  const isPdf = (item: DriveItem) => item.file?.mimeType === "application/pdf";

  const handleView = (item: DriveItem) => {
    if (item.folder) { navigateTo(item); return; }
    setViewItem(item);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setIsSearching(true); }}
            onBlur={() => { if (!searchQuery) setIsSearching(false); }}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {isSearching && (
            <button
              onClick={() => { setIsSearching(false); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowNewFolder(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-accent"
        >
          <FolderPlus className="h-4 w-4" /> Tạo thư mục
        </button>

        <label className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-accent cursor-pointer">
          <Upload className="h-4 w-4" /> Upload
          <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </label>

        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["drive-files"] })}
          className="p-2 border rounded-lg hover:bg-accent"
          title="Làm mới"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
          <FolderPlus className="h-4 w-4 text-yellow-400" />
          <input
            autoFocus
            type="text"
            placeholder="Tên thư mục..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim())
                createFolderMutation.mutate(newFolderName.trim());
              if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
            }}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={() => newFolderName.trim() && createFolderMutation.mutate(newFolderName.trim())}
            disabled={createFolderMutation.isPending}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md"
          >
            Tạo
          </button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="text-xs text-gray-400">
            Hủy
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      {!isSearching && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Home className="h-3.5 w-3.5" />
          {breadcrumbs.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "hover:text-foreground"}
              >
                {b.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {/* File list */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Tên</th>
              <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Ngày sửa</th>
              <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Kích thước</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isFetching && items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Đang tải...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {isSearching ? "Không tìm thấy file nào" : "Thư mục trống"}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => handleView(item)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {fileIcon(item)}
                      <span className="font-medium truncate max-w-[280px]">{item.name}</span>
                      {item.folder && (
                        <span className="text-xs text-muted-foreground">
                          {item.folder.childCount} mục
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(item.lastModifiedDateTime)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                    {formatSize(item.size)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                        className="p-1.5 rounded hover:bg-accent"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === item.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 bg-popover border rounded-lg shadow-lg py-1">
                          {!item.folder && (isOfficFile(item) || isPdf(item)) && (
                            <button
                              onClick={() => { setViewItem(item); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                            >
                              <Eye className="h-4 w-4" /> Xem trước
                            </button>
                          )}
                          {!item.folder && item["@microsoft.graph.downloadUrl"] && (
                            <a
                              href={item["@microsoft.graph.downloadUrl"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => setOpenMenu(null)}
                            >
                              <Download className="h-4 w-4" /> Tải về
                            </a>
                          )}
                          <button
                            onClick={() => { shareMutation.mutate(item.id); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                          >
                            <Share2 className="h-4 w-4" /> Copy link chia sẻ
                          </button>
                          {isManager && (
                            <button
                              onClick={() => {
                                if (confirm(`Xóa "${item.name}"?`)) deleteMutation.mutate(item.id);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Xóa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Office / PDF viewer modal */}
      {viewItem && (
        <OfficeViewerModal item={viewItem} onClose={() => setViewItem(null)} />
      )}
    </div>
  );
}

// ── Office Viewer Modal ──────────────────────────────────────

function OfficeViewerModal({ item, onClose }: { item: DriveItem; onClose: () => void }) {
  const isOffice = /\.(docx?|xlsx?|pptx?)$/i.test(item.name);
  const downloadUrl = item["@microsoft.graph.downloadUrl"];

  const embedUrl = isOffice && downloadUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
    : downloadUrl;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <span className="font-medium truncate max-w-[60vw]">{item.name}</span>
        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-accent"
            >
              <Download className="h-4 w-4" /> Tải về
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent text-lg leading-none"
          >
            ✕
          </button>
        </div>
      </div>
      {/* Iframe */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="flex-1 w-full"
          title={item.name}
          allowFullScreen
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Không thể xem trước file này
        </div>
      )}
    </div>
  );
}
