# PRD-27 — Dashboard Homepage

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Dashboard Homepage |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, All Users |
| API chính | `GET /api/dashboard?month=&year=&priority=&status=&teamId=&handlerId=&taskType=` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Khi nhân viên đăng nhập vào hệ thống, họ cần biết ngay: tôi đang có bao nhiêu task, bao nhiêu bị overdue, có gì cần làm ngay hôm nay. Manager cần thêm: team tôi đang như thế nào trong tháng này, có ai đang blocked không, tiến độ tháng ra sao. Không có trang dashboard → ai cũng phải vào từng module riêng lẻ để ghép bức tranh tổng thể — mất thời gian và dễ miss thông tin quan trọng.

### 1.2 Mục tiêu sản phẩm (Goals)

- Cung cấp **trang landing sau đăng nhập** với overview tức thì về trạng thái công việc của người dùng.
- **Role-based scoping:** Admin thấy toàn org, Manager thấy team, Employee thấy của mình.
- **Filter linh hoạt:** Lọc theo tháng/năm, priority, status, task type, handler.
- **Daily Series Chart:** Biểu đồ task tạo mới vs hoàn thành theo từng ngày trong tháng.
- **Status Distribution:** Breakdown % theo từng status — nhìn ngay tỷ lệ BLOCKED, DONE, v.v.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Dashboard API aggregation (count metrics, daily series, status distribution), role-based data scoping, filter params.

