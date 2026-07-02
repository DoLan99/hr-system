# PRD-07 — Time Logs & Sprints

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Time Logs / Sprints |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Team phát triển sản phẩm làm việc theo sprint (Scrum/Kanban). Để biết năng suất thực tế và ước lượng công việc tốt hơn, cần:
- Theo dõi thời gian (time log) thực tế cho từng task.
- Tổ chức công việc theo sprint có thời hạn rõ ràng.
- So sánh estimated vs actual effort sau mỗi sprint.

Không có công cụ → Manager không biết task nào chiếm nhiều thời gian nhất, không biết sprint đang cháy deadline hay không.

### 1.2 Mục tiêu sản phẩm (Goals)

- Nhân viên bấm timer khi bắt đầu/dừng làm task → time log tự động.
- Manager tạo sprint, kéo task vào sprint, theo dõi progress.
- Dashboard sprint: velocity, burndown chart, remaining effort.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Timer start/stop theo task, manual time entry, sprint CRUD, task assignment to sprint, sprint report (velocity, burndown), time report per person/task.

**Ngoài phạm vi:** Pomodoro timer (v2), Jira import (v2), billing by time (xem PRD-10), OKR linking (xem PRD-17).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Manager / Team Lead** | Lập kế hoạch sprint, phân công task, theo dõi tiến độ. | Biết team đang dùng thời gian vào đâu, sprint có đúng tiến độ không. | Phải hỏi từng người để biết task đang ở đâu; ước lượng sprint tiếp theo không có dữ liệu. |
| **Employee (Developer)** | Làm task trong sprint, log thời gian thực tế. | Bấm timer dễ, xem time log của mình. | Phải tự ghi chú giờ làm, dễ quên; không biết mình đang under/over-allocated. |
| **HR Admin** | Xem báo cáo effort tổng hợp theo phòng ban tháng. | Báo cáo effort để tính productivity, đối chiếu lương OT. | Không có dữ liệu → không tính được năng suất thực tế. |

### 2.2 User Journey

**Manager — Tạo và quản lý Sprint:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /sprints → [+ New Sprint] → Đặt tên, ngày bắt đầu/kết thúc, goal | Khởi tạo sprint |
| 2 | Kéo task từ Backlog vào Sprint | Scope sprint |
| 3 | Sprint bắt đầu → Mở [Start Sprint] | Kích hoạt sprint |
| 4 | Trong sprint: xem burndown chart, theo dõi remaining | Quản lý tiến độ |
| 5 | Cuối sprint: [Complete Sprint] → Xem sprint report | Review & retrospective |

