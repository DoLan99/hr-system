# PRD-26 — Capacity Planning Chi tiết

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Capacity Planning — Workload / Forecast / Skill Load / Office Time Auto-Derive |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Manager, Admin |
| API chính | `GET /api/capacity/workload`, `GET /api/capacity/forecast`, `GET /api/capacity/skill-load`, `POST /api/office-time/auto-derive` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Manager cần biết mỗi nhân viên đang bận bao nhiêu % — để phân công task mới không làm nhân viên quá tải, hoặc ngược lại tìm người đang rảnh để giao thêm việc. Đồng thời, HR cần dự báo khi nào team mới giải phóng đủ để nhận project mới. Không có công cụ này → Manager phân công cảm tính, nhân viên A quá tải trong khi nhân viên B không có việc làm.

**4 pain points cụ thể:**
1. Không biết workload thực tế từng người trong 2 tuần tới.
2. Không biết khi nào backlog hiện tại mới được clear (Forecast).
3. Không biết ai giỏi task type nào (Skill Load → phân công đúng người).
4. Check-in giờ làm thực tế mất công nhập thủ công (Office Time Auto-Derive từ session activity).

### 1.2 Mục tiêu sản phẩm (Goals)

- **Workload:** Grid mỗi người × mỗi ngày, hiển thị % utilization với màu sắc (xanh/vàng/đỏ).
- **Forecast:** Dự báo ETA clear backlog của từng người và toàn team.
- **Skill Load:** Matrix nhân viên × task type — ai đã làm nhiều giờ loại task nào trong 90 ngày.
- **Office Time Auto-Derive:** Từ UserSession + UserActivity → suggest giờ bắt đầu/kết thúc thực tế của ngày hôm đó.

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Manager / Team Lead** | Phân công task mới và theo dõi workload team. | Phân công đúng người đang rảnh; biết trước ai sẽ bận khi nào. | Phân công cảm tính → nhân viên burnout hoặc idle. |
| **Admin / HR** | Lập kế hoạch tuyển dụng và nhận project mới. | Biết khi nào team có capacity nhận thêm. | Không có data → cam kết deadline với khách hàng sai. |
| **Employee** | Muốn giờ làm thực tế được ghi nhận chính xác mà không phải check-in thủ công. | Auto-suggest giờ từ activity → 1 click confirm. | Quên check-in → bị tính ABSENT dù đã làm đủ giờ. |

### 2.2 User Journey

**Manager — Xem workload và phân công task mới:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào `/capacity` → Tab "Workload" → `GET /api/capacity/workload?days=14` | Grid nhân viên × ngày |
| 2 | Thấy nhân viên A: avg 40% (xanh), nhân viên B: avg 95% (đỏ) | B đang quá tải |
| 3 | Task mới cần người làm → giao cho A | Phân công đúng |
| 4 | Tab "Forecast" → thấy B sẽ free sau 3.5 tuần | Biết khi nào B nhận thêm việc được |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Workload

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Compute workload | `GET /api/capacity/workload?startDate=&days=14` — trả về grid nhân viên × ngày với utilization % | Must Have | 13 |
| FR-002 | Params: startDate, days | `startDate` default = today; `days` min 1 max 60, default 14 | Must Have | 2 |
| FR-003 | Chỉ Manager+ | Endpoint yêu cầu `requireManager()` — Employee không xem được workload toàn team | Must Have | 2 |
| FR-004 | Color coding | Phía UI: utilization < 70% → xanh; 70-90% → vàng; > 90% → đỏ | Must Have | 3 |
| FR-005 | Business days only | Weekend (thứ 7, CN) có `capacity = 0 minutes` | Must Have | 2 |

