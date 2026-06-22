"use client";

import { useEffect, useState } from "react";
import { formatVnd, type PlanConfig, type PlanId } from "@/lib/pricing";

interface Props {
  currentPlan: PlanId;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";
  trialEndsAt: string | null;
  seatLimit: number;
  memberCount: number;
  orgSlug: string;
  orgName: string;
  isOwnerOrAdmin: boolean;
  plans: Record<PlanId, PlanConfig>;
  bankInfo: { bankName: string; accountNumber: string; accountHolder: string; branch: string };
  trialDaysLeft: number;
}

// ── Helpers ───────────────────────────────────────────────────

const ALL_FEATURES: { label: string; plans: PlanId[] }[] = [
  { label: "Tasks & Time tracking",     plans: ["FREE", "STARTER", "TEAM"] },
  { label: "Office Time & Chấm công",   plans: ["STARTER", "TEAM"] },
  { label: "Salary & Payments",         plans: ["STARTER", "TEAM"] },
  { label: "Performance Reviews",       plans: ["STARTER", "TEAM"] },
  { label: "Leave Management",          plans: ["STARTER", "TEAM"] },
  { label: "Phân quyền nâng cao",       plans: ["STARTER", "TEAM"] },
  { label: "Anomaly Detection",         plans: ["TEAM"] },
  { label: "Vault (Password manager)",  plans: ["TEAM"] },
  { label: "Activity Heatmap",          plans: ["TEAM"] },
  { label: "Audit log không giới hạn",  plans: ["TEAM"] },
];

const PLAN_PRICE_SHORT: Record<PlanId, string> = {
  FREE: "Miễn phí",
  STARTER: "299k",
  TEAM: "799k",
};

const PLAN_AUDIT_DAYS: Record<PlanId, string> = {
  FREE: "Audit 30 ngày",
  STARTER: "Audit 90 ngày",
  TEAM: "Audit không giới hạn",
};

// ── Main client ───────────────────────────────────────────────