**Employee — Log thời gian làm việc:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Mở task đang làm → [Start Timer] | Bắt đầu đếm giờ |
| 2 | Làm việc; timer chạy nền | Theo dõi thực tế |
| 3 | [Stop Timer] khi tạm dừng hoặc xong | Dừng đếm, lưu time log |
| 4 | Xem tổng thời gian đã log trên task | Kiểm tra actual vs estimate |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Timer Start/Stop | Bấm timer trên task; hệ thống tạo TimeLog entry với startedAt/endedAt | Must Have | 5 |
| FR-002 | Manual Time Entry | Nhập giờ thủ công: chọn task, ngày, số giờ, mô tả | Must Have | 3 |
| FR-003 | Xem time logs của task | Danh sách time logs trên task: ai log, bao nhiêu giờ, khi nào | Must Have | 3 |
| FR-004 | Xem time logs cá nhân | Nhân viên xem time logs của bản thân theo ngày/tuần | Must Have | 3 |
| FR-005 | CRUD Sprint | Tạo, sửa, xóa sprint: tên, ngày BD/KT, goal, status (PLANNING/ACTIVE/COMPLETED) | Must Have | 5 |
| FR-006 | Gán task vào Sprint | Kéo/thả hoặc dropdown gán task vào sprint; bỏ task khỏi sprint | Must Have | 5 |
| FR-007 | Start / Complete Sprint | Chuyển sprint PLANNING → ACTIVE → COMPLETED; task chưa done tự động vào sprint tiếp | Must Have | 8 |
| FR-008 | Burndown chart | Biểu đồ remaining story points mỗi ngày của sprint hiện tại | Should Have | 8 |
| FR-009 | Sprint velocity report | Velocity = total SP done mỗi sprint theo team; chart theo thời gian | Should Have | 5 |
| FR-010 | Time report theo người | HR/Manager xem tổng giờ log của từng người theo tuần/tháng | Should Have | 5 |
| FR-011 | Export time report | Export CSV/Excel time report | Should Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Employee, tôi muốn bấm Start Timer khi bắt đầu làm một task, để hệ thống tự động tính giờ thay vì tôi phải tự ghi. | AC1: Task board/detail có nút [Start Timer]. AC2: Khi bấm: timer icon chạy, thời gian hiển thị real-time. AC3: Chỉ có 1 timer active tại 1 thời điểm — bấm Start timer mới sẽ tự dừng timer cũ. AC4: [Stop Timer] → tạo TimeLog: taskId, userId, startedAt, endedAt, duration (minutes). | High |
| US-002 | Là Employee, tôi muốn nhập time log thủ công cho ngày hôm qua, vì tôi quên bấm timer nhưng đã làm việc. | AC1: Form manual entry: Chọn task, Ngày (datepicker), Số giờ (input số), Mô tả (tuỳ chọn). AC2: Validate: số giờ phải > 0 và ≤ 24. AC3: Manual entry hiển thị khác với timer entry (badge "Manual"). AC4: Được edit/delete time log do chính mình tạo trong vòng 7 ngày. | High |
| US-003 | Là Manager, tôi muốn tạo sprint với ngày bắt đầu và mục tiêu, để team biết scope và deadline. | AC1: Tạo sprint: Tên*, Ngày bắt đầu*, Ngày kết thúc*, Sprint Goal (tuỳ chọn), Team. AC2: Mặc định status = PLANNING. AC3: Không thể tạo sprint với ngày kết thúc < ngày bắt đầu. AC4: Có thể có nhiều sprint tồn tại nhưng chỉ 1 sprint ACTIVE mỗi team tại cùng thời điểm. | High |
| US-004 | Là Manager, tôi muốn kéo task vào sprint và bắt đầu sprint, để team biết chính thức sprint đã khởi động. | AC1: Sprint backlog: list tasks chưa được gán sprint. AC2: Kéo/thả hoặc nút [Add to Sprint] trên task. AC3: [Start Sprint] chỉ xuất hiện khi sprint có ít nhất 1 task. AC4: Start Sprint: status PLANNING → ACTIVE, lưu actualStartDate. | High |
| US-005 | Là Manager, tôi muốn xem burndown chart của sprint hiện tại, để biết team đang đúng tiến độ hay đang cháy deadline. | AC1: Trục X: ngày trong sprint. Trục Y: remaining story points. AC2: Đường lý tưởng (ideal burndown) = SP giảm đều mỗi ngày. AC3: Đường thực tế = SP thực sự còn lại mỗi ngày. AC4: Khi task status chuyển DONE: SP của task bị trừ khỏi remaining. | Medium |
| US-006 | Là Manager, tôi muốn hoàn thành sprint và chuyển task chưa xong sang sprint tiếp theo, để không mất backlog. | AC1: [Complete Sprint] → modal: "X task chưa hoàn thành. Chuyển vào: [Sprint tiếp | Backlog]". AC2: Sau complete: status → COMPLETED, lưu actualEndDate. AC3: Sprint report tự động tạo: tổng SP planned / done / carried over. AC4: Velocity được cập nhật trong dashboard. | Medium |
| US-007 | Là HR Admin, tôi muốn xem báo cáo thời gian làm việc của từng nhân viên theo tháng, để đối chiếu khi tính lương OT. | AC1: Filter: Tháng + Nhân viên/Phòng ban. AC2: Bảng: Nhân viên | Tổng giờ | Breakdown theo task/project. AC3: Export CSV. AC4: Tổng giờ OT = total time logged − (ngày công chuẩn × 8 giờ). | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Burndown chart tính toán nhanh | Load time | < 2 giây |
| Accuracy | Timer chính xác, không mất data khi tab đóng | Timer loss | 0% (lưu startedAt server-side) |
| Concurrency | Nhiều người cùng log time | Concurrent | ≥ 200 đồng thời |
| Data retention | Giữ time log tối thiểu 3 năm | Retention | 36 tháng |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Timer trên Task**