**Response schema chi tiết:**
```json
{
  "data": {
    "startDate": "2026-07-01",
    "endDate": "2026-07-14",
    "dayCount": 14,
    "employees": [
      {
        "employeeId": 5,
        "fullName": "Nguyen Van A",
        "department": "Engineering",
        "dailyCapacityMinutes": 436,
        "totalLoadMinutes": 2600,
        "totalCapacityMinutes": 4360,
        "avgUtilization": 60,
        "days": [
          { "date": "2026-07-01", "loadMinutes": 240, "utilization": 55, "taskCount": 3 },
          { "date": "2026-07-02", "loadMinutes": 0, "utilization": 0, "taskCount": 0 }
        ]
      }
    ]
  }
}
```

### 3.2 Forecast

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-006 | Compute forecast | `GET /api/capacity/forecast` — dự báo ETA clear backlog của từng người và team | Must Have | 8 |
| FR-007 | Velocity 4 tuần | Velocity = tổng creditedMinutes (hoặc durationMinutes nếu không có) trong 4 tuần gần nhất / 4 | Must Have | 5 |
| FR-008 | ETA từng người | `etaWeeks = backlogMinutes / velocityPerWeek` | Must Have | 3 |
| FR-009 | Confidence level | `confidence`: low (< 2 tuần data), medium (2-4 tuần), high (≥ 4 tuần) | Must Have | 2 |
| FR-010 | Team ETA | Tổng backlog team / tổng velocity team | Must Have | 3 |

**Công thức chi tiết:**
```
dailyCapacityMinutes = round((maxHoursMonth / 22) × 60)
  → maxHoursMonth mặc định trên Employee profile

velocityMinutesPerWeek = SUM(creditedMinutes WHERE date ≥ 4 weeks ago AND approvalStatus IN [APPROVED, AUTO_APPROVED]) / 4
  → fallback: durationMinutes nếu creditedMinutes = null

backlogMinutes = SUM(max(0, estimatedTime - actualTimeTotal) WHERE status IN [BACKLOG, IN_PROGRESS, BLOCKED, REVIEW])

etaWeeks = velocity > 0 ? backlogMinutes / velocityMinutesPerWeek : null
etaDate  = now + etaWeeks × 7 days

confidence:
  empAgeWeeks = min(4, weeks since employee.createdAt)
  empAgeWeeks ≥ 4 → "high"
  empAgeWeeks ≥ 2 → "medium"
  else           → "low"
```

### 3.3 Skill Load

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-011 | Skill load matrix | `GET /api/capacity/skill-load` — matrix nhân viên × task type với experience count + minutes (90 ngày qua) | Must Have | 8 |
| FR-012 | 7 task types | NORMAL, LEARNING, NEW_RESEARCH, MEETING, ADMIN, BILLABLE_CLIENT, INTERNAL | Must Have | 2 |
| FR-013 | Chỉ task DONE | Chỉ tính task đã DONE trong 90 ngày, không tính BACKLOG/IN_PROGRESS | Must Have | 2 |
| FR-014 | Kèm utilization | Mỗi employee row kèm theo current week utilization % (từ workload 7 ngày) | Should Have | 3 |

**Response schema:**
```json
{
  "data": {
    "taskTypes": ["NORMAL", "LEARNING", "NEW_RESEARCH", ...],
    "rows": [
      {
        "employeeId": 5,
        "fullName": "Nguyen Van A",
        "department": "Engineering",
        "utilization": 60,
        "skills": [
          { "taskType": "NORMAL", "experienceCount": 45, "experienceMinutes": 8100 },
          { "taskType": "LEARNING", "experienceCount": 8, "experienceMinutes": 960 }
        ]
      }
    ]
  }
}
```

### 3.4 Office Time Auto-Derive

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-015 | Auto-derive từ session | `POST /api/office-time/auto-derive { employeeId, date }` → phân tích UserSession + UserActivity → suggest `{ startWork1, endWorkday, actualWorked }` | Must Have | 8 |
| FR-016 | Dùng session đầu/cuối | `startWork1` = đầu session earliest trong ngày; `endWorkday` = end của session latest | Must Have | 5 |
| FR-017 | Tính actualWorked | Tổng duration của tất cả sessions trong ngày (loại trừ khoảng cách giữa sessions = break) | Must Have | 5 |
| FR-018 | Employee confirm | Employee review suggestion → confirm → tạo/update OfficeTime record | Must Have | 3 |
| FR-019 | Manual override | Employee vẫn có thể nhập thủ công nếu session data không đầy đủ | Must Have | 2 |

