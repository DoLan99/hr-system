"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, RefreshCw, Unlink } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type StatusData = {
  connected: boolean;
  account: {
    email: string | null;
    name: string | null;
    expiresAt: string;
    lastSync: string;
  } | null;
};

export function MicrosoftConnect({ isManager }: { isManager: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<StatusData>({
    queryKey: ["drive-status"],
    queryFn: async () => {
      const res = await fetch("/api/drive/status");
      if (!res.ok) throw new Error("Không lấy được trạng thái");
      return res.json();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/drive/disconnect", { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive-status"] });
      toast({ title: "Đã ngắt kết nối Microsoft 365" });
      setConfirming(false);
    },
    onError: (e) =>
      toast({ title: "Lỗi ngắt kết nối", description: String(e), variant: "error" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <RefreshCw className="h-4 w-4 animate-spin" /> Đang kiểm tra trạng thái...
      </div>
    );
  }

  const connected = data?.connected;

  return (
    <div className="border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Microsoft logo */}
          <div className="p-2 bg-muted rounded-lg">
            <svg className="h-6 w-6" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Microsoft 365</p>
            <p className="text-xs text-muted-foreground">OneDrive · SharePoint · Office Online</p>
          </div>
        </div>

        {connected ? (
          <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Đã kết nối
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            Chưa kết nối
          </div>
        )}
      </div>

      {connected && data?.account && (
        <div className="text-sm text-muted-foreground space-y-1 bg-muted/40 rounded-lg p-3">
          <p>
            <span className="font-medium text-foreground">{data.account.name}</span>
          </p>
          <p>{data.account.email}</p>
          <p>
            Token hết hạn:{" "}
            {new Date(data.account.expiresAt).toLocaleString("vi-VN")}
          </p>
        </div>
      )}

      {isManager && (
        <div className="flex items-center gap-2">
          {!connected ? (
            <a
              href="/api/auth/microsoft"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <svg className="h-4 w-4" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="white" fillOpacity="0.9" />
                <rect x="11" y="1" width="9" height="9" fill="white" fillOpacity="0.9" />
                <rect x="1" y="11" width="9" height="9" fill="white" fillOpacity="0.9" />
                <rect x="11" y="11" width="9" height="9" fill="white" fillOpacity="0.9" />
              </svg>
              Kết nối tài khoản Microsoft
            </a>
          ) : confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Xác nhận ngắt kết nối?</span>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md"
              >
                {disconnectMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 text-sm border rounded-md"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-accent text-muted-foreground"
            >
              <Unlink className="h-4 w-4" /> Ngắt kết nối
            </button>
          )}
        </div>
      )}
    </div>
  );
}
