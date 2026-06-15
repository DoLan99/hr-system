"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { cn } from "@/lib/utils";
import { NAV_START_EVENT } from "./navigation-progress";
import { useLocale } from "@/lib/i18n/context";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import {
  LayoutDashboard,
  ListTodo,
  Clock4,
  Clock,
  Gauge,
  ClipboardList,
  Award,
  Layers,
  Inbox,
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
  SlidersHorizontal,
  Settings,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Crown,
  X,
  FolderOpen,
  ClipboardCheck,
  GitBranch as WorkflowIcon,
  Warehouse,
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
  const user = useCurrentUser();
  const { t } = useLocale();
  const role = user.role.name;

  return [
    {
      title: t("nav.overview"),
      items: [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: t("nav.work"),
      items: [
        { label: t("nav.tasks"), href: "/tasks", icon: ListTodo },
        { label: t("nav.timeLogs"), href: "/time-logs", icon: Clock4 },
        { label: t("nav.officeTime"), href: "/office-time", icon: Clock },
      ],
    },
    {
      title: t("nav.taskManagement"),
      items: [
        { label: t("nav.taskTemplates"), href: "/task-templates", icon: Layers },
        { label: t("nav.taskReviews"), href: "/task-reviews", icon: Inbox },
        {
          label: "Capacity",
          href: "/capacity",
          icon: Gauge,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"],
        },
        {
          label: "Đánh giá hiệu suất",
          href: "/performance-reviews",
          icon: ClipboardList,
        },
        {
          label: "Skill & Career",
          href: "/skills",
          icon: Award,
        },
      ],
    },
    {
      title: t("nav.salaryBenefits"),
      items: [
        {
          label: t("nav.summary"),
          href: "/summary",
          icon: BarChart3,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "ACCOUNTANT", "EMPLOYEE"],
        },
        {
          label: t("nav.payments"),
          href: "/payments",
          icon: CreditCard,
          roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        },
        { label: t("nav.leave"), href: "/leave", icon: CalendarOff },
      ],
    },
    {
      title: "Tài liệu",
      items: [
        { label: "Tài liệu", href: "/documents", icon: FolderOpen },
      ],
    },
    {
      title: "Kho",
      items: [
        { label: "Quản lý Kho", href: "/inventory", icon: Warehouse },
      ],
    },
    {
      title: "Phê duyệt",
      items: [
        { label: "Hộp duyệt", href: "/approvals", icon: ClipboardCheck },
        {
          label: "Cấu hình Workflow",
          href: "/workflows",
          icon: WorkflowIcon,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"],
        },
      ],
    },
    {
      title: t("nav.customers"),
      items: [
        { label: t("nav.customers"), href: "/customers", icon: Users },
        { label: t("nav.messages"), href: "/messages", icon: MessageSquare },
      ],
    },
    {
      title: t("nav.system"),
      items: [
        {
          label: t("nav.employees"),
          href: "/employees",
          icon: Users,
          roles: ["SUPER_ADMIN", "ADMIN", "HR"],
        },
        {
          label: t("nav.departments"),
          href: "/departments",
          icon: GitBranch,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
        },
        {
          label: t("nav.roles"),
          href: "/roles",
          icon: Shield,
          roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
          label: t("nav.vault"),
          href: "/vault",
          icon: Lock,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
        },
        { label: t("nav.workRules"), href: "/work-rules", icon: ScrollText },
        {
          label: t("nav.systemLabels"),
          href: "/system-labels",
          icon: SlidersHorizontal,
          roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
          label: "Activity Tracking",
          href: "/admin/activity",
          icon: Activity,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"],
        },
        {
          label: "Audit Log",
          href: "/admin/audit",
          icon: ShieldCheck,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"],
        },
        {
          label: "Anomaly Alerts",
          href: "/admin/anomalies",
          icon: ShieldAlert,
          roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"],
        },
        {
          label: "Billing",
          href: "/billing",
          icon: Crown,
          roles: ["SUPER_ADMIN", "ADMIN"],
        },
        { label: t("nav.settings"), href: "/settings", icon: Settings },
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
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Overlay backdrop — chỉ hiện ở mobile khi drawer mở */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "bg-slate-900 flex flex-col h-full flex-shrink-0 sidebar-scroll overflow-y-auto",
          // Desktop: tĩnh, hiện luôn
          "md:relative md:w-[220px] md:translate-x-0",
          // Mobile: fixed overlay, slide in/out
          "fixed top-0 left-0 z-40 w-[260px] transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white leading-tight truncate">HR System</p>
          <p className="text-[11px] text-slate-500 leading-tight">Hung IT/GM</p>
        </div>
        {/* Close button — chỉ hiện ở mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08]"
          aria-label="Đóng menu"
        >
          <X className="w-4 h-4" />
        </button>
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
    </>
  );
}
