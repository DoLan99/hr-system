# PRD-10 — Lương & Thanh toán (Payments / Payroll)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Payments / Payroll |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Finance, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Quy trình tính lương hiện tại phụ thuộc vào Excel thủ công: HR phải tổng hợp dữ liệu từ nhiều nguồn (chấm công, nghỉ phép, OT, phụ cấp) rồi tính từng người. Mỗi tháng mất 2-3 ngày, dễ sai và không có audit trail. Nhân viên không thể tự tra cứu payslip.

### 1.2 Mục tiêu sản phẩm (Goals)

- HR Admin thiết lập cấu trúc lương (gross, các khoản cộng/trừ) cho từng nhân viên.
- Hệ thống tự động tổng hợp dữ liệu và tính net pay mỗi tháng.
- Nhân viên xem payslip online, không cần hỏi HR.
- Mọi thay đổi đều có audit log.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Cấu hình lương nhân viên, tính lương tháng (tự động + manual trigger), payslip, approve payroll, lịch sử thanh toán.

**Ngoài phạm vi:** Tích hợp ngân hàng để chuyển lương tự động (v2), tính thuế TNCN tự động theo biểu thuế luỹ tiến (v2), BHXH (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Cấu hình lương, chạy payroll, duyệt trước khi thanh toán. | Tính lương nhanh, ít lỗi, có audit trail. | Excel thủ công 2-3 ngày/tháng; dễ sai khi cộng/trừ thủ công. |
| **Finance / CEO** | Duyệt payroll trước khi thanh toán, xem tổng quỹ lương. | Approve nhanh, xem dashboard tổng. | Phải chờ HR xuất file rồi email qua; không có số tổng ngay lập tức. |
| **Employee** | Xem payslip tháng, kiểm tra các khoản. | Payslip chi tiết, có thể tải về. | Phải nhắn HR hỏi phiếu lương; không biết các khoản tính như thế nào. |

### 2.2 User Journey

**HR Admin — Chạy Payroll tháng:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /payroll → Chọn tháng → [Tính lương] | Trigger tính toán |
| 2 | Hệ thống tổng hợp: lương cơ bản + phụ cấp + OT − khấu trừ | Tính net pay |
| 3 | Review bảng lương: xem từng người, có thể chỉnh sửa thủ công | Kiểm tra lỗi |
| 4 | [Gửi duyệt] → Finance nhận notification | Workflow duyệt |
| 5 | Finance [Approve] → Payroll được đánh dấu APPROVED | Chốt lương |
| 6 | [Xuất bảng lương] + [Gửi payslip] cho nhân viên | Phát phiếu lương |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Cấu hình lương nhân viên | Thiết lập gross salary, các khoản phụ cấp cố định, khấu trừ cố định cho từng nhân viên | Must Have | 5 |
| FR-002 | Định nghĩa khoản lương | HR tạo các loại khoản: ALLOWANCE (phụ cấp), DEDUCTION (khấu trừ), BONUS | Must Have | 5 |
| FR-003 | Tính lương tháng | Tổng hợp: gross + phụ cấp + OT + thưởng − khấu trừ = net pay | Must Have | 13 |
| FR-004 | Điều chỉnh thủ công | HR có thể thêm/sửa khoản phát sinh cho tháng cụ thể | Must Have | 5 |
| FR-005 | Workflow duyệt payroll | HR → Finance/CEO duyệt → APPROVED trước khi phát | Must Have | 8 |
| FR-006 | Payslip nhân viên | Nhân viên xem payslip tháng chi tiết, tải PDF | Must Have | 5 |
| FR-007 | Lịch sử lương nhân viên | Xem lịch sử thay đổi lương theo thời gian | Should Have | 3 |
| FR-008 | Dashboard tổng quỹ lương | HR/Finance xem tổng quỹ lương tháng, so sánh với tháng trước | Should Have | 5 |
| FR-009 | Export bảng lương | Export Excel/CSV bảng lương tháng | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn thiết lập cấu trúc lương cho từng nhân viên, để hệ thống tính đúng mỗi tháng mà không cần nhập lại. | AC1: Cấu hình lương: Gross salary*, Ngày hiệu lực*, các khoản phụ cấp cố định (chọn từ danh mục), các khoản khấu trừ cố định. AC2: Lịch sử thay đổi lương: mỗi lần sửa gross tạo bản ghi mới với ngày hiệu lực (không ghi đè). AC3: Khoản phụ cấp/khấu trừ có thể bật/tắt theo tháng. | High |
| US-002 | Là HR Admin, tôi muốn tạo các loại khoản lương tuỳ chỉnh, để phản ánh đúng chính sách lương của công ty. | AC1: Tạo khoản: Tên*, Loại (ALLOWANCE/DEDUCTION/BONUS), Mô tả, Tính thuế (boolean). AC2: Khoản ALLOWANCE → cộng vào gross. AC3: Khoản DEDUCTION → trừ vào gross. AC4: Không xóa khoản đã được dùng trong lịch sử payroll. | High |
| US-003 | Là HR Admin, tôi muốn tính lương tháng tự động, để không phải tính thủ công trong Excel. | AC1: [Tính lương tháng X] → hệ thống tạo PayrollRun: tổng hợp gross + phụ cấp + OT (từ time logs) + thưởng − khấu trừ cho tất cả nhân viên ACTIVE. AC2: Công thức hiển thị rõ cho từng người: gross + A1 + A2 − D1 = net. AC3: Nhân viên nghỉ không lương (unpaid leave) → lương bị trừ tương ứng số ngày. AC4: Nếu đã có PayrollRun tháng đó → cảnh báo và cho phép overwrite (audit log ghi lại). | High |
| US-004 | Là HR Admin, tôi muốn chỉnh sửa thủ công khoản phát sinh cho một nhân viên trước khi chốt, để xử lý trường hợp đặc biệt. | AC1: Thêm khoản phát sinh: chọn nhân viên, loại khoản, số tiền, mô tả (bắt buộc). AC2: Khoản phát sinh chỉ áp dụng cho tháng đó, không lặp lại. AC3: Audit log ghi: ai thêm, khi nào, số tiền. | High |
| US-005 | Là Finance, tôi muốn duyệt bảng lương trước khi phát, để kiểm soát ngân sách. | AC1: HR gửi payroll → Finance nhận notification. AC2: Finance xem bảng lương tổng hợp: tổng nhân viên, tổng net pay, so sánh tháng trước. AC3: [Approve] → PayrollRun status → APPROVED. AC4: [Reject] → HR nhận notification kèm lý do, phải sửa rồi gửi lại. AC5: Sau APPROVED → không thể sửa (chỉ HR Admin đặc biệt và có audit log). | High |
| US-006 | Là Employee, tôi muốn xem payslip chi tiết của mình mỗi tháng, để kiểm tra các khoản cộng/trừ. | AC1: /payslips → list các tháng đã được phát payslip. AC2: Xem chi tiết: Gross | Phụ cấp (list) | Khấu trừ (list) | Net Pay. AC3: Tải về PDF. AC4: Nhân viên chỉ xem payslip của bản thân. AC5: Payslip chỉ hiển thị sau khi PayrollRun được APPROVED. | High |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Accuracy | Tính lương không được sai | Tỷ lệ sai | 0% |
| Security | Dữ liệu lương cực kỳ nhạy cảm | Access control | Chỉ HR Admin / Finance / Employee (bản thân) xem được |
| Audit | Mọi thay đổi có audit trail | Coverage | 100% các thao tác trên PayrollRun |
| Performance | Tính lương cho 500 nhân viên | Thời gian | < 30 giây |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Chạy Payroll tháng**

```
/payroll → [+ Tính lương tháng X/20XX]
  → Hệ thống tổng hợp dữ liệu (spinner)
  → Bảng lương: STT | Nhân viên | Gross | Phụ cấp | OT | Khấu trừ | Net Pay
  → [Chỉnh sửa thủ công] (khoản phát sinh)
  → [Gửi duyệt] → POST /api/payroll/runs/:id/submit
  → Finance duyệt → APPROVED
  → [Gửi payslip cho nhân viên] → bulk notification
```

**Luồng 2: Nhân viên xem Payslip**

```
/payslips → Danh sách tháng
  → Click tháng → Chi tiết payslip
  → Hiển thị breakdown đầy đủ
  → [Tải PDF] → GET /api/payslips/:id/pdf
```

---

## 6. Business Rules

### BR-001 — Không tính lương cho nhân viên TERMINATED

Nhân viên có status TERMINATED vào ngày payroll run không được tạo payslip. Nếu họ rời công ty giữa tháng → HR phải điều chỉnh thủ công (FR-004) số ngày làm việc.

### BR-002 — Gross salary lấy theo ngày hiệu lực

Khi tính lương tháng T: lấy gross salary có ngày hiệu lực gần nhất ≤ ngày cuối tháng T. Nếu nhân viên được tăng lương giữa tháng → tính theo số ngày làm việc ở mỗi mức gross.

### BR-003 — Nghỉ không lương ảnh hưởng lương

Số ngày unpaid leave trong tháng → trừ vào gross theo công thức:
```
khấu trừ = (grossSalary / số ngày làm việc chuẩn tháng đó) × số ngày unpaid
```

### BR-004 — PayrollRun chỉ APPROVED 1 lần

Sau khi Finance approve → trạng thái APPROVED, không thể thay đổi bởi HR thông thường. Nếu cần sửa sau approve → phải tạo PayrollRun điều chỉnh mới (amendment) với audit trail đầy đủ.

### BR-005 — Payslip chỉ visible sau khi APPROVED

Nhân viên chỉ thấy payslip tháng nào đã được Finance APPROVED. Payslip tháng đang PENDING không hiển thị cho nhân viên.

### BR-006 — Không xóa PayrollRun đã APPROVED

PayrollRun ở trạng thái APPROVED không thể xóa. Chỉ có thể tạo amendment.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Finance | Admin |
|---|---|---|---|---|---|
| Xem payslip bản thân | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tải PDF payslip | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xem payslip nhân viên khác | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cấu hình lương nhân viên | ❌ | ❌ | ✅ | ❌ | ✅ |
| Tạo khoản lương (types) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Tạo / Chạy PayrollRun | ❌ | ❌ | ✅ | ❌ | ✅ |
| Điều chỉnh thủ công payroll | ❌ | ❌ | ✅ | ❌ | ✅ |
| Duyệt / Từ chối PayrollRun | ❌ | ❌ | ❌ | ✅ | ✅ |
| Xem dashboard tổng quỹ lương | ❌ | ❌ | ✅ | ✅ | ✅ |
| Export bảng lương | ❌ | ❌ | ✅ | ✅ | ✅ |
