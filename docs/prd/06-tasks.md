# PRD-06 — Quản lý Công việc (Task Management)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Task Management |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, Manager, Employee, QA |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Task Management là trung tâm hoạt động của hệ thống. Mọi công việc trong tổ chức đều cần được ghi nhận, phân công và theo dõi. Hiện tại nhiều team vẫn dùng bảng Trello rời rạc, chat Zalo để phân công, hoặc Excel để track — không có sự liên kết giữa task, thời gian làm việc, và hiệu suất nhân viên.

Vấn đề cụ thể:
- Manager không biết nhân viên đang làm gì và mất bao lâu.
- Không có review process — task xong là xong, không ai kiểm tra chất lượng.
- Không có dependency tracking — làm sai thứ tự, task này block task kia không ai hay.
- Không liên kết với time log — không tính được thực sự mất bao nhiêu giờ cho từng việc.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**
- 100% công việc được ghi nhận trong hệ thống, không còn task "ngầm" qua Zalo.
- Manager biết real-time ai đang làm gì, tiến độ đến đâu.
- Giảm task bị miss deadline ≥ 30% nhờ có reminder và visibility.

**Mục tiêu người dùng:**
- Nhân viên biết chính xác mình cần làm gì, theo thứ tự ưu tiên nào.
- Manager duyệt kết quả công việc có hệ thống, không cần hỏi qua Zalo.
- Team lead quản lý sprint và tiến độ mà không cần họp status hàng ngày.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:**
- CRUD task với đầy đủ metadata
- Kanban board, list view
- Start/stop time tracking tích hợp
- Review workflow (submit → approve/reject)
- Checklist, comment, attachment, dependency, watcher
- Task recurrence (task lặp tự động)
- Task templates
- Sprint assignment
- Task types, labels, estimate flags

**Ngoài phạm vi:**
- Gantt chart (v2)
- Subtask nhiều cấp (v1 chỉ có parent-child 1 cấp)
- Git commit integration tự tạo task (xem webhook/git)

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Manager / Team Lead** | Tạo và phân công task, theo dõi tiến độ, review kết quả. | Biết task nào đang làm, ai đang làm, có đúng deadline không. | Phải hỏi từng người mới biết tiến độ; không có quy trình review chuẩn. |
| **Employee (Assignee)** | Nhận task, thực hiện, báo cáo kết quả. | Biết mình cần làm gì, theo thứ tự nào, và làm đến đâu rồi. | Task lẫn lộn từ nhiều kênh; không biết cái nào ưu tiên hơn. |
| **Watcher** | Theo dõi task không phải do mình làm (stakeholder, QA, PM). | Nhận thông báo khi task thay đổi trạng thái. | Phải hỏi thủ công mới biết task đi đến đâu. |
| **HR Admin** | Xem tổng quan công việc của nhân viên để tính KPI. | Báo cáo task hoàn thành, tỷ lệ on-time theo người/phòng ban. | Không có data task → KPI tính bằng cảm tính. |

### 2.2 User Journey

**Manager — Tạo và phân công task:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /tasks → Click "Tạo task" | Mở form |
| 2 | Điền tiêu đề, mô tả, task type, priority, due date | Nhập thông tin |
| 3 | Assign cho nhân viên, gán vào sprint, thêm labels | Phân công |
| 4 | Thêm checklist items, dependency (nếu cần) | Chi tiết hóa |
| 5 | Lưu → Nhân viên nhận thông báo | Hoàn tất |

