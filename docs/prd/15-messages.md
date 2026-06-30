# PRD-15: Nhắn tin nội bộ (Messages)

**Module:** Messages / Internal Communication  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp kênh giao tiếp nội bộ trong hệ thống: gửi tin nhắn trực tiếp, reply theo thread, quản lý kênh (channels), và tích hợp thông báo với Microsoft Teams & Zalo để mở rộng ra ngoài hệ thống.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Tất cả nhân viên | Gửi/nhận tin nhắn, tạo channel |
| Admin | Quản lý channels, xóa tin nhắn vi phạm |

---

## 3. Luồng chức năng

### 3.1 Gửi tin nhắn

```
User vào /messages → Chọn người nhận / channel
    → Soạn tin nhắn (text, có thể đính kèm file)
    → POST /api/messages
        {
          recipientId: UUID,      (tin nhắn trực tiếp)
          channelId: UUID,        (hoặc gửi vào channel)
          content: "Nội dung...",
          attachments: [...]
        }
    → Tạo Message record
    → Gửi thông báo real-time (nếu có WebSocket / SSE)
    → Gửi notification đến người nhận (in-app notification)
```

### 3.2 Reply theo thread

```
User xem tin nhắn → Click "Reply"
    → POST /api/messages/[id]/reply
        { content: "...", attachments: [...] }
    → Tạo reply record gắn với parentMessageId
    → Hiển thị thread dạng nested replies
```

### 3.3 Đánh dấu đã đọc

```
User mở cuộc trò chuyện
    → POST /api/messages/mark-read
        { messageIds: [...] }
    → Cập nhật readAt timestamp
    → Badge unread count giảm
```

### 3.4 Quản lý Channels

```
Admin / User tạo channel:
    → POST /api/channels
        { name: "general", description, memberIds: [...], isPrivate: false }
    → Gửi tin nhắn vào channel: gắn channelId
    → Thêm/xóa member vào channel
    → Channel private: chỉ member mới thấy
```

### 3.5 Xóa tin nhắn

```
User xóa tin nhắn của mình:
    → DELETE /api/messages/[id]
    → Soft delete: nội dung thay bằng "Tin nhắn đã bị xóa"
    → Admin có thể xóa tin nhắn của người khác
```

### 3.6 Tích hợp Microsoft Teams

```
Webhook /api/webhooks/teams nhận sự kiện từ Teams:
    → Tin nhắn được gửi đến bot trong Teams
    → Hệ thống parse và tạo Message record
    → Forward notification từ hệ thống sang Teams channel
```

### 3.7 Tích hợp Zalo

```
Webhook /api/webhooks/zalo nhận tin nhắn từ Zalo OA:
    → Parse message
    → Gắn với employee nếu số điện thoại khớp
    → Lưu vào Message record
    → Cho phép reply qua Zalo từ dashboard
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/messages` | Danh sách tin nhắn (inbox / channel) |
| POST | `/api/messages` | Gửi tin nhắn mới |
| GET | `/api/messages/[id]` | Chi tiết tin nhắn + replies |
| DELETE | `/api/messages/[id]` | Xóa tin nhắn |
| POST | `/api/messages/[id]/reply` | Reply tin nhắn |
| POST | `/api/messages/mark-read` | Đánh dấu đã đọc |
| GET/POST | `/api/channels` | Danh sách, tạo channel |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/messages` | Inbox + channels + chat window |

---

## 6. Data Model

**Message:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `senderId` | UUID | FK → Employee |
| `recipientId` | UUID | FK → Employee (DM) |
| `channelId` | UUID | FK → Channel |
| `parentMessageId` | UUID | FK → Message (reply) |
| `content` | Text | Nội dung |
| `attachments` | JSON | File đính kèm |
| `readAt` | DateTime | Thời điểm đọc |
| `isDeleted` | Boolean | Soft delete |
| `source` | Enum | INTERNAL / TEAMS / ZALO / EMAIL |

**Channel:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên channel |
| `description` | String | Mô tả |
| `isPrivate` | Boolean | Channel riêng tư |
| `memberIds` | UUID[] | Thành viên |
| `createdBy` | UUID | FK → Employee |

---

## 7. Business Rules

- Tin nhắn DM: chỉ 2 người thấy.
- Channel public: mọi nhân viên trong workspace có thể tham gia.
- Channel private: chỉ member được mời mới vào được.
- Không thể sửa tin nhắn đã gửi (chỉ xóa).
- File đính kèm tối đa 20MB/file.
- Tin nhắn từ Teams/Zalo được gắn source để phân biệt kênh.
