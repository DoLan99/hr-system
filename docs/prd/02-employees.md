# PRD-02: Quản lý Nhân viên (Employees)

**Module:** Employees  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp hệ thống quản lý hồ sơ nhân viên toàn diện: tạo mới, cập nhật thông tin cá nhân, theo dõi trạng thái làm việc, gán phòng ban/chức vụ/team, quản lý kỹ năng và xem thống kê hiệu suất.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD đầy đủ tất cả nhân viên |
| Manager | Xem + chỉnh sửa nhân viên trong phòng ban mình |
| Employee | Xem và cập nhật hồ sơ cá nhân của mình |

---

## 3. Luồng chức năng

### 3.1 Tạo nhân viên mới

```
Admin vào /employees → Click "Thêm nhân viên"
    → Điền thông tin cơ bản:
        - Họ tên (bắt buộc)
        - Email (bắt buộc, unique)
        - Số điện thoại
        - Ngày vào làm
        - Mã nhân viên (tự động generate hoặc nhập tay)
    → Gán Phòng ban (Department)
    → Gán Chức vụ (Role)
    → Gán Team (tuỳ chọn)
    → POST /api/employees
    → Hệ thống tạo Employee record
    → Gửi invitation email (qua Clerk) nếu cần đăng nhập
```

### 3.2 Xem & Tìm kiếm danh sách nhân viên

```
Truy cập /employees
    → GET /api/employees (với filters: department, status, search)
    → Hiển thị bảng: tên, mã NV, phòng ban, chức vụ, trạng thái
    → Filter: Phòng ban, Trạng thái (active/inactive/probation)
    → Tìm kiếm theo tên / email / mã NV
    → Sort theo ngày vào làm / tên
```

### 3.3 Xem chi tiết & Cập nhật hồ sơ

```
Click vào nhân viên → /employees/[id]
    → GET /api/employees/[id]
    → Hiển thị tabs:
        Tab 1 - Thông tin cá nhân:
            - Họ tên, email, phone, địa chỉ, CCCD
            - Ngày sinh, giới tính
            - Ngày vào làm, loại hợp đồng
        Tab 2 - Tổ chức:
            - Phòng ban, Chức vụ, Team
            - Cấp quản lý trực tiếp
        Tab 3 - Kỹ năng:
            - Danh sách kỹ năng và level
        Tab 4 - Thống kê:
            - GET /api/employees/[id]/stats
            - Số task hoàn thành, tổng giờ làm, điểm KPI
    → Admin/Manager chỉnh sửa → PUT /api/employees/[id]
```

### 3.4 Upload & Quản lý ảnh đại diện

```
Vào hồ sơ nhân viên → Click avatar
    → Chọn file ảnh (JPG/PNG, max 5MB)
    → POST /api/employees/[id]/photos
    → Upload lên Drive / Storage
    → Cập nhật photoUrl trong Employee record
    → Hiển thị ảnh mới
```

### 3.5 Nhân viên tự xem hồ sơ

```
Nhân viên đăng nhập → GET /api/employees/me
    → Xem thông tin cá nhân của mình
    → Cập nhật một số trường được phép (phone, địa chỉ, avatar)
```

### 3.6 Preview mã nhân viên

```
Khi tạo nhân viên mới → GET /api/employees/code-preview
    → Hệ thống generate mã NV tiếp theo (format: NV001, NV002...)
    → Hiển thị preview để admin xác nhận
```

### 3.7 Vô hiệu hóa / Nghỉ việc

```
Admin chọn nhân viên → "Vô hiệu hóa" hoặc "Đánh dấu nghỉ việc"
    → PUT /api/employees/[id] { status: "INACTIVE" | "TERMINATED" }
    → Nhân viên không còn đăng nhập được
    → Dữ liệu lịch sử vẫn được giữ nguyên
    → Task đang assign được chuyển về "Unassigned"
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/employees` | Danh sách nhân viên (filter, search, paginate) |
| POST | `/api/employees` | Tạo nhân viên mới |
| GET | `/api/employees/me` | Thông tin nhân viên hiện tại |
| GET | `/api/employees/code-preview` | Preview mã nhân viên tiếp theo |
| GET | `/api/employees/[id]` | Chi tiết nhân viên |
| PUT | `/api/employees/[id]` | Cập nhật thông tin |
| DELETE | `/api/employees/[id]` | Xóa nhân viên (soft delete) |
| GET/POST | `/api/employees/[id]/photos` | Upload ảnh đại diện |
| GET | `/api/employees/[id]/skills` | Danh sách kỹ năng nhân viên |
| GET | `/api/employees/[id]/stats` | Thống kê hiệu suất nhân viên |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/employees` | Danh sách nhân viên |
| `/employees/[id]` | Hồ sơ chi tiết nhân viên |

---

## 6. Data Model (Employee)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Primary key |
| `clerkUserId` | String | ID từ Clerk (nullable - chưa có tài khoản) |
| `employeeCode` | String | Mã nhân viên (unique trong workspace) |
| `fullName` | String | Họ và tên |
| `email` | String | Email (unique) |
| `phone` | String | Số điện thoại |
| `avatar` | String | URL ảnh đại diện |
| `dateOfBirth` | Date | Ngày sinh |
| `gender` | Enum | MALE / FEMALE / OTHER |
| `joinDate` | Date | Ngày vào làm |
| `contractType` | Enum | FULL_TIME / PART_TIME / CONTRACT / PROBATION |
| `status` | Enum | ACTIVE / INACTIVE / TERMINATED |
| `departmentId` | UUID | FK → Department |
| `roleId` | UUID | FK → Role |
| `managerId` | UUID | FK → Employee (self-reference) |
| `workspaceId` | UUID | FK → Workspace |

---

## 7. Business Rules

- Mã nhân viên unique trong cùng workspace.
- Email unique toàn hệ thống (liên kết với Clerk account).
- Nhân viên TERMINATED không thể đăng nhập nhưng dữ liệu không bị xóa cứng.
- Khi xóa nhân viên: soft delete (isDeleted = true), không xóa khỏi DB.
- Chỉ Admin mới được tạo / xóa nhân viên.
- Employee chỉ được chỉnh sửa hồ sơ của chính mình (các trường được phép).

---

## 8. Điều kiện lỗi

| Tình huống | Xử lý |
|---|---|
| Email đã tồn tại | 409 Conflict — "Email đã được sử dụng" |
| Mã NV trùng | 409 Conflict — "Mã nhân viên đã tồn tại" |
| Xóa nhân viên đang có task active | Cảnh báo, yêu cầu chuyển task trước |
| Upload ảnh quá size | 400 — "Ảnh tối đa 5MB" |
