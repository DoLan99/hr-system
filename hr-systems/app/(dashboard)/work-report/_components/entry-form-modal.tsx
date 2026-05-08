"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, AlertTriangle, CheckCircle2, Info, Video, Link2 } from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";
import { calcCreditedTime, needsVideo, creditStatusLabel } from "@/lib/work-report";
import type { TaskLibrary, WorkList } from "@prisma/client";

const SPECIAL_TASKS: Record<string, string> = {
  "1001": "Bắt buộc: link tài liệu + note tóm tắt + video minh họa",
  "2001": "Quantity = số phút. Bắt buộc: video + link tài liệu + note",
  "2002": "Tương tự 2001. Bắt buộc: video + link tài liệu",
};

const schema = z.object({
  taskId: z.string().min(1, "Chọn Task ID"),
  quantity: z.number().int().min(1),
  actualTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  completionPct: z.number().int().min(0).max(100),
  description: z.string().optional(),
  videoLink: z.string().optional(),
  videoDuration: z.number().int().min(0).optional(),
  note: z.string().optional(),
  link: z.string().optional(),
  wlId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EntryFormModalProps {
  open: boolean;
  date: string; // yyyy-MM-dd
  entry?: Partial<FormValues & { id: number }> | null;
  openTasks: Pick<WorkList, "wlId" | "title">[];
  onClose: () => void;
  onSaved: (entry: any) => void;
}

export function EntryFormModal({
  open,
  date,
  entry,
  openTasks,
  onClose,
  onSaved,
}: EntryFormModalProps) {
  const isEdit = !!entry?.id;
  const [serverError, setServerError] = useState<string | null>(null);
  const [taskInfo, setTaskInfo] = useState<TaskLibrary | null>(null);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskLibrary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      taskId: "", quantity: 1, actualTime: 0,
      completionPct: 100, description: "", videoLink: "",
      videoDuration: 0, note: "", link: "", wlId: "",
    },
  });

  const watchedTaskId = useWatch({ control, name: "taskId" });
  const watchedActual = useWatch({ control, name: "actualTime" });
  const watchedQty = useWatch({ control, name: "quantity" });
  const watchedVideo = useWatch({ control, name: "videoLink" });

  // Reset khi mở modal
  useEffect(() => {
    if (open) {
      setServerError(null);
      setTaskInfo(null);
      reset(
        entry
          ? { ...entry, quantity: entry.quantity ?? 1, completionPct: entry.completionPct ?? 100 }
          : { taskId: "", quantity: 1, actualTime: 0, completionPct: 100 }
      );
    }
  }, [open, entry, reset]);

  // Tìm kiếm task khi gõ task ID
  const searchTasks = useCallback(
    (q: string) => {
      if (!q || q.length < 1) {
        setTaskSuggestions([]);
        return;
      }
      if (searchTimeout) clearTimeout(searchTimeout);
      const t = setTimeout(async () => {
        const res = await fetch(`/api/task-library?search=${encodeURIComponent(q)}&activeOnly=true`);
        if (res.ok) {
          const { data } = await res.json();
          setTaskSuggestions(data.slice(0, 8));
        }
      }, 200);
      setSearchTimeout(t);
    },
    [searchTimeout]
  );

  // Auto-load task info khi taskId đầy đủ
  useEffect(() => {
    if (!watchedTaskId) { setTaskInfo(null); return; }
    const load = async () => {
      const res = await fetch(`/api/task-library?search=${encodeURIComponent(watchedTaskId)}&activeOnly=false`);
      if (res.ok) {
        const { data } = await res.json();
        const exact = data.find((t: TaskLibrary) => t.taskId === watchedTaskId);
        setTaskInfo(exact ?? null);
      }
    };
    load();
  }, [watchedTaskId]);

  // Tính credited time preview
  const creditPreview =
    watchedTaskId && watchedActual > 0
      ? calcCreditedTime({
          taskId: watchedTaskId,
          actualTime: watchedActual,
          stdTime: taskInfo?.stdTime ?? null,
          quantity: watchedQty,
          videoLink: watchedVideo,
        })
      : null;

  const videoRequired =
    watchedTaskId && watchedActual > 0
      ? needsVideo(watchedTaskId, watchedActual, taskInfo?.stdTime ?? null)
      : false;

  const is2001 = ["2001", "2002"].includes(watchedTaskId);
  const specialNote = SPECIAL_TASKS[watchedTaskId];

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const url = isEdit ? `/api/work-report/${entry!.id}` : "/api/work-report";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, date }),
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl mx-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? "Sửa dòng báo cáo" : "Thêm task vào báo cáo"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form id="entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Task ID + Quantity + Actual time */}
            <div className="grid grid-cols-12 gap-3">
              {/* Task ID — chiếm 5 cols, có autocomplete */}
              <div className="col-span-5">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register("taskId")}
                    placeholder="VD: DEV01, 1001"
                    autoComplete="off"
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      errors.taskId ? "border-red-300" : "border-slate-300"
                    )}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      setValue("taskId", v);
                      searchTasks(v);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {/* Suggestions dropdown */}
                  {showSuggestions && taskSuggestions.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {taskSuggestions.map((t) => (
                        <button
                          key={t.taskId}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-3"
                          onClick={() => {
                            setValue("taskId", t.taskId);
                            setTaskInfo(t);
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-mono text-xs font-bold text-slate-700 w-16 flex-shrink-0">
                            {t.taskId}
                          </span>
                          <span className="text-xs text-slate-600 truncate">{t.taskName}</span>
                          <span className="ml-auto text-xs text-blue-600 flex-shrink-0">
                            {formatMinutes(t.stdTime)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.taskId && <p className="text-red-500 text-xs mt-1">{errors.taskId.message}</p>}
              </div>

              {/* Quantity */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Qty {is2001 && <span className="text-amber-600 text-xs">(= phút)</span>}
                </label>
                <input
                  {...register("quantity", { valueAsNumber: true })}
                  type="number" min={1}
                  className={cn("w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.quantity ? "border-red-300" : "border-slate-300")}
                />
              </div>

              {/* Actual time */}
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Actual time (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("actualTime", { valueAsNumber: true })}
                  type="number" min={1} placeholder="VD: 60"
                  className={cn("w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.actualTime ? "border-red-300" : "border-slate-300")}
                />
                {errors.actualTime && <p className="text-red-500 text-xs mt-1">{errors.actualTime.message}</p>}
              </div>
            </div>

            {/* Task info bar */}
            {taskInfo && (
              <div className="flex items-center gap-4 px-3 py-2.5 bg-slate-50 rounded-lg text-xs">
                <span className="font-medium text-slate-700">{taskInfo.taskName}</span>
                <span className="text-slate-400">Std: <strong className="text-slate-600">{formatMinutes(taskInfo.stdTime)}</strong></span>
                {taskInfo.department && (
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{taskInfo.department}</span>
                )}
              </div>
            )}

            {/* Special task warning */}
            {specialNote && (
              <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Task đặc biệt {watchedTaskId}: </span>
                  {specialNote}
                </div>
              </div>
            )}

            {/* Credited time preview */}
            {creditPreview && (
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs border",
                creditPreview.status === "ok" && "bg-green-50 border-green-200",
                creditPreview.status === "pending_approval" && "bg-blue-50 border-blue-200",
                creditPreview.status === "capped" && "bg-amber-50 border-amber-200",
                creditPreview.status === "zero" && "bg-red-50 border-red-200",
              )}>
                {creditPreview.status === "ok"
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  : <Info className="w-4 h-4 flex-shrink-0" />}
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-slate-700">
                    Credited: <strong>{formatMinutes(creditPreview.creditedTime)}</strong>
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full font-medium",
                    creditStatusLabel(creditPreview.status).color
                  )}>
                    {creditStatusLabel(creditPreview.status).label}
                  </span>
                </div>
                {creditPreview.reason && (
                  <span className="text-slate-500">{creditPreview.reason}</span>
                )}
              </div>
            )}

            {/* Video section — required indicator */}
            {videoRequired && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <Video className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Video bắt buộc</strong>
                  {taskInfo && watchedActual > taskInfo.stdTime
                    ? " — Actual > Std time, cần video minh chứng"
                    : " — Task này bắt buộc có video"}
                  . Nếu không có video, giờ sẽ
                  {["2001", "2002", "1001"].includes(watchedTaskId)
                    ? " không được tính (credited = 0)"
                    : ` chỉ tính ${formatMinutes((taskInfo?.stdTime ?? 0) * watchedQty)} (std time)`}
                  .
                </span>
              </div>
            )}

            {/* Video link + duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Video link (Google Drive)
                  {videoRequired && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    {...register("videoLink")}
                    placeholder="https://drive.google.com/..."
                    className={cn(
                      "w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                      videoRequired && !watchedVideo ? "border-red-300 bg-red-50" : "border-slate-300"
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Thời lượng video (phút)
                </label>
                <input
                  {...register("videoDuration", { valueAsNumber: true })}
                  type="number" min={0} placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* WL ID + Completion */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Liên kết Work List
                </label>
                <select
                  {...register("wlId")}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Không liên kết —</option>
                  {openTasks.map((wl) => (
                    <option key={wl.wlId} value={wl.wlId}>
                      {wl.wlId} — {wl.title.slice(0, 35)}{wl.title.length > 35 ? "…" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hoàn thành %
                </label>
                <input
                  {...register("completionPct", { valueAsNumber: true })}
                  type="number" min={0} max={100}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="Mô tả ngắn gọn công việc đã làm..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Note + Link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <input
                  {...register("note")}
                  placeholder="Ghi chú thêm nếu cần"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Link2 className="inline w-3.5 h-3.5 mr-1" />
                  Link tài liệu / output
                </label>
                <input
                  {...register("link")}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
            Hủy
          </button>
          <button type="submit" form="entry-form" disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Thêm dòng"}
          </button>
        </div>
      </div>
    </div>
  );
}
