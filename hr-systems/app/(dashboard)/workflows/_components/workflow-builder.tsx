"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

type Step = {
  id?: number;
  stepOrder: number;
  name: string;
  approverType: "ROLE" | "SPECIFIC_EMPLOYEE" | "DEPARTMENT_HEAD" | "DIRECT_MANAGER";
  approverRef: string | null;
  approverRefs: string[];
  slaHours: number | null;
  stepType: "any" | "all";
  notifyOnReject: boolean;
};

type Employee = { id: number; fullName: string; department: string | null };

type Condition = { field: string; op: string; val: string };
type NotifConfig = { onSubmit: boolean; onApprove: boolean; onReject: boolean; onDeadline: boolean };

type Template = {
  id: string;
  name: string;
  description: string | null;
  targetType: string;
  isActive: boolean;
  triggers: string[];
  conditions: Condition[];
  notificationsConfig: NotifConfig;
  steps: Step[];
};

const TYPE_META: Record<string, { label: string; color: string; bg: string; icoPath: string }> = {
  LEAVE:    { label: "Nghỉ phép",  color: "#fbbf24", bg: "rgba(251,191,36,.13)",  icoPath: "M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 13h6" },
  DOCUMENT: { label: "Tài liệu",   color: "#a78bfa", bg: "rgba(167,139,250,.14)", icoPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  PURCHASE: { label: "Mua sắm",    color: "#22d3ee", bg: "rgba(34,211,238,.13)",  icoPath: "M3 8l1-4h16l1 4M4 8v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8M9 12h6" },
  TIMELOG:  { label: "Chấm công",  color: "#4ADE80", bg: "rgba(74,222,128,.13)",  icoPath: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  CUSTOM:   { label: "Tuỳ chỉnh",  color: "#94a3b8", bg: "rgba(148,163,184,.13)", icoPath: "M12 5v14M5 12h14" },
};

const APPROVER_LABELS: Record<string, string> = {
  DIRECT_MANAGER: "Quản lý trực tiếp",
  DEPARTMENT_HEAD: "Trưởng phòng",
  ROLE: "Theo vai trò (ID)",
  SPECIFIC_EMPLOYEE: "Nhân viên cụ thể (ID)",
};

const TRIGGERS = [
  { k: "submit",      l: "Khi nộp đơn",     icoPath: "M22 2L11 13M22 2l-7 20-4-9-9-4z" },
  { k: "amount_over", l: "Số tiền > 5tr",    icoPath: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { k: "days_over",   l: "Nghỉ > 3 ngày",   icoPath: "M3 4h18v17H3zM16 2v4M8 2v4M3 10h18" },
  { k: "new_member",  l: "Thành viên mới",  icoPath: "M9 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M19 8v6M22 11h-6" },
];

const NOTIF_ROWS: { k: keyof NotifConfig; l: string; icoPath: string }[] = [
  { k: "onSubmit",   l: "Khi nộp đơn",          icoPath: "M22 2L11 13M22 2l-7 20-4-9-9-4z" },
  { k: "onApprove",  l: "Khi được duyệt",        icoPath: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { k: "onReject",   l: "Khi bị từ chối",         icoPath: "M6 6l12 12M18 6L6 18" },
  { k: "onDeadline", l: "Nhắc khi sắp deadline", icoPath: "M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zM12 7v5l3 2" },
];

const COND_FIELDS = [
  { v: "days", l: "Số ngày" }, { v: "amount", l: "Số tiền" }, { v: "dept", l: "Bộ phận" },
];
const COND_OPS = [{ v: "gt", l: ">" }, { v: "gte", l: ">=" }, { v: "eq", l: "==" }];

const DEFAULT_NOTIF: NotifConfig = { onSubmit: true, onApprove: true, onReject: true, onDeadline: false };

function typeMeta(t: string) { return TYPE_META[t] ?? TYPE_META.CUSTOM; }
function emptyStep(order: number): Step {
  return { stepOrder: order, name: "", approverType: "DIRECT_MANAGER", approverRef: null, approverRefs: [], slaHours: 48, stepType: "any", notifyOnReject: true };
}

type SectionKey = "triggers" | "steps" | "conditions" | "notifications";

export function WorkflowBuilder() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selId, setSelId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(new Set());

  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState<Step[]>([]);
  const [editTriggers, setEditTriggers] = useState<string[]>(["submit"]);
  const [editConditions, setEditConditions] = useState<Condition[]>([]);
  const [editNotifs, setEditNotifs] = useState<NotifConfig>(DEFAULT_NOTIF);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("LEAVE");
  const [newSteps, setNewSteps] = useState<Step[]>([emptyStep(1)]);

  const { data, isLoading } = useQuery<{ data: Template[] }>({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const res = await fetch("/api/workflows/templates");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const templates = data?.data ?? [];

  const { data: empData } = useQuery<{ data: Employee[] }>({
    queryKey: ["employees-simple"],
    queryFn: async () => {
      const res = await fetch("/api/employees?status=ACTIVE&limit=200");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const employees: Employee[] = empData?.data ?? [];
  const selected = templates.find((t) => t.id === selId) ?? null;

  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditSteps(selected.steps.map((s) => ({ ...s, stepType: (s.stepType as any) || "any", notifyOnReject: s.notifyOnReject ?? true, approverRefs: (s.approverRefs as any) ?? [] })));
      setEditTriggers(selected.triggers ?? []);
      setEditConditions((selected.conditions as any) ?? []);
      setEditNotifs({ ...DEFAULT_NOTIF, ...(selected.notificationsConfig ?? {}) });
    }
  }, [selId, templates.length]);

  useEffect(() => {
    if (!selId && templates.length) setSelId(templates[0].id);
  }, [templates.length]);

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await fetch(`/api/workflows/templates/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast({ title: "Đã lưu cấu hình workflow ✓", variant: "success" });
    },
    onError: (e) => {
      let msg = String(e);
      try { const parsed = JSON.parse(msg.replace(/^Error: /, "")); msg = JSON.stringify(parsed, null, 2); } catch {}
      toast({ title: "Lỗi lưu", description: msg, variant: "error" });
      console.error("Save workflow error:", e);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/workflows/templates/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast({ title: vars.isActive ? "Workflow đã bật" : "Workflow đã tắt" });
    },
    onError: (e) => toast({ title: "Lỗi", description: String(e), variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workflows/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-templates"] });
      const remaining = templates.filter((t) => t.id !== selId);
      setSelId(remaining[0]?.id ?? null);
      toast({ title: "Đã xóa workflow" });
    },
    onError: (e) => toast({ title: "Lỗi xóa", description: String(e), variant: "error" }),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch("/api/workflows/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["workflow-templates"] });
      setCreating(false); setNewName(""); setNewType("LEAVE"); setNewSteps([emptyStep(1)]);
      setSelId(res.data?.id ?? null);
      toast({ title: "Đã tạo workflow mới ✓", variant: "success" });
    },
    onError: (e) => toast({ title: "Lỗi tạo", description: String(e), variant: "error" }),
  });

  function toggleSection(k: SectionKey) {
    setCollapsed((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }
  function addStep() { setEditSteps((s) => [...s, emptyStep(s.length + 1)]); }
  function removeStep(idx: number) {
    setEditSteps((s) => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, stepOrder: i + 1 })));
  }
  function updateStep(idx: number, patch: Partial<Step>) {
    setEditSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  }
  function addCondition() { setEditConditions((c) => [...c, { field: "days", op: "gt", val: "3" }]); }
  function removeCondition(idx: number) { setEditConditions((c) => c.filter((_, i) => i !== idx)); }
  function updateCondition(idx: number, patch: Partial<Condition>) {
    setEditConditions((c) => c.map((x, i) => i === idx ? { ...x, ...patch } : x));
  }
  function saveWorkflow() {
    if (!selected || !editName.trim()) return;
    saveMutation.mutate({
      id: selected.id,
      payload: {
        name: editName,
        triggers: editTriggers,
        conditions: editConditions,
        notificationsConfig: editNotifs,
        steps: editSteps.map(({ id: _id, ...s }) => ({ ...s, slaHours: s.slaHours ? Number(s.slaHours) : null })),
      },
    });
  }

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main:has(.wf-layout){overflow:hidden!important;padding:0!important;display:flex;flex-direction:column}
        .wf-layout{display:grid;grid-template-columns:280px 1fr;flex:1;min-height:0;overflow:hidden}
        @media(max-width:860px){.wf-layout{grid-template-columns:1fr;height:auto}}

        .wf-list-pane{border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--side,var(--elev));overflow:hidden}
        .wf-list-head{padding:16px 16px 12px;flex-shrink:0;border-bottom:1px solid var(--border)}
        .wf-list-head h3{font-size:.95rem;font-weight:700;margin-bottom:6px}
        .wf-list{flex:1;overflow-y:auto}
        .wf-item{display:flex;align-items:center;gap:11px;padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;position:relative}
        .wf-item:hover{background:var(--content)}
        .wf-item.on{background:var(--accent-soft)}
        .wf-item.on::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent);border-radius:0 2px 2px 0}
        .wf-item-ico{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
        .wf-item-ico svg{width:16px;height:16px}
        .wf-item-info{flex:1;min-width:0}
        .wf-item-name{font-size:.86rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wf-item-meta{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-top:1px}
        .wf-item-status{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .wf-add-btn{margin:12px 16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:9px;border:1.5px dashed var(--border-2);color:var(--text-3);font-size:.82rem;font-weight:500;cursor:pointer;transition:border-color .15s,color .15s;font-family:inherit;background:none}
        .wf-add-btn:hover{border-color:var(--accent);color:var(--accent-ink)}
        .wf-add-btn svg{width:15px;height:15px;flex-shrink:0}

        .wf-editor{display:flex;flex-direction:column;overflow:hidden;background:var(--content)}
        .wf-editor-scroll{flex:1;overflow-y:auto;padding:20px 24px}
        .wf-editor-head{display:flex;align-items:center;gap:14px;padding:16px 24px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--elev)}
        .wf-head-meta{font-size:.74rem;color:var(--text-3);font-family:var(--font-mono);margin-top:2px}
        .wf-head-actions{display:flex;gap:8px;margin-left:auto;align-items:center;flex-wrap:wrap}
        .wf-toggle-wrap{display:inline-flex;align-items:center;gap:8px;font-size:.82rem;font-weight:600;color:var(--text-2)}
        .toggle-switch{width:36px;height:20px;border-radius:99px;background:var(--border);cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;border:none}
        .toggle-switch.on{background:var(--ok)}
        .toggle-switch::after{content:"";width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
        .toggle-switch.on::after{left:19px}
        .wf-editor-name-input{background:none;border:none;border-bottom:1.5px solid transparent;outline:none;font-size:1rem;font-weight:700;color:var(--text);font-family:inherit;width:100%;min-width:0;padding:1px 2px;transition:border-color .15s}
        .wf-editor-name-input:focus{border-bottom-color:var(--accent)}

        .wf-section{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:14px;overflow:hidden}
        .wf-section-head{display:flex;align-items:center;gap:10px;padding:14px 18px;cursor:pointer;user-select:none}
        .wf-section-head:hover{background:rgba(255,255,255,.02)}
        .wf-section-head h4{font-size:.88rem;font-weight:700;margin:0}
        .wf-section-ico{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;flex-shrink:0}
        .wf-section-ico svg{width:15px;height:15px}
        .wf-section-tag{font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:99px;margin-left:auto;white-space:nowrap}
        .wf-section-chev{width:20px;height:20px;display:grid;place-items:center;color:var(--text-3);transition:transform .2s;flex-shrink:0}
        .wf-section-chev svg{width:14px;height:14px}
        .wf-section.collapsed .wf-section-chev{transform:rotate(-90deg)}
        .wf-section.collapsed .wf-section-body{display:none}
        .wf-section-body{padding:18px;border-top:1px solid var(--border)}

        .trigger-list{display:flex;flex-wrap:wrap;gap:8px}
        .trigger-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-2);background:var(--content);font-size:.82rem;font-weight:500;color:var(--text-2);transition:all .15s;cursor:pointer;font-family:inherit}
        .trigger-pill:hover{border-color:var(--border-2);color:var(--text)}
        .trigger-pill.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .trigger-pill svg{width:14px;height:14px;flex-shrink:0}

        .step-flow{display:flex;flex-direction:column;gap:0}
        .step-connector{display:flex;justify-content:center;padding:4px 0}
        .step-connector i{display:block;width:2px;height:20px;background:linear-gradient(180deg,var(--accent),var(--ok));border-radius:1px}
        .wf-step{background:var(--content);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;transition:border-color .15s}
        .wf-step:hover{border-color:var(--border-2)}
        .wf-step-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
        .step-num{width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-size:.74rem;font-weight:800;flex-shrink:0}
        .step-name-input{flex:1;background:none;border:none;border-bottom:1px solid var(--border);outline:none;font-size:.9rem;font-weight:700;color:var(--text);font-family:inherit;padding:2px 4px;transition:border-bottom-color .15s}
        .step-name-input:focus{border-bottom-color:var(--accent)}
        .step-type-badge{font-family:var(--font-mono);font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--accent-soft);color:var(--accent-ink);white-space:nowrap;cursor:pointer;border:none;transition:background .15s}
        .step-type-badge:hover{background:var(--accent-soft-2)}
        .step-del{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none;transition:background .12s,color .12s;flex-shrink:0}
        .step-del:hover{background:var(--danger-soft);color:var(--danger)}
        .step-del svg{width:13px;height:13px}
        .step-opts{display:flex;gap:16px;font-size:.78rem;color:var(--text-3);flex-wrap:wrap;align-items:center;margin-top:8px}
        .step-opt{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none}
        .step-opt input[type=checkbox]{accent-color:var(--accent);width:14px;height:14px;cursor:pointer}
        .step-select{font-family:inherit;font-size:.8rem;color:var(--text);background:var(--elev);border:1px solid var(--border-2);border-radius:8px;padding:5px 8px;outline:none;cursor:pointer}
        .step-input{font-family:var(--font-mono);font-size:.82rem;color:var(--text);background:var(--elev);border:1px solid var(--border-2);border-radius:8px;padding:5px 8px;outline:none;width:56px;text-align:center}
        .add-step-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;border:2px dashed var(--border-2);color:var(--text-3);font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit;background:none;transition:all .15s;width:100%;margin-top:12px}
        .add-step-btn:hover{border-color:var(--accent);color:var(--accent-ink);background:var(--accent-soft)}
        .add-step-btn svg{width:16px;height:16px}

        .cond-list{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
        .cond-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .cond-select{font-family:inherit;font-size:.82rem;color:var(--text);background:var(--content);border:1px solid var(--border-2);border-radius:8px;padding:6px 10px;outline:none;cursor:pointer}
        .cond-val{font-family:inherit;font-size:.82rem;color:var(--text);background:var(--content);border:1px solid var(--border-2);border-radius:8px;padding:6px 10px;outline:none;width:90px}
        .cond-rm{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;border:none;background:none;transition:background .12s,color .12s}
        .cond-rm:hover{background:var(--danger-soft);color:var(--danger)}
        .cond-rm svg{width:13px;height:13px}
        .cond-add{display:inline-flex;align-items:center;gap:5px;font-size:.78rem;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none;transition:color .15s;padding:4px 0}
        .cond-add:hover{color:var(--accent-ink)}

        .notif-list{display:flex;flex-direction:column;gap:8px}
        .notif-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--content);border:1px solid var(--border);border-radius:9px}
        .notif-row .nl{display:flex;align-items:center;gap:10px;font-size:.84rem;color:var(--text-2)}
        .notif-row .nl svg{width:16px;height:16px;color:var(--text-3)}

        .wf-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-3);gap:12px}
        .wf-empty svg{width:48px;height:48px;opacity:.25}

        .wf-create-scroll{flex:1;overflow-y:auto;padding:28px 32px}
        .wf-create-scroll h3{font-size:.98rem;font-weight:700;margin:0 0 20px}
        .wf-field{margin-bottom:16px}
        .wf-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);display:block;margin-bottom:6px}
        .wf-field input,.wf-field select{font-family:inherit;font-size:.88rem;color:var(--text);background:var(--elev);border:1.5px solid var(--border-2);border-radius:9px;padding:8px 12px;outline:none;width:100%;transition:border-color .15s}
        .wf-field input:focus,.wf-field select:focus{border-color:var(--accent)}
        .wf-create-step{background:var(--elev);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px}
      ` }} />

      <div className="wf-layout">
        {/* LEFT */}
        <div className="wf-list-pane">
          <div className="wf-list-head">
            <h3>Workflow</h3>
            <div style={{ fontSize: ".76rem", color: "var(--text-3)" }}>
              <b style={{ color: "var(--text)" }}>{templates.length}</b> quy trình ·{" "}
              <b style={{ color: "var(--ok)" }}>{activeCount}</b> đang bật
            </div>
          </div>
          <div className="wf-list">
            {isLoading && <div style={{ padding: "20px 16px", fontSize: ".82rem", color: "var(--text-3)" }}>Đang tải...</div>}
            {templates.map((t) => {
              const tm = typeMeta(t.targetType);
              return (
                <div key={t.id} className={`wf-item${selId === t.id && !creating ? " on" : ""}`}
                  onClick={() => { setSelId(t.id); setCreating(false); }}>
                  <div className="wf-item-ico" style={{ background: tm.bg }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={tm.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={tm.icoPath} /></svg>
                  </div>
                  <div className="wf-item-info">
                    <div className="wf-item-name">{t.name}</div>
                    <div className="wf-item-meta">{tm.label} · {t.steps.length} bước</div>
                  </div>
                  <div className="wf-item-status" style={{ background: t.isActive ? "var(--ok)" : "var(--border)" }} />
                </div>
              );
            })}
          </div>
          <button className="wf-add-btn" onClick={() => { setCreating(true); setSelId(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Thêm workflow mới
          </button>
        </div>

        {/* RIGHT */}
        <div className="wf-editor">
          {creating ? (
            <CreateForm
              newName={newName} setNewName={setNewName}
              newType={newType} setNewType={setNewType}
              newSteps={newSteps} setNewSteps={setNewSteps}
              employees={employees}
              onCancel={() => setCreating(false)}
              onSubmit={() => createMutation.mutate({
                name: newName, targetType: newType,
                triggers: ["submit"],
                conditions: [],
                notificationsConfig: DEFAULT_NOTIF,
                steps: newSteps.map(({ id: _id, ...s }) => ({ ...s, slaHours: s.slaHours ? Number(s.slaHours) : null })),
              })}
              isPending={createMutation.isPending}
            />
          ) : selected ? (
            <>
              {/* Editor header */}
              <div className="wf-editor-head">
                <div className="wf-item-ico" style={{ background: typeMeta(selected.targetType).bg, width: 36, height: 36, borderRadius: 9 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={typeMeta(selected.targetType).color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={typeMeta(selected.targetType).icoPath} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input className="wf-editor-name-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <div className="wf-head-meta">{typeMeta(selected.targetType).label} · {editSteps.length} bước · {editTriggers.length} trigger</div>
                </div>
                <div className="wf-head-actions">
                  <button className="abtn ghost" style={{ color: "var(--danger)", borderColor: "rgba(255,107,107,.3)", gap: 6, display: "inline-flex", alignItems: "center" }}
                    onClick={() => { if (confirm(`Xóa workflow "${selected.name}"?`)) deleteMutation.mutate(selected.id); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    Xóa
                  </button>
                  <div className="wf-toggle-wrap">
                    <span>{selected.isActive ? "Đang bật" : "Đã tắt"}</span>
                    <button className={`toggle-switch${selected.isActive ? " on" : ""}`}
                      onClick={() => toggleMutation.mutate({ id: selected.id, isActive: !selected.isActive })} />
                  </div>
                  <button className="abtn primary" style={{ gap: 7, display: "inline-flex", alignItems: "center" }}
                    onClick={saveWorkflow} disabled={saveMutation.isPending}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="wf-editor-scroll">
                {/* Triggers */}
                <div className={`wf-section${collapsed.has("triggers") ? " collapsed" : ""}`}>
                  <div className="wf-section-head" onClick={() => toggleSection("triggers")}>
                    <div className="wf-section-ico" style={{ background: "rgba(59,91,219,.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    </div>
                    <h4>Điều kiện kích hoạt</h4>
                    <span className="wf-section-tag" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{editTriggers.length} trigger</span>
                    <span className="wf-section-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></span>
                  </div>
                  <div className="wf-section-body">
                    <div className="trigger-list">
                      {TRIGGERS.map((tr) => {
                        const on = editTriggers.includes(tr.k);
                        return (
                          <button key={tr.k} className={`trigger-pill${on ? " on" : ""}`}
                            onClick={() => setEditTriggers(on ? editTriggers.filter((x) => x !== tr.k) : [...editTriggers, tr.k])}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={tr.icoPath} /></svg>
                            {tr.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className={`wf-section${collapsed.has("steps") ? " collapsed" : ""}`}>
                  <div className="wf-section-head" onClick={() => toggleSection("steps")}>
                    <div className="wf-section-ico" style={{ background: "rgba(74,222,128,.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M3 20c0-4 3.6-7 8-7" /><circle cx="18" cy="18" r="3" /><path d="M20.8 15.5l-1.4 1.4M16.6 20.5l-1.4 1.4M21.5 20.8l-1.4-1.4M15.5 16.6l-1.4-1.4" /></svg>
                    </div>
                    <h4>Các bước phê duyệt</h4>
                    <span className="wf-section-tag" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>{editSteps.length} bước</span>
                    <span className="wf-section-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></span>
                  </div>
                  <div className="wf-section-body">
                    <div className="step-flow">
                      {editSteps.map((step, idx) => (
                        <div key={idx}>
                          {idx > 0 && <div className="step-connector"><i /></div>}
                          <div className="wf-step">
                            <div className="wf-step-top">
                              <div className="step-num">{step.stepOrder}</div>
                              <input className="step-name-input" value={step.name}
                                onChange={(e) => updateStep(idx, { name: e.target.value })}
                                placeholder={`Bước ${step.stepOrder}: Tên...`} />
                              <button className="step-type-badge"
                                onClick={() => updateStep(idx, { stepType: step.stepType === "all" ? "any" : "all" })}>
                                {step.stepType === "all" ? "Tất cả duyệt" : "Bất kỳ duyệt"}
                              </button>
                              {editSteps.length > 1 && (
                                <button className="step-del" onClick={() => removeStep(idx)} title="Xóa bước">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                                </button>
                              )}
                            </div>
                            <div className="step-opts">
                              <div style={{ width: "100%", marginBottom: 4 }}>
                                <ApproverPicker
                                  step={step}
                                  employees={employees}
                                  onChange={(patch) => updateStep(idx, patch)}
                                />
                              </div>
                              <label className="step-opt">
                                <input type="checkbox" checked={step.notifyOnReject}
                                  onChange={(e) => updateStep(idx, { notifyOnReject: e.target.checked })} />
                                Thông báo khi từ chối
                              </label>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                Deadline:
                                <input type="number" className="step-input" min={1} max={168} value={step.slaHours ?? ""}
                                  onChange={(e) => updateStep(idx, { slaHours: e.target.value ? +e.target.value : null })} />
                                h
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="add-step-btn" onClick={addStep}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      Thêm bước phê duyệt
                    </button>
                  </div>
                </div>

                {/* Conditions */}
                <div className={`wf-section${collapsed.has("conditions") ? " collapsed" : ""}`}>
                  <div className="wf-section-head" onClick={() => toggleSection("conditions")}>
                    <div className="wf-section-ico" style={{ background: "rgba(251,191,36,.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="M22 4L12 14.01l-3-3" /></svg>
                    </div>
                    <h4>Điều kiện lọc</h4>
                    <span className="wf-section-tag" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                      {editConditions.length || "Tất cả"}
                    </span>
                    <span className="wf-section-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></span>
                  </div>
                  <div className="wf-section-body">
                    <div className="cond-list">
                      {editConditions.length === 0 && (
                        <div style={{ fontSize: ".82rem", color: "var(--text-3)" }}>Không có điều kiện — workflow áp dụng cho tất cả.</div>
                      )}
                      {editConditions.map((c, ci) => (
                        <div key={ci} className="cond-row">
                          <select className="cond-select" value={c.field} onChange={(e) => updateCondition(ci, { field: e.target.value })}>
                            {COND_FIELDS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
                          </select>
                          <select className="cond-select" value={c.op} onChange={(e) => updateCondition(ci, { op: e.target.value })}>
                            {COND_OPS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                          <input className="cond-val" type="text" value={c.val} placeholder="giá trị"
                            onChange={(e) => updateCondition(ci, { val: e.target.value })} />
                          <button className="cond-rm" onClick={() => removeCondition(ci)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="cond-add" onClick={addCondition}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}><path d="M12 5v14M5 12h14" /></svg>
                      Thêm điều kiện
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div className={`wf-section${collapsed.has("notifications") ? " collapsed" : ""}`}>
                  <div className="wf-section-head" onClick={() => toggleSection("notifications")}>
                    <div className="wf-section-ico" style={{ background: "rgba(167,139,250,.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                    </div>
                    <h4>Thông báo tự động</h4>
                    <span className="wf-section-tag" style={{ background: "rgba(167,139,250,.14)", color: "#a78bfa" }}>
                      {Object.values(editNotifs).filter(Boolean).length}/4
                    </span>
                    <span className="wf-section-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg></span>
                  </div>
                  <div className="wf-section-body">
                    <div className="notif-list">
                      {NOTIF_ROWS.map((nr) => (
                        <div key={nr.k} className="notif-row">
                          <div className="nl">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={nr.icoPath} /></svg>
                            {nr.l}
                          </div>
                          <button className={`toggle-switch${editNotifs[nr.k] ? " on" : ""}`}
                            onClick={() => setEditNotifs({ ...editNotifs, [nr.k]: !editNotifs[nr.k] })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="wf-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" /></svg>
              <p style={{ fontSize: ".9rem" }}>Chọn workflow để chỉnh sửa</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CreateForm({ newName, setNewName, newType, setNewType, newSteps, setNewSteps, employees, onCancel, onSubmit, isPending }: {
  newName: string; setNewName: (v: string) => void;
  newType: string; setNewType: (v: string) => void;
  newSteps: Step[]; setNewSteps: (fn: (s: Step[]) => Step[]) => void;
  employees: Employee[];
  onCancel: () => void; onSubmit: () => void; isPending: boolean;
}) {
  return (
    <div className="wf-create-scroll">
      <h3>Tạo workflow mới</h3>
      <div className="wf-field">
        <label>Tên workflow *</label>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="VD: Phê duyệt nghỉ phép" autoFocus />
      </div>
      <div className="wf-field">
        <label>Loại đối tượng</label>
        <select value={newType} onChange={(e) => setNewType(e.target.value)}>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="wf-field">
        <label>Các bước duyệt</label>
        {newSteps.map((step, idx) => (
          <div key={idx} className="wf-create-step">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center", fontSize: ".74rem", fontWeight: 800, flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                {step.stepOrder}
              </div>
              <input value={step.name}
                onChange={(e) => setNewSteps((s) => s.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                placeholder="Tên bước..."
                style={{ flex: 1, background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "5px 10px", fontFamily: "inherit", fontSize: ".88rem", color: "var(--text)", outline: "none" }}
              />
              {newSteps.length > 1 && (
                <button style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", color: "var(--text-3)", cursor: "pointer", border: "none", background: "none" }}
                  onClick={() => setNewSteps((s) => s.filter((_, i) => i !== idx).map((x, i) => ({ ...x, stepOrder: i + 1 })))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              )}
            </div>
            <div style={{ marginTop: 4 }}>
              <ApproverPicker
                step={step}
                employees={employees}
                onChange={(patch) => setNewSteps((s) => s.map((x, i) => i === idx ? { ...x, ...patch } : x))}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: ".78rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                SLA:
                <input type="number" min={1} value={step.slaHours ?? ""}
                  onChange={(e) => setNewSteps((s) => s.map((x, i) => i === idx ? { ...x, slaHours: e.target.value ? +e.target.value : null } : x))}
                  style={{ width: 56, fontFamily: "var(--font-mono)", fontSize: ".82rem", color: "var(--text)", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "5px 8px", outline: "none", textAlign: "center" }} />
                h
              </span>
            </div>
          </div>
        ))}
        <button onClick={() => setNewSteps((s) => [...s, emptyStep(s.length + 1)])}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 12, border: "2px dashed var(--border-2)", color: "var(--text-3)", fontSize: ".84rem", cursor: "pointer", fontFamily: "inherit", background: "none", width: "100%", marginTop: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M12 5v14M5 12h14" /></svg>
          Thêm bước
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="abtn primary" style={{ gap: 7, display: "inline-flex", alignItems: "center" }}
          disabled={!newName.trim() || newSteps.some((s) => !s.name.trim()) || isPending}
          onClick={onSubmit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {isPending ? "Đang tạo..." : "Tạo workflow"}
        </button>
        <button className="abtn ghost" onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function ApproverPicker({ step, employees, onChange }: {
  step: Step;
  employees: Employee[];
  onChange: (patch: Partial<Step>) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selectedIds = step.approverRefs ?? [];
  const selectedEmps = selectedIds.map((id) => employees.find((e) => String(e.id) === id)).filter(Boolean) as Employee[];
  const filtered = employees.filter(
    (e) => !selectedIds.includes(String(e.id)) &&
      (e.fullName.toLowerCase().includes(search.toLowerCase()) ||
       (e.department ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  function addEmp(emp: Employee) {
    onChange({ approverType: "SPECIFIC_EMPLOYEE", approverRefs: [...selectedIds, String(emp.id)] });
    setSearch("");
    setOpen(false);
  }

  function removeEmp(id: string) {
    onChange({ approverRefs: selectedIds.filter((x) => x !== id) });
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", position: "relative" }}>
      {/* Selected chips */}
      {selectedEmps.map((emp) => (
        <span key={emp.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", borderRadius: 99, background: "var(--elev)", border: "1px solid var(--border-2)", fontSize: ".78rem", color: "var(--text-2)" }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#4f7aff)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".6rem", fontWeight: 700, flexShrink: 0 }}>
            {initials(emp.fullName)}
          </span>
          {emp.fullName}
          <button onClick={() => removeEmp(String(emp.id))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, fontSize: ".95rem", padding: 0, display: "grid", placeItems: "center" }}>×</button>
        </span>
      ))}

      {/* + Thêm trigger */}
      <div ref={pickerRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 99, border: "1.5px dashed var(--border-2)", background: "none", color: "var(--text-3)", fontSize: ".76rem", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s,color .15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-ink)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width={12} height={12}><path d="M12 5v14M5 12h14" /></svg>
          Thêm
        </button>

        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 240, background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.35)", zIndex: 50 }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--content)", borderRadius: 7 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={13} height={13} style={{ color: "var(--text-3)", flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm nhân viên..."
                  style={{ background: "none", border: "none", outline: "none", fontFamily: "inherit", fontSize: ".82rem", color: "var(--text)", flex: 1 }} />
              </div>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: ".82rem", color: "var(--text-3)" }}>
                  {employees.length === 0 ? "Đang tải..." : "Không tìm thấy"}
                </div>
              ) : (
                filtered.slice(0, 30).map((emp) => (
                  <div key={emp.id} onMouseDown={() => addEmp(emp)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--content)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#4f7aff)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".64rem", fontWeight: 700, flexShrink: 0 }}>
                      {initials(emp.fullName)}
                    </span>
                    <div>
                      <div style={{ fontSize: ".86rem", fontWeight: 600, color: "var(--text)" }}>{emp.fullName}</div>
                      {emp.department && <div style={{ fontSize: ".72rem", color: "var(--text-3)" }}>{emp.department}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
