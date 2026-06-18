"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { MicrosoftConnect } from "./microsoft-connect";
import { ChannelSetup } from "./channel-setup";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

type Section = "workspace" | "appearance" | "notifications" | "integrations" | "danger";

const NAV: { id: Section; label: string; icon: React.ReactNode; danger?: boolean }[] = [
  {
    id: "workspace", label: "Workspace",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    id: "appearance", label: "Giao diện",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>,
  },
  {
    id: "notifications", label: "Thông báo",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  },
  {
    id: "integrations", label: "Tích hợp",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-3 3.5-6 3.5" strokeLinecap="round"/></svg>,
  },
  {
    id: "danger", label: "Danger Zone",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
    danger: true,
  },
];

function SRow({ title, sub, ctrl }: { title: string; sub?: string; ctrl: React.ReactNode }) {
  return (
    <div className="sr">
      <div className="sr-info">
        <div className="si-t">{title}</div>
        {sub && <div className="si-s">{sub}</div>}
      </div>
      <div className="sr-ctrl">{ctrl}</div>
    </div>
  );
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <label className="tog" onClick={() => setOn(v => !v)}>
      <input type="checkbox" readOnly checked={on} />
      <span className="tk" />
      <span className="th" />
    </label>
  );
}

function WorkspacePane({ locale, setLocale, isPending }: { locale: Locale; setLocale: (l: Locale) => void; isPending: boolean }) {
  return (
    <>
      <div className="ss">
        <div className="ss-head"><h3>Thông tin workspace</h3></div>
        <div className="ss-body">
          <SRow title="Tên workspace" sub="Hiển thị trong sidebar và email hệ thống"
            ctrl={<input className="sf-input" defaultValue="HR System" style={{ width: 260 }} />} />
          <SRow title="Múi giờ" sub="Áp dụng cho toàn bộ timestamps và báo cáo"
            ctrl={
              <select className="sf-select">
                <option>Asia/Ho_Chi_Minh</option>
                <option>Asia/Bangkok</option>
                <option>UTC</option>
              </select>
            } />
          <SRow title="Ngôn ngữ hệ thống" sub="Ngôn ngữ giao diện mặc định"
            ctrl={
              <div className="radio-group">
                {SUPPORTED_LOCALES.map(loc => (
                  <div key={loc}
                    className={`radio-item${locale === loc ? " on" : ""}`}
                    onClick={() => { if (!isPending) setLocale(loc); }}>
                    {loc === "vi" ? "🇻🇳" : "🇬🇧"} {LOCALE_LABELS[loc]}
                  </div>
                ))}
              </div>
            } />
        </div>
      </div>
      <div className="ss">
        <div className="ss-head"><h3>Cài đặt chung</h3></div>
        <div className="ss-body">
          <SRow title="Yêu cầu duyệt task trước khi Done" sub="Manager phải review trước khi task được đánh dấu hoàn thành" ctrl={<Toggle defaultChecked />} />
          <SRow title="Nhân viên tự xem lương của mình" sub="Cho phép Member truy cập payslip cá nhân" ctrl={<Toggle defaultChecked />} />
          <SRow title="Hiển thị KPI công khai" sub="Tất cả thành viên có thể xem điểm KPI của nhau" ctrl={<Toggle />} />
          <SRow title="Tự động gửi báo cáo tuần" sub="Email tóm tắt hoạt động gửi vào sáng thứ Hai" ctrl={<Toggle defaultChecked />} />
          <SRow title="Ngày bắt đầu tuần" sub="Ảnh hưởng đến Office Time và biểu đồ năng suất"
            ctrl={<select className="sf-select"><option>Thứ Hai</option><option>Chủ Nhật</option></select>} />
        </div>
      </div>
    </>
  );
}

function AppearancePane() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  return (
    <div className="ss">
      <div className="ss-head"><h3>Giao diện</h3></div>
      <div className="ss-body">
        <SRow title="Chế độ màu" sub="Chọn giao diện sáng hoặc tối"
          ctrl={
            <div className="radio-group">
              {(["light", "dark", "system"] as const).map(t => (
                <div key={t} className={`radio-item${theme === t ? " on" : ""}`} onClick={() => setTheme(t)}>
                  {t === "light" ? "☀️ Sáng" : t === "dark" ? "🌙 Tối" : "💻 Theo hệ thống"}
                </div>
              ))}
            </div>
          } />
        <SRow title="Font chữ" sub="Font sử dụng trong giao diện"
          ctrl={<select className="sf-select"><option>Be Vietnam Pro</option><option>Inter</option><option>System UI</option></select>} />
        <SRow title="Mật độ giao diện" sub="Compact thu gọn hàng, tăng thông tin hiển thị"
          ctrl={<select className="sf-select"><option>Comfortable (mặc định)</option><option>Compact</option><option>Spacious</option></select>} />
        <SRow title="Hoạt ảnh giao diện" sub="Tắt để giảm chuyển động nếu cần" ctrl={<Toggle defaultChecked />} />
        <SRow title="Hiển thị sidebar thu gọn" sub="Ẩn tên menu, chỉ hiện icon" ctrl={<Toggle />} />
      </div>
    </div>
  );
}

