"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { Mail, MessageSquare, Trash2, Settings2 } from "lucide-react";

type ChannelKey = "EMAIL" | "ZALO" | "OTHER"; // OTHER = Teams

interface ChannelCard {
  key: ChannelKey;
  label: string;
  icon: React.ReactNode;
  fields: { name: string; label: string; placeholder: string; type?: string }[];
}

const CHANNELS: ChannelCard[] = [
  {
    key: "OTHER",
    label: "Microsoft Teams",
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
    fields: [
      { name: "webhookUrl", label: "Incoming Webhook URL", placeholder: "https://xxx.webhook.office.com/..." },
      { name: "teamsOrgSecret", label: "Org Secret (dùng trong x-teams-org header)", placeholder: "secret-key" },
    ],
  },
  {
    key: "ZALO",
    label: "Zalo OA",
    icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
    fields: [
      { name: "oaId", label: "OA ID", placeholder: "0123456789" },
      { name: "accessToken", label: "Access Token", placeholder: "OA Access Token", type: "password" },
    ],
  },
  {
    key: "EMAIL",
    label: "Email (Microsoft 365)",
    icon: <Mail className="h-5 w-5 text-orange-500" />,
    fields: [
      { name: "fromEmail", label: "From Email", placeholder: "hr@company.com" },
    ],
  },
];

export function ChannelSetup() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ChannelKey | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/channels");
      const json = await res.json();
      return (json.data ?? []) as { channel: string; isActive: boolean }[];
    },
  });

  const connected = new Set(data?.filter((d) => d.isActive).map((d) => d.channel) ?? []);

  const save = useMutation({
    mutationFn: async ({ channel, config }: { channel: ChannelKey; config: Record<string, string> }) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, config, isActive: true }),
      });
      if (!res.ok) throw new Error("Lỗi lưu cấu hình");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Đã lưu cấu hình kênh", variant: "success" });
      qc.invalidateQueries({ queryKey: ["channels"] });
      setEditing(null);
      setForm({});
    },
    onError: (e: Error) => toast({ title: e.message, variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: async (channel: ChannelKey) => {
      const res = await fetch(`/api/channels?channel=${channel}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xoá kênh");
    },
    onSuccess: () => {
      toast({ title: "Đã ngắt kết nối kênh", variant: "success" });
      qc.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "error" }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Tích hợp kênh nhắn tin</h3>
        <p className="text-sm text-muted-foreground">Kết nối Teams, Zalo, Email để tổng hợp tin nhắn vào một hộp thư.</p>
      </div>

      {CHANNELS.map((ch) => {
        const isConnected = connected.has(ch.key);
        const isEditingThis = editing === ch.key;

        return (
          <div key={ch.key} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ch.icon}
                <span className="font-medium">{ch.label}</span>
                {isConnected && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã kết nối</span>
                )}
              </div>
              <div className="flex gap-2">
                {isConnected && !isEditingThis && (
                  <button
                    onClick={() => remove.mutate(ch.key)}
                    disabled={remove.isPending}
                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(isEditingThis ? null : ch.key);
                    setForm({});
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Settings2 className="h-4 w-4" />
                  {isEditingThis ? "Huỷ" : isConnected ? "Sửa" : "Cài đặt"}
                </button>
              </div>
            </div>

            {isEditingThis && (
              <form
                className="space-y-3 pt-2 border-t"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate({ channel: ch.key, config: form });
                }}
              >
                {ch.fields.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{f.label}</label>
                    <input
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
                    />
                  </div>
                ))}
                <button type="submit" disabled={save.isPending}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {save.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
