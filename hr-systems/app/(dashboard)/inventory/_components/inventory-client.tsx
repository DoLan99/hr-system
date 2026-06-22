"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────

type Category = { id: number; name: string; _count: { items: number } };

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: string | null;
  location: string | null;
  description: string | null;
  category: { id: number; name: string };
  _count: { assignments: number };
};

type Employee = { id: number; fullName: string; department: string | null };

type Tx = {
  id: string;
  type: "IN" | "OUT" | "ADJUST" | "RETURN";
  quantity: number;
  note: string | null;
  referenceNo: string | null;
  createdAt: string;
  actor: { fullName: string };
};

type StockStatus = "in" | "low" | "out";

// ── Category palette ──────────────────────────────────────────

const PALETTE: { color: string; bg: string; emoji: string }[] = [
  { color: "#3B5BDB", bg: "rgba(59,91,219,.13)",  emoji: "💻" },
  { color: "#22c55e", bg: "rgba(34,197,94,.13)",  emoji: "📎" },
  { color: "#f59e0b", bg: "rgba(245,158,11,.13)", emoji: "🪑" },
  { color: "#a78bfa", bg: "rgba(167,139,250,.14)", emoji: "🎁" },
  { color: "#22d3ee", bg: "rgba(34,211,238,.13)",  emoji: "☕" },
  { color: "#f472b6", bg: "rgba(244,114,182,.14)", emoji: "🧴" },
];

function emojiForName(name: string): string {
  const s = name.toLowerCase();
  if (/mac|laptop|máy tính|pc/.test(s))   return "💻";
  if (/màn hình|monitor|dell/.test(s))    return "🖥️";
  if (/bàn phím|keyboard/.test(s))        return "⌨️";
  if (/chuột|mouse/.test(s))              return "🖱️";
  if (/webcam|cam|camera/.test(s))        return "📷";
  if (/ghế|chair/.test(s))                return "🪑";
  if (/bàn|desk|table/.test(s))           return "🗄️";
  if (/giấy|paper|a4/.test(s))            return "📄";
  if (/bút|pen/.test(s))                  return "🖊️";
  if (/sổ|note|notebook/.test(s))         return "📓";
  if (/áo|tshirt|shirt/.test(s))          return "👕";
  if (/bình|chai|bottle/.test(s))         return "🍶";
  if (/cà phê|coffee/.test(s))            return "☕";
  return "";
}

function metaForCategory(catId: number, catName: string, itemName: string) {
  const p = PALETTE[catId % PALETTE.length];
  return {
    color: p.color,
    bg: p.bg,
    emoji: emojiForName(itemName) || p.emoji,
    label: catName,
  };
}

// ── Utils ─────────────────────────────────────────────────────

function fmtShort(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return (n % 1_000_000 === 0 ? v.toFixed(0) : v.toFixed(1)) + "tr";
  }
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return n.toLocaleString("vi-VN");
}

function fmtFull(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function stockStatus(q: number, min: number): StockStatus {
  if (q === 0) return "out";
  if (min > 0 && q <= min) return "low";
  return "in";
}

const STATUS_LABEL: Record<StockStatus, string> = {
  in: "Còn hàng",
  low: "Sắp hết",
  out: "Hết hàng",
};

const STATUS_COLOR: Record<StockStatus, string> = {
  in: "var(--ok)",
  low: "var(--warn)",
  out: "var(--danger)",
};

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.round(diff / 60) + " phút trước";
  if (diff < 86400) return Math.round(diff / 3600) + " giờ trước";
  return d.toLocaleDateString("vi-VN");
}

// ── Main Client ───────────────────────────────────────────────

