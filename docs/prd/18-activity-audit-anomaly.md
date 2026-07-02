# PRD-18 — Activity Tracking, Audit Log & Anomaly Detection

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Activity / Audit Log / Anomaly Detection |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Admin, Security, Compliance |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Hệ thống HR chứa dữ liệu nhạy cảm (lương, hợp đồng, thông tin cá nhân). Cần:
- Ghi lại mọi thay đổi dữ liệu để phục vụ audit compliance.
- Phát hiện hành vi bất thường: đăng nhập lạ, truy cập dữ liệu hàng loạt, thay đổi lương đột ngột.
- Theo dõi hoạt động người dùng để security investigation khi cần.

Không có audit trail → khi xảy ra sự cố không biết ai đã làm gì.

### 1.2 Mục tiêu sản phẩm (Goals)

- Audit Log tự động cho tất cả thay đổi dữ liệu trên các entity quan trọng (AUDITED_MODELS).
- Activity Tracking: theo dõi session, API access, heartbeat người dùng đang active.
- Anomaly Detection: phát hiện và alert các hành vi bất thường.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Auto audit log (qua Prisma extension), UserSession tracking, ApiAccessLog, AnomalyAlert, dashboard audit.

**Ngoài phạm vi:** SIEM integration (v2), machine learning anomaly (v2), compliance report tự động cho kiểm toán viên ngoài (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Admin / Super Admin** | Kiểm tra ai đã làm gì khi xảy ra sự cố; theo dõi suspicious activity. | Search audit log nhanh; nhận alert anomaly ngay lập tức. | Không có audit trail → không điều tra được khi có vấn đề. |
| **Compliance Officer / HR Admin** | Đảm bảo dữ liệu nhạy cảm chỉ được truy cập đúng người; chuẩn bị báo cáo kiểm toán. | Export audit log theo date range; xem ai đã xem dữ liệu lương. | Phải điều tra thủ công, tốn nhiều thời gian. |

### 2.2 User Journey

**Admin — Điều tra sự cố:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận AnomalyAlert: "Người dùng X export 200 records lương trong 5 phút" | Phát hiện anomaly |
| 2 | Vào /audit-logs → Filter: user = X, entity = PayrollRun, date = hôm nay | Tìm dấu vết |
| 3 | Xem từng action: export, view, timestamp, IP | Điều tra |
| 4 | Vào /sessions → Xem session của X: login từ IP lạ | Xác nhận breach |
| 5 | [Revoke session] → Buộc logout X → Notify security team | Xử lý |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Auto Audit Log | Prisma extension tự động ghi AuditLog cho AUDITED_MODELS khi có CREATE/UPDATE/DELETE | Must Have | 13 |
| FR-002 | Manual Audit Log | API middleware ghi log cho actions không qua Prisma (export, view sensitive data) | Must Have | 8 |
| FR-003 | UserSession Tracking | Ghi nhận login/logout, duration, IP, device, browser | Must Have | 5 |
| FR-004 | API Access Log | Ghi mỗi API request: method, route, statusCode, duration, userId | Should Have | 8 |
| FR-005 | Activity Heartbeat | Client ping mỗi 30s → ghi UserActivity; tính last seen, active minutes | Should Have | 5 |
| FR-006 | Anomaly Detection | Rules-based: đăng nhập IP lạ, bulk export, thay đổi lương lớn, nhiều lần sai password | Must Have | 13 |
| FR-007 | AnomalyAlert notification | Alert cho Admin khi phát hiện anomaly: in-app + email | Must Have | 5 |
| FR-008 | Audit Log Dashboard | Search, filter, xem chi tiết audit logs; xem sessions active | Must Have | 8 |
| FR-009 | Export Audit Log | Export CSV/Excel audit log theo date range, entity, user | Should Have | 5 |
| FR-010 | Session revoke | Admin force logout user (revoke session) | Should Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Admin, tôi muốn hệ thống tự động ghi lại mọi thay đổi dữ liệu quan trọng, để tôi không cần nhớ phải log thủ công. | AC1: Các entity trong AUDITED_MODELS (Employee, PayrollRun, LeaveRequest, Task, Customer...) tự động có audit log khi CREATE/UPDATE/DELETE. AC2: Mỗi log: entityType, entityId, action, userId, timestamp, oldValue (JSON), newValue (JSON), IP. AC3: Audit log immutable — không ai có thể xóa/sửa (kể cả Admin). | High |
| US-002 | Là Admin, tôi muốn tìm kiếm audit log theo nhiều tiêu chí, để điều tra sự cố nhanh. | AC1: Filter: User, Entity type, Action (CREATE/UPDATE/DELETE), Date range, IP. AC2: Full-text search trong entity ID. AC3: Kết quả phân trang, 50 items/trang. AC4: Sort theo timestamp DESC mặc định. AC5: Response < 2 giây với index tốt. | High |
| US-003 | Là Admin, tôi muốn nhận alert khi phát hiện hành vi bất thường, để phản ứng kịp thời trước khi thiệt hại lan rộng. | AC1: Rule 1: Login từ IP chưa từng thấy → MEDIUM alert. AC2: Rule 2: Export > 100 records sensitive data trong 10 phút → HIGH alert. AC3: Rule 3: Thay đổi lương > 50% trong 1 lần → HIGH alert. AC4: Rule 4: 5 lần sai password liên tiếp → MEDIUM alert. AC5: Alert format: Rule triggered, user, timestamp, detail, severity. AC6: Notification: in-app + email cho tất cả Admin. | High |
| US-004 | Là Compliance Officer, tôi muốn xem ai đã truy cập dữ liệu lương trong tháng qua, để chuẩn bị cho kiểm toán nội bộ. | AC1: Filter audit log: entityType = PayrollRun/Payslip, action = VIEW/READ, date range. AC2: Kết quả: User | Action | Entity ID | Timestamp | IP. AC3: Export CSV với filter đã áp dụng. AC4: Tổng số records trong filter visible. | High |
| US-005 | Là Admin, tôi muốn xem tất cả sessions đang active và có thể revoke session của user cụ thể, để xử lý khi phát hiện account bị compromise. | AC1: /sessions → list: User | Login time | IP | Browser | Last active. AC2: Filter theo user hoặc IP. AC3: [Revoke Session] → invalidate token ngay lập tức. AC4: User bị revoke → redirect về login khi request tiếp theo. AC5: Audit log ghi: "Session revoked by Admin [id]". | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Coverage | % actions có audit log | Coverage | 100% cho AUDITED_MODELS |
| Performance | Ghi audit log không làm chậm response | Overhead | < 5ms per request |
| Retention | Lưu audit log | Retention | Tối thiểu 2 năm |
| Immutability | Audit log không thể xóa/sửa | 100% | Không có DELETE API cho AuditLog |
| Anomaly latency | Phát hiện anomaly và gửi alert | Latency | < 30 giây sau khi anomaly xảy ra |

---

## 5. Thiết kế & UX

### 5.1 Kiến trúc 4 lớp Activity Tracking

```
Layer 1 — Foundation
  AsyncLocalStorage: inject { userId, workspaceId, requestId, ip } vào mọi request
  withContext(handler): wrapper bắt buộc trên API routes

Layer 2 — Compliance
  UserSession: ghi login/logout, device info
  ApiAccessLog: mỗi API request → ghi route, method, status, duration

Layer 3 — Activity
  Heartbeat endpoint: client ping /api/activity/heartbeat mỗi 30 giây
  UserActivity: last_seen, active_minutes_today

Layer 4 — Intelligence
  AnomalyDetection service: evaluate rules sau mỗi action
  AnomalyAlert: persist alert + notify Admin
```

### 5.2 Luồng màn hình

**Luồng 1: Tìm kiếm Audit Log**

```
/admin/audit-logs
→ Filter bar: User | Entity type | Action | Date range | IP
→ [Search] → GET /api/admin/audit-logs?filters...
→ Table: Timestamp | User | Action | Entity | Changes summary | IP
→ Click row → Drawer: JSON diff oldValue vs newValue (highlighted)
→ [Export CSV]
```

**Luồng 2: Anomaly Alert**

```
[Background service chạy sau mỗi action]
→ Evaluate rules: nếu match → tạo AnomalyAlert
→ Notify all Admin: in-app + email
→ Admin click notification → /admin/anomalies/:id
→ Xem detail: rule, user, evidence, timestamp
→ [Mark as reviewed] | [Revoke session] | [Disable account]
```

---

## 6. Business Rules

### BR-001 — Audit log là immutable

Không có endpoint DELETE hoặc UPDATE cho AuditLog. Chỉ có INSERT. Nếu cần "undo" → tạo record reverse action mới.

### BR-002 — Context injection bắt buộc trên API routes

Mọi API route PHẢI sử dụng `withContext(handler)` wrapper. Route nào không có → request bị reject với 500 error + alert cho Admin.

### BR-003 — Anomaly rules được evaluate async

Anomaly detection chạy async sau khi response đã trả về client. Không block request chính. Nếu anomaly service lỗi → log error nhưng không ảnh hưởng main flow.

### BR-004 — Session revoke ngay lập tức

Khi Admin revoke session → token bị blacklist trong Redis với TTL = còn lại của token. Request tiếp theo với token đó → 401 Unauthorized, ngay cả khi JWT chưa hết hạn.

### BR-005 — Heartbeat xác định "đang online"

User được coi là "online" nếu có heartbeat trong vòng 90 giây (3 × 30s interval). Sau 90 giây không có heartbeat → trạng thái OFFLINE.

### BR-006 — IP lạ definition

IP được coi là "lạ" nếu user chưa từng login từ IP đó trong 30 ngày gần nhất. IP quen → không trigger anomaly dù login nhiều lần.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem audit log của bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem audit log toàn hệ thống | ❌ | ❌ | 👁 (HR data only) | ✅ |
| Xem Anomaly Alerts | ❌ | ❌ | ❌ | ✅ |
| Mark anomaly as reviewed | ❌ | ❌ | ❌ | ✅ |
| Xem User Sessions | ❌ | ❌ | ❌ | ✅ |
| Revoke session | ❌ | ❌ | ❌ | ✅ |
| Xem API Access Logs | ❌ | ❌ | ❌ | ✅ |
| Export Audit Log | ❌ | ❌ | ✅ (HR data) | ✅ |
| Cấu hình Anomaly Rules | ❌ | ❌ | ❌ | ✅ |
