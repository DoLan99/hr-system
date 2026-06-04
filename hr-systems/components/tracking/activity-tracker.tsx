"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const TICK_MS = 5_000;        // bucket active/idle mỗi 5s
const IDLE_THRESHOLD_MS = 60_000; // 60s không thao tác → idle
const FLUSH_INTERVAL_MS = 60_000; // gửi heartbeat lên server mỗi 60s

interface PageViewBucket {
  path: string;
  durationMs: number;
}

interface HeartbeatPayload {
  activeSeconds: number;
  idleSeconds: number;
  pageViews: { path: string; durationSec: number }[];
}

/**
 * Tracker hoạt động của user (chạy ở client).
 *
 * - Bắt mouse/keyboard/scroll/click → đánh dấu "có hoạt động"
 * - Mỗi 5s phân loại tick này là active hay idle (dựa lastActivityAt + visibilityState)
 * - Mỗi 60s gom dữ liệu gửi POST /api/activity/heartbeat
 * - Khi đóng tab dùng sendBeacon để không mất data
 * - Track page view bằng usePathname (thời gian ở mỗi route)
 *
 * Mount 1 lần ở layout — không render UI.
 */
export function ActivityTracker() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const activeMs = useRef(0);
  const idleMs = useRef(0);
  const lastTickAt = useRef<number>(Date.now());
  const lastInputAt = useRef<number>(Date.now());

  // Buckets pageview: gộp theo path
  const pageBuckets = useRef<Map<string, number>>(new Map());
  const currentPathEnteredAt = useRef<number>(Date.now());
  const currentPath = useRef<string>(pathname);

  // Đẩy duration của path hiện tại vào bucket khi chuyển trang hoặc flush
  function commitCurrentPath(now: number) {
    const dur = now - currentPathEnteredAt.current;
    if (dur <= 0) return;
    const path = currentPath.current;
    pageBuckets.current.set(path, (pageBuckets.current.get(path) ?? 0) + dur);
    currentPathEnteredAt.current = now;
  }

  // 1) Bắt event input → đánh dấu lastInput
  useEffect(() => {
    const onInput = () => {
      lastInputAt.current = Date.now();
    };
    const opts = { passive: true } as const;
    window.addEventListener("mousemove", onInput, opts);
    window.addEventListener("keydown", onInput);
    window.addEventListener("click", onInput);
    window.addEventListener("scroll", onInput, opts);
    window.addEventListener("touchstart", onInput, opts);
    return () => {
      window.removeEventListener("mousemove", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("click", onInput);
      window.removeEventListener("scroll", onInput);
      window.removeEventListener("touchstart", onInput);
    };
  }, []);

  // 2) Tick mỗi 5s → phân loại active vs idle
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const tickSize = now - lastTickAt.current;
      lastTickAt.current = now;

      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      const recentlyActive = now - lastInputAt.current < IDLE_THRESHOLD_MS;

      if (isVisible && recentlyActive) {
        activeMs.current += tickSize;
      } else {
        idleMs.current += tickSize;
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // 3) Chuyển route → commit duration của route cũ, reset entered-at
  useEffect(() => {
    const now = Date.now();
    if (currentPath.current !== pathname) {
      commitCurrentPath(now);
      currentPath.current = pathname;
      currentPathEnteredAt.current = now;
    }
  }, [pathname]);

  // 4) Flush định kỳ + sendBeacon khi đóng tab
  useEffect(() => {
    function buildPayload(): HeartbeatPayload {
      const now = Date.now();
      commitCurrentPath(now);
      const payload: HeartbeatPayload = {
        activeSeconds: Math.round(activeMs.current / 1000),
        idleSeconds: Math.round(idleMs.current / 1000),
        pageViews: Array.from(pageBuckets.current.entries()).map(([path, ms]) => ({
          path,
          durationSec: Math.round(ms / 1000),
        })),
      };
      // reset state cục bộ
      activeMs.current = 0;
      idleMs.current = 0;
      pageBuckets.current.clear();
      return payload;
    }

    async function flush(viaBeacon = false) {
      const payload = buildPayload();
      // Nếu không có gì đáng gửi, skip
      if (
        payload.activeSeconds === 0 &&
        payload.idleSeconds === 0 &&
        payload.pageViews.length === 0
      ) {
        return;
      }
      const body = JSON.stringify(payload);
      try {
        if (viaBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          navigator.sendBeacon(
            "/api/activity/heartbeat",
            new Blob([body], { type: "application/json" }),
          );
        } else {
          await fetch("/api/activity/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          });
        }
      } catch {
        // không retry — phiên sau sẽ tiếp tục cộng dồn
      }
    }

    const interval = setInterval(() => flush(false), FLUSH_INTERVAL_MS);
    const onUnload = () => flush(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // flush lần cuối khi unmount (vd: logout)
      flush(false);
    };
  }, []);

  return null;
}
