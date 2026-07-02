# PRD-24 — Work Rules & System Labels

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Work Rules / System Labels |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Admin, HR Admin, All Users |
| API chính | `GET/POST/PUT/DELETE /api/work-rules`, `GET/PUT /api/system-labels` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Mỗi công ty có quy tắc làm việc riêng (Work Rules) — quy tắc về timekeeping, quy tắc log time, quy tắc về task type, chính sách OT... Hiện tại các quy tắc này nằm trong file Word hoặc email, không được nhúng vào hệ thống → nhân viên không biết hoặc quên. Đồng thời, các nhãn hệ thống (System Labels) như tên trạng thái task, loại nghỉ phép, loại thanh toán đang được hardcode — nếu công ty muốn đổi tên "Nghỉ phép năm" thành "Annual Leave" (tiếng Anh) → phải dev mới làm được.

### 1.2 Mục tiêu sản phẩm (Goals)

- **Work Rules:** Admin đăng tải quy tắc làm việc nội bộ vào hệ thống — nhân viên đọc được, có hiệu lực date rõ ràng, có số quy tắc để tham chiếu (BR-001, BR-002...).
- **System Labels:** Admin customize tên và màu sắc của các nhãn hệ thống (loại task, trạng thái, loại nghỉ phép...) mà không cần deploy lại code.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD Work Rules với ruleNo và effectiveDate; GET/PUT System Labels (customize label text + màu) cho 5 category: TASK_TYPE, TASK_PRIORITY, TASK_STATUS, LEAVE_TYPE, PAYMENT_TYPE.

