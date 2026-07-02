# PRD-02 — Quản lý Nhân viên (Employees)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Employee Management |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Hồ sơ nhân viên là nền tảng của toàn bộ hệ thống HR — mọi module khác (chấm công, nghỉ phép, lương, đánh giá hiệu suất) đều liên kết đến Employee. Hiện tại nhiều doanh nghiệp vừa và nhỏ lưu hồ sơ nhân viên rải rác trên Excel, Google Sheet hoặc email — dẫn đến thiếu đồng nhất, khó tra cứu, không có audit trail khi có thay đổi.

Vấn đề cụ thể:
- Không có nguồn dữ liệu nhân viên tập trung, cập nhật theo thời gian thực.
- Khó theo dõi lịch sử thay đổi phòng ban, chức vụ của nhân viên.
- Không có cách nào xem thống kê hiệu suất của nhân viên từ một chỗ.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**
- Số hóa 100% hồ sơ nhân viên, không còn phụ thuộc Excel.
- Giảm thời gian HR tìm kiếm thông tin nhân viên xuống < 30 giây.
- Mọi thay đổi hồ sơ đều có audit trail đầy đủ.

**Mục tiêu người dùng:**
- Admin tạo và quản lý nhân viên nhanh chóng không cần kỹ năng kỹ thuật.
- Nhân viên tự xem và cập nhật thông tin cá nhân của mình.
- Manager xem được thống kê hiệu suất nhân viên trực thuộc.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:**
- CRUD hồ sơ nhân viên
- Upload ảnh đại diện
- Gán phòng ban, chức vụ, team, manager trực tiếp
- Xem thống kê hiệu suất cá nhân
- Tìm kiếm, filter, sắp xếp danh sách nhân viên
- Vô hiệu hóa / đánh dấu nghỉ việc
- Auto-generate mã nhân viên

**Ngoài phạm vi:**
- Hợp đồng lao động (module riêng)
- Payslip (module Payments)
- Lịch sử kỹ năng (module Skills)

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Phụ trách quản lý hồ sơ toàn bộ nhân viên công ty. Không nhất thiết có kỹ năng kỹ thuật. | CRUD nhân viên nhanh, không sai sót; tìm kiếm dễ; biết ngay ai đang ở phòng ban nào. | Dữ liệu rải rác, phải hỏi nhiều người mới có đủ thông tin; không biết khi nào thông tin bị outdated. |
| **Manager / Team Lead** | Quản lý trực tiếp một nhóm nhân viên. | Xem hồ sơ và hiệu suất nhân viên trong team. | Phải nhờ HR tra cứu từng người; không có cái nhìn tổng quan về team nhanh. |
| **Employee (Nhân viên)** | Người dùng cuối, muốn kiểm tra thông tin cá nhân của mình trong hệ thống. | Xem hồ sơ cá nhân, cập nhật SĐT, ảnh đại diện. | Không biết HR đang lưu thông tin gì về mình, không cập nhật được khi có thay đổi. |

### 2.2 User Journey

**HR Admin — Thêm nhân viên mới:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /employees → Click "Thêm nhân viên" | Mở form tạo mới |
| 2 | Điền họ tên, email, SĐT, ngày vào làm | Nhập thông tin cơ bản |
| 3 | Chọn phòng ban, chức vụ, team, manager | Gán cơ cấu tổ chức |
| 4 | Preview mã nhân viên tự động | Xác nhận mã |
| 5 | Submit → Hệ thống gửi lời mời qua email | Hoàn tất tạo hồ sơ |

**HR Admin — Nhân viên nghỉ việc:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào hồ sơ nhân viên → "Đánh dấu nghỉ việc" | Khởi động luồng off-boarding |
| 2 | Nhập ngày nghỉ việc, lý do | Ghi nhận thông tin |
| 3 | Hệ thống cảnh báo tài sản chưa trả, task chưa xong | Xử lý tồn đọng |
| 4 | Xác nhận → Status = TERMINATED | Hoàn tất |

