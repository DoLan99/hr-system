# Phân quyền & Truy cập Hệ thống

> Cập nhật: 2026-06-25

---

## Tổng quan — 4 nhóm người dùng

| Nhóm | Vào từ đâu | Auth | Ghi chú |
|------|-----------|------|---------|
| **Khách truy cập** | `jobihome.vn` | Không cần | Landing page, pricing |
| **Nhân viên / Khách hàng workspace** | `{slug}.jobihome.vn/sign-in` | Clerk (email/SSO) | Đa thuê bao (multitenant) |
| **System Admin** | `jobihome.vn/system/login` | Username + Password riêng | Quản lý hệ thống nội bộ |
| **Super Admin** | `jobihome.vn/sign-in` → Clerk | Clerk (ID trong env) | Toàn quyền tất cả workspace |

---

## 1. Landing Page / Marketing

**URL**: `jobihome.vn` (không có subdomain)

**Ai quản lý nội dung**: Không có CMS tích hợp — nội dung hardcode trong code.  
Để thay đổi phải sửa source code trong `app/(marketing)/`.

**Trang public**:
- `/` — Trang chủ
- `/pricing` — Bảng giá
- `/tinh-nang` — Tính năng
- `/so-sanh` — So sánh gói
- `/about` — Giới thiệu
- `/contact` — Liên hệ
- `/dat-lich-demo` — Đặt lịch demo
- `/terms`, `/privacy` — Điều khoản

**Không cần đăng nhập.**

---

## 2. Khách hàng đăng ký dùng gói (Workspace User)

### Đăng ký mới

1. Vào `jobihome.vn/sign-up` → tạo tài khoản Clerk (email/Google/GitHub)
2. Được redirect sang `/onboarding` → điền tên tổ chức, họ tên
3. Hệ thống tạo **Organization** + **Employee** đầu tiên (role = ADMIN/OWNER)
4. Redirect sang `{slug}.jobihome.vn/dashboard`

### Đăng nhập lại

URL: `{slug}.jobihome.vn/sign-in`

Ví dụ: `ssoft.jobihome.vn/sign-in`

### Phân quyền trong workspace

Role được gán qua `Employee.roleId` → `Role.name`. Vai trò phổ biến:

| Role name | Quyền trong sidebar |
|-----------|-------------------|
| `SUPER_ADMIN` / `ADMIN` | Toàn bộ tính năng |
| `MANAGER` / `TEAM_LEAD` | Hầu hết — trừ Billing, Settings hệ thống |
| `HR` | Nhân sự, Audit, Activity |
| `ACCOUNTANT` | Khách hàng, Payments, Summary |
| `EMPLOYEE` | Tasks, Time logs, Leave, Summary |

### Tính năng theo role

<details>
<summary><strong>ADMIN / SUPER_ADMIN</strong> — Toàn quyền workspace</summary>

**Công việc**: Tasks, Sprint, Time Logs, Office Time, Task Templates, Task Reviews, Capacity, Performance Reviews, Skills  
**Salary & Benefits**: Summary, Payments, Leave  
**Customers**: Customers list, Messages  
**Phê duyệt**: Approval Box, Workflow Config  
**Tài nguyên**: Documents (hệ thống + OneDrive), Inventory  
**System**:
- Employees (quản lý nhân viên)
- Departments
- Roles (tạo/sửa vai trò)
- Vault (lưu mật khẩu khách)
- Work Rules
- System Labels
- Activity Tracking (`/admin/activity`)
- Audit Log (`/admin/audit`)
- Anomaly Alerts (`/admin/anomalies`)
- Upgrade Requests (`/admin/upgrade-requests`)
- Billing (`/billing`)
- Settings (`/settings`) — kết nối Microsoft 365, kênh nhắn tin

</details>

<details>
<summary><strong>MANAGER / TEAM_LEAD</strong></summary>

Như ADMIN trừ: Roles, Work Rules, System Labels, Billing, Settings hệ thống

</details>

<details>
<summary><strong>HR</strong></summary>

Employees, Departments, Tasks, Time Logs, Office Time, Leave, Activity, Audit Log, Documents, Messages

</details>

<details>
<summary><strong>ACCOUNTANT</strong></summary>

Customers, Payments, Summary, Messages, Tasks, Time Logs

</details>

<details>
<summary><strong>EMPLOYEE</strong></summary>

Tasks, Time Logs, Office Time, Summary, Leave, Messages, Performance Reviews, Skills, Documents, Approvals

</details>

---

## 3. System Admin — Quản lý nội bộ hệ thống

**URL đăng nhập**: `jobihome.vn/system/login`

**Tài khoản**: Username + Password — lưu trong bảng `AdminUser` (database), **không liên quan đến Clerk**.

**Session**: Cookie `admin_session` (HMAC, hết hạn sau 30 ngày)

**Tạo tài khoản**: Phải tạo thủ công qua trang `/system/users` (cần SUPER_ADMIN type) hoặc seed database trực tiếp.

### Phân loại Admin

| Type | Quyền |
|------|-------|
| `SUPER_ADMIN` | Toàn quyền system admin — quản lý AdminUser, Plan, Upgrade Requests |
| `SUPPORT` | Duyệt/từ chối Upgrade Requests, xem thông tin org |
| `FINANCE` | Xem báo cáo tài chính |

### Trang System Admin

| URL | Mô tả | Yêu cầu |
|-----|-------|---------|
| `/system/login` | Đăng nhập | Public |
| `/system/upgrade-requests` | Duyệt yêu cầu nâng cấp gói | Tất cả Admin types |
| `/system/plans` | Cấu hình tên/giá/tính năng gói | SUPER_ADMIN only |
| `/system/users` | Quản lý tài khoản AdminUser | SUPER_ADMIN only |