**Employee — Thực hiện task:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận thông báo được assign task | Biết có task mới |
| 2 | Vào task detail, đọc mô tả, checklist | Hiểu yêu cầu |
| 3 | Click "Bắt đầu" → Timer chạy | Ghi nhận thời gian |
| 4 | Tick checklist từng bước khi xong | Track tiến độ |
| 5 | Đính kèm kết quả (file, link), comment mô tả | Chuẩn bị submit |
| 6 | Click "Hoàn thành / Gửi review" | Submit cho reviewer |
| 7 | Nhận feedback: Approved hoặc Rejected + lý do | Biết kết quả |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Tạo task | Form tạo task với đầy đủ metadata | Must Have | 5 |
| FR-002 | Danh sách task (Board / List) | Kanban board và list view với filter/sort | Must Have | 8 |
| FR-003 | Chi tiết task | Trang chi tiết với tất cả sub-features | Must Have | 5 |
| FR-004 | Cập nhật task | Sửa thông tin task bất kỳ lúc nào | Must Have | 3 |
| FR-005 | Xóa task | Soft delete, giữ lịch sử | Must Have | 2 |
| FR-006 | Start / Stop time tracking | Ghi nhận giờ làm tích hợp trong task | Must Have | 8 |
| FR-007 | Submit review | Assignee submit kết quả để reviewer duyệt | Must Have | 8 |
| FR-008 | Approve / Reject review | Reviewer duyệt hoặc reject với comment | Must Have | 5 |
| FR-009 | Checklist | Thêm/tick/xóa checklist items trong task | Must Have | 3 |
| FR-010 | Comments | Comment, reply, tag @người trong task | Must Have | 5 |
| FR-011 | Attachments | Upload file đính kèm trong task | Must Have | 3 |
| FR-012 | Dependencies | Khai báo task phụ thuộc (blocks / blocked by) | Should Have | 5 |
| FR-013 | Watchers | Theo dõi task, nhận thông báo khi có thay đổi | Should Have | 3 |
| FR-014 | Task Recurrence | Cấu hình task lặp tự động (daily/weekly/monthly) | Should Have | 8 |
| FR-015 | Task Templates | Tạo task từ template có sẵn | Should Have | 5 |
| FR-016 | AI Template Suggestion | Hệ thống đề xuất template phù hợp khi tạo task | Nice to Have | 8 |
| FR-017 | Sprint Assignment | Gán task vào sprint | Must Have | 3 |
| FR-018 | Task Types & Labels | Phân loại task theo type và label | Must Have | 3 |
| FR-019 | Auto-generate task code | Mã task tự động (TK-001, TK-002...) | Must Have | 2 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Manager, tôi muốn tạo task và phân công cho nhân viên, để công việc được rõ ràng và có người chịu trách nhiệm. | AC1: Form: Tiêu đề (bắt buộc), Mô tả (rich text), Assignee, Priority (LOW/MEDIUM/HIGH/CRITICAL), Due date, Task type, Sprint, Labels, Estimated hours. AC2: Task code tự động (GET /api/tasks/next-code). AC3: Sau khi tạo → Assignee nhận thông báo email + in-app. AC4: Task hiển thị ngay trên board. | High |
| US-002 | Là Employee, tôi muốn xem danh sách task của mình theo dạng board Kanban, để biết task nào đang ở giai đoạn nào. | AC1: Board view: columns = TODO / IN_PROGRESS / PENDING_REVIEW / DONE. AC2: List view: bảng với sort theo priority, due date, created date. AC3: Filter: Chỉ task của tôi / Tất cả task / Theo sprint / Theo label. AC4: Search theo tiêu đề, task code. | High |
| US-003 | Là Employee, tôi muốn bắt đầu và dừng timer khi làm task, để ghi nhận chính xác thời gian thực tế tôi đã bỏ ra. | AC1: Nút "Bắt đầu" → POST /api/tasks/[id]/start → Status = IN_PROGRESS, timer chạy. AC2: Chỉ được có 1 timer chạy cùng lúc — bắt đầu task mới sẽ hỏi "Dừng timer đang chạy?". AC3: Timer hiển thị trên header: "Đang làm: [tên task] — 1h 23m". AC4: Nút "Dừng" → POST /api/tasks/[id]/stop → Ghi TimeLog. | High |
| US-004 | Là Employee, tôi muốn submit task để reviewer kiểm tra, để không tự quyết định task xong mà cần được xác nhận. | AC1: Nút "Hoàn thành / Gửi review" xuất hiện khi status = IN_PROGRESS. AC2: Click → Status = PENDING_REVIEW. AC3: Reviewer nhận thông báo. AC4: Assignee không thể chỉnh sửa task khi PENDING_REVIEW (chỉ add comment). | High |
| US-005 | Là Manager (Reviewer), tôi muốn approve hoặc reject task với comment, để nhân viên biết kết quả và cải thiện nếu cần. | AC1: Nút "Duyệt" → Status = DONE. AC2: Nút "Từ chối" → Bắt buộc điền lý do → Status = IN_PROGRESS (quay lại để sửa). AC3: Thông báo ngay đến Assignee với kết quả và comment. AC4: Sau khi DONE: task bị lock — không ai sửa được trừ Admin reopen. | High |
| US-006 | Là Employee, tôi muốn thêm checklist vào task, để chia nhỏ công việc và track tiến độ từng bước. | AC1: Thêm checklist item (text). AC2: Tick/bỏ tick từng item. AC3: Tiến độ hiển thị: "3/5 (60%)". AC4: Xóa item bất kỳ lúc nào. AC5: Checklist items reorder bằng drag-and-drop. | Medium |
| US-007 | Là Employee, tôi muốn comment và tag đồng nghiệp trong task, để hỏi nhanh và mọi người theo dõi được context. | AC1: Gõ @tên → dropdown gợi ý nhân viên. AC2: Người được tag nhận in-app notification. AC3: Reply vào comment cụ thể (nested 1 cấp). AC4: Xóa comment của mình trong 15 phút sau khi gửi. AC5: Comment hiển thị theo thứ tự thời gian, mới nhất dưới cùng. | High |
| US-008 | Là Manager, tôi muốn khai báo task này bị block bởi task khác, để team biết không nên bắt đầu cho đến khi task kia xong. | AC1: Tab Dependencies → Thêm dependency: task bị block bởi / task blocks / related. AC2: Cảnh báo màu đỏ trên task bị block: "Đang bị block bởi: [TSK-XXX]". AC3: Khi task dependency DONE → cảnh báo tự động biến mất. | Medium |
| US-009 | Là Manager, tôi muốn tạo task lặp hàng tuần, để không phải tạo thủ công task định kỳ. | AC1: Bật toggle "Lặp lại" → chọn: Hàng ngày / Hàng tuần (chọn ngày) / Hàng tháng (chọn ngày). AC2: Có thể đặt ngày kết thúc hoặc vô thời hạn. AC3: Cron job tự tạo task mới theo lịch, kế thừa: tiêu đề, type, assignee, checklist, template. AC4: Task mới tạo có suffix "(Tuần 27)", "(Tháng 7)". | Medium |
| US-010 | Là Manager, tôi muốn tạo task từ template, để tiết kiệm thời gian với các loại task lặp lại thường xuyên. | AC1: Khi tạo task → "Chọn template" → dropdown danh sách templates. AC2: Form tự điền: tiêu đề, mô tả, task type, estimated hours, checklist từ template. AC3: Người tạo vẫn có thể chỉnh sửa trước khi submit. AC4: AI gợi ý template phù hợp dựa trên tiêu đề đang gõ. | Medium |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Performance | Board Kanban với nhiều task không bị lag. | < 2 giây load board với ≤ 200 task đang active. Lazy load khi cuộn. |
| Security | Nhân viên chỉ xem task được assign cho mình hoặc trong team. Manager xem task của team. | Phân quyền server-side. File đính kèm private — signed URL. |
| Audit | Mọi thay đổi status task phải có audit trail. | 100% status change ghi audit log: actor, old status, new status, timestamp. |
| Usability | Tạo task mới từ bất kỳ đâu trong app. | Phím tắt hoặc button "+" global để tạo task mới. |
| File Size | File đính kèm không quá lớn. | Tối đa 50MB/file. |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo và thực hiện task**

