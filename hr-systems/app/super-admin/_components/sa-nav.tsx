"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/super-admin",
    exact: true,
    label: "Tổng quan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/super-admin/orgs",
    label: "Workspaces",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

export function SaNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV.map(n => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
            borderRadius: 9, textDecoration: "none", fontSize: 13, fontWeight: active ? 700 : 500,
            color: active ? "var(--text)" : "var(--text-2)",
            background: active ? "var(--accent-soft)" : "transparent",
            transition: "all .15s",
          }}>
            <span style={{ color: active ? "var(--accent)" : "var(--text-3)" }}>{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
