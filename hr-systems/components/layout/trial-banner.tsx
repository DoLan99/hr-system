"use client";

import Link from "next/link";
import { AlertCircle, Crown } from "lucide-react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";

function daysUntilDate(iso: string | null): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const user = useCurrentUser();
  const { organization: org } = user;

  if (org.status === "SUSPENDED") {
    return (
      <div className="bg-red-600 text-white text-sm px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Workspace tạm khóa</strong> — quá hạn thanh toán. Vui lòng liên hệ admin để khôi phục.</span>
        </div>
        <Link href="/billing" className="px-3 py-1 bg-white text-red-700 text-xs font-semibold rounded hover:bg-red-50">
          Xem billing
        </Link>
      </div>
    );
  }

  if (org.status === "TRIAL") {
    const days = daysUntilDate(org.trialEndsAt);
    const isUrgent = days <= 3;
    return (
      <div className={`text-sm px-4 py-2 flex items-center justify-between gap-3 ${isUrgent ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Trial còn {days} ngày</strong> — upgrade trước khi hết hạn để tiếp tục sử dụng.
          </span>
        </div>
        <Link href="/billing" className={`px-3 py-1 text-xs font-semibold rounded hover:bg-white/20 ${isUrgent ? "bg-white text-red-700" : "bg-white text-amber-700"}`}>
          Upgrade ngay
        </Link>
      </div>
    );
  }

  if (org.memberCount >= org.seatLimit && org.plan !== "TEAM") {
    return (
      <div className="bg-orange-500 text-white text-sm px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Đạt giới hạn {org.seatLimit} thành viên</strong> — upgrade lên gói cao hơn để thêm.</span>
        </div>
        <Link href="/billing" className="px-3 py-1 bg-white text-orange-700 text-xs font-semibold rounded hover:bg-orange-50">
          Upgrade
        </Link>
      </div>
    );
  }

  return null;
}
