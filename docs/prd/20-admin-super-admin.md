# PRD-20: Admin Panel & Super Admin

**Module:** Admin Panel (Workspace) / Super Admin (System)  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

**Admin Panel (Workspace):** Bảng điều khiển dành riêng cho quản trị viên của từng workspace — giám sát hoạt động nội bộ, quản lý người dùng, xem anomaly và audit log.

**Super Admin:** Bảng điều khiển cấp hệ thống — quản lý tất cả workspace/organization, duyệt nâng cấp gói, quản lý plans.

Hai panel có **auth riêng biệt** (không dùng chung session với user thông thường).

---

## 2. Người dùng liên quan

| Người dùng | Phạm vi |
|---|---|
| Workspace Admin | 1 workspace cụ thể |
| Super Admin | Toàn bộ hệ thống |

---

## 3. Admin Panel (Workspace) — /admin/*

### 3.1 Đăng nhập Admin

```
Truy cập /system/login (admin login page riêng)
    → POST /api/admin/auth/login { email, password }
    → Server verify admin credentials (riêng với Clerk user)
    → Tạo admin session (HTTP-only cookie)
    → Redirect về /admin/activity
    → GET /api/admin/auth/me → Verify session còn valid
    → Đăng xuất: POST /api/admin/auth/logout
```

### 3.2 Dashboard Activity

```
Admin vào /admin/activity
    → Tổng quan hoạt động workspace:
        - Số người đang online
        - Hoạt động 24h qua (sessions, page views)
        - Heatmap theo giờ / ngày
        - Top pages được xem nhiều nhất
        - Top users hoạt động nhiều nhất
    → Các widget từ /api/activity/* endpoints
```

### 3.3 Quản lý Anomaly

```
/admin/anomalies
    → Xem anomaly của workspace (PRD-18)
    → Filter theo severity / status
    → Xử lý: dismiss / investigate / block user
```

### 3.4 Audit Log

```
/admin/audit
    → Xem toàn bộ audit log của workspace (PRD-18)
    → Timeline theo entity
    → Export CSV
```

### 3.5 Quản lý Upgrade Requests

```
/admin/upgrade-requests
    → Xem trạng thái request nâng cấp của workspace này
    → Lịch sử: đã submit gì, đã được duyệt chưa
    (Tạo request mới → /billing)
```

### 3.6 Quản lý Users (Admin view)

```
/system/users (admin scope)
    → GET /api/admin/users → Danh sách tất cả users trong workspace
    → Xem chi tiết: GET /api/admin/users/[id]
        - Lịch sử login
        - Số sessions
        - Activity summary
    → Force logout: PUT /api/admin/users/[id] { forceLogout: true }
    → Khóa tài khoản: PUT /api/admin/users/[id] { isBlocked: true }
```

---

## 4. Super Admin Panel — /super-admin/*

### 4.1 Đăng nhập Super Admin

```
Truy cập /super-admin
    → Session riêng biệt, không liên quan Clerk
    → Credentials được hardcode trong env (SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD_HASH)
    → Hoặc quản lý qua bảng SuperAdminUser riêng
```

### 4.2 Danh sách Organizations

```
/super-admin/orgs
    → GET /api/super-admin/orgs → Tất cả workspace/org
    → Hiển thị: tên, số nhân viên, gói hiện tại, ngày tạo, trạng thái
    → Filter: plan, status, ngày tạo
    → Search: tên org, email admin
```

### 4.3 Chi tiết Organization

```
/super-admin/orgs/[id]
    → GET /api/super-admin/orgs/[id]
    → Xem:
        - Thông tin org
        - Số liệu sử dụng (nhân viên, tasks, storage)
        - Gói hiện tại + lịch sử gói
        - Upgrade requests của org
        - Admin users của org
    → Actions:
        - Thay đổi gói thủ công
        - Vô hiệu hóa workspace
        - Export data của org
```

### 4.4 Quản lý Plans

```
/system/plans
    → GET /api/admin/plans → Danh sách plans
    → Tạo plan mới: POST /api/admin/plans
    → Sửa plan: PUT /api/admin/plans/[id]
    → Deactivate: không xóa cứng
```

### 4.5 Duyệt Upgrade Requests

```
/system/upgrade-requests
    → GET /api/admin/upgrade-requests → Tất cả pending requests
    → Xem chi tiết từng request
    → Duyệt: cập nhật workspace.planId ngay
    → Từ chối: ghi lý do, gửi email thông báo
```

### 4.6 Quản lý System Users

```
/system/users
    → GET /api/admin/users → Users level system
    → Tạo / vô hiệu hóa system admin users
```

---

## 5. API Endpoints

### Admin Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/admin/auth/login` | Đăng nhập admin |
| POST | `/api/admin/auth/logout` | Đăng xuất |
| GET | `/api/admin/auth/me` | Verify session |

### Admin Users
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/users` | Danh sách users trong workspace |
| GET/PUT | `/api/admin/users/[id]` | Chi tiết, khóa/force logout |

### Admin Plans
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/admin/plans` | Quản lý plans |
| GET/PUT/DELETE | `/api/admin/plans/[id]` | Chi tiết plan |

### Admin Upgrade Requests
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/upgrade-requests` | Danh sách requests |
| PUT | `/api/admin/upgrade-requests/[id]` | Duyệt / từ chối |

### Super Admin Orgs
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/super-admin/orgs` | Tất cả organizations |
| GET/PUT | `/api/super-admin/orgs/[id]` | Chi tiết, cập nhật |

---

## 6. Màn hình UI

### Admin Panel
| Route | Màn hình |
|---|---|
| `/system/login` | Trang đăng nhập admin |
| `/admin/activity` | Dashboard hoạt động |
| `/admin/anomalies` | Phát hiện bất thường |
| `/admin/audit` | Audit log |
| `/admin/audit/timeline` | Timeline audit |
| `/admin/upgrade-requests` | Upgrade requests của workspace |
| `/system/users` | Quản lý users |
| `/system/plans` | Quản lý plans |
| `/system/upgrade-requests` | Duyệt upgrade requests |

### Super Admin Panel
| Route | Màn hình |
|---|---|
| `/super-admin` | Dashboard tổng quan |
| `/super-admin/orgs` | Danh sách orgs |
| `/super-admin/orgs/[id]` | Chi tiết org |

---

## 7. Bảo mật

- Admin auth dùng cookie HTTP-only riêng (không phải Clerk JWT).
- Admin session expire sau 8 giờ.
- Super Admin chỉ truy cập được từ IP whitelist (cấu hình môi trường).
- Mọi action trong admin panel đều được ghi vào audit log riêng.
- Rate limiting: tối đa 5 lần login fail / 15 phút → lock.
- Super Admin không có trên giao diện người dùng thông thường (route ẩn).

---

## 8. Business Rules

- Admin workspace chỉ xem data của workspace mình, không xem workspace khác.
- Super Admin có thể xem toàn bộ nhưng không thể edit data nội bộ của workspace (chỉ thay đổi plan/status).
- Khi workspace bị disable: tất cả users mất quyền truy cập nhưng data được giữ 30 ngày trước khi purge.
- Force logout invalidate tất cả Clerk sessions của user đó.
