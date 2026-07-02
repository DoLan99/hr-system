# PRD-19 — Billing & Gói dịch vụ

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Billing / Plans / Upgrade Requests |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Super Admin, Finance, Workspace Admin |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Hệ thống HR là SaaS multi-tenant. Cần cơ chế:
- Phân gói dịch vụ (Free/Pro/Enterprise) với giới hạn tính năng và dung lượng khác nhau.
- Workspace Admin xem thông tin subscription, yêu cầu nâng cấp.
- Super Admin quản lý billing, approve upgrade, xem doanh thu.

### 1.2 Mục tiêu sản phẩm (Goals)

- Định nghĩa Plans với giới hạn (seat, storage, features).
- Workspace Admin xem plan hiện tại và yêu cầu upgrade.
- Enforce giới hạn plan (không cho thêm nhân viên nếu vượt seat limit).
- Super Admin quản lý tất cả subscriptions và doanh thu.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Plan definitions, subscription management, limit enforcement, upgrade request flow, Super Admin billing dashboard.

**Ngoài phạm vi:** Thanh toán tự động qua Stripe/cổng thanh toán (v2), invoice tự động (v2), credit system (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Workspace Admin** | Quản lý subscription của công ty mình. | Biết đang dùng plan gì, còn bao nhiêu seat, upgrade khi cần. | Không biết giới hạn plan của mình là gì; bất ngờ khi bị chặn thêm nhân viên. |
| **Super Admin** | Quản lý tất cả workspaces và billing. | Xem doanh thu, approve upgrade, override subscription. | Không có dashboard tập trung → phải vào DB query thủ công. |

### 2.2 User Journey

**Workspace Admin — Yêu cầu nâng cấp:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Thêm nhân viên thứ 11 → bị chặn "Vượt giới hạn 10 seats của Free plan" | Gặp giới hạn |
| 2 | Click "Nâng cấp" → xem so sánh các plan | Tìm hiểu options |
| 3 | Chọn Pro plan → [Gửi yêu cầu nâng cấp] | Submit request |
| 4 | Super Admin nhận request → review → Approve/Reject | Chờ duyệt |
| 5 | Được approve → Plan chuyển sang Pro; limits tự cập nhật | Nâng cấp thành công |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Plan Definitions | Super Admin tạo/sửa plans: tên, giá, giới hạn seat/storage/features | Must Have | 5 |
| FR-002 | Subscription per Workspace | Mỗi workspace có 1 active subscription gắn với plan | Must Have | 5 |
| FR-003 | Limit Enforcement | Enforce limits real-time: block action khi vượt giới hạn + thông báo rõ | Must Have | 8 |
| FR-004 | Usage tracking | Track: số seats đang dùng, storage đã dùng, features đang dùng | Must Have | 5 |
| FR-005 | Plan comparison page | Workspace Admin xem bảng so sánh các plan | Must Have | 5 |
| FR-006 | Upgrade Request | Workspace Admin submit yêu cầu nâng cấp plan | Must Have | 8 |
| FR-007 | Super Admin: Approve/Reject | Super Admin duyệt yêu cầu nâng cấp + set ngày hiệu lực | Must Have | 8 |
| FR-008 | Manual override | Super Admin thay đổi plan của workspace ngay lập tức | Must Have | 3 |
| FR-009 | Super Admin billing dashboard | Tổng quan: ARR, MRR, churn, breakdown theo plan | Should Have | 13 |
| FR-010 | Subscription history | Lịch sử thay đổi plan của workspace | Should Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Workspace Admin, tôi muốn biết plan hiện tại của mình và đã dùng bao nhiêu % resources, để chủ động nâng cấp trước khi bị chặn. | AC1: /settings/billing → Plan hiện tại: tên, ngày bắt đầu, ngày gia hạn. AC2: Usage meter: Seats (X/Y đang dùng), Storage (X GB / Y GB), tính %. AC3: Progress bar đổi màu: <70% xanh, 70-90% vàng, >90% đỏ. AC4: Danh sách features có sẵn và features bị khóa theo plan. | High |
| US-002 | Là Workspace Admin, tôi muốn xem bảng so sánh các plan, để quyết định nên nâng cấp lên gói nào. | AC1: Bảng so sánh: Free / Pro / Enterprise. AC2: Mỗi plan: Giá, Seats, Storage, Features (checklist). AC3: Plan hiện tại được highlight. AC4: Nút [Chọn plan này] → mở upgrade request form. | High |
| US-003 | Là Workspace Admin, tôi muốn gửi yêu cầu nâng cấp plan, để không phải liên hệ thủ công qua email. | AC1: Form: Plan muốn nâng cấp*, Số seats cần (nếu có bậc giá theo seat), Ghi chú/lý do. AC2: Submit → Super Admin nhận notification. AC3: Workspace Admin xem trạng thái request: PENDING / APPROVED / REJECTED. AC4: Sau APPROVED: Plan tự động cập nhật, usage limits tăng. | High |
| US-004 | Là Super Admin, tôi muốn approve hoặc reject yêu cầu nâng cấp, và có thể ghi chú lý do nếu reject. | AC1: /super-admin/upgrade-requests → list tất cả requests: Workspace | Plan hiện tại | Plan yêu cầu | Ngày gửi. AC2: [Approve] → set Effective Date (mặc định: hôm nay) → Subscription cập nhật. AC3: [Reject] → lý do bắt buộc → Workspace Admin nhận notification kèm lý do. | High |
| US-005 | Là Super Admin, tôi muốn xem dashboard doanh thu, để báo cáo MRR/ARR với investors. | AC1: MRR = sum(monthly fee của tất cả subscriptions ACTIVE). AC2: ARR = MRR × 12. AC3: Breakdown theo plan: số workspaces + revenue theo từng plan. AC4: Churn rate tháng = workspaces downgrade hoặc cancel / tổng workspaces. AC5: Chart MRR trend 12 tháng. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Reliability | Limit enforcement không được bypass | Error rate | 0% bypass |
| Performance | Check limit per request | Overhead | < 10ms (cached) |
| Consistency | Usage counter phải chính xác | Accuracy | ±0 seat |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Limit exceeded**

```
HR Admin → [+ Thêm nhân viên] → Check seats
→ Seats used >= seats limit → Block action
→ Toast: "Bạn đã dùng hết 10/10 seats. Nâng cấp để thêm nhân viên."
→ Link [Nâng cấp ngay] → /settings/billing/upgrade
```

**Luồng 2: Upgrade Request**

```
/settings/billing → [Nâng cấp plan]
→ Bảng so sánh plans
→ [Chọn Pro] → Form: seats cần, ghi chú
→ POST /api/billing/upgrade-requests
→ Status: PENDING → notification đến Super Admin
→ Super Admin: /super-admin/upgrade-requests → [Approve]
→ PATCH /api/billing/subscriptions/:workspaceId { planId, effectiveDate }
→ Workspace Admin nhận notification "Upgrade thành công"
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Billing & Plan | `/settings/billing` | Workspace Admin xem plan + usage |
| Plan Comparison | `/settings/billing/upgrade` | So sánh và yêu cầu nâng cấp |
| Super Admin Billing | `/super-admin/billing` | Dashboard doanh thu |
| Upgrade Requests | `/super-admin/upgrade-requests` | Quản lý requests |

---

## 6. Business Rules

### BR-001 — Plans có 3 tầng

```
FREE:       10 seats, 5GB storage, tính năng cơ bản
PRO:        Tuỳ seat (billing per seat), 100GB, đầy đủ tính năng trừ custom workflows
ENTERPRISE: Unlimited seats, unlimited storage, full features + SLA, custom setup
```

### BR-002 — Limit check được cache

Usage count được cache trong Redis với TTL 60 giây. Tránh query DB mỗi API call. Khi có action thay đổi count (add employee, upload file) → invalidate cache.

### BR-003 — Downgrade bị chặn nếu đang vượt giới hạn

Nếu workspace đang dùng 50 seats mà muốn downgrade về Free (10 seats) → block, yêu cầu giảm số nhân viên ACTIVE xuống ≤ 10 trước.

### BR-004 — Trial period

Workspace mới tự động có 30 ngày Pro trial. Sau 30 ngày → tự động xuống Free nếu không upgrade. Cảnh báo: 7 ngày, 3 ngày, 1 ngày trước khi trial hết.

### BR-005 — Subscription history immutable

Mọi thay đổi subscription tạo record mới (không update record cũ). SubscriptionHistory lưu: plan cũ, plan mới, người thay đổi, thời điểm, lý do.

---

## 7. Phân quyền

| Hành động | Employee | Manager | Workspace Admin | Super Admin |
|---|---|---|---|---|
| Xem plan hiện tại của workspace | ❌ | ❌ | ✅ | ✅ |
| Xem usage (seats, storage) | ❌ | ❌ | ✅ | ✅ |
| Gửi upgrade request | ❌ | ❌ | ✅ | ✅ |
| Approve / Reject upgrade request | ❌ | ❌ | ❌ | ✅ |
| Override subscription manually | ❌ | ❌ | ❌ | ✅ |
| Tạo / Sửa Plan definitions | ❌ | ❌ | ❌ | ✅ |
| Xem billing dashboard (MRR/ARR) | ❌ | ❌ | ❌ | ✅ |
| Xem subscription history | ❌ | ❌ | ✅ (workspace của mình) | ✅ |