```
/tasks → [+ Tạo task]
→ Form: Tiêu đề* | Mô tả | Assignee | Priority | Due date | Type | Sprint | Labels
→ (Tuỳ chọn) Chọn Template → Tự điền fields
→ [Lưu] → POST /api/tasks → Task hiện trên board
→ Nhân viên nhận thông báo
→ Nhân viên mở task → [Bắt đầu] → Timer chạy
→ Làm việc → Tick checklist → Add comment
→ [Hoàn thành / Gửi review] → Status = PENDING_REVIEW
→ Manager nhận thông báo → Vào /task-reviews
→ [Duyệt] → Status = DONE ✅
   hoặc [Từ chối + lý do] → Status = IN_PROGRESS, nhân viên sửa lại
```

**Luồng 2: Quản lý dependencies**

```
Task detail → Tab "Dependencies"
→ [Thêm dependency] → Tìm task theo mã/tên
→ Chọn loại: "Bị block bởi" / "Block task khác" / "Liên quan"
→ Lưu → Hiển thị dependency graph
→ Task bị block: Cảnh báo màu đỏ, không thể start nếu blocker chưa DONE
```

**Luồng 3: Task recurrence setup**

```
Tạo task → Toggle "Lặp lại"
→ Chọn: Daily / Weekly (Mon, Wed, Fri) / Monthly (ngày 1 hàng tháng)
→ Ngày bắt đầu / Kết thúc (hoặc không kết thúc)
→ [Lưu] → POST /api/tasks/[id]/recurrence
→ Cron job /api/cron/recurrence chạy hàng ngày → Tạo task mới theo lịch
```

