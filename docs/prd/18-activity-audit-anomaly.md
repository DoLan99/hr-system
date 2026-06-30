# PRD-18: Activity Tracking, Audit Log & Anomaly Detection

**Module:** Activity / Audit / Anomaly  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

**Activity Tracking:** Giám sát hành vi sử dụng hệ thống real-time: ai đang online, ai đang làm gì, thống kê trang hay dùng nhất, heatmap hoạt động.

**Audit Log:** Ghi lại mọi thao tác quan trọng (create/update/delete) để truy vết khi cần, đảm bảo tuân thủ và bảo mật.

**Anomaly Detection:** Tự động phát hiện hành vi bất thường: đăng nhập lạ, bulk action đáng ngờ, truy cập ngoài giờ làm việc.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin (Workspace) | Xem activity, audit, anomaly của workspace |
| Super Admin | Xem tất cả workspace |
| Employee | Xem activity của chính mình |

---

## 3. Activity Tracking — Luồng chức năng

### 3.1 Heartbeat (Client ping)

```
Client gửi heartbeat mỗi 30 giây:
    → POST /api/activity/heartbeat
        { page: "/tasks", timestamp: now }
    → Server:
        - Cập nhật session lastSeen
        - Ghi pageView nếu page thay đổi
        - Session status = ACTIVE
```

### 3.2 Cron: Đóng session stale

```
Cron job /api/cron/close-stale-sessions chạy mỗi 5 phút:
    → Tìm sessions không có heartbeat > 10 phút
    → Session status = CLOSED, ghi endTime
```

### 3.3 Xem Online Users

```
GET /api/activity/online-users
    → Danh sách nhân viên đang active trong 5 phút gần nhất
    → Trả về: [{ employeeId, name, avatar, currentPage, lastSeen }]
    → Dùng để hiển thị "đang online" trên avatar
```

### 3.4 Xem Heatmap hoạt động

```
Admin vào /admin/activity
    → GET /api/activity/heatmap?days=30
    → Heatmap theo giờ trong ngày × ngày trong tuần
    → Heatmap theo ngày trong tháng
    → Chỉ số: số lượt truy cập mỗi slot thời gian
```

### 3.5 Page Stats (Trang nào dùng nhiều nhất)

```
GET /api/activity/page-stats?period=30d
    → Top pages theo số lượt view
    → Thời gian trung bình trên mỗi trang
    → Dùng để ưu tiên cải thiện UX
```

### 3.6 Timeline hoạt động

```
GET /api/activity/timeline?employeeId=&date=
    → Timeline hoạt động của 1 nhân viên trong 1 ngày:
        09:03 - Login
        09:05 - /tasks
        09:45 - /tasks/[id]
        10:30 - /leave
        ...
    → Dùng để tính giờ làm việc thực tế (auto-derive office time)
```

### 3.7 Top Users

```
GET /api/activity/top-users?period=7d
    → Nhân viên có nhiều hoạt động nhất
    → Metrics: sessions, page views, active time
```

### 3.8 Sessions

```
GET /api/activity/sessions?employeeId=
    → Lịch sử sessions: login time, logout time, duration, IP, device
```

---

## 4. Audit Log — Luồng chức năng

### 4.1 Ghi audit tự động

```
Middleware interceptor (áp dụng cho mọi write API):
    → Sau mỗi action thành công:
        POST /internal/audit {
          actorId: userId,
          action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "VIEW_SENSITIVE",
          entityType: "Employee" | "Leave" | "Task" | ...,
          entityId: id,
          before: { ...oldData },    (cho UPDATE/DELETE)
          after: { ...newData },     (cho CREATE/UPDATE)
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          timestamp: now
        }
```

### 4.2 Xem Audit Log

```
Admin vào /admin/audit
    → GET /api/admin/audit
        (filter: actorId, action, entityType, dateRange, search)
    → Hiển thị table: thời gian, người làm, hành động, đối tượng, IP
    → Click xem chi tiết: before/after diff
    → Filter theo ngày: xem ai làm gì hôm qua
```

### 4.3 Audit Timeline theo Entity

