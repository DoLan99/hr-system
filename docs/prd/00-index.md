# PRD — Jobihome HR System
# Tài liệu Yêu cầu Sản phẩm (Product Requirements Document)

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-06-30  
**Trạng thái:** Living Document  

---

## Giới thiệu sản phẩm

**Jobihome** là nền tảng quản trị nhân sự và công việc (HRM + Project Management) dành cho doanh nghiệp vừa và nhỏ tại Việt Nam. Hệ thống hoạt động theo mô hình **SaaS multi-tenant** — mỗi doanh nghiệp là một **workspace** độc lập, tách biệt dữ liệu hoàn toàn.

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** Clerk
- **File Storage:** Google Drive / Microsoft OneDrive (OAuth)
- **Notification:** Microsoft Teams webhook, Zalo webhook, Email

### Kiến trúc phân tầng người dùng

| Tầng | Vai trò | Phạm vi |
|---|---|---|
| **Super Admin** | Quản lý toàn bộ hệ thống | Tất cả workspace/org |
| **Admin (Workspace)** | Quản trị nội bộ workspace | 1 workspace |
| **Manager / Team Lead** | Duyệt, phân công, review | Phòng ban / team |
| **Employee** | Thực hiện công việc | Cá nhân |

---

## Danh sách các luồng chức năng

| # | Module | File PRD | Trạng thái |
|---|---|---|---|
| 01 | Authentication & Onboarding | [01-authentication-onboarding.md](./01-authentication-onboarding.md) | ✅ |
| 02 | Quản lý nhân viên | [02-employees.md](./02-employees.md) | ✅ |
| 03 | Phòng ban, Chức vụ & Team | [03-departments-roles-teams.md](./03-departments-roles-teams.md) | ✅ |
| 04 | Quản lý nghỉ phép | [04-leave.md](./04-leave.md) | ✅ |
| 05 | Chấm công & Giờ làm việc | [05-office-time-checkin.md](./05-office-time-checkin.md) | ✅ |
| 06 | Quản lý công việc (Tasks) | [06-tasks.md](./06-tasks.md) | ✅ |
| 07 | Time Logs & Sprints | [07-time-logs-sprints.md](./07-time-logs-sprints.md) | ✅ |
| 08 | Đánh giá hiệu suất | [08-performance-reviews.md](./08-performance-reviews.md) | ✅ |
| 09 | Kỹ năng & Lộ trình nghề nghiệp | [09-skills-career-tracks.md](./09-skills-career-tracks.md) | ✅ |
| 10 | Lương & Thanh toán | [10-payments.md](./10-payments.md) | ✅ |
| 11 | Tài sản & Thiết bị (Inventory) | [11-inventory.md](./11-inventory.md) | ✅ |
| 12 | Tài liệu & Drive | [12-documents-drive.md](./12-documents-drive.md) | ✅ |
| 13 | Vault (Kho bí mật) | [13-vault.md](./13-vault.md) | ✅ |
| 14 | Khách hàng / CRM | [14-customers-crm.md](./14-customers-crm.md) | ✅ |
| 15 | Nhắn tin nội bộ | [15-messages.md](./15-messages.md) | ✅ |
| 16 | Workflow & Phê duyệt | [16-workflows-approvals.md](./16-workflows-approvals.md) | ✅ |
| 17 | Capacity Planning & KPI | [17-capacity-summary-kpi.md](./17-capacity-summary-kpi.md) | ✅ |
| 18 | Activity Tracking, Audit & Anomaly | [18-activity-audit-anomaly.md](./18-activity-audit-anomaly.md) | ✅ |
| 19 | Billing & Gói dịch vụ | [19-billing-plans.md](./19-billing-plans.md) | ✅ |
| 20 | Admin Panel & Super Admin | [20-admin-super-admin.md](./20-admin-super-admin.md) | ✅ |
| 21 | Tự động tính KPI nhân viên | [21-kpi-auto-scoring.md](./21-kpi-auto-scoring.md) | ✅ |
| 22 | Task Templates, Suggestions & Estimate Flags | [22-task-templates-suggestions.md](./22-task-templates-suggestions.md) | ✅ |
| 23 | Development Goals & Career Path Tự động | [23-development-goals-career-path.md](./23-development-goals-career-path.md) | ✅ |
| 24 | Work Rules & System Labels | [24-work-rules-system-labels.md](./24-work-rules-system-labels.md) | ✅ |
| 25 | External Integrations & Webhooks | [25-external-integrations-webhooks.md](./25-external-integrations-webhooks.md) | ✅ |
| 26 | Capacity Planning Chi tiết | [26-capacity-planning-detail.md](./26-capacity-planning-detail.md) | ✅ |
| 27 | Dashboard Homepage | [27-dashboard-homepage.md](./27-dashboard-homepage.md) | ✅ |

---

## Cron Jobs hệ thống

| Job | Tần suất | Chức năng |
|---|---|---|
| `/api/cron/recurrence` | Hàng ngày | Tạo task lặp theo lịch |
| `/api/cron/close-stale-sessions` | Mỗi giờ | Đóng phiên activity không hoạt động |
| `/api/cron/anomalies` | Hàng ngày | Phát hiện hành vi bất thường |

## Webhooks tích hợp bên ngoài

| Webhook | Mục đích |
|---|---|
| `/api/webhooks/clerk` | Đồng bộ user từ Clerk |
| `/api/webhooks/teams` | Nhận thông báo từ Microsoft Teams |
| `/api/webhooks/zalo` | Nhận thông báo từ Zalo |
| `/api/webhooks/email` | Nhận email gắn task |
| `/api/webhooks/git` | Webhook từ GitHub/GitLab |
