# PRD-11 — Tài sản & Thiết bị (Inventory)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Inventory Management |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, IT Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Công ty mua tài sản (laptop, màn hình, điện thoại, bàn ghế...) nhưng không có hệ thống theo dõi: ai đang dùng cái gì, bảo hành còn hạn không, khi nhân viên nghỉ việc tài sản được thu hồi chưa. Kết quả: mất tài sản, trùng lặp mua sắm, không kiểm soát được tổng giá trị.

### 1.2 Mục tiêu sản phẩm (Goals)

- Quản lý toàn bộ tài sản của công ty: thêm, cập nhật trạng thái, gán cho nhân viên.
- Theo dõi lịch sử gán/thu hồi tài sản.
- Nhắc nhở khi bảo hành sắp hết.
- Off-boarding tự động: cảnh báo HR thu hồi tài sản khi nhân viên nghỉ.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD tài sản, gán/thu hồi tài sản, lịch sử gán, nhắc bảo hành, báo cáo tổng tài sản, cảnh báo off-boarding.

**Ngoài phạm vi:** Quản lý kho vật tư tiêu hao (v2), tích hợp hệ thống kế toán khấu hao (v2), QR code scan (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **IT Admin / HR Admin** | Quản lý tài sản: mua, gán, thu hồi, thanh lý. | Biết ngay ai đang giữ tài sản nào, còn bảo hành không. | Dùng Excel không update real-time → mất tài sản khi off-board không kiểm soát. |
| **Manager** | Biết team của mình đang dùng thiết bị gì. | Xem danh sách tài sản gán cho team mình. | Không biết nhân viên nào còn thiếu thiết bị khi mới join. |
| **Employee** | Biết mình đang được cấp tài sản nào, trả lại khi nghỉ. | Xem danh sách tài sản cá nhân. | Không có bằng chứng nhận tài sản → dễ phát sinh tranh chấp khi off-board. |

### 2.2 User Journey

**IT Admin — Gán tài sản cho nhân viên mới:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /inventory → Chọn laptop AVAILABLE → [Gán] | Tìm thiết bị trống |
| 2 | Chọn nhân viên + ngày gán + ghi chú (tình trạng lúc giao) | Gán cho đúng người |
| 3 | Nhân viên nhận in-app notification "Bạn được cấp Laptop Dell XPS 15" | Xác nhận |
| 4 | Tài sản status → IN_USE; lịch sử gán được tạo | Cập nhật tracking |

**IT Admin — Thu hồi khi nhân viên nghỉ:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Hệ thống cảnh báo: "Nhân viên A sắp off-board, đang giữ 3 tài sản" | Nhắc nhở tự động |
| 2 | IT Admin vào profile nhân viên → Tab Tài sản | Xem danh sách |
| 3 | [Thu hồi] từng tài sản + ghi chú tình trạng thu về | Thu hồi |
| 4 | Tài sản status → AVAILABLE hoặc DAMAGED | Cập nhật |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Tài sản | Thêm, sửa, xóa tài sản: tên, loại, serial, giá mua, ngày mua, bảo hành đến | Must Have | 5 |
| FR-002 | Danh mục loại tài sản | Tạo/quản lý categories: Laptop, Màn hình, Điện thoại, Bàn ghế... | Must Have | 2 |
| FR-003 | Gán tài sản cho nhân viên | Gán tài sản AVAILABLE cho Employee; chuyển status → IN_USE | Must Have | 5 |
| FR-004 | Thu hồi tài sản | Đổi status IN_USE → AVAILABLE/DAMAGED; tạo bản ghi thu hồi | Must Have | 5 |
| FR-005 | Lịch sử gán/thu hồi | Xem timeline ai đã dùng tài sản này; tài sản nào nhân viên này đang giữ | Must Have | 3 |
| FR-006 | Cảnh báo bảo hành hết hạn | Nhắc nhở 30 ngày trước khi bảo hành hết | Should Have | 3 |
| FR-007 | Cảnh báo off-boarding | Khi nhân viên sắp nghỉ (leaveDate ≤ 7 ngày): cảnh báo HR/IT về tài sản chưa thu hồi | Must Have | 5 |
| FR-008 | Báo cáo tổng tài sản | Thống kê: tổng số, theo status, theo loại, tổng giá trị | Should Have | 5 |
| FR-009 | Tìm kiếm & lọc tài sản | Lọc theo: status, loại, nhân viên, phòng ban | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là IT Admin, tôi muốn thêm tài sản vào hệ thống với đầy đủ thông tin, để theo dõi từ lúc mua đến khi thanh lý. | AC1: Form: Tên*, Loại* (từ danh mục), Serial number, Giá mua, Ngày mua, Bảo hành đến, Ghi chú. AC2: Status mặc định: AVAILABLE. AC3: Serial number unique trong workspace (cảnh báo nếu trùng). AC4: Ảnh tài sản (upload tối đa 3 ảnh). | High |
| US-002 | Là IT Admin, tôi muốn gán tài sản cho nhân viên và ghi chú tình trạng lúc giao, để có bằng chứng khi thu hồi. | AC1: Chỉ gán được tài sản status AVAILABLE. AC2: Form gán: Chọn nhân viên*, Ngày gán*, Tình trạng lúc giao (text), Ghi chú. AC3: Sau gán: status → IN_USE; lịch sử assignment được tạo. AC4: Nhân viên nhận notification. AC5: Không gán 1 tài sản cho 2 người cùng lúc. | High |
| US-003 | Là IT Admin, tôi muốn thu hồi tài sản khi nhân viên nghỉ, và ghi lại tình trạng tài sản khi nhận về. | AC1: Thu hồi: Ngày thu*, Tình trạng thu về* (dropdown: TỐT/CÒN SỬ DỤNG/HƯ HỎNG), Ghi chú. AC2: Tình trạng HƯ HỎNG → status → DAMAGED. AC3: Tình trạng khác → status → AVAILABLE. AC4: Bản ghi assignment kết thúc: ghi returnedAt. | High |
| US-004 | Là HR Admin, tôi muốn nhận cảnh báo khi nhân viên sắp off-board mà còn tài sản chưa thu hồi, để nhắc IT thu hồi kịp thời. | AC1: Khi Employee.terminationDate được set và cách ngày hiện tại ≤ 7 ngày → tạo notification cho HR Admin + IT Admin. AC2: Nội dung: "Nhân viên [Tên] sẽ nghỉ [Ngày], đang giữ [N] tài sản: [list]". AC3: Notification hiển thị trong in-app alerts. AC4: Cảnh báo lặp lại mỗi ngày cho đến khi tất cả tài sản được thu hồi. | High |
| US-005 | Là Employee, tôi muốn xem danh sách tài sản đang được cấp cho mình, để biết mình chịu trách nhiệm về những gì. | AC1: Profile → Tab "Tài sản" → list: Tên | Serial | Ngày nhận | Tình trạng. AC2: Xem được ảnh tài sản. AC3: Không thể sửa thông tin tài sản. | Medium |
| US-006 | Là IT Admin, tôi muốn xem báo cáo tổng tài sản, để nắm tổng giá trị và phân bổ. | AC1: Dashboard: Tổng số tài sản | Đang dùng (IN_USE) | Trống (AVAILABLE) | Hư hỏng (DAMAGED). AC2: Pie chart theo loại tài sản. AC3: Tổng giá trị mua. AC4: Danh sách tài sản sắp hết bảo hành (30 ngày tới). | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Load danh sách tài sản | Load time | < 1 giây với ≤ 1000 tài sản |
| Data integrity | Không gán tài sản đang IN_USE | Validation | 100% |
| Audit | Mọi gán/thu hồi có audit log | Coverage | 100% |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Gán tài sản**

```
/inventory → Tìm tài sản status AVAILABLE → [Gán cho nhân viên]
→ Form: Nhân viên* | Ngày gán* | Tình trạng lúc giao | Ghi chú
→ POST /api/inventory/:id/assign { employeeId, assignedAt, condition, note }
→ Status → IN_USE; Nhân viên nhận notification
```

**Luồng 2: Cảnh báo off-boarding**

```
[Scheduled job mỗi ngày 08:00]
→ Tìm Employee có terminationDate trong vòng 7 ngày
→ Kiểm tra Employee có tài sản IN_USE không
→ Nếu có → Tạo Notification cho HR Admin + IT Admin
→ Notification link đến /employees/:id?tab=inventory
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Danh sách tài sản | `/inventory` | Toàn bộ tài sản, lọc theo status/loại |
| Chi tiết tài sản | `/inventory/:id` | Thông tin + lịch sử assignment |
| Tài sản nhân viên | `/employees/:id?tab=inventory` | Tài sản đang gán cho người đó |
| Báo cáo tổng quan | `/inventory/reports` | Dashboard thống kê |

---

## 6. Business Rules

### BR-001 — Tài sản chỉ gán cho 1 người tại 1 thời điểm

Không thể gán tài sản đang ở trạng thái IN_USE cho người khác. Phải thu hồi trước rồi mới gán lại.

### BR-002 — Trạng thái tài sản hợp lệ

```
AVAILABLE → Trống, có thể gán
IN_USE    → Đang được nhân viên sử dụng
DAMAGED   → Hư hỏng, không thể gán
DISPOSED  → Đã thanh lý, archived
```
Chuyển trạng thái không theo chiều ngược: DISPOSED không thể về AVAILABLE.

### BR-003 — Cảnh báo bảo hành 30 ngày

Hệ thống chạy scheduled job hàng ngày, tìm tài sản có warrantyEndDate trong vòng 30 ngày → gửi notification cho IT Admin và ghi alert trong dashboard.

### BR-004 — Không xóa tài sản có lịch sử

Tài sản đã từng được gán (có AssignmentHistory) không thể xóa. Chỉ có thể chuyển sang DISPOSED.

### BR-005 — Serial number unique trong workspace

Serial number phải unique trong phạm vi workspace. Cho phép 2 workspace khác nhau có cùng serial.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | IT Admin | Admin |
|---|---|---|---|---|---|
| Xem tài sản bản thân | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xem danh sách tài sản | ❌ | 👁 (team) | ✅ | ✅ | ✅ |
| Thêm / Sửa tài sản | ❌ | ❌ | ✅ | ✅ | ✅ |
| Gán / Thu hồi tài sản | ❌ | ❌ | ✅ | ✅ | ✅ |
| Xóa / Thanh lý tài sản | ❌ | ❌ | ✅ | ✅ | ✅ |
| Xem báo cáo tổng tài sản | ❌ | ❌ | ✅ | ✅ | ✅ |
| Nhận cảnh báo off-boarding | ❌ | ❌ | ✅ | ✅ | ✅ |
