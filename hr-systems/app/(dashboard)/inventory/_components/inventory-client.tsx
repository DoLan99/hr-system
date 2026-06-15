"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  UserCheck,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
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

// ── Item Form Modal ────────────────────────────────────────────

function ItemFormModal({
  categories,
  initial,
  onSave,
  onClose,
}: {
  categories: Category[];
  initial?: Partial<InventoryItem>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    categoryId: initial?.category?.id ?? (categories[0]?.id ?? 0),
    unit: initial?.unit ?? "cái",
    minQuantity: initial?.minQuantity ?? 0,
    costPrice: initial?.costPrice ?? "",
    location: initial?.location ?? "",
    description: initial?.description ?? "",
    ...(initial ? {} : { quantity: 0 }),
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border rounded-xl w-full max-w-lg shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{initial ? "Sửa mặt hàng" : "Thêm mặt hàng"}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Tên *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Danh mục</label>
            <select value={form.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Đơn vị</label>
            <input value={form.unit} onChange={(e) => set("unit", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">SKU</label>
            <input value={form.sku} onChange={(e) => set("sku", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          {!initial && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Số lượng ban đầu</label>
              <input type="number" min={0} value={(form as { quantity?: number }).quantity ?? 0}
                onChange={(e) => set("quantity", Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cảnh báo tồn tối thiểu</label>
            <input type="number" min={0} value={form.minQuantity}
              onChange={(e) => set("minQuantity", Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Giá nhập (VNĐ)</label>
            <input type="number" min={0} value={form.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Vị trí kho</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              placeholder="Kho A, Tủ B2..."
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave({ ...form, categoryId: Number(form.categoryId), costPrice: form.costPrice ? Number(form.costPrice) : undefined })}
            disabled={!form.name.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg disabled:opacity-50">
            Lưu
          </button>
          <button onClick={onClose} className="px-3 py-2 border text-sm rounded-lg">Hủy</button>
        </div>
      </div>
    </div>
  );
}

// ── Transaction Modal ──────────────────────────────────────────

function TxModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [refNo, setRefNo] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, type, quantity: qty, note, referenceNo: refNo }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({ title: "Đã cập nhật tồn kho" });
      onClose();
    },
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  const typeLabel = { IN: "Nhập kho", OUT: "Xuất kho", ADJUST: "Điều chỉnh tồn kho" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Giao dịch kho</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">{item.name} · Tồn: <strong>{item.quantity} {item.unit}</strong></p>

        <div className="flex gap-2">
          {(["IN", "OUT", "ADJUST"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-1.5 text-xs rounded-lg border font-medium ${type === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
              {typeLabel[t].split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {type === "ADJUST" ? "Số lượng tồn mới" : "Số lượng"}
            </label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Số phiếu</label>
            <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="NK-001..."
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ghi chú</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || qty < 1}
            className="flex-1 py-2 bg-primary text-primary-foreground text-sm rounded-lg disabled:opacity-50">
            {mutation.isPending ? "Đang xử lý..." : typeLabel[type]}
          </button>
          <button onClick={onClose} className="px-4 py-2 border text-sm rounded-lg">Hủy</button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Modal ───────────────────────────────────────────────

function AssignModal({ item, employees, onClose }: { item: InventoryItem; employees: Employee[]; onClose: () => void }) {
  const [empId, setEmpId] = useState(employees[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, employeeId: empId, quantity: qty, note }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({ title: "Đã gán thiết bị" });
      onClose();
    },
    onError: (e) => toast({ title: "Lỗi gán thiết bị", description: String(e), variant: "error" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Gán thiết bị</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">{item.name} · Tồn: <strong>{item.quantity} {item.unit}</strong></p>

        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nhân viên</label>
            <select value={empId} onChange={(e) => setEmpId(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none">
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}{e.department ? ` — ${e.department}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Số lượng</label>
            <input type="number" min={1} max={item.quantity} value={qty} onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ghi chú</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !empId || qty < 1}
            className="flex-1 py-2 bg-primary text-primary-foreground text-sm rounded-lg disabled:opacity-50">
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận gán"}
          </button>
          <button onClick={onClose} className="px-4 py-2 border text-sm rounded-lg">Hủy</button>
        </div>
      </div>
    </div>
  );
}

// ── Main InventoryClient ───────────────────────────────────────

export function InventoryClient({
  initialCategories,
  employees,
  isManager,
}: {
  initialCategories: Category[];
  employees: Employee[];
  isManager: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [filterLow, setFilterLow] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [txItem, setTxItem] = useState<InventoryItem | null>(null);
  const [assignItem, setAssignItem] = useState<InventoryItem | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isFetching } = useQuery<{ data: InventoryItem[] }>({
    queryKey: ["inventory-items", filterCat, filterLow, search],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filterCat) sp.set("categoryId", String(filterCat));
      if (filterLow) sp.set("lowStock", "1");
      if (search) sp.set("search", search);
      const res = await fetch(`/api/inventory/items?${sp}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); setShowItemForm(false); toast({ title: "Đã thêm mặt hàng" }); },
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/items/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); setEditItem(null); toast({ title: "Đã cập nhật" }); },
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/items/${id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Lỗi"); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast({ title: "Đã xóa" }); },
    onError: (e) => toast({ title: "Lỗi xóa", description: String(e), variant: "error" }),
  });

  const items = data?.data ?? [];
  const lowCount = items.filter((i) => i.minQuantity > 0 && i.quantity <= i.minQuantity).length;

  const fmtCurrency = (v: string | null) =>
    v ? Number(v).toLocaleString("vi-VN") + "₫" : "—";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mặt hàng..."
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <select value={filterCat ?? ""} onChange={(e) => setFilterCat(e.target.value ? Number(e.target.value) : null)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none">
          <option value="">Tất cả danh mục</option>
          {initialCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button onClick={() => setFilterLow((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg ${filterLow ? "bg-orange-50 border-orange-300 text-orange-600 dark:bg-orange-950/20" : "hover:bg-accent"}`}>
          <AlertTriangle className="h-4 w-4" />
          Tồn thấp {lowCount > 0 && <span className="ml-0.5 bg-orange-500 text-white text-xs rounded-full px-1.5">{lowCount}</span>}
        </button>

        <button onClick={() => qc.invalidateQueries({ queryKey: ["inventory-items"] })} className="p-2 border rounded-lg hover:bg-accent">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>

        {isManager && (
          <button onClick={() => setShowItemForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg ml-auto">
            <Plus className="h-4 w-4" /> Thêm hàng
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Tên mặt hàng</th>
              <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Danh mục</th>
              <th className="text-right px-4 py-2.5 font-medium">Tồn kho</th>
              <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Giá nhập</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !isFetching ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Không có mặt hàng nào</td></tr>
            ) : (
              items.map((item) => {
                const isLow = item.minQuantity > 0 && item.quantity <= item.minQuantity;
                return (
                  <>
                    <tr key={item.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className={`h-4 w-4 shrink-0 ${isLow ? "text-orange-500" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.category.name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${isLow ? "text-orange-500" : ""}`}>{item.quantity}</span>
                        <span className="text-muted-foreground ml-1 text-xs">{item.unit}</span>
                        {isLow && <AlertTriangle className="h-3 w-3 text-orange-500 inline ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{fmtCurrency(item.costPrice)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {isManager && (
                            <>
                              <button onClick={() => setTxItem(item)} className="p-1.5 rounded hover:bg-accent" title="Nhập/Xuất kho">
                                <ArrowDownToLine className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAssignItem(item)} className="p-1.5 rounded hover:bg-accent" title="Gán thiết bị">
                                <UserCheck className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditItem(item)} className="p-1.5 rounded hover:bg-accent" title="Sửa">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => confirm(`Xóa "${item.name}"?`) && deleteMutation.mutate(item.id)}
                                className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Xóa">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedRow === item.id ? "rotate-180" : ""}`} />
                        </div>
                      </td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr key={`${item.id}-detail`} className="border-t bg-muted/10">
                        <td colSpan={5} className="px-6 py-3 text-xs text-muted-foreground space-y-1">
                          <div className="flex flex-wrap gap-4">
                            <span><strong>Vị trí:</strong> {item.location ?? "—"}</span>
                            <span><strong>Tồn tối thiểu:</strong> {item.minQuantity} {item.unit}</span>
                            <span><strong>Đang sử dụng:</strong> {item._count.assignments} người</span>
                          </div>
                          {item.description && <p><strong>Mô tả:</strong> {item.description}</p>}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(showItemForm || editItem) && (
        <ItemFormModal
          categories={initialCategories}
          initial={editItem ?? undefined}
          onSave={(d) => editItem ? updateMutation.mutate({ id: editItem.id, data: d }) : createMutation.mutate(d)}
          onClose={() => { setShowItemForm(false); setEditItem(null); }}
        />
      )}
      {txItem && <TxModal item={txItem} onClose={() => setTxItem(null)} />}
      {assignItem && <AssignModal item={assignItem} employees={employees} onClose={() => setAssignItem(null)} />}
    </div>
  );
}
