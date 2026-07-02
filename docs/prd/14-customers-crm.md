# PRD-14 — Quản lý Khách hàng (CRM)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Customers / CRM |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Sales Manager, Account Manager, HR Admin |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Dữ liệu khách hàng đang nằm rải rác: Sales lưu trong Excel cá nhân, Account Manager lưu trong email. Khi nhân viên nghỉ → thông tin khách hàng mất theo. Không ai có cái nhìn tổng thể về portfolio khách hàng, lịch sử tương tác.

### 1.2 Mục tiêu sản phẩm (Goals)

- Tập trung dữ liệu khách hàng vào 1 nơi, có phân quyền rõ ràng.
- Gán Account Manager phụ trách từng khách hàng.
- Gắn khách hàng với task và project để tracking delivery.
- Ghi lịch sử tương tác (notes, activities).

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD khách hàng, gán Account Manager, notes/activities, gắn với task/project, dashboard pipeline.

**Ngoài phạm vi:** Sales pipeline đầy đủ (Lead/Opportunity stages) (v2), email integration tracking (v2), tích hợp Zalo/SMS (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Sales Manager** | Quản lý portfolio khách hàng, phân công Account Manager. | Xem tổng quan tất cả khách hàng, biết revenue potential. | Không có hệ thống → không biết team đang serve bao nhiêu khách. |
| **Account Manager** | Phụ trách một số khách hàng, maintain relationship. | Xem thông tin và lịch sử tương tác của khách mình phụ trách. | Thông tin khách nằm trong email → khó tìm lại lịch sử. |
| **Developer / Team Member** | Làm task thuộc project của khách hàng. | Biết task đang làm thuộc khách hàng nào, yêu cầu gì. | Không biết context business của task → làm sai requirement. |

### 2.2 User Journey

**Account Manager — Quản lý khách hàng:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /customers → [+ Thêm khách hàng] | Tạo profile khách |
| 2 | Nhập thông tin: Tên công ty, Contact person, Email, Phone, Status | Khai báo đầy đủ |
| 3 | Gán Account Manager (chính mình hoặc người khác) | Phân công |
| 4 | Thêm Note: buổi meeting đầu tiên, thỏa thuận | Lịch sử tương tác |
| 5 | Tạo task liên quan → Gắn khách hàng vào task | Tracking delivery |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Khách hàng | Tạo, sửa, xóa khách hàng; thông tin: tên, loại, status, contact | Must Have | 5 |
| FR-002 | Phân loại khách hàng | Status: PROSPECT / ACTIVE / INACTIVE / CHURNED; loại: B2B/B2C | Must Have | 2 |
| FR-003 | Gán Account Manager | Một hoặc nhiều Account Manager phụ trách 1 khách hàng | Must Have | 3 |
| FR-004 | Notes & Activities | Ghi notes tương tác; log activities: cuộc gọi, meeting, email | Must Have | 8 |
| FR-005 | Gắn khách hàng với task/project | 1 task/project có thể thuộc về 1 khách hàng | Should Have | 5 |
| FR-006 | Lịch sử tương tác | Timeline các notes và activities theo thứ tự thời gian | Must Have | 5 |
| FR-007 | Dashboard khách hàng | Tổng số theo status, Account Manager, doanh thu estimate | Should Have | 8 |
| FR-008 | Tìm kiếm & lọc | Tìm theo tên, Account Manager, status, tag | Must Have | 3 |
| FR-009 | Export danh sách | Export CSV danh sách khách hàng | Should Have | 2 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Account Manager, tôi muốn tạo profile đầy đủ cho khách hàng, để có nguồn thông tin tập trung thay vì lưu trong email. | AC1: Form: Tên công ty*, Loại (B2B/B2C), Status (PROSPECT), Email, Phone, Website, Địa chỉ, Ghi chú. AC2: Upload logo khách hàng. AC3: Tag tự do (VD: "enterprise", "fintech"). AC4: Tên công ty unique trong workspace (cảnh báo nếu trùng, không block). | High |
| US-002 | Là Sales Manager, tôi muốn gán Account Manager cho từng khách hàng, để rõ ràng ai chịu trách nhiệm. | AC1: Chọn 1 hoặc nhiều Account Manager (FK → Employee). AC2: Account Manager chính (primary) và hỗ trợ (secondary). AC3: Account Manager nhận in-app notification khi được gán. AC4: Lịch sử gán: ai gán, khi nào. | High |
| US-003 | Là Account Manager, tôi muốn ghi note sau mỗi buổi meeting, để lưu lại những gì đã trao đổi. | AC1: Tab "Activities" → [+ Ghi note] → loại (NOTE/CALL/MEETING/EMAIL), nội dung (rich text), ngày. AC2: Hiển thị timeline: mới nhất lên đầu. AC3: Có thể edit note của mình trong 24 giờ, sau đó read-only. AC4: Gắn file đính kèm vào note (link tới Documents module). | High |
| US-004 | Là Developer, tôi muốn xem task mình đang làm thuộc khách hàng nào, để hiểu context business. | AC1: Task có trường "Khách hàng" (optional FK → Customer). AC2: Task detail hiển thị: tên khách hàng, contact person, link tới customer profile. AC3: Customer profile → Tab "Tasks": list tasks liên quan. | Medium |
| US-005 | Là Sales Manager, tôi muốn xem dashboard tổng quan portfolio khách hàng, để báo cáo với leadership. | AC1: Tổng số khách theo status (donut chart). AC2: Khách hàng theo Account Manager. AC3: Khách hàng mới trong 30 ngày gần nhất. AC4: Khách hàng không có activity trong 30 ngày (at-risk). | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Load danh sách khách hàng | Load time | < 1 giây với ≤ 1000 khách |
| Data privacy | Dữ liệu khách hàng nhạy cảm | Access control | Chỉ người có quyền xem được |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo khách hàng và gán Account Manager**

```
/customers → [+ Thêm khách hàng]
→ Form: Tên* | Loại | Status | Email | Phone | Tags
→ POST /api/customers
→ Redirect sang Customer detail → Tab "Account Managers" → [Gán]
→ PATCH /api/customers/:id/account-managers
```

**Luồng 2: Ghi activity**

```
Customer detail → Tab "Activities" → [+ Ghi]
→ Chọn loại: NOTE / CALL / MEETING / EMAIL
→ Ngày | Nội dung (rich text) | File đính kèm
→ POST /api/customers/:id/activities
→ Hiển thị trong timeline
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Danh sách khách hàng | `/customers` | List + filter + search |
| Profile khách hàng | `/customers/:id` | Thông tin + tabs: Activities, Tasks, Files |
| Dashboard CRM | `/customers/dashboard` | Thống kê tổng quan |

---

## 6. Business Rules

### BR-001 — Khách hàng CHURNED không gán task mới

Khách hàng status CHURNED không thể được gán vào task mới. Task cũ vẫn giữ nguyên liên kết (historical).

### BR-002 — Account Manager phải là Employee ACTIVE

Account Manager phải là Employee đang ACTIVE trong workspace. Nếu Account Manager nghỉ việc → hệ thống cảnh báo Sales Manager: "X đang phụ trách N khách hàng cần chuyển giao."

### BR-003 — Note không thể xóa sau 24 giờ

Để đảm bảo tính toàn vẹn lịch sử, note chỉ có thể edit trong 24 giờ đầu. Sau 24 giờ → read-only. Chỉ Admin có thể xóa (với audit log).

### BR-004 — Khách hàng không thể xóa nếu có task đang ACTIVE

Khách hàng có task chưa DONE không thể xóa. Phải complete hoặc unlink task trước.

---

## 7. Phân quyền

| Hành động | Employee | Account Manager | Sales Manager | HR Admin | Admin |
|---|---|---|---|---|---|
| Xem danh sách khách hàng | ❌ | ✅ (của mình) | ✅ | ✅ | ✅ |
| Xem tất cả khách hàng | ❌ | ❌ | ✅ | ✅ | ✅ |
| Tạo / Sửa khách hàng | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xóa khách hàng | ❌ | ❌ | ✅ | ✅ | ✅ |
| Gán Account Manager | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ghi note / activity | ❌ | ✅ (của mình) | ✅ | ✅ | ✅ |
| Xem activities của khách hàng | ❌ | ✅ (của mình) | ✅ | ✅ | ✅ |
| Xem Dashboard CRM | ❌ | 👁 (giới hạn) | ✅ | ✅ | ✅ |
| Export danh sách | ❌ | ❌ | ✅ | ✅ | ✅ |

**Chú thích:** "Account Manager" trong bảng = Employee được gán là Account Manager của khách hàng đó.