```
GET /api/admin/audit/timeline?entityType=Employee&entityId=xxx
    → Timeline mọi thay đổi của 1 entity cụ thể:
        15:30 - Admin A tạo nhân viên B
        16:00 - Admin A gán phòng ban Marketing
        Ngày N - Manager C đổi role
    → Dùng để trace lịch sử nhân viên
```

### 4.4 Export Audit Log

```
Admin → "Export"
    → GET /api/admin/audit/export?startDate=&endDate=&format=csv
    → Download file CSV đầy đủ
    → Dùng cho báo cáo tuân thủ, kiểm toán
```

---

## 5. Anomaly Detection — Luồng chức năng

### 5.1 Cron phát hiện bất thường

```
Cron job /api/cron/anomalies chạy hàng ngày:
    → Phân tích activity + audit logs
    → Các pattern bất thường:
        - Login từ IP/quốc gia lạ
        - Đăng nhập ngoài giờ làm việc (ví dụ: 2h sáng)
        - Bulk delete trong thời gian ngắn (> 20 records/phút)
        - Nhiều failed attempts
        - Truy cập vault nhiều lần liên tiếp
        - Đổi email/phone của nhiều nhân viên cùng lúc
    → Tạo Anomaly record với severity: LOW / MEDIUM / HIGH / CRITICAL
    → Gửi cảnh báo realtime cho Admin (nếu CRITICAL)
```

### 5.2 Xem & Xử lý Anomaly

```
Admin vào /admin/anomalies
    → GET /api/admin/anomalies (filter: severity, status, dateRange)
    → Danh sách anomaly: mô tả, severity, thời gian, actor
    → Click chi tiết: GET /api/admin/anomalies/[id]
        - Xem evidence (activity records liên quan)
        - Xem audit log của actor trong ngày đó
    → Xử lý:
        - "Đã xem xét - Bình thường": PUT { status: "DISMISSED", note }
        - "Đình chỉ tài khoản": Vô hiệu hóa nhân viên
        - "Cần điều tra thêm": PUT { status: "INVESTIGATING" }
```

### 5.3 Refresh thủ công

```
Admin click "Quét ngay"
    → POST /api/admin/anomalies/refresh
    → Chạy lại detection cho 24h gần nhất
    → Trả về số anomaly mới phát hiện
```

---

## 6. API Endpoints

### Activity
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/activity/heartbeat` | Client ping |
| GET | `/api/activity/online-users` | Đang online |
| GET | `/api/activity/heatmap` | Heatmap hoạt động |
| GET | `/api/activity/page-stats` | Thống kê trang |
| GET | `/api/activity/timeline` | Timeline cá nhân |
| GET | `/api/activity/top-users` | Top hoạt động |
| GET | `/api/activity/sessions` | Lịch sử sessions |

### Audit
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/audit` | Audit log (filter) |
| GET | `/api/admin/audit/timeline` | Timeline theo entity |
| GET | `/api/admin/audit/export` | Export CSV |

### Anomaly
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/anomalies` | Danh sách anomaly |
| GET | `/api/admin/anomalies/[id]` | Chi tiết |
| PUT | `/api/admin/anomalies/[id]` | Cập nhật status |
| POST | `/api/admin/anomalies/refresh` | Quét lại |

---

## 7. Màn hình UI

| Route | Màn hình |
|---|---|
| `/admin/activity` | Dashboard hoạt động người dùng |
| `/admin/audit` | Audit log |
| `/admin/audit/timeline` | Timeline audit |
| `/admin/anomalies` | Phát hiện bất thường |

---

## 8. Business Rules

- Heartbeat chỉ ghi khi user đang active (có interaction).
- Audit log không bao giờ bị xóa (immutable).
- Anomaly detection là non-blocking (không ảnh hưởng đến performance).
- CRITICAL anomaly: gửi email + in-app notification ngay lập tức.
- Retention: activity logs giữ 90 ngày, audit logs giữ 2 năm.
- Export audit: chỉ Admin và chỉ được export theo khoảng ngày tối đa 90 ngày/lần.