### 3.5 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Manager, tôi muốn xem workload từng nhân viên trong 14 ngày tới theo màu, để phân công task mới không làm ai quá tải. | AC1: Grid: cột = ngày, hàng = nhân viên. AC2: Màu: < 70% → green, 70–90% → yellow, > 90% → red. AC3: Weekend hiển thị cột màu xám (capacity = 0). AC4: Hover vào cell → tooltip: N tasks, M phút load. AC5: `days` max 60 ngày. | High |
| US-002 | Là Manager, tôi muốn biết khi nào team tôi có thể nhận thêm project mới, dựa trên velocity và backlog hiện tại. | AC1: Tab Forecast: list nhân viên + ETA clear backlog (tuần/ngày). AC2: Confidence badge: 🟡 medium nếu chỉ có 2-4 tuần data, 🟢 high nếu ≥ 4 tuần. AC3: Team summary: tổng backlog X giờ, velocity Y giờ/tuần → ETA Z tuần. AC4: Nhân viên mới (< 2 tuần) → "Chưa đủ data" thay vì ETA. | High |
| US-003 | Là Manager, tôi muốn biết ai có nhiều kinh nghiệm làm BILLABLE_CLIENT task, để phân công đúng người cho dự án khách. | AC1: Tab Skill Load: matrix nhân viên × task type. AC2: Cell: số task DONE + tổng giờ trong 90 ngày. AC3: Sort theo kinh nghiệm loại task bất kỳ. AC4: Highlight cell: > 50 tasks = dark, 20-50 = medium, < 20 = light. AC5: Kèm current utilization % của mỗi người. | High |
| US-004 | Là Employee, tôi muốn hệ thống gợi ý giờ làm hôm nay từ session activity của tôi, để không cần nhớ nhập check-in/check-out thủ công. | AC1: `POST /api/office-time/auto-derive { employeeId, date: "today" }` → `{ startWork1: "08:32", endWorkday: "17:45", actualWorked: 462 }`. AC2: `startWork1` = thời điểm session đầu tiên trong ngày. AC3: `endWorkday` = thời điểm kết thúc session cuối. AC4: `actualWorked` = tổng thời gian trong session (không tính break). AC5: Employee review → [Confirm] → OfficeTime được lưu. | Medium |
| US-005 | Là Admin, tôi muốn Forecast tính velocity dựa trên time log thực tế đã được duyệt, không phải estimate, để số liệu phản ánh đúng tốc độ thực của team. | AC1: Velocity chỉ tính TimeLog có `approvalStatus IN [APPROVED, AUTO_APPROVED]`. AC2: Nếu không có approved time log trong 4 tuần → velocity = 0 → "Chưa đủ data". AC3: Backlog = estimatedTime - actualTimeTotal (remaining work), không phải estimatedTime gốc. | High |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Workload 14 ngày, 50 nhân viên | Response time | < 3 giây |
| Performance | Forecast toàn org | Response time | < 5 giây |
| Accuracy | Utilization color coding | Ngưỡng đúng | 100% theo <70/70-90/>90 |
| Business days | Weekend capacity = 0 | Logic | `isBusinessDay()`: Mon-Fri only |

---

## 5. Thiết kế & Thuật toán

### 5.1 Workload — Phân bổ remaining work

```
Cho mỗi task active:
  remaining = max(0, estimatedTime - actualTimeTotal)
  if remaining == 0 → skip

  Cửa sổ phân bổ:
    winStart = max(today, task.dateStarted)
    winEnd   = task.dueDate ?? today + 14 days
  
  Liệt kê business days trong [winStart, winEnd]:
    businessDays = [d for d in range(winStart, winEnd) if isBusinessDay(d)]
  
  Nếu không có business day → phân bổ toàn bộ vào today hoặc ngày BDay đầu tiên trong window

  perDay = remaining / len(businessDays)
  for dayKey in businessDays:
    if dayKey in requestedRange:
      loadByEmpDay[emp][dayKey] += perDay

Utilization = loadMinutes / dailyCapacityMinutes × 100
dailyCapacityMinutes = round((employee.maxHoursMonth / 22) × 60)
```