**Ngoài phạm vi:** Nhân viên ký xác nhận đã đọc quy tắc (v2), version history của Work Rules (v2), thêm custom category mới cho System Labels (v2), i18n multilanguage labels (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Admin / HR Admin** | Quản lý quy tắc nội bộ + tùy chỉnh nhãn hiển thị. | Publish quy tắc nhanh, đổi tên nhãn không cần dev. | Quy tắc nằm trong email, nhân viên không tìm lại được. Nhãn hardcode không phù hợp ngôn ngữ công ty dùng. |
| **Employee** | Tra cứu quy tắc khi cần, hiểu nhãn trong hệ thống. | Tìm nhanh quy tắc cần biết; nhãn hiển thị đúng với thuật ngữ công ty đang dùng. | Phải hỏi HR khi không nhớ quy tắc; nhãn tiếng Anh nhưng quy trình nội bộ dùng tiếng Việt → confusion. |

### 2.2 User Journey

**Admin — Publish Work Rule mới:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào /work-rules → [+ Thêm quy tắc] | Form tạo |
| 2 | Điền: Số quy tắc (BR-015), Tiêu đề, Nội dung chi tiết, Ngày hiệu lực | Quy tắc cụ thể |
| 3 | [Lưu] → Quy tắc active ngay | Nhân viên đọc được |

**Admin — Đổi tên nhãn Task Status:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào /settings/system-labels → Category "Trạng thái Task" | Xem nhãn hiện tại |
| 2 | Click "IN_PROGRESS" → Sửa: label = "Đang xử lý", color = "bg-blue-100 text-blue-700" | Edit inline |
| 3 | [Lưu] → Toàn bộ UI đổi ngay | Không cần restart |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Work Rules

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Work Rules | Tạo, sửa, xóa quy tắc: ruleNo (int), title, description (rich text), effectiveDate, config (JSON tuỳ chọn) | Must Have | 5 |
| FR-002 | Số thứ tự quy tắc | `ruleNo` là số nguyên dương, unique trong workspace, dùng để tham chiếu | Must Have | 2 |
| FR-003 | Ngày hiệu lực | `effectiveDate`: quy tắc chỉ có hiệu lực từ ngày đó | Should Have | 2 |
| FR-004 | Config JSON | Trường `config` cho phép lưu thêm dữ liệu cấu hình liên quan đến quy tắc (VD: `{ "maxOTHoursPerWeek": 20 }`) | Nice to Have | 3 |
| FR-005 | List và search | Xem danh sách quy tắc sort theo ruleNo; search theo title | Must Have | 2 |
| FR-006 | Nhân viên đọc | Nhân viên xem Work Rules (read-only) | Must Have | 2 |

### 3.2 System Labels

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-007 | Xem System Labels | `GET /api/system-labels` → tất cả labels của workspace, grouped by category | Must Have | 2 |
| FR-008 | Customize label | `PUT /api/system-labels { category, key, label, color, isActive, sortOrder }` — override default | Must Have | 3 |
| FR-009 | Color picker | Chọn màu từ preset palette hoặc nhập class CSS | Must Have | 3 |
| FR-010 | Toggle isActive | Ẩn/hiện 1 label value (VD: ẩn task type MEETING nếu công ty không dùng) | Should Have | 2 |
| FR-011 | Reset về default | Xóa override, quay về default label của hệ thống | Should Have | 2 |
| FR-012 | Real-time apply | Sau khi save → toàn bộ UI sử dụng label mới ngay (không cần refresh thủ công) | Must Have | 3 |

### 3.3 System Label Categories

| Category | Key examples | Nơi sử dụng |
|---|---|---|
| `TASK_TYPE` | NORMAL, LEARNING, NEW_RESEARCH, MEETING, ADMIN, BILLABLE_CLIENT, INTERNAL | Task form, task list, KPI calculation |
| `TASK_PRIORITY` | CRITICAL, HIGH, NORMAL, LOW | Task form, task filters, task cards |
| `TASK_STATUS` | BACKLOG, IN_PROGRESS, BLOCKED, REVIEW, DONE, CANCELLED | Task board columns, task detail |
| `LEAVE_TYPE` | VACATION, HOLIDAY, ILLNESS, OTHER | Leave form, leave reports |
| `PAYMENT_TYPE` | SALARY, BONUS, ADVANCE, DEDUCTION, OTHER | Payment form, payment history |

### 3.4 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Admin, tôi muốn publish Work Rules vào hệ thống với số thứ tự rõ ràng, để nhân viên có thể tham chiếu "theo quy tắc BR-007". | AC1: Form: ruleNo (integer, unique)*, Title*, Description (rich text)*, EffectiveDate (optional). AC2: ruleNo phải duy nhất — trả 409 nếu trùng. AC3: List sắp xếp theo ruleNo asc. AC4: Không thể xóa quy tắc đang có `effectiveDate` trong quá khứ (archived thay vì delete). | High |
| US-002 | Là Employee, tôi muốn tìm kiếm quy tắc theo keyword, để không phải scroll toàn bộ danh sách. | AC1: Search bar → filter theo title real-time. AC2: Kết quả hiển thị: BR-xxx | Tiêu đề | Ngày hiệu lực. AC3: Click → Xem full description. AC4: Quy tắc có effectiveDate trong tương lai → hiển thị badge "Sắp có hiệu lực [ngày]". | Medium |
| US-003 | Là Admin, tôi muốn đổi tên "LEARNING" task type thành "Học & Phát triển" và màu tím, để phù hợp với thuật ngữ công ty đang dùng trong các tài liệu nội bộ. | AC1: `/settings/system-labels` → Click category TASK_TYPE → Edit key LEARNING. AC2: Sửa: label = "Học & Phát triển", color = "bg-purple-100 text-purple-700". AC3: [Lưu] → `PUT /api/system-labels { category: "TASK_TYPE", key: "LEARNING", label: "Học & Phát triển", color: "bg-purple-100 text-purple-700" }`. AC4: Tất cả màn hình hiển thị task type LEARNING → render "Học & Phát triển" với màu tím ngay lập tức. AC5: KPI calculation vẫn dùng key "LEARNING" (không đổi logic). | High |
| US-004 | Là Admin, tôi muốn ẩn task type MEETING khỏi picker, vì công ty không track meeting hours. | AC1: Edit key MEETING → Toggle `isActive = false`. AC2: Sau khi save → MEETING không xuất hiện trong dropdown chọn task type khi tạo task mới. AC3: Task cũ đã có type MEETING → vẫn hiển thị đúng, không bị break. AC4: Có thể re-enable bất kỳ lúc nào. | Medium |
| US-005 | Là Admin, tôi muốn reset label về mặc định nếu đã customize nhầm. | AC1: Bên cạnh mỗi label đã override → nút [Reset về mặc định]. AC2: Click → xóa bản ghi override trong DB → label quay về `DEFAULT_LABELS[category][key]`. AC3: Confirm dialog trước khi reset. | Low |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Load system labels | Response time | < 200ms (cached) |
| Consistency | Label thay đổi phải apply ngay toàn UI | Propagation | < 1 giây sau save |
| Immutability | Không xóa Work Rules đã có hiệu lực | Validation | 100% enforce |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Quản lý Work Rules**

```
/work-rules → List sorted by ruleNo
  → [+ Thêm quy tắc]
  → Form: ruleNo* | Title* | Description (rich text)* | EffectiveDate
  → POST /api/work-rules
  → Nhân viên vào /work-rules → Read-only list + Search
```

**Luồng 2: Customize System Labels**

```
/settings/system-labels
  → Tabs: [Loại Task] [Độ ưu tiên] [Trạng thái Task] [Loại nghỉ phép] [Loại thanh toán]
  → Mỗi tab: Table với columns Key | Label hiện tại | Màu | isActive | Actions
  → Click [Sửa] → Inline edit: Label text input | Color picker (preset + custom) | Active toggle
  → [Lưu] → PUT /api/system-labels
  → Toast: "Đã cập nhật. Nhãn sẽ thay đổi trong toàn hệ thống."
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Work Rules (Admin) | `/work-rules` | CRUD quy tắc + nhân viên đọc |
| System Labels | `/settings/system-labels` | Customize nhãn |

---

## 6. Business Rules

### BR-001 — ruleNo unique và bất biến sau khi tạo

`ruleNo` không thể thay đổi sau khi tạo — để tránh tham chiếu bị sai (văn bản đã ghi "theo quy tắc BR-007"). Nếu muốn xóa quy tắc → deactivate, không xóa vật lý nếu effectiveDate đã qua.

### BR-002 — System Label key bất biến, chỉ label text thay đổi

Key của System Label (VD: `"LEARNING"`, `"CRITICAL"`) không bao giờ thay đổi — đây là giá trị lưu trong DB. Chỉ `label` (text hiển thị) và `color` được customize. Logic code luôn dùng key, không dùng label text.

### BR-003 — Default fallback khi không có override

Nếu workspace chưa có override cho key nào → dùng `DEFAULT_LABELS[category][key]` từ codebase. Override chỉ được tạo khi Admin thực sự chỉnh sửa.

### BR-004 — Work Rules visible với tất cả nhân viên trong workspace

Work Rules không phân quyền xem — tất cả Employee trong workspace đều đọc được. Chỉ Admin/HR Admin mới CRUD.

---

## 7. Phân quyền

### 7.1 Work Rules

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Đọc Work Rules | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa Work Rule | ❌ | ❌ | ✅ | ✅ |
| Xóa / Deactivate Work Rule | ❌ | ❌ | ✅ | ✅ |

### 7.2 System Labels

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem System Labels | ✅ (qua API, hiển thị trong UI) | ✅ | ✅ | ✅ |
| Customize label text / màu | ❌ | ❌ | ❌ | ✅ |
| Toggle isActive | ❌ | ❌ | ❌ | ✅ |
| Reset về default | ❌ | ❌ | ❌ | ✅ |
