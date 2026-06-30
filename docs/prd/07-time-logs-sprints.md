# PRD-07: Time Logs & Sprints

**Module:** Time Logs / Sprints  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

**Time Logs:** Ghi nhận chính xác thời gian làm việc theo từng task, làm cơ sở tính lương OT, đo năng suất và báo cáo hiệu suất.

**Sprints:** Tổ chức công việc theo chu kỳ sprint (Agile/Scrum), giúp team lập kế hoạch, theo dõi tiến độ và retrospective sau mỗi sprint.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Employee | Xem time log của mình, start/stop qua task |
| Manager | Xem time log của team, tạo và quản lý sprint |
| Admin | Xem toàn bộ time log, xuất báo cáo, quản lý sprint |

---

## 3. Time Logs — Luồng chức năng

### 3.1 Ghi nhận tự động qua Task

```
Nhân viên click "Bắt đầu" trong task
    → POST /api/tasks/[id]/start
    → Tạo TimeLog { taskId, employeeId, startTime: now, status: RUNNING }
    → Chỉ có 1 time log RUNNING tại một thời điểm / người
    → Nhân viên click "Dừng"
    → POST /api/tasks/[id]/stop
    → Cập nhật TimeLog { endTime: now, duration: seconds, status: STOPPED }
```

### 3.2 Ghi thủ công

```
Nhân viên vào /time-logs → "Ghi thủ công"
    → POST /api/time-logs
        { taskId, startTime, endTime, description }
    → Dùng khi quên start timer hoặc làm việc offline
```

### 3.3 Xem time log đang chạy

```
GET /api/time-logs/running
    → Trả về time log RUNNING của người dùng hiện tại
    → Hiển thị trên header/dashboard: "Đang làm: [Task name] - 1h 23m"
    → Có thể dừng từ bất kỳ đâu trong app
```

### 3.4 Xem lịch sử & Báo cáo

```
/time-logs → Xem lịch sử
    → Filter: Khoảng thời gian, Task, Project, Sprint
    → Groupby: Theo ngày / Task / Sprint
    → Tổng giờ làm theo kỳ
    → So sánh actual vs estimated
    → Xuất CSV / Excel
```

### 3.5 Chỉnh sửa Time Log

```
Nhân viên xem time log → Click "Chỉnh sửa"
    → PUT /api/time-logs/[id] { startTime, endTime, description }
    → Chỉ chỉnh sửa được log của mình trong 24h
    → Sau 24h: cần Manager/Admin duyệt
```

---

## 4. Sprints — Luồng chức năng

### 4.1 Tạo Sprint

```
Manager vào /sprints → "Tạo Sprint mới"
    → POST /api/sprints
        {
          name: "Sprint 1 - Tháng 7",
          startDate: "2026-07-01",
          endDate: "2026-07-14",
          goal: "Hoàn thành module login và dashboard"
        }
    → Sprint ở trạng thái PLANNED
```

### 4.2 Thêm Task vào Sprint

```
Từ Sprint board hoặc Task detail:
    → Kéo thả task vào sprint (drag & drop)
    → Hoặc: PUT /api/tasks/[id] { sprintId }
    → Task hiển thị trong sprint backlog
    → Cập nhật Sprint capacity (tổng estimated hours)
```

### 4.3 Bắt đầu Sprint

```
Manager click "Bắt đầu Sprint"
    → PUT /api/sprints/[id] { status: "ACTIVE" }
    → Chỉ 1 sprint ACTIVE tại một thời điểm (per team)
    → Sprint board hiển thị Kanban: TODO / IN_PROGRESS / DONE
```

### 4.4 Theo dõi Sprint

```
/sprints → Chọn sprint đang ACTIVE
    → Burndown chart: công việc còn lại theo ngày
    → Velocity: so sánh với sprint trước
    → Thành viên: ai đang làm gì
    → Tasks by status
    → Cảnh báo: tasks sắp hết deadline
```

### 4.5 Kết thúc Sprint

```
Manager click "Kết thúc Sprint"
    → PUT /api/sprints/[id] { status: "COMPLETED" }
    → Hệ thống hỏi: chuyển task chưa xong vào đâu?
        - Sprint tiếp theo
        - Backlog
    → Tự động chuyển task chưa DONE theo lựa chọn
    → Tạo Sprint Summary: velocity, % hoàn thành, thời gian thực
```

### 4.6 Sprint Backlog

```
Backlog: Danh sách task chưa có sprint
    → Manager kéo task từ backlog vào sprint
    → Hoặc tạo task trực tiếp trong sprint
    → Ước tính story points / giờ làm
```

---

## 5. API Endpoints

### Time Logs
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/time-logs` | Danh sách time logs (filter) |
| POST | `/api/time-logs` | Tạo time log thủ công |
| GET | `/api/time-logs/running` | Time log đang chạy |
| GET | `/api/time-logs/[id]` | Chi tiết |
| PUT | `/api/time-logs/[id]` | Chỉnh sửa |
| DELETE | `/api/time-logs/[id]` | Xóa |

### Sprints
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/sprints` | Danh sách sprints |
| POST | `/api/sprints` | Tạo sprint |
| GET | `/api/sprints/[id]` | Chi tiết sprint + tasks |
| PUT | `/api/sprints/[id]` | Cập nhật sprint (bắt đầu, kết thúc) |
| DELETE | `/api/sprints/[id]` | Xóa sprint |

---

## 6. Màn hình UI

| Route | Màn hình |
|---|---|
| `/time-logs` | Lịch sử time logs + báo cáo giờ làm |
| `/sprints` | Sprint board + backlog |

---

## 7. Data Model

**TimeLog:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `taskId` | UUID | FK → Task |
| `employeeId` | UUID | FK → Employee |
| `startTime` | DateTime | Thời điểm bắt đầu |
| `endTime` | DateTime | Thời điểm kết thúc |
| `duration` | Int | Số giây |
| `description` | String | Ghi chú |
| `status` | Enum | RUNNING / STOPPED |

**Sprint:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Tên sprint |
| `goal` | String | Mục tiêu sprint |
| `startDate` | Date | Ngày bắt đầu |
| `endDate` | Date | Ngày kết thúc |
| `status` | Enum | PLANNED / ACTIVE / COMPLETED / CANCELLED |
| `workspaceId` | UUID | FK → Workspace |

---

## 8. Business Rules

- Không thể có 2 time log RUNNING cùng lúc cho 1 nhân viên.
- Không thể tạo sprint với startDate > endDate.
- Sprint không thể xóa nếu đang ACTIVE.
- Khi kết thúc sprint, task DONE không được chuyển sprint.
- Time log không thể có duration âm (endTime >= startTime).
- Chỉnh sửa time log sau 24h cần Manager approve.