**Ngoài phạm vi:** Real-time WebSocket push cho dashboard (v2), widget customization (v2), drill-down analytics (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Dashboard hiển thị | Mong đợi |
|---|---|---|---|
| **Employee** | Nhân viên thực hiện công việc hàng ngày. | Chỉ task của bản thân. | Biết ngay mình có bao nhiêu task đang làm, bao nhiêu overdue. |
| **Manager / Team Lead** | Quản lý team, theo dõi tiến độ. | Task của toàn team (hoặc filter theo 1 người). | Xem tổng quan team tháng này, ai đang bị blocked, tiến độ so với kỳ vọng. |
| **Admin / Super Admin** | Quản trị toàn workspace. | Task toàn org (có thể filter theo team). | Overview sức khỏe toàn workspace, phát hiện bottleneck. |

### 2.2 User Journey

**Manager — Check dashboard đầu ngày:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Đăng nhập → redirect về `/dashboard` | Dashboard load với default: tháng hiện tại |
| 2 | Thấy: BLOCKED = 3, OVERDUE = 5 → cao bất thường | Identify vấn đề |
| 3 | Filter `status=BLOCKED` → xem 3 task đang blocked | Task nào, ai đang cần giải quyết |
| 4 | Xem Daily Series Chart: tuần này completed thấp hơn tuần trước | Flag cần check với team |
| 5 | Filter `handlerId=X` → xem cụ thể nhân viên X | Deep dive người cụ thể |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Dashboard Metrics API

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Task count metrics | `backlogCount`, `inProgressCount`, `blockedCount`, `reviewCount`, `overdueCount` | Must Have | 5 |
| FR-002 | Status distribution | `statusDistribution: [{ status, count }]` — toàn bộ statuses có task | Must Have | 3 |
| FR-003 | Daily series | `dailySeries: [{ date: "DD/MM", created: N, completed: M }]` — từng ngày trong tháng | Must Have | 5 |
| FR-004 | Role-based scope | Admin → toàn org; Manager/TeamLead → team/managedIds; Employee → bản thân | Must Have | 8 |
| FR-005 | Filter params | `month`, `year`, `priority`, `status`, `teamId`, `handlerId`, `taskType` | Must Have | 5 |
| FR-006 | Task types available | `taskTypes: []` — list distinct task type employee đang có (dùng để populate filter dropdown) | Should Have | 2 |

### 3.2 Role-Based Scoping Logic Chi tiết

| Role | Scope mặc định | Filter override |
|---|---|---|
| `SUPER_ADMIN`, `ADMIN` | Toàn org (`organizationId`) | Có thể filter theo `teamId` |
| `MANAGER` | Task của tất cả employees có `managerId = currentUser.id` | Có thể filter theo `handlerId` trong danh sách managedIds |
| `TEAM_LEAD` | Task của employees trong team do mình lead (`team.leadId = currentUser.id`) | Có thể filter theo `handlerId` trong team |
| `EMPLOYEE` (và các role khác) | Chỉ task `assignedToId = currentUser.id` | Không có filter override |

**Xử lý edge case Manager không có subordinate:**
- Manager mà `managedIds = []` → trả về tất cả counts = 0 và dailySeries zeros (không throw error).

### 3.3 Daily Series Computation

```
Tháng: month/year (default = current month)
startOfMonth = Date(year, month-1, 1)
endOfMonth   = Date(year, month, 0, 23:59:59)
daysInMonth  = 28/29/30/31

tasksCreated   = task WHERE dateCreated IN [startOfMonth, endOfMonth] AND scope
tasksCompleted = task WHERE status=DONE AND dateCompleted IN [startOfMonth, endOfMonth] AND scope

dailySeries = [
  { date: "DD/MM", created: createdByDay[i], completed: completedByDay[i] }
  for i in range(daysInMonth)
]
```

### 3.4 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Employee, tôi muốn thấy ngay tổng quan task của mình khi vào dashboard, để không cần vào từng màn hình task riêng. | AC1: 4 metric cards: BACKLOG \| IN_PROGRESS \| BLOCKED \| REVIEW. AC2: Card OVERDUE với màu đỏ nếu > 0. AC3: Dữ liệu chỉ của mình (không thấy task người khác). AC4: Load < 1 giây. | High |
| US-002 | Là Manager, tôi muốn xem dashboard team theo từng tháng và lọc theo nhân viên, để review tiến độ trong 1-1 meeting. | AC1: Filter: Month/Year picker + Handler dropdown (chỉ hiện người trong team). AC2: Khi filter theo handlerId → tất cả metrics scope về nhân viên đó. AC3: Daily series chart: 2 lines (created vs completed) theo từng ngày. AC4: Status distribution: pie/bar chart breakdown %. | High |
| US-003 | Là Admin, tôi muốn xem toàn bộ workspace trong dashboard và filter theo team, để monitor sức khỏe toàn công ty. | AC1: Admin thấy toàn bộ task (không bị scope thu hẹp). AC2: Filter `teamId` → chỉ scope về team đó. AC3: `isAdmin: true` trong response → UI hiện filter team. AC4: `isManager: true` trong response → UI hiện filter handler. | High |
| US-004 | Là Manager, tôi muốn xem biểu đồ task hoàn thành theo ngày trong tháng, để nhận biết khi nào productivity thấp. | AC1: `dailySeries` có đủ N phần tử = số ngày trong tháng (kể cả ngày chưa có data = 0). AC2: Ngày format `DD/MM` (VD: "15/07"). AC3: Biểu đồ line chart: completed = trục chính, created = secondary. AC4: Hover vào ngày → tooltip: X task created, Y task completed. | High |
| US-005 | Là Employee, tôi muốn filter dashboard theo task type, để xem chỉ BILLABLE_CLIENT tasks của tháng này. | AC1: `taskType` filter param → scope cả metrics và daily series. AC2: Filter dropdown populate từ `taskTypes` field trong response (chỉ hiện type đang có). AC3: Khi filter active → badge "Đang lọc: BILLABLE_CLIENT" visible. AC4: Reset filter button clear tất cả. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Dashboard API với filter | Response time | < 1 giây |
| Data freshness | Dashboard load lại mỗi khi filter thay đổi | Latency | < 500ms sau khi user chọn filter |
| Role isolation | Employee không thể thấy data của người khác | Security | 100% enforce ở server-side |
| Completeness | dailySeries phải có đủ N ngày, kể cả = 0 | Coverage | Luôn trả đủ daysInMonth phần tử |

---

## 5. Thiết kế & UX

### 5.1 Dashboard Response Schema

```json
GET /api/dashboard?month=7&year=2026

{
  "backlogCount": 12,
  "inProgressCount": 8,
  "blockedCount": 2,
  "reviewCount": 3,
  "overdueCount": 1,
  "statusDistribution": [
    { "status": "BACKLOG", "count": 12 },
    { "status": "IN_PROGRESS", "count": 8 },
    { "status": "BLOCKED", "count": 2 },
    { "status": "REVIEW", "count": 3 },
    { "status": "DONE", "count": 45 },
    { "status": "CANCELLED", "count": 3 }
  ],
  "dailySeries": [
    { "date": "01/07", "created": 3, "completed": 2 },
    { "date": "02/07", "created": 5, "completed": 4 },
    ...
    { "date": "31/07", "created": 0, "completed": 0 }
  ],
  "isManager": true,
  "isAdmin": false,
  "taskTypes": ["NORMAL", "LEARNING", "BILLABLE_CLIENT"]
}
```

### 5.2 Filter Params

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `month` | int 1-12 | current month | Tháng cần xem |
| `year` | int | current year | Năm cần xem |
| `priority` | string | null | Filter theo priority (CRITICAL/HIGH/NORMAL/LOW) |
| `status` | string | null | Filter metrics theo status |
| `teamId` | int | null | Admin-only: scope về team |
| `handlerId` | int | null | Manager-only: scope về 1 nhân viên trong team |
| `taskType` | string | null | Filter theo task type |

### 5.3 Luồng màn hình Dashboard

```
/ → redirect → /(dashboard)

/(dashboard) → Dashboard page
  → Header: "Xin chào, {name} 👋" + "Tháng 07/2026"
  → Filter bar: [Month/Year picker] [Priority] [Status] [Task Type]
    + nếu isAdmin: [Team dropdown]
    + nếu isManager: [Handler dropdown]
  
  → Row 1: Metric Cards (5 cards)
    [BACKLOG: 12] [IN_PROGRESS: 8] [BLOCKED: 2 ⚠️] [REVIEW: 3] [OVERDUE: 1 🔴]
  
  → Row 2: Charts (2 columns)
    Trái: Daily Series (line chart — created vs completed by day)
    Phải: Status Distribution (donut/bar chart)
  
  → Row 3: Quick Actions
    [+ Tạo task] [Xem task của tôi] [Xem calendar]
```

### 5.4 Màn hình & routes

| Màn hình | Route | Mô tả |
|---|---|---|
| Dashboard | `/` hoặc `/(dashboard)` | Landing page sau đăng nhập |
| Dashboard API | `GET /api/dashboard` | Aggregation endpoint |

---

## 6. Business Rules

### BR-001 — Employee không thể xem dashboard người khác

Role EMPLOYEE: `baseScope = { assignedToId: currentUser.id }`. Không có override. Ngay cả khi gửi `handlerId` param → bị ignore (không lọc theo handler của người khác).

### BR-002 — Manager chỉ filter trong danh sách managedIds

Manager gửi `handlerId=X` → hệ thống verify `X ∈ managedIds`. Nếu X không phải subordinate → scope vẫn là `assignedToId: { in: managedIds }` (không cho phép xem người ngoài team).

### BR-003 — dailySeries luôn đủ số ngày trong tháng

Kể cả ngày chưa có task nào → vẫn trả `{ date: "DD/MM", created: 0, completed: 0 }`. Đảm bảo chart không bị "lỗ hổng" trên trục X.

### BR-004 — overdueCount đếm task không-DONE và không-CANCELLED có isOverdue = true

```sql
WHERE isOverdue = true AND status NOT IN ['DONE', 'CANCELLED'] AND [scope]
```
Task DONE dù quá hạn → không tính vào overdueCount (đã hoàn thành dù muộn).

### BR-005 — TEAM_LEAD scope theo team họ lead, không phải managerId

TEAM_LEAD: tìm team có `leadId = currentUser.id AND isActive = true` → lấy employees trong team. Khác với MANAGER: dùng `employee.managerId = currentUser.id`. Hai logic khác nhau, không nhầm.

---

## 7. Phân quyền

| Tính năng | Employee | Manager / Team Lead | HR Admin | Admin |
|---|---|---|---|---|
| Xem dashboard của bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem dashboard team | ❌ | ✅ | ✅ | ✅ |
| Filter theo handler (người cụ thể) | ❌ | ✅ (trong team) | ✅ | ✅ |
| Filter theo teamId | ❌ | ❌ | ✅ | ✅ |
| Xem dashboard toàn org | ❌ | ❌ | ✅ | ✅ |
| `isManager` flag trong response | ❌ | ✅ | ✅ | ✅ |
| `isAdmin` flag trong response | ❌ | ❌ | ✅ | ✅ |
