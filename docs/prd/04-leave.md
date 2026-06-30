# PRD-04: Quản lý Nghỉ phép (Leave)

**Module:** Leave Management  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cho phép nhân viên tạo đơn xin nghỉ phép, theo dõi trạng thái, và quản lý (duyệt/từ chối) từ phía manager/admin. Hỗ trợ nhiều loại phép và tích hợp với Workflow engine cho quy trình duyệt đa cấp.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Employee | Tạo đơn xin nghỉ, xem lịch sử, hủy đơn đang pending |
| Manager | Duyệt / từ chối đơn của nhân viên trong phòng ban |
| Admin | Duyệt / từ chối mọi đơn, xem báo cáo toàn công ty |

---

## 3. Luồng chức năng

### 3.1 Nhân viên tạo đơn xin nghỉ

```
Nhân viên vào /leave → Click "Xin nghỉ phép"
    → Form:
        - Loại nghỉ phép (phép năm / phép bệnh / phép không lương / OT / ...)
        - Ngày bắt đầu (date picker)
        - Ngày kết thúc (date picker)
        - Số ngày (tính tự động, trừ ngày nghỉ cuối tuần)
        - Lý do (textarea)
        - File đính kèm (tuỳ chọn - giấy khám bệnh...)
    → POST /api/leave
    → Hệ thống kiểm tra số ngày phép còn lại
    → Tạo Leave record với status = PENDING
    → Gửi thông báo đến Manager (email / Teams / Zalo)
    → (Tuỳ chọn) Kích hoạt Workflow nếu cần duyệt đa cấp
```

### 3.2 Manager duyệt / từ chối

```
Manager nhận thông báo
    → Vào /leave hoặc /approvals
    → Xem đơn chi tiết
    → Kiểm tra lịch nghỉ của team (calendar view)
    → Duyệt: POST /api/leave/[id]/review { action: "APPROVE", comment }
        → Status = APPROVED
        → Trừ ngày phép của nhân viên
        → Thông báo nhân viên
    → Từ chối: POST /api/leave/[id]/review { action: "REJECT", comment }
        → Status = REJECTED
        → Thông báo nhân viên + lý do từ chối
```

### 3.3 Nhân viên hủy đơn

```
Nhân viên xem đơn đang PENDING
    → Click "Hủy đơn"
    → PUT /api/leave/[id] { status: "CANCELLED" }
    → Chỉ hủy được khi status = PENDING
    → Thông báo đến Manager
```

### 3.4 Xem lịch nghỉ phép

```
Mọi người dùng vào /leave
    → Xem lịch (calendar view) nghỉ phép của bản thân
    → Manager/Admin: Xem lịch của cả team / toàn công ty
    → Filter theo loại phép, tháng, phòng ban
    → Xuất báo cáo nghỉ phép (Export CSV)
```

### 3.5 Quản lý số ngày phép

```
Admin cấu hình:
    - Số ngày phép năm mặc định (vd: 12 ngày/năm)
    - Ngày phép cộng thêm theo thâm niên
    - Ngày nghỉ lễ trong năm
Hệ thống:
    - Tự động cộng phép vào đầu năm / theo tháng
    - Trừ phép khi đơn được APPROVED
    - Cộng lại khi đơn bị CANCELLED (nếu đã approved)
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/leave` | Danh sách đơn nghỉ phép (filter theo user/status/date) |
| POST | `/api/leave` | Tạo đơn xin nghỉ |
| GET | `/api/leave/[id]` | Chi tiết đơn |
| PUT | `/api/leave/[id]` | Cập nhật đơn (hủy) |
| DELETE | `/api/leave/[id]` | Xóa đơn (chỉ khi PENDING) |
| POST | `/api/leave/[id]/review` | Duyệt / từ chối đơn |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/leave` | Danh sách đơn + calendar view + tạo đơn mới |

---

## 6. Data Model (Leave)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `employeeId` | UUID | FK → Employee |
| `leaveType` | Enum | ANNUAL / SICK / UNPAID / OVERTIME / OTHER |
| `startDate` | Date | Ngày bắt đầu |
| `endDate` | Date | Ngày kết thúc |
| `totalDays` | Float | Số ngày (tính tự động) |
| `reason` | String | Lý do |
| `status` | Enum | PENDING / APPROVED / REJECTED / CANCELLED |
| `reviewedBy` | UUID | FK → Employee (người duyệt) |
| `reviewedAt` | DateTime | Thời điểm duyệt |
| `reviewComment` | String | Ghi chú khi duyệt/từ chối |
| `workflowInstanceId` | UUID | FK → WorkflowInstance (tuỳ chọn) |

---

## 7. Trạng thái đơn

```
PENDING → APPROVED (manager duyệt)
PENDING → REJECTED (manager từ chối)  
PENDING → CANCELLED (nhân viên hủy)
APPROVED → CANCELLED (nhân viên hủy trước ngày nghỉ)
```

---

## 8. Business Rules

- Không thể tạo đơn nghỉ phép cho ngày đã qua (trừ phép bổ sung do Admin tạo).
- Ngày nghỉ không tính ngày cuối tuần và ngày lễ.
- Không thể tạo 2 đơn trùng ngày.
- Chỉ hủy được đơn PENDING hoặc APPROVED (nếu chưa đến ngày nghỉ).
- Manager không thể tự duyệt đơn của chính mình → Admin duyệt thay.

---

## 9. Thông báo

| Sự kiện | Gửi đến | Kênh |
|---|---|---|
| Tạo đơn mới | Manager | Email + Teams/Zalo |
| Đơn được duyệt | Nhân viên | Email + In-app |
| Đơn bị từ chối | Nhân viên | Email + In-app |
| Nhân viên hủy đơn | Manager | In-app |

---

## 10. Điều kiện lỗi

| Tình huống | Xử lý |
|---|---|
| Hết ngày phép | Cảnh báo, cho phép tạo phép không lương |
| Ngày trùng với đơn khác | 409 — "Bạn đã có đơn nghỉ trong khoảng thời gian này" |
| Duyệt đơn đã cancelled | 400 — "Đơn đã bị hủy" |
| Hủy đơn đã past | 400 — "Không thể hủy đơn nghỉ đã qua" |
