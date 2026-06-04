"use client";

import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, User, ChevronDown, Menu } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { RunningTimerBadge } from "@/components/tracking/running-timer-badge";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  MANAGER:     "bg-indigo-100 text-indigo-700",
  TEAM_LEAD:   "bg-cyan-100 text-cyan-700",
  ACCOUNTANT:  "bg-amber-100 text-amber-700",
  HR:          "bg-pink-100 text-pink-700",
  EMPLOYEE:    "bg-slate-100 text-slate-600",
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

export function Topbar() {
  const user = useCurrentUser();
  const { signOut } = useClerk();
  const { t } = useLocale();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = usePageTitle();
  const { toggleMobile } = useSidebar();

  return (
    <header className="h-[52px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-5 flex-shrink-0">
      {/* Left — page title + mobile hamburger */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Mở menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h2 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 leading-none truncate">{pageTitle}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <RunningTimerBadge />
        <ThemeToggle />

        <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition">
          <Bell className="w-[17px] h-[17px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-tight">{user.fullName}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{user.role.label}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card-md py-1">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{user.email}</p>
                  <span className={`inline-block mt-1.5 text-[10.5px] font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role.name] ?? "bg-slate-100 text-slate-600"}`}>
                    {user.role.label}
                  </span>
                </div>
                <button className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {t("topbar.profile")}
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); router.push("/settings"); }}
                  className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> {t("topbar.settings")}
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 mt-1" />
                <button
                  onClick={() => signOut({ redirectUrl: "/sign-in" })}
                  className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition"
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
