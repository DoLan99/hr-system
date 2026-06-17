# Luồng Công Việc — Task Management

> Tài liệu mô tả toàn bộ luồng vận hành hệ thống quản lý công việc (Task),
> từ khi tạo task đến khi hoàn thành, bao gồm phân quyền, timer, duyệt giờ,
> sprint, và các tính năng cộng tác.

---

## Mục lục

1. [Tổng quan luồng](#1-tổng-quan-luồng)
2. [Vòng đời trạng thái Task](#2-vòng-đời-trạng-thái-task)
3. [Bước 1 — Tạo Task](#3-bước-1--tạo-task)
4. [Bước 2 — Nhận & Xem Task](#4-bước-2--nhận--xem-task)
5. [Bước 3 — Bắt đầu làm việc (Timer)](#5-bước-3--bắt-đầu-làm-việc-timer)
6. [Bước 4 — Dừng Timer & Ghi nhận thời gian](#6-bước-4--dừng-timer--ghi-nhận-thời-gian)
7. [Bước 5 — Duyệt Time Log](#7-bước-5--duyệt-time-log)
8. [Bước 6 — Hoàn thành Task](#8-bước-6--hoàn-thành-task)
9. [Sprint Workflow](#9-sprint-workflow)
10. [Checklist](#10-checklist)
11. [Dependencies (Liên kết Task)](#11-dependencies-liên-kết-task)
12. [Watchers (Theo dõi)](#12-watchers-theo-dõi)
13. [Attachments (Đính kèm)](#13-attachments-đính-kèm)
14. [Recurrence (Task lặp lại)](#14-recurrence-task-lặp-lại)
15. [Phân quyền chi tiết](#15-phân-quyền-chi-tiết)
16. [Luồng Happy Path đầy đủ](#16-luồng-happy-path-đầy-đủ)

---

## 1. Tổng quan luồng

```
MANAGER tạo task
       │
       ▼
  [BACKLOG] ──── Nhân viên nhận ────► [IN_PROGRESS] ──── Dừng timer ────► [REVIEW]
                                            │                                  │
                                       Bị chặn                           Manager duyệt
                                            │                                  │
                                       [BLOCKED]                          [DONE] ✓
                                            │
                                       Unblock
                                            │
                                      [IN_PROGRESS]

  Bất kỳ trạng thái nào ──── Manager hủy ────► [CANCELLED]
```

**Các role trong hệ thống:**

| Role | Mô tả |
|---|---|
| `ADMIN` / `SUPER_ADMIN` | Toàn quyền trên mọi task trong org |
| `MANAGER` / `TEAM_LEAD` / `SUB_MANAGER` | Tạo task, giao việc, duyệt giờ, quản lý sprint |
| `EMPLOYEE` / `FREELANCER` / `INTERN` | Chỉ thấy và thao tác trên task được giao |

---

## 2. Vòng đời trạng thái Task

```
                    ┌─────────────────────────────┐
                    │         BACKLOG              │  ← Trạng thái mặc định khi tạo
                    └──────────────┬──────────────┘
                                   │
                        Nhân viên bấm "Bắt đầu"
                        POST /api/tasks/[id]/start
                                   │
                    ┌──────────────▼──────────────┐
                    │        IN_PROGRESS           │  ← Timer đang chạy
                    └──────┬───────────────┬───────┘
                           │               │
              Dừng → BLOCKED        Dừng → REVIEW
                           │               │
              ┌────────────▼───┐    ┌──────▼──────────────┐
              │    BLOCKED     │    │       REVIEW         │
              │  (chờ unblock) │    │  (chờ manager xem)  │
              └────────┬───────┘    └──────────┬──────────┘
                       │                       │
               Manager unblock          Manager approve
                       │                       │
                       └───────────┬───────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │            DONE              │  ← dateCompleted = now
                    └─────────────────────────────┘

  ──────────────────────────────────────────────────────
  CANCELLED  ← Manager có thể hủy từ BẤT KỲ trạng thái nào
  ──────────────────────────────────────────────────────
```

**Bảng chuyển trạng thái:**

| Từ | Sang | Ai thực hiện | Cách thực hiện |
|---|---|---|---|
| `BACKLOG` | `IN_PROGRESS` | Nhân viên (assignee) | Bấm nút "Bắt đầu" |
| `BLOCKED` | `IN_PROGRESS` | Nhân viên / Manager | Bấm lại "Bắt đầu" |
| `IN_PROGRESS` | `BLOCKED` | Nhân viên | Dừng timer → chọn status BLOCKED |
| `IN_PROGRESS` | `REVIEW` | Nhân viên | Dừng timer → chọn status REVIEW |
| `IN_PROGRESS` | `DONE` | Nhân viên | Dừng timer → chọn status DONE |
| `REVIEW` | `DONE` | Manager | Sửa status trực tiếp |
| `REVIEW` | `IN_PROGRESS` | Manager | Trả lại để sửa |
| Bất kỳ | `CANCELLED` | Manager | Sửa status trực tiếp |

---

## 3. Bước 1 — Tạo Task

### Ai thực hiện
Manager, Team Lead, Admin.

### Các bước thực hiện

1. Vào menu **Công việc → Tasks** (`/tasks`)
2. Bấm nút **"+ Tạo task"**
3. Điền thông tin:

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `title` | ✓ | Tên công việc |
| `taskType` | ✓ | Loại: NORMAL / LEARNING / NEW_RESEARCH / MEETING / ADMIN / BILLABLE_CLIENT |
| `priority` | ✓ | Mức độ: CRITICAL / HIGH / NORMAL / LOW |
| `assignedTo` | ✓ | Nhân viên nhận việc |
| `dueDate` | — | Hạn hoàn thành |
| `estimatedTime` | — | Thời gian ước tính (phút) |
| `description` | — | Mô tả chi tiết (rich text) |
| `storyPoints` | — | Điểm độ khó (1–100, dùng khi có sprint) |
| `sprintId` | — | Gán vào sprint nào |
| `customerId` | — | Liên kết khách hàng |
| `billable` | — | Có tính phí không |
| `requiresVideo` | — | Bắt buộc nộp video chứng minh |

4. Bấm **"Lưu"** → `POST /api/tasks`
5. Hệ thống tự sinh `code` dạng `TSK-0001`, trạng thái mặc định `BACKLOG`

### Kết quả
- Task xuất hiện trong danh sách của nhân viên được giao
- Nhân viên thấy task ở trạng thái `BACKLOG`

---

## 4. Bước 2 — Nhận & Xem Task

### Ai thực hiện
Nhân viên được giao (`assignedTo`).

### Các bước thực hiện

1. Vào **Công việc → Tasks** (`/tasks`)
2. Danh sách tự lọc chỉ hiển thị task được giao cho mình (Employee role)
3. Có thể lọc theo:
   - Trạng thái (BACKLOG / IN_PROGRESS / REVIEW / DONE...)
   - Mức độ ưu tiên
   - Sprint
   - Quá hạn
4. Click vào task → mở **Task Detail** (full page `/tasks/[id]`)
5. Xem đầy đủ: mô tả, checklist, file đính kèm, dependencies, comments

### Lưu ý
- Task `isOverdue = true` khi `dueDate < ngày hiện tại` và chưa DONE/CANCELLED
- Hệ thống tự đánh dấu overdue mỗi ngày khi tải danh sách

---

## 5. Bước 3 — Bắt đầu làm việc (Timer)

### Ai thực hiện
Nhân viên được giao (`assignedTo`).

### Điều kiện tiên quyết
- Task đang ở trạng thái `BACKLOG` hoặc `BLOCKED`
- Nhân viên **chưa có timer nào đang chạy** (hệ thống chỉ cho phép 1 timer tại 1 thời điểm)

### Các bước thực hiện

1. Mở task detail
2. Bấm nút **"Bắt đầu"** (nút Timer)
3. Hệ thống gọi `POST /api/tasks/[id]/start`

### Hệ thống tự động

```
TimeLog được tạo:
  taskId        = task.id
  employeeId    = người dùng hiện tại
  startTime     = now
  endTime       = null  (đang chạy)
  approvalStatus = PENDING

Task được cập nhật:
  status        = IN_PROGRESS
  dateStarted   = now  (chỉ set lần đầu tiên)
```

4. Nút timer chuyển sang hiển thị **thời gian đang đếm** (RunningTimerBadge)
5. Timer tiếp tục chạy ngay cả khi đóng trình duyệt (lưu server-side)

### Lỗi có thể gặp

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| `409 Conflict` | Đang có timer khác chạy | Dừng timer cũ trước |
| `403 Forbidden` | Không phải assignee | Liên hệ Manager |

---

## 6. Bước 4 — Dừng Timer & Ghi nhận thời gian

### Ai thực hiện
Nhân viên được giao (`assignedTo`).

### Các bước thực hiện

1. Bấm nút **"Dừng"** trên timer
2. Hệ thống mở form điền thông tin:

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `note` | — | Ghi chú công việc đã làm |
| `completionPctAfter` | — | % hoàn thành hiện tại (0–100) |
| `taskStatusAfter` | — | Trạng thái tiếp theo của task |
| `videoLink` | — | Link video chứng minh (nếu task `requiresVideo = true` thì bắt buộc) |
| `proofLinks` | — | Mảng link chứng minh khác (screenshot, doc...) |

3. Chọn `taskStatusAfter`:
   - **IN_PROGRESS** — Tiếp tục làm sau
   - **BLOCKED** — Đang bị chặn, chờ unblock
   - **REVIEW** — Xong, gửi lên cho Manager xem
   - **DONE** — Hoàn thành luôn

4. Bấm **"Xác nhận dừng"** → `POST /api/tasks/[id]/stop`

### Hệ thống tự động tính toán

```
durationMinutes = Math.round((endTime - startTime) / 60000)
                  tối thiểu 1 phút

calcCreditedMinutes():
  ┌─ Có video + requiresVideo = true  ─► creditedMinutes = durationMinutes
  │                                       approvalStatus  = AUTO_APPROVED
  │
  └─ Không có video / vượt ước tính   ─► creditedMinutes = durationMinutes
                                          approvalStatus  = PENDING

Task cập nhật:
  actualTimeTotal += durationMinutes
  progressPct      = completionPctAfter  (nếu có)
  status           = taskStatusAfter     (nếu có)
  dateCompleted    = now                 (nếu DONE)
  videoLink        = ...                 (nếu có)
```

### Kết quả
- TimeLog được đóng lại, xuất hiện trong tab **"Giờ làm"** của task
- Nếu `PENDING` → Manager nhận thông báo để duyệt
- Nếu `AUTO_APPROVED` → Không cần duyệt

---

## 7. Bước 5 — Duyệt Time Log

### Ai thực hiện
Manager / Team Lead / Admin.

### Khi nào cần duyệt
- Time log có `approvalStatus = PENDING`
- Thường xảy ra khi: không có video, vượt thời gian ước tính

### Các bước thực hiện

1. Manager vào **Phê duyệt → Hộp Duyệt** (`/approvals`)
   hoặc vào thẳng task → tab **"Giờ làm"**
2. Xem chi tiết time log:
   - Thời gian làm: `durationMinutes`
   - Note của nhân viên
   - Video / proof links
3. Chọn hành động:

#### APPROVED (Duyệt)
```
PUT /api/time-logs/[id]/approve
{
  approvedMinutes: <số phút được duyệt>,  // Manager có thể điều chỉnh
  rating: <1-5>                           // Đánh giá chất lượng
}

Kết quả:
  approvalStatus = APPROVED
  approvedMinutes = <số manager nhập>
  approvedAt = now
  approvedById = manager.id
```

#### REJECTED (Từ chối)
```
PUT /api/time-logs/[id]/reject
{
  rejectionReason: "Lý do từ chối..."
}

Kết quả:
  approvalStatus = REJECTED
  rejectionReason = ...
  Nhân viên thấy lý do và có thể log lại
```

### Lưu ý
- Manager **có thể điều chỉnh `approvedMinutes`** khác với `durationMinutes`
- `approvedMinutes` là số giờ thực tế được tính vào lương/báo cáo
- `durationMinutes` là số giờ thực tế nhân viên làm (không thay đổi)

---

## 8. Bước 6 — Hoàn thành Task

### Ai thực hiện
Nhân viên (khi dừng timer chọn DONE) hoặc Manager (chuyển status thủ công).

### Điều kiện
- Task ở trạng thái `REVIEW` hoặc `IN_PROGRESS`
- Tất cả checklist items đã tick ✓ (khuyến nghị, không bắt buộc)

### Hệ thống tự động

```
Task cập nhật:
  status        = DONE
  dateCompleted = now
  progressPct   = 100
```

### Sau khi DONE
- Task vẫn giữ toàn bộ lịch sử: time logs, comments, attachments
- Không thể bắt đầu timer trên task DONE
- Hiển thị trong báo cáo năng suất

---

## 9. Sprint Workflow

### Vòng đời Sprint

```
  [PLANNING] ──── start ────► [ACTIVE] ──── complete ────► [COMPLETED]
                                  │
                               cancel
                                  │
                             [CANCELLED]
```

### Bước thực hiện

#### Tạo Sprint (Manager)
1. Vào **Công việc → Sprint** (`/sprints`)
2. Bấm **"+ Tạo Sprint"**
3. Điền: `name`, `goal`, `startDate`, `endDate`
4. `POST /api/sprints` → Sprint ở trạng thái `PLANNING`

#### Gán Task vào Sprint
1. Trong trang Sprint, xem **Backlog** (danh sách task chưa có sprint)
2. Chọn sprint cho từng task qua dropdown
3. `PATCH /api/tasks/[id]` với `{ sprintId: ... }`
4. Hoặc khi tạo/sửa task, chọn sprint trực tiếp

#### Bắt đầu Sprint
1. Bấm **"Bắt đầu Sprint"** trên sprint đang ở `PLANNING`
2. `PATCH /api/sprints/[id]` với `{ status: "ACTIVE" }`
3. Sprint chuyển sang `ACTIVE`

#### Hoàn thành Sprint
1. Bấm **"Hoàn thành"**
2. `PATCH /api/sprints/[id]` với `{ status: "COMPLETED" }`
3. Tasks chưa DONE trong sprint → cần xử lý thủ công (chuyển sprint mới hoặc để backlog)

### Hiển thị Sprint
- Kanban board hiển thị badge sprint ⚡ trên mỗi task card
- Trang Sprint có progress bar: `done / total tasks`
- Story Points dùng để ước tính khối lượng sprint

---

## 10. Checklist

### Mục đích
Chia nhỏ task thành các bước con có thể tick ✓.

### Thao tác

| Hành động | API | Ai làm được |
|---|---|---|
| Xem checklist | `GET /api/tasks/[id]/checklist` | Tất cả |
| Thêm item | `POST /api/tasks/[id]/checklist` | Assignee + Manager |
| Tick / bỏ tick | `PATCH /api/tasks/[id]/checklist/[itemId]` | Assignee + Manager |
| Xóa item | `DELETE /api/tasks/[id]/checklist/[itemId]` | Assignee + Manager |

### Giao diện
- Hiển thị progress bar `X/Y items hoàn thành`
- Thêm item bằng cách nhấn **Enter** trong input cuối danh sách
- Có thể kéo thả để sắp xếp thứ tự (`order` field)

---

## 11. Dependencies (Liên kết Task)

### Các loại liên kết

| Type | Ý nghĩa |
|---|---|
| `BLOCKS` | Task này phải DONE trước task kia mới làm được |
| `RELATES_TO` | Hai task liên quan đến nhau (thông tin) |
| `DUPLICATES` | Task này là bản sao của task khác |

### Thao tác

1. Mở task detail → section **"Liên kết"**
2. Bấm **"+ Thêm liên kết"**
3. Tìm task theo code (VD: `TSK-0042`)
4. Chọn loại liên kết
5. `POST /api/tasks/[id]/dependencies`

### Hiển thị

```
LIÊN KẾT:

  🔴 BỊ CHẶN BỞI:
     TSK-0010  Fix bug login      [IN_PROGRESS]
     TSK-0015  Deploy staging     [BACKLOG]

  🔵 ĐANG CHẶN:
     TSK-0025  Write release note [BACKLOG]
```

### Lưu ý
- Hiện tại là **thông tin/hiển thị** — hệ thống không tự động block timer khi có dependency chưa xong
- Không validate vòng lặp (A blocks B blocks A)

---

## 12. Watchers (Theo dõi)

### Mục đích
Đăng ký nhận thông báo và theo dõi tiến độ task mà mình không phải assignee.

### Thao tác

| Hành động | API | Ghi chú |
|---|---|---|
| Theo dõi | `POST /api/tasks/[id]/watchers` | Tự thêm mình |
| Bỏ theo dõi | `DELETE /api/tasks/[id]/watchers/[employeeId]` | Chỉ tự bỏ mình / Manager bỏ người khác |
| Xem danh sách | `GET /api/tasks/[id]/watchers` | Trả về `isWatching` của người dùng hiện tại |

### Giao diện
- Nút mắt 👁 ở header task detail — click để toggle theo dõi/bỏ theo dõi
- Danh sách avatar watcher hiển thị trong sidebar task

---

## 13. Attachments (Đính kèm)

### Thao tác

1. Mở task detail → section **"Đính kèm"**
2. Bấm **"+ Tải file lên"** hoặc kéo thả file
3. Client đọc file qua `FileReader.readAsDataURL()` → gửi base64 lên server
4. `POST /api/tasks/[id]/attachments`

| Trường lưu | Mô tả |
|---|---|
| `fileName` | Tên file gốc |
| `fileUrl` | URL hoặc base64 data URL |
| `fileSize` | Kích thước (bytes) |
| `mimeType` | Loại file (image/png, application/pdf...) |
| `driveItemId` | ID trên OneDrive (nếu tích hợp) |

### Xóa file
- Chỉ người upload hoặc Manager mới xóa được
- `DELETE /api/tasks/[id]/attachments/[attachmentId]`

---

## 14. Recurrence (Task lặp lại)

### Mục đích
Tự động tạo task mới theo lịch định kỳ (VD: báo cáo hàng tuần, standup hàng ngày).

### Cấu hình (Manager)

1. Mở task detail → sidebar → row **"Lặp lại"**
2. Bấm **"Thiết lập lặp lại"**
3. Chọn cấu hình:

| Tùy chọn | Mô tả |
|---|---|
| Tần suất | DAILY / WEEKLY / MONTHLY / YEARLY |
| Mỗi N | Lặp lại mỗi N ngày/tuần/tháng/năm |
| Ngày trong tuần | (WEEKLY) Chọn T2-CN cụ thể |
| Ngày trong tháng | (MONTHLY) Ngày 1–31 |
| Kết thúc ngày | Ngày dừng lặp lại |
| Tối đa | Số lần tạo tối đa |

4. `PUT /api/tasks/[id]/recurrence`
5. Hệ thống tính `nextRunAt` = lần chạy kế tiếp

### Cách hoạt động (Cron)

```
Mỗi giờ, cron job chạy: GET /api/cron/recurrence

1. Tìm tất cả TaskRecurrence có:
   - isActive = true
   - nextRunAt <= now
   - endDate chưa qua (hoặc null)

2. Với mỗi recurrence:
   a. Clone task gốc → tạo Task mới (status = BACKLOG)
   b. occurrenceCount++
   c. Tính nextRunAt kế tiếp (calcNextRun)
   d. Nếu đạt maxOccurrences → isActive = false

3. Trả về danh sách task đã tạo
```

### Ví dụ hiển thị
```
🔁 Hàng tuần vào T2, T4, T6
   · 12 lần đã tạo
   · Tiếp: 18/06/2026
```

---

## 15. Phân quyền chi tiết

### Xem Task

| Điều kiện | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Task của mình | ✓ | ✓ | ✓ |
| Task của nhân viên trong team | ✗ | ✓ | ✓ |
| Tất cả task trong org | ✗ | ✗ | ✓ |

### Thao tác trên Task

| Hành động | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Tạo task | ✗ | ✓ | ✓ |
| Sửa task (task của mình) | ✓ | ✓ | ✓ |
| Sửa task (người khác) | ✗ | ✓ | ✓ |
| Xóa task | ✗ | ✓ | ✓ |
| Giao lại assignee | ✗ | ✓ | ✓ |
| Bắt đầu / Dừng timer | ✓ (own) | ✓ (own) | ✓ |
| Thiết lập recurrence | ✗ | ✓ | ✓ |
| Tạo / xóa sprint | ✗ | ✓ | ✓ |

### Thao tác Time Log

| Hành động | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Xem time log của mình | ✓ | ✓ | ✓ |
| Xem time log người khác | ✗ | ✓ | ✓ |
| Duyệt / từ chối time log | ✗ | ✓ | ✓ |
| Điều chỉnh approvedMinutes | ✗ | ✓ | ✓ |

### Thao tác Cộng tác

| Hành động | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Thêm / xóa checklist item | ✓ (own task) | ✓ | ✓ |
| Upload attachment | ✓ | ✓ | ✓ |
| Xóa attachment của mình | ✓ | ✓ | ✓ |
| Xóa attachment người khác | ✗ | ✓ | ✓ |
| Thêm watcher | ✓ | ✓ | ✓ |
| Xóa watcher của mình | ✓ | ✓ | ✓ |
| Xóa watcher người khác | ✗ | ✓ | ✓ |
| Thêm / xóa dependency | ✓ | ✓ | ✓ |
| Comment | ✓ | ✓ | ✓ |
| Xóa comment của mình | ✓ | ✓ | ✓ |

---

## 16. Luồng Happy Path đầy đủ

Dưới đây là luồng đầy đủ cho 1 task điển hình từ đầu đến cuối:

```
[MANAGER]                  [NHÂN VIÊN]                [SYSTEM]
     │                          │                         │
     │─── 1. Tạo task ─────────►│                         │
     │    POST /api/tasks        │                         │
     │    assignedTo = NV        │                         │─── Sinh TSK-0001
     │                          │                         │─── status = BACKLOG
     │                          │                         │
     │                          │─── 2. Vào /tasks ──────►│
     │                          │◄── Thấy TSK-0001 ───────│
     │                          │    status: BACKLOG       │
     │                          │                         │
     │                          │─── 3. Bấm "Bắt đầu" ──►│
     │                          │    POST /start           │─── Tạo TimeLog
     │                          │                         │─── status = IN_PROGRESS
     │                          │◄── Timer chạy ──────────│
     │                          │                         │
     │                          │    ... làm việc ...     │
     │                          │                         │
     │                          │─── 4. Bấm "Dừng" ──────►│
     │                          │    { note, pct: 80,      │─── Đóng TimeLog
     │                          │      status: REVIEW }    │─── durationMin = X
     │                          │                         │─── calcCredited()
     │                          │                         │─── status = REVIEW
     │                          │                         │
     │◄── 5. Có time log PENDING│                         │
     │    cần duyệt              │                         │
     │                          │                         │
     │─── 6. Duyệt time log ───►│                         │
     │    approvedMinutes = X    │◄── APPROVED ────────────│
     │                          │                         │
     │─── 7. Xem task REVIEW ──►│                         │
     │─── 8. Đổi → DONE ───────►│                         │
     │    PATCH status=DONE      │                         │─── dateCompleted = now
     │                          │                         │─── progressPct = 100
     │                          │                         │
     ▼                          ▼                         ▼
                    TASK HOÀN THÀNH ✓
```

---

## Tóm tắt API Endpoints

| Endpoint | Method | Mô tả | Phân quyền |
|---|---|---|---|
| `/api/tasks` | GET | Danh sách task | Theo role |
| `/api/tasks` | POST | Tạo task | Manager+ |
| `/api/tasks/[id]` | GET | Chi tiết task | Required |
| `/api/tasks/[id]` | PUT | Cập nhật task | Assignee / Manager |
| `/api/tasks/[id]` | DELETE | Xóa task | Manager+ |
| `/api/tasks/[id]/start` | POST | Bắt đầu timer | Assignee |
| `/api/tasks/[id]/stop` | POST | Dừng timer | Assignee |
| `/api/tasks/[id]/checklist` | GET / POST | Checklist | Required |
| `/api/tasks/[id]/checklist/[itemId]` | PATCH / DELETE | Sửa / xóa item | Assignee / Manager |
| `/api/tasks/[id]/comments` | GET / POST | Comments | Required |
| `/api/tasks/[id]/comments/[id]` | PATCH / DELETE | Sửa / xóa comment | Author / Manager |
| `/api/tasks/[id]/watchers` | GET / POST | Watchers | Required |
| `/api/tasks/[id]/watchers/[empId]` | DELETE | Xóa watcher | Self / Manager |
| `/api/tasks/[id]/dependencies` | GET / POST | Dependencies | Required |
| `/api/tasks/[id]/dependencies/[depId]` | DELETE | Xóa dependency | Required |
| `/api/tasks/[id]/attachments` | GET / POST | Đính kèm | Required |
| `/api/tasks/[id]/attachments/[attId]` | DELETE | Xóa file | Uploader / Manager |
| `/api/tasks/[id]/recurrence` | GET / PUT / DELETE | Lặp lại | GET: all / PUT+DELETE: Manager |
| `/api/sprints` | GET / POST | Sprints | GET: all / POST: Manager |
| `/api/sprints/[id]` | PATCH / DELETE | Cập nhật sprint | Manager+ |
| `/api/cron/recurrence` | GET | Cron tạo task lặp lại | Cron Secret |

---

*Cập nhật lần cuối: 2026-06-17*
*Phiên bản hệ thống: HR System v1.0 — Sprint 4B Task Management*
