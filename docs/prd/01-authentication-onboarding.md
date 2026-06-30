# PRD-01: Authentication & Onboarding

**Module:** Authentication & Onboarding  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cho phép người dùng đăng ký tài khoản, đăng nhập an toàn, và hoàn thành quá trình thiết lập workspace lần đầu. Đảm bảo mỗi doanh nghiệp có không gian làm việc độc lập, tách biệt dữ liệu.

---

## 2. Người dùng liên quan

| Người dùng | Hành động |
|---|---|
| Người đăng ký mới | Tạo tài khoản, tạo workspace |
| Nhân viên được mời | Tham gia workspace sẵn có |
| Tất cả người dùng | Đăng nhập, đăng xuất |
| Admin | Kết nối Microsoft (SSO + tích hợp) |

---

## 3. Luồng chức năng

### 3.1 Đăng ký & Tạo Workspace (New User)

```
Người dùng truy cập /sign-up
    → Clerk xử lý đăng ký (email/password hoặc Google OAuth)
    → Clerk gửi webhook POST /api/webhooks/clerk
    → Hệ thống tạo Employee record (clerkUserId, email, tên)
    → Redirect sang /onboarding
    → Người dùng điền thông tin tổ chức:
        - Tên công ty
        - Quy mô nhân sự
        - Ngành nghề
        - Múi giờ / ngôn ngữ
    → Hệ thống tạo Workspace (Organization) record
    → Gán người dùng làm Admin của workspace
    → Redirect sang /welcome
    → Redirect sang /dashboard
```

### 3.2 Đăng nhập (Returning User)

```
Người dùng truy cập /sign-in
    → Clerk xử lý xác thực (email/password hoặc Google OAuth)
    → Nếu chưa có workspace → redirect /onboarding
    → Nếu đã có workspace → redirect /dashboard
```

### 3.3 Microsoft SSO & Tích hợp

```
Admin vào Settings → Kết nối Microsoft
    → Redirect GET /api/auth/microsoft
    → OAuth 2.0 flow với Microsoft Identity Platform
    → Callback GET /api/auth/microsoft/callback
    → Lưu access_token + refresh_token
    → Kích hoạt tích hợp: Teams notifications, OneDrive file storage
    → Hiển thị trạng thái kết nối "Connected"
```

### 3.4 Nhân viên được mời tham gia

```
Admin gửi lời mời qua email (Clerk Invitations)
    → Nhân viên nhận email → Click link
    → Clerk xác thực invitation token
    → Webhook /api/webhooks/clerk → Tạo/liên kết Employee record
    → Redirect /dashboard (không qua onboarding)
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/webhooks/clerk` | Nhận event từ Clerk (user.created, user.updated) |
| GET | `/api/auth/microsoft` | Khởi động OAuth flow với Microsoft |
| GET | `/api/auth/microsoft/callback` | Callback sau khi Microsoft xác thực |

---

## 5. Màn hình UI

| Route | Màn hình | Mô tả |
|---|---|---|
| `/sign-in` | Đăng nhập | Clerk hosted UI |
| `/sign-up` | Đăng ký | Clerk hosted UI |
| `/onboarding` | Thiết lập workspace | Form nhập thông tin công ty |
| `/welcome` | Chào mừng | Màn hình hướng dẫn bắt đầu |

---

## 6. Business Rules

- Mỗi email chỉ được tạo 1 tài khoản Clerk.
- Mỗi người dùng chỉ thuộc 1 workspace (không hỗ trợ multi-workspace trong v1).
- Onboarding bắt buộc trước khi vào dashboard.
- Microsoft token được refresh tự động khi hết hạn.
- Nếu webhook Clerk thất bại, retry tối đa 3 lần.

---

## 7. Trạng thái & Điều kiện lỗi

| Tình huống | Xử lý |
|---|---|
| Email đã tồn tại | Clerk trả lỗi, hiển thị "Email đã được sử dụng" |
| Onboarding chưa hoàn thành | Redirect về /onboarding khi truy cập dashboard |
| Microsoft OAuth thất bại | Hiển thị lỗi, cho phép thử lại |
| Webhook Clerk lỗi | Log lỗi, retry tự động |

---

## 8. Bảo mật

- Tất cả session được quản lý bởi Clerk (JWT).
- Microsoft token được mã hóa trước khi lưu DB.
- Webhook Clerk được xác minh bằng Svix signature.
- Không lưu password của người dùng (delegated to Clerk).