### 5.2 Task Status Flow

```
BACKLOG → TODO → IN_PROGRESS → PENDING_REVIEW → DONE
                      ↑_____________________↓ (Reject → quay về IN_PROGRESS)

DONE → IN_PROGRESS (Admin reopen)
Bất kỳ trạng thái → CANCELLED
```

---

## 6. Business Rules

### BR-001 — Task code unique trong workspace

Format mặc định: `TK-0001`. Prefix có thể cấu hình theo workspace. Mã task không thể thay đổi sau khi tạo.

### BR-002 — Chỉ Assignee mới Start/Stop

Chỉ người được assign mới được click Start/Stop timer cho task đó. Manager có thể re-assign nhưng không Start/Stop thay.

### BR-003 — 1 timer active tại 1 thời điểm

Mỗi user chỉ có tối đa 1 TimeLog với status RUNNING tại 1 thời điểm. Khi Start task mới: hệ thống hỏi "Dừng timer [task cũ] trước không?".

### BR-004 — Reviewer mặc định

Reviewer mặc định = Manager trực tiếp của Assignee. Admin có thể chỉ định reviewer riêng khi tạo task. Reviewer không thể là chính Assignee.

### BR-005 — Task DONE bị lock

Task ở status DONE không thể chỉnh sửa. Chỉ Admin mới được "Reopen" task (chuyển về IN_PROGRESS), và phải ghi lý do.

### BR-006 — Task bị block không thể Start

Nếu task có dependency `BLOCKED_BY` mà task đó chưa DONE → nút Start bị disable với tooltip giải thích. Manager có thể override nếu cần.

### BR-007 — File đính kèm tối đa 50MB

Mỗi file tối đa 50MB. Tổng file trong 1 task tối đa 200MB. Upload lên Drive/Storage, link lưu trong AttachmentRecord.

### BR-008 — Recurrence tạo task độc lập

Task được tạo từ recurrence là task độc lập hoàn toàn — không liên kết parent với task gốc. Kế thừa: tiêu đề, type, assignee, checklist template, không kế thừa comments/attachments.

### BR-009 — Xóa task là soft delete

DELETE task chuyển isDeleted = true. Task không hiển thị trên board nhưng vẫn có trong audit log và báo cáo. TimeLogs liên kết vẫn giữ nguyên.

---

## 7. Phân quyền

| Hành động | Employee (không phải assignee) | Employee (assignee) | Manager (team) | HR Admin | Admin |
|---|---|---|---|---|---|
| Xem task của team | 👁 | 👁 | ✅ | ✅ | ✅ |
| Tạo task | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chỉnh sửa task | ❌ | ✅ (khi IN_PROGRESS) | ✅ | ✅ | ✅ |
| Start / Stop timer | ❌ | ✅ | ❌ | ❌ | ✅ |
| Submit review | ❌ | ✅ | ❌ | ❌ | ✅ |
| Approve / Reject | ❌ | ❌ | ✅ | ❌ | ✅ |
| Reopen task DONE | ❌ | ❌ | ❌ | ❌ | ✅ |
| Xóa task | ❌ | ❌ | ✅ (task của team) | ❌ | ✅ |
| Xem tất cả task workspace | ❌ | ❌ | ❌ | ✅ | ✅ |
| Quản lý templates | ❌ | ❌ | ✅ | ✅ | ✅ |
| Quản lý task types | ❌ | ❌ | ❌ | ✅ | ✅ |
