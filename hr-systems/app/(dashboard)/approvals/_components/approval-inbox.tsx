"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrentUser } from "@/lib/contexts/current-user-context";

type PendingApproval = {
  id: string;
  stepOrder: number;
  dueAt: string | null;
  instance: {
    id: string;
    targetType: string;
    targetId: string;
    currentStep: number;
    startedAt: string | null;
    template: { name: string; targetType: string };
    initiator: { id: number; fullName: string; department: string | null };
  };
  step: { name: string; stepOrder: number; slaHours: number | null };
};

const TYPE_META: Record<string, { label: string; cls: string }> = {
  LEAVE:    { label: "Nghỉ phép",  cls: "at-leave"   },
  DOCUMENT: { label: "Tài liệu",   cls: "at-expense"  },
  PURCHASE: { label: "Mua sắm",    cls: "at-payment"  },
  TIMELOG:  { label: "Chấm công",  cls: "at-task"     },
  CUSTOM:   { label: "Khác",       cls: "at-other"    },
};

function typeMeta(t: string) {
  return TYPE_META[t] ?? TYPE_META.CUSTOM;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function ageLabel(dueAt: string | null): { label: string; urgent: boolean } {
  if (!dueAt) return { label: "—", urgent: false };
  const diffMs = new Date(dueAt).getTime() - Date.now();
  const hours = Math.floor(diffMs / 3_600_000);
  if (diffMs < 0) return { label: "Quá hạn", urgent: true };
  if (hours < 2) return { label: `Còn ${hours}h`, urgent: true };
  return {
    label: new Date(dueAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    urgent: false,
  };
}

function sentAgo(createdAt: string | null | undefined): string {
  if (!createdAt) return "—";
  const ms = Date.now() - new Date(createdAt).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export function ApprovalInbox() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useCurrentUser();

  const [typeTab, setTypeTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"age" | "prio" | "type">("age");
  const [openItem, setOpenItem] = useState<PendingApproval | null>(null);
  const [rejecting, setRejecting] = useState<PendingApproval | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ data: PendingApproval[] }>({
    queryKey: ["approvals-pending"],
    queryFn: async () => {
      const res = await fetch("/api/workflows/pending");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const items = data?.data ?? [];
  const urgentCount = items.filter((i) => ageLabel(i.dueAt).urgent).length;
  const overOneDayCount = items.filter((i) => {
    if (!i.instance.startedAt) return false;
    return Date.now() - new Date(i.instance.startedAt).getTime() > 86_400_000;
  }).length;

  const approveMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const res = await fetch(`/api/workflows/instances/${instanceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (resData) => {
      qc.invalidateQueries({ queryKey: ["approvals-pending"] });
      setOpenItem(null);
      const msg = resData.data?.status === "COMPLETED" ? "Đã duyệt — yêu cầu hoàn tất" : "Đã duyệt — chuyển bước tiếp theo";
      toast({ title: msg, variant: "success" });
    },
    onError: (e) => toast({ title: "Lỗi duyệt", description: String(e), variant: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ instanceId, comment }: { instanceId: string; comment: string }) => {
      const res = await fetch(`/api/workflows/instances/${instanceId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals-pending"] });
      setRejecting(null);
      setRejectReason("");
      setOpenItem(null);
      toast({ title: "Đã từ chối yêu cầu" });
    },
    onError: (e) => toast({ title: "Lỗi từ chối", description: String(e), variant: "error" }),
  });

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    Object.keys(TYPE_META).forEach((k) => {
      c[k] = items.filter((i) => i.instance.targetType === k).length;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (typeTab !== "all" && i.instance.targetType !== typeTab) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !i.instance.template.name.toLowerCase().includes(q) &&
            !i.instance.initiator.fullName.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "type") return a.instance.targetType.localeCompare(b.instance.targetType);
        if (sort === "prio") {
          const ua = ageLabel(a.dueAt).urgent ? 0 : 1;
          const ub = ageLabel(b.dueAt).urgent ? 0 : 1;
          return ua - ub;
        }
        return a.id.localeCompare(b.id);
      });
  }, [items, typeTab, search, sort]);

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function checkAll(checked: boolean) {
    setCheckedIds(checked ? new Set(filtered.map((i) => i.id)) : new Set());
  }

  async function bulkApprove() {
    for (const id of checkedIds) {
      const item = items.find((i) => i.id === id);
      if (item) await approveMutation.mutateAsync(item.instance.id).catch(() => {});
    }
    setCheckedIds(new Set());
    toast({ title: `Đã phê duyệt ${checkedIds.size} yêu cầu ✓`, variant: "success" });
  }

  function approveAll() {
    if (!filtered.length) { toast({ title: "Không có yêu cầu nào", variant: "error" }); return; }
    filtered.forEach((item) => approveMutation.mutate(item.instance.id));
    toast({ title: `Đã phê duyệt ${filtered.length} yêu cầu ✓`, variant: "success" });
  }

  const allChecked = filtered.length > 0 && filtered.every((i) => checkedIds.has(i.id));
  const someChecked = checkedIds.size > 0 && !allChecked;

  return (
    <>
      <style>{`
        .at-leave{--tc:#fbbf24;--ts:rgba(251,191,36,.13)}
        .at-salary{--tc:#3B5BDB;--ts:rgba(59,91,219,.13)}
        .at-expense{--tc:#a78bfa;--ts:rgba(167,139,250,.14)}
        .at-task{--tc:#4ADE80;--ts:rgba(74,222,128,.13)}
        .at-payment{--tc:#22d3ee;--ts:rgba(34,211,238,.13)}
        .at-other{--tc:#94a3b8;--ts:rgba(148,163,184,.13)}

        .ap-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        @media(max-width:700px){.ap-stats{grid-template-columns:repeat(2,1fr)}}
        .ap-stat{background:var(--elev);border:1px solid var(--border);border-radius:12px;padding:14px 16px;cursor:pointer;transition:border-color .15s}
        .ap-stat:hover{border-color:var(--border-2)}
        .ap-stat.on{border-color:var(--accent);background:var(--accent-soft)}
        .ap-stat .ast-val{font-family:var(--font-mono);font-size:1.6rem;font-weight:800;line-height:1}
        .ap-stat .ast-lbl{font-size:.74rem;color:var(--text-3);margin-top:5px}
        .ap-stat .ast-chg{font-size:.7rem;margin-top:3px;font-family:var(--font-mono);color:var(--text-3)}

        .ap-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
        .type-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .type-tab{height:34px;padding:0 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.81rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
        .type-tab:hover{border-color:var(--border-2);color:var(--text)}
        .type-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .type-tab .ttdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--tc)}
        .type-tab .tcnt{font-family:var(--font-mono);font-size:.62rem;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.07)}
        .type-tab.on .tcnt{background:var(--accent-soft-2)}
        .ap-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;background:var(--elev);border:1px solid var(--border);border-radius:9px;color:var(--text-3);min-width:190px}
        .ap-search svg{width:14px;height:14px;flex-shrink:0}
        .ap-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.82rem;color:var(--text);width:100%}

        .sort-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .sort-row .sr-lbl{font-size:.76rem;color:var(--text-3)}
        .sort-row select{font-family:inherit;font-size:.8rem;color:var(--text);background:var(--elev);border:1px solid var(--border);border-radius:8px;padding:5px 10px;outline:none;cursor:pointer}

        .bulk-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--accent-soft);border:1.5px solid var(--accent-soft-2);border-radius:10px;margin-bottom:12px;flex-wrap:wrap}
        .bulk-bar span{font-size:.86rem;color:var(--text-2)}

        .ap-list{display:flex;flex-direction:column;gap:8px}
        .ap-item{background:var(--elev);border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;cursor:pointer;transition:border-color .18s,box-shadow .15s;display:flex;align-items:stretch}
        .ap-item:hover{border-color:var(--border-2);box-shadow:0 4px 14px rgba(0,0,30,.2)}
        .ap-item.priority-high{border-left:3px solid var(--danger)}
        .ap-item.priority-med{border-left:3px solid var(--warn)}
        .ap-item.ap-urgent{border-left:3px solid var(--danger)}
        .ap-item.selected{background:color-mix(in srgb,var(--accent-soft) 40%,var(--elev));border-color:var(--accent-soft-2)}
        .ap-item-check{width:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);background:color-mix(in srgb,var(--content) 60%,transparent)}
        .ap-item.selected .ap-item-check{background:var(--accent-soft)}
        .ap-item input[type=checkbox]{width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0}
        .ap-main{flex:1;min-width:0;padding:14px 4px 14px 16px;display:flex;flex-direction:column;gap:3px}
        .ap-title-row{display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap}
        .ap-title{font-size:.9rem;font-weight:700;color:var(--text)}
        .ap-type-badge{font-family:var(--font-mono);font-size:.64rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--ts);color:var(--tc);white-space:nowrap}
        .ap-prio{font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap}
        .ap-prio.high{background:var(--danger-soft);color:var(--danger)}
        .ap-prio.med{background:var(--warn-soft);color:var(--warn)}
        .ap-desc{font-size:.8rem;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:500px;margin-bottom:5px}
        .ap-meta{display:flex;align-items:center;gap:12px;font-size:.71rem;color:var(--text-3);font-family:var(--font-mono);flex-wrap:wrap}
        .ap-meta span{display:inline-flex;align-items:center;gap:4px}
        .ap-meta svg{width:11px;height:11px}
        .ap-side{display:flex;align-items:center;gap:10px;flex-shrink:0;padding:0 16px 0 8px}
        .ap-age{font-family:var(--font-mono);font-size:.7rem;color:var(--text-3);white-space:nowrap;min-width:46px;text-align:right}
        .ap-age.urgent{color:var(--danger);font-weight:700}
        .ap-actions{display:flex;gap:5px}
        .ap-btn{height:30px;padding:0 12px;border-radius:7px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;border:1px solid transparent;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
        .ap-btn.approve{background:var(--ok-soft);color:var(--ok);border-color:rgba(74,222,128,.25)}
        .ap-btn.approve:hover{background:rgba(74,222,128,.22)}
        .ap-btn.reject{background:var(--danger-soft);color:var(--danger);border-color:rgba(255,107,107,.2)}
        .ap-btn.reject:hover{background:rgba(255,107,107,.2)}
        .ap-empty{text-align:center;padding:56px 20px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-3)}
        .ap-empty svg{width:48px;height:48px;margin:0 auto 16px;opacity:.3}

        .apd-back{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:100}
        .apd-drawer{position:fixed;top:0;right:0;height:100vh;width:520px;max-width:96vw;background:var(--elev);border-left:1px solid var(--border-2);box-shadow:-30px 0 60px rgba(0,0,0,.45);z-index:101;display:flex;flex-direction:column;overflow:hidden;animation:drawerIn .28s cubic-bezier(.16,1,.3,1)}
        @keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .apd-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .apd-close{margin-left:auto;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none}
        .apd-close:hover{background:var(--content);color:var(--text)}
        .apd-close svg{width:17px;height:17px}
        .apd-body{flex:1;overflow-y:auto;padding:22px}
        .apd-foot{flex-shrink:0;border-top:1px solid var(--border);padding:16px 22px;display:flex;gap:10px}
        .ap-type-ico{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:var(--ts);flex-shrink:0}
        .ap-type-ico svg{width:17px;height:17px;color:var(--tc)}

        .dsec{font-family:var(--font-mono);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:14px}
        .dcard{background:var(--content);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:18px}
        .drow{display:flex;align-items:center;gap:12px;padding:10px 15px;border-bottom:1px solid var(--border)}
        .drow:last-child{border-bottom:none}
        .drow .dl{font-size:.8rem;color:var(--text-3);min-width:110px;flex-shrink:0}
        .drow .dv{font-size:.88rem;color:var(--text);flex:1;font-weight:500}

        .rj-modal-back{position:fixed;inset:0;background:rgba(4,8,18,.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .rj-modal{width:100%;max-width:420px;background:var(--elev);border:1px solid var(--border-2);border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden}
        .rj-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border)}
        .rj-head h3{font-size:.98rem;font-weight:700;margin:0}
        .rj-head .x{margin-left:auto;width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none}
        .rj-head .x:hover{background:var(--content);color:var(--text)}
        .rj-head .x svg{width:16px;height:16px}
        .rj-body{padding:18px 20px;display:flex;flex-direction:column;gap:12px}
        .rj-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);display:block;margin-bottom:6px}
        .rj-field textarea{font-family:inherit;font-size:.9rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;outline:none;resize:vertical;min-height:76px;width:100%;transition:border-color .15s}
        .rj-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .rj-foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border)}
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0 }}>Hộp duyệt</h1>
          <p style={{ margin: "4px 0 0", fontSize: ".88rem", color: "var(--text-3)" }}>
            <b style={{ color: "var(--text)" }}>{isLoading ? "—" : items.length}</b> yêu cầu đang chờ ·{" "}
            <b style={{ color: "var(--danger)" }}>{urgentCount}</b> khẩn cấp · Phê duyệt viên: {user.fullName}
          </p>
        </div>
        <button className="abtn ghost" style={{ display: "inline-flex", alignItems: "center", gap: 7 }} onClick={approveAll}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}><path d="M5 12l5 5L20 6" /></svg>
          Duyệt tất cả
        </button>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        <div className={`ap-stat${typeTab === "all" ? " on" : ""}`} onClick={() => setTypeTab("all")}>
          <div className="ast-val" style={{ color: "var(--text)" }}>{isLoading ? "—" : items.length}</div>
          <div className="ast-lbl">Đang chờ duyệt</div>
          <div className="ast-chg">cần xử lý</div>
        </div>
        <div className="ap-stat" onClick={() => { setSort("prio"); setTypeTab("all"); }}>
          <div className="ast-val" style={{ color: "var(--danger)" }}>{urgentCount}</div>
          <div className="ast-lbl">Khẩn cấp</div>
          <div className="ast-chg" style={{ color: "var(--danger)" }}>cần xử lý ngay</div>
        </div>
        <div className="ap-stat">
          <div className="ast-val" style={{ color: "var(--warn)" }}>{overOneDayCount}</div>
          <div className="ast-lbl">Quá 1 ngày</div>
          <div className="ast-chg" style={{ color: "var(--warn)" }}>chờ lâu nhất</div>
        </div>
        <div className="ap-stat">
          <div className="ast-val" style={{ color: "var(--ok)" }}>{filtered.length}</div>
          <div className="ast-lbl">Đang hiển thị</div>
          <div className="ast-chg">theo bộ lọc</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ap-bar">
        <div className="type-tabs">
          <button className={`type-tab${typeTab === "all" ? " on" : ""}`} onClick={() => setTypeTab("all")}>
            Tất cả<span className="tcnt">{typeCounts.all ?? 0}</span>
          </button>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <button key={k} className={`type-tab ${v.cls}${typeTab === k ? " on" : ""}`} onClick={() => setTypeTab(k)}>
              <span className="ttdot" />
              {v.label}<span className="tcnt">{typeCounts[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="ap-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input type="text" placeholder="Tìm yêu cầu, người gửi…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Bulk bar */}
      {checkedIds.size > 0 && (
        <div className="bulk-bar">
          <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={(e) => checkAll(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: "var(--accent)", cursor: "pointer" }} />
          <span><b>{checkedIds.size}</b> mục đã chọn</span>
          <button className="abtn primary" style={{ height: 34, fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={bulkApprove} disabled={approveMutation.isPending}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}><path d="M5 12l5 5L20 6" /></svg>
            Duyệt đã chọn
          </button>
          <button className="abtn ghost" style={{ height: 34, fontSize: ".82rem", color: "var(--danger)", borderColor: "rgba(255,107,107,.3)" }}
            onClick={() => { const first = items.find((i) => checkedIds.has(i.id)); if (first) setRejecting(first); }}>
            ✗ Từ chối đã chọn
          </button>
          <button className="abtn ghost" style={{ height: 34, fontSize: ".8rem", marginLeft: "auto" }}
            onClick={() => setCheckedIds(new Set())}>Bỏ chọn</button>
        </div>
      )}

      {/* Sort row */}
      <div className="sort-row">
        <span className="sr-lbl">Sắp xếp:</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="age">Gửi lâu nhất trước</option>
          <option value="prio">Khẩn cấp trước</option>
          <option value="type">Theo loại</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: ".76rem", color: "var(--text-3)" }}>{filtered.length} yêu cầu</span>
      </div>

      {/* List */}
      <div className="ap-list">
        {!isLoading && filtered.length === 0 ? (
          <div className="ap-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></svg>
            <p style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-2)" }}>Hộp duyệt trống 🎉</p>
            <span style={{ fontSize: ".83rem" }}>Tất cả yêu cầu đã được xử lý.</span>
          </div>
        ) : (
          filtered.map((item) => {
            const t = typeMeta(item.instance.targetType);
            const age = ageLabel(item.dueAt);
            const isChecked = checkedIds.has(item.id);
            return (
              <div key={item.id}
                className={`ap-item ${t.cls}${age.urgent ? " ap-urgent" : ""}${isChecked ? " selected" : ""}`}
                onClick={() => setOpenItem(item)}>
                <div className="ap-item-check" onClick={(e) => { e.stopPropagation(); toggleCheck(item.id); }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(item.id)} onClick={(e) => e.stopPropagation()} />
                </div>
                <div className="ap-main">
                  <div className="ap-title-row">
                    <span className="ap-title">{item.instance.template.name}</span>
                    <span className="ap-type-badge">{t.label}</span>
                    {age.urgent && <span className="ap-prio high">Khẩn cấp</span>}
                  </div>
                  <div className="ap-desc">Bước {item.stepOrder}: {item.step.name}</div>
                  <div className="ap-meta">
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" /></svg>
                      {item.instance.initiator.fullName}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 5-9 5-9-5z" /><path d="M3 12l9 5 9-5" /></svg>
                      {item.instance.targetType}-{item.instance.targetId}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      Gửi {sentAgo(item.instance.startedAt)}
                    </span>
                  </div>
                </div>
                <div className="ap-side">
                  <span className={`ap-age${age.urgent ? " urgent" : ""}`}>{age.label}</span>
                  <div className="ap-actions">
                    <button className="ap-btn approve" onClick={(e) => { e.stopPropagation(); approveMutation.mutate(item.instance.id); }}>✓</button>
                    <button className="ap-btn reject" onClick={(e) => { e.stopPropagation(); setRejecting(item); }}>✗</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail drawer */}
      {openItem && (
        <>
          <div className="apd-back" onClick={() => setOpenItem(null)} />
          <div className="apd-drawer">
            <div className="apd-head">
              <span className={`ap-type-ico ${typeMeta(openItem.instance.targetType).cls}`} style={{ width: 40, height: 40 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".98rem", fontWeight: 700, color: "var(--text)" }}>{openItem.instance.template.name}</div>
                <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                  {openItem.id} · {typeMeta(openItem.instance.targetType).label} · {openItem.instance.initiator.fullName}
                </div>
              </div>
              <button className="apd-close" onClick={() => setOpenItem(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="apd-body">
              <div style={{ padding: 16, background: "var(--content)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontSize: ".84rem", color: "var(--text-2)", lineHeight: 1.6 }}>
                  Bước {openItem.stepOrder}: {openItem.step.name}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {ageLabel(openItem.dueAt).urgent && <span className="ap-prio high">Khẩn cấp</span>}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
                    Gửi: {sentAgo(openItem.instance.startedAt)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
                    Ref: {openItem.instance.targetType}-{openItem.instance.targetId}
                  </span>
                </div>
              </div>
              <div className="dsec">Chi tiết yêu cầu</div>
              <div className="dcard">
                <div className="drow"><span className="dl">Loại</span><span className="dv">{typeMeta(openItem.instance.targetType).label}</span></div>
                <div className="drow"><span className="dl">Bước</span><span className="dv">{openItem.stepOrder}: {openItem.step.name}</span></div>
                <div className="drow"><span className="dl">SLA</span><span className="dv">{openItem.step.slaHours ? `${openItem.step.slaHours}h` : "—"}</span></div>
                <div className="drow"><span className="dl">Hạn xử lý</span><span className="dv" style={{ color: ageLabel(openItem.dueAt).urgent ? "var(--danger)" : undefined }}>{ageLabel(openItem.dueAt).label}</span></div>
                {openItem.instance.targetType === "LEAVE" && (
                  <div className="drow">
                    <span className="dl"></span>
                    <a href="/leave" target="_blank" rel="noopener noreferrer" className="dv" style={{ color: "var(--accent-ink)" }}>Xem chi tiết đơn nghỉ →</a>
                  </div>
                )}
              </div>
              <div className="dsec">Người yêu cầu</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--content)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <span className="av" style={{ width: 36, height: 36, fontSize: ".8rem", flexShrink: 0, display: "grid", placeItems: "center" }}>
                  {initials(openItem.instance.initiator.fullName)}
                </span>
                <div>
                  <div style={{ fontSize: ".9rem", fontWeight: 700 }}>{openItem.instance.initiator.fullName}</div>
                  <div style={{ fontSize: ".76rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{openItem.instance.initiator.department ?? "—"}</div>
                </div>
              </div>
            </div>
            <div className="apd-foot">
              <button className="abtn ghost" style={{ flex: 1, color: "var(--danger)", borderColor: "rgba(255,107,107,.3)" }} onClick={() => setRejecting(openItem)}>✗ Từ chối</button>
              <button className="abtn primary" style={{ flex: 2 }} disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(openItem.instance.id)}>
                {approveMutation.isPending ? "Đang xử lý..." : "✓ Phê duyệt"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="rj-modal-back" onClick={(e) => { if (e.target === e.currentTarget) { setRejecting(null); setRejectReason(""); } }}>
          <div className="rj-modal">
            <div className="rj-head">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--danger-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2.4} strokeLinecap="round" width={15} height={15}><path d="M6 6l12 12M18 6L6 18" /></svg>
              </div>
              <h3>Từ chối yêu cầu</h3>
              <button className="x" onClick={() => { setRejecting(null); setRejectReason(""); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="rj-body">
              <div style={{ fontSize: ".85rem", color: "var(--text-2)" }}>
                Từ chối <b style={{ color: "var(--text)" }}>{rejecting.id}</b> — <b>{rejecting.instance.template.name}</b>?
              </div>
              <div className="rj-field">
                <label>Lý do từ chối *</label>
                <textarea placeholder="Nhập lý do để thông báo cho người gửi…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="rj-foot">
              <button className="abtn ghost" onClick={() => { setRejecting(null); setRejectReason(""); }}>Hủy</button>
              <button
                className="abtn primary"
                style={{ background: "var(--danger)" }}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ instanceId: rejecting.instance.id, comment: rejectReason.trim() })}
              >
                {rejectMutation.isPending ? "Đang gửi..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
