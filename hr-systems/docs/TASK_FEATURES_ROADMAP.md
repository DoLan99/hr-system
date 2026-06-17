# Task Feature Roadmap

## Trạng thái tổng quan

| Tính năng | Mức độ | Trạng thái | Ghi chú |
|-----------|--------|------------|---------|
| Sprint / Milestone | 🔴 Cao | ✅ Done | Trang /sprints, badge kanban, sidebar drawer + full-page |
| Checklist | 🔴 Cao | ✅ Done | API + UI drawer + full-page (progress bar) |
| Watchers | 🔴 Cao | ✅ Done | API + UI toggle button + avatar list |
| Dependencies (blocks/blocked by) | 🟡 Vừa | ✅ Done | Schema TaskDependency, API, UI section "Liên kết" |
| Attachments | 🟡 Vừa | ✅ Done | Schema TaskAttachment, API, UI section drawer + full-page |
| Mentions trong comment | 🟡 Vừa | ✅ Done | @ dropdown gợi ý, highlight @mention trong comment |
| Story points | 🟢 Thấp | ✅ Done | Field storyPoints Int?, hiển thị sidebar, manager có thể sửa |
| Recurrence | 🟢 Thấp | ✅ Done | `lib/recurrence.ts`, `components/tasks/RecurrenceEditor.tsx`, API `/api/tasks/[id]/recurrence`, cron `/api/cron/recurrence` |

---

## 🔴 1. Sprint / Milestone

### Schema
- Model `Sprint`: `id, organizationId, name, goal, status (PLANNING/ACTIVE/COMPLETED), startDate, endDate`
- `Task.sprintId Int?` → relation `Sprint`

### API
- `GET/POST /api/sprints` — list + tạo sprint
- `PATCH/DELETE /api/sprints/[id]` — sửa / đóng sprint
- `PATCH /api/tasks/[id]` — đã có, thêm `sprintId` vào updateSchema

### UI
- Sidebar task detail: row "Sprint" với select dropdown
- Trang `/sprints` (backlog view): list sprints, kéo task vào sprint
- Badge sprint trên task card (kanban)

### Files liên quan
- `prisma/schema.prisma` — thêm model Sprint + relation
- `app/api/sprints/` — CRUD routes
- `app/api/tasks/[id]/route.ts` — thêm sprintId vào updateSchema
- `app/(dashboard)/tasks/_components/task-detail-drawer.tsx` — sidebar row Sprint
- `app/(dashboard)/tasks/[id]/_components/TaskDetailPage.tsx` — sidebar row Sprint

---

## 🔴 2. Checklist

### Schema
- Model `TaskChecklistItem`: `id, taskId, content, checked, order, createdAt`

### API
- `GET/POST /api/tasks/[id]/checklist`
- `PATCH/DELETE /api/tasks/[id]/checklist/[itemId]`

### UI
- Left panel task detail (dưới description, trên subtasks)
- Hiển thị progress bar: "3/5 hoàn thành"
- Add item inline, tick/untick, xóa, reorder

### Files liên quan
- `prisma/schema.prisma` — thêm model TaskChecklistItem
- `app/api/tasks/[id]/checklist/` — CRUD routes
- `app/(dashboard)/tasks/_components/task-detail-drawer.tsx` — checklist section
- `app/(dashboard)/tasks/[id]/_components/TaskDetailPage.tsx` — checklist section

---

## 🔴 3. Watchers

### Schema
- Model `TaskWatcher`: `taskId, employeeId, createdAt` (@@unique [taskId, employeeId])

### API
- `GET /api/tasks/[id]/watchers` — list watchers
- `POST /api/tasks/[id]/watchers` — follow task
- `DELETE /api/tasks/[id]/watchers/[employeeId]` — unfollow

### UI
- Header drawer/trang chi tiết: nút "👁 Theo dõi" toggle
- Hiển thị avatar những người đang watch
- Sidebar section "Watchers"

### Notification (phase 2)
- Khi task thay đổi status/comment → tạo `Notification` record cho tất cả watchers
- Badge unread trên navbar

---

## 🟡 4. Dependencies (blocks / blocked by)

### Schema
- Model `TaskDependency`: `id, taskId, dependsOnId, type (BLOCKS/RELATES_TO/DUPLICATES)`

### API
- `GET/POST /api/tasks/[id]/dependencies`
- `DELETE /api/tasks/[id]/dependencies/[depId]`

### UI
- Section "Liên kết" trong left panel
- Search task để link, hiển thị dạng chip có type label
- Warning khi task bị blocked bởi task chưa done

---

## 🟡 5. Attachments

### Schema
- Model `TaskAttachment`: `id, taskId, uploadedById, fileName, fileUrl, fileSize, mimeType, createdAt`

### API
- `GET/POST /api/tasks/[id]/attachments` — upload tới OneDrive/S3
- `DELETE /api/tasks/[id]/attachments/[id]`

### UI
- Section "Đính kèm" trong left panel
- Drag & drop upload, preview ảnh, download file

---

## 🟡 6. Mentions trong Comment

### Cách làm
- Khi gõ `@` trong textarea comment → dropdown gợi ý employee
- Lưu mention dưới dạng `@[fullName](employeeId)` trong content
- Render thành `<span class="mention">` màu accent
- Tạo Notification cho người được mention

---

## Luồng làm việc chung cho mỗi tính năng

```
1. Sửa prisma/schema.prisma → db push
2. Tạo API routes (withContext + requireApiAuth)
3. Cập nhật UI drawer (modal) + trang chi tiết
4. Test thủ công
5. Cập nhật bảng trạng thái file này
```