**Nhân viên — Xem hồ sơ cá nhân:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Click avatar → "Hồ sơ của tôi" | Xem thông tin |
| 2 | Xem thông tin, phát hiện sai sót | Kiểm tra |
| 3 | Cập nhật SĐT hoặc ảnh đại diện | Cập nhật cho đúng |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Tạo nhân viên mới | Form điền đầy đủ thông tin cá nhân + tổ chức | Must Have | 5 |
| FR-002 | Xem danh sách nhân viên | Bảng danh sách với filter, search, sort, paginate | Must Have | 3 |
| FR-003 | Xem & Cập nhật hồ sơ chi tiết | Tabs: thông tin cá nhân, tổ chức, kỹ năng, thống kê | Must Have | 5 |
| FR-004 | Upload ảnh đại diện | Upload JPG/PNG, resize, lưu lên storage | Must Have | 2 |
| FR-005 | Xem hồ sơ cá nhân (self) | Nhân viên xem thông tin của mình qua /api/employees/me | Must Have | 2 |
| FR-006 | Auto-generate mã nhân viên | Preview và tự động tạo mã NV theo format cấu hình | Must Have | 2 |
| FR-007 | Vô hiệu hóa tài khoản | Đánh dấu INACTIVE, block đăng nhập | Must Have | 3 |
| FR-008 | Đánh dấu nghỉ việc | Đánh dấu TERMINATED với ngày nghỉ + lý do | Must Have | 3 |
| FR-009 | Xem thống kê hiệu suất | Số task hoàn thành, tổng giờ làm, KPI từ /employees/[id]/stats | Should Have | 5 |
| FR-010 | Xuất danh sách nhân viên | Export CSV/Excel với filter hiện tại | Should Have | 3 |
| FR-011 | Nhập danh sách nhân viên (import) | Upload Excel để tạo nhiều nhân viên cùng lúc | Nice to Have | 8 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo hồ sơ nhân viên mới, để hệ thống biết nhân viên này tồn tại và các module khác có thể liên kết. | AC1: Form bắt buộc: Họ tên, Email. Tùy chọn: SĐT, ngày sinh, CCCD, ngày vào làm, loại hợp đồng. AC2: Email unique — hiển thị lỗi nếu đã tồn tại. AC3: Sau khi tạo thành công: hiển thị thông báo, redirect sang hồ sơ nhân viên vừa tạo. AC4: Hệ thống tự gợi ý mã nhân viên tiếp theo. | High |
| US-002 | Là HR Admin, tôi muốn tìm kiếm và lọc danh sách nhân viên, để nhanh chóng tìm người cần tra cứu mà không phải cuộn cả trang. | AC1: Search theo tên, email, mã nhân viên — realtime, không cần nhấn Enter. AC2: Filter: Phòng ban, Chức vụ, Trạng thái (active/inactive/terminated), Team. AC3: Sort: Tên A-Z, Ngày vào làm mới nhất/cũ nhất. AC4: Paginate 20 người/trang, có tổng số kết quả. | High |
| US-003 | Là HR Admin, tôi muốn cập nhật thông tin phòng ban và chức vụ của nhân viên, để hồ sơ phản ánh đúng cơ cấu tổ chức hiện tại. | AC1: Trong tab "Tổ chức": chọn được Phòng ban, Chức vụ, Team, Manager trực tiếp. AC2: Lưu thành công → hiển thị thông báo xác nhận. AC3: Thay đổi được ghi vào Audit Log (ai sửa, sửa cái gì, lúc mấy giờ). | High |
| US-004 | Là nhân viên, tôi muốn upload ảnh đại diện, để đồng nghiệp nhận ra tôi trong hệ thống. | AC1: Upload file JPG/PNG, tối đa 5MB. AC2: Hiển thị preview trước khi lưu. AC3: Ảnh được resize về 200×200 px. AC4: File quá 5MB → hiển thị lỗi ngay khi chọn file. | Medium |
| US-005 | Là nhân viên, tôi muốn xem thông tin của mình, để kiểm tra hệ thống ghi đúng chưa và cập nhật khi có thay đổi. | AC1: /api/employees/me trả về thông tin của nhân viên đang đăng nhập. AC2: Nhân viên có thể cập nhật: SĐT, địa chỉ, ảnh đại diện. AC3: Nhân viên KHÔNG thể tự sửa: tên, email, phòng ban, chức vụ (chỉ Admin). | High |
| US-006 | Là HR Admin, tôi muốn đánh dấu nhân viên nghỉ việc, để hệ thống vô hiệu hóa tài khoản nhưng vẫn giữ dữ liệu lịch sử. | AC1: Chọn ngày nghỉ việc + lý do (bắt buộc). AC2: Hệ thống hiển thị cảnh báo: Còn X tài sản chưa trả, Y task đang mở. AC3: Xác nhận → Status = TERMINATED, Clerk account bị vô hiệu hóa. AC4: Dữ liệu (task history, time logs, leave) vẫn giữ nguyên. | High |
| US-007 | Là Manager, tôi muốn xem thống kê hiệu suất của nhân viên trực thuộc, để có cơ sở đánh giá khách quan trong kỳ review. | AC1: Tab "Thống kê" trong hồ sơ nhân viên hiển thị: số task hoàn thành trong kỳ, tổng giờ làm, tỷ lệ on-time, điểm KPI gần nhất. AC2: Lọc được theo kỳ (tháng, quý). AC3: Load trong < 3 giây. | Medium |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Performance | Trang danh sách nhân viên tải nhanh dù có hàng trăm nhân viên. | < 2 giây với dataset ≤ 500 nhân viên. Paginate server-side. |
| Security | Nhân viên chỉ xem được dữ liệu của mình. Admin xem toàn bộ. | Phân quyền server-side, không chỉ frontend. 100% thay đổi có audit log. |
| Data Integrity | Mã nhân viên và email không được trùng lặp trong cùng workspace. | DB unique constraint + validation tầng API. |
| Usability | HR Admin không có kỹ năng kỹ thuật hoàn thành tạo nhân viên không cần hướng dẫn. | Tạo nhân viên hoàn thành trong ≤ 5 thao tác chính. |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo nhân viên mới**