export function InventoryClient({
  initialCategories,
  employees,
  isManager,
}: {
  initialCategories: Category[];
  employees: Employee[];
  isManager: boolean;
}) {
  const [selTab, setSelTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState<{ item: InventoryItem | null; dir: "IN" | "OUT" | "ADJUST" } | null>(null);
  const [prodFormOpen, setProdFormOpen] = useState<InventoryItem | "new" | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isFetching } = useQuery<{ data: InventoryItem[] }>({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/items");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 30_000,
  });

  const items = data?.data ?? [];

  // ── Aggregates ──
  const totals = useMemo(() => {
    let value = 0, units = 0, low = 0, out = 0;
    for (const it of items) {
      value += it.quantity * Number(it.costPrice ?? 0);
      units += it.quantity;
      const s = stockStatus(it.quantity, it.minQuantity);
      if (s === "low") low++;
      if (s === "out") out++;
    }
    return { value, units, low, out, count: items.length };
  }, [items]);

  // ── Tabs ──
  const tabs = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
      low: items.filter((i) => stockStatus(i.quantity, i.minQuantity) === "low").length,
      out: items.filter((i) => stockStatus(i.quantity, i.minQuantity) === "out").length,
    };
    for (const c of initialCategories) {
      counts[`c${c.id}`] = items.filter((i) => i.category.id === c.id).length;
    }
    const list: { k: string; l: string }[] = [
      { k: "all", l: "Tất cả" },
      { k: "low", l: "⚠ Sắp hết" },
      { k: "out", l: "Hết hàng" },
      ...initialCategories.map((c) => ({ k: `c${c.id}`, l: c.name })),
    ];
    return { list, counts };
  }, [items, initialCategories]);

  // ── Filter ──
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const st = stockStatus(p.quantity, p.minQuantity);
      if (selTab === "low" && st !== "low") return false;
      if (selTab === "out" && st !== "out") return false;
      if (selTab.startsWith("c")) {
        const cid = Number(selTab.slice(1));
        if (p.category.id !== cid) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, selTab, search]);

  const openItem = items.find((i) => i.id === openId) ?? null;

  function onTxDone() {
    qc.invalidateQueries({ queryKey: ["inventory-items"] });
    if (openId) qc.invalidateQueries({ queryKey: ["inventory-txs", openId] });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Quản lý Kho</h1>
          <p>
            <b>{totals.count}</b> mã hàng · Giá trị tồn <b>{fmtShort(totals.value)}</b> · <b>{totals.low + totals.out}</b> sắp hết hàng
          </p>
        </div>
        {isManager && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="abtn ghost" style={{ gap: 7 }} onClick={() => setMoveOpen({ item: null, dir: "IN" })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/></svg>
              Nhập / Xuất
            </button>
            <button className="abtn primary" style={{ gap: 7 }} onClick={() => setProdFormOpen("new")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
              Thêm sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          {
            ico: <><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" strokeLinecap="round"/></>,
            lab: "Mã hàng (SKU)", val: totals.count, chg: `${totals.units} đơn vị tồn`, cls: "flat",
          },
          {
            ico: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
            lab: "Giá trị tồn kho", val: fmtShort(totals.value), chg: "theo giá nhập", cls: "flat",
          },
          {
            ico: <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></>,
            lab: "Sắp hết hàng", val: totals.low, chg: "dưới mức tồn tối thiểu", cls: totals.low > 0 ? "warn" : "flat",
          },
          {
            ico: <><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/></>,
            lab: "Hết hàng", val: totals.out, chg: "cần nhập gấp", cls: totals.out > 0 ? "down" : "flat",
          },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt">
              <span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.ico}</svg></span>
              {k.lab}
            </div>
            <div className="kv">{k.val}</div>
            <div className={`kc ${k.cls}`}>{k.chg}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="inv-bar">
        <div className="inv-tabs">
          {tabs.list.map((t) => (
            <button key={t.k} className={`inv-tab${selTab === t.k ? " on" : ""}`} onClick={() => setSelTab(t.k)}>
              {t.l}<span className="tcnt">{tabs.counts[t.k] ?? 0}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="inv-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, SKU…" />
        </div>
      </div>

      {/* Table */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Kho</th>
              <th className="r">Tồn kho</th>
              <th>Mức tồn</th>
              <th className="r">Giá nhập</th>
              <th className="r">Giá trị</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
                {isFetching ? "Đang tải…" : "Không có sản phẩm nào."}
              </td></tr>
            ) : filtered.map((p) => {
              const c = metaForCategory(p.category.id, p.category.name, p.name);
              const st = stockStatus(p.quantity, p.minQuantity);
              const sc = STATUS_COLOR[st];
              const cost = Number(p.costPrice ?? 0);
              const total = p.quantity * cost;
              // Stock bar reference: use min*4 as soft max (fallback 10)
              const softMax = Math.max(p.minQuantity * 4, p.quantity, 10);
              const pct = Math.min(100, Math.round((p.quantity / softMax) * 100));
              return (
                <tr key={p.id} data-id={p.id} onClick={() => setOpenId(p.id)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div className="prod-thumb" style={{ background: c.bg }}>{c.emoji}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="prod-name">{p.name}</div>
                        {p.sku && <div className="prod-sku">{p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cat-tag" style={{ background: c.bg, color: c.color }}>{c.label}</span>
                  </td>
                  <td style={{ fontSize: ".82rem", color: "var(--text-2)" }}>{p.location || "—"}</td>
                  <td className="r">
                    <span className="stock-num" style={{ color: sc }}>{p.quantity}</span>
                    <span className="stock-unit">{p.unit}</span>
                  </td>
                  <td>
                    <div className="stock-bar-wrap">
                      <div className="stock-bar"><i style={{ width: `${pct}%`, background: sc }} /></div>
                    </div>
                  </td>
                  <td className="r price-cell">{cost > 0 ? fmtFull(cost) : "—"}</td>
                  <td className="r" style={{ fontFamily: "var(--font-mono)", fontSize: ".84rem", fontWeight: 700, color: "var(--text)" }}>{total > 0 ? fmtShort(total) : "—"}</td>
                  <td><span className={`stk-status ${st}`}>{STATUS_LABEL[st]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {openItem && (
        <ItemDrawer
          item={openItem}
          isManager={isManager}
          onClose={() => setOpenId(null)}
          onMove={(dir) => setMoveOpen({ item: openItem, dir })}
          onEdit={() => setProdFormOpen(openItem)}
        />
      )}

      {/* Move modal */}
      {moveOpen && (
        <MoveModal
          items={items}
          defaultItem={moveOpen.item}
          defaultDir={moveOpen.dir}
          onClose={() => setMoveOpen(null)}
          onDone={() => { onTxDone(); toast({ title: "Đã cập nhật tồn kho" }); setMoveOpen(null); }}
        />
      )}

      {/* Product form */}
      {prodFormOpen && (
        <ProductFormModal
          categories={initialCategories}
          initial={prodFormOpen === "new" ? null : prodFormOpen}
          onClose={() => setProdFormOpen(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            toast({ title: prodFormOpen === "new" ? "Đã thêm sản phẩm" : "Đã cập nhật" });
            setProdFormOpen(null);
          }}
        />
      )}
    </>
  );
}

// ── Item Drawer ───────────────────────────────────────────────

function ItemDrawer({
  item, isManager, onClose, onMove, onEdit,
}: {
  item: InventoryItem;
  isManager: boolean;
  onClose: () => void;
  onMove: (dir: "IN" | "OUT" | "ADJUST") => void;
  onEdit: () => void;
}) {
  const c = metaForCategory(item.category.id, item.category.name, item.name);
  const st = stockStatus(item.quantity, item.minQuantity);
  const sc = STATUS_COLOR[st];
  const cost = Number(item.costPrice ?? 0);

  const { data: txData } = useQuery<{ data: Tx[] }>({
    queryKey: ["inventory-txs", item.id],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/transactions?itemId=${item.id}&limit=30`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const txs = txData?.data ?? [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="id-back open" onClick={onClose} />
      <div className="id-drawer open" role="dialog" aria-label="Chi tiết sản phẩm">
        <div className="id-head">
          <div className="prod-thumb" style={{ width: 46, height: 46, fontSize: "1.3rem", background: c.bg }}>{c.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text)" }}>{item.name}</div>
            <div style={{ fontSize: ".76rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
              {item.sku ? `${item.sku} · ` : ""}{c.label}
            </div>
          </div>
          <button className="id-close" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div className="id-body">
          <div className="metric-grid">
            <div className="metric">
              <div className="ml">Tồn kho</div>
              <div className="mv" style={{ color: sc }}>{item.quantity}</div>
              <div className="mc" style={{ color: sc }}>{STATUS_LABEL[st]}</div>
            </div>
            <div className="metric">
              <div className="ml">Giá trị</div>
              <div className="mv">{fmtShort(item.quantity * cost)}</div>
              <div className="mc" style={{ color: "var(--text-3)" }}>{cost > 0 ? `@ ${fmtShort(cost)}` : "—"}</div>
            </div>
            <div className="metric">
              <div className="ml">Tồn tối thiểu</div>
              <div className="mv" style={{ fontSize: ".95rem" }}>{item.minQuantity} {item.unit}</div>
              <div className="mc" style={{ color: "var(--text-3)" }}>cảnh báo dưới mức này</div>
            </div>
          </div>

          {isManager && (
            <>
              <div className="dsec">Thao tác nhanh</div>
              <div className="qadj" style={{ marginBottom: 20 }}>
                <button className="in" onClick={() => onMove("IN")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  <span className="ql">Nhập kho</span>
                </button>
                <button className="out" onClick={() => onMove("OUT")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <span className="ql">Xuất kho</span>
                </button>
                <button className="adjust" onClick={() => onMove("ADJUST")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  <span className="ql">Điều chỉnh</span>
                </button>
              </div>
            </>
          )}

          <div className="dsec">Thông tin</div>
          <div className="dcard">
            <div className="drow"><span className="dl">SKU</span><span className="dv" style={{ fontFamily: "var(--font-mono)" }}>{item.sku || "—"}</span></div>
            <div className="drow"><span className="dl">Danh mục</span><span className="dv"><span className="cat-tag" style={{ background: c.bg, color: c.color }}>{c.label}</span></span></div>
            <div className="drow"><span className="dl">Vị trí kho</span><span className="dv">{item.location || "—"}</span></div>
            <div className="drow"><span className="dl">Đơn vị</span><span className="dv">{item.unit}</span></div>
            <div className="drow"><span className="dl">Giá nhập</span><span className="dv" style={{ fontFamily: "var(--font-mono)" }}>{cost > 0 ? fmtFull(cost) : "—"}</span></div>
            {item.description && (
              <div className="drow"><span className="dl">Mô tả</span><span className="dv" style={{ fontWeight: 400, fontSize: ".82rem" }}>{item.description}</span></div>
            )}
          </div>

          <div className="dsec">Lịch sử nhập xuất ({txs.length})</div>
          <div>
            {txs.length === 0 ? (
              <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "14px 0" }}>Chưa có giao dịch nào</div>
            ) : txs.map((m) => {
              const icCls = m.type === "IN" ? "in" : m.type === "OUT" ? "out" : "adjust";
              const sign = m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "±";
              const label = m.type === "IN" ? "Nhập kho" : m.type === "OUT" ? "Xuất kho" : m.type === "RETURN" ? "Hoàn trả" : "Điều chỉnh";
              const arrow = m.type === "IN" ? <path d="M12 19V5M5 12l7-7 7 7"/>
                          : m.type === "OUT" ? <path d="M12 5v14M5 12l7 7 7-7"/>
                          : <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></>;
              return (
                <div key={m.id} className="mov-row">
                  <div className={`mov-ic ${icCls}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{arrow}</svg>
                  </div>
                  <div className="mov-info">
                    <div className="mov-txt">{label}{m.note ? ` · ${m.note}` : ""}</div>
                    <div className="mov-meta">{fmtRelative(m.createdAt)} · {m.actor.fullName}{m.referenceNo ? ` · ${m.referenceNo}` : ""}</div>
                  </div>
                  <div className={`mov-qty ${icCls}`}>{sign}{m.quantity}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="id-foot">
          {isManager && (
            <>
              <button className="abtn ghost" onClick={onEdit} style={{ flex: 1, gap: 7 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                Sửa
              </button>
              <button className="abtn primary" onClick={() => onMove("IN")} style={{ flex: 1, gap: 7 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/></svg>
                Nhập / Xuất
              </button>
            </>
          )}
          {!isManager && (
            <button className="abtn ghost" onClick={onClose} style={{ flex: 1 }}>Đóng</button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Move (Tx) Modal ───────────────────────────────────────────

function MoveModal({
  items, defaultItem, defaultDir, onClose, onDone,
}: {
  items: InventoryItem[];
  defaultItem: InventoryItem | null;
  defaultDir: "IN" | "OUT" | "ADJUST";
  onClose: () => void;
  onDone: () => void;
}) {
  const [dir, setDir] = useState<"IN" | "OUT" | "ADJUST">(defaultDir);
  const [itemId, setItemId] = useState<string>(defaultItem?.id ?? items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [refNo, setRefNo] = useState("");
  const { toast } = useToast();

  const current = items.find((i) => i.id === itemId);

  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type: dir, quantity: qty, note, referenceNo: refNo }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: onDone,
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="im-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="im-modal" role="dialog" aria-label="Nhập / Xuất kho">
        <div className="im-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/></svg>
          </div>
          <h3>Nhập / Xuất kho</h3>
          <button className="x" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div className="im-body">
          <div className="im-field">
            <label>Loại giao dịch</label>
            <div className="dir-row">
              <button type="button" className={`dir-btn in${dir === "IN" ? " on" : ""}`} onClick={() => setDir("IN")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                Nhập
              </button>
              <button type="button" className={`dir-btn out${dir === "OUT" ? " on" : ""}`} onClick={() => setDir("OUT")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                Xuất
              </button>
              <button type="button" className={`dir-btn adjust${dir === "ADJUST" ? " on" : ""}`} onClick={() => setDir("ADJUST")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                Kiểm kê
              </button>
            </div>
          </div>

          <div className="im-field">
            <label>Sản phẩm *</label>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {items.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
            </select>
          </div>

          <div className="im-row">
            <div className="im-field">
              <label>{dir === "ADJUST" ? "Số lượng thực tế *" : "Số lượng *"}</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
              {current && (
                <span style={{ fontSize: ".7rem", color: "var(--text-3)", marginTop: 4 }}>
                  Tồn hiện tại: {current.quantity} {current.unit}
                </span>
              )}
            </div>
            <div className="im-field">
              <label>Số phiếu</label>
              <input type="text" value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="NK-001…" />
            </div>
          </div>

          <div className="im-field">
            <label>Ghi chú</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd. Nhập lô mới, cấp nhân viên…" />
          </div>
        </div>

        <div className="im-foot">
          <button className="abtn ghost" onClick={onClose}>Hủy</button>
          <button className="abtn primary" disabled={!itemId || qty < 1 || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? "Đang xử lý…" : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Form Modal (add/edit) ─────────────────────────────

function ProductFormModal({
  categories, initial, onClose, onDone,
}: {
  categories: Category[];
  initial: InventoryItem | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    categoryId: initial?.category.id ?? categories[0]?.id ?? 0,
    unit: initial?.unit ?? "cái",
    quantity: initial?.quantity ?? 0,
    minQuantity: initial?.minQuantity ?? 5,
    costPrice: initial?.costPrice ?? "",
    location: initial?.location ?? "",
    description: initial?.description ?? "",
  });
  const { toast } = useToast();

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v as never }));

  const mut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        categoryId: Number(form.categoryId),
        unit: form.unit.trim() || "cái",
        minQuantity: Number(form.minQuantity) || 0,
        costPrice: form.costPrice === "" ? undefined : Number(form.costPrice),
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (!isEdit) payload.quantity = Number(form.quantity) || 0;

      const url = isEdit ? `/api/inventory/items/${initial!.id}` : "/api/inventory/items";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: onDone,
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="im-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="im-modal" role="dialog" aria-label={isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}>
        <div className="im-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
          </div>
          <h3>{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
          <button className="x" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div className="im-body">
          <div className="im-field">
            <label>Tên sản phẩm *</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="vd. MacBook Pro 14"/>
          </div>

          <div className="im-row">
            <div className="im-field">
              <label>SKU</label>
              <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="vd. DEV-MBP14"/>
            </div>
            <div className="im-field">
              <label>Danh mục</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="im-row">
            <div className="im-field">
              <label>Đơn vị</label>
              <input type="text" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="cái, hộp, kg…"/>
            </div>
            <div className="im-field">
              <label>Giá nhập (đ)</label>
              <input type="number" min={0} step={1000} value={form.costPrice as string | number} onChange={(e) => set("costPrice", e.target.value)} placeholder="vd. 500000"/>
            </div>
          </div>

          <div className="im-row" style={{ gridTemplateColumns: isEdit ? "1fr 1fr" : "1fr 1fr 1fr" }}>
            {!isEdit && (
              <div className="im-field">
                <label>Tồn ban đầu</label>
                <input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))}/>
              </div>
            )}
            <div className="im-field">
              <label>Tồn tối thiểu</label>
              <input type="number" min={0} value={form.minQuantity} onChange={(e) => set("minQuantity", Number(e.target.value))}/>
            </div>
            <div className="im-field">
              <label>Vị trí kho</label>
              <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Kho HCM, Tủ B2…"/>
            </div>
          </div>

          <div className="im-field">
            <label>Mô tả</label>
            <input type="text" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ghi chú thêm (tuỳ chọn)"/>
          </div>
        </div>

        <div className="im-foot">
          <button className="abtn ghost" onClick={onClose}>Hủy</button>
          <button className="abtn primary" disabled={!form.name.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? "Đang lưu…" : isEdit ? "Lưu" : "Thêm sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Style (template-matched) ──────────────────────────────────

const STYLE = `
.inv-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:20px;margin-bottom:18px}
.inv-tabs{display:flex;gap:4px;flex-wrap:wrap}
.inv-tab{height:34px;padding:0 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.82rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.inv-tab:hover{border-color:var(--border-2);color:var(--text)}
.inv-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
.inv-tab .tcnt{font-family:var(--font-mono);font-size:.64rem;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.07)}
.inv-tab.on .tcnt{background:var(--accent-soft-2)}
.inv-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;background:var(--elev);border:1px solid var(--border);border-radius:9px;color:var(--text-3);min-width:200px}
.inv-search svg{width:14px;height:14px;flex-shrink:0}
.inv-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.82rem;color:var(--text);width:100%}
.inv-search input::placeholder{color:var(--text-3)}

.inv-table-wrap{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow-x:auto}
.inv-table{width:100%;border-collapse:collapse;min-width:880px}
.inv-table th{text-align:left;padding:11px 16px;font-family:var(--font-mono);font-size:.64rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);font-weight:600;background:var(--content);border-bottom:1px solid var(--border);white-space:nowrap}
.inv-table th.r,.inv-table td.r{text-align:right}
.inv-table th.c,.inv-table td.c{text-align:center}
.inv-table td{padding:13px 16px;border-bottom:1px solid var(--border);vertical-align:middle;white-space:nowrap}
.inv-table tbody tr:last-child td{border-bottom:none}
.inv-table tbody tr{transition:background .12s;cursor:pointer}
.inv-table tbody tr:hover{background:var(--content)}
.prod-thumb{width:40px;height:40px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;font-size:1.05rem}
.prod-name{font-size:.87rem;font-weight:600;color:var(--text)}
.prod-sku{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-top:1px}
.cat-tag{font-family:var(--font-mono);font-size:.66rem;font-weight:600;padding:3px 9px;border-radius:99px}
.stock-num{font-family:var(--font-mono);font-size:.92rem;font-weight:800}
.stock-unit{font-size:.7rem;color:var(--text-3);font-weight:400;margin-left:4px}
.price-cell{font-family:var(--font-mono);font-size:.84rem;color:var(--text-2)}

.stock-bar-wrap{display:flex;align-items:center;gap:8px;min-width:130px}
.stock-bar{flex:1;height:6px;border-radius:99px;background:var(--border);overflow:hidden}
.stock-bar i{display:block;height:100%;border-radius:99px;transition:width .5s var(--ease)}

.stk-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:99px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.stk-status.in{background:var(--ok-soft);color:var(--ok)}
.stk-status.low{background:var(--warn-soft);color:var(--warn)}
.stk-status.out{background:var(--danger-soft);color:var(--danger)}

.id-back{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:100;opacity:0;transition:opacity .22s;pointer-events:none}
.id-back.open{opacity:1;pointer-events:auto}
.id-drawer{position:fixed;top:0;right:0;height:100vh;width:560px;max-width:97vw;background:var(--elev);border-left:1px solid var(--border-2);box-shadow:-30px 0 60px rgba(0,0,0,.45);z-index:101;transform:translateX(100%);transition:transform .28s var(--ease);display:flex;flex-direction:column;overflow:hidden}
.id-drawer.open{transform:translateX(0)}
.id-head{display:flex;align-items:center;gap:14px;padding:20px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
.id-close{margin-left:auto;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none;flex-shrink:0}
.id-close:hover{background:var(--content);color:var(--text)}
.id-close svg{width:17px;height:17px}
.id-body{flex:1;overflow-y:auto;padding:22px}
.id-foot{flex-shrink:0;border-top:1px solid var(--border);padding:16px 22px;display:flex;gap:10px}

.dsec{font-family:var(--font-mono);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:14px;margin-top:6px}
.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.metric{background:var(--content);border:1px solid var(--border);border-radius:11px;padding:14px}
.metric .ml{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.04em}
.metric .mv{font-family:var(--font-mono);font-size:1.15rem;font-weight:800;margin-top:5px;line-height:1;color:var(--text)}
.metric .mc{font-size:.7rem;margin-top:4px;font-weight:600}
.dcard{background:var(--content);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
.drow{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border)}
.drow:last-child{border-bottom:none}
.drow .dl{font-size:.8rem;color:var(--text-3);min-width:120px;flex-shrink:0}
.drow .dv{font-size:.88rem;color:var(--text);flex:1;display:flex;align-items:center;gap:8px;font-weight:500}

.mov-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.mov-row:last-child{border-bottom:none}
.mov-ic{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
.mov-ic svg{width:15px;height:15px}
.mov-ic.in{background:var(--ok-soft);color:var(--ok)}
.mov-ic.out{background:var(--danger-soft);color:var(--danger)}
.mov-ic.adjust{background:var(--warn-soft);color:var(--warn)}
.mov-info{flex:1;min-width:0}
.mov-txt{font-size:.84rem;color:var(--text);font-weight:500}
.mov-meta{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-top:1px}
.mov-qty{font-family:var(--font-mono);font-size:.88rem;font-weight:800;flex-shrink:0}
.mov-qty.in{color:var(--ok)}
.mov-qty.out{color:var(--danger)}
.mov-qty.adjust{color:var(--warn)}

.qadj{display:flex;gap:8px;align-items:stretch}
.qadj button{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px;border-radius:11px;border:1.5px solid var(--border-2);background:var(--content);cursor:pointer;font-family:inherit;transition:all .15s;color:var(--text-2)}
.qadj button svg{width:20px;height:20px}
.qadj button .ql{font-size:.78rem;font-weight:700}
.qadj button.in:hover{border-color:var(--ok);background:var(--ok-soft);color:var(--ok)}
.qadj button.out:hover{border-color:var(--danger);background:var(--danger-soft);color:var(--danger)}
.qadj button.adjust:hover{border-color:var(--warn);background:var(--warn-soft);color:var(--warn)}

.im-back{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .18s var(--ease)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.im-modal{width:100%;max-width:480px;max-height:92vh;background:var(--elev);border:1px solid var(--border-2);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden;animation:popIn .22s var(--ease)}
@keyframes popIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}
.im-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
.im-head .ico{width:32px;height:32px;border-radius:8px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
.im-head .ico svg{width:17px;height:17px;color:#fff}
.im-head h3{font-size:1rem;font-weight:700;margin:0}
.im-head .x{margin-left:auto;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none}
.im-head .x:hover{background:var(--content);color:var(--text)}
.im-head .x svg{width:17px;height:17px}
.im-body{flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:16px}
.im-foot{flex-shrink:0;display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--border)}
.im-field{display:flex;flex-direction:column;gap:6px}
.im-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
.im-field input,.im-field select,.im-field textarea{font-family:inherit;font-size:.9rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.im-field input:focus,.im-field select:focus,.im-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.im-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:500px){.im-row{grid-template-columns:1fr!important}}
.dir-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.dir-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border-radius:10px;border:2px solid var(--border);background:var(--content);cursor:pointer;font-family:inherit;font-size:.8rem;font-weight:600;color:var(--text-2);transition:all .15s}
.dir-btn svg{width:18px;height:18px}
.dir-btn.on.in{border-color:var(--ok);background:var(--ok-soft);color:var(--ok)}
.dir-btn.on.out{border-color:var(--danger);background:var(--danger-soft);color:var(--danger)}
.dir-btn.on.adjust{border-color:var(--warn);background:var(--warn-soft);color:var(--warn)}
`;
