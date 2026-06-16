"use client";

import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, User, ChevronDown, Menu, Search, HelpCircle } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { RunningTimerBadge } from "@/components/tracking/running-timer-badge";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
  ADMIN:       { bg: "rgba(59,91,219,0.15)", text: "#818cf8" },
  MANAGER:     { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc" },
  TEAM_LEAD:   { bg: "rgba(34,211,238,0.12)", text: "#67e8f9" },
  ACCOUNTANT:  { bg: "rgba(251,191,36,0.15)", text: "#fcd34d" },
  HR:          { bg: "rgba(244,114,182,0.15)", text: "#f9a8d4" },
  EMPLOYEE:    { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
};

function usePageTitle(): string {
  const { t } = useLocale();
  const pathname = usePathname();

  const pageTitleKeys = [
    "/dashboard", "/tasks", "/time-logs", "/office-time",
    "/task-templates", "/task-reviews", "/capacity", "/performance-reviews", "/skills", "/summary", "/payments",
    "/leave", "/customers", "/messages", "/employees", "/departments",
    "/roles", "/vault", "/work-rules", "/system-labels", "/settings",
  ];
  const key = pageTitleKeys
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));

  return key ? t(`pageTitles.${key}`) : "HR System";
}

const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 8,
  color: "var(--dash-text-2)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  position: "relative",
  transition: "background 0.15s",
};

export function Topbar() {
  const user = useCurrentUser();
  const { signOut } = useClerk();
  const { t } = useLocale();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = usePageTitle();
  const { toggleMobile } = useSidebar();

  const roleBadge = ROLE_BADGE[user.role.name] ?? { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" };

  return (
    <header
      className="flex items-center gap-3 px-4 sm:px-5 flex-shrink-0"
      style={{
        height: 64,
        background: "var(--dash-side)",
        borderBottom: "1px solid var(--dash-border)",
      }}
    >
      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={toggleMobile}
          className="md:hidden"
          style={iconBtnStyle}
          aria-label="Mở menu"
        >
          <Menu className="w-[17px] h-[17px]" />
        </button>
        <h2
          className="text-[14px] font-semibold leading-none hidden sm:block"
          style={{ color: "var(--dash-text)" }}
        >
          {pageTitle}
        </h2>
      </div>

      {/* Center — search */}
      <div className="flex-1 max-w-md mx-auto">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] w-full"
          style={{
            background: "var(--dash-elev)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-text-3)",
          }}
        >
          <Search className="w-[14px] h-[14px] flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự, task, tài liệu…"
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--dash-text-3)] min-w-0"
            style={{ color: "var(--dash-text)" }}
          />
          <kbd
            className="text-[11px] px-1.5 py-0.5 rounded hidden sm:block"
            style={{
              background: "var(--dash-border)",
              color: "var(--dash-text-3)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <RunningTimerBadge />

        <ThemeToggle />

        <button
          style={iconBtnStyle}
          aria-label="Trợ giúp"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <HelpCircle className="w-[17px] h-[17px]" />
        </button>

        <button
          style={iconBtnStyle}
          aria-label="Thông báo"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <Bell className="w-[17px] h-[17px]" />
          <span
            className="absolute top-[6px] right-[6px] w-[6px] h-[6px] rounded-full"
            style={{ background: "var(--dash-danger)" }}
          />
        </button>

        {/* User dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors"
            style={{ color: "var(--dash-text)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center"
                style={{ background: "var(--dash-accent)" }}
              >
                {getInitials(user.fullName)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-medium leading-tight" style={{ color: "var(--dash-text)" }}>
                {user.fullName}
              </p>
              <p className="text-[11px] leading-tight" style={{ color: "var(--dash-text-3)" }}>
                {user.role.label}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--dash-text-3)" }} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute right-0 top-12 z-20 w-52 rounded-xl py-1 shadow-xl"
                style={{
                  background: "var(--dash-elev)",
                  border: "1px solid var(--dash-border)",
                }}
              >
                <div
                  className="px-3.5 py-2.5"
                  style={{ borderBottom: "1px solid var(--dash-border)" }}
                >
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--dash-text)" }}>
                    {user.fullName}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--dash-text-3)" }}>
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-1.5 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: roleBadge.bg, color: roleBadge.text }}
                  >
                    {user.role.label}
                  </span>
                </div>
                <DropdownItem icon={User} label={t("topbar.profile")} onClick={() => setDropdownOpen(false)} />
                <DropdownItem
                  icon={Settings}
                  label={t("topbar.settings")}
                  onClick={() => { setDropdownOpen(false); router.push("/settings"); }}
                />
                <div style={{ borderTop: "1px solid var(--dash-border)", margin: "4px 0" }} />
                <button
                  onClick={() => signOut({ redirectUrl: "/sign-in" })}
                  className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] transition-colors"
                  style={{ color: "var(--dash-danger)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev-2)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <LogOut className="w-3.5 h-3.5" /> {t("topbar.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] transition-colors"
      style={{ color: "var(--dash-text-2)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev-2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: "var(--dash-text-3)" }} /> {label}
    </button>
  );
}
