"use client";

import { useEffect, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { useTimer } from "@/lib/contexts/timer-context";
import { toast } from "@/lib/hooks/use-toast";
import { StopTimerModal, type StopTimerPayload } from "@/components/tracking/stop-timer-modal";

interface Props {
  taskId: number;
  /** ID nhân viên được assign task — chỉ assignee mới có thể start/stop timer */
  assigneeId: number;
  /** ID user hiện tại */
  currentUserId: number;
  /** Callback khi state thay đổi để parent refetch task data */
  onChange?: () => void;
  /** Variant: full (default) = button có label. compact = icon-only nhỏ */
  variant?: "full" | "compact";
  className?: string;
  /** Thông tin task để hiển thị trong modal dừng timer */
  taskCode?: string;
  taskTitle?: string;
  taskType?: string;
  requiresVideo?: boolean;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimerButton({
  taskId,
  assigneeId,
  currentUserId,
  onChange,
  variant = "full",
  className = "",
  taskCode,
  taskTitle,
  taskType,
  requiresVideo,
}: Props) {
  const { runningTimer, loaded, busy, start, stop } = useTimer();
  const [now, setNow] = useState(Date.now());
  const [showStopModal, setShowStopModal] = useState(false);

  const isAssignee = currentUserId === assigneeId;
  const isRunningThisTask = runningTimer?.taskId === taskId;
  const isRunningOtherTask = !!runningTimer && !isRunningThisTask;
  const compact = variant === "compact";

  // Live tick 1s khi timer của task này đang chạy
  useEffect(() => {
    if (!isRunningThisTask) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunningThisTask]);

  async function handleStart(e?: React.MouseEvent) {
    e?.stopPropagation();
    const res = await start(taskId);
    if (res.ok) {
      onChange?.();
    } else if (res.runningTimer) {
      toast({
        variant: "warning",
        title: "Timer đang chạy",
        description: `Bạn đang chạy timer cho task ${res.runningTimer.task?.code ?? ""}. Dừng trước khi start task mới.`,
      });
    } else {
      toast({ variant: "error", title: "Không thể start timer", description: res.error });
    }
  }

  function handleStop(e?: React.MouseEvent) {
    e?.stopPropagation();
    setShowStopModal(true);
  }

  async function handleStopConfirm(payload: StopTimerPayload) {
    const res = await stop(taskId, payload as Record<string, unknown>);
    if (res.ok) {
      setShowStopModal(false);
      onChange?.();
      toast({ variant: "success", title: "Đã dừng timer" });
    } else {
      toast({ variant: "error", title: "Không thể stop timer", description: res.error });
    }
  }

  // Loading state
  if (!loaded) {
    if (compact) {
      return (
        <span className={`inline-flex items-center w-6 h-6 rounded-md bg-slate-100 text-slate-300 ${className}`}>
          <Loader2 className="w-3 h-3 animate-spin m-auto" />
        </span>
      );
    }
    return (
      <button
        disabled
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[12.5px] font-medium ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải
      </button>
    );
  }

  // Không phải assignee → ẩn ở compact, disabled ở full
  if (!isAssignee) {
    if (compact) return null;
    return (
      <button
        disabled
        title="Chỉ assignee mới có thể bấm giờ"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[12.5px] font-medium cursor-not-allowed ${className}`}
      >
        <Play className="w-3.5 h-3.5" /> Bắt đầu
      </button>
    );
  }

  // Đang chạy task này — STOP
  if (isRunningThisTask && runningTimer?.startTime) {
    const elapsedSec = Math.floor((now - new Date(runningTimer.startTime).getTime()) / 1000);
    const modal = showStopModal ? (
      <StopTimerModal
        taskCode={taskCode ?? runningTimer.task?.code ?? `#${taskId}`}
        taskTitle={taskTitle ?? runningTimer.task?.title ?? ""}
        taskType={taskType ?? runningTimer.task?.taskType}
        requiresVideo={requiresVideo}
        elapsedLabel={formatElapsed(elapsedSec)}
        onConfirm={handleStopConfirm}
        onCancel={() => setShowStopModal(false)}
      />
    ) : null;

    if (compact) {
      return (
        <>
          {modal}
          <button
            onClick={handleStop}
            disabled={busy}
            title={`Dừng (${formatElapsed(elapsedSec)})`}
            className={`inline-flex items-center justify-center w-auto h-6 px-1.5 gap-1 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white transition ${className}`}
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-white" />}
            <span className="text-[10px] font-semibold tabular-nums leading-none">{formatElapsed(elapsedSec)}</span>
          </button>
        </>
      );
    }
    return (
      <>
        {modal}
        <button
          onClick={handleStop}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-[12.5px] font-medium transition ${className}`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-white" />}
          Dừng ({formatElapsed(elapsedSec)})
        </button>
      </>
    );
  }

  // Đang chạy task khác → ẩn (compact) hoặc disabled (full)
  if (isRunningOtherTask) {
    if (compact) return null;
    return (
      <button
        disabled
        title={`Đang chạy timer cho task ${runningTimer?.task?.code ?? ""}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12.5px] font-medium cursor-not-allowed ${className}`}
      >
        <Play className="w-3.5 h-3.5" /> Đang chạy task khác
      </button>
    );
  }

  // Không có timer nào — START
  if (compact) {
    return (
      <button
        onClick={handleStart}
        disabled={busy}
        title="Bắt đầu timer"
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition disabled:opacity-50 ${className}`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
      </button>
    );
  }
  return (
    <button
      onClick={handleStart}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-[12.5px] font-medium transition ${className}`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
      Bắt đầu
    </button>
  );
}
