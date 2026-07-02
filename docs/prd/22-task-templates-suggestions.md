# PRD-22 — Task Templates, Template Suggestions & Estimate Flags

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Task Templates / Template Suggestions / Estimate Flags |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Manager, Employee, HR Admin |
| API chính | `GET/POST /api/task-templates`, `GET/POST /api/template-suggestions`, `GET /api/estimate-flags` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Nhân viên mỗi tháng tạo hàng trăm task có cấu trúc lặp đi lặp lại (training mới, cuộc họp định kỳ, task onboarding khách hàng...). Không có template → mỗi lần tạo mất 3-5 phút điền thủ công, dễ bỏ sót checklist, không nhất quán về estimate. Hơn nữa, khi estimate task quá xa thực tế (quen tay estimate thấp để hoàn thành sớm) → điểm KPI tốc độ bị sai lệch.

**3 vấn đề cụ thể:**
1. Tốn thời gian tạo task lặp lại → cần Task Template.
2. Nhân viên có insight về quy trình thực tế muốn đề xuất template mới → cần Template Suggestion.
3. Estimate task không sát thực tế → Manager cần tool flag và track để cải thiện → cần Estimate Flags.

### 1.2 Mục tiêu sản phẩm (Goals)

- **Task Templates:** Thư viện mẫu task chuẩn hoá — tạo task từ template trong 1 click, tự động điền: loại, estimate, checklist, label, assignee mặc định.
- **Template Suggestions:** Nhân viên đề xuất template mới dựa trên task thực tế họ đang làm — Manager/Admin review và approve → template được thêm vào thư viện. Đồng thời cộng điểm KPI Initiative (xem PRD-21).
- **Estimate Flags:** Hệ thống tự động phát hiện task có estimate lệch xa thực tế — Manager review và đánh dấu để nhân viên re-estimate lần sau.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD Task Template, tạo task từ template, Template Suggestion workflow, Estimate Flag auto-detection + manual review.

