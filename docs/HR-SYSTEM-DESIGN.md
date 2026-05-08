# HR Management System — Tài Liệu Thiết Kế Chi Tiết

> **Phiên bản:** 1.0  
> **Ngày tạo:** 2026-05-06  
> **Dựa trên:** HR-SYS_ĐL.xlsx  
> **Mục tiêu:** Chuyển đổi hệ thống Excel cá nhân thành Web App quản lý nhiều nhân viên với phân quyền đầy đủ

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Phân Quyền Theo Vai Trò (RBAC)](#2-phân-quyền-theo-vai-trò-rbac)
3. [Module 01 — Quản Lý Nhân Viên](#module-01--quản-lý-nhân-viên)
4. [Module 02 — Work List (Danh Sách Công Việc)](#module-02--work-list-danh-sách-công-việc)
5. [Module 03 — Work Report (Báo Cáo Hằng Ngày)](#module-03--work-report-báo-cáo-hằng-ngày)
6. [Module 04 — Office Time (Chấm Công)](#module-04--office-time-chấm-công)
7. [Module 05 — Task Library (Thư Viện Task)](#module-05--task-library-thư-viện-task)
8. [Module 06 — Missing Tasks & Time Check](#module-06--missing-tasks--time-check)
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

Xây dựng hệ thống quản lý nhân sự (HR) dạng Web App, thay thế hoàn toàn file Excel `HR-SYS_ĐL.xlsx`, hỗ trợ:

- **Nhiều nhân viên** làm việc đồng thời trên cùng hệ thống
- **Phân quyền** rõ ràng theo từng vị trí (Role-Based Access Control)
- **Tự động tính lương** dựa trên giờ công được duyệt (credited hours)
- **Quản lý task** — giao việc, theo dõi tiến độ, đánh giá chất lượng
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
│  │  [01] Employees    [02] Work List   [03] Work Report        │   │
│  │  [04] Office Time  [05] Task Lib    [06] Missing/TimeCheck  │   │
│  │  [07] Summary      [08] Payments    [09] Leave              │   │
│  │  [10] Customers    [11] Messages    [12] Passwords          │   │
│  │  [13] Work Rules                                            │   │
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
| **Data integrity** | Mọi thay đổi đều có audit log (ai, lúc nào, thay gì) |
| **Evidence-based** | Actual > Std time → bắt buộc video/link bằng chứng |
| **Approval workflow** | Giờ làm, nghỉ phép, missing task đều cần duyệt |
| **Auto-calculate** | Lương, bonus, performance score tính tự động |
| **Role isolation** | Mỗi role chỉ thấy/sửa đúng phần mình được phép |
| **Mobile-first** | Nhân viên có thể nhập báo cáo từ điện thoại |

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
02. Work List         │ ✅          │ ✅    │ 🟠      │ 🟠        │ 👤🟡     │ 🔴  │ 🔴
03. Work Report       │ ✅          │ ✅    │ 🟠🟡    │ 🟠🟡      │ 👤✅     │ 🔴  │ 🔴
04. Office Time       │ ✅          │ ✅    │ 🟡🟠    │ 🔴        │ 👤✅     │ 🔵  │ 🔵
05. Task Library      │ ✅          │ ✅    │ ✅      │ 🔵        │ 🔵       │ 🔴  │ 🔴
06. Missing Tasks     │ ✅          │ ✅    │ 🟡🟠    │ 🟡🟠      │ 👤✅     │ 🔴  │ 🔴
06. Time Check        │ ✅          │ ✅    │ 🟡🟠    │ 🟡🟠      │ 👤✅     │ 🔴  │ 🔴
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
  "work_report": { "create": true, "read": true, "update": true, "delete": false, "approve": true, "scope": "team" },
  "salary": { "create": false, "read": true, "update": false, "delete": false, "scope": "all" }
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

## Module 02 — Work List (Danh Sách Công Việc)

### Mô Tả

Danh sách đầu việc được giao cho nhân viên. Mỗi đầu việc có WL ID riêng, theo dõi tiến độ và trạng thái.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `wl_id` | VARCHAR(10) | Mã tự sinh: WL-0001, WL-0002 | auto |
| `date_assigned` | DATE | Ngày giao việc | ✅ |
| `title` | VARCHAR(200) | Tên đầu việc | ✅ |
| `description` | TEXT | Mô tả chi tiết | ✅ |
| `customer_id` | INT (FK) | Khách hàng liên quan | ❌ |
| `assigned_to` | INT (FK) | Nhân viên được giao | ✅ |
| `assigned_by` | INT (FK) | Người giao việc | ✅ |
| `priority` | ENUM | `critical` / `high` / `normal` / `low` | ✅ |
| `due_date` | DATE | Hạn hoàn thành | ❌ |
| `status` | ENUM | `not_started` / `in_progress` / `blocked` / `completed` / `cancelled` | ✅ |
| `progress_pct` | INT | % hoàn thành (0–100) | ✅ |
| `last_update` | TIMESTAMP | Lần cập nhật cuối | auto |
| `reason_next_action` | TEXT | Lý do / Bước tiếp theo | ❌ |
| `total_actual_time` | INT | Tổng giờ thực tế (phút, auto sum từ Work Report) | auto |
| `completed_date` | DATE | Ngày hoàn thành thực tế | ❌ |
| `is_overdue` | BOOLEAN | Auto: due_date < today AND status != completed | auto |

### Business Rules

- `wl_id` được hệ thống tự tạo, không nhập tay
- Khi giao việc mới → phải nhập ngay vào Work List (không chờ)
- `is_overdue` tính tự động mỗi ngày
- Nhân viên chỉ xem/cập nhật task của mình
- Manager/Team Lead xem toàn bộ task của team

### Trạng Thái Chuyển Đổi

```
not_started ──► in_progress ──► completed
                    │
                    ▼
                 blocked ──► in_progress
```

---

## Module 03 — Work Report (Báo Cáo Hằng Ngày)

### Mô Tả

Nhân viên nhập công việc đã làm theo Task ID. Hệ thống tự tính credited time, phát hiện bất thường và yêu cầu bằng chứng.

### Dữ Liệu

| Field | Type | Mô tả | Required |
|-------|------|--------|----------|
| `id` | INT | PK | auto |
| `date` | DATE | Ngày làm việc | ✅ |
| `employee_id` | INT (FK) | Nhân viên | ✅ |
| `task_id` | VARCHAR(20) | Task ID từ Task Library | ✅ |
| `quantity` | INT | Số lượng (default: 1) | ✅ |
| `task_name` | VARCHAR(200) | Auto từ Task Library | auto |
| `description` | TEXT | Mô tả thêm | ❌ |
| `std_time` | INT | Thời gian chuẩn (phút, từ Task Library) | auto |
| `actual_time` | INT | Thời gian thực tế (phút) | ✅ |
| `delta` | INT | = actual_time - std_time (auto) | auto |
| `credited_time` | INT | Giờ được ghi nhận (sau duyệt) | auto |
| `completion_pct` | INT | % hoàn thành (default: 100) | ✅ |
| `std_time_issue` | BOOLEAN | Đánh dấu cần review std time | auto |
| `video_count` | INT | Số video đã quay | ❌ |
| `video_duration` | INT | Tổng thời lượng video (phút) | ❌ |
| `video_link` | TEXT | Link Google Drive | Nếu required |
| `note` | TEXT | Ghi chú | ❌ |
| `link` | TEXT | Link tài liệu / output | ❌ |
| `wl_id` | VARCHAR(10) | Liên kết Work List | ❌ |
| `customer_id` | INT (FK) | Khách hàng | ❌ |
| `rating` | INT | Đánh giá của Manager (1–5) | ❌ |
| `created_at` | TIMESTAMP | Ngày tạo | auto |

### Business Rules — Credited Time

```
IF task_id IN ('2001', '2002') THEN
  -- Task mới chưa có trong library
  IF video_link IS NULL OR video_link = '' THEN
    credited_time = 0  -- không được tính giờ
  ELSE
    credited_time = approved_time  -- do Manager duyệt
  END IF

ELSE IF actual_time > std_time THEN
  -- Thực tế nhiều hơn chuẩn
  IF video_link IS NULL THEN
    credited_time = std_time  -- chỉ tính giờ chuẩn
  ELSE
    credited_time = approved_time  -- Manager quyết định
  END IF

ELSE
  credited_time = actual_time  -- bình thường, tự động
END IF
```

### Validation Rules

| Điều kiện | Yêu cầu | Hậu quả nếu vi phạm |
|-----------|---------|---------------------|
| `actual_time > std_time` | Video link bắt buộc | `credited_time = std_time` |
| `task_id = 2001` (việc mới) | Video + link tài liệu + note | `credited_time = 0` |
| `task_id = 1001` (học) | Link tài liệu + note + video | Không được tính giờ |
| `completion_pct < 100` | Ghi rõ `%` hoàn thành | WL progress cập nhật theo |
| 1 dòng = 1 task | Không gộp nhiều lần | Data integrity |

---

## Module 04 — Office Time (Chấm Công)

### Mô Tả

Ghi nhận thời gian làm việc thực tế (check-in/check-out), đối chiếu với Work Report, trình duyệt Manager.

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
| `work_report_total` | INT | Tổng phút từ Work Report (auto) | auto |
| `actual_worked` | INT | Phút làm thực tế (từ timestamps) | auto |
| `delta` | INT | = work_report_total - actual_worked | auto |
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

## Module 05 — Task Library (Thư Viện Task)

### Mô Tả

Danh mục chuẩn các loại task với thời gian chuẩn. Nhân viên chọn Task ID khi nhập Work Report.

### Dữ Liệu

| Field | Type | Mô tả |
|-------|------|--------|
| `task_id` | VARCHAR(20) | Mã task (DEV01, ADM01, ...) |
| `task_name` | VARCHAR(200) | Tên task |
| `description` | TEXT | Mô tả chi tiết |
| `std_time` | INT | Thời gian chuẩn (phút) |
| `department` | VARCHAR(50) | Phòng ban áp dụng |
| `link_template` | TEXT | Link template mẫu |
| `note1` | TEXT | Ghi chú 1 |
| `note2` | TEXT | Ghi chú 2 |
| `is_active` | BOOLEAN | Đang sử dụng hay đã ẩn |

### Task ID Mặc Định (từ file Excel)

| Prefix | Phòng ban |
|--------|-----------|
| `DEV` | Dev & Team Lead |
| `ADM` | Admin / Management |
| `1001` | Học & Tìm hiểu (đặc biệt) |
| `2001` | Việc mới chưa có trong library (đặc biệt) |
| `2002` | Việc mới dạng 2 (đặc biệt) |

---

## Module 06 — Missing Tasks & Time Check

### 6a. Missing Tasks

Nhân viên báo cáo task chưa có trong Task Library, kèm đề xuất thêm vào.

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `date` | DATE | Ngày phát sinh |
| `employee_id` | INT (FK) | Người báo cáo |
| `task_name` | VARCHAR(200) | Tên task đề xuất |
| `description` | TEXT | Mô tả công việc |
| `quantity` | INT | Số lượng lần thực hiện |
| `time_allotted` | INT | Thời gian đề xuất (phút) |
| `video_link` | TEXT | Video minh họa (bắt buộc) |
| `video_duration` | INT | Thời lượng video (phút) |
| `date_recorded` | DATE | Ngày quay video |
| `reason_note` | TEXT | Lý do / ghi chú |
| `status` | ENUM | `pending` / `approved` / `rejected` |
| `approved_time` | INT | Thời gian được duyệt (phút) |
| `bonus_time` | INT | Thời gian bonus thêm |
| `reviewed_by` | INT (FK) | Người duyệt |
| `decision_note` | TEXT | Ghi chú quyết định |

### 6b. Time Check for Tasks

Nhân viên đề xuất điều chỉnh thời gian chuẩn của một task.

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `date` | DATE | Ngày đề xuất |
| `employee_id` | INT (FK) | Người đề xuất |
| `task_id` | VARCHAR(20) | Task cần điều chỉnh |
| `current_std_time` | INT | Std time hiện tại (phút) |
| `actual_time` | INT | Thực tế đo được (phút) |
| `proposed_std_time` | INT | Đề xuất mới (phút) |
| `difference` | INT | = proposed - current |
| `reason` | TEXT | Lý do đề xuất |
| `video_link` | TEXT | Video minh chứng (bắt buộc) |
| `video_duration` | INT | Thời lượng video |
| `time_check_type` | ENUM | `increase` / `decrease` |
| `status` | ENUM | `pending` / `approved` / `rejected` |
| `reviewed_by` | INT (FK) | Người duyệt |
| `decision_note` | TEXT | Ghi chú quyết định |
| `approved_time` | INT | Thời gian được duyệt |

---

## Module 07 — Summary & Lương

### Mô Tả

Tổng hợp tự động toàn bộ giờ làm, hiệu suất và tính lương theo tháng. **Đây là module trung tâm.**

### Dữ Liệu Summary (tự động tính mỗi tháng)

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | INT | PK |
| `employee_id` | INT (FK) | Nhân viên |
| `month` | INT | Tháng (1–12) |
| `year` | INT | Năm |
| `credited_hours` | DECIMAL | Giờ được ghi nhận (dựa trên credited_time) |
| `work_hours_real` | DECIMAL | Giờ thực tế (từ Office Time) |
| `learn_hours` | DECIMAL | Giờ học (task 1001) |
| `delta_hours` | DECIMAL | = real - credited |
| `salary_calc` | DECIMAL | Lương tính (€) |
| `bonus_calc` | DECIMAL | Bonus tính (€) |
| `total_calc` | DECIMAL | Tổng tính (€) |
| `salary_paid` | DECIMAL | Đã trả thực tế (€) |
| `bonus_paid` | DECIMAL | Bonus đã trả (€) |
| `money_received` | DECIMAL | Tổng đã nhận (€) |
| `delta_money` | DECIMAL | = received - calc |

### 5 Chỉ Số Hiệu Suất

| Chỉ số | Cách tính | Trọng số |
|--------|-----------|---------|
| `work_speed` | Credited hours / Expected hours × 100 | 25% |
| `quality` | Avg rating từ Manager (1–5) × 20 | 25% |
| `learning_ability` | Giờ học có duyệt / tổng giờ × 100 | 15% |
| `adherence_to_deadlines` | Tasks đúng hạn / tổng tasks × 100 | 20% |
| `initiative` | Missing tasks được duyệt × hệ số | 15% |
| **`total_score`** | Tổng có trọng số (0–100) | 100% |

### Công Thức Tính Lương

```
-- Hourly
salary_calc = MIN(credited_hours, max_hours_month) × hourly_rate

-- Monthly  
salary_calc = monthly_salary × (credited_hours / expected_hours)

-- Bonus
bonus_calc = salary_calc × (bonus_m_pct + bonus_a_pct + bonus_t_pct) / 100

-- Total
total_calc = salary_calc + bonus_calc
```

### Thống Kê Work List trong Summary

| Metric | Mô tả |
|--------|--------|
| `total_tasks` | Tổng tasks trong kỳ |
| `completed_tasks` | Tasks đã hoàn thành |
| `open_tasks` | Tasks đang mở |
| `overdue_tasks` | Tasks quá hạn |
| `blocked_tasks` | Tasks bị chặn |
| `due_in_3_days` | Tasks sắp đến hạn |
| `avg_progress` | % tiến độ trung bình tasks đang mở |
| `completion_rate` | % tasks hoàn thành / tổng |
| `total_actual_time_h` | Tổng giờ thực tế (từ Work Report) |

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
08:00  ──► Nhận task mới → Cập nhật Work List
           │
09:00  ──► Làm việc → nhập Work Report (Task ID + Actual time)
 ...       │
           ▼
12:00  ──► Nghỉ trưa → Office Time (Start lunch)
           │
13:00  ──► Tiếp tục → Office Time (Start work 2)
 ...       │
           ▼
17:00  ──► Check-out → Office Time (End workday)
           │
17:30  ──► Review Work Report → submit
           │
           ├── Có task chưa trong library?
           │   └─► Thêm vào Missing Tasks + video
           │
           └── Actual >> Std time?
               └─► Thêm Time Check + video evidence
```

### Manager (hằng tuần)

```
Thứ Hai:
  ├── Review Office Time tuần trước → Approve/Reject
  ├── Review Missing Tasks → Approve/Reject
  └── Review Time Check → Approve/Reject + adjust std time

Hằng ngày:
  ├── Monitor Work List (overdue, blocked)
  ├── Rate Work Report (quality score)
  └── Assign task mới nếu cần
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
-- TASK LIBRARY
-- ============================================================

CREATE TABLE task_library (
    id            SERIAL PRIMARY KEY,
    task_id       VARCHAR(20) UNIQUE NOT NULL,  -- DEV01, ADM01, 1001
    task_name     VARCHAR(200) NOT NULL,
    description   TEXT,
    std_time      INT NOT NULL,  -- phút
    department    VARCHAR(50),
    link_template TEXT,
    note1         TEXT,
    note2         TEXT,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- WORK LIST
-- ============================================================

CREATE TABLE work_list (
    id                 SERIAL PRIMARY KEY,
    wl_id              VARCHAR(10) UNIQUE NOT NULL,  -- WL-0001
    date_assigned      DATE NOT NULL,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    customer_id        INT REFERENCES customers(id),
    assigned_to        INT REFERENCES employees(id) NOT NULL,
    assigned_by        INT REFERENCES employees(id) NOT NULL,
    priority           VARCHAR(20) DEFAULT 'normal'
                       CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    due_date           DATE,
    status             VARCHAR(20) DEFAULT 'not_started'
                       CHECK (status IN ('not_started','in_progress','blocked','completed','cancelled')),
    progress_pct       INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    last_update        TIMESTAMP DEFAULT NOW(),
    reason_next_action TEXT,
    total_actual_time  INT DEFAULT 0,  -- auto sum, phút
    completed_date     DATE,
    is_overdue         BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- WORK REPORT
-- ============================================================

CREATE TABLE work_reports (
    id              SERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    employee_id     INT REFERENCES employees(id) NOT NULL,
    task_id         VARCHAR(20) REFERENCES task_library(task_id),
    quantity        INT DEFAULT 1,
    task_name       VARCHAR(200),  -- auto from task_library
    description     TEXT,
    std_time        INT,           -- auto from task_library × quantity
    actual_time     INT NOT NULL,
    delta           INT,           -- computed: actual - std
    credited_time   INT,           -- after approval logic
    completion_pct  INT DEFAULT 100,
    std_time_issue  BOOLEAN DEFAULT FALSE,
    video_count     INT DEFAULT 0,
    video_duration  INT DEFAULT 0,
    video_link      TEXT,
    note            TEXT,
    link            TEXT,
    link2           TEXT,
    link3           TEXT,
    link4           TEXT,
    wl_id           VARCHAR(10) REFERENCES work_list(wl_id),
    customer_id     INT REFERENCES customers(id),
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    created_at      TIMESTAMP DEFAULT NOW()
);

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
    work_report_total   INT DEFAULT 0,  -- auto from work_reports
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
-- MISSING TASKS & TIME CHECK
-- ============================================================

CREATE TABLE missing_tasks (
    id              SERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    employee_id     INT REFERENCES employees(id) NOT NULL,
    task_name       VARCHAR(200) NOT NULL,
    description     TEXT,
    quantity        INT DEFAULT 1,
    time_allotted   INT,
    video_link      TEXT NOT NULL,
    video_duration  INT,
    date_recorded   DATE,
    reason_note     TEXT,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    approved_time   INT,
    bonus_time      INT DEFAULT 0,
    reviewed_by     INT REFERENCES employees(id),
    decision_note   TEXT,
    reviewed_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_checks (
    id                SERIAL PRIMARY KEY,
    date              DATE NOT NULL,
    employee_id       INT REFERENCES employees(id) NOT NULL,
    task_id           VARCHAR(20) REFERENCES task_library(task_id),
    current_std_time  INT NOT NULL,
    actual_time       INT NOT NULL,
    proposed_std_time INT NOT NULL,
    difference        INT,
    reason            TEXT,
    video_link        TEXT NOT NULL,
    video_duration    INT,
    time_check_type   VARCHAR(20) CHECK (time_check_type IN ('increase','decrease')),
    status            VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected')),
    reviewed_by       INT REFERENCES employees(id),
    decision_note     TEXT,
    approved_time     INT,
    reviewed_at       TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SUMMARY & PAYMENTS
-- ============================================================

CREATE TABLE salary_summary (
    id                   SERIAL PRIMARY KEY,
    employee_id          INT REFERENCES employees(id) NOT NULL,
    month                INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                 INT NOT NULL,
    credited_hours       DECIMAL(8,2) DEFAULT 0,
    work_hours_real      DECIMAL(8,2) DEFAULT 0,
    learn_hours          DECIMAL(8,2) DEFAULT 0,
    delta_hours          DECIMAL(8,2) DEFAULT 0,
    salary_calc          DECIMAL(10,2) DEFAULT 0,
    bonus_calc           DECIMAL(10,2) DEFAULT 0,
    total_calc           DECIMAL(10,2) DEFAULT 0,
    salary_paid          DECIMAL(10,2) DEFAULT 0,
    bonus_paid           DECIMAL(10,2) DEFAULT 0,
    money_received       DECIMAL(10,2) DEFAULT 0,
    delta_money          DECIMAL(10,2) DEFAULT 0,
    -- performance scores
    score_work_speed     DECIMAL(5,2),
    score_quality        DECIMAL(5,2),
    score_learning       DECIMAL(5,2),
    score_deadlines      DECIMAL(5,2),
    score_initiative     DECIMAL(5,2),
    total_score          DECIMAL(5,2),
    -- work list stats
    total_tasks          INT DEFAULT 0,
    completed_tasks      INT DEFAULT 0,
    open_tasks           INT DEFAULT 0,
    overdue_tasks        INT DEFAULT 0,
    total_actual_time_h  DECIMAL(8,2) DEFAULT 0,
    completion_rate      DECIMAL(5,2) DEFAULT 0,
    -- status
    confirmed_by         INT REFERENCES employees(id),
    confirmed_at         TIMESTAMP,
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

### Work List

```
GET    /api/work-list              -- list (scope by role)
POST   /api/work-list              -- create
GET    /api/work-list/:id
PUT    /api/work-list/:id
DELETE /api/work-list/:id
PATCH  /api/work-list/:id/status   -- update status only
```

### Work Report

```
GET    /api/work-report            -- ?date=&employee=&month=
POST   /api/work-report            -- submit daily report
GET    /api/work-report/:id
PUT    /api/work-report/:id
DELETE /api/work-report/:id
PATCH  /api/work-report/:id/rate   -- Manager rating
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
POST   /api/task-library           -- add/update tasks
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
| Work list | Module 02 — Work List | WL ID tự động |
| Work report | Module 03 — Work Report | Nhập hằng ngày |
| Office time approval | Module 04 — Office Time | Check-in/out |
| Task library | Module 05 — Task Library | Admin quản lý |
| Missing tasks auto | Module 06 — Missing Tasks | Workflow duyệt |
| Missing tasks | Module 06 — Missing Tasks | Manual |
| Time check for tasks | Module 06 — Time Check | Đề xuất điều chỉnh |
| Summary | Module 07 — Summary | Auto tính |
| Payments | Module 08 — Payments | Ghi nhận đã trả |
| Vacation, holiday, illness | Module 09 — Leave | Workflow xin nghỉ |
| Customers | Module 10 — Customers | CRM đơn giản |
| Messages | Module 11 — Messages | Communication log |
| Password | Module 12 — Password Vault | Mã hóa AES-256 |
| Work rules | Module 13 — Work Rules | Chính sách công ty |

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
