"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type Step = {
  stepOrder: number;
  name: string;
  approverType: "ROLE" | "SPECIFIC_EMPLOYEE" | "DEPARTMENT_HEAD" | "DIRECT_MANAGER";
  approverRef: string | null;
  slaHours: number | null;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  targetType: string;
  isActive: boolean;
  steps: (Step & { id: number })[];
};

const TARGET_OPTIONS = [
  { value: "LEAVE", label: "Nghỉ phép" },
  { value: "DOCUMENT", label: "Tài liệu" },
  { value: "PURCHASE", label: "Mua sắm" },
  { value: "TIMELOG", label: "Chấm công" },
  { value: "CUSTOM", label: "Tuỳ chỉnh" },
];

const APPROVER_OPTIONS = [
  { value: "DIRECT_MANAGER", label: "Quản lý trực tiếp" },
  { value: "DEPARTMENT_HEAD", label: "Trưởng phòng" },
  { value: "ROLE", label: "Theo vai trò (nhập role ID)" },
  { value: "SPECIFIC_EMPLOYEE", label: "Nhân viên cụ thể (nhập ID)" },
];

function emptyStep(order: number): Step {
  return { stepOrder: order, name: "", approverType: "DIRECT_MANAGER", approverRef: null, slaHours: null };
}

function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Template>;
  onSave: (data: { name: string; description?: string; targetType: string; steps: Step[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetType, setTargetType] = useState(initial?.targetType ?? "LEAVE");
  const [steps, setSteps] = useState<Step[]>(
    initial?.steps?.length ? initial.steps : [emptyStep(1)],
  );

  const addStep = () => setSteps((s) => [...s, emptyStep(s.length + 1)]);
  const removeStep = (idx: number) =>
    setSteps((s) => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, stepOrder: i + 1 })));
  const updateStep = (idx: number, patch: Partial<Step>) =>
    setSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));

  const handleSave = () => {
    if (!name.trim()) return;
    if (steps.some((s) => !s.name.trim())) return;
    onSave({ name, description: description || undefined, targetType, steps });
  };

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tên workflow *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Duyệt nghỉ phép"
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Loại đối tượng</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none"
          >
            {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Mô tả</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tuỳ chọn..."
          className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Steps */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Các bước duyệt</p>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/20">
              <GripVertical className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={step.name}
                  onChange={(e) => updateStep(idx, { name: e.target.value })}
                  placeholder={`Bước ${step.stepOrder}: Tên...`}
                  className="text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <select
                  value={step.approverType}
                  onChange={(e) => updateStep(idx, { approverType: e.target.value as Step["approverType"] })}
                  className="text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
                >
                  {APPROVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  {(step.approverType === "ROLE" || step.approverType === "SPECIFIC_EMPLOYEE") && (
                    <input
                      value={step.approverRef ?? ""}
                      onChange={(e) => updateStep(idx, { approverRef: e.target.value || null })}
                      placeholder="ID..."
                      className="w-16 text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
                    />
                  )}
                  <input
                    type="number"
                    value={step.slaHours ?? ""}
                    onChange={(e) => updateStep(idx, { slaHours: e.target.value ? Number(e.target.value) : null })}
                    placeholder="SLA (h)"
                    min={1}
                    className="w-20 text-sm border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
                  />
                </div>
              </div>
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive mt-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addStep} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Thêm bước
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim() || steps.some((s) => !s.name.trim())}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Lưu
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-2 border text-sm rounded-lg">
          <X className="h-4 w-4" /> Hủy
        </button>
      </div>
    </div>
  );
}

export function WorkflowBuilder() {
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ data: Template[] }>({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const res = await fetch("/api/workflows/templates");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof TemplateForm>[0]["onSave"] extends (d: infer D) => void ? D : never) => {
      const res = await fetch("/api/workflows/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-templates"] });
      setCreating(false);
      toast({ title: "Đã tạo workflow" });
    },
    onError: (e) => toast({ title: "Lỗi tạo workflow", description: String(e), variant: "error" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/workflows/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-templates"] }),
    onError: (e) => toast({ title: "Lỗi cập nhật", description: String(e), variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workflows/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflow-templates"] }); toast({ title: "Đã xóa" }); },
    onError: (e) => toast({ title: "Lỗi xóa", description: String(e), variant: "error" }),
  });

  const templates = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} workflow template</p>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
          >
            <Plus className="h-4 w-4" /> Tạo workflow
          </button>
        )}
      </div>

      {creating && (
        <TemplateForm
          onSave={(d) => createMutation.mutate(d)}
          onCancel={() => setCreating(false)}
        />
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {templates.map((t) => (
        <div key={t.id} className="border rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-muted/30"
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${t.isActive ? "bg-green-500" : "bg-gray-400"}`} />
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TARGET_OPTIONS.find((o) => o.value === t.targetType)?.label} · {t.steps.length} bước
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: t.id, isActive: !t.isActive }); }}
                className="p-1.5 rounded hover:bg-accent"
                title={t.isActive ? "Tắt" : "Bật"}
              >
                {t.isActive
                  ? <ToggleRight className="h-5 w-5 text-green-500" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Xóa "${t.name}"?`)) deleteMutation.mutate(t.id); }}
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {expanded === t.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {expanded === t.id && (
            <div className="border-t p-4 bg-muted/10">
              {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
              <div className="space-y-2">
                {t.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {step.stepOrder}
                    </span>
                    <span className="font-medium">{step.name}</span>
                    <span className="text-muted-foreground">
                      {APPROVER_OPTIONS.find((o) => o.value === step.approverType)?.label}
                      {step.approverRef ? ` #${step.approverRef}` : ""}
                    </span>
                    {step.slaHours && (
                      <span className="ml-auto text-xs text-muted-foreground">SLA: {step.slaHours}h</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
