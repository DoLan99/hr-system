"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticated.current = true;
    }

    if (status === "unauthenticated" && wasAuthenticated.current) {
      router.replace("/login?expired=1");
    }
  }, [status, router]);

  return null;
}
