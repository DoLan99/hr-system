"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type PendingApproval = {
  id: string;
  stepOrder: number;
  dueAt: string | null;
  instance: {
    id: string;
    targetType: string;
    targetId: string;
    currentStep: number;
    template: { name: string; targetType: string };
    initiator: { id: number; fullName: string; department: string | null };
  };
  step: { name: string; stepOrder: number; slaHours: number | null };
};

const TARGET_LABEL: Record<string, string> = {
  LEAVE: "Nghỉ phép",
  DOCUMENT: "Tài liệu",
  PURCHASE: "Mua sắm",
  TIMELOG: "Chấm công",
  CUSTOM: "Khác",
};

function SlaStatus({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) return null;
  const diff = new Date(dueAt).getTime() - Date.now();
  const hours = Math.floor(diff / 3_600_000);
  if (diff < 0)
    return <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Quá hạn</span>;
  if (hours < 2)
    return <span className="text-xs text-orange-500 flex items-center gap-1"><Clock className="h-3 w-3" />Còn {hours}h</span>;
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {new Date(dueAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function ApprovalCard({ item }: { item: PendingApproval }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showReject, setShowReject] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflows/instances/${item.instance.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["approvals-pending"] });
      const msg = data.data?.status === "COMPLETED"
        ? "Đã duyệt — yêu cầu hoàn tất"
        : "Đã duyệt — chuyển bước tiếp theo";
      toast({ title: msg, variant: "success" });
    },
    onError: (e) => toast({ title: "Lỗi duyệt", description: String(e), variant: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflows/instances/${item.instance.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals-pending"] });
      toast({ title: "Đã từ chối yêu cầu" });
      setShowReject(false);
    },
    onError: (e) => toast({ title: "Lỗi từ chối", description: String(e), variant: "error" }),
  });

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg shrink-0">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.instance.template.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {TARGET_LABEL[item.instance.targetType]} · Bước {item.stepOrder}: {item.step.name}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {item.instance.initiator.fullName}
              </span>
              <SlaStatus dueAt={item.dueAt} />
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium">Phòng ban:</span> {item.instance.initiator.department ?? "—"}</p>
            <p><span className="font-medium">Loại:</span> {TARGET_LABEL[item.instance.targetType]} #{item.instance.targetId}</p>
            {item.instance.template.targetType === "LEAVE" && (
              <a
                href={`/leave`}
                className="text-blue-500 hover:underline inline-block mt-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem chi tiết đơn nghỉ →
              </a>
            )}
          </div>

          {!showReject ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); approveMutation.mutate(); }}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approveMutation.isPending ? "Đang xử lý..." : "Duyệt"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowReject(true); }}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-medium rounded-lg"
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
            </div>
          ) : (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                autoFocus
                placeholder="Lý do từ chối (bắt buộc)..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="w-full text-sm border rounded-lg p-2 resize-none bg-background focus:outline-none focus:ring-2 focus:ring-red-300"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => rejectComment.trim() && rejectMutation.mutate()}
                  disabled={!rejectComment.trim() || rejectMutation.isPending}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-60"
                >
                  {rejectMutation.isPending ? "Đang gửi..." : "Xác nhận từ chối"}
                </button>
                <button
                  onClick={() => { setShowReject(false); setRejectComment(""); }}
                  className="px-3 py-1.5 border text-sm rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApprovalInbox() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ data: PendingApproval[] }>({
    queryKey: ["approvals-pending"],
    queryFn: async () => {
      const res = await fetch("/api/workflows/pending");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Đang tải..." : `${items.length} yêu cầu chờ duyệt`}
        </p>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["approvals-pending"] })}
          className="p-1.5 rounded hover:bg-accent"
          title="Làm mới"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
          <p className="font-medium">Không có yêu cầu nào chờ duyệt</p>
          <p className="text-sm text-muted-foreground mt-1">Tất cả đã được xử lý</p>
        </div>
      ) : (
        items.map((item) => <ApprovalCard key={item.id} item={item} />)
      )}
    </div>
  );
}
