# PRD-15 — Nhắn tin nội bộ (Messages)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Messages / Internal Communication |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, All Users |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Nhân viên hiện phải dùng nhiều kênh liên lạc khác nhau (Zalo, Facebook Messenger, email cá nhân) để trao đổi công việc — dữ liệu bị phân tán, không có context liên quan đến task/HR. Cần một kênh liên lạc nội bộ tích hợp trong hệ thống HR.

### 1.2 Mục tiêu sản phẩm (Goals)

- Nhắn tin 1-1 (Direct Message) và nhóm (Group Channel) nội bộ workspace.
- Gắn kết message với task, tài liệu để có context.
- Real-time messaging với WebSocket.
- Tích hợp Microsoft Teams (gửi/nhận message qua Teams Bot nếu workspace dùng Microsoft 365).

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** DM 1-1, Group channel, gắn task/file, reactions, read receipts, notification, tích hợp Teams webhook.

**Ngoài phạm vi:** Video/voice call (v2), thread reply (v2), message scheduling (v2), AI summary (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Employee** | Trao đổi nhanh với đồng nghiệp về công việc. | Chat nhanh không cần switch app; thấy context task ngay trong chat. | Dùng Zalo cá nhân → lẫn lộn công việc/đời tư; mất context khi cần tìm lại. |
| **Manager** | Trao đổi với team, thảo luận về task trong group. | Group channel theo team/project; gắn task vào message. | Phải copy link task vào Zalo, không có preview. |

### 2.2 User Journey

**Employee — Gửi tin nhắn về task:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Mở Messages → Chọn người nhận hoặc channel | Chọn kênh liên lạc |
| 2 | Gõ tin nhắn → Gắn task (slash command hoặc icon) | Kèm context |
| 3 | Gửi → Bên kia nhận real-time | Liên lạc tức thì |
| 4 | Bên nhận click vào task card → mở task detail | Xem context |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Direct Message (DM) | Nhắn tin 1-1 với bất kỳ nhân viên trong workspace | Must Have | 8 |
| FR-002 | Group Channel | Tạo channel nhóm, thêm/bỏ thành viên | Must Have | 8 |
| FR-003 | Real-time messaging | WebSocket; tin nhắn đến tức thì không cần refresh | Must Have | 13 |
| FR-004 | Gắn task vào message | /task [task-code] → hiển thị task card trong chat | Should Have | 8 |
| FR-005 | Gắn file vào message | Upload file trực tiếp trong chat hoặc chọn từ Documents | Should Have | 5 |
| FR-006 | Reactions | Emoji reaction cho message | Nice to Have | 3 |
| FR-007 | Read receipts | Hiển thị ai đã đọc message trong DM | Should Have | 5 |
| FR-008 | Tìm kiếm message | Tìm theo nội dung, người gửi, kênh | Should Have | 8 |
| FR-009 | Notification | In-app notification khi có message mới; badge đỏ | Must Have | 5 |
| FR-010 | Tích hợp Teams | Forward notification ra Microsoft Teams channel | Should Have | 13 |
| FR-011 | @mention | @mention người dùng trong channel → họ nhận notification riêng | Should Have | 5 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Employee, tôi muốn gửi tin nhắn 1-1 cho đồng nghiệp ngay trong hệ thống, để không phải dùng app khác. | AC1: Sidebar Messages: search tên nhân viên → mở DM. AC2: Gõ và gửi tin nhắn; nhận phản hồi real-time (WebSocket). AC3: Indicator "Đang nhập..." khi bên kia đang gõ. AC4: Timestamp cho mỗi message. | High |
| US-002 | Là Manager, tôi muốn tạo channel riêng cho team dự án, để có nơi thảo luận tập trung. | AC1: Tạo channel: Tên*, Mô tả, Thêm thành viên ban đầu, Public (ai trong workspace cũng join được) / Private (chỉ được mời). AC2: Thêm/xóa thành viên sau khi tạo. AC3: Channel Private: không xuất hiện trong search cho người không là thành viên. | High |
| US-003 | Là Employee, tôi muốn gắn task vào message để đồng nghiệp thấy ngay context, không cần copy link rồi giải thích. | AC1: Trong chat box → click icon [📎 Task] hoặc gõ /task [task-code]. AC2: Task card preview: code, tên, status, assignee, deadline. AC3: Click card → mở task detail. AC4: Card tự update nếu task status thay đổi. | Medium |
| US-004 | Là Employee, tôi muốn @mention đồng nghiệp trong channel để thu hút sự chú ý của họ về message cụ thể. | AC1: Gõ @ → dropdown danh sách thành viên trong channel. AC2: Người được @mention nhận notification riêng dù không đang active. AC3: Message có @mention → tên người đó được highlight. | Medium |
| US-005 | Là Manager, tôi muốn tích hợp với Microsoft Teams để nhận notification quan trọng từ HR system vào Teams channel, vì cả công ty đang dùng Teams. | AC1: Settings → Connect Teams → webhook URL. AC2: Cấu hình: loại event nào được forward (VD: task assigned, leave approved). AC3: Format message Teams: có card với link deep-link vào HR system. AC4: Nếu Teams webhook lỗi → ghi log, không crash hệ thống chính. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Latency | Tin nhắn đến bên nhận | Thời gian trễ (WebSocket) | < 200ms (P95) |
| Scalability | Concurrent users nhắn tin | Concurrent connections | ≥ 1000 |
| History | Lưu lịch sử message | Retention | 12 tháng (Free), unlimited (Pro) |
| Security | Message trong channel Private | Access | Chỉ thành viên channel thấy |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Real-time DM**

```
Sidebar → [Messages] → [+ New DM]
→ Search tên nhân viên → Chọn → Mở chat window
→ Gõ message → Enter → POST /api/messages (hoặc WebSocket emit)
→ Bên nhận: WebSocket push → hiển thị message ngay
→ Badge unread tự cập nhật
```

**Luồng 2: Gắn task vào message**

```
Chat input → [📎] → Tab "Task" → Search task code/tên
→ Chọn task → Task card preview xuất hiện
→ [Gửi] → Message chứa taskId
→ Render: Task card với realtime status
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Inbox / DM list | `/messages` | Danh sách conversations |
| DM conversation | `/messages/:userId` | Chat 1-1 |
| Channel | `/messages/channels/:id` | Chat nhóm |
| Channel settings | `/messages/channels/:id/settings` | Quản lý thành viên |

---

## 6. Business Rules

### BR-001 — Chỉ nhân viên trong cùng workspace mới nhắn tin được nhau

DM và channel chỉ trong phạm vi workspace. Không có cross-workspace messaging.

### BR-002 — Tin nhắn không thể xóa sau 1 giờ

Để tránh xóa bằng chứng quan trọng, message chỉ có thể xóa trong vòng 1 giờ đầu. Sau đó read-only. Admin có thể xóa với audit log.

### BR-003 — Channel Private không visible với non-members

Channel Private không xuất hiện trong browse/search cho người không phải thành viên. Người được mời vào channel Private phải được member hiện tại thêm vào.

### BR-004 — Message retention theo plan

```
Free: Lưu 90 ngày tin nhắn
Pro: Lưu 12 tháng
Enterprise: Unlimited
```
Message cũ hơn giới hạn → archived (không hiển thị trong chat nhưng admin có thể export).

### BR-005 — Teams webhook không block main flow

Nếu Microsoft Teams webhook timeout hoặc lỗi → hệ thống ghi log và tiếp tục. Không để Teams integration lỗi làm ảnh hưởng tới việc gửi nhận message trong hệ thống chính.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Gửi/nhận DM | ✅ | ✅ | ✅ | ✅ |
| Tạo Group Channel | ✅ | ✅ | ✅ | ✅ |
| Tạo Channel Private | ✅ | ✅ | ✅ | ✅ |
| Thêm thành viên vào Channel | ✅ (channel của mình) | ✅ | ✅ | ✅ |
| Xóa Channel | ✅ (channel mình tạo) | ✅ | ✅ | ✅ |
| Xem lịch sử message | ✅ (channel của mình) | ✅ | ✅ | ✅ |
| Xóa message của người khác | ❌ | ❌ | ❌ | ✅ |
| Export message history | ❌ | ❌ | ✅ | ✅ |
| Cấu hình Teams integration | ❌ | ❌ | ✅ | ✅ |