```
Task Card / Task Detail → [▶ Start Timer]
  → POST /api/time-logs/start { taskId }
  → Timer icon chạy trong header (global)
  → [■ Stop] → POST /api/time-logs/stop { timeLogId }
  → Hiển thị: "Đã log 1h 23m"
```

**Luồng 2: Sprint Flow**

```
/sprints → [+ New Sprint]
  → Tạo sprint PLANNING
  → Drag tasks từ Backlog vào Sprint
  → [Start Sprint] → ACTIVE
    → Burndown chart hiển thị
    → Team làm task, cập nhật status
  → [Complete Sprint] → COMPLETED
    → Chọn nơi chứa task chưa done
    → Sprint Report tự động
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Sprint Board | `/sprints` | Danh sách sprints, board hiện tại |
| Sprint Detail | `/sprints/:id` | Task list, burndown chart, progress |
| My Time Logs | `/time-logs` | Nhân viên xem time logs của mình |
| Time Report | `/reports/time` | HR/Manager xem báo cáo effort |

---

## 6. Business Rules

### BR-001 — Chỉ 1 timer active mỗi người tại một thời điểm

Khi user bấm Start Timer trên task B trong khi đang có timer chạy cho task A → hệ thống tự động dừng timer task A (tạo TimeLog với endedAt = now) rồi mới bắt đầu timer task B. Không để 2 timer chạy song song.

### BR-002 — Chỉ 1 Sprint ACTIVE mỗi team

Mỗi team chỉ có tối đa 1 sprint ở trạng thái ACTIVE tại cùng thời điểm. Để start sprint mới, phải complete sprint cũ trước.

### BR-003 — Task chưa done khi Complete Sprint

Khi complete sprint, các task chưa ở trạng thái DONE phải được chuyển vào: (1) Sprint tiếp theo nếu có, hoặc (2) Backlog. Không tự động xóa hoặc đánh dấu CANCELLED.

### BR-004 — Không thể xóa TimeLog sau 7 ngày

Time log chỉ được chỉnh sửa/xóa trong vòng 7 ngày kể từ ngày tạo. Sau 7 ngày → chỉ HR Admin mới có quyền sửa (với audit trail).

### BR-005 — Velocity tính trên Sprint COMPLETED

Velocity chỉ tính cho sprint đã COMPLETED. Sprint đang ACTIVE không tính vào velocity chart. Công thức: `velocity = sum(storyPoints của task DONE trong sprint)`.

### BR-006 — Burndown cập nhật real-time khi task chuyển DONE

Khi nhân viên chuyển task sang DONE, remaining SP trên burndown chart giảm ngay lập tức (không chờ đến cuối ngày).

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Start/stop timer bản thân | ✅ | ✅ | ✅ | ✅ |
| Manual time entry bản thân | ✅ | ✅ | ✅ | ✅ |
| Sửa/xóa time log bản thân (≤7 ngày) | ✅ | ✅ | ✅ | ✅ |
| Sửa time log bất kỳ (>7 ngày) | ❌ | ❌ | ✅ | ✅ |
| Xem time logs của team | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Tạo / Start / Complete Sprint | ❌ | ✅ | ✅ | ✅ |
| Xóa Sprint | ❌ | ✅ (PLANNING only) | ✅ | ✅ |
| Xem burndown chart | ✅ (sprint của mình) | ✅ | ✅ | ✅ |
| Xem time report tất cả nhân viên | ❌ | 👁 (team của mình) | ✅ | ✅ |
| Export time report | ❌ | ✅ (team của mình) | ✅ | ✅ |
