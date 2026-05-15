# HR Management System — Tài Liệu Thiết Kế Chi Tiết

> **Phiên bản:** 2.0
> **Ngày tạo:** 2026-05-06
> **Cập nhật:** 2026-05-09 — Refactor sang model Tasks + Time Logs (unified)
> **Dựa trên:** HR-SYS_ĐL.xlsx (gốc); refactor để phù hợp công ty công nghệ với mixed workforce (freelance + full-time)
> **Mục tiêu:** Web App quản lý nhân sự với phân quyền đầy đủ, mọi công việc đều có track log, audit-ready cho freelance billing và FT performance

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Phân Quyền Theo Vai Trò (RBAC)](#2-phân-quyền-theo-vai-trò-rbac)
3. [Module 01 — Quản Lý Nhân Viên](#module-01--quản-lý-nhân-viên)
4. [Module 02 — Tasks (Quản Lý Công Việc)](#module-02--tasks-quản-lý-công-việc)
5. [Module 03 — Time Logs (Nhật Ký Thời Gian)](#module-03--time-logs-nhật-ký-thời-gian)
6. [Module 04 — Office Time (Chấm Công)](#module-04--office-time-chấm-công)
7. [Module 05 — Task Templates (Mẫu Task — tùy chọn)](#module-05--task-templates-mẫu-task--tùy-chọn)
8. [Module 06 — Task Reviews (Duyệt Estimate & Đề Xuất Template)](#module-06--task-reviews-duyệt-estimate--đề-xuất-template)
9. [Module 07 — Summary & Lương](#module-07--summary--lương)
10. [Module 08 — Payments (Thanh Toán)](#module-08--payments-thanh-toán)
11. [Module 09 — Leave Management (Nghỉ Phép)](#module-09--leave-management-nghỉ-phép)
12. [Module 10 — Customers (Khách Hàng)](#module-10--customers-khách-hàng)
13. [Module 11 — Messages (Tin Nhắn / Hỗ Trợ)](#module-11--messages-tin-nhắn--hỗ-trợ)
14. [Module 12 — Password Vault (Kho Mật Khẩu)](#module-12--password-vault-kho-mật-khẩu)
15. [Module 13 — Work Rules (Quy Định)](#module-13--work-rules-quy-định)
16. [Luồng Hoạt Động Hằng Ngày](#16-luồng-hoạt-động-hằng-ngày)
17. [Database Schema](#17-database-schema)
18. [Tech Stack](#18-tech-stack)
19. [API Endpoints](#19-api-endpoints)
20. [Wireframes — Giao Diện Từng Module](#20-wireframes--giao-diện-từng-module)

---

## 1. Tổng Quan Hệ Thống

### 1.1 Mục Tiêu

Xây dựng hệ thống quản lý nhân sự (HR) + quản lý công việc dạng Web App cho công ty công nghệ với **mixed workforce (freelance + full-time)**, hỗ trợ:

- **Nhiều nhân viên** làm việc đồng thời, cả freelance hourly billing lẫn full-time payroll
- **Phân quyền** rõ ràng theo từng vị trí (Role-Based Access Control)
- **Mọi công việc đều có track log** — enforce ở cấp database (mọi time log phải gắn với 1 Task)
- **Tự động tính lương** dựa trên giờ công được duyệt (credited hours / billable hours)
- **Quản lý task unified** — Tasks là đơn vị duy nhất (không tách Task Library / Work List); Time Logs là nhật ký thời gian gắn vào Task
- **Audit-ready** — mỗi giờ tính tiền đều trace được về Task → Time Log → video proof → manager approval
- **Minh bạch** — audit log, video evidence, approval workflow
- **Dashboard** trực quan theo từng role

### 1.2 Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HR MANAGEMENT SYSTEM                         │
│                                                                     │
│  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐    │
│  │SUPER_ADMIN │  │  ADMIN   │  │  MANAGER  │  │  TEAM_LEAD   │    │
│  └────────────┘  └──────────┘  └───────────┘  └──────────────┘    │
│  ┌────────────┐  ┌──────────┐  ┌───────────┐                       │
│  │  EMPLOYEE  │  │   HR     │  │ACCOUNTANT │                       │
│  └────────────┘  └──────────┘  └───────────┘                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      13 MODULES                             │   │
│  │                                                             │   │
│  │  [01] Employees    [02] Tasks       [03] Time Logs          │   │
│  │  [04] Office Time  [05] Templates*  [06] Task Reviews       │   │
│  │  [07] Summary      [08] Payments    [09] Leave              │   │
│  │  [10] Customers    [11] Messages    [12] Passwords          │   │
│  │  [13] Work Rules                                            │   │
│  │                                       (* = optional)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL  │  Redis Cache  │  S3/Drive Storage            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Nguyên Tắc Thiết Kế

| Nguyên tắc | Mô tả |
|------------|--------|
| **Full tracking** | Mọi time log PHẢI gắn với 1 Task (FK NOT NULL) — không có giờ làm "tự do" |
| **Single source of truth** | Tasks là đơn vị công việc duy nhất; không còn Task Library / Work List riêng biệt |
| **Data integrity** | Mọi thay đổi đều có audit log (ai, lúc nào, thay gì) |
| **Evidence-based** | Actual > Estimate → bắt buộc video/link bằng chứng |
| **Approval workflow** | Giờ vượt estimate, task đặc biệt (learning/new_research), nghỉ phép — đều cần duyệt |
| **Auto-calculate** | Lương, bonus, performance score, billable hours tính tự động |
| **Role isolation** | Mỗi role chỉ thấy/sửa đúng phần mình được phép |
| **Mobile-first** | Nhân viên có thể nhập time log từ điện thoại |
| **Workforce-agnostic** | Cùng 1 model cho freelance (billable hourly) và full-time (credited hours → payroll) |

---

## 2. Phân Quyền Theo Vai Trò (RBAC)

### 2.1 Danh Sách Vai Trò

| Role | Mô tả | Phạm vi |
|------|--------|---------|
| `SUPER_ADMIN` | Toàn quyền hệ thống, cấu hình server, backup | Toàn hệ thống |
| `ADMIN` | Quản lý nhân sự, lương, chính sách công ty | Toàn công ty |
| `MANAGER` | Quản lý nhóm, duyệt giờ, duyệt lương nhóm | Team được assign |
| `TEAM_LEAD` | Giao việc, theo dõi tiến độ, review task | Team được assign |
| `EMPLOYEE` | Nhập báo cáo công việc hằng ngày | Chỉ của bản thân |
| `HR` | Quản lý hồ sơ, hợp đồng, nghỉ phép | Toàn công ty (không thấy lương) |
| `ACCOUNTANT` | Xem lương, xuất báo cáo tài chính | Toàn công ty (chỉ đọc hầu hết) |

### 2.2 Ma Trận Phân Quyền

```
Chú thích:
  ✅ Full CRUD          🔵 Read Only
  🟡 Read + Approve     🟠 CRUD phạm vi team
  🔴 Không có quyền    👤 Chỉ của bản thân
  💰 Chỉ phần tài chính

MODULE                │ SUPER_ADMIN │ ADMIN │ MANAGER │ TEAM_LEAD │ EMPLOYEE │ HR  │ ACCOUNTANT
──────────────────────┼─────────────┼───────┼─────────┼───────────┼──────────┼─────┼───────────
01. Employees         │ ✅          │ ✅    │ 🔵🟠    │ 🔵🟠      │ 👤🔵     │ ✅  │ 🔵
02. Tasks             │ ✅          │ ✅    │ 🟠      │ 🟠        │ 👤✅     │ 🔴  │ 🔴
03. Time Logs         │ ✅          │ ✅    │ 🟠🟡    │ 🟠🟡      │ 👤✅     │ 🔴  │ 🔴
04. Office Time       │ ✅          │ ✅    │ 🟡🟠    │ 🔴        │ 👤✅     │ 🔵  │ 🔵
05. Task Templates    │ ✅          │ ✅    │ ✅      │ 🟠        │ 🔵       │ 🔴  │ 🔴
06. Task Reviews      │ ✅          │ ✅    │ 🟡🟠    │ 🟡🟠      │ 👤✅     │ 🔴  │ 🔴
07. Summary           │ ✅          │ ✅    │ 🟠🔵    │ 🟠🔵      │ 👤🔵     │ 🔴  │ ✅
08. Payments          │ ✅          │ ✅    │ 🔴      │ 🔴        │ 👤🔵     │ 🔴  │ ✅
09. Leave             │ ✅          │ ✅    │ 🟡🟠    │ 🔴        │ 👤✅     │ ✅  │ 🔵
10. Customers         │ ✅          │ ✅    │ ✅      │ 🔵        │ 🔵       │ 🔴  │ 🔵
11. Messages          │ ✅          │ ✅    │ ✅      │ 🟠        │ 👤✅     │ 🔴  │ 🔴
12. Passwords         │ ✅          │ ✅    │ 🔵🟠    │ 🔴        │ 🔴       │ 🔴  │ 🔴
13. Work Rules        │ ✅          │ ✅    │ 🔵      │ 🔵        │ 🔵       │ 🔵  │ 🔴
```

### 2.3 Permission Flags

Mỗi permission được cấu hình dạng JSON trong database:

```json
{
  "employees": { "create": true, "read": true, "update": true, "delete": false, "scope": "team" },
  "tasks":     { "create": true, "read": true, "update": true, "delete": false, "approve": true, "scope": "team" },
  "time_logs": { "create": true, "read": true, "update": true, "delete": false, "approve": true, "scope": "team" },
  "salary":    { "create": false, "read": true, "update": false, "delete": false, "scope": "all" }
}
```

---

## Module 01 — Quản Lý Nhân Viên

### Mô Tả

Quản lý toàn bộ thông tin nhân viên: hồ sơ cá nhân, thông tin lương, drive links, trạng thái làm việc.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `employee_id` | INT (auto) | Mã nhân viên (ví dụ: 15) | ✅ |
| `full_name` | VARCHAR(100) | Họ và tên | ✅ |
| `avatar_url` | TEXT | Ảnh đại diện | ❌ |
| `department` | VARCHAR(100) | Phòng ban (Dev & Team Lead, Admin...) | ✅ |
| `role` | ENUM | SUPER_ADMIN / ADMIN / MANAGER / ... | ✅ |
| `company` | VARCHAR(100) | Tên công ty (Hung IT/GM) | ✅ |
| `email_company` | VARCHAR(150) | Email công ty | ✅ |
| `email_google` | VARCHAR(150) | Email Google Drive | ❌ |
| `email_private` | VARCHAR(150) | Email cá nhân | ❌ |
| `mobile_company` | VARCHAR(20) | Điện thoại công ty | ❌ |
| `pay_type` | ENUM | `hourly` / `monthly` / `contract` | ✅ |
| `hourly_rate` | DECIMAL(10,2) | Lương theo giờ (€/h) | Nếu hourly |
| `monthly_salary` | DECIMAL(10,2) | Lương tháng cố định | Nếu monthly |
| `max_hours_month` | INT | Giới hạn giờ tính lương/tháng (default: 160) | ✅ |
| `bonus_m_pct` | DECIMAL(5,2) | % Bonus hiệu suất tháng | ❌ |
| `bonus_a_pct` | DECIMAL(5,2) | % Bonus năng lực | ❌ |
| `bonus_t_pct` | DECIMAL(5,2) | % Bonus thêm (tự do) | ❌ |
| `drive_link_1` | TEXT | Google Drive folder link 1 | ❌ |
| `drive_link_2` | TEXT | Google Drive folder link 2 | ❌ |
| `drive_link_3` | TEXT | Google Drive folder link 3 | ❌ |
| `drive_link_4` | TEXT | Google Drive folder link 4 | ❌ |
| `start_date` | DATE | Ngày bắt đầu làm việc | ✅ |
| `status` | ENUM | `active` / `inactive` / `probation` | ✅ |
| `manager_id` | INT (FK) | Manager trực tiếp | ❌ |
| `created_at` | TIMESTAMP | Ngày tạo | auto |
| `updated_at` | TIMESTAMP | Ngày cập nhật | auto |

### Business Rules

- `employee_id` không thay đổi sau khi tạo
- Khi `status = inactive`, nhân viên không thể đăng nhập
- `manager_id` tự xác định scope duyệt của Manager/Team Lead
- Thay đổi `hourly_rate` / `monthly_salary` phải ghi log (salary_history)

---

## Module 02 — Tasks (Quản Lý Công Việc)

### Mô Tả

**Đơn vị công việc duy nhất** của hệ thống. Mỗi mẩu việc — dù lớn (multi-week project) hay nhỏ (5 phút trả email) — đều là 1 Task. Tasks thay thế hoàn toàn 2 khái niệm cũ: **Task Library** (catalog việc lặp lại) và **Work List** (việc được giao).

Mọi `time_logs` (Module 03) **bắt buộc** gắn với 1 Task — đảm bảo "mọi công việc đều có track log".

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `code` | VARCHAR(10) | Mã tự sinh: TSK-0001, TSK-0002 (dễ reference) | auto |
| `title` | VARCHAR(200) | Tên task | ✅ |
| `description` | TEXT | Mô tả chi tiết | ❌ |
| `task_type` | ENUM | Phân loại — xem bảng Task Type bên dưới | ✅ |
| `priority` | ENUM | `critical` / `high` / `normal` / `low` | ✅ |
| `status` | ENUM | `backlog` / `in_progress` / `blocked` / `review` / `done` / `cancelled` | ✅ |
| `estimated_time` | INT | Thời gian ước tính (phút) | ❌ |
| `actual_time_total` | INT | Tổng phút từ time_logs (auto sum) | auto |
| `progress_pct` | INT | % hoàn thành (0–100) | auto từ time_logs hoặc nhập tay |
| `parent_task_id` | INT (FK→tasks) | Task cha — cho sub-task / epic | ❌ |
| `template_id` | INT (FK→task_templates) | Tạo từ template nào | ❌ |
| `assigned_to` | INT (FK→employees) | Nhân viên được giao | ✅ |
| `assigned_by` | INT (FK→employees) | Người giao việc (có thể = assigned_to nếu tự tạo) | ✅ |
| `customer_id` | INT (FK→customers) | Khách hàng — bắt buộc nếu `billable = TRUE` | Cond. |
| `project_id` | INT (FK→projects) | Dự án/site (nhadat.de, vietnam-work.com…) | ❌ |
| `billable` | BOOLEAN | Có tính tiền cho khách hàng không (freelance) | ✅ default FALSE |
| `hourly_rate_override` | DECIMAL(10,2) | Override rate freelance cho task này | ❌ |
| `requires_video` | BOOLEAN | Bắt buộc video proof (auto từ task_type) | auto |
| `date_created` | TIMESTAMP | Ngày tạo | auto |
| `date_started` | DATE | Ngày bắt đầu thực tế | auto khi status → in_progress |
| `due_date` | DATE | Hạn hoàn thành | ❌ |
| `date_completed` | DATE | Ngày hoàn thành thực tế | auto khi status → done |
| `is_overdue` | BOOLEAN | due_date < today AND status NOT IN (done, cancelled) | auto |
| `last_update` | TIMESTAMP | Cập nhật lần cuối | auto |
| `reason_next_action` | TEXT | Lý do block / bước tiếp theo | ❌ |

### Task Type — Phân Loại

| `task_type` | Ý nghĩa | Quy tắc credited time | Video |
|-------------|---------|----------------------|-------|
| `normal` | Việc thường (dev, admin, support…) | actual ≤ estimate: tự auto. Vượt: cần video, manager duyệt | Khi vượt estimate |
| `learning` | Học & tìm hiểu (thay ID 1001 cũ) | Manager duyệt, đếm vào `learn_hours` (KPI) | ✅ Bắt buộc |
| `new_research` | Việc mới chưa rõ estimate (thay ID 2001/2002 cũ) | Không có video → credited = 0; có video → manager duyệt | ✅ Bắt buộc |
| `meeting` | Họp, daily standup, sync | Tự auto theo actual time | ❌ |
| `admin` | Việc hành chính, báo cáo nội bộ | Tự auto | ❌ |
| `billable_client` | Việc tính tiền cho khách (freelance) | Tự auto, đẩy vào billable_hours | Khuyến khích |
| `internal` | Việc nội bộ không billable | Tự auto | ❌ |

> Cờ `requires_video` được hệ thống tự đặt dựa trên `task_type` (learning, new_research → TRUE).

### Trạng Thái Chuyển Đổi

```
backlog ──► in_progress ──► review ──► done
              │   ▲                       ▲
              │   └─── (sửa lại) ─────────┘
              ▼
           blocked ──► in_progress
              │
              ▼
          cancelled
```

- `backlog` — đã tạo, chưa bắt đầu
- `in_progress` — đang làm, có time_logs đang chạy
- `blocked` — bị chặn (chờ thông tin, chờ duyệt) → bắt buộc điền `reason_next_action`
- `review` — đã làm xong, chờ manager review/QA
- `done` — đóng task, không log thêm time được
- `cancelled` — hủy, không tính vào KPI

### Business Rules

**Tạo task:**
- `code` (TSK-xxxx) tự sinh, không nhập tay
- Nhân viên có thể tự tạo task cho mình (assigned_to = self) — auto status `in_progress`
- Manager/Team Lead có thể tạo task giao cho người khác — auto status `backlog`
- Nếu tạo từ `template_id` → auto fill `title`, `task_type`, `estimated_time`, `requires_video` từ template
- `billable = TRUE` → bắt buộc có `customer_id`

**Cập nhật:**
- Nhân viên chỉ update task được assign cho mình
- Manager/Team Lead update mọi task trong scope team
- Khi `status → done` → auto-set `date_completed = today`, `progress_pct = 100`
- Khi `status → blocked` → bắt buộc điền `reason_next_action`

**Auto-aggregation:**
- `actual_time_total` = SUM(time_logs.duration_minutes) WHERE task_id = this
- `is_overdue` re-tính mỗi ngày bằng cron job
- `progress_pct` có thể auto = MIN(100, actual_time_total / estimated_time × 100) hoặc nhập tay (cái nào lớn hơn)

**Sub-tasks:**
- `parent_task_id` cho phép phân rã epic → sub-tasks
- `actual_time_total` của parent = sum của parent + tất cả children

**Quick-create cho task nhỏ:**
- UI cung cấp form ngắn (chỉ cần `title` + `estimated_time`) → các field khác lấy default
- Templates pre-defined ("Reply email", "Quick fix", "Code review nhỏ"…) → 1-click tạo task
- Bulk-create: nhập 5 task nhỏ cùng lúc bằng 1 form

---

## Module 03 — Time Logs (Nhật Ký Thời Gian)

### Mô Tả

Mỗi lần nhân viên log thời gian = 1 record. **Bắt buộc gắn với 1 Task** (FK NOT NULL — enforce ở DB). Hệ thống tự tính credited time dựa trên `task.task_type`, `task.estimated_time`, video proof và workflow duyệt.

1 Task có thể có nhiều Time Logs (làm nhiều ngày, nhiều phiên).
1 Time Log = 1 phiên làm việc liên tục cho 1 Task.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `task_id` | INT (FK→tasks) | **BẮT BUỘC** — task đang log | ✅ |
| `employee_id` | INT (FK→employees) | Nhân viên | ✅ |
| `date` | DATE | Ngày làm việc | ✅ |
| `start_time` | TIME | Giờ bắt đầu (nullable nếu nhập sau) | ❌ |
| `end_time` | TIME | Giờ kết thúc | ❌ |
| `duration_minutes` | INT | Thời gian thực tế lần log này (phút) | ✅ |
| `quantity` | INT | Số lượng đơn vị (cho task tính theo đơn vị) | default 1 |
| `note` | TEXT | Mô tả ngắn lần log này | ❌ |
| `completion_pct_after` | INT | % hoàn thành task sau lần log này (0–100) | default giữ nguyên |
| `task_status_after` | ENUM | Cập nhật task status sau log (`in_progress`/`blocked`/`review`/`done`) | ❌ |
| `video_count` | INT | Số video đã quay | default 0 |
| `video_duration` | INT | Tổng thời lượng video (phút) | default 0 |
| `video_link` | TEXT | Link Google Drive video chính | Nếu task.requires_video |
| `proof_links` | TEXT[] | Link tài liệu/output bổ sung (mảng) | ❌ |
| `credited_minutes` | INT | Phút được ghi nhận (sau approval logic) | auto |
| `approval_status` | ENUM | `auto_approved` / `pending` / `approved` / `rejected` | auto |
| `approved_by` | INT (FK→employees) | Manager duyệt | ❌ |
| `approved_minutes` | INT | Phút manager duyệt (override credited_minutes) | ❌ |
| `approved_at` | TIMESTAMP | Thời gian duyệt | auto |
| `rejection_reason` | TEXT | Lý do reject | ❌ |
| `rating` | INT | Đánh giá của Manager (1–5) | ❌ |
| `created_at` | TIMESTAMP | Ngày tạo | auto |

### Business Rules — Credited Minutes

```
-- Lấy thông tin task qua JOIN
task = SELECT * FROM tasks WHERE id = log.task_id

IF task.task_type IN ('learning', 'new_research') THEN
  -- Yêu cầu video bắt buộc
  IF log.video_link IS NULL OR log.video_link = '' THEN
    credited_minutes  = 0
    approval_status   = 'rejected'
  ELSE
    credited_minutes  = NULL              -- chờ manager duyệt
    approval_status   = 'pending'
  END IF

ELSE IF task.actual_time_total > task.estimated_time THEN
  -- Tổng giờ thực tế đã vượt estimate
  IF log.video_link IS NULL THEN
    -- Prorate: chỉ tính phần trong estimate
    over_minutes      = task.actual_time_total - task.estimated_time
    credited_minutes  = MAX(0, log.duration_minutes - over_minutes)
    approval_status   = 'auto_approved'
  ELSE
    credited_minutes  = NULL              -- chờ manager duyệt
    approval_status   = 'pending'
  END IF

ELSE
  -- Bình thường, auto duyệt
  credited_minutes    = log.duration_minutes
  approval_status     = 'auto_approved'
END IF

-- Khi manager duyệt:
credited_minutes = approved_minutes
approval_status  = 'approved'
```

### Validation Rules

| Điều kiện | Yêu cầu | Hậu quả nếu vi phạm |
|-----------|---------|---------------------|
| `task_id` NULL | Không bao giờ — DB từ chối insert | INSERT fails |
| `task.requires_video = TRUE` & video_link rỗng | Phải có video | `credited = 0`, `status = rejected` |
| `task.actual_time_total > estimated_time` & không video | Bắt buộc video để vượt | Prorate, chỉ credit phần trong estimate |
| `task.status = 'done'` hoặc `'cancelled'` | Không log thêm được | INSERT bị chặn |
| `duration_minutes ≤ 0` | Phải > 0 | Validation error |
| `task_type = 'billable_client'` | Phải có `task.customer_id` | Validation error khi tạo task |
| 1 log = 1 phiên | Không gộp nhiều phiên rời rạc | Data integrity |

### Workflow Duyệt Time Log

```
EMPLOYEE log time
    │
    ▼
Hệ thống tính credited_minutes (theo rule trên)
    │
    ├── auto_approved  ──► Tính ngay vào Summary
    ├── rejected       ──► Báo employee bổ sung video, tạo log mới
    └── pending        ──► Vào queue Manager duyệt
                              │
                              ▼
                          MANAGER review
                              │
                              ├── approve  ──► nhập approved_minutes (≤ duration_minutes)
                              │                + rating (1–5)
                              │                → tính vào Summary
                              └── reject   ──► nhập rejection_reason
                                              → credited_minutes = 0
```

---

## Module 04 — Office Time (Chấm Công)

### Mô Tả

Ghi nhận thời gian làm việc thực tế (check-in/check-out), đối chiếu với tổng Time Logs trong ngày, trình duyệt Manager.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `date` | DATE | Ngày làm việc | ✅ |
| `employee_id` | INT (FK) | Nhân viên | ✅ |
| `start_work_1` | TIME | Bắt đầu sáng | ✅ |
| `start_lunch` | TIME | Bắt đầu nghỉ trưa | ❌ |
| `start_work_2` | TIME | Bắt đầu chiều | ❌ |
| `start_afternoon_break` | TIME | Bắt đầu nghỉ chiều | ❌ |
| `start_work_3` | TIME | Tiếp tục làm | ❌ |
| `end_workday` | TIME | Kết thúc ngày | ✅ |
| `time_logs_total` | INT | Tổng phút từ Time Logs trong ngày (auto) | auto |
| `actual_worked` | INT | Phút làm thực tế (từ timestamps) | auto |
| `delta` | INT | = time_logs_total - actual_worked | auto |
| `explanation` | TEXT | Giải thích chênh lệch | Nếu delta > 30 |
| `approval_status` | ENUM | `pending` / `approved` / `rejected` | ✅ |
| `approved_by` | INT (FK) | Manager duyệt | ❌ |
| `approved_delta` | INT | Delta được duyệt → cộng vào Summary | ❌ |
| `approved_at` | TIMESTAMP | Thời gian duyệt | auto |

### Tính Toán Thời Gian Thực

```
actual_worked = 
  (start_lunch - start_work_1)      -- buổi sáng
  + (start_work_2 - start_lunch)    -- nếu có buổi chiều
  - (start_work_3 - start_afternoon_break)  -- trừ nghỉ
  ... cho đến end_workday
```

---

## Module 05 — Task Templates (Mẫu Task — tùy chọn)

### Mô Tả

**Tùy chọn, không bắt buộc.** Templates dùng cho các loại việc **lặp lại thường xuyên** (Code Review, Daily Standup, Deploy staging, Reply email…) để tạo Task mới chỉ với 1 click — giảm ma sát cho task nhỏ.

> **Khác biệt với Task Library cũ:** Task Library cũ là **bắt buộc** (mọi Work Report phải tham chiếu Task ID). Templates mới chỉ là **shortcut** — bạn có thể tạo Task hoàn toàn không cần template, chỉ cần `title` + `task_type`.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `code` | VARCHAR(20) | Mã ngắn để search nhanh (CODE_REVIEW, DAILY_STANDUP…) | ✅ |
| `title` | VARCHAR(200) | Tên template (sẽ là default title của Task) | ✅ |
| `description` | TEXT | Mô tả chi tiết | ❌ |
| `default_task_type` | ENUM | task_type mặc định khi tạo Task từ template | ✅ |
| `default_estimated_time` | INT | Estimate mặc định (phút) | ❌ |
| `default_priority` | ENUM | Priority mặc định | default `normal` |
| `requires_video` | BOOLEAN | Bắt buộc video không (override task_type default) | ❌ |
| `department` | VARCHAR(50) | Phòng ban áp dụng (filter UI) | ❌ |
| `link_template` | TEXT | Link tài liệu/template hướng dẫn | ❌ |
| `usage_count` | INT | Số lần đã được dùng (auto) | auto |
| `is_active` | BOOLEAN | Đang dùng hay đã ẩn | default TRUE |
| `created_by` | INT (FK) | Ai tạo template | auto |
| `created_at` | TIMESTAMP | Ngày tạo | auto |

### Templates Khuyến Nghị

Một số templates cơ bản nên có sẵn khi onboard:

| Code | task_type | Estimate | Mục đích |
|------|-----------|----------|----------|
| `DAILY_STANDUP` | meeting | 15 | Họp daily |
| `CODE_REVIEW` | normal | 30 | Review PR |
| `REPLY_EMAIL` | normal | 10 | Trả email khách |
| `DEPLOY_STAGING` | normal | 15 | Deploy staging |
| `BUG_FIX_QUICK` | normal | 30 | Fix bug nhỏ |
| `LEARNING_SESSION` | learning | 60 | Học công nghệ mới |
| `CLIENT_SUPPORT` | billable_client | 30 | Hỗ trợ khách (tính tiền) |

### Business Rules

- Manager/Team Lead tạo và quản lý templates
- Khi tạo Task từ template → copy các field mặc định, có thể override
- `template_id` được lưu trong Task để thống kê (template nào hay dùng)
- Set `is_active = FALSE` để ẩn template không còn dùng (không xóa cứng)

### Mapping ID Excel cũ → Task Type mới

| ID cũ (Excel) | Hệ thống mới |
|---------------|--------------|
| `1001` (Học & Tìm hiểu) | Tạo Task với `task_type = 'learning'` (hoặc dùng template `LEARNING_SESSION`) |
| `2001` / `2002` (Việc mới) | Tạo Task với `task_type = 'new_research'` |
| `DEV01`, `DEV02`… | Tạo Templates `DEV_*` nếu thực sự lặp lại; còn lại tạo Task adhoc |
| `ADM01`, `ADM02`… | Tương tự — chỉ template hóa khi thực sự lặp |

---

## Module 06 — Task Reviews (Duyệt Estimate & Đề Xuất Template)

### Mô Tả

**Đơn giản hơn nhiều so với Module 06 cũ.** Module này còn 2 chức năng:

- **6a. Time Log Approval Queue** — không cần bảng riêng, là **view filter** trên `time_logs` WHERE `approval_status = 'pending'`. Manager duyệt từng log (xem Module 03).
- **6b. Template Suggestions** — nhân viên đề xuất template mới cho task lặp lại nhiều.
- **6c. Estimate Revision Flags** — auto-flag task có actual >> estimate liên tục → manager review để cập nhật estimate.

> Khái niệm "Missing Tasks" của Excel cũ đã **biến mất**: trong model mới, nhân viên chỉ cần tạo Task mới (`task_type = 'new_research'` nếu chưa rõ estimate), không cần workflow đề xuất riêng. Khái niệm "Time Check" của Excel cũ chỉ còn ý nghĩa khi đề xuất sửa **template** (không phải sửa estimate của 1 task cụ thể — cái đó chỉ cần update task).

### 6b. Template Suggestions

Nhân viên đề xuất template mới khi phát hiện 1 loại việc đang làm thường xuyên.

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `date` | DATE | Ngày đề xuất | auto |
| `employee_id` | INT (FK→employees) | Người đề xuất | ✅ |
| `proposed_code` | VARCHAR(20) | Code đề xuất (CODE_REVIEW…) | ✅ |
| `proposed_title` | VARCHAR(200) | Tiêu đề template | ✅ |
| `description` | TEXT | Mô tả công việc | ✅ |
| `proposed_task_type` | ENUM | task_type khuyến nghị | ✅ |
| `proposed_estimate` | INT | Estimate đề xuất (phút) | ✅ |
| `evidence_video_link` | TEXT | Video làm mẫu (bắt buộc) | ✅ |
| `example_task_ids` | INT[] | Các task đã làm để minh chứng | ❌ |
| `reason_note` | TEXT | Lý do đề xuất | ✅ |
| `status` | ENUM | `pending` / `approved` / `rejected` | default `pending` |
| `reviewed_by` | INT (FK→employees) | Người duyệt | ❌ |
| `created_template_id` | INT (FK→task_templates) | Template được tạo nếu approved | ❌ |
| `decision_note` | TEXT | Ghi chú quyết định | ❌ |
| `bonus_time` | INT | Phút thưởng cho đề xuất tốt (cộng `initiative` KPI) | default 0 |
| `reviewed_at` | TIMESTAMP | Thời gian duyệt | auto |

### 6c. Estimate Revision Flags (auto)

Hệ thống tự động flag tasks có pattern bất thường để manager review:

```
-- Cron chạy mỗi tuần
FOR EACH template IN task_templates:
  recent_tasks = tasks WHERE template_id = template.id
                       AND status = 'done'
                       AND date_completed >= NOW() - INTERVAL '30 days'
  
  avg_actual = AVG(recent_tasks.actual_time_total)
  
  IF avg_actual > template.default_estimated_time × 1.5
     OR avg_actual < template.default_estimated_time × 0.5 THEN
    
    INSERT INTO estimate_flags (template_id, current_estimate, suggested_estimate, sample_size)
    VALUES (template.id, template.default_estimated_time, avg_actual, COUNT(recent_tasks))
  END IF
END
```

| Field (`estimate_flags`) | Type | Mô tả |
|---|---|---|
| `id` | INT | PK |
| `template_id` | INT (FK→task_templates) | Template bị flag |
| `flagged_at` | TIMESTAMP | Lúc flag |
| `current_estimate` | INT | Estimate hiện tại |
| `suggested_estimate` | INT | Estimate gợi ý (avg actual) |
| `sample_size` | INT | Số task lấy mẫu |
| `status` | ENUM | `open` / `accepted` / `dismissed` |
| `reviewed_by` | INT (FK) | Manager review |
| `reviewed_at` | TIMESTAMP | Lúc xử lý |

Manager nhìn dashboard, click "Accept" → auto update `template.default_estimated_time`.

---

## Module 07 — Summary & Lương

### Mô Tả

Tổng hợp tự động toàn bộ giờ làm, hiệu suất và tính lương theo tháng. **Đây là module trung tâm.**

### Dữ Liệu Summary (tự động tính mỗi tháng)

| Field | Type | Mô tả | Nguồn |
|-------|------|--------|-------|
| `id` | INT | PK | auto |
| `employee_id` | INT (FK) | Nhân viên | — |
| `month` | INT | Tháng (1–12) | — |
| `year` | INT | Năm | — |
| `credited_hours` | DECIMAL | Giờ được ghi nhận | SUM(time_logs.credited_minutes) / 60 |
| `work_hours_real` | DECIMAL | Giờ thực tế tại văn phòng | Office Time |
| `learn_hours` | DECIMAL | Giờ học | SUM(time_logs.duration_minutes WHERE task.task_type = 'learning') / 60 |
| `billable_hours` | DECIMAL | Giờ tính tiền khách (freelance) | SUM(credited_minutes WHERE task.billable = TRUE) / 60 |
| `billable_amount` | DECIMAL | Tiền billable (€) | SUM theo task.hourly_rate_override hoặc employee.hourly_rate |
| `delta_hours` | DECIMAL | = real - credited | computed |
| `salary_calc` | DECIMAL | Lương tính (€) | xem công thức |
| `bonus_calc` | DECIMAL | Bonus tính (€) | xem công thức |
| `total_calc` | DECIMAL | Tổng tính (€) | salary + bonus |
| `salary_paid` | DECIMAL | Đã trả thực tế (€) | từ payments |
| `bonus_paid` | DECIMAL | Bonus đã trả (€) | từ payments |
| `money_received` | DECIMAL | Tổng đã nhận (€) | từ payments |
| `delta_money` | DECIMAL | = received - calc | computed |

### 5 Chỉ Số Hiệu Suất

| Chỉ số | Cách tính | Trọng số |
|--------|-----------|---------|
| `work_speed` | Credited hours / Expected hours × 100 | 25% |
| `quality` | Avg rating từ Manager trên time_logs (1–5) × 20 | 25% |
| `learning_ability` | Giờ học có duyệt / tổng giờ × 100 (task.task_type = 'learning') | 15% |
| `adherence_to_deadlines` | Tasks đúng hạn (status=done & date_completed≤due_date) / tổng tasks × 100 | 20% |
| `initiative` | Template suggestions được duyệt × hệ số + tasks tự khởi xướng (task_type=new_research được duyệt) | 15% |
| **`total_score`** | Tổng có trọng số (0–100) | 100% |

### Công Thức Tính Lương

**Cho Full-time (pay_type = monthly):**
```
salary_calc = monthly_salary × (credited_hours / expected_hours)
bonus_calc  = salary_calc × (bonus_m_pct + bonus_a_pct + bonus_t_pct) / 100
total_calc  = salary_calc + bonus_calc
```

**Cho Hourly (FT hourly hoặc Freelance):**
```
salary_calc = MIN(credited_hours, max_hours_month) × hourly_rate
bonus_calc  = salary_calc × (bonus_m_pct + bonus_a_pct + bonus_t_pct) / 100
total_calc  = salary_calc + bonus_calc
```

**Cho Freelance billable (bổ sung):**
```
-- Mỗi customer có 1 invoice riêng
FOR EACH customer IN tasks WHERE billable = TRUE AND assigned_to = employee:
  customer_billable_hours  = SUM(credited_minutes của time_logs trên tasks billable của customer này) / 60
  customer_billable_amount = customer_billable_hours × (task.hourly_rate_override OR employee.hourly_rate)
  → Tạo line trên invoice
```

### Thống Kê Tasks trong Summary

| Metric | Mô tả |
|--------|--------|
| `total_tasks` | Tổng tasks assigned trong kỳ |
| `completed_tasks` | Tasks status = `done` |
| `open_tasks` | Tasks status IN (backlog, in_progress, blocked, review) |
| `overdue_tasks` | Tasks `is_overdue = TRUE` |
| `blocked_tasks` | Tasks status = `blocked` |
| `due_in_3_days` | Tasks due_date BETWEEN today AND today+3 |
| `avg_progress` | % tiến độ trung bình tasks đang mở |
| `completion_rate` | % tasks done / tổng |
| `total_actual_time_h` | SUM(time_logs.duration_minutes) / 60 |
| `total_credited_time_h` | SUM(time_logs.credited_minutes) / 60 |
| `tasks_by_type` | JSON breakdown by task_type (normal, learning, billable_client…) |

---

## Module 08 — Payments (Thanh Toán)

### Mô Tả

Ghi nhận lịch sử các khoản đã thanh toán cho nhân viên.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `date` | DATE | Ngày thanh toán |
| `employee_id` | INT (FK) | Nhân viên |
| `type` | ENUM | `salary` / `bonus` / `advance` / `deduction` / `other` |
| `amount` | DECIMAL(10,2) | Số tiền (€) |
| `notes` | TEXT | Ghi chú |
| `summary_month` | INT | Liên kết với Summary tháng nào |
| `summary_year` | INT | Liên kết với Summary năm nào |
| `created_by` | INT (FK) | Người tạo bản ghi |
| `created_at` | TIMESTAMP | Ngày tạo |

---

## Module 09 — Leave Management (Nghỉ Phép)

### Mô Tả

Quản lý nghỉ phép, nghỉ lễ, nghỉ ốm. Có workflow xin → duyệt → ghi nhận lương.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `date` | DATE | Ngày nghỉ |
| `employee_id` | INT (FK) | Nhân viên |
| `type` | ENUM | `vacation` / `holiday` / `illness` / `other` |
| `requested_hours` | DECIMAL | Số giờ xin nghỉ |
| `reason` | TEXT | Lý do |
| `evidence_link` | TEXT | Đơn thuốc / link bằng chứng |
| `status` | ENUM | `pending` / `approved` / `rejected` |
| `approved_hours` | DECIMAL | Số giờ được duyệt (override) |
| `approval_note` | TEXT | Ghi chú khi duyệt |
| `approved_by` | INT (FK) | Người duyệt |
| `money` | DECIMAL | Tiền được trả khi nghỉ (€) |
| `hours_per_paid_day` | DECIMAL | Giờ/ngày để tính tiền nghỉ phép |

### Báo Cáo Nghỉ Phép Hằng Năm

```
Type       │ Days │ Hours │ Money (€)
───────────┼──────┼───────┼──────────
Vacation   │  ?   │  ?    │  ?
Holiday    │  ?   │  ?    │  ?
Illness    │  ?   │  ?    │  ?
───────────┼──────┼───────┼──────────
Total      │  ?   │  ?    │  ?
```

---

## Module 10 — Customers (Khách Hàng)

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `cust_id` | VARCHAR(20) | Mã khách hàng |
| `customer_name` | VARCHAR(100) | Tên cá nhân |
| `business_name` | VARCHAR(200) | Tên doanh nghiệp |
| `contact_person` | VARCHAR(100) | Người liên hệ |
| `phone` | VARCHAR(20) | Điện thoại |
| `email` | VARCHAR(150) | Email |
| `address` | TEXT | Địa chỉ |
| `city` | VARCHAR(100) | Thành phố |
| `plz` | VARCHAR(10) | Mã bưu chính (PLZ) |
| `website` | TEXT | Website |
| `vat_tax_id` | VARCHAR(50) | Mã số thuế |
| `preferred_language` | VARCHAR(20) | Ngôn ngữ ưu tiên |
| `status` | ENUM | `active` / `inactive` / `prospect` |
| `responsible_staff` | INT (FK) | Nhân viên phụ trách |
| `last_contact_date` | DATE | Liên hệ lần cuối |
| `notes` | TEXT | Ghi chú |

---

## Module 11 — Messages (Tin Nhắn / Hỗ Trợ)

### Mô Tả

Ghi nhận toàn bộ tương tác với khách hàng, đánh giá giá trị, theo dõi xử lý.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `date` | DATE | Ngày |
| `time` | TIME | Giờ |
| `channel` | ENUM | `email` / `slack` / `phone` / `zalo` / `chat` / `other` |
| `customer_id` | INT (FK) | Khách hàng |
| `subject` | VARCHAR(200) | Chủ đề |
| `message_summary` | TEXT | Tóm tắt nội dung |
| `action_required` | TEXT | Hành động cần làm |
| `assigned_to` | INT (FK) | Nhân viên xử lý |
| `due_date` | DATE | Hạn xử lý |
| `status` | ENUM | `open` / `in_progress` / `closed` |
| `link_file` | TEXT | Link đính kèm |
| `follow_up_note` | TEXT | Ghi chú follow-up |
| `closed_date` | DATE | Ngày đóng |
| `tags` | TEXT | Tags phân loại |
| `value_type` | ENUM | `A` (có giá trị) / `B` (bình thường) / `C` (thấp) |
| `company_answer` | TEXT | Câu trả lời ngắn của công ty |
| `support_time` | INT | Thời gian hỗ trợ (phút) |
| `benefit_time` | INT | Thời gian mang lại lợi ích (phút) |
| `net_time` | INT | = benefit - support (phút) |

### Value Type

- **A – Valuable:** Yêu cầu mới / cải tiến → tăng giá trị công ty
- **B – Normal:** Làm rõ thông tin / hỗ trợ thông thường
- **C – Low value:** Đã có tài liệu nhưng không đọc / không theo quy trình

---

## Module 12 — Password Vault (Kho Mật Khẩu)

### Mô Tả

Lưu trữ tập trung tài khoản và mật khẩu của công ty và khách hàng. Mã hóa AES-256.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `scope` | ENUM | `company` / `customer` |
| `entity_name` | VARCHAR(200) | Tên tổ chức/dự án |
| `customer_id` | INT (FK) | Nếu scope = customer |
| `service_app` | VARCHAR(100) | Tên dịch vụ (GitHub, Hostinger...) |
| `login_url` | TEXT | URL đăng nhập |
| `username` | VARCHAR(200) | Tên đăng nhập |
| `email_used` | VARCHAR(150) | Email dùng đăng ký |
| `password_encrypted` | TEXT | Mật khẩu mã hóa AES-256 |
| `two_fa_method` | VARCHAR(100) | Phương thức 2FA |
| `two_fa_backup` | TEXT | Vị trí backup 2FA |
| `owner_id` | INT (FK) | Nhân viên sở hữu |
| `created_date` | DATE | Ngày tạo |
| `last_updated` | DATE | Cập nhật lần cuối |
| `rotation_days` | INT | Chu kỳ đổi mật khẩu (ngày) |
| `notes` | TEXT | Ghi chú |

### Bảo Mật

- Mật khẩu được mã hóa AES-256 trước khi lưu database
- Mỗi lần xem mật khẩu → ghi audit log
- Cảnh báo khi `last_updated + rotation_days < today`
- SUPER_ADMIN và ADMIN: xem toàn bộ
- Manager: xem tài khoản của team
- Employee: không có quyền

---

## Module 13 — Work Rules (Quy Định Công Ty)

### Mô Tả

Văn bản quy định nội bộ. Admin cập nhật, mọi nhân viên đọc.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `rule_no` | INT | Số thứ tự |
| `title` | VARCHAR(200) | Tiêu đề quy định |
| `description` | TEXT | Nội dung chi tiết |
| `effective_date` | DATE | Ngày có hiệu lực |
| `created_by` | INT (FK) | Người tạo |
| `updated_at` | TIMESTAMP | Cập nhật lần cuối |

---

## 16. Luồng Hoạt Động Hằng Ngày

### Nhân Viên (mỗi ngày)

```
07:00  ──► Check-in → Office Time (Start work 1)
           │
08:00  ──► Mở Tasks board → xem việc trong backlog/in_progress
           │   • Nhận task mới (manager assign)  → status: backlog
           │   • Tự tạo task mới (việc phát sinh) → status: in_progress
           │
09:00  ──► Bắt đầu làm 1 task → status: in_progress
           │   • Log time (start) — hoặc nhập sau
 ...       │
           ▼
11:30  ──► Xong task / dừng task → log time entry
           │   • duration, note, video (nếu cần), proof links
           │   • Cập nhật task progress / status (review/done)
           │
12:00  ──► Nghỉ trưa → Office Time (Start lunch)
           │
13:00  ──► Tiếp tục → Office Time (Start work 2)
 ...       │
           ▼
17:00  ──► Check-out → Office Time (End workday)
           │
17:30  ──► Review Time Logs hôm nay → submit
           │
           ├── Có việc lặp lại nhiều?
           │   └─► Đề xuất Template (Module 06b)
           │
           └── Tasks bị block?
               └─► Cập nhật reason_next_action, alert manager
```

### Manager (hằng tuần)

```
Thứ Hai:
  ├── Review Office Time tuần trước → Approve/Reject
  ├── Time Logs queue (approval_status = 'pending') → Approve/Reject + rate
  ├── Template Suggestions queue → Approve/Reject (tạo template nếu OK)
  └── Estimate Flags dashboard → Accept/Dismiss để cập nhật template estimate

Hằng ngày:
  ├── Tasks board: monitor overdue, blocked tasks
  ├── Assign task mới vào backlog cho team
  ├── Review tasks ở status `review` → đẩy lên `done` hoặc trả về `in_progress`
  └── Rate quality 1–5 trên time_logs khi duyệt
```

### Admin / Accountant (hằng tháng)

```
Cuối tháng:
  1. Hệ thống tự tính Summary (auto)
  2. Admin review Summary → Confirm
  3. Accountant export bảng lương → PDF/Excel
  4. Xử lý thanh toán → nhập Payments
  5. Duyệt Leave requests còn pending
  6. Review Performance Scores
  7. Cập nhật BonusM% nếu cần
```

---

## 17. Database Schema

```sql
-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,  -- SUPER_ADMIN, ADMIN, ...
    permissions JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE employees (
    id               SERIAL PRIMARY KEY,
    employee_code    VARCHAR(20) UNIQUE,  -- e.g. "EMP015"
    full_name        VARCHAR(100) NOT NULL,
    avatar_url       TEXT,
    department       VARCHAR(100),
    role_id          INT REFERENCES roles(id),
    company          VARCHAR(100),
    email_company    VARCHAR(150) UNIQUE NOT NULL,
    email_google     VARCHAR(150),
    email_private    VARCHAR(150),
    mobile_company   VARCHAR(20),
    pay_type         VARCHAR(20) CHECK (pay_type IN ('hourly', 'monthly', 'contract')),
    hourly_rate      DECIMAL(10,2),
    monthly_salary   DECIMAL(10,2),
    max_hours_month  INT DEFAULT 160,
    bonus_m_pct      DECIMAL(5,2) DEFAULT 0,
    bonus_a_pct      DECIMAL(5,2) DEFAULT 0,
    bonus_t_pct      DECIMAL(5,2) DEFAULT 0,
    drive_link_1     TEXT,
    drive_link_2     TEXT,
    drive_link_3     TEXT,
    drive_link_4     TEXT,
    start_date       DATE,
    manager_id       INT REFERENCES employees(id),
    status           VARCHAR(20) DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive', 'probation')),
    password_hash    TEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE salary_history (
    id           SERIAL PRIMARY KEY,
    employee_id  INT REFERENCES employees(id),
    field        VARCHAR(50),  -- 'hourly_rate', 'monthly_salary', 'role_id'
    old_value    TEXT,
    new_value    TEXT,
    changed_by   INT REFERENCES employees(id),
    changed_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TASK TEMPLATES (optional shortcuts)
-- ============================================================

CREATE TABLE task_templates (
    id                      SERIAL PRIMARY KEY,
    code                    VARCHAR(20) UNIQUE NOT NULL,  -- CODE_REVIEW, DAILY_STANDUP
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    default_task_type       VARCHAR(20) NOT NULL
                            CHECK (default_task_type IN
                              ('normal','learning','new_research','meeting',
                               'admin','billable_client','internal')),
    default_estimated_time  INT,            -- phút
    default_priority        VARCHAR(20) DEFAULT 'normal'
                            CHECK (default_priority IN ('critical','high','normal','low')),
    requires_video          BOOLEAN,        -- nullable: NULL = follow task_type rule
    department              VARCHAR(50),
    link_template           TEXT,
    usage_count             INT DEFAULT 0,
    is_active               BOOLEAN DEFAULT TRUE,
    created_by              INT REFERENCES employees(id),
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_templates_active ON task_templates(is_active) WHERE is_active = TRUE;

-- ============================================================
-- TASKS  (unified — replaces task_library + work_list)
-- ============================================================

CREATE TABLE tasks (
    id                    SERIAL PRIMARY KEY,
    code                  VARCHAR(10) UNIQUE NOT NULL,  -- TSK-0001
    title                 VARCHAR(200) NOT NULL,
    description           TEXT,
    task_type             VARCHAR(20) NOT NULL DEFAULT 'normal'
                          CHECK (task_type IN
                            ('normal','learning','new_research','meeting',
                             'admin','billable_client','internal')),
    priority              VARCHAR(20) DEFAULT 'normal'
                          CHECK (priority IN ('critical','high','normal','low')),
    status                VARCHAR(20) NOT NULL DEFAULT 'backlog'
                          CHECK (status IN
                            ('backlog','in_progress','blocked','review','done','cancelled')),
    estimated_time        INT,                                 -- phút
    actual_time_total     INT NOT NULL DEFAULT 0,              -- auto sum from time_logs
    progress_pct          INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),

    parent_task_id        INT REFERENCES tasks(id) ON DELETE SET NULL,
    template_id           INT REFERENCES task_templates(id) ON DELETE SET NULL,

    assigned_to           INT REFERENCES employees(id) NOT NULL,
    assigned_by           INT REFERENCES employees(id) NOT NULL,
    customer_id           INT REFERENCES customers(id),
    project_id            INT,                                 -- references projects(id) if exists

    billable              BOOLEAN NOT NULL DEFAULT FALSE,
    hourly_rate_override  DECIMAL(10,2),
    requires_video        BOOLEAN NOT NULL DEFAULT FALSE,

    date_created          TIMESTAMP DEFAULT NOW(),
    date_started          DATE,
    due_date              DATE,
    date_completed        DATE,
    is_overdue            BOOLEAN DEFAULT FALSE,
    last_update           TIMESTAMP DEFAULT NOW(),
    reason_next_action    TEXT,

    -- Constraint: billable tasks must have a customer
    CONSTRAINT chk_billable_customer
      CHECK (NOT billable OR customer_id IS NOT NULL)
);

CREATE INDEX idx_tasks_assignee_status ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_due_overdue     ON tasks(due_date) WHERE status NOT IN ('done','cancelled');
CREATE INDEX idx_tasks_customer        ON tasks(customer_id) WHERE billable = TRUE;
CREATE INDEX idx_tasks_parent          ON tasks(parent_task_id);

-- ============================================================
-- TIME LOGS  (replaces work_reports)
-- ============================================================

CREATE TABLE time_logs (
    id                    SERIAL PRIMARY KEY,
    task_id               INT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,  -- ENFORCE: every log must link to a task
    employee_id           INT NOT NULL REFERENCES employees(id),
    date                  DATE NOT NULL,
    start_time            TIME,
    end_time              TIME,
    duration_minutes      INT NOT NULL CHECK (duration_minutes > 0),
    quantity              INT DEFAULT 1,
    note                  TEXT,
    completion_pct_after  INT CHECK (completion_pct_after BETWEEN 0 AND 100),
    task_status_after     VARCHAR(20)
                          CHECK (task_status_after IN
                            ('in_progress','blocked','review','done')),

    -- proof
    video_count           INT DEFAULT 0,
    video_duration        INT DEFAULT 0,
    video_link            TEXT,
    proof_links           TEXT[],

    -- approval
    credited_minutes      INT,                                 -- NULL = pending
    approval_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (approval_status IN
                            ('auto_approved','pending','approved','rejected')),
    approved_by           INT REFERENCES employees(id),
    approved_minutes      INT,
    approved_at           TIMESTAMP,
    rejection_reason      TEXT,
    rating                INT CHECK (rating BETWEEN 1 AND 5),

    created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_logs_task           ON time_logs(task_id);
CREATE INDEX idx_time_logs_employee_date  ON time_logs(employee_id, date);
CREATE INDEX idx_time_logs_pending        ON time_logs(approval_status) WHERE approval_status = 'pending';

-- Trigger: auto-update tasks.actual_time_total when time_logs change
-- (implementation: AFTER INSERT/UPDATE/DELETE on time_logs → UPDATE tasks SET actual_time_total = ...)

-- Trigger: prevent INSERT into time_logs if tasks.status IN ('done','cancelled')

-- ============================================================
-- OFFICE TIME
-- ============================================================

CREATE TABLE office_time (
    id                  SERIAL PRIMARY KEY,
    date                DATE NOT NULL,
    employee_id         INT REFERENCES employees(id) NOT NULL,
    start_work_1        TIME,
    start_lunch         TIME,
    start_work_2        TIME,
    start_afternoon_break TIME,
    start_work_3        TIME,
    end_workday         TIME,
    time_logs_total     INT DEFAULT 0,  -- auto from time_logs (sum duration_minutes for date)
    actual_worked       INT,            -- computed from timestamps
    delta               INT,            -- computed
    explanation         TEXT,
    approval_status     VARCHAR(20) DEFAULT 'pending'
                        CHECK (approval_status IN ('pending','approved','rejected')),
    approved_by         INT REFERENCES employees(id),
    approved_delta      INT,
    approved_at         TIMESTAMP,
    UNIQUE (date, employee_id)
);

-- ============================================================
-- TASK REVIEWS  (Module 06: template suggestions + estimate flags)
-- ============================================================

CREATE TABLE template_suggestions (
    id                    SERIAL PRIMARY KEY,
    date                  DATE NOT NULL DEFAULT CURRENT_DATE,
    employee_id           INT NOT NULL REFERENCES employees(id),
    proposed_code         VARCHAR(20) NOT NULL,
    proposed_title        VARCHAR(200) NOT NULL,
    description           TEXT NOT NULL,
    proposed_task_type    VARCHAR(20) NOT NULL
                          CHECK (proposed_task_type IN
                            ('normal','learning','new_research','meeting',
                             'admin','billable_client','internal')),
    proposed_estimate     INT NOT NULL,
    evidence_video_link   TEXT NOT NULL,
    example_task_ids      INT[],
    reason_note           TEXT NOT NULL,
    status                VARCHAR(20) DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
    reviewed_by           INT REFERENCES employees(id),
    created_template_id   INT REFERENCES task_templates(id),
    decision_note         TEXT,
    bonus_time            INT DEFAULT 0,
    reviewed_at           TIMESTAMP,
    created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estimate_flags (
    id                    SERIAL PRIMARY KEY,
    template_id           INT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
    flagged_at            TIMESTAMP DEFAULT NOW(),
    current_estimate      INT NOT NULL,
    suggested_estimate    INT NOT NULL,
    sample_size           INT NOT NULL,
    status                VARCHAR(20) DEFAULT 'open'
                          CHECK (status IN ('open','accepted','dismissed')),
    reviewed_by           INT REFERENCES employees(id),
    reviewed_at           TIMESTAMP
);

-- ============================================================
-- SUMMARY & PAYMENTS
-- ============================================================

CREATE TABLE salary_summary (
    id                       SERIAL PRIMARY KEY,
    employee_id              INT REFERENCES employees(id) NOT NULL,
    month                    INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                     INT NOT NULL,
    -- hours
    credited_hours           DECIMAL(8,2) DEFAULT 0,   -- SUM(time_logs.credited_minutes)/60
    work_hours_real          DECIMAL(8,2) DEFAULT 0,   -- from office_time
    learn_hours              DECIMAL(8,2) DEFAULT 0,   -- WHERE task.task_type = 'learning'
    billable_hours           DECIMAL(8,2) DEFAULT 0,   -- WHERE task.billable = TRUE
    billable_amount          DECIMAL(10,2) DEFAULT 0,  -- sum of billable × rate
    delta_hours              DECIMAL(8,2) DEFAULT 0,   -- real - credited
    -- payroll (€)
    salary_calc              DECIMAL(10,2) DEFAULT 0,
    bonus_calc               DECIMAL(10,2) DEFAULT 0,
    total_calc               DECIMAL(10,2) DEFAULT 0,
    salary_paid              DECIMAL(10,2) DEFAULT 0,
    bonus_paid               DECIMAL(10,2) DEFAULT 0,
    money_received           DECIMAL(10,2) DEFAULT 0,
    delta_money              DECIMAL(10,2) DEFAULT 0,
    -- performance scores
    score_work_speed         DECIMAL(5,2),
    score_quality            DECIMAL(5,2),
    score_learning           DECIMAL(5,2),
    score_deadlines          DECIMAL(5,2),
    score_initiative         DECIMAL(5,2),
    total_score              DECIMAL(5,2),
    -- task stats
    total_tasks              INT DEFAULT 0,
    completed_tasks          INT DEFAULT 0,
    open_tasks               INT DEFAULT 0,
    overdue_tasks            INT DEFAULT 0,
    total_actual_time_h      DECIMAL(8,2) DEFAULT 0,
    total_credited_time_h    DECIMAL(8,2) DEFAULT 0,
    completion_rate          DECIMAL(5,2) DEFAULT 0,
    tasks_by_type            JSONB,                    -- breakdown by task_type
    -- status
    confirmed_by             INT REFERENCES employees(id),
    confirmed_at             TIMESTAMP,
    UNIQUE (employee_id, month, year)
);

CREATE TABLE payments (
    id           SERIAL PRIMARY KEY,
    date         DATE NOT NULL,
    employee_id  INT REFERENCES employees(id) NOT NULL,
    type         VARCHAR(20) CHECK (type IN ('salary','bonus','advance','deduction','other')),
    amount       DECIMAL(10,2) NOT NULL,
    notes        TEXT,
    summary_month INT,
    summary_year  INT,
    created_by   INT REFERENCES employees(id),
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEAVE MANAGEMENT
-- ============================================================

CREATE TABLE leaves (
    id               SERIAL PRIMARY KEY,
    date             DATE NOT NULL,
    employee_id      INT REFERENCES employees(id) NOT NULL,
    type             VARCHAR(20) CHECK (type IN ('vacation','holiday','illness','other')),
    requested_hours  DECIMAL(5,2) NOT NULL,
    reason           TEXT,
    evidence_link    TEXT,
    status           VARCHAR(20) DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
    approved_hours   DECIMAL(5,2),
    approval_note    TEXT,
    approved_by      INT REFERENCES employees(id),
    approved_at      TIMESTAMP,
    money            DECIMAL(10,2),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS & MESSAGES
-- ============================================================

CREATE TABLE customers (
    id                  SERIAL PRIMARY KEY,
    cust_id             VARCHAR(20) UNIQUE,
    customer_name       VARCHAR(100),
    business_name       VARCHAR(200),
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(150),
    address             TEXT,
    city                VARCHAR(100),
    plz                 VARCHAR(10),
    website             TEXT,
    vat_tax_id          VARCHAR(50),
    preferred_language  VARCHAR(20),
    status              VARCHAR(20) DEFAULT 'active',
    responsible_staff   INT REFERENCES employees(id),
    last_contact_date   DATE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id               SERIAL PRIMARY KEY,
    date             DATE NOT NULL,
    time             TIME,
    channel          VARCHAR(20),
    customer_id      INT REFERENCES customers(id),
    subject          VARCHAR(200),
    message_summary  TEXT,
    action_required  TEXT,
    assigned_to      INT REFERENCES employees(id),
    due_date         DATE,
    status           VARCHAR(20) DEFAULT 'open',
    link_file        TEXT,
    follow_up_note   TEXT,
    closed_date      DATE,
    tags             TEXT,
    value_type       CHAR(1) CHECK (value_type IN ('A','B','C')),
    company_answer   TEXT,
    support_time     INT,
    benefit_time     INT,
    net_time         INT,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PASSWORD VAULT
-- ============================================================

CREATE TABLE password_vault (
    id                  SERIAL PRIMARY KEY,
    scope               VARCHAR(20) CHECK (scope IN ('company','customer')),
    entity_name         VARCHAR(200),
    customer_id         INT REFERENCES customers(id),
    service_app         VARCHAR(100),
    login_url           TEXT,
    username            VARCHAR(200),
    email_used          VARCHAR(150),
    password_encrypted  TEXT NOT NULL,  -- AES-256
    two_fa_method       VARCHAR(100),
    two_fa_backup       TEXT,
    owner_id            INT REFERENCES employees(id),
    created_date        DATE DEFAULT CURRENT_DATE,
    last_updated        DATE DEFAULT CURRENT_DATE,
    rotation_days       INT,
    notes               TEXT
);

CREATE TABLE vault_access_log (
    id           SERIAL PRIMARY KEY,
    vault_id     INT REFERENCES password_vault(id),
    accessed_by  INT REFERENCES employees(id),
    accessed_at  TIMESTAMP DEFAULT NOW(),
    action       VARCHAR(20)  -- 'view_password', 'copy', 'edit'
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id           SERIAL PRIMARY KEY,
    table_name   VARCHAR(50),
    record_id    INT,
    action       VARCHAR(20),  -- INSERT, UPDATE, DELETE
    old_data     JSONB,
    new_data     JSONB,
    changed_by   INT REFERENCES employees(id),
    changed_at   TIMESTAMP DEFAULT NOW(),
    ip_address   INET
);
```

---

## 18. Tech Stack

### Frontend

| Công nghệ | Mục đích |
|-----------|---------|
| **Next.js 14** (App Router) | Framework chính, SSR + CSR |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **shadcn/ui** | Component library |
| **React Query (TanStack)** | Data fetching, caching |
| **Recharts** | Biểu đồ hiệu suất, lương |
| **React Hook Form + Zod** | Form validation |
| **date-fns** | Xử lý ngày giờ |

### Backend

| Công nghệ | Mục đích |
|-----------|---------|
| **Next.js API Routes** | REST API |
| **Prisma ORM** | Database access |
| **NextAuth.js** | Authentication, session |
| **bcrypt** | Hash password |
| **node-aes** / **crypto** | Mã hóa password vault |
| **node-cron** | Auto tính salary cuối tháng |
| **nodemailer** | Gửi email thông báo |

### Database & Infrastructure

| Công nghệ | Mục đích |
|-----------|---------|
| **PostgreSQL** | Database chính |
| **Redis** | Session, cache Summary |
| **Vercel** | Deploy frontend + API |
| **Supabase / Railway** | PostgreSQL hosting |
| **AWS S3 / Cloudflare R2** | Upload avatar |

---

## 19. API Endpoints

### Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Employees

```
GET    /api/employees              -- list (filtered by role scope)
POST   /api/employees              -- create (ADMIN, HR)
GET    /api/employees/:id          -- detail
PUT    /api/employees/:id          -- update
DELETE /api/employees/:id          -- soft delete (SUPER_ADMIN)
GET    /api/employees/:id/summary  -- performance + salary summary
```

### Tasks

```
GET    /api/tasks                       -- list (scope by role); filters: ?status=&type=&assignee=&customer=&overdue=
POST   /api/tasks                       -- create (manual or from template_id)
GET    /api/tasks/:id                   -- detail incl. time_logs + sub-tasks
PUT    /api/tasks/:id                   -- update
DELETE /api/tasks/:id                   -- soft delete (status=cancelled)
PATCH  /api/tasks/:id/status            -- update status only
PATCH  /api/tasks/:id/assign            -- reassign to another employee
GET    /api/tasks/:id/time-logs         -- all logs of this task
POST   /api/tasks/bulk                  -- create multiple small tasks (quick-create)
GET    /api/tasks/board                 -- kanban board view (grouped by status)
```

### Time Logs

```
GET    /api/time-logs                   -- ?date=&employee=&task=&month=&approval_status=
POST   /api/time-logs                   -- create log (task_id required)
GET    /api/time-logs/:id
PUT    /api/time-logs/:id               -- only own + within edit window (24h)
DELETE /api/time-logs/:id
PATCH  /api/time-logs/:id/approve       -- Manager: approved_minutes + rating
PATCH  /api/time-logs/:id/reject        -- Manager: rejection_reason
GET    /api/time-logs/pending           -- queue cho Manager (approval_status='pending')
GET    /api/time-logs/timer/start       -- (optional) start timer for task
GET    /api/time-logs/timer/stop        -- (optional) stop timer → create log
```

### Task Templates

```
GET    /api/task-templates              -- list (filter ?department=&active=)
POST   /api/task-templates              -- create (Manager+)
PUT    /api/task-templates/:id
PATCH  /api/task-templates/:id/archive  -- set is_active=FALSE
```

### Task Reviews

```
GET    /api/template-suggestions        -- ?status=pending
POST   /api/template-suggestions        -- Employee đề xuất template
PATCH  /api/template-suggestions/:id/approve   -- Manager approve, auto-create template
PATCH  /api/template-suggestions/:id/reject

GET    /api/estimate-flags              -- dashboard: ?status=open
PATCH  /api/estimate-flags/:id/accept   -- update template's default_estimated_time
PATCH  /api/estimate-flags/:id/dismiss
```

### Office Time

```
GET    /api/office-time            -- ?date=&employee=
POST   /api/office-time            -- check-in/check-out
PUT    /api/office-time/:id
PATCH  /api/office-time/:id/approve
```

### Summary & Salary

```
GET    /api/summary/:employeeId/:year/:month   -- monthly summary
POST   /api/summary/calculate                  -- trigger recalculate
PATCH  /api/summary/:id/confirm                -- Admin confirm
GET    /api/summary/export                     -- Excel/PDF export
```

### Payments

```
GET    /api/payments               -- list
POST   /api/payments               -- create payment record
GET    /api/payments/:id
```

### Leave

```
GET    /api/leave                  -- list
POST   /api/leave                  -- request leave
PATCH  /api/leave/:id/approve      -- Manager approve
GET    /api/leave/balance/:id      -- remaining leave days
```

### Admin

```
GET    /api/admin/dashboard        -- system-wide stats
GET    /api/admin/audit-log        -- audit trail
GET    /api/work-rules             -- list rules
```

---

## 20. Wireframes — Giao Diện Từng Module

> Xem file riêng: `HR-SYSTEM-WIREFRAMES.md`

---

## Phụ Lục — Mapping Từ Excel Sang Web

| Sheet Excel | Module Web | Ghi chú |
|-------------|------------|---------|
| Setup | Module 01 — Employees | Mỗi nhân viên 1 record |
| Work list | Module 02 — Tasks | Mọi WL-xxxx cũ → TSK-xxxx; thêm task_type, status mở rộng |
| Work report | Module 03 — Time Logs | Mọi log bắt buộc gắn task_id |
| Office time approval | Module 04 — Office Time | Check-in/out, không đổi |
| Task library | Module 05 — Task Templates | Tùy chọn — chỉ template hóa task lặp lại nhiều |
| Missing tasks (auto/manual) | — (gộp vào Tasks) | Tạo task mới với task_type='new_research' |
| Time check for tasks | Module 06 — Template Suggestions / Estimate Flags | Chỉ áp dụng cho template (không phải task riêng lẻ) |
| Summary | Module 07 — Summary | Auto tính từ time_logs + tasks |
| Payments | Module 08 — Payments | Ghi nhận đã trả |
| Vacation, holiday, illness | Module 09 — Leave | Workflow xin nghỉ |
| Customers | Module 10 — Customers | CRM đơn giản |
| Messages | Module 11 — Messages | Communication log |
| Password | Module 12 — Password Vault | Mã hóa AES-256 |
| Work rules | Module 13 — Work Rules | Chính sách công ty |

### Task ID 1001 / 2001 / 2002 (Excel) → Task Type (Web)

| ID Excel | Ý nghĩa cũ | Hệ thống mới |
|----------|-----------|--------------|
| `1001` | Học & Tìm hiểu | Tạo Task với `task_type = 'learning'`. Có thể dùng template `LEARNING_SESSION` |
| `2001` / `2002` | Việc mới chưa có chuẩn | Tạo Task với `task_type = 'new_research'`. Bắt buộc video. |
| `DEV*` / `ADM*` | Catalog việc lặp lại | Tạo `task_templates.code = DEV_*` / `ADM_*` nếu thực sự lặp; còn lại tạo task adhoc |

---

*Tài liệu này sẽ được cập nhật song song với quá trình phát triển hệ thống.*

# 1. Tạo database PostgreSQL tên hr_system
# (cần cài PostgreSQL trước nếu chưa có)

# 2. Tạo tables + seed data
cd hr-system
npm run db:push
npm run db:seed

# 3. Chạy dev server
npm run dev

Module 04 — Office Time (chấm công/quản lý giờ làm)
Test accounts (password: password123):
* admin@hung-it-solutions.com — SUPER_ADMIN
* manager@hung-it-solutions.com — MANAGER
* lanit@hung-it-solutions.com — TEAM_LEAD
* nv2@hung-it-solutions.com — EMPLOYEE
