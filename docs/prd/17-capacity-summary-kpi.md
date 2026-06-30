# PRD-17: Capacity Planning & Tổng hợp KPI

**Module:** Capacity / Summary / KPI  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

**Capacity Planning:** Phân tích năng lực hiện tại của team, dự báo khả năng tiếp nhận công việc, phát hiện quá tải và thiếu nhân sự theo kỹ năng.

**Summary / KPI:** Tổng hợp hiệu suất làm việc của nhân viên theo kỳ, AI đề xuất chỉ số KPI phù hợp, theo dõi xu hướng.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | Xem toàn bộ capacity + KPI toàn công ty |
| Manager | Xem capacity + KPI team của mình |
| Employee | Xem KPI của bản thân |

---

## 3. Capacity Planning — Luồng chức năng

### 3.1 Xem Workload hiện tại

```
Manager / Admin vào /capacity
    → GET /api/capacity/workload
        (filter: teamId, departmentId, dateRange)
    → Hiển thị per nhân viên:
        - Số task đang IN_PROGRESS
        - Tổng estimated hours còn lại
        - % utilized (so với work hours chuẩn)
        - Tasks sắp đến deadline
    → Heatmap: xanh (nhàn) / vàng (bình thường) / đỏ (quá tải)
```

### 3.2 Dự báo Capacity (Forecast)

```
GET /api/capacity/forecast
    (params: teamId, startDate, endDate)
    → Dự báo capacity available trong khoảng thời gian:
        - Trừ ngày nghỉ phép đã approved
        - Trừ ngày lễ
        - Tính OT nếu có
    → So sánh với task backlog trong sprint kế hoạch
    → Output:
        - Available hours per người
        - Tổng capacity team
        - Cảnh báo nếu backlog > capacity
```

### 3.3 Phân tích tải theo kỹ năng (Skill Load)

```
GET /api/capacity/skill-load
    → Per skill:
        - Số người có kỹ năng này (và level trung bình)
        - Số task đang cần kỹ năng này
        - Tỷ lệ demand/supply
    → Cảnh báo skill bottleneck
    → Gợi ý: skill nào cần training thêm, skill nào đang dư
```

---

## 4. Summary / KPI — Luồng chức năng

### 4.1 Xem Summary nhân viên

```
Manager vào /summary
    → GET /api/summary (filter: employeeId, period)
    → Per nhân viên trong kỳ:
        - Tổng task hoàn thành
        - Tổng giờ làm việc (từ time logs)
        - Tỷ lệ hoàn thành đúng hạn (on-time %)
        - Số task bị reject (quality indicator)
        - Điểm performance review (nếu có)
        - Số ngày nghỉ phép đã dùng
```

### 4.2 Tính toán KPI

```
Admin / Manager trigger:
    → POST /api/summary/calculate
        { employeeId, startDate, endDate }
    → Hệ thống tổng hợp từ nhiều nguồn:
        - Time logs: tổng giờ thực tế
        - Tasks: số lượng, tỷ lệ hoàn thành
        - Office time: ngày công
        - Performance review: điểm đánh giá
    → Tính điểm KPI tổng hợp (weighted score)
    → Lưu Summary record
```

### 4.3 AI Gợi ý KPI

```
Manager / Admin:
    → GET /api/summary/kpi-suggest?roleId=&departmentId=
    → AI phân tích:
        - Công việc đặc thù của role
        - Lịch sử KPI của người cùng role
        - Best practices
    → Đề xuất bộ KPI phù hợp với trọng số gợi ý
    → Admin review và áp dụng
```

### 4.4 Xem xu hướng (Trend)

```
GET /api/summary/trend?employeeId=&months=6
    → Biểu đồ xu hướng 6 tháng gần nhất:
        - Điểm KPI theo tháng
        - Số task hoàn thành theo tháng
        - Giờ làm việc theo tháng
        - Tỷ lệ on-time theo tháng
    → So sánh với trung bình team / toàn công ty
```

### 4.5 Chi tiết Summary

```
GET /api/summary/[id]
    → Chi tiết 1 summary record:
        - Breakdown từng KPI item
        - Evidence: links đến tasks, time logs cụ thể
        - Ghi chú của manager
    → PUT /api/summary/[id]: Manager thêm ghi chú / điều chỉnh
```

---

## 5. API Endpoints

### Capacity
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/capacity/workload` | Tải công việc hiện tại |
| GET | `/api/capacity/forecast` | Dự báo capacity |
| GET | `/api/capacity/skill-load` | Phân tích tải theo kỹ năng |

### Summary / KPI
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/summary` | Danh sách summaries |
| POST | `/api/summary/calculate` | Tính toán KPI |
| GET | `/api/summary/kpi-suggest` | AI gợi ý KPI |
| GET | `/api/summary/trend` | Xu hướng theo thời gian |
| GET | `/api/summary/[id]` | Chi tiết summary |
| PUT | `/api/summary/[id]` | Cập nhật ghi chú |
| DELETE | `/api/summary/[id]` | Xóa summary |

---

## 6. Màn hình UI

| Route | Màn hình |
|---|---|
| `/capacity` | Capacity dashboard + skill load |
| `/summary` | KPI summary + trend charts |

---

## 7. Data Model (Summary)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `employeeId` | UUID | FK → Employee |
| `period` | String | "2026-Q2", "2026-06" |
| `startDate` | Date | Ngày bắt đầu kỳ |
| `endDate` | Date | Ngày kết thúc kỳ |
| `totalTasks` | Int | Tổng task nhận |
| `completedTasks` | Int | Task hoàn thành |
| `onTimeTasks` | Int | Task đúng hạn |
| `totalHours` | Float | Tổng giờ làm |
| `workingDays` | Float | Số ngày công |
| `kpiScore` | Float | Điểm KPI tổng |
| `kpiBreakdown` | JSON | Chi tiết từng KPI |
| `note` | Text | Ghi chú manager |
| `calculatedAt` | DateTime | Thời điểm tính |

---

## 8. Business Rules

- Capacity forecast tự động loại trừ ngày phép APPROVED và ngày lễ.
- KPI score tổng hợp từ nhiều thành phần có thể cấu hình trọng số.
- Summary không tự tính lại — phải trigger thủ công hoặc theo lịch.
- Trend cần tối thiểu 2 kỳ dữ liệu để vẽ biểu đồ có ý nghĩa.