const NOTIF_EVENTS = [
  ["Được giao task mới", true, true, false],
  ["Task của tôi được duyệt", true, true, false],
  ["Hết hạn task hôm nay", true, true, true],
  ["Bình luận mới trên task", false, true, false],
  ["Đơn nghỉ phép được duyệt", true, true, false],
  ["Bảng lương sẵn sàng", true, true, true],
  ["Cảnh báo bất thường", true, true, true],
] as const;

function NotificationsPane() {
  return (
    <div className="ss">
      <div className="ss-head"><h3>Cài đặt thông báo</h3></div>
      <div className="ss-body">
        <div className="notif-grid">
          <div className="ng-header">
            <span>Sự kiện</span><span>Email</span><span>In-app</span><span>Push</span>
          </div>
          {NOTIF_EVENTS.map(([label, email, inapp, push]) => (
            <div key={label} className="ng-row">
              <span>{label}</span>
              <label><input type="checkbox" defaultChecked={email} /></label>
              <label><input type="checkbox" defaultChecked={inapp} /></label>
              <label><input type="checkbox" defaultChecked={push} /></label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsPane({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      <div className="ss">
        <div className="ss-head"><h3>Microsoft 365</h3></div>
        <div className="ss-body" style={{ padding: "14px 18px" }}>
          <MicrosoftConnect isManager />
        </div>
      </div>
      <div className="ss">
        <div className="ss-head"><h3>Kênh nhắn tin</h3></div>
        <div className="ss-body" style={{ padding: "14px 18px" }}>
          <ChannelSetup />
        </div>
      </div>
      {isAdmin && (
        <div className="ss">
          <div className="ss-head"><h3>Cấu hình hệ thống</h3></div>
          <div className="ss-body" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/settings/task-types" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 11, textDecoration: "none", transition: "border-color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(59,91,219,.1)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: ".72rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>TT</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--text)" }}>Loại Task</div>
                <div style={{ fontSize: ".76rem", color: "var(--text-3)", marginTop: 2 }}>Thêm, sửa, ẩn các loại task trong hệ thống</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 15, height: 15, color: "var(--text-3)" }}><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function DangerPane() {
  const actions = [
    { title: "Xóa tất cả task đã hoàn thành", sub: "Xóa vĩnh viễn tất cả task có trạng thái Done. Hành động này không thể hoàn tác.", label: "Xóa task Done" },
    { title: "Reset bảng lương kỳ hiện tại", sub: "Xóa toàn bộ dữ liệu tính lương của kỳ đang mở để tính lại từ đầu.", label: "Reset lương" },
    { title: "Xóa toàn bộ audit log", sub: "Xóa tất cả log lịch sử hệ thống. Chỉ dành cho mục đích tuân thủ pháp lý.", label: "Xóa audit log" },
  ];
  return (
    <div className="ss" style={{ borderColor: "rgba(239,68,68,.35)" }}>
      <div className="ss-head"><h3 style={{ color: "var(--danger)" }}>⚠ Danger Zone</h3></div>
      <div className="ss-body">
        {actions.map(a => (
          <div key={a.title} className="danger-action">
            <div>
              <div className="da-t">{a.title}</div>
              <div className="da-s">{a.sub}</div>
            </div>
            <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", color: "var(--danger)", borderColor: "rgba(239,68,68,.35)", whiteSpace: "nowrap" }}>{a.label}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const { locale, setLocale, isPending } = useLocale();
  const [active, setActive] = useState<Section>("workspace");

  return (
    <div className="st-layout">
      {/* Sidebar nav */}
      <div className="st-nav">
        <div className="st-nav-head">Cài đặt</div>
        {NAV.map(n => (
          <div key={n.id}
            className={`st-nav-item${active === n.id ? " active" : ""}${n.danger ? " danger" : ""}`}
            onClick={() => setActive(n.id)}>
            {n.icon}
            {n.label}
          </div>
        ))}
      </div>

      {/* Content panes */}
      <div className="st-main">
        <div className={`st-pane${active === "workspace" ? " on" : ""}`}>
          <WorkspacePane locale={locale} setLocale={setLocale} isPending={isPending} />
        </div>
        <div className={`st-pane${active === "appearance" ? " on" : ""}`}>
          <AppearancePane />
        </div>
        <div className={`st-pane${active === "notifications" ? " on" : ""}`}>
          <NotificationsPane />
        </div>
        <div className={`st-pane${active === "integrations" ? " on" : ""}`}>
          <IntegrationsPane isAdmin={isAdmin} />
        </div>
        <div className={`st-pane${active === "danger" ? " on" : ""}`}>
          <DangerPane />
        </div>
      </div>
    </div>
  );
}
