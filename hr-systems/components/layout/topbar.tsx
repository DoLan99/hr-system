"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/work-list":     "Work List",
  "/work-report":   "Work Report",
  "/office-time":   "Office Time",
  "/task-library":  "Task Library",
  "/missing-tasks": "Missing Tasks",
  "/time-check":    "Time Check",
  "/summary":       "Tổng kết lương",
  "/payments":      "Payments",
  "/leave":         "Nghỉ phép",
  "/customers":     "Customers",
  "/messages":      "Messages",
  "/employees":     "Nhân viên",
  "/departments":   "Phòng ban & Nhóm",
  "/roles":         "Quản lý vai trò",
  "/vault":         "Password Vault",
  "/work-rules":    "Work Rules",
};

function getPageTitle(pathname: string): string {
  const key = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));
  return key ? PAGE_TITLES[key] : "HR System";
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  MANAGER:     "bg-indigo-100 text-indigo-700",
  TEAM_LEAD:   "bg-cyan-100 text-cyan-700",
  ACCOUNTANT:  "bg-amber-100 text-amber-700",
  HR:          "bg-pink-100 text-pink-700",
  EMPLOYEE:    "bg-slate-100 text-slate-600",
};

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-[52px] bg-white border-b border-slate-200 flex items-center justify-between px-5 flex-shrink-0">
      {/* Left — page title */}
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-slate-800 leading-none">{pageTitle}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
          <Bell className="w-[17px] h-[17px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user?.name ?? ""}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center">
                {getInitials(user?.name ?? "U")}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-medium text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user?.roleLabel}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-52 bg-white rounded-xl border border-slate-200 shadow-card-md py-1">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{user?.email}</p>
                  <span className={`inline-block mt-1.5 text-[10.5px] font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user?.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {user?.roleLabel}
                  </span>
                </div>
                <button className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Hồ sơ cá nhân
                </button>
                <button className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition">
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> Cài đặt
                </button>
                <div className="border-t border-slate-100 mt-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
