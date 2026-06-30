# PRD-06: Quản lý Công việc (Tasks)

**Module:** Task Management  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp hệ thống quản lý công việc toàn diện: tạo, phân công, theo dõi tiến độ, review, đính kèm tài liệu, checklist, comment, dependency, watcher và task lặp tự động. Là trung tâm hoạt động chính của hệ thống.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin / Manager | Tạo task, phân công, review, xem tất cả task |
| Employee | Tạo task, thực hiện task được assign, comment |
| Watcher | Theo dõi task (nhận thông báo cập nhật) |

---

## 3. Luồng chức năng

### 3.1 Tạo task

```
Người dùng vào /tasks → Click "Tạo task"
    → Có thể tạo từ template (Task Templates)
    → Điền thông tin:
        - Tiêu đề (bắt buộc)
        - Mô tả (rich text)
        - Task type (bug / feature / meeting / ...)
        - Assignee (người thực hiện)
        - Priority (LOW / MEDIUM / HIGH / CRITICAL)
        - Due date
        - Estimated time (giờ)
        - Sprint (tuỳ chọn)
        - Labels (system labels)
        - Estimate flags
    → POST /api/tasks
    → Hệ thống tự generate task code (NV-001, TK-002...)
    → Gửi thông báo cho assignee
```

### 3.2 Xem & Filter danh sách task

```
/tasks → Xem danh sách task
    → View modes: Board (Kanban) / List / Timeline
    → Filter:
        - Assignee
        - Sprint
        - Status
        - Priority
        - Task type
        - Label
        - Due date range
    → Sort: Due date / Priority / Created date
    → Search theo tiêu đề / task code
```

### 3.3 Chi tiết task

```
Click task → /tasks/[id]
    → Xem đầy đủ thông tin task
    → Tab Checklist: quản lý checklist items
    → Tab Comments: bình luận, tag người
    → Tab Attachments: file đính kèm
    → Tab Dependencies: task phụ thuộc
    → Tab Time Logs: lịch sử giờ làm
    → Tab Activity: lịch sử thay đổi
```

### 3.4 Thực hiện task (Start / Stop)

```
Assignee mở task → Click "Bắt đầu"
    → POST /api/tasks/[id]/start
    → Status = IN_PROGRESS
    → Time log tự động chạy (RUNNING)
    → Assignee click "Dừng"
    → POST /api/tasks/[id]/stop
    → Time log STOPPED, ghi duration
    → Có thể start/stop nhiều lần trong ngày
```

### 3.5 Submit review

```
Assignee hoàn thành → Click "Hoàn thành / Gửi review"
    → POST /api/tasks/[id]/review { action: "SUBMIT" }
    → Status = PENDING_REVIEW
    → Thông báo đến Reviewer (Manager / người được assign review)
    → Reviewer xem task:
        - APPROVE: POST /api/tasks/[id]/review { action: "APPROVE" }
            → Status = DONE
        - REJECT: POST /api/tasks/[id]/review { action: "REJECT", comment }
            → Status = IN_PROGRESS
            → Assignee nhận feedback
```

### 3.6 Checklist

```
Trong task detail → Tab Checklist
    → Thêm item: POST /api/tasks/[id]/checklist { title }
    → Tick hoàn thành: PUT /api/tasks/[id]/checklist/[itemId] { done: true }
    → Xóa item: DELETE /api/tasks/[id]/checklist/[itemId]
    → Hiển thị tiến độ: 3/5 items done
```

### 3.7 Comment

```
Trong task detail → Tab Comments
    → Viết comment (text, có thể tag @người)
    → POST /api/tasks/[id]/comments { content, mentions: [...] }
    → Reply comment: POST /api/tasks/[id]/comments/[commentId] (nested)
    → Edit / Delete comment của mình
    → Thông báo đến người được tag
```

### 3.8 Attachments (File đính kèm)

```
Tab Attachments → Upload file
    → POST /api/tasks/[id]/attachments (multipart/form-data)
    → Upload lên Drive / Storage
    → Lưu attachment record (fileName, fileUrl, size, type)
    → Download: GET /api/tasks/[id]/attachments (trả về URL)
    → Xóa: DELETE /api/tasks/[id]/attachments/[attachmentId]
```

### 3.9 Dependencies (Task phụ thuộc)

```
Tab Dependencies → Thêm dependency
    → POST /api/tasks/[id]/dependencies
        { dependsOnTaskId, type: "BLOCKED_BY" | "BLOCKS" | "RELATED" }
    → Hiển thị dependency graph
    → Cảnh báo nếu task bị blocked bởi task chưa done
    → Xóa: DELETE /api/tasks/[id]/dependencies/[depId]
```

