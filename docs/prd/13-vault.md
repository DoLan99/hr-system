# PRD-13: Vault — Kho bí mật

**Module:** Vault  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp nơi lưu trữ an toàn các thông tin nhạy cảm của tổ chức: mật khẩu hệ thống, API keys, credentials, thông tin tài khoản ngân hàng, v.v. Mọi thông tin được mã hóa và có phân quyền truy cập chặt chẽ.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD vault entries, phân quyền truy cập |
| Manager | Xem entries được cấp quyền |
| Employee | Xem entries được cấp quyền (read-only) |

---

## 3. Luồng chức năng

### 3.1 Tạo Vault Entry

```
Admin vào /vault → "Thêm mục mới"
    → POST /api/vault
        {
          title: "AWS Production Keys",
          type: "API_KEY" | "PASSWORD" | "CREDENTIAL" | "BANK_ACCOUNT" | "NOTE" | "OTHER",
          username: "admin@company.com",  (optional)
          password: "s3cr3t",             (sẽ được mã hóa AES-256)
          url: "https://aws.amazon.com",  (optional)
          notes: "Dùng cho production deployment",
          visibility: "ADMIN_ONLY" | "SPECIFIC_ROLES" | "SPECIFIC_EMPLOYEES",
          allowedRoleIds: [...],
          allowedEmployeeIds: [...]
        }
    → Mã hóa password/sensitive fields trước khi lưu DB
    → Tạo audit log: "Created vault entry [title]"
```

### 3.2 Xem Vault Entries

```
User vào /vault
    → GET /api/vault → Danh sách entries mà user có quyền xem
    → Hiển thị: title, type, URL, ngày cập nhật
    → Password field hiển thị: ******** (masked)
    → Click "Hiện password":
        → GET /api/vault/[id] với flag reveal=true
        → Yêu cầu xác nhận mật khẩu (hoặc 2FA)
        → Ghi audit log: "Viewed sensitive field: [title] by [user]"
        → Trả về plaintext password (decrypt từ DB)
        → Auto-hide sau 30 giây
```

### 3.3 Sao chép vào Clipboard

```
User click icon copy bên cạnh password field
    → Client-side decrypt (nếu đã reveal)
    → Copy vào clipboard
    → Ghi audit log: "Copied password: [title] by [user]"
    → Xóa khỏi clipboard tự động sau 60 giây
```

### 3.4 Cập nhật Entry

```
Admin / người có quyền edit:
    → PUT /api/vault/[id]
    → Nếu thay đổi password: mã hóa lại
    → Ghi audit log: "Updated vault entry [title]"
    → Lưu lịch sử version (optional)
```

### 3.5 Xóa Entry

```
Admin:
    → DELETE /api/vault/[id]
    → Soft delete (isDeleted = true)
    → Ghi audit log: "Deleted vault entry [title]"
```

### 3.6 Audit Trail

```
Mọi thao tác với vault đều ghi audit:
    - Ai xem
    - Ai reveal password
    - Ai copy
    - Ai tạo / sửa / xóa
    - Timestamp, IP address
Admin xem audit log tại /admin/audit (filter: entity=vault)
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/vault` | Danh sách entries (theo quyền) |
| POST | `/api/vault` | Tạo entry mới |
| GET | `/api/vault/[id]` | Chi tiết (có flag reveal) |
| PUT | `/api/vault/[id]` | Cập nhật |
| DELETE | `/api/vault/[id]` | Xóa (soft delete) |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/vault` | Danh sách vault entries + tạo mới |

---

## 6. Data Model (VaultEntry)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `title` | String | Tên mục |
| `type` | Enum | API_KEY / PASSWORD / CREDENTIAL / BANK_ACCOUNT / NOTE / OTHER |
| `username` | String | Username (plaintext, không nhạy cảm) |
| `encryptedPassword` | String | Mật khẩu đã mã hóa AES-256 |
| `url` | String | URL liên quan |
| `notes` | Text | Ghi chú (có thể mã hóa) |
| `visibility` | Enum | ADMIN_ONLY / SPECIFIC_ROLES / SPECIFIC_EMPLOYEES |
| `allowedRoleIds` | UUID[] | Roles được xem |
| `allowedEmployeeIds` | UUID[] | Employees được xem |
| `createdBy` | UUID | FK → Employee |
| `isDeleted` | Boolean | Soft delete |

---

## 7. Bảo mật

- Mã hóa AES-256 với key riêng của mỗi workspace (không dùng chung key).
- Key mã hóa lưu trong biến môi trường server, không trong DB.
- Mọi request đến `/api/vault` đều require authentication.
- Reveal password: yêu cầu re-authenticate (Clerk session).
- Rate limit: tối đa 10 lần reveal password / giờ / user.
- HTTPS bắt buộc (không cho phép plain HTTP).

---

## 8. Business Rules

- Chỉ Admin mới tạo / xóa vault entries.
- Employee chỉ xem, không sửa.
- Không thể export toàn bộ vault ra file (bảo mật).
- Password không bao giờ hiển thị trong API response mặc định (chỉ khi có flag reveal=true + auth).
- Xóa entry: soft delete, dữ liệu mã hóa vẫn còn trong DB cho audit purposes.
