"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_START_EVENT } from "./navigation-progress";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Clock,
  AlertCircle,
  Timer,
  BarChart3,
  CreditCard,
  CalendarOff,
  Users,
  MessageSquare,
  Lock,
  ScrollText,
  Building2,
  ChevronRight,
  GitBranch,
  Shield,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useNavSections(): NavSection[] {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";

  return [
    {
      title: "Tổng quan",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Công việc",
      items: [
        { label: "Work List", href: "/work-list", icon: ClipboardList },
        { label: "Work Report", href: "/work-report", icon: FileText },
        { label: "Office Time", href: "/office-time", icon: Clock },
      ],
    },
    {
      title: "Quản lý Task",
      items: [
        { label: "Missing Tasks", href: "/missing-tasks", icon: AlertCircle },
        { label: "Time Check", href: "/time-check", icon: Timer },
      ],
    },
    {
      title: "Lương & Phúc lợi",
      items: [
        {
          label: "Summary",
          href: "/summary",
          icon: BarChart3,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "ACCOUNTANT", "EMPLOYEE"],
        },
        {
          label: "Payments",
          href: "/payments",
          icon: CreditCard,
          roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        },
        { label: "Nghỉ Phép", href: "/leave", icon: CalendarOff },
      ],
    },
    {
      title: "Khách hàng",
      items: [
        { label: "Customers", href: "/customers", icon: Users },
        { label: "Messages", href: "/messages", icon: MessageSquare },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          label: "Nhân Viên",
          href: "/employees",
          icon: Users,
          roles: ["SUPER_ADMIN", "ADMIN", "HR"],
        },
        {
          label: "Phòng ban & Nhóm",
          href: "/departments",
          icon: GitBranch,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
        },
        {
          label: "Vai trò",
          href: "/roles",
          icon: Shield,
          roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
          label: "Passwords",
          href: "/vault",
          icon: Lock,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
        },
        { label: "Work Rules", href: "/work-rules", icon: ScrollText },
      ],
    },
  ].map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || item.roles.includes(role)
    ),
  }));
}

export function Sidebar() {
  const pathname = usePathname();
  const navSections = useNavSections();

  return (
    <aside className="w-[220px] bg-slate-900 flex flex-col h-full flex-shrink-0 sidebar-scroll overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight truncate">HR System</p>
          <p className="text-[11px] text-slate-500 leading-tight">Hung IT/GM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {navSections.map((section) =>
          section.items.length === 0 ? null : (
            <div key={section.title}>
              <p className="text-[10.5px] font-semibold text-slate-500 px-2 mb-1 uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (!isActive) window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors group",
                          isActive
                            ? "bg-white/[0.10] text-white font-medium"
                            : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-[15px] h-[15px] flex-shrink-0 transition-colors",
                            isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span className="flex-1 leading-none">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
      </nav>

      {/* Bottom divider */}
      <div className="h-4 border-t border-white/[0.06]" />
    </aside>
  );
}
