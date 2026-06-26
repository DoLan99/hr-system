import { UserButton } from "@clerk/nextjs";
import { requireSuperAdmin } from "@/lib/super-admin";
import { SaNav } from "./_components/sa-nav";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const name = user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : email.split("@")[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--content)", fontFamily: "inherit" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: "var(--elev)",
        borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "rgba(245,158,11,.15)",
            border: "1px solid rgba(245,158,11,.3)", display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>System Admin</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Quản trị hệ thống</div>
          </div>
        </div>

        <SaNav />

        {/* User */}
        <div style={{ padding: "12px 14px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <UserButton afterSignOutUrl="/sign-in" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", color: "var(--text)" }}>
        {children}
      </main>
    </div>
  );
}