**Ngoài phạm vi:** AI tự động tạo template từ lịch sử task (v2), template marketplace giữa các workspace (v2), version history cho template (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Manager / Admin** | Xây dựng và duy trì thư viện template chuẩn cho team. | Template đúng quy trình công ty, nhất quán estimate. | Phải tự tạo từng task, nhân viên làm sai estimate lặp lại mà không biết. |
| **Employee** | Tạo task nhanh từ template; đề xuất template từ task thực tế mình đang làm. | 1 click tạo task đúng format; được ghi nhận khi đề xuất hữu ích. | Tạo task thủ công mất thời gian; muốn đề xuất cải tiến nhưng không có kênh. |

### 2.2 User Journey

**Employee — Tạo task từ template:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Tasks → [+ Tạo task] → Tab "Từ Template" | Mở template picker |
| 2 | Search hoặc browse theo phòng ban | Tìm template phù hợp |
| 3 | Click template → Preview: loại, estimate, checklist | Xem trước |
| 4 | [Tạo task này] → Task được tạo với đầy đủ defaults | Task ready, chỉ cần điền thêm ngày nếu cần |

**Employee — Đề xuất template mới:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Đang làm task → [Đề xuất thành Template] | Mở suggestion form |
| 2 | Điền: Proposed Code, Title, TaskType, Estimate, video evidence, Lý do | Submit |
| 3 | Manager nhận notification → Review → Approve/Reject | Quy trình review |
| 4 | Nếu APPROVED → Template được tạo tự động; +3đ KPI Initiative | Ghi nhận contribution |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Task Templates

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Task Template | Tạo, sửa, deactivate template với code unique (UPPER_SNAKE_CASE) | Must Have | 5 |
| FR-002 | Template fields đầy đủ | Code, Title, Description, DefaultTaskType, DefaultEstimatedTime (phút), DefaultPriority, RequiresVideo, Department, DefaultChecklist (list), DefaultLabels, DefaultAssignee | Must Have | 5 |
| FR-003 | Tạo task từ template | Tạo task với toàn bộ defaults từ template; nhân viên chỉ cần thêm dueDate nếu cần | Must Have | 5 |
| FR-004 | Browse/Search template | Tìm theo code, title; lọc theo department, isActive | Must Have | 3 |
| FR-005 | Usage counter | `usageCount` tăng mỗi khi task được tạo từ template | Should Have | 2 |
| FR-006 | Link template task | `GET /api/tasks?templateId=X` — xem các task đã tạo từ template này | Should Have | 3 |

### 3.2 Template Suggestions

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-007 | Gửi đề xuất template | Employee gửi: proposedCode, title, taskType, estimate, evidenceVideoLink, exampleTaskIds, reasonNote | Must Have | 5 |
| FR-008 | Review đề xuất | Manager/Admin review: Approve / Request Changes / Reject kèm comment | Must Have | 5 |
| FR-009 | Auto-create template khi approve | Khi APPROVED → tự tạo TaskTemplate từ proposedFields của suggestion | Must Have | 5 |
| FR-010 | Notification flow | Submit → Manager nhận. Approve/Reject → Employee nhận | Must Have | 3 |
| FR-011 | Link to KPI Initiative | Suggestion APPROVED trong tháng → cộng +3đ vào scoreInitiative (xem PRD-21 BR-006) | Must Have | 3 |

### 3.3 Estimate Flags

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-012 | Auto-detect estimate lệch | Cron job phát hiện task DONE có efficiency < 0.5 hoặc > 2.0 (actual/estimate) → tạo EstimateFlag | Should Have | 8 |
| FR-013 | Manual flag | Manager flag thủ công task bất kỳ | Should Have | 3 |
| FR-014 | Review flag | Manager đánh dấu flag là "đã xem xét": ghi chú, đóng flag | Should Have | 3 |
| FR-015 | Dashboard estimate flags | List flags open/resolved; filter theo nhân viên, template | Should Have | 5 |

### 3.4 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Manager, tôi muốn tạo template chuẩn cho task onboarding nhân viên mới, để team không cần nhớ checklist mà vẫn không bỏ sót bước nào. | AC1: Tạo template: Code = `ONBOARDING_NEW_HIRE`, Title, TaskType = ADMIN, EstimatedTime = 120 phút, Checklist = ["Tạo tài khoản email", "Cấp quyền Slack", "Meeting intro"]. AC2: Code unique trong workspace — trả 409 nếu trùng. AC3: Template có thể gán DefaultAssignee (người HR thường phụ trách). AC4: isActive = true mặc định, có thể deactivate mà không xóa. | High |
| US-002 | Là Employee, tôi muốn tạo task từ template trong 1 click, để không tốn thời gian điền lại thông tin đã có sẵn. | AC1: Khi chọn template → task được pre-fill: title (có thể sửa), taskType, estimatedTime, priority, checklist, labels. AC2: Assignee = defaultAssignee của template (có thể thay). AC3: `usageCount` của template tăng thêm 1. AC4: Task mới gắn `templateId` để tracking. | High |
| US-003 | Là Employee, tôi muốn đề xuất task tôi đang làm thành template chính thức, để đồng nghiệp không phải mò từ đầu lần sau. | AC1: Form: Proposed Code (UPPER_SNAKE_CASE)*, Proposed Title*, TaskType*, EstimatedTime* (phút), Evidence Video Link* (URL), Example Task IDs (optional), Reason Note*. AC2: Submit → status = PENDING. AC3: Manager nhận notification trong vòng 5 phút. AC4: Employee xem được lịch sử đề xuất của mình với status hiện tại. | High |
| US-004 | Là Manager, tôi muốn review và approve/reject đề xuất template, để kiểm soát chất lượng thư viện template. | AC1: `/task-templates?suggestions=1` → list suggestions PENDING. AC2: Xem đề xuất: proposed fields + link video evidence + example tasks. AC3: [Approve] → Template được tạo tự động từ proposed fields; suggestion status → APPROVED. AC4: [Reject] → ghi reason; suggestion status → REJECTED; Employee nhận notification kèm lý do. AC5: [Request Changes] → Employee nhận notification để chỉnh sửa rồi re-submit. | High |
| US-005 | Là Manager, tôi muốn xem danh sách task có estimate sai xa thực tế, để giúp nhân viên estimate tốt hơn. | AC1: `/estimate-flags` → list flags: Task | Nhân viên | Efficiency thực tế | Lý do flag | Status (open/resolved). AC2: Click flag → xem task detail + history time logs. AC3: [Mark Reviewed + Note] → flag status → RESOLVED. AC4: Dashboard: tổng flags open theo nhân viên (nhân viên nào hay sai nhất). | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Load template library | Load time | < 500ms với ≤ 500 templates |
| Uniqueness | Code template unique | Validation | 100% enforce tại DB level |
| Traceability | Mỗi task biết tạo từ template nào | Coverage | templateId gắn vào task khi tạo |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo task từ template**

```
/tasks → [+ Tạo task] → Modal Tab "Từ Template"
  → Search: "onboarding" → List kết quả: Code | Title | Type | Estimate | Dept
  → Click template → Preview panel bên phải: full fields + checklist
  → [Dùng template này] → Task form pre-filled
  → Nhân viên thêm dueDate + optional fields → [Tạo]
  → POST /api/tasks { templateId, ...overrides }
```

**Luồng 2: Đề xuất Template**

```
Task detail (đang làm) → [💡 Đề xuất thành Template]
  → Modal: proposedCode* | proposedTitle* | taskType* | estimatedTime* (phút)
           evidenceVideoLink* | exampleTaskIds | reasonNote*
  → [Submit] → POST /api/template-suggestions
  → Toast: "Đề xuất đã gửi. Manager sẽ review trong 3 ngày làm việc."
  → Manager notification → /task-templates?tab=suggestions
  → [Approve] → Template auto-created → Employee notification "Đề xuất của bạn đã được duyệt!"
```

**Luồng 3: Estimate Flag workflow**

```
[Cron job sau khi task DONE]
  → Tính efficiency = estimatedTime / actualTimeTotal
  → efficiency < 0.5 hoặc > 2.0 → Tạo EstimateFlag { taskId, employeeId, efficiency }
  
Manager → /estimate-flags → [open tab]
  → Table: Task | Employee | Est | Actual | Efficiency | Date
  → Click → Task detail sidebar
  → [Mark Reviewed] → Ghi note → EstimateFlag.status = RESOLVED
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Template Library | `/task-templates` | Browse + tìm kiếm tất cả templates |
| Template Detail | `/task-templates/:id` | Xem/Sửa template, list tasks đã tạo từ template |
| Template Suggestions | `/task-templates?tab=suggestions` | Manager review suggestions |
| Estimate Flags | `/task-templates?tab=flags` | Manager review estimate flags |

---

## 6. Business Rules

### BR-001 — Code Template phải UPPER_SNAKE_CASE và unique trong workspace

Format: `/^[A-Z0-9_]+$/` — chỉ chữ hoa, số, gạch dưới. Unique per organization. Trả 409 Conflict nếu trùng.

### BR-002 — Deactivate thay vì xóa

Template đã có task con (`usageCount > 0`) không thể xóa — chỉ `isActive = false`. Template inactive không hiển thị trong picker nhưng task cũ vẫn giữ `templateId`.

### BR-003 — Auto-create template khi approve suggestion

Khi Manager approve suggestion:
1. Tạo TaskTemplate từ proposedCode, proposedTitle, proposedTaskType, proposedEstimate.
2. Gắn `templateSuggestionId` vào template (traceability).
3. Suggestion status → APPROVED, reviewedById = managerId, reviewedAt = now.
4. Employee nhận notification.
5. KPI Initiative: suggestion được count trong tháng approve (không phải tháng submit).

### BR-004 — Estimate Flag ngưỡng

```
efficiency = estimatedTime / actualTimeTotal

efficiency < 0.5  → Flag "Under-estimate" (thực tế > 2× estimate)
efficiency > 2.0  → Flag "Over-estimate" (thực tế < 0.5× estimate)
Loại trừ task type: LEARNING, MEETING (không có estimate thực tế)
Chỉ flag task đã DONE (không flag task đang làm)
```

### BR-005 — 1 evidenceVideoLink bắt buộc trong Suggestion

Đề xuất template PHẢI kèm link video minh chứng (screen recording hoặc OneDrive link) để Manager có thể verify quy trình thực tế. Không có link → từ chối submit.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Browse/Search templates | ✅ | ✅ | ✅ | ✅ |
| Tạo task từ template | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa Template | ❌ | ✅ | ✅ | ✅ |
| Deactivate Template | ❌ | ✅ | ✅ | ✅ |
| Gửi Template Suggestion | ✅ | ✅ | ✅ | ✅ |
| Xem suggestion của bản thân | ✅ | ✅ | ✅ | ✅ |
| Review (Approve/Reject) Suggestion | ❌ | ✅ | ✅ | ✅ |
| Xem Estimate Flags | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Mark Flag Reviewed | ❌ | ✅ (team của mình) | ✅ | ✅ |
