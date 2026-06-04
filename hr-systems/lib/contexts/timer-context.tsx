"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface RunningTimer {
  id: number;
  taskId: number;
  startTime: string;
  task: {
    id: number;
    code: string;
    title: string;
    taskType?: string;
    estimatedTime?: number | null;
    actualTimeTotal?: number;
  };
}

interface TimerContextValue {
  runningTimer: RunningTimer | null;
  /** đã fetch xong lần đầu chưa — UI dùng để hiển thị skeleton */
  loaded: boolean;
  /** Đang start/stop — true khi có request đang bay */
  busy: boolean;
  /**
   * Start timer cho task. Trả về { ok, error?, runningTimer? }
   * runningTimer trong response chỉ set khi 409 (đang chạy task khác).
   */
  start: (taskId: number) => Promise<{ ok: boolean; error?: string; runningTimer?: RunningTimer }>;
  /** Stop timer hiện tại. Body tuỳ chọn (note, completionPctAfter, ...). */
  stop: (taskId: number, body?: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  /** Force refetch (vd: sau khi route handler khác làm thay đổi state) */
  refresh: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

const POLL_MS = 30_000;

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/time-logs/running", { cache: "no-store", signal: ac.signal });
      const json = await res.json();
      setRunningTimer(json.data ?? null);
    } catch (err) {
      // Ignore abort
      if ((err as Error)?.name !== "AbortError") {
        // không reset state — giữ giá trị cũ thay vì flicker
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  // Poll mỗi 30s
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [refresh]);

  const start = useCallback(
    async (taskId: number) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/start`, { method: "POST" });
        const json = await res.json();
        if (res.ok) {
          // Optimistic: dùng data trả về để cập nhật ngay
          if (json.data?.id) {
            setRunningTimer({
              id: json.data.id,
              taskId,
              startTime: json.data.startTime,
              task: { id: taskId, code: "", title: "" },
            });
          }
          // refetch để lấy đầy đủ task info (code/title)
          refresh();
          return { ok: true };
        }
        if (res.status === 409 && json.runningTimer) {
          setRunningTimer(json.runningTimer);
          return { ok: false, error: json.error, runningTimer: json.runningTimer };
        }
        return { ok: false, error: json.error ?? "Không thể start timer" };
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const stop = useCallback(
    async (taskId: number, body: Record<string, unknown> = {}) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (res.ok) {
          setRunningTimer(null);
          return { ok: true };
        }
        return { ok: false, error: json.error ?? "Không thể stop timer" };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <TimerContext.Provider value={{ runningTimer, loaded, busy, start, stop, refresh }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    // Cho phép dùng ngoài provider (vd: SSR/test) — trả về stub
    return {
      runningTimer: null,
      loaded: false,
      busy: false,
      start: async () => ({ ok: false, error: "TimerProvider not mounted" }),
      stop: async () => ({ ok: false, error: "TimerProvider not mounted" }),
      refresh: async () => {},
    };
  }
  return ctx;
}
