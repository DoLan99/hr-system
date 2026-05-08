"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskLibrary } from "@prisma/client";

const DEPARTMENTS = ["Dev", "Admin", "Sales", "Design", "QA", "All", "Khác"];

const SPECIAL_IDS = ["1001", "2001", "2002"];

const schema = z.object({
  taskId: z
    .string()
    .min(1, "Bắt buộc")
    .max(20, "Tối đa 20 ký tự")
    .regex(/^[A-Z0-9]+$/, "Chỉ dùng chữ IN HOA và số (VD: DEV01, ADM02)"),
  taskName: z.string().min(1, "Bắt buộc").max(200, "Tối đa 200 ký tự"),
  description: z.string().optional(),
  stdTime: z
    .number({ invalid_type_error: "Phải là số" })
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu 1 phút"),
  department: z.string().min(1, "Bắt buộc"),
  linkTemplate: z.string().optional(),
  note1: z.string().optional(),
  note2: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormModalProps {
  open: boolean;
  task?: TaskLibrary | null;
  onClose: () => void;
  onSaved: (task: TaskLibrary) => void;
}

export function TaskFormModal({ open, task, onClose, onSaved }: TaskFormModalProps) {
  const isEdit = !!task;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      taskId: "",
      taskName: "",
      description: "",
      stdTime: 1,
      department: "Dev",
      linkTemplate: "",
      note1: "",
      note2: "",
    },
  });

  useEffect(() => {
    if (open) {
      setServerError(null);
      reset(
        task
          ? {
              taskId: task.taskId,
              taskName: task.taskName,
              description: task.description ?? "",
              stdTime: task.stdTime,
              department: task.department ?? "Dev",
              linkTemplate: task.linkTemplate ?? "",
              note1: task.note1 ?? "",
              note2: task.note2 ?? "",
            }
          : {
              taskId: "",
              taskName: "",
              description: "",
              stdTime: 1,
              department: "Dev",
              linkTemplate: "",
              note1: "",
              note2: "",
            }
      );
    }
  }, [open, task, reset]);

  const watchedId = watch("taskId");
  const isSpecial = SPECIAL_IDS.includes(watchedId);

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const url = isEdit ? `/api/task-library/${task!.id}` : "/api/task-library";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra.");
        return;
      }

      onSaved(json.data);
      onClose();
    } catch {
      setServerError("Không thể kết nối đến server.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? "Chỉnh sửa Task" : "Thêm Task mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isSpecial && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Task ID <strong>{watchedId}</strong> là task đặc biệt. Hãy chỉnh sửa cẩn thận vì ảnh hưởng đến toàn bộ Work Report.
              </span>
            </div>
          )}

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
              {serverError}
            </div>
          )}

          <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row: Task ID + Std Time */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Task ID" required error={errors.taskId?.message}>
                <input
                  {...register("taskId")}
                  disabled={isEdit}
                  placeholder="VD: DEV01, ADM02"
                  className={inputCls(!!errors.taskId, isEdit)}
                />
                {isEdit && (
                  <p className="text-xs text-slate-400 mt-0.5">Task ID không thể thay đổi</p>
                )}
              </Field>

              <Field label="Thời gian chuẩn (phút)" required error={errors.stdTime?.message}>
                <input
                  {...register("stdTime", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  placeholder="60"
                  className={inputCls(!!errors.stdTime)}
                />
              </Field>
            </div>

            {/* Task Name */}
            <Field label="Tên task" required error={errors.taskName?.message}>
              <input
                {...register("taskName")}
                placeholder="VD: Viết code chức năng"
                className={inputCls(!!errors.taskName)}
              />
            </Field>

            {/* Description */}
            <Field label="Mô tả" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Mô tả chi tiết công việc này bao gồm những gì..."
                className={cn(inputCls(!!errors.description), "resize-none")}
              />
            </Field>

            {/* Department */}
            <Field label="Phòng ban" required error={errors.department?.message}>
              <select {...register("department")} className={inputCls(!!errors.department)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            {/* Link Template */}
            <Field label="Link template mẫu" error={errors.linkTemplate?.message}>
              <input
                {...register("linkTemplate")}
                placeholder="https://drive.google.com/..."
                className={inputCls(!!errors.linkTemplate)}
              />
            </Field>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ghi chú 1" error={errors.note1?.message}>
                <input
                  {...register("note1")}
                  placeholder="VD: for Dev"
                  className={inputCls(!!errors.note1)}
                />
              </Field>
              <Field label="Ghi chú 2" error={errors.note2?.message}>
                <input
                  {...register("note2")}
                  placeholder="Ghi chú thêm"
                  className={inputCls(!!errors.note2)}
                />
              </Field>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Tạo task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean, disabled = false) {
  return cn(
    "w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError ? "border-red-300 bg-red-50" : "border-slate-300 bg-white",
    disabled && "bg-slate-50 text-slate-500 cursor-not-allowed"
  );
}
