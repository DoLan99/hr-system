"use client";

import { Cloud, Lock } from "lucide-react";

export function MicrosoftConnectBanner({ isManager }: { isManager: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-xl text-center gap-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-full">
        <Cloud className="h-10 w-10 text-blue-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Kết nối Microsoft 365</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
          Kết nối tài khoản Microsoft 365 để quản lý tài liệu trực tiếp từ OneDrive và SharePoint ngay trong ứng dụng.
        </p>
      </div>

      {isManager ? (
        <a
          href="/api/auth/microsoft"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          Kết nối với Microsoft 365
        </a>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Chỉ Manager trở lên mới có thể kết nối. Hãy liên hệ quản lý của bạn.
        </div>
      )}

      <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
        <span>✓ OneDrive cá nhân & công ty</span>
        <span>✓ SharePoint Sites</span>
        <span>✓ Xem Word/Excel/PDF</span>
      </div>
    </div>
  );
}
