"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { NAV_START_EVENT } from "./navigation-progress";
import { useLocale } from "@/lib/i18n/context";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import Image from "next/image";
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
  ChevronUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string;
  badgeVariant?: "default" | "warn";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useNavSections(): NavSection[] {
  const user = useCurrentUser();
  const { t } = useLocale();
  const role = user.role.name;

  const MANAGER_UP  = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];
  const ADMIN_UP    = ["SUPER_ADMIN", "ADMIN"];
  const HR_UP       = ["SUPER_ADMIN", "ADMIN", "HR"];
  const ALL_STAFF   = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR", "ACCOUNTANT", "EMPLOYEE"];

  const sections: NavSection[] = [
    {
      title: "Công việc",
      items: [
        { label: t("nav.tasks"),         href: "/tasks",               icon: ListTodo,      roles: ALL_STAFF },
        { label: "Sprint",               href: "/sprints",             icon: Zap,           roles: MANAGER_UP },
        { label: t("nav.timeLogs"),      href: "/time-logs",           icon: Clock4,        roles: ALL_STAFF },
        { label: t("nav.officeTime"),    href: "/office-time",         icon: Clock,         roles: ALL_STAFF },
        { label: t("nav.taskTemplates"), href: "/task-templates",      icon: Layers,        roles: MANAGER_UP },
        { label: t("nav.taskReviews"),   href: "/task-reviews",        icon: Inbox,         roles: MANAGER_UP },
        { label: "Capacity",             href: "/capacity",            icon: Gauge,         roles: MANAGER_UP },
        { label: "Đánh giá hiệu suất",  href: "/performance-reviews", icon: ClipboardList, roles: ALL_STAFF },
        { label: "Skill & Career",       href: "/skills",              icon: Award,         roles: ALL_STAFF },
      ],
    },
    {
      title: t("nav.salaryBenefits"),
      items: [
        { label: t("nav.summary"),  href: "/summary",  icon: BarChart3,   roles: ALL_STAFF },
        { label: t("nav.payments"), href: "/payments", icon: CreditCard,  roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { label: t("nav.leave"),    href: "/leave",    icon: CalendarOff, roles: ALL_STAFF },
      ],
    },
    {
      title: t("nav.customers"),
      items: [
        { label: t("nav.customers"), href: "/customers", icon: Users,         roles: [...MANAGER_UP, "ACCOUNTANT"] },
        { label: t("nav.messages"),  href: "/messages",  icon: MessageSquare, roles: ALL_STAFF, badge: user.messagesUnread > 0 ? String(user.messagesUnread) : undefined },
      ],
    },
    {
      title: "Phê duyệt",
      items: [
        { label: "Hộp duyệt",         href: "/approvals", icon: ClipboardCheck, roles: ALL_STAFF, badge: "4" },
        { label: "Cấu hình Workflow",  href: "/workflows", icon: WorkflowIcon,   roles: MANAGER_UP },
      ],
    },
    {
      title: "Tài nguyên",
      items: [
        { label: "Tài liệu",    href: "/documents", icon: FolderOpen, roles: ALL_STAFF },
        { label: "Quản lý Kho", href: "/inventory", icon: Warehouse,  roles: MANAGER_UP },
      ],
    },
    {
      title: t("nav.system"),
      items: [
        { label: t("nav.employees"),   href: "/employees",       icon: Users,           roles: [...HR_UP, "MANAGER"] },
        { label: t("nav.departments"), href: "/departments",     icon: GitBranch,        roles: MANAGER_UP },
        { label: t("nav.roles"),       href: "/roles",           icon: Shield,           roles: ADMIN_UP },
        { label: t("nav.vault"),       href: "/vault",           icon: Lock,             roles: MANAGER_UP },
        { label: t("nav.workRules"),   href: "/work-rules",      icon: ScrollText,       roles: ADMIN_UP },
        { label: t("nav.systemLabels"),href: "/system-labels",   icon: SlidersHorizontal,roles: ADMIN_UP },
        { label: "Activity Tracking",  href: "/admin/activity",  icon: Activity,         roles: [...MANAGER_UP, "HR"] },
        { label: "Audit Log",          href: "/admin/audit",     icon: ShieldCheck,      roles: [...MANAGER_UP, "HR"] },
        { label: "Anomaly Alerts",     href: "/admin/anomalies",          icon: ShieldAlert,      roles: [...MANAGER_UP, "HR"], badge: "1", badgeVariant: "warn" },
        { label: "Upgrade Requests",   href: "/admin/upgrade-requests",   icon: Crown,            roles: ["SUPER_ADMIN", "ADMIN"] },
        { label: "Billing",            href: "/billing",                  icon: Crown,            roles: ADMIN_UP },
        { label: t("nav.settings"),    href: "/settings",        icon: Settings,         roles: ADMIN_UP },
      ],
    },
  ];

  return sections.map((section) => ({
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
  const user = useCurrentUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useLocale();
  const dashboardLabel = t("nav.dashboard");

  const activeSectionTitle = navSections.find((section) =>
    section.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    )
  )?.title;

  const [openGroup, setOpenGroup] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // Always open the section that contains the active page
    if (activeSectionTitle) {
      setOpenGroup(activeSectionTitle);
      if (typeof window !== "undefined") window.localStorage.setItem("jh-nav-open", activeSectionTitle);
      return;
    }
    if (openGroup !== undefined) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("jh-nav-open") : null;
    setOpenGroup(stored ?? navSections[0]?.title ?? null);
  }, [activeSectionTitle]); // eslint-disable-line

  function toggleGroup(title: string) {
    setOpenGroup((prev) => {
      const next = prev === title ? null : title;
      if (typeof window !== "undefined") {
        if (next) window.localStorage.setItem("jh-nav-open", next);
        else window.localStorage.removeItem("jh-nav-open");
      }
      return next;
    });
  }

  const sideStyle: React.CSSProperties = {
    background: "var(--dash-side)",
    borderRight: "1px solid var(--dash-border)",
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        style={sideStyle}
        className={cn(
          "flex flex-col h-full flex-shrink-0 sidebar-scroll overflow-y-auto",
          "md:relative md:w-[264px] md:translate-x-0",
          "fixed top-0 left-0 z-40 w-[264px] transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--dash-border)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-[15px]"
            style={{ background: "var(--dash-accent)" }}
          >
            j
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: "var(--dash-text)" }} suppressHydrationWarning>{user.organization.name}</p>
            <p className="text-[11px] leading-tight truncate" style={{ color: "var(--dash-text-3)" }} suppressHydrationWarning>Workspace · {user.fullName}</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded"
            style={{ color: "var(--dash-text-3)" }}
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          {/* Pinned Dashboard */}
          {(() => {
            const isActive = pathname === "/dashboard";
            return (
              <Link
                href="/dashboard"
                onClick={() => {
                  setMobileOpen(false);
                  if (!isActive) window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
                }}
                className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors mb-3"
                style={
                  isActive
                    ? { background: "var(--dash-accent-soft)", color: "var(--dash-text)" }
                    : { color: "var(--dash-text-2)" }
                }
              >
                <LayoutDashboard
                  className="w-[15px] h-[15px] flex-shrink-0"
                  style={{ color: isActive ? "var(--dash-accent-2)" : "var(--dash-text-3)" }}
                />
                <span className="flex-1 leading-none">{dashboardLabel}</span>
              </Link>
            );
          })()}

          {navSections.map((section) => {
            if (section.items.length === 0) return null;
            const isOpen = openGroup === section.title;
            const hasBadge = section.items.some((item) => item.badge);

            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleGroup(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[10.5px] font-semibold uppercase tracking-widest transition-colors"
                  style={{ color: "var(--dash-text-3)" }}
                >
                  <span className="flex items-center gap-1.5">
                    {section.title}
                    {hasBadge && (
                      <span
                        className="w-[6px] h-[6px] rounded-full"
                        style={{ background: "var(--dash-accent-2)" }}
                      />
                    )}
                  </span>
                  <ChevronRight
                    className="w-3 h-3 transition-transform"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                </button>

                {isOpen && (
                  <ul className="space-y-0.5 mt-0.5 mb-2">
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
                              setMobileOpen(false);
                              if (!isActive) window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
                            }}
                            className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors group"
                            style={
                              isActive
                                ? {
                                    background: "var(--dash-accent-soft)",
                                    color: "var(--dash-text)",
                                  }
                                : { color: "var(--dash-text-2)" }
                            }
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                                (e.currentTarget as HTMLElement).style.color = "var(--dash-text)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--dash-text-2)";
                              }
                            }}
                          >
                            <Icon
                              className="w-[15px] h-[15px] flex-shrink-0"
                              style={{
                                color: isActive ? "var(--dash-accent-2)" : "var(--dash-text-3)",
                              }}
                            />
                            <span className="flex-1 leading-none">{item.label}</span>
                            {item.badge && (
                              <span
                                className="text-[10.5px] font-semibold rounded-full px-1.5 py-0.5 leading-none flex-shrink-0"
                                style={
                                  item.badgeVariant === "warn"
                                    ? { background: "var(--dash-danger)", color: "#fff" }
                                    : { background: "var(--dash-accent)", color: "#fff" }
                                }
                              >
                                {item.badge}
                              </span>
                            )}
                            {!item.badge && isActive && (
                              <ChevronRight className="w-3 h-3" style={{ color: "var(--dash-text-3)" }} />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div
          className="flex-shrink-0 px-3 py-3"
          style={{ borderTop: "1px solid var(--dash-border)" }}
        >
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors"
            style={{ color: "var(--dash-text-2)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={30}
                height={30}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white"
                style={{ background: "var(--dash-accent)" }}
              >
                {getInitials(user.fullName)}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: "var(--dash-text)" }} suppressHydrationWarning>{user.fullName}</p>
              <p className="text-[11px] leading-tight truncate" style={{ color: "var(--dash-text-3)" }} suppressHydrationWarning>{user.role.label}</p>
            </div>
            <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--dash-text-3)" }} />
          </button>
        </div>
      </aside>
    </>
  );
}
