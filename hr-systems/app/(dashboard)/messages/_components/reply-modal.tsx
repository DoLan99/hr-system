"use client";

import { useState } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

interface MessageItem {
  id: number;
  subject?: string | null;
  senderName?: string | null;
  senderContact?: string | null;
  channel?: string | null;
}

interface Props {
  message: MessageItem;
  onClose: () => void;
  onReplied?: () => void;
}

const CHANNEL_LABEL: Record<string, string> = {
  EMAIL: "Email",
  ZALO: "Zalo",
  OTHER: "Teams",
  CHAT: "Chat",
  SLACK: "Slack",
  PHONE: "Điện thoại",
};

export function ReplyModal({ message, onClose, onReplied }: Props) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${message.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi gửi");

      if (json.warning) {
        toast({ title: "Đã lưu nhưng gửi kênh thất bại", description: json.warning, variant: "warning" });
      } else {
        toast({ title: `Đã trả lời qua ${CHANNEL_LABEL[message.channel ?? ""] ?? message.channel ?? "hệ thống"}`, variant: "success" });
      }
      onReplied?.();
      onClose();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Lỗi", variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Trả lời</span>
            {message.channel && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                qua {CHANNEL_LABEL[message.channel] ?? message.channel}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Context */}
        <div className="px-4 pt-3 pb-1 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span className="font-medium">Từ:</span> {message.senderName || message.senderContact || "Không rõ"}
          {message.subject && <> &nbsp;·&nbsp; <span className="italic">{message.subject}</span></>}
        </div>

        {/* Body */}
        <div className="p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Nhập nội dung trả lời..."
            rows={5}
            className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 resize-none"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Huỷ
          </button>
          <button onClick={handleSend} disabled={sending || !body.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            <Send className="h-3.5 w-3.5" />
            {sending ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}
