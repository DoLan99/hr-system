import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Building2, LayoutDashboard, Shield } from "lucide-react";
import { requireSuperAdmin } from "@/lib/super-admin";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Super Admin</p>
            <p className="text-sm font-semibold">jobihome.vn</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link href="/super-admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Link>
          <Link href="/super-admin/orgs" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
            <Building2 className="w-4 h-4" /> Organizations
          </Link>
        </nav>

        <div className="px-3 py-3 border-t border-slate-700 flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="text-xs">
            <p className="font-medium">{user.firstName ?? user.username ?? "Admin"}</p>
            <p className="text-slate-400 truncate">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">{children}</div>
      </main>
    </div>
  );
}
