"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { SuggestionFormModal } from "./suggestion-form-modal";

type Suggestion = {
  id: number;
  date: string;
  proposedCode: string;
  proposedTitle: string;
  description: string;
  proposedTaskType: string;
  proposedEstimate: number;
  evidenceVideoLink: string;
  reasonNote: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  bonusTime: number;
  decisionNote: string | null;
  employee: { id: number; fullName: string };
  reviewedBy: { id: number; fullName: string } | null;
};

type Flag = {
  id: number;
  flaggedAt: string;
  currentEstimate: number;
  suggestedEstimate: number;
  sampleSize: number;
  status: "OPEN" | "ACCEPTED" | "DISMISSED";
  template: { id: number; code: string; title: string };
};

type Props = {
  initialSuggestions: Suggestion[];
  initialFlags: Flag[];
  isManager: boolean;
};

export function TaskReviewsClient({ initialSuggestions, initialFlags, isManager }: Props) {
  const { t } = useLocale();
  const pendingCount = initialSuggestions.filter(s => s.status === "PENDING").length;
  const [tab, setTab] = useState<"suggestions" | "flags">("suggestions");
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [flags, setFlags] = useState(initialFlags);
  const [createOpen, setCreateOpen] = useState(false);

  async function refreshSuggestions() {
    const res = await fetch("/api/template-suggestions").then((r) => r.json());
    setSuggestions(res.data ?? []);
  }

  async function refreshFlags() {
    const res = await fetch("/api/estimate-flags").then((r) => r.json());
    setFlags(res.data ?? []);
  }

  async function reviewSuggestion(id: number, action: "approve" | "reject") {
    const note = prompt(action === "approve" ? t("taskReviews.approveNote") : t("taskReviews.rejectReason"));
    if (action === "reject" && !note) return;
    await fetch(`/api/template-suggestions/${id}?action=${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionNote: note }),
    });
    refreshSuggestions();
  }

  async function reviewFlag(id: number, action: "accept" | "dismiss") {
    await fetch(`/api/estimate-flags/${id}?action=${action}`, { method: "PATCH" });
    refreshFlags();
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("taskReviews.title")}</h1>
        <p className="text-sm text-slate-500">{t("taskReviews.subtitle")} · {t("taskReviews.pendingCount", { count: pendingCount })}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("suggestions")}
          className={`px-4 py-2 text-sm rounded ${tab === "suggestions" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          {t("taskReviews.suggestions")} ({suggestions.length})
        </button>
        {isManager && (
          <button
            onClick={() => setTab("flags")}
            className={`px-4 py-2 text-sm rounded ${tab === "flags" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {t("taskReviews.estimateFlags")} ({flags.length})
          </button>
        )}
        {tab === "suggestions" && (
          <button
            onClick={() => setCreateOpen(true)}
            className="ml-auto px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            {t("taskReviews.proposeSuggestion")}
          </button>
        )}
      </div>

      {tab === "suggestions" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colCode")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colTitle")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colType")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colEstimate")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colProposedBy")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colStatus")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colVideo")}</th>
                <th className="px-3 py-2.5 font-medium text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                    {t("taskReviews.noSuggestions")}
                  </td>
                </tr>
              )}
              {suggestions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-xs">{s.proposedCode}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-800">{s.proposedTitle}</div>
                    <div className="text-xs text-slate-500 mt-0.5 max-w-md truncate">{s.reasonNote}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{t(`taskType.${s.proposedTaskType}`) || s.proposedTaskType}</td>
                  <td className="px-3 py-2.5">{s.proposedEstimate} {t("taskTemplates.minutes")}</td>
                  <td className="px-3 py-2.5 text-slate-600">{s.employee.fullName}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={s.status === "PENDING" ? "info" : s.status === "APPROVED" ? "success" : "danger"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <a href={s.evidenceVideoLink} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">
                      ▶
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isManager && s.status === "PENDING" && (
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => reviewSuggestion(s.id, "approve")}
                          className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                        >
                          {t("taskReviews.approveSuggestion")}
                        </button>
                        <button
                          onClick={() => reviewSuggestion(s.id, "reject")}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                        >
                          {t("taskReviews.rejectSuggestion")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "flags" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colTemplate")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colCurrentEstimate")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colSuggested")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colSampleSize")}</th>
                <th className="px-3 py-2.5 font-medium">{t("taskReviews.colFlagAt")}</th>
                <th className="px-3 py-2.5 font-medium text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    {t("taskReviews.noFlags")}
                  </td>
                </tr>
              )}
              {flags.map((f) => (
                <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-slate-500 mr-2">{f.template.code}</span>
                    {f.template.title}
                  </td>
                  <td className="px-3 py-2.5">{f.currentEstimate} {t("taskTemplates.minutes")}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{f.suggestedEstimate} {t("taskTemplates.minutes")}</td>
                  <td className="px-3 py-2.5 text-slate-600">{f.sampleSize}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(f.flaggedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => reviewFlag(f.id, "accept")}
                        className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                      >
                        {t("taskReviews.accept")}
                      </button>
                      <button
                        onClick={() => reviewFlag(f.id, "dismiss")}
                        className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                      >
                        {t("taskReviews.dismiss")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SuggestionFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refreshSuggestions();
        }}
      />
    </div>
  );
}
