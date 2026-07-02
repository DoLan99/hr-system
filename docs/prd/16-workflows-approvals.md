# PRD-16 — Workflow & Phê duyệt

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Workflow Engine / Approvals |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Nhiều quy trình trong HR system cần phê duyệt: nghỉ phép, yêu cầu mua sắm, đề xuất tăng lương, OT... Hiện tại mỗi quy trình phê duyệt được hardcode riêng. Khi công ty muốn thay đổi quy trình (thêm bước duyệt, thay người duyệt) → phải chỉnh code.

Cần một Workflow Engine linh hoạt: Admin định nghĩa quy trình phê duyệt, không cần dev.

### 1.2 Mục tiêu sản phẩm (Goals)

- Admin định nghĩa Workflow Template: các bước (Steps) + Approver + điều kiện.
- Khi trigger event (nộp đơn nghỉ, tạo yêu cầu...) → tạo Workflow Instance tự động.
- Approver nhận notification, có thể approve/reject với lý do.
- Xem lịch sử duyệt đầy đủ.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Workflow Template CRUD, sequential multi-step approval, conditional steps (dựa trên giá trị), approver = role/person/direct manager, timeout + escalation, audit trail.

**Ngoài phạm vi:** Parallel approval gateway (v2), external approver (ngoài workspace) (v2), BPMN visual editor (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin / Admin** | Thiết kế workflow phê duyệt phù hợp chính sách công ty. | Định nghĩa linh hoạt, không cần dev; thay đổi nhanh khi chính sách thay đổi. | Hiện phải yêu cầu dev sửa code khi muốn thêm bước duyệt. |
| **Manager (Approver)** | Duyệt hoặc từ chối các yêu cầu của nhân viên. | Xem đầy đủ thông tin trước khi quyết định; duyệt nhanh từ notification. | Phải vào nhiều chỗ khác nhau để duyệt các loại yêu cầu khác nhau. |
| **Employee (Requester)** | Nộp yêu cầu và theo dõi trạng thái. | Biết yêu cầu đang ở bước nào, ai đang duyệt. | Không biết yêu cầu của mình đang chờ ai duyệt; phải nhắn tin hỏi thủ công. |

### 2.2 User Journey

**HR Admin — Thiết lập Workflow Template:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /workflows → [+ Tạo Workflow] | Tạo template |
| 2 | Chọn Trigger: Leave Request / Purchase Request / OT Request... | Gắn với entity |
| 3 | Thêm Steps: Step 1 = Direct Manager, Step 2 = HR Admin (nếu > 3 ngày) | Định nghĩa quy trình |
| 4 | Publish → Workflow active, áp dụng cho yêu cầu tiếp theo | Kích hoạt |

**Employee — Gửi yêu cầu qua workflow:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Tạo Leave Request → Submit | Kích hoạt workflow |
| 2 | Workflow Instance tạo tự động; Step 1 gửi notification cho Manager | Bắt đầu quy trình |
| 3 | Manager duyệt Step 1 → nếu > 3 ngày: tự động trigger Step 2 với HR Admin | Xử lý condition |
| 4 | HR Admin duyệt → Status APPROVED → Employee nhận thông báo | Kết thúc |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Workflow Template | Tạo, sửa, xóa workflow template; chọn trigger entity | Must Have | 8 |
| FR-002 | Định nghĩa Steps | Thêm step: tên, approver (role/person/direct manager), điều kiện (conditional logic) | Must Have | 13 |
| FR-003 | Conditional Steps | Step chỉ kích hoạt khi field entity thoả điều kiện (VD: leavedays > 3) | Should Have | 13 |
| FR-004 | Tạo Workflow Instance | Khi trigger event → auto tạo instance từ template đang active | Must Have | 8 |
| FR-005 | Approve / Reject | Approver duyệt hoặc từ chối với lý do; tự động kích hoạt step tiếp | Must Have | 8 |
| FR-006 | Notification Approver | Approver nhận in-app + email notification khi đến lượt duyệt | Must Have | 5 |
| FR-007 | Timeout & Escalation | Nếu approver không duyệt trong N ngày → escalate lên level trên | Should Have | 8 |
| FR-008 | Xem trạng thái workflow | Requester và approver xem step hiện tại, lịch sử các bước | Must Have | 5 |
| FR-009 | Dashboard pending approvals | Manager xem tất cả yêu cầu đang chờ mình duyệt | Must Have | 5 |
| FR-010 | Audit trail | Lịch sử đầy đủ: ai duyệt/từ chối, khi nào, lý do | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo workflow phê duyệt nghỉ phép với nhiều bước dựa trên số ngày, để không cần dev can thiệp khi thay đổi quy trình. | AC1: Template: Tên*, Trigger (Leave Request), Mô tả. AC2: Step 1: Approver = "Direct Manager", Timeout = 2 ngày, Điều kiện = luôn required. AC3: Step 2: Approver = "HR Admin", Điều kiện = `numberOfDays > 3`. AC4: Publish → áp dụng cho Leave Request mới (không ảnh hưởng request cũ). | High |
| US-002 | Là Manager, tôi muốn nhận notification khi có yêu cầu cần tôi duyệt, và duyệt ngay từ notification. | AC1: In-app notification: "[Tên NV] đã gửi đơn nghỉ phép X ngày cần bạn duyệt." AC2: Click notification → mở approval detail với đầy đủ thông tin. AC3: [Approve] hoặc [Reject] → lý do từ chối là bắt buộc. AC4: Sau action → requester nhận notification. | High |
| US-003 | Là Employee, tôi muốn xem yêu cầu của mình đang ở bước nào trong workflow, để không phải nhắn tin hỏi. | AC1: Chi tiết request → Section "Trạng thái phê duyệt" → timeline các steps. AC2: Mỗi step: tên, approver, trạng thái (PENDING/APPROVED/REJECTED/SKIPPED), ngày action, lý do. AC3: Step PENDING → hiển thị tên người cần duyệt và ngày timeout. | High |
| US-004 | Là Manager, tôi muốn có trang tổng hợp tất cả yêu cầu đang chờ tôi duyệt, để không bỏ sót. | AC1: /approvals → list: Loại yêu cầu | Người gửi | Ngày gửi | Ngày timeout. AC2: Sort: gần timeout nhất lên đầu (urgency). AC3: Filter theo loại yêu cầu. AC4: Bulk approve cho cùng loại yêu cầu (VD: approve 5 đơn nghỉ 1 ngày cùng lúc). | High |
| US-005 | Là HR Admin, tôi muốn cấu hình timeout escalation, để yêu cầu không bị bỏ quên khi manager bận. | AC1: Mỗi step có trường Timeout (số ngày, default 3). AC2: Sau timeout: escalate tới: (1) HR Admin hoặc (2) Manager cấp trên (cấu hình per step). AC3: Escalation notification gửi cho người escalate kèm thông tin: "Yêu cầu [X] đã quá hạn [N] ngày, đã được chuyển cho bạn duyệt." AC4: Audit log ghi: "Auto-escalated at [timestamp]". | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Reliability | Workflow instance không được mất giữa chừng | Error rate | < 0.01% |
| Performance | Tạo workflow instance | Latency | < 1 giây sau submit |
| Audit | 100% actions được ghi log | Coverage | 100% |
| Scalability | Số workflow instances đồng thời | Concurrent | ≥ 1000 |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo Workflow Template**

```
/workflows/templates → [+ Tạo Workflow]
→ Bước 1: Tên | Trigger entity (dropdown) | Mô tả
→ Bước 2: Thêm Steps (drag & drop thứ tự)
  Mỗi step: Tên step | Approver (dropdown: Direct Manager/Role/Person)
           | Timeout (ngày) | Điều kiện (field operator value)
→ [Preview] → Xem flow diagram
→ [Publish] → PATCH /api/workflows/templates/:id { status: "ACTIVE" }
```

**Luồng 2: Approve/Reject từ notification**

```
Notification → "Đơn nghỉ phép của Lan cần duyệt"
→ Click → /approvals/instances/:id
→ Xem thông tin đầy đủ + attachments
→ [Approve] hoặc [Reject + lý do]
→ POST /api/workflows/instances/:id/steps/:stepId/action
→ Nếu có step tiếp → notification gửi approver tiếp theo
→ Nếu là step cuối → entity status → APPROVED/REJECTED
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Workflow Templates | `/workflows/templates` | Danh sách và quản lý template |
| Template Editor | `/workflows/templates/:id/edit` | Thiết kế workflow |
| Pending Approvals | `/approvals` | Yêu cầu chờ duyệt của tôi |
| Instance Detail | `/approvals/instances/:id` | Chi tiết + lịch sử approval |

---

## 6. Business Rules

### BR-001 — Chỉ 1 Workflow Template ACTIVE cho mỗi trigger type

Mỗi entity type (Leave/Purchase/OT...) chỉ có 1 template ở trạng thái ACTIVE tại 1 thời điểm. Khi publish template mới → template cũ tự động chuyển sang ARCHIVED.

### BR-002 — Instances chạy theo template tại thời điểm tạo

Workflow Instance chạy theo snapshot của template lúc tạo. Nếu Admin sửa template sau đó → instance cũ không bị ảnh hưởng.

### BR-003 — Approver tự đánh giá request của chính mình

Nếu approver là chính người tạo request (VD: Manager tự tạo leave request và step 1 là Direct Manager = chính họ) → step đó tự động chuyển cho approver cấp trên hoặc HR Admin (cấu hình per workspace).

### BR-004 — Reject ở bất kỳ step nào → kết thúc workflow

Khi 1 approver REJECT → toàn bộ workflow instance chuyển sang REJECTED, các step sau không được kích hoạt. Requester nhận notification với lý do reject.

### BR-005 — Timeout tính theo ngày làm việc

Timeout không tính ngày cuối tuần và ngày lễ (lấy từ WorkSchedule của workspace).

### BR-006 — Conditional step bị skip nếu điều kiện không thoả

Nếu điều kiện của step không thoả (VD: leavedays ≤ 3 nhưng step yêu cầu > 3) → step được đánh dấu SKIPPED và workflow chuyển sang step tiếp theo tự động.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem trạng thái workflow của bản thân | ✅ | ✅ | ✅ | ✅ |
| Duyệt/Từ chối (khi là Approver) | ✅ | ✅ | ✅ | ✅ |
| Xem pending approvals của mình | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa Workflow Template | ❌ | ❌ | ✅ | ✅ |
| Publish / Archive Template | ❌ | ❌ | ✅ | ✅ |
| Xem tất cả workflow instances | ❌ | 👁 (team) | ✅ | ✅ |
| Xem audit trail workflow | ❌ | ❌ | ✅ | ✅ |
| Force approve (bypass workflow) | ❌ | ❌ | ❌ | ✅ |
