# PRD-17 — Capacity Planning & Tổng hợp KPI

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Capacity / Summary / KPI Dashboard |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, CEO |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Leadership và Manager không có bức tranh tổng thể về năng lực nhân sự và hiệu suất: không biết ai đang over-allocated, ai đang rảnh, KPI tháng này ra sao so với tháng trước. Phải thu thập thủ công từ nhiều nguồn (Excel, email, báo cáo rời).

### 1.2 Mục tiêu sản phẩm (Goals)

- Dashboard tổng hợp KPI: headcount, leave, task completion, attendance, performance score.
- Capacity view: từng nhân viên đang allocated bao nhiêu % capacity.
- Early warning: ai đang at-risk (over-allocated, nhiều ngày nghỉ, task trễ deadline).

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** KPI dashboard tổng hợp từ các module khác, capacity view theo người/phòng ban, trend charts theo tháng, early warning indicators.

**Ngoài phạm vi:** OKR management (v2), predictive analytics bằng AI (v2), custom KPI builder (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **CEO / C-Level** | Cần bức tranh tổng thể về tình trạng nhân sự để ra quyết định. | 1 trang dashboard, số liệu thực, real-time. | Phải chờ HR báo cáo cuối tháng; số liệu có thể đã outdated. |
| **HR Admin** | Theo dõi KPI HR: turnover, headcount, leave balance, performance. | Thấy trend, so sánh tháng này vs tháng trước. | Phải tổng hợp thủ công từ nhiều nguồn. |
| **Manager** | Quản lý capacity của team: ai đang quá tải, ai còn bandwidth. | Capacity heat map team mình; early warning trước khi burnout. | Không biết member của mình đang chịu bao nhiêu task cùng lúc. |

### 2.2 User Journey

**CEO — Xem KPI tháng:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Đăng nhập → Vào /dashboard/executive | Xem overview |
| 2 | Xem: Tổng nhân viên | Tỷ lệ nghỉ phép | Task completion rate | Performance avg | On-time attendance % | Tổng quỹ lương tháng | Dữ liệu tổng quan |
| 3 | Click vào metric → drill down chi tiết theo phòng ban | Phân tích sâu |
| 4 | So sánh với tháng trước → xem trend | Đánh giá xu hướng |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Executive KPI Dashboard | Dashboard tổng hợp: headcount, attendance, leave, tasks, performance, payroll | Must Have | 13 |
| FR-002 | Capacity View | Mỗi nhân viên: số task active, estimated hours, % capacity đang dùng | Must Have | 13 |
| FR-003 | Team Capacity Heat Map | Ma trận: team members × ngày trong tuần, màu sắc theo % capacity | Should Have | 8 |
| FR-004 | Trend Charts | Biểu đồ trend theo tháng: headcount, turnover, task completion, attendance | Should Have | 8 |
| FR-005 | Early Warning | Alert: over-allocated (>100%), nhiều task trễ deadline, nhiều ngày nghỉ phép bất thường | Must Have | 8 |
| FR-006 | Headcount Report | Báo cáo nhân sự: theo phòng ban, gender, loại hợp đồng, seniority | Should Have | 5 |
| FR-007 | Leave Summary | Tổng hợp phép: đã dùng, còn lại, theo loại | Should Have | 5 |
| FR-008 | Task Completion Rate | % task done theo team/phòng ban/sprint | Should Have | 5 |
| FR-009 | Export báo cáo | Export PDF/Excel các báo cáo | Should Have | 5 |
| FR-010 | Date range filter | Lọc theo tháng, quý, năm, hoặc custom range | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là CEO, tôi muốn xem 1 trang dashboard với tất cả KPI quan trọng, để có cái nhìn tổng quan trong 30 giây mà không cần mở nhiều tab. | AC1: Cards: Tổng nhân viên (MoM%) | Tỷ lệ nghỉ phép tháng | Task completion rate | Performance score trung bình | Attendance on-time rate | Tổng net payroll tháng. AC2: Mỗi card có mũi tên trend (tăng/giảm so với tháng trước). AC3: Click vào card → drill down theo phòng ban. | High |
| US-002 | Là Manager, tôi muốn xem capacity của từng member trong team, để phân công task không bị over-allocate người nào. | AC1: Danh sách thành viên team: Tên | Task đang active | Estimated hours còn lại tuần này | % Capacity (estimated hours / available hours × 100). AC2: Màu: <70% = xanh, 70-90% = vàng, >90% = đỏ. AC3: Available hours = (số ngày làm việc còn lại trong tuần × 8) − giờ đã log + giờ estimated tasks. | High |
| US-003 | Là Manager, tôi muốn nhận cảnh báo sớm khi thành viên team đang at-risk, để can thiệp trước khi burnout hoặc miss deadline. | AC1: Early warning indicators: (1) Capacity > 100% liên tục 3 ngày, (2) Có task LATE > 2 ngày, (3) Nghỉ phép > 3 ngày/tháng bất thường, (4) Chưa check-in 2 ngày liên tiếp (không phải lịch nghỉ). AC2: Warning badge trên avatar nhân viên trong capacity view. AC3: Click warning → xem chi tiết lý do. | High |
| US-004 | Là HR Admin, tôi muốn xem trend headcount và turnover theo tháng, để lập kế hoạch tuyển dụng. | AC1: Chart: Line chart headcount 12 tháng gần nhất. AC2: Bar chart: tuyển mới vs nghỉ việc mỗi tháng. AC3: Turnover rate = (số nghỉ việc / headcount đầu tháng) × 100%. AC4: Breakdown theo phòng ban. | Medium |
| US-005 | Là HR Admin, tôi muốn xuất báo cáo tổng hợp nhân sự theo quý cho Board meeting, để không mất thời gian tổng hợp thủ công. | AC1: Chọn loại báo cáo + date range → [Export PDF]. AC2: PDF có header công ty, date range, tổng hợp KPI chính. AC3: Export xong trong < 10 giây. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Dashboard load time | Thời gian | < 3 giây (dữ liệu 12 tháng, 500 nhân viên) |
| Freshness | Dữ liệu KPI được cập nhật | Cache TTL | ≤ 5 phút (acceptable lag cho dashboard) |
| Accuracy | Số liệu phải khớp với nguồn gốc | Tolerance | 0% sai lệch |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Executive Dashboard**

```
/dashboard/executive
→ Row 1: KPI cards (6 metrics với trend)
→ Row 2: Trend charts (headcount, task completion, attendance)
→ Row 3: Department breakdown table
→ Filter: [Tháng này ▼] [Toàn công ty ▼]
→ Click phòng ban → filter toàn dashboard theo phòng ban đó
```

**Luồng 2: Capacity View**

```
/dashboard/capacity
→ Filter: Team | Phòng ban | Tuần (mặc định: tuần này)
→ Bảng: Avatar | Tên | Tasks active | Hours estimated | Hours available | % Capacity | Warning badges
→ Hover % → tooltip: breakdown tasks đang có
→ Click tên → Employee profile → Tab Tasks
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Executive Dashboard | `/dashboard/executive` | KPI tổng hợp cho C-Level |
| Manager Dashboard | `/dashboard/team` | Dashboard team của Manager |
| Capacity View | `/dashboard/capacity` | Allocation từng người |
| HR Reports | `/dashboard/hr` | Báo cáo HR chi tiết |

---

## 6. Business Rules

### BR-001 — Capacity tính theo giờ làm việc quy định

```
available_hours = số ngày làm việc còn lại trong tuần × 8 giờ
                − số giờ đã log trong tuần này
                − giờ nghỉ phép đã được duyệt

allocated_hours = sum(estimatedHours của task ACTIVE + IN_PROGRESS của người đó)

capacity_pct = (allocated_hours / available_hours) × 100
```

### BR-002 — Early warning ngưỡng có thể cấu hình

Ngưỡng mặc định: capacity > 90% = warning, > 110% = critical. HR Admin có thể điều chỉnh ngưỡng này trong Settings.

### BR-003 — Dashboard dùng cached data

Dữ liệu KPI được cache 5 phút (không query DB trực tiếp mỗi lần load). Khi có update quan trọng (approve payroll, complete sprint) → invalidate cache liên quan.

### BR-004 — Turnover rate loại trừ nhân viên thử việc

Turnover rate chỉ tính nhân viên chính thức (không tính PROBATION). Nhân viên thử việc kết thúc → ghi nhận riêng trong report.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin / CEO |
|---|---|---|---|---|
| Xem Executive Dashboard | ❌ | ❌ | ✅ | ✅ |
| Xem Team Dashboard (team của mình) | ❌ | ✅ | ✅ | ✅ |
| Xem Capacity View (team của mình) | ❌ | ✅ | ✅ | ✅ |
| Xem Capacity View toàn công ty | ❌ | ❌ | ✅ | ✅ |
| Xem early warning của bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem early warning team | ❌ | ✅ | ✅ | ✅ |
| Export báo cáo | ❌ | ✅ (team) | ✅ | ✅ |
| Điều chỉnh ngưỡng warning | ❌ | ❌ | ✅ | ✅ |