```
/employees
→ [Thêm nhân viên]
→ Form: Thông tin cá nhân (tên*, email*, SĐT, ngày sinh, CCCD)
→ Form: Thông tin tổ chức (phòng ban, chức vụ, team, manager, ngày vào làm, loại HĐ)
→ Preview mã NV (GET /api/employees/code-preview)
→ [Lưu] → POST /api/employees
→ Trang hồ sơ vừa tạo
→ (Tuỳ chọn) Gửi lời mời email
```

**Luồng 2: Nhân viên nghỉ việc**

```
/employees/[id]
→ [⋮ Menu] → "Đánh dấu nghỉ việc"
→ Modal: Ngày nghỉ việc*, Lý do*, Ghi chú
→ Cảnh báo: Tài sản chưa trả / Task đang mở
→ [Xác nhận] → PUT /api/employees/[id] { status: TERMINATED }
→ Thông báo thành công
```

**Luồng 3: Xem & Cập nhật hồ sơ**

```
/employees → Click vào nhân viên → /employees/[id]
    Tab "Cá nhân": Họ tên, email, SĐT, ngày sinh, địa chỉ, CCCD
    Tab "Tổ chức": Phòng ban, chức vụ, team, manager, ngày vào làm
    Tab "Kỹ năng": Danh sách kỹ năng (link sang PRD-09)
    Tab "Thống kê": KPI, task count, hours (link sang PRD-17)
→ [Chỉnh sửa] → Inline edit → [Lưu]
```

---

## 6. Business Rules

### BR-001 — Email unique toàn hệ thống

Email nhân viên phải unique trong cùng workspace. Một email không thể gắn với 2 Employee record trong cùng workspace.

### BR-002 — Mã nhân viên unique trong workspace

Mã nhân viên (employeeCode) unique trong từng workspace. Format mặc định: `NV001`, `NV002`, ... Admin có thể cấu hình prefix.

### BR-003 — Không xóa cứng

Nhân viên không bao giờ bị xóa cứng khỏi DB. Chỉ soft delete (isDeleted = true) hoặc đổi status = TERMINATED. Mọi dữ liệu lịch sử vẫn được giữ nguyên.

### BR-004 — Nhân viên TERMINATED bị khóa đăng nhập

Khi status = TERMINATED: Clerk account bị disable. Nhân viên không thể đăng nhập. Dữ liệu vẫn có thể tra cứu bởi Admin.

### BR-005 — Phân quyền cập nhật hồ sơ

Nhân viên chỉ cập nhật được: SĐT, địa chỉ, ảnh đại diện. Tất cả các trường khác (tên, email, phòng ban, chức vụ, status) chỉ Admin/HR mới được sửa.

### BR-006 — Cảnh báo khi off-board

Khi đánh dấu TERMINATED, hệ thống phải hiển thị cảnh báo nếu nhân viên đang có:
- Tài sản được cấp phát chưa trả (Inventory)
- Task đang IN_PROGRESS hoặc PENDING_REVIEW
- Đơn nghỉ phép đang PENDING

Admin phải xử lý hoặc bỏ qua cảnh báo một cách có chủ đích.

### BR-007 — Task của nhân viên TERMINATED

Sau khi TERMINATED, các task đang IN_PROGRESS của nhân viên đó được chuyển về BACKLOG và assigned = null. Cần Manager tái phân công.

---

## 7. Phân quyền

| Hành động | Employee (bản thân) | Manager (team) | HR Admin | Admin |
|---|---|---|---|---|
| Xem danh sách nhân viên | ❌ | 👁 team | ✅ | ✅ |
| Xem hồ sơ chi tiết | 👁 của mình | 👁 team | ✅ | ✅ |
| Tạo nhân viên mới | ❌ | ❌ | ✅ | ✅ |
| Sửa thông tin cá nhân | ✅ (SĐT, ảnh) | ❌ | ✅ | ✅ |
| Sửa thông tin tổ chức | ❌ | ❌ | ✅ | ✅ |
| Upload ảnh đại diện | ✅ (của mình) | ❌ | ✅ | ✅ |
| Vô hiệu hóa tài khoản | ❌ | ❌ | ✅ | ✅ |
| Đánh dấu nghỉ việc | ❌ | ❌ | ✅ | ✅ |
| Xem thống kê hiệu suất | 👁 của mình | ✅ team | ✅ | ✅ |
| Export danh sách | ❌ | ❌ | ✅ | ✅ |
