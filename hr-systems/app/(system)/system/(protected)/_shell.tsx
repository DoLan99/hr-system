"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  user: { id: number; username: string; fullName: string; type: string };
  children: React.ReactNode;
}

const TYPE_LABEL: Record<string, string> = { SUPER_ADMIN: "Super Admin", SUPPORT: "Support", FINANCE: "Finance" };

const NAV = [
  { href: "/system/upgrade-requests", label: "Upgrade Requests", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/></svg>
  )},
  { href: "/system/plans", label: "Gói dịch vụ", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  ), superOnly: true },
  { href: "/system/users", label: "Admin Users", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ), superOnly: true },
];

export function SystemShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/system/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0a0f1e", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: "#111827",
        borderRight: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: "rgba(59,91,219,.25)",
              border: "1px solid rgba(59,91,219,.4)", display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#6582ff" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
                <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: ".82rem", fontWeight: 800, color: "#e8eeff" }}>System Admin</div>
              <div style={{ fontSize: ".7rem", color: "rgba(180,200,255,.4)" }}>jobihome.vn</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.filter(n => !n.superOnly || user.type === "SUPER_ADMIN").map(n => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                borderRadius: 9, textDecoration: "none", fontSize: ".86rem", fontWeight: active ? 700 : 500,
                color: active ? "#e8eeff" : "rgba(180,200,255,.55)",
                background: active ? "rgba(59,91,219,.2)" : "transparent",
                transition: "all .15s",
              }}>
                {n.icon}{n.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize: ".8rem", fontWeight: 600, color: "#e8eeff", marginBottom: 2 }}>{user.fullName}</div>
          <div style={{ fontSize: ".72rem", color: "rgba(180,200,255,.4)", marginBottom: 10 }}>{TYPE_LABEL[user.type] ?? user.type}</div>
          <button onClick={logout} disabled={loggingOut} style={{
            width: "100%", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.2)",
            borderRadius: 8, padding: "7px 0", fontSize: ".8rem", color: "#f87171",
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
          }}>
            {loggingOut ? "…" : "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28, overflowY: "auto", color: "#e8eeff" }}>
        {children}
      </main>
    </div>
  );
}
