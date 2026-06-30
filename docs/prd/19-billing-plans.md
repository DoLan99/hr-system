# PRD-19: Billing & Gói dịch vụ (Billing / Plans)

**Module:** Billing / Plans / Upgrade Requests  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Quản lý gói dịch vụ SaaS (plans), cho phép workspace yêu cầu nâng cấp gói, System Admin xem xét và phê duyệt. Theo dõi giới hạn sử dụng theo gói.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Workspace Admin | Xem gói hiện tại, gửi yêu cầu nâng cấp |
| System Admin | Tạo/sửa plans, duyệt/từ chối upgrade requests |
| Employee | Không có quyền billing |

---

## 3. Cấu trúc Gói dịch vụ (Plans)

```
Plan FREE:
    - Tối đa 5 nhân viên
    - 1 GB storage
    - Không có: Vault, Advanced Analytics, Custom Workflow
    - Support: Community

Plan STARTER:
    - Tối đa 20 nhân viên
    - 10 GB storage
    - Có: Vault, Basic Reports
    - Không có: Advanced Analytics, AI features
    - Support: Email

Plan PROFESSIONAL:
    - Tối đa 100 nhân viên
    - 50 GB storage
    - Có: Tất cả features
    - AI KPI suggestions, Career Track
    - Support: Priority email + chat

Plan ENTERPRISE:
    - Không giới hạn nhân viên
    - Storage: tuỳ chỉnh
    - Có: Tất cả + custom integrations
    - SSO, Advanced Security
    - Support: Dedicated manager
```

---

## 4. Luồng chức năng

### 4.1 Xem gói hiện tại

```
Workspace Admin vào /billing
    → Hiển thị:
        - Gói hiện tại + tính năng có
        - Số nhân viên đang dùng / giới hạn
        - Dung lượng storage đang dùng / giới hạn
        - Ngày hết hạn (nếu có)
        - Lịch sử thanh toán
```

### 4.2 Gửi yêu cầu nâng cấp

```
Admin click "Nâng cấp gói"
    → Xem bảng so sánh các gói
    → Chọn gói muốn nâng lên
    → POST /api/billing/upgrade-request
        {
          currentPlanId,
          requestedPlanId,
          reason: "Công ty mở rộng cần thêm nhân viên",
          contactEmail,
          contactPhone
        }
    → Tạo UpgradeRequest record { status: PENDING }
    → Hệ thống gửi email thông báo đến System Admin
    → Admin nhận thông báo: "Workspace X yêu cầu nâng cấp"
```

### 4.3 System Admin xem xét

```
System Admin vào /system/upgrade-requests
    → Danh sách upgrade requests
    → Xem chi tiết: workspace nào, gói hiện tại, gói muốn, lý do
    → Xem thông tin workspace: số nhân viên, mức dùng
    → Duyệt: PUT /api/admin/upgrade-requests/[id] { status: "APPROVED" }
        → Workspace được nâng cấp gói tự động
        → Gửi email xác nhận + invoice đến Admin workspace
    → Từ chối: PUT { status: "REJECTED", reason: "..." }
        → Gửi email từ chối + lý do
```

### 4.4 Giới hạn theo gói (Feature Gating)

```
Middleware kiểm tra:
    → Mỗi API call → check workspace plan
    → Nếu vượt giới hạn:
        - Thêm nhân viên khi đã max → 403 "Đã đạt giới hạn gói FREE (5 nhân viên)"
        - Upload file khi hết storage → 403 "Đã hết dung lượng"
        - Truy cập Vault khi gói FREE → 403 "Tính năng này yêu cầu gói STARTER trở lên"
    → Hiển thị upgrade prompt
```

### 4.5 Quản lý Plans (System Admin)

```
System Admin vào /system/plans
    → GET /api/admin/plans → Danh sách plans
    → Tạo plan mới: POST /api/admin/plans
    → Cập nhật plan: PUT /api/admin/plans/[id]
        (thay đổi giới hạn áp dụng ngay cho tất cả workspace đang dùng plan đó)
    → Deactivate plan (không xóa): không cho đăng ký mới
```

---

## 5. API Endpoints

### Billing (Workspace)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/billing/upgrade-request` | Gửi yêu cầu nâng cấp |

### Admin Plans
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/admin/plans` | Danh sách, tạo plan |
| GET/PUT/DELETE | `/api/admin/plans/[id]` | Chi tiết, cập nhật, xóa |

### Admin Upgrade Requests
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/upgrade-requests` | Danh sách requests |
| GET | `/api/admin/upgrade-requests/[id]` | Chi tiết |
| PUT | `/api/admin/upgrade-requests/[id]` | Duyệt / từ chối |

---

## 6. Màn hình UI

| Route | Màn hình |
|---|---|
| `/billing` | Trang billing workspace |
| `/admin/upgrade-requests` | Workspace Admin xem requests của mình |
| `/system/plans` | System Admin quản lý plans |
| `/system/upgrade-requests` | System Admin duyệt requests |

---

## 7. Data Model

**Plan:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | FREE / STARTER / PROFESSIONAL / ENTERPRISE |
| `maxEmployees` | Int | Giới hạn nhân viên (-1 = unlimited) |
| `maxStorageGB` | Int | Giới hạn storage |
| `features` | JSON | { vault: true, aiKpi: false, ... } |
| `price` | Decimal | Giá tháng |
| `isActive` | Boolean | Đang active |

**UpgradeRequest:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `workspaceId` | UUID | FK → Workspace |
| `currentPlanId` | UUID | FK → Plan |
| `requestedPlanId` | UUID | FK → Plan |
| `reason` | Text | Lý do |
| `status` | Enum | PENDING / APPROVED / REJECTED |
| `reviewedBy` | UUID | FK → Admin user |
| `reviewNote` | String | Ghi chú |

---

## 8. Business Rules

- Workspace chỉ có 1 UpgradeRequest PENDING tại 1 thời điểm.
- Downgrade: không tự làm được, phải liên hệ Admin.
- Feature gating: check ở server-side, không chỉ client-side.
- Plan change không ảnh hưởng đến data hiện có (không mất data khi downgrade).
- Khi approve: workspace.planId được cập nhật ngay lập tức.