### Luồng duyệt Upgrade Request

1. Khách hàng workspace vào `/admin/upgrade-requests` → gửi yêu cầu nâng cấp + nội dung chuyển khoản
2. System Admin vào `/system/upgrade-requests` → thấy request mới
3. Nhấn **Duyệt** (hoặc Từ chối) → hệ thống tự đổi plan + status cho org
4. Khách hàng nhận email thông báo (nếu đã cấu hình Resend)

---

## 4. Super Admin — Quản trị toàn bộ nền tảng

**URL**: `jobihome.vn/super-admin`

**Tài khoản**: Tài khoản Clerk thông thường — nhưng **Clerk User ID phải có trong biến môi trường**:

```env
SUPER_ADMIN_CLERK_USER_IDS="user_abc123,user_xyz456"
```

Nếu Clerk ID không có trong danh sách → redirect về `/dashboard?error=super-admin-only`.

**Đăng nhập**: Dùng Clerk giống workspace user — `jobihome.vn/sign-in`.

### Trang Super Admin

| URL | Mô tả |
|-----|-------|
| `/super-admin` | Dashboard tổng quan: tổng org, nhân viên, tasks, MRR, breakdown theo plan/status |
| `/super-admin/orgs` | Danh sách tất cả workspace — search, filter theo plan/status, sort |
| `/super-admin/orgs/[id]` | Quản lý chi tiết 1 workspace |

### Tính năng quản lý workspace (tại `/super-admin/orgs/[id]`)

- **⚡ Quick activate**: Chọn gói → kích hoạt ngay khi khách đã chuyển khoản (set ACTIVE + 30 ngày + seatLimit)
- **Đổi gói**: FREE / STARTER / TEAM
- **Đổi trạng thái**: ACTIVE / TRIAL / SUSPENDED / CANCELLED
- **Gia hạn trial**: Preset 7/14/30/60/90 ngày hoặc nhập tay
- **Override seat limit**: Tăng/giảm số lượng thành viên cho phép
- **Xem owners**: Danh sách chủ workspace, email, Clerk ID
- **Danger zone**: Tạm dừng (SUSPENDED) hoặc Huỷ (CANCELLED) workspace

---

## 5. So sánh nhanh: 3 loại Admin

| | System Admin (`/system`) | Super Admin (`/super-admin`) | Org Admin (dashboard) |
|--|--------------------------|-----------------------------|-----------------------|
| **Auth** | Username/Password riêng | Clerk (ID trong env) | Clerk |
| **Scope** | Toàn nền tảng (plans, upgrade requests) | Toàn nền tảng (tất cả org) | 1 workspace |
| **Quản lý gói dịch vụ** | ✅ (`/system/plans`) | ❌ | ❌ |
| **Duyệt upgrade** | ✅ (`/system/upgrade-requests`) | ❌ | Gửi request |
| **Xem tất cả org** | ❌ | ✅ (`/super-admin/orgs`) | ❌ |
| **Đổi plan org** | ❌ (chỉ duyệt request) | ✅ trực tiếp | ❌ |
| **Quản lý nhân viên org** | ❌ | ❌ | ✅ (`/employees`) |
| **Audit log** | Xem qua API | ❌ | ✅ (`/admin/audit`) |

---

## 6. Luồng đầy đủ — Khách hàng mua gói

```
1. Khách vào jobihome.vn → xem /pricing
2. Nhấn "Dùng thử miễn phí" → /sign-up (Clerk)
3. Tạo tài khoản Clerk xong → /onboarding
4. Điền tên công ty, họ tên → hệ thống tạo org (plan=FREE, status=TRIAL)
5. Redirect → {slug}.jobihome.vn/dashboard
6. Dùng 14 ngày trial (cấu hình trong PLANS.STARTER.trialDays)
7. Muốn mua → vào /billing → chọn gói → /admin/upgrade-requests → gửi request + nội dung CK
8. System Admin nhận thông báo tại /system/upgrade-requests
9. Xác nhận đã nhận tiền → Duyệt → plan = STARTER, status = ACTIVE, +30 ngày
10. Khách workspace tiếp tục dùng đầy đủ tính năng
```

---

## 7. Biến môi trường liên quan đến Auth

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Super Admin whitelist (Clerk User IDs, cách nhau bởi dấu phẩy)
SUPER_ADMIN_CLERK_USER_IDS=user_abc123,user_xyz456

# System Admin session signing
ADMIN_JWT_SECRET=<random-32-chars>   # dùng để ký HMAC admin_session cookie

# App domain (dùng cho subdomain routing)
NEXT_PUBLIC_APP_URL=https://jobihome.vn
```

---

## 8. Ghi chú kỹ thuật

- **Multitenant**: Mỗi org có `slug` → truy cập qua subdomain `{slug}.jobihome.vn`. Middleware extract subdomain → set header `x-tenant-slug`.
- **Landing page content**: Không có CMS — muốn thay đổi text/hình ảnh landing page phải sửa code trong `app/(marketing)/`.
- **Role guards là UI-level**: Sidebar ẩn/hiện menu theo role, nhưng route không enforce — user có thể direct-navigate đến URL nếu biết. Cần thêm server-side check nếu muốn bảo mật chặt hơn.
- **2 hệ thống auth song song**: Clerk (workspace) và HMAC cookie (system admin) hoàn toàn độc lập với nhau.
