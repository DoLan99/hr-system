"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Video, AlertTriangle } from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày"),
  taskName: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  timeAllotted: z.number().int().min(1, "Tối thiểu 1 phút"),
  videoLink: z.string().min(1, "Video bắt buộc — bằng chứng công việc"),
  videoDuration: z.number().int().min(0).optional(),
  dateRecorded: z.string().optional(),
  reasonNote: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MissingTask {
  id: number;
  date: string;
  taskName: string;
  description?: string | null;
  quantity: number;
  timeAllotted: number | null;
  videoLink: string;
  videoDuration?: number | null;
  dateRecorded?: string | null;
  reasonNote?: string | null;
}

interface Props {
  open: boolean;
  task?: MissingTask | null;
  onClose: () => void;
  onSaved: (item: any) => void;
}

export function MissingTaskFormModal({ open, task, onClose, onSaved }: Props) {
  const isEdit = !!task?.id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const timeAllotted = watch("timeAllotted");

  useEffect(() => {
    if (!open) return;
    if (task) {
      reset({
        date: String(task.date).slice(0, 10),
        taskName: task.taskName,
        description: task.description ?? "",
        quantity: task.quantity,
        timeAllotted: task.timeAllotted ?? undefined,
        videoLink: task.videoLink,
        videoDuration: task.videoDuration ?? undefined,
        dateRecorded: task.dateRecorded ? String(task.dateRecorded).slice(0, 10) : "",
        reasonNote: task.reasonNote ?? "",
      });
    } else {
      reset({
        date: new Date().toISOString().slice(0, 10),
        quantity: 1,
      });
    }
  }, [open, task, reset]);

  async function onSubmit(data: FormValues) {
    const url = isEdit ? `/api/missing-tasks/${task!.id}` : "/api/missing-tasks";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) onSaved(json.data);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? "Sửa khai báo" : "Khai báo Missing Task"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Missing Task là công việc đã thực hiện nhưng chưa được ghi vào Work Report.
            <strong> Bắt buộc có video bằng chứng.</strong> Manager sẽ xét duyệt và tính giờ.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Row: Date + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày làm <span className="text-red-500">*</span>
              </label>
              <input
                {...register("date")}
                type="date"
                className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.date ? "border-red-400" : "border-slate-300")}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
              <input
                {...register("quantity", { valueAsNumber: true })}
                type="number"
                min={1}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên công việc <span className="text-red-500">*</span>
            </label>
            <input
              {...register("taskName")}
              className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.taskName ? "border-red-400" : "border-slate-300")}
              placeholder="Mô tả công việc đã làm..."
            />
            {errors.taskName && <p className="text-red-500 text-xs mt-1">{errors.taskName.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chi tiết</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Mô tả chi tiết, kết quả đạt được..."
            />
          </div>

          {/* Row: Time + Video Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời gian (phút) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("timeAllotted", { valueAsNumber: true })}
                type="number"
                min={1}
                className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.timeAllotted ? "border-red-400" : "border-slate-300")}
                placeholder="60"
              />
              {errors.timeAllotted && <p className="text-red-500 text-xs mt-1">{errors.timeAllotted.message}</p>}
              {timeAllotted > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">≈ {formatMinutes(timeAllotted)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Độ dài video (phút)</label>
              <input
                {...register("videoDuration", { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>
          </div>

          {/* Video Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                Link video bằng chứng <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              {...register("videoLink")}
              className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.videoLink ? "border-red-400" : "border-slate-300")}
              placeholder="https://drive.google.com/..."
            />
            {errors.videoLink && <p className="text-red-500 text-xs mt-1">{errors.videoLink.message}</p>}
          </div>

          {/* Row: Date Recorded + Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày quay video</label>
              <input
                {...register("dateRecorded")}
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do chưa report</label>
              <input
                {...register("reasonNote")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quên, không kịp..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Gửi khai báo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