export function BillingClient({
  currentPlan, status, trialEndsAt, seatLimit, memberCount,
  orgSlug, orgName, isOwnerOrAdmin, plans, bankInfo, trialDaysLeft,
}: Props) {
  const current = plans[currentPlan];

  const [upgradeTarget, setUpgradeTarget] = useState<PlanConfig | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);

  const trialEndDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("vi-VN") : null;
  const seatPercent = seatLimit > 0 ? (memberCount / seatLimit) * 100 : 0;
  const seatOver = memberCount > seatLimit;

  // Renewal alert priority: SUSPENDED > seat overflow > trial ending > active
  const renewal = (() => {
    if (status === "SUSPENDED") {
      return {
        kind: "danger" as const,
        title: "Workspace đã bị tạm khóa",
        sub: "Hết hạn thanh toán — liên hệ admin để khôi phục.",
      };
    }
    if (seatOver) {
      return {
        kind: "warn" as const,
        title: `Vượt giới hạn ${seatLimit} thành viên`,
        sub: `Workspace đang có ${memberCount} người. Nâng cấp để dùng tiếp đầy đủ tính năng.`,
      };
    }
    if (status === "TRIAL" && trialDaysLeft > 0) {
      return {
        kind: "warn" as const,
        title: `Còn ${trialDaysLeft} ngày dùng thử`,
        sub: trialEndDate ? `Gói trial kết thúc ${trialEndDate}. Upgrade trước khi hết hạn.` : "",
      };
    }
    if (current.priceVnd > 0) {
      return {
        kind: "info" as const,
        title: `Gói ${current.name} đang hoạt động`,
        sub: `${current.priceLabel} · ${seatLimit} thành viên tối đa`,
      };
    }
    return null;
  })();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Billing & Gói dịch vụ</h1>
          <p>Workspace <b>{orgName}</b> · slug <code style={{ fontFamily: "var(--font-mono)", padding: "1px 7px", background: "var(--content)", borderRadius: 5, fontSize: ".82rem" }}>{orgSlug}</code></p>
        </div>
        {isOwnerOrAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="abtn ghost" style={{ gap: 7 }} onClick={() => setShowBankModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Xem TKNH
            </button>
            {currentPlan !== "TEAM" && (
              <button className="abtn primary" style={{ gap: 7 }} onClick={() => setUpgradeTarget(currentPlan === "FREE" ? plans.STARTER : plans.TEAM)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M5 10l7-7 7 7M12 3v18"/></svg>
                Nâng cấp gói
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bl-layout">

        {/* LEFT — main */}
        <div className="bl-main">

          {/* Renewal alert */}
          {renewal && (
            <div className={`renew-alert ${renewal.kind}`}>
              <div className="ra-ico">
                {renewal.kind === "danger" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01"/></svg>
                ) : renewal.kind === "warn" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ra-t">{renewal.title}</div>
                {renewal.sub && <div className="ra-s">{renewal.sub}</div>}
              </div>
              {isOwnerOrAdmin && currentPlan !== "TEAM" && (renewal.kind === "warn" || renewal.kind === "danger") && (
                <button className="abtn primary" style={{ height: 32, fontSize: ".8rem", whiteSpace: "nowrap" }} onClick={() => setUpgradeTarget(plans.TEAM)}>
                  Nâng cấp ngay
                </button>
              )}
            </div>
          )}

          {/* Current plan */}
          <div className="bp">
            <div className="bp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2"/></svg>
                Gói đang dùng
              </h3>
              {isOwnerOrAdmin && currentPlan !== "TEAM" && (
                <button className="abtn ghost" style={{ height: 30, fontSize: ".8rem" }} onClick={() => setUpgradeTarget(plans.TEAM)}>Đổi gói</button>
              )}
            </div>
            <div className="bp-body">
              <div className="plan-hero">
                <div className="ph-badge">⚡ {current.name} Plan{status === "TRIAL" ? " · Trial" : ""}</div>
                <div className="ph-name">{current.name}</div>
                <div className="ph-price">{current.priceLabel} · Thanh toán hàng tháng</div>
                <div className="ph-badges">
                  <span className="ph-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/></svg>
                    {seatLimit} thành viên
                  </span>
                  <span className="ph-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                    {PLAN_AUDIT_DAYS[currentPlan]}
                  </span>
                  {current.priceVnd > 0 && (
                    <span className="ph-tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" fill="none"/><path d="M4 6l8 6 8-6"/></svg>
                      Hỗ trợ Email
                    </span>
                  )}
                </div>
              </div>

              <div className="usage-list">
                <div className="usage-item">
                  <div className="usage-top">
                    <span className="ulabel">Thành viên</span>
                    <span className="ucnt">
                      {memberCount} / {seatLimit}
                      {seatOver && <span style={{ color: "var(--danger)", fontWeight: 700, marginLeft: 6 }}>⚠ Vượt giới hạn</span>}
                    </span>
                  </div>
                  <div className="usage-track">
                    <div className="usage-fill" style={{ width: `${Math.min(120, Math.round(seatPercent))}%`, background: seatOver ? "#ef4444" : seatPercent >= 80 ? "var(--warn)" : "var(--accent)" }} />
                  </div>
                </div>
                <div className="usage-item">
                  <div className="usage-top">
                    <span className="ulabel">Lịch sử audit</span>
                    <span className="ucnt">{PLAN_AUDIT_DAYS[currentPlan]}</span>
                  </div>
                  <div className="usage-track">
                    <div className="usage-fill" style={{ width: "100%", background: "var(--accent)" }} />
                  </div>
                </div>
              </div>

              {seatOver && isOwnerOrAdmin && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--danger-soft)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, fontSize: ".84rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                  Workspace đang có <b>{memberCount} thành viên</b> nhưng gói {current.name} chỉ cho phép <b>{seatLimit}</b>.
                  <button className="abtn primary" style={{ height: 30, fontSize: ".78rem", whiteSpace: "nowrap", marginLeft: "auto" }} onClick={() => setUpgradeTarget(plans.TEAM)}>
                    Nâng cấp ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features in plan */}
          <div className="bp">
            <div className="bp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Tính năng trong gói
              </h3>
            </div>
            <div className="bp-body">
              <div className="feat-grid">
                {ALL_FEATURES.map((f) => {
                  const has = f.plans.includes(currentPlan);
                  return (
                    <div key={f.label} className={`feat-item ${has ? "yes" : "no"}`}>
                      {has ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      )}
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Invoice history (placeholder — manual bank transfer) */}
          <div className="bp">
            <div className="bp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/></svg>
                Lịch sử hóa đơn
              </h3>
            </div>
            <div className="bp-body" style={{ padding: 0 }}>
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-3)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: .3 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Chưa có hóa đơn nào</p>
                <p style={{ fontSize: ".82rem", lineHeight: 1.5 }}>
                  jobihome thu phí qua chuyển khoản ngân hàng — sau khi chuyển khoản,<br />
                  email cho <code style={{ fontFamily: "var(--font-mono)" }}>support@jobihome.vn</code> kèm biên lai để được kích hoạt.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — side */}
        <div className="bl-side">

          {/* Payment method */}
          <div className="bp">
            <div className="bp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                Thông tin chuyển khoản
              </h3>
            </div>
            <div className="bp-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="pm-card default">
                <div className="pm-ico">
                  <svg viewBox="0 0 60 40"><rect width="60" height="40" rx="4" fill="#1a5e1e"/><text x="6" y="28" fill="#fff" fontSize="12" fontWeight="700" fontFamily="monospace">{bankInfo.bankName.slice(0, 3).toUpperCase()}</text></svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="pm-bank">{bankInfo.bankName}</div>
                  <div className="pm-acct">{bankInfo.accountNumber} · {bankInfo.accountHolder}</div>
                </div>
                <span className="pm-default">Mặc định</span>
              </div>
              <button className="abtn ghost" style={{ width: "100%", height: 36, fontSize: ".82rem", gap: 7 }} onClick={() => setShowBankModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                Xem chi tiết
              </button>
            </div>
          </div>

          {/* Upgrade plans */}
          {isOwnerOrAdmin && currentPlan !== "TEAM" && (
            <div className="bp">
              <div className="bp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l7-7 7 7M12 3v18"/></svg>
                  Nâng cấp gói
                </h3>
              </div>
              <div className="bp-body">
                {seatOver && (
                  <p style={{ fontSize: ".82rem", color: "var(--text-2)", marginBottom: 12 }}>
                    Workspace có <b>{memberCount} người</b> — vượt giới hạn {current.name} ({seatLimit}). Nâng lên <b>Team</b> để mở khóa toàn bộ.
                  </p>
                )}
                <div className="plan-list">
                  {(["FREE", "STARTER", "TEAM"] as PlanId[]).map((id) => {
                    const p = plans[id];
                    const isCur = id === currentPlan;
                    return (
                      <div
                        key={id}
                        className={`plan-row${isCur ? " current" : ""}`}
                        onClick={() => !isCur && setUpgradeTarget(p)}
                        style={{ cursor: isCur ? "default" : "pointer" }}
                      >
                        <div className="plan-row-left">
                          <div className="pn" style={id === "TEAM" ? { color: "#059669" } : undefined}>{p.name}</div>
                          <div className="pd">≤ {p.seatLimit} thành viên</div>
                        </div>
                        <div className="plan-row-right">
                          <div className="pp">
                            {p.priceVnd === 0 ? "Miễn phí" : <>{PLAN_PRICE_SHORT[id]}<small>/th</small></>}
                          </div>
                          {isCur && <span className="plan-cur-badge">Hiện tại</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="abtn primary" style={{ width: "100%", height: 40, marginTop: 14, fontSize: ".88rem", gap: 7 }} onClick={() => setUpgradeTarget(plans.TEAM)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M5 10l7-7 7 7M12 3v18"/></svg>
                  Nâng cấp lên Team — {formatVnd(plans.TEAM.priceVnd)}/tháng
                </button>
                <p style={{ textAlign: "center", fontSize: ".74rem", color: "var(--text-3)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                  Thanh toán chuyển khoản · Xuất hóa đơn VAT
                </p>
              </div>
            </div>
          )}

          {/* Support */}
          <div className="bp">
            <div className="bp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Hỗ trợ thanh toán
              </h3>
            </div>
            <div className="bp-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: ".84rem", color: "var(--text-2)", lineHeight: 1.6 }}>
                Cần xuất hóa đơn VAT hoặc hỗ trợ chuyển khoản? Liên hệ đội ngũ billing.
              </div>
              <a href="mailto:support@jobihome.vn" className="abtn ghost" style={{ height: 36, fontSize: ".83rem", gap: 7 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7L22 6"/></svg>
                support@jobihome.vn
              </a>
              <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                Phản hồi trong vòng 2 giờ (giờ hành chính 8:00–18:00)
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {upgradeTarget && (
        <UpgradeModal
          current={current}
          target={upgradeTarget}
          orgSlug={orgSlug}
          bankInfo={bankInfo}
          onClose={() => setUpgradeTarget(null)}
        />
      )}
      {showBankModal && (
        <BankModal bankInfo={bankInfo} onClose={() => setShowBankModal(false)} />
      )}
    </>
  );
}

// ── Upgrade modal ─────────────────────────────────────────────

function UpgradeModal({
  current, target, orgSlug, bankInfo, onClose,
}: {
  current: PlanConfig;
  target: PlanConfig;
  orgSlug: string;
  bankInfo: Props["bankInfo"];
  onClose: () => void;
}) {
  const transferNote = `JOBIHOME ${orgSlug.toUpperCase()} ${target.id}`;
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="bm-modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bm-scrim" onClick={onClose} />
      <div className="bm-card" role="dialog">
        <h2>Nâng cấp lên {target.name}</h2>
        <button className="bm-close" onClick={onClose} aria-label="Đóng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 11, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem" }}>
            <span style={{ color: "var(--text-3)" }}>Gói hiện tại</span>
            <span>{current.name} · {current.priceLabel}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem" }}>
            <span style={{ color: "var(--text-3)" }}>Gói mới</span>
            <span style={{ fontWeight: 700, color: "var(--accent-ink)" }}>{target.name} · {target.priceLabel}</span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem" }}>
            <span style={{ color: "var(--text-3)" }}>Seat limit</span>
            <span style={{ fontWeight: 600 }}>{target.seatLimit} thành viên</span>
          </div>
        </div>

        <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft-2)", borderRadius: 11, padding: 14 }}>
          <p style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--accent-ink)", marginBottom: 10 }}>
            💳 Chuyển khoản theo thông tin sau
          </p>
          {[
            { label: "Ngân hàng",    value: bankInfo.bankName, key: "bank" },
            { label: "Số tài khoản", value: bankInfo.accountNumber, key: "account" },
            { label: "Chủ TK",       value: bankInfo.accountHolder, key: "holder" },
            { label: "Số tiền",      value: formatVnd(target.priceVnd), key: "amount" },
            { label: "Nội dung CK",  value: transferNote, key: "note" },
          ].map(({ label, value, key }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: ".84rem", padding: "4px 0" }}>
              <span style={{ color: "var(--text-3)", minWidth: 90 }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
                <code style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{value}</code>
                <button
                  onClick={() => copy(value, key)}
                  style={{ fontSize: ".7rem", padding: "2px 8px", borderRadius: 6, background: "var(--elev)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {copied === key ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: ".82rem", color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
          Sau khi chuyển khoản, email biên lai về <b>support@jobihome.vn</b> — admin sẽ kích hoạt gói trong vòng 24 giờ.
        </p>

        <div className="bm-foot">
          <button className="abtn ghost" onClick={onClose}>Đóng</button>
          <a href={`mailto:support@jobihome.vn?subject=Upgrade ${target.name} — ${orgSlug}&body=Workspace: ${orgSlug}%0AGói mới: ${target.name}%0ASố tiền: ${formatVnd(target.priceVnd)}%0ANội dung CK: ${transferNote}`} className="abtn primary" style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7L22 6"/></svg>
            Email support
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Bank info modal ───────────────────────────────────────────

function BankModal({ bankInfo, onClose }: { bankInfo: Props["bankInfo"]; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="bm-modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bm-scrim" onClick={onClose} />
      <div className="bm-card" role="dialog">
        <h2>Thông tin tài khoản ngân hàng</h2>
        <button className="bm-close" onClick={onClose} aria-label="Đóng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {[
          { label: "Ngân hàng",    value: bankInfo.bankName, key: "bank" },
          { label: "Số tài khoản", value: bankInfo.accountNumber, key: "account" },
          { label: "Chủ TK",       value: bankInfo.accountHolder, key: "holder" },
          { label: "Chi nhánh",    value: bankInfo.branch, key: "branch" },
        ].map(({ label, value, key }) => (
          <div key={key} className="bm-f">
            <label>{label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="text" readOnly value={value} style={{ flex: 1 }} />
              <button
                className="abtn ghost"
                style={{ height: 38, padding: "0 12px", fontSize: ".8rem" }}
                onClick={() => copy(value, key)}
              >
                {copied === key ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--accent-soft)", borderRadius: 9, fontSize: ".82rem", color: "var(--accent-ink)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/></svg>
          Thông tin này dùng cho thanh toán dịch vụ. Vui lòng ghi đúng nội dung CK khi chuyển khoản.
        </div>

        <div className="bm-foot">
          <button className="abtn ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Style ─────────────────────────────────────────────────────

const STYLE = `
.bl-layout{display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start}
.bl-main{display:flex;flex-direction:column;gap:16px;min-width:0}
.bl-side{display:flex;flex-direction:column;gap:16px;position:sticky;top:20px}

.bp{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.bp-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}
.bp-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--text);margin:0}
.bp-head h3 svg{width:15px;height:15px;color:var(--accent-ink)}
.bp-body{padding:18px}

.plan-hero{background:linear-gradient(135deg,var(--accent),#1d4ed8);border-radius:var(--r-lg);padding:24px;color:#fff;position:relative;overflow:hidden;margin-bottom:16px}
.plan-hero::after{content:"";position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
.ph-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 11px;border-radius:99px;background:rgba(255,255,255,.18);color:#fff;margin-bottom:14px}
.ph-name{font-size:1.6rem;font-weight:800;letter-spacing:-.03em;margin-bottom:4px}
.ph-price{font-size:1rem;opacity:.85;margin-bottom:16px}
.ph-badges{display:flex;gap:8px;flex-wrap:wrap}
.ph-tag{display:inline-flex;align-items:center;gap:5px;font-size:.76rem;font-weight:500;padding:4px 11px;border-radius:99px;background:rgba(255,255,255,.14);color:#fff}
.ph-tag svg{width:12px;height:12px}

.usage-list{display:flex;flex-direction:column;gap:14px}
.usage-top{display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:6px}
.usage-top .ulabel{font-weight:600;color:var(--text)}
.usage-top .ucnt{font-family:var(--font-mono);font-size:.78rem;color:var(--text-3)}
.usage-track{height:8px;border-radius:99px;background:var(--border);overflow:hidden}
.usage-fill{height:100%;border-radius:99px;transition:width .6s var(--ease)}

.feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.feat-item{display:flex;align-items:center;gap:8px;font-size:.84rem}
.feat-item svg{width:14px;height:14px;flex-shrink:0}
.feat-item.yes{color:var(--text)}.feat-item.yes svg{color:var(--ok)}
.feat-item.no{color:var(--text-3)}.feat-item.no svg{color:var(--text-3)}

.pm-card{display:flex;align-items:center;gap:13px;padding:14px;background:var(--content);border:1.5px solid var(--border-2);border-radius:12px;transition:border-color .15s}
.pm-card.default{border-color:var(--accent);background:var(--accent-soft)}
.pm-ico{width:44px;height:32px;border-radius:7px;display:grid;place-items:center;background:var(--elev);border:1px solid var(--border);flex-shrink:0}
.pm-bank{font-weight:700;font-size:.88rem;color:var(--text)}
.pm-acct{font-family:var(--font-mono);font-size:.72rem;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-default{margin-left:auto;font-family:var(--font-mono);font-size:.66rem;font-weight:600;padding:2px 8px;border-radius:99px;background:var(--accent-soft-2);color:var(--accent-ink);white-space:nowrap}

.plan-list{display:flex;flex-direction:column;gap:8px}
.plan-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--content);border:1.5px solid var(--border);border-radius:11px;transition:border-color .15s,transform .15s;min-width:0}
.plan-row:not(.current):hover{border-color:var(--accent);transform:translateY(-1px)}
.plan-row.current{border-color:var(--accent);background:var(--accent-soft)}
.plan-row-left{flex:1;min-width:0}
.plan-row-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.plan-row .pn{font-family:var(--font-mono);font-weight:700;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--accent-ink);line-height:1}
.plan-row .pd{font-size:.72rem;color:var(--text-3);margin-top:5px}
.plan-row .pp{font-size:1rem;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1;white-space:nowrap}
.plan-row .pp small{font-size:.7rem;font-weight:500;color:var(--text-3);margin-left:2px}
.plan-cur-badge{font-family:var(--font-mono);font-size:.6rem;font-weight:700;padding:3px 9px;border-radius:99px;background:var(--accent);color:#fff;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}

.renew-alert{display:flex;align-items:center;gap:12px;padding:14px;border-radius:11px;border:1px solid}
.renew-alert.warn{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25)}
.renew-alert.warn .ra-ico{background:rgba(251,191,36,.15);color:#f59e0b}
.renew-alert.danger{background:var(--danger-soft);border-color:rgba(239,68,68,.25)}
.renew-alert.danger .ra-ico{background:rgba(239,68,68,.15);color:#ef4444}
.renew-alert.info{background:var(--accent-soft);border-color:var(--accent-soft-2)}
.renew-alert.info .ra-ico{background:var(--accent-soft-2);color:var(--accent-ink)}
.renew-alert .ra-ico{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.renew-alert .ra-ico svg{width:17px;height:17px}
.renew-alert .ra-t{font-weight:600;font-size:.88rem;color:var(--text)}
.renew-alert .ra-s{font-size:.78rem;color:var(--text-2);margin-top:2px;line-height:1.4}

.bm-modal{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s}
.bm-modal.open{opacity:1;pointer-events:auto}
.bm-scrim{position:absolute;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px)}
.bm-card{position:relative;z-index:1;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:480px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 80px rgba(0,0,0,.6);max-height:92vh;overflow-y:auto}
.bm-card h2{font-size:1rem;font-weight:800;color:var(--text);margin:0}
.bm-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;font-family:inherit}
.bm-close:hover{background:var(--content);color:var(--text)}
.bm-f{display:flex;flex-direction:column;gap:5px}
.bm-f label{font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)}
.bm-f input{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;font-family:var(--font-mono);font-size:.88rem;color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.bm-f input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.bm-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:6px;border-top:1px solid var(--border)}

@media(max-width:960px){.bl-layout{grid-template-columns:1fr}.bl-side{position:static}.feat-grid{grid-template-columns:1fr}}
`;