### 5.2 Forecast Confidence

```
empAgeWeeks = min(4, floor((now - employee.createdAt) / 7 days))
confidence:
  empAgeWeeks ≥ 4 → "high"
  empAgeWeeks ≥ 2 → "medium"
  else            → "low"
```

### 5.3 Skill Load — 90 ngày rolling

```
Lấy tasks WHERE:
  status = DONE
  dateCompleted ≥ now - 90 days
  assignedToId IN active employees

GROUP BY (assignedToId, taskType)
→ experienceCount = _count
→ experienceMinutes = SUM(actualTimeTotal)

Utilization = từ computeWorkload(orgId, { days: 7 }).avgUtilization per employee
```

### 5.4 Office Time Auto-Derive

```
Lấy UserSession WHERE:
  employeeId = X
  startedAt.date = requested date
  ORDER BY startedAt ASC

startWork1 = sessions[0].startedAt
endWorkday = sessions[-1].endedAt (hoặc sessions[-1].lastActivityAt nếu chưa close)
actualWorked = SUM(session.duration) in minutes
  (không cộng khoảng gap giữa sessions → gap = break time)
```

### 5.5 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Capacity Overview | `/capacity` | Tabs: Workload \| Forecast \| Skill Load |
| Workload Tab | `/capacity?tab=workload` | Grid nhân viên × ngày với color coding |
| Forecast Tab | `/capacity?tab=forecast` | ETA per person + Team ETA |
| Skill Load Tab | `/capacity?tab=skill-load` | Matrix nhân viên × task type |
| Office Time Auto | `/office-time?autoDerive=1` | Suggestion panel khi nhân viên chưa check-in |

---

## 6. Business Rules

### BR-001 — Workload chỉ tính task có estimatedTime > 0

Task không có estimate (`estimatedTime = null` hoặc `= 0`) không được tính vào workload — không thể phân bổ nếu không biết task mất bao lâu.

### BR-002 — Weekend có capacity = 0, không có load

`isBusinessDay()`: Monday (1) đến Friday (5). Saturday (6) và Sunday (0) → capacity = 0, utilization = 0. Không tính overload vào weekend.

### BR-003 — Forecast velocity chỉ dùng Approved time logs

Velocity phải dựa trên work đã được Manager verify (`approvalStatus IN [APPROVED, AUTO_APPROVED]`). Tránh tình huống employee log phantom time → inflate velocity → forecast không thực tế.

### BR-004 — Skill Load lookback 90 ngày rolling

Chỉ tính task DONE trong 90 ngày qua (rolling, không phải theo quý cố định) — để reflect skill distribution thực tế gần đây, không bị lệch bởi project cũ từ nhiều năm trước.

### BR-005 — Auto-Derive không tự lưu OfficeTime

`POST /api/office-time/auto-derive` chỉ trả về suggestion, không tự tạo record. Employee hoặc Manager phải confirm mới lưu. Đảm bảo accuracy — session activity có thể bao gồm thời gian idle mà không phải làm việc thực sự.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem Workload toàn team | ❌ | ✅ | ✅ | ✅ |
| Xem Forecast toàn team | ❌ | ✅ | ✅ | ✅ |
| Xem Skill Load toàn team | ❌ | ✅ | ✅ | ✅ |
| Xem workload của bản thân | ✅ | ✅ | ✅ | ✅ |
| Trigger Auto-Derive cho bản thân | ✅ | ✅ | ✅ | ✅ |
| Trigger Auto-Derive cho người khác | ❌ | ✅ | ✅ | ✅ |
| Confirm Office Time suggestion | ✅ (của mình) | ✅ | ✅ | ✅ |
