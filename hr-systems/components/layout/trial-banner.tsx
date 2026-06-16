"use client";

import Link from "next/link";
import { AlertCircle, Crown } from "lucide-react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";

function daysUntilDate(iso: string | null): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const user = useCurrentUser();
  const { organization: org } = user;

  if (org.status === "SUSPENDED") {
    return (
      <div
        className="flex items-center justify-between gap-3 px-4 py-2 text-sm flex-shrink-0"
        style={{
          background: "rgba(255,107,107,0.12)",
          borderBottom: "1px solid rgba(255,107,107,0.25)",
        }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--dash-danger)" }} />
          <span style={{ color: "var(--dash-text)" }}>
            <strong>Workspace tạm khóa</strong>
            <span style={{ color: "var(--dash-text-2)" }}> — quá hạn thanh toán. Vui lòng liên hệ admin.</span>
          </span>
        </div>
        <Link
          href="/billing"
          className="px-3 py-1 text-xs font-semibold rounded-lg flex-shrink-0 hover:opacity-80"
          style={{ background: "var(--dash-danger)", color: "#fff" }}
        >
          Xem billing
        </Link>
      </div>
    );
  }

  if (org.status === "TRIAL") {
    const days = daysUntilDate(org.trialEndsAt);
    const trialDays = 14;
    const pct = Math.max(0, Math.min(100, ((trialDays - days) / trialDays) * 100));
    const isUrgent = days <= 3;
    return (
      <div
        className="flex items-center gap-3 px-4 py-2 text-sm flex-shrink-0"
        style={{
          background: isUrgent ? "rgba(255,107,107,0.10)" : "rgba(251,191,36,0.08)",
          borderBottom: `1px solid ${isUrgent ? "rgba(255,107,107,0.22)" : "rgba(251,191,36,0.18)"}`,
        }}
      >
        <Crown className="w-4 h-4 flex-shrink-0" style={{ color: isUrgent ? "var(--dash-danger)" : "var(--dash-warn)" }} />
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span style={{ color: "var(--dash-text)" }}>
            <strong>Dùng thử còn {days} ngày</strong>
            <span style={{ color: "var(--dash-text-2)" }}> — nâng cấp trước khi hết hạn.</span>
          </span>
          <div className="hidden sm:flex items-center gap-2 max-w-[160px] flex-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--dash-border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: isUrgent ? "var(--dash-danger)" : "var(--dash-warn)",
                }}
              />
            </div>
          </div>
        </div>
        <Link
          href="/billing"
          className="px-3 py-1 text-xs font-semibold rounded-lg flex-shrink-0 hover:opacity-80"
          style={{
            background: isUrgent ? "var(--dash-danger)" : "var(--dash-warn)",
            color: "#fff",
          }}
        >
          Nâng cấp ngay
        </Link>
      </div>
    );
  }

  if (org.memberCount >= org.seatLimit && org.plan !== "TEAM") {
    return (
      <div
        className="flex items-center justify-between gap-3 px-4 py-2 text-sm flex-shrink-0"
        style={{
          background: "rgba(251,146,60,0.10)",
          borderBottom: "1px solid rgba(251,146,60,0.22)",
        }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--dash-warn)" }} />
          <span style={{ color: "var(--dash-text)" }}>
            <strong>Đạt giới hạn {org.seatLimit} thành viên</strong>
            <span style={{ color: "var(--dash-text-2)" }}> — upgrade lên gói cao hơn để thêm.</span>
          </span>
        </div>
        <Link
          href="/billing"
          className="px-3 py-1 text-xs font-semibold rounded-lg flex-shrink-0 hover:opacity-80"
          style={{ background: "var(--dash-warn)", color: "#fff" }}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return null;
}
