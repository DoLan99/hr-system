# PRD-20 — Admin Panel & Super Admin

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Admin Panel (Workspace) / Super Admin (System) |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Workspace Admin, Super Admin |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Hệ thống HR SaaS có 2 tầng quản trị:
1. **Workspace Admin**: Quản lý cài đặt trong phạm vi công ty (workspace) của mình — thành viên, tích hợp, cấu hình chung.
2. **Super Admin**: Quản lý toàn bộ platform — tất cả workspaces, users, billing, system health.

Cần giao diện riêng biệt và phân quyền rõ ràng cho từng tầng.

### 1.2 Mục tiêu sản phẩm (Goals)

- Workspace Admin Panel: quản lý thành viên, role, tích hợp (Microsoft, Slack), cài đặt workspace.
- Super Admin Portal: xem tất cả workspaces, impersonate, monitor system health, manage billing.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Workspace Settings (members, roles, integrations, branding), Super Admin dashboard (workspaces, users, billing, system health, impersonation).

**Ngoài phạm vi:** White-labeling per workspace (v2), SSO SAML setup (v2), custom domain (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Workspace Admin** | Người thiết lập và duy trì cài đặt cho workspace công ty. | Quản lý thành viên, phân quyền, kết nối tích hợp từ 1 chỗ. | Hiện không có trang cài đặt tập trung → phải vào nhiều module khác nhau. |
| **Super Admin** | Nhân viên của platform (không phải khách hàng) quản lý toàn bộ hệ thống. | Xem tổng quan platform, can thiệp khi có issue, billing. | Không có tool để investigate workspace của customer khi họ báo bug. |

### 2.2 User Journey

**Super Admin — Điều tra workspace báo lỗi:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /super-admin/workspaces → Search tên workspace | Tìm workspace |
| 2 | Xem thông tin: Plan, số user, storage dùng, created date | Overview |
| 3 | [Impersonate Admin] → Đăng nhập vào workspace với quyền Admin | Xem từ góc nhìn khách hàng |
| 4 | Tái hiện lỗi → Xem audit log workspace đó | Debug |
| 5 | Exit impersonation → Ghi note vào workspace record | Lưu lại |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Workspace Admin Settings

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Quản lý thành viên | Xem, mời, xóa thành viên; thay đổi role trong workspace | Must Have | 5 |
| FR-002 | Gửi lời mời | Mời email vào workspace (tích hợp Clerk invitation) | Must Have | 5 |
| FR-003 | Quản lý Custom Roles | Tạo/sửa role tùy chỉnh (ngoài các role mặc định) | Should Have | 8 |
| FR-004 | Cài đặt chung | Tên workspace, logo, múi giờ mặc định, ngôn ngữ | Must Have | 3 |
| FR-005 | Tích hợp Microsoft | Connect/disconnect OneDrive, Teams; xem trạng thái token | Must Have | 8 |
| FR-006 | Cài đặt bảo mật | Require 2FA, session timeout, IP whitelist | Should Have | 8 |
| FR-007 | Holiday calendar | Định nghĩa ngày lễ riêng của công ty (dùng cho leave, workflow) | Must Have | 5 |
| FR-008 | Webhook settings | Cấu hình webhook nhận events từ hệ thống ra hệ thống ngoài | Nice to Have | 8 |

### 3.2 Super Admin Portal

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-009 | Danh sách workspaces | Xem tất cả workspaces: tên, plan, user count, status, created | Must Have | 5 |
| FR-010 | Workspace detail | Xem chi tiết 1 workspace: settings, users, billing history, audit | Must Have | 5 |
| FR-011 | Impersonation | Login vào workspace với quyền Admin để debug; full audit trail | Must Have | 13 |
| FR-012 | Disable/Enable workspace | Tắt workspace khi vi phạm TOS hoặc payment issue | Must Have | 5 |
| FR-013 | User management toàn platform | Tìm user theo email, xem workspace của họ, force logout | Should Have | 5 |
| FR-014 | System health | Xem metrics: active users, API latency, error rate, DB size | Should Have | 8 |
| FR-015 | Platform announcements | Gửi thông báo system-wide đến tất cả workspaces | Should Have | 5 |
| FR-016 | Feature flags | Bật/tắt feature per workspace hoặc globally | Should Have | 8 |

### 3.3 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Workspace Admin, tôi muốn mời thành viên mới vào workspace qua email, để họ có thể đăng nhập ngay mà không cần setup tài khoản riêng. | AC1: Form mời: Email*, Role (dropdown: Employee/Manager/HR Admin/Admin). AC2: Gửi → Clerk invitation email + in-app notification. AC3: Người được mời click link → tạo tài khoản Clerk → auto join workspace với role đã chọn. AC4: Invitation link hết hạn sau 7 ngày. AC5: Nếu email đã có tài khoản → join trực tiếp không cần tạo mới. | High |
| US-002 | Là Workspace Admin, tôi muốn cấu hình tích hợp Microsoft Teams, để nhân viên nhận notification quan trọng qua Teams. | AC1: Settings → Integrations → Microsoft Teams → [Connect]. AC2: OAuth flow với Microsoft 365. AC3: Sau connect: cấu hình event types muốn forward sang Teams (Leave approved, Task assigned...). AC4: Test connection: gửi test message vào Teams channel. AC5: [Disconnect] → revoke token + xóa webhook. | High |
| US-003 | Là Workspace Admin, tôi muốn định nghĩa calendar ngày lễ của công ty, để hệ thống tính leave và workflow đúng ngày làm việc. | AC1: Holiday Calendar: Tên ngày lễ, Ngày (datepicker), Recurring (hàng năm hay 1 lần). AC2: Xem calendar view với các ngày lễ được highlight. AC3: Ngày lễ ảnh hưởng: Leave calculation (không tính ngày lễ), Workflow timeout (không tính ngày lễ). AC4: Có thể import từ preset: "Lịch lễ Việt Nam 2026". | High |
| US-004 | Là Super Admin, tôi muốn impersonate vào workspace của khách hàng để debug lỗi họ báo cáo, mà không cần lấy mật khẩu của họ. | AC1: /super-admin/workspaces/:id → [Impersonate Admin]. AC2: Xác nhận dialog: "Hành động này sẽ được ghi log đầy đủ". AC3: Session mới với role Admin trong workspace đó; banner "IMPERSONATING as [workspace name]" luôn hiển thị. AC4: Mọi action trong session impersonation → audit log: { actor: superAdmin, impersonating: workspaceId }. AC5: [Exit Impersonation] → return về Super Admin portal. AC6: Impersonation tự động hết hạn sau 2 giờ. | High |
| US-005 | Là Super Admin, tôi muốn bật/tắt feature flags per workspace, để rollout tính năng mới dần dần. | AC1: /super-admin/feature-flags → danh sách features: tên, enabled globally (boolean), per-workspace overrides. AC2: Toggle globally → áp dụng cho tất cả workspaces chưa có override. AC3: Per-workspace: chọn workspace → enable/disable feature riêng. AC4: Feature check real-time: workspace bị disable feature → UI ẩn tính năng + API trả 403 với message rõ ràng. | Medium |
| US-006 | Là Super Admin, tôi muốn xem system health real-time, để phát hiện và xử lý vấn đề trước khi khách hàng báo. | AC1: Dashboard: Active users (realtime), API requests/min, Average response time (P50/P95/P99), Error rate %, DB connections, Pending jobs. AC2: Alert threshold: Error rate > 1% → đỏ, P95 > 2s → vàng. AC3: Drill down: xem 10 slowest API endpoints trong 1 giờ qua. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Security | Super Admin portal phải isolated khỏi workspace portal | N/A | Route /super-admin chỉ accessible bởi SUPER_ADMIN role |
| Audit | Impersonation có full audit trail | Coverage | 100% |
| Performance | Super Admin workspace list | Load time | < 2 giây với ≤ 10,000 workspaces |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Invite Member (Workspace Admin)**

```
/settings/members → [+ Mời thành viên]
→ Form: Email* | Role*
→ POST /api/invitations { email, role }
→ Clerk gửi invitation email
→ Người được mời click link → auth flow → join workspace
→ Workspace Admin thấy member mới trong danh sách
```

**Luồng 2: Impersonation (Super Admin)**

```
/super-admin/workspaces → Search/select workspace
→ [Impersonate Admin] → Confirm dialog (logged)
→ POST /api/super-admin/impersonate { workspaceId }
→ Server tạo temp session với elevated context
→ Redirect sang workspace dashboard với IMPERSONATION BANNER
→ Mọi action logged với superAdminId
→ [Exit] → revoke temp session → back to /super-admin
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Workspace Settings | `/settings` | Hub cài đặt workspace |
| Member Management | `/settings/members` | Quản lý thành viên, roles |
| Integrations | `/settings/integrations` | Kết nối Microsoft, webhook |
| Holiday Calendar | `/settings/holidays` | Ngày lễ công ty |
| Security Settings | `/settings/security` | 2FA, session timeout |
| Super Admin Home | `/super-admin` | Overview platform |
| All Workspaces | `/super-admin/workspaces` | Danh sách workspace |
| System Health | `/super-admin/health` | Metrics & alerts |
| Feature Flags | `/super-admin/feature-flags` | Toggle features |

---

## 6. Business Rules

### BR-001 — Super Admin không thể là Workspace Admin

Super Admin role tồn tại ở tầng platform, tách biệt hoàn toàn với workspace roles. 1 user không thể vừa là Super Admin vừa là Workspace Admin trong cùng system.

### BR-002 — Impersonation bắt buộc có audit log

Mọi session impersonation phải ghi audit log với: superAdminId, workspaceId, startedAt, endedAt, list actions thực hiện trong session. Log này immutable.

### BR-003 — Workspace bị DISABLED không thể login

Khi Super Admin disable workspace → tất cả users trong workspace không thể login. API trả 403 với message "Workspace tạm thời bị vô hiệu hóa. Liên hệ support."

### BR-004 — 2FA enforce theo workspace policy

Nếu Workspace Admin bật "Require 2FA" → tất cả users trong workspace phải setup 2FA trước khi truy cập. User chưa setup → redirect tới 2FA setup page sau khi login.

### BR-005 — Invitation link hết hạn sau 7 ngày

Invitation email có link với token expire sau 7 ngày. Sau 7 ngày → token invalid, phải gửi lại. Workspace Admin có thể resend invitation cho pending invites.

### BR-006 — Feature flag check phải cached

Feature flag check per request phải được cache (Redis/in-memory) để không query DB mỗi request. TTL cache: 5 phút. Khi Super Admin thay đổi flag → invalidate cache cho workspace đó.

---

## 7. Phân quyền

### 7.1 Workspace Admin Settings

| Hành động | Employee | Manager | HR Admin | Workspace Admin |
|---|---|---|---|---|
| Xem workspace settings | ❌ | ❌ | 👁 (giới hạn) | ✅ |
| Mời / Xóa thành viên | ❌ | ❌ | ✅ | ✅ |
| Thay đổi role của người khác | ❌ | ❌ | ❌ | ✅ |
| Cấu hình tích hợp | ❌ | ❌ | ❌ | ✅ |
| Cài đặt bảo mật | ❌ | ❌ | ❌ | ✅ |
| Quản lý holiday calendar | ❌ | ❌ | ✅ | ✅ |
| Đổi tên/logo workspace | ❌ | ❌ | ❌ | ✅ |

### 7.2 Super Admin Portal

| Hành động | Workspace Admin | Super Admin |
|---|---|---|
| Xem tất cả workspaces | ❌ | ✅ |
| Impersonate workspace | ❌ | ✅ |
| Disable/Enable workspace | ❌ | ✅ |
| Override subscription | ❌ | ✅ |
| Xem system health | ❌ | ✅ |
| Manage feature flags | ❌ | ✅ |
| Gửi platform announcements | ❌ | ✅ |
| Xem audit log toàn platform | ❌ | ✅ |
