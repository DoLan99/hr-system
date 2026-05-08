"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Video, ArrowUp, ArrowDown, Info } from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().min(1, "Chọn Task ID"),
  actualTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  proposedStdTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  reason: z.string().min(1, "Bắt buộc giải thích"),
  videoLink: z.string().min(1, "Video bắt buộc"),
  videoDuration: z.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TimeCheckItem {
  id: number;
  date: string;
  taskId: string | null;
  task?: { taskId: string; taskName: string; stdTime: number } | null;
  actualTime: number;
  proposedStdTime: number;
  reason: string | null;
  videoLink: string;
  videoDuration?: number | null;
}

interface Props {
  open: boolean;
  item?: TimeCheckItem | null;
  onClose: () => void;
  onSaved: (item: any) => void;
}

export function TimeCheckFormModal({ open, item, onClose, onSaved }: Props) {
  const isEdit = !!item?.id;
  const [taskSuggestions, setTaskSuggestions] = useState<{ taskId: string; taskName: string; stdTime: number | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentStdTime, setCurrentStdTime] = useState<number | null>(null);

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  const taskId = watch("taskId");
  const actualTime = watch("actualTime");
  const proposedStdTime = watch("proposedStdTime");
  const diff = proposedStdTime && currentStdTime ? proposedStdTime - currentStdTime : null;

  useEffect(() => {
    if (!open) return;
    if (item) {
      reset({
        date: item.date.slice(0, 10),
        taskId: item.taskId ?? "",
        actualTime: item.actualTime,
        proposedStdTime: item.proposedStdTime,
        reason: item.reason ?? "",
        videoLink: item.videoLink,
        videoDuration: item.videoDuration ?? undefined,
      });
      setCurrentStdTime(item.task?.stdTime ?? null);
    } else {
      reset({ date: new Date().toISOString().slice(0, 10) });
      setCurrentStdTime(null);
    }
  }, [open, item, reset]);

  const searchTask = useCallback(async (q: string) => {
    if (q.length < 1) { setTaskSuggestions([]); return; }
    const res = await fetch(`/api/task-library?search=${encodeURIComponent(q)}&activeOnly=true`);
    const json = await res.json();
    setTaskSuggestions(json.data?.slice(0, 6) ?? []);
    setShowSuggestions(true);
  }, []);

  function selectTask(t: { taskId: string; taskName: string; stdTime: number | null }) {
    setValue("taskId", t.taskId);
    setCurrentStdTime(t.stdTime ?? null);
    setShowSuggestions(false);
    setTaskSuggestions([]);
  }

  async function onSubmit(data: FormValues) {
    const url = isEdit ? `/api/time-check/${item!.id}` : "/api/time-check";
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
            {isEdit ? "Sửa đề xuất Time Check" : "Đề xuất điều chỉnh Std Time"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Dùng khi bạn cho rằng thời gian chuẩn (Std Time) của một task không phản ánh đúng thực tế.
            Cần có <strong>video bằng chứng</strong> để manager xét duyệt.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Row: Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngày thực hiện <span className="text-red-500">*</span>
            </label>
            <input
              {...register("date")}
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Task ID autocomplete */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Task ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("taskId")}
                disabled={isEdit}
                onChange={e => {
                  setValue("taskId", e.target.value.toUpperCase());
                  searchTask(e.target.value);
                }}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono",
                  errors.taskId ? "border-red-400" : "border-slate-300",
                  isEdit && "bg-slate-50"
                )}
                placeholder="DEV01..."
                autoComplete="off"
              />
              {showSuggestions && taskSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {taskSuggestions.map(t => (
                    <button
                      key={t.taskId}
                      type="button"
                      onClick={() => selectTask(t)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 text-left transition"
                    >
                      <span>
                        <span className="text-xs font-mono font-bold text-blue-600">{t.taskId}</span>
                        <span className="text-xs text-slate-600 ml-2">{t.taskName}</span>
                      </span>
                      {t.stdTime && (
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatMinutes(t.stdTime)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.taskId && <p className="text-red-500 text-xs mt-1">{errors.taskId.message}</p>}

            {/* Current std time info */}
            {currentStdTime !== null && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>Std Time hiện tại:</span>
                <strong className="text-slate-700">{formatMinutes(currentStdTime)}</strong>
              </p>
            )}
          </div>

          {/* Row: Actual time + Proposed std time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thực tế làm (phút) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("actualTime", { valueAsNumber: true })}
                type="number" min={1}
                className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.actualTime ? "border-red-400" : "border-slate-300")}
                placeholder="90"
              />
              {actualTime > 0 && <p className="text-xs text-slate-400 mt-0.5">≈ {formatMinutes(actualTime)}</p>}
              {errors.actualTime && <p className="text-red-500 text-xs mt-1">{errors.actualTime.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Đề xuất Std Time (phút) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("proposedStdTime", { valueAsNumber: true })}
                type="number" min={1}
                className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.proposedStdTime ? "border-red-400" : "border-slate-300")}
                placeholder="75"
              />
              {proposedStdTime > 0 && <p className="text-xs text-slate-400 mt-0.5">≈ {formatMinutes(proposedStdTime)}</p>}
              {errors.proposedStdTime && <p className="text-red-500 text-xs mt-1">{errors.proposedStdTime.message}</p>}
            </div>
          </div>

          {/* Delta preview */}
          {diff !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border",
              diff > 0
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-green-50 border-green-200 text-green-700"
            )}>
              {diff > 0
                ? <ArrowUp className="w-4 h-4" />
                : <ArrowDown className="w-4 h-4" />}
              Đề xuất {diff > 0 ? "tăng" : "giảm"}{" "}
              <strong>{formatMinutes(Math.abs(diff))}</strong>
              {" "}({diff > 0 ? "+" : ""}{diff} phút)
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lý do đề xuất <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("reason")}
              rows={3}
              className={cn("w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
                errors.reason ? "border-red-400" : "border-slate-300")}
              placeholder="Giải thích tại sao std time cần điều chỉnh, các yếu tố ảnh hưởng..."
            />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
          </div>

          {/* Row: Video link + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Độ dài video (phút)</label>
              <input
                {...register("videoDuration", { valueAsNumber: true })}
                type="number" min={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
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
              {isEdit ? "Lưu thay đổi" : "Gửi đề xuất"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
