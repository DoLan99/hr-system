"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Square, Loader2 } from "lucide-react";
import { useTimer } from "@/lib/contexts/timer-context";
import { toast } from "@/lib/hooks/use-toast";
import { StopTimerModal, type StopTimerPayload } from "@/components/tracking/stop-timer-modal";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Badge hiển thị timer đang chạy của user. Mount trên topbar — tự ẩn
 * khi không có timer. Tick live 1s. Trạng thái timer được share qua
 * TimerContext (provider mount ở dashboard layout).
 */
export function RunningTimerBadge() {
  const { runningTimer, busy, stop } = useTimer();
  const [now, setNow] = useState(Date.now());
  const [showStopModal, setShowStopModal] = useState(false);

  useEffect(() => {
    if (!runningTimer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningTimer]);

  if (!runningTimer) return null;

  const elapsedSec = Math.floor((now - new Date(runningTimer.startTime).getTime()) / 1000);

  async function handleStopConfirm(payload: StopTimerPayload) {
    if (!runningTimer) return;
    const res = await stop(runningTimer.taskId, payload as Record<string, unknown>);
    if (res.ok) {
      setShowStopModal(false);
      toast({ variant: "success", title: "Đã dừng timer" });
    } else {
      toast({ variant: "error", title: "Không thể stop timer", description: res.error });
    }
  }

  return (
    <>
      {showStopModal && (
        <StopTimerModal
          taskCode={runningTimer.task?.code ?? `#${runningTimer.taskId}`}
          taskTitle={runningTimer.task?.title ?? ""}
          taskType={runningTimer.task?.taskType}
          elapsedLabel={formatElapsed(elapsedSec)}
          onConfirm={handleStopConfirm}
          onCancel={() => setShowStopModal(false)}
        />
      )}
      <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
        <Clock className="w-3.5 h-3.5 text-emerald-700" />
        <Link
          href={`/tasks?taskId=${runningTimer.taskId}`}
          title={runningTimer.task?.title}
          className="text-[12px] font-semibold text-emerald-800 tabular-nums hover:underline max-w-[140px] truncate"
        >
          {runningTimer.task?.code || `Task #${runningTimer.taskId}`} · {formatElapsed(elapsedSec)}
        </Link>
        <button
          onClick={() => setShowStopModal(true)}
          disabled={busy}
          title="Dừng timer"
          className="p-1 rounded text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-current" />}
        </button>
      </div>
    </>
  );
}