### 3.10 Watchers (Theo dõi)

```
Task detail → "Theo dõi task"
    → POST /api/tasks/[id]/watchers { employeeId }
    → Watcher nhận thông báo khi task được cập nhật
    → Bỏ theo dõi: DELETE /api/tasks/[id]/watchers/[employeeId]
```

### 3.11 Task Recurrence (Task lặp)

```
Khi tạo task → Bật "Lặp lại"
    → POST /api/tasks/[id]/recurrence
        { pattern: "DAILY" | "WEEKLY" | "MONTHLY", interval, endDate }
    → Cron job /api/cron/recurrence chạy hàng ngày
    → Tự động tạo task mới theo chu kỳ
    → Task mới kế thừa: tiêu đề, type, assignee, template
```

### 3.12 Task Templates

```
Admin / Manager tạo template:
    → POST /api/task-templates { name, description, checklist, taskType, estimatedHours }
    → Khi tạo task mới: chọn "Tạo từ template"
    → Form tự điền sẵn theo template
    → AI đề xuất template phù hợp: GET /api/template-suggestions
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/tasks` | Danh sách task (filter, paginate) |
| POST | `/api/tasks` | Tạo task mới |
| GET | `/api/tasks/next-code` | Preview task code tiếp theo |
| GET | `/api/tasks/[id]` | Chi tiết task |
| PUT | `/api/tasks/[id]` | Cập nhật task |
| DELETE | `/api/tasks/[id]` | Xóa task |
| POST | `/api/tasks/[id]/start` | Bắt đầu thực hiện |
| POST | `/api/tasks/[id]/stop` | Dừng thực hiện |
| POST | `/api/tasks/[id]/review` | Submit / approve / reject |
| GET/POST | `/api/tasks/[id]/checklist` | Checklist items |
| PUT/DELETE | `/api/tasks/[id]/checklist/[itemId]` | Sửa/xóa checklist item |
| GET/POST | `/api/tasks/[id]/comments` | Comments |
| PUT/DELETE | `/api/tasks/[id]/comments/[commentId]` | Sửa/xóa comment |
| GET/POST | `/api/tasks/[id]/attachments` | File đính kèm |
| DELETE | `/api/tasks/[id]/attachments/[attachmentId]` | Xóa file |
| GET/POST | `/api/tasks/[id]/dependencies` | Dependencies |
| DELETE | `/api/tasks/[id]/dependencies/[depId]` | Xóa dependency |
| GET/POST | `/api/tasks/[id]/watchers` | Watchers |
| DELETE | `/api/tasks/[id]/watchers/[employeeId]` | Bỏ theo dõi |
| GET/POST/PUT | `/api/tasks/[id]/recurrence` | Cấu hình lặp |
| GET/POST | `/api/task-templates` | Templates |
| GET/PUT/DELETE | `/api/task-templates/[id]` | Chi tiết template |
| GET/POST | `/api/task-types` | Loại task |
| GET/POST | `/api/system-labels` | Nhãn hệ thống |
| GET/POST | `/api/estimate-flags` | Estimate flags |
| GET | `/api/template-suggestions` | AI đề xuất template |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/tasks` | Danh sách task (board / list) |
| `/tasks/[id]` | Chi tiết task |
| `/task-templates` | Quản lý templates |
| `/task-reviews` | Danh sách task chờ review |
| `/settings/task-types` | Cấu hình loại task |
| `/system-labels` | Quản lý nhãn |

---

## 6. Task Status Flow

```
BACKLOG → TODO → IN_PROGRESS → PENDING_REVIEW → DONE
                      ↑_______________↓ (reject quay lại IN_PROGRESS)
```

**Status đặc biệt:**
- `CANCELLED` — task bị hủy
- `BLOCKED` — task bị block bởi dependency chưa xong

---

## 7. Business Rules

- Task code unique trong workspace (format có thể cấu hình: TK-, NV-, ...).
- Chỉ Assignee mới được Start/Stop task.
- Chỉ Reviewer được Approve/Reject (mặc định là Manager của Assignee).
- Có thể re-assign task khi IN_PROGRESS (ghi log lại).
- Task DONE không thể chỉnh sửa (chỉ Admin mới được reopen).
- Xóa task → soft delete, dữ liệu giữ nguyên cho audit.
- File đính kèm tối đa 50MB/file.
- Comment có thể edit trong 15 phút sau khi gửi.
