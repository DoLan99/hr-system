"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export const NAV_START_EVENT = "nav:start";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [completing, setCompleting] = useState(false);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigatingRef = useRef(false);

  // Start animation on custom event from sidebar
  useEffect(() => {
    function handleStart() {
      navigatingRef.current = true;
      setCompleting(false);
      setVisible(true);
      setWidth(0);

      let w = 0;
      cancelAnimationFrame(rafRef.current);

      const tick = () => {
        if (!navigatingRef.current) return;
        w += (88 - w) * 0.04 + 0.5;
        if (w >= 88) w = 88;
        setWidth(w);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener(NAV_START_EVENT, handleStart);
    return () => window.removeEventListener(NAV_START_EVENT, handleStart);
  }, []);

  // Complete bar when pathname changes
  useEffect(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    cancelAnimationFrame(rafRef.current);

    setCompleting(true);
    setWidth(100);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
      setCompleting(false);
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{
        height: 3,
        width: `${width}%`,
        background: "linear-gradient(to right, #2563eb, #60a5fa)",
        boxShadow: "0 0 8px 2px rgba(59,130,246,0.45)",
        transition: completing
          ? "width 200ms ease-out, opacity 300ms 150ms ease"
          : "none",
        opacity: completing && width === 100 ? 0 : 1,
      }}
    />
  );
}
