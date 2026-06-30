# PRD-05: Chấm công & Giờ làm việc (Office Time / Check-in)

**Module:** Office Time / Check-in  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Ghi nhận giờ vào/ra làm việc của nhân viên, tự động tính tổng giờ công, hỗ trợ Admin duyệt điều chỉnh và xuất báo cáo công tháng. Tích hợp với Work Rules để xác định ca làm, OT và các quy tắc làm việc.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Employee | Check-in/out, xem lịch sử chấm công của mình |
| Manager | Xem bảng công của team, request chỉnh sửa |
| Admin | Duyệt chỉnh sửa, xuất báo cáo, cấu hình work rules |

---

## 3. Luồng chức năng

### 3.1 Check-in

```
Nhân viên mở app → Trang Dashboard / Office-time
    → Click "Check-in"
    → POST /api/checkin { type: "IN", timestamp, location? }
    → Tạo OfficeTime record { checkIn: now, status: WORKING }
    → Hiển thị giờ check-in trên màn hình
```

**Điều kiện check-in:**
- Chỉ check-in được 1 lần/ngày (trừ ca phụ)
- Ghi nhận IP / location (tuỳ cấu hình)
- Nếu check-in muộn hơn quy định → flag "LATE"

### 3.2 Check-out

```
Nhân viên click "Check-out"
    → POST /api/checkin { type: "OUT", timestamp }
    → Cập nhật OfficeTime record { checkOut: now }
    → Tính totalHours = checkOut - checkIn - breakTime
    → Xác định OT nếu vượt quá giờ quy định
    → Status = COMPLETED
```

### 3.3 Auto-Derive từ Activity

```
Admin trigger GET /api/office-time/auto-derive
    → Hệ thống phân tích activity log (heartbeat records)
    → Tự động suy luận giờ vào/ra từ thời điểm active/inactive
    → Tạo OfficeTime records draft cho các ngày chưa có check-in thủ công
    → Admin review và xác nhận các records này
```

### 3.4 Nhân viên / Manager đề xuất chỉnh sửa

```
Nhân viên phát hiện sai giờ công
    → Vào /office-time → Chọn ngày cần chỉnh
    → Điền giờ vào/ra đúng + lý do
    → PUT /api/office-time/[id] { checkIn, checkOut, reason }
    → Status = PENDING_APPROVAL
    → Manager/Admin nhận thông báo
```

### 3.5 Admin duyệt chỉnh sửa

```
Admin vào /office-time → Tab "Chờ duyệt"
    → Xem danh sách records PENDING_APPROVAL
    → Xem lý do, so sánh với activity log
    → POST /api/office-time/[id]/approve { approved: true | false }
    → Nếu duyệt: record cập nhật giờ mới, status = APPROVED
    → Nếu từ chối: status = REJECTED, giữ giờ cũ
```

### 3.6 Xem báo cáo công tháng

```
Admin / Manager vào /office-time
    → Chọn tháng + phòng ban / nhân viên
    → GET /api/office-time (filter theo tháng, employeeId)
    → Hiển thị bảng:
        - Ngày | Giờ vào | Giờ ra | Tổng giờ | OT | Trạng thái
    → Tổng hợp cuối tháng: tổng công, tổng OT, số ngày vắng
    → Export CSV / Excel
```

---

## 4. Cấu hình Work Rules

```
Admin vào /work-rules
    → Tạo Work Rule:
        - Tên ca (vd: Ca hành chính, Ca sáng, Ca tối)
        - Giờ bắt đầu / kết thúc
        - Giờ nghỉ trưa (break)
        - Ngày làm trong tuần (Mon-Fri, etc.)
        - Quy tắc OT (sau bao nhiêu giờ tính OT, hệ số OT)
        - Số phút cho phép đến muộn (grace period)
    → Gán Work Rule cho nhân viên / phòng ban
```

**API Work Rules:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/work-rules` | Danh sách, tạo quy tắc |
| GET/PUT/DELETE | `/api/work-rules/[id]` | Chi tiết, cập nhật, xóa |

---

## 5. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/checkin` | Check-in / check-out |
| GET | `/api/office-time` | Danh sách records chấm công |
| POST | `/api/office-time` | Tạo record thủ công (Admin) |
| GET | `/api/office-time/[id]` | Chi tiết record |
| PUT | `/api/office-time/[id]` | Đề xuất chỉnh sửa |
| DELETE | `/api/office-time/[id]` | Xóa record |
| POST | `/api/office-time/[id]/approve` | Duyệt / từ chối chỉnh sửa |
| GET | `/api/office-time/auto-derive` | Tự động tính công từ activity |

---

## 6. Màn hình UI

| Route | Màn hình |
|---|---|
| `/office-time` | Bảng chấm công, lịch, báo cáo |
| `/work-rules` | Quản lý ca làm việc |

---

## 7. Data Model (OfficeTime)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `employeeId` | UUID | FK → Employee |
| `date` | Date | Ngày làm việc |
| `checkIn` | DateTime | Giờ vào |
| `checkOut` | DateTime | Giờ ra |
| `totalHours` | Float | Tổng giờ làm |
| `overtimeHours` | Float | Giờ tăng ca |
| `isLate` | Boolean | Đến muộn |
| `isAbsent` | Boolean | Vắng không phép |
| `status` | Enum | WORKING / COMPLETED / PENDING_APPROVAL / APPROVED / REJECTED |
| `note` | String | Ghi chú |
| `workRuleId` | UUID | FK → WorkRule áp dụng |

---

## 8. Business Rules

- Không thể check-in 2 lần trong cùng 1 ca.
- Check-out phải sau check-in.
- Nếu quên check-out: tự động check-out lúc midnight, đánh dấu "MISSING_CHECKOUT".
- OT chỉ được tính sau khi Admin duyệt.
- Auto-derive chỉ tạo record draft, không ghi đè record đã có.
- Work rule được kế thừa: Employee → Department → Default.
