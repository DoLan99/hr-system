# PRD-10: Lương & Thanh toán (Payments)

**Module:** Payments / Payroll  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Quản lý tính toán và ghi nhận thanh toán lương cho nhân viên. Tích hợp dữ liệu từ chấm công, OT, phép nghỉ và KPI để tạo bảng lương hàng tháng.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | Tạo bảng lương, duyệt, xuất phiếu lương |
| Manager | Xem bảng lương team |
| Employee | Xem phiếu lương của mình |

---

## 3. Luồng chức năng

### 3.1 Tạo bảng lương tháng

```
Admin vào /payments → "Tạo bảng lương tháng [X]"
    → POST /api/payments (bulk create)
    → Hệ thống tổng hợp:
        - Lương cơ bản (từ hồ sơ nhân viên)
        - Số ngày công thực tế (từ office-time)
        - Giờ OT (từ office-time)
        - Số ngày phép đã dùng (từ leave)
        - KPI / performance bonus (từ performance review)
        - Các khoản phụ cấp / giảm trừ
    → Tạo Payment record cho mỗi nhân viên
    → Status = DRAFT
```

### 3.2 Review & Chỉnh sửa

```
Admin xem bảng lương draft
    → GET /api/payments (filter: month, status)
    → Xem chi tiết từng nhân viên: GET /api/payments/[id]
    → Chỉnh sửa nếu cần: PUT /api/payments/[id]
        - Thêm bonus
        - Thêm khấu trừ
        - Ghi chú
```

### 3.3 Xác nhận & Thanh toán

```
Admin review xong → "Xác nhận bảng lương"
    → PUT /api/payments/[id] { status: "CONFIRMED" }
    → Ghi ngày thanh toán dự kiến
    → Sau khi chuyển khoản thực tế:
    → PUT /api/payments/[id] { status: "PAID", paidAt: now }
    → Hệ thống gửi phiếu lương (email) đến nhân viên
```

### 3.4 Nhân viên xem phiếu lương

```
Nhân viên vào /payments
    → GET /api/payments (filter: mình)
    → Xem phiếu lương theo tháng:
        - Lương cơ bản
        - Tổng ngày công
        - OT
        - Bonus
        - Khấu trừ (BHXH, thuế TNCN, ...)
        - Thực nhận
    → Download PDF phiếu lương
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/payments` | Danh sách payments (filter: month, employeeId, status) |
| POST | `/api/payments` | Tạo payment records |
| GET | `/api/payments/[id]` | Chi tiết phiếu lương |
| PUT | `/api/payments/[id]` | Cập nhật (bonus, khấu trừ, status) |
| DELETE | `/api/payments/[id]` | Xóa (chỉ khi DRAFT) |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/payments` | Bảng lương + phiếu lương cá nhân |

---

## 6. Data Model (Payment)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `employeeId` | UUID | FK → Employee |
| `month` | Int | Tháng (1-12) |
| `year` | Int | Năm |
| `baseSalary` | Decimal | Lương cơ bản |
| `workingDays` | Float | Số ngày công thực tế |
| `standardDays` | Float | Số ngày công chuẩn |
| `overtimeHours` | Float | Giờ OT |
| `overtimePay` | Decimal | Tiền OT |
| `bonus` | Decimal | Thưởng |
| `allowances` | JSON | Phụ cấp (ăn, đi lại, ...) |
| `deductions` | JSON | Khấu trừ (BHXH, thuế, ...) |
| `netSalary` | Decimal | Thực nhận |
| `status` | Enum | DRAFT / CONFIRMED / PAID / CANCELLED |
| `paidAt` | DateTime | Ngày thanh toán thực tế |
| `note` | String | Ghi chú |

---

## 7. Business Rules

- Mỗi nhân viên chỉ có 1 Payment record/tháng.
- Chỉ Admin mới tạo và duyệt bảng lương.
- PAID records không thể chỉnh sửa (cần tạo adjustment).
- netSalary = baseSalary × (workingDays/standardDays) + overtimePay + bonus + allowances - deductions.
- BHXH/TNCN tính theo quy định Việt Nam hiện hành (cấu hình theo năm).
