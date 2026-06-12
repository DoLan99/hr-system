# Kế hoạch Tính năng Mới — HR-System
> Cập nhật: 2026-06-12 | Người thực hiện: lan.dt1@kiotviet.com

---

## Tổng quan

Mở rộng HR-System (Next.js 14 + Prisma + Clerk) với 5 nhóm tính năng mới, tích hợp Microsoft 365 (Graph API), quản lý kho, và hub tin nhắn đa kênh. Triển khai theo thứ tự ưu tiên trong ~4 tuần.

**Stack hiện tại:** Next.js 14 · TypeScript · Prisma (PostgreSQL) · Clerk (auth/multi-tenant) · Radix UI · Tailwind

---

## Lộ trình tổng thể

| Sprint | Tuần | Tính năng | Trạng thái |
|--------|------|-----------|------------|
| 1 | Tuần 1 | Microsoft Graph OAuth2 + OneDrive/SharePoint File Manager | 🔲 Chưa bắt đầu |
| 2 | Tuần 2 | Approval Workflow Engine | 🔲 Chưa bắt đầu |
| 3 | Tuần 3 | Quản lý Kho (Inventory) | 🔲 Chưa bắt đầu |
| 4 | Tuần 4 | Message Hub (gom tin nhắn đa kênh) + Office Online Embed | 🔲 Chưa bắt đầu |

---

## Sprint 1 — Microsoft Graph OAuth2 + OneDrive/SharePoint File Manager

### Mục tiêu
Nhân viên có thể duyệt, upload, tải về và phân quyền file từ OneDrive/SharePoint ngay trong ứng dụng, không cần rời tab.

### Điều kiện tiên quyết
- [ ] Đăng ký **Azure App Registration** (tenant-level hoặc multi-tenant)
- [ ] Cấp quyền Graph API: `Files.ReadWrite.All`, `Sites.ReadWrite.All`, `User.Read`
- [ ] Tạo biến môi trường: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`

### Các việc cần làm

#### 1.1 — OAuth2 Flow (Azure AD)
- [ ] Tạo `lib/microsoft-graph.ts` — khởi tạo `@microsoft/microsoft-graph-client`
- [ ] Tạo `app/api/auth/microsoft/route.ts` — redirect sang Azure AD login
- [ ] Tạo `app/api/auth/microsoft/callback/route.ts` — nhận code, đổi token, lưu vào DB
- [ ] Thêm `MicrosoftToken` model vào Prisma schema (lưu access_token, refresh_token, expiry per org)
- [ ] Tạo `lib/ms-token.ts` — tự động refresh token khi hết hạn

```prisma
// Thêm vào schema.prisma
model MicrosoftToken {
  id             String       @id @default(cuid())
  organizationId String       @unique
  organization   Organization @relation(...)
  accessToken    String       @db.Text
  refreshToken   String       @db.Text
  expiresAt      DateTime
  scope          String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@map("microsoft_tokens")
}
```

#### 1.2 — API Routes (Microsoft Graph proxy)
- [ ] `GET /api/drive/files` — list files/folders tại path hiện tại (OneDrive hoặc SharePoint site)
- [ ] `GET /api/drive/files/[id]` — lấy metadata + download URL
- [ ] `POST /api/drive/files/upload` — upload file (multipart, max 4MB simple / resumable session cho lớn hơn)
- [ ] `DELETE /api/drive/files/[id]` — xóa file (chỉ ADMIN/MANAGER)
- [ ] `POST /api/drive/folders` — tạo thư mục mới
- [ ] `GET /api/drive/search?q=` — tìm kiếm file theo tên/nội dung
- [ ] `GET /api/drive/sites` — list SharePoint sites (nếu dùng SharePoint)
- [ ] `POST /api/drive/share` — tạo sharing link với expiry + permission level

#### 1.3 — UI Components
- [ ] `app/(dashboard)/documents/page.tsx` — trang chính Document Manager
- [ ] `_components/file-browser.tsx` — breadcrumb navigation, list view/grid view
- [ ] `_components/file-card.tsx` — hiển thị icon theo loại file, size, modified date
- [ ] `_components/upload-zone.tsx` — drag & drop upload với progress bar
- [ ] `_components/file-preview-modal.tsx` — preview PDF, image, Office file (iframe)
- [ ] `_components/permission-modal.tsx` — set quyền xem/sửa theo role
- [ ] `_components/search-bar.tsx` — tìm kiếm realtime

#### 1.4 — Phân quyền
- [ ] Tạo `DrivePermission` model — map (file_id, employee_id | role_id) → permission_level (VIEW/EDIT/ADMIN)
- [ ] Middleware kiểm tra quyền trước mỗi API call đến Graph
- [ ] Nhân viên thường: chỉ thấy folder được chia sẻ với mình/phòng ban
- [ ] Manager: xem toàn bộ org folder, cấp quyền cho người khác
- [ ] Admin: full access, xóa/rename

#### 1.5 — Settings
- [ ] `app/(dashboard)/settings/_components/microsoft-connect.tsx` — nút kết nối/ngắt kết nối tài khoản Microsoft 365
- [ ] Hiển thị trạng thái kết nối, tên account đang link, nút reconnect

### Cấu trúc file sau Sprint 1
```
hr-systems/
├── lib/
│   ├── microsoft-graph.ts       # Graph client factory
│   └── ms-token.ts              # Token management + auto-refresh
├── app/
│   ├── api/
│   │   ├── auth/microsoft/      # OAuth2 endpoints
│   │   └── drive/               # File CRUD proxy
│   └── (dashboard)/
│       └── documents/           # Document manager UI
└── prisma/
    └── migrations/              # MicrosoftToken + DrivePermission
```

### Definition of Done
- [ ] Kết nối được tài khoản Microsoft 365 từ Settings
- [ ] Browse, upload, download file từ OneDrive
- [ ] Tìm kiếm file hoạt động
- [ ] Phân quyền VIEW/EDIT theo role hoạt động
- [ ] Token tự refresh không cần đăng nhập lại

---

## Sprint 2 — Approval Workflow Engine

### Mục tiêu
Thiết lập luồng phê duyệt linh hoạt (nhiều bước, nhiều người duyệt) cho bất kỳ đối tượng nào: Leave, Document, Purchase Request, TimeLog... Có thông báo tự động và nhắc việc khi quá hạn.

### Phân tích hiện tại
Codebase đã có `ApprovalStatus` enum (PENDING/APPROVED/REJECTED) trên `Leave`, `OfficeTime`, `TimeLog` nhưng chỉ là trạng thái đơn lẻ, chưa có engine đa bước.

### Các việc cần làm

#### 2.1 — Schema mở rộng
```prisma
model WorkflowTemplate {
  id             String   @id @default(cuid())
  organizationId String
  name           String                          // "Duyệt nghỉ phép", "Duyệt mua sắm"
  targetType     WorkflowTargetType              // LEAVE | DOCUMENT | PURCHASE | TIMELOG
  isActive       Boolean  @default(true)
  steps          WorkflowStep[]
  instances      WorkflowInstance[]
  createdAt      DateTime @default(now())
  @@map("workflow_templates")
}

model WorkflowStep {
  id           Int                @id @default(autoincrement())
  templateId   String
  template     WorkflowTemplate   @relation(...)
  order        Int                // thứ tự bước (1, 2, 3...)
  name         String             // "Trưởng nhóm duyệt", "Giám đốc ký"
  approverType WorkflowApprover   // ROLE | SPECIFIC_EMPLOYEE | DEPARTMENT_HEAD
  approverRef  String?            // roleId hoặc employeeId
  slaHours     Int?               // SLA tính giờ, null = không giới hạn
  @@map("workflow_steps")
}

model WorkflowInstance {
  id           String             @id @default(cuid())
  templateId   String
  organizationId String
  targetType   WorkflowTargetType
  targetId     String             // ID của Leave/Document/...
  status       WorkflowStatus     @default(RUNNING)
  currentStep  Int                @default(1)
  initiatorId  Int
  approvals    WorkflowApproval[]
  startedAt    DateTime           @default(now())
  completedAt  DateTime?
  @@map("workflow_instances")
}

model WorkflowApproval {
  id           String           @id @default(cuid())
  instanceId   String
  stepOrder    Int
  approverId   Int?
  action       ApprovalAction?  // APPROVED | REJECTED | DELEGATED
  comment      String?
  actedAt      DateTime?
  dueAt        DateTime?        // SLA deadline
  @@map("workflow_approvals")
}

enum WorkflowTargetType { LEAVE DOCUMENT PURCHASE TIMELOG CUSTOM }
enum WorkflowStatus     { RUNNING APPROVED REJECTED CANCELLED }
enum WorkflowApprover   { ROLE SPECIFIC_EMPLOYEE DEPARTMENT_HEAD DIRECT_MANAGER }
enum ApprovalAction     { APPROVED REJECTED DELEGATED }
```

#### 2.2 — API Routes
- [ ] `GET/POST /api/workflows/templates` — CRUD template
- [ ] `GET/PUT/DELETE /api/workflows/templates/[id]`
- [ ] `POST /api/workflows/start` — khởi động instance mới từ template
- [ ] `GET /api/workflows/instances` — list instances (filter by status, targetType, assignee)
- [ ] `POST /api/workflows/instances/[id]/approve` — duyệt bước hiện tại
- [ ] `POST /api/workflows/instances/[id]/reject` — từ chối + ghi comment
- [ ] `POST /api/workflows/instances/[id]/delegate` — ủy quyền cho người khác
- [ ] `GET /api/workflows/pending` — list việc cần tôi duyệt (inbox)
- [ ] `GET /api/cron/workflow-sla` — cron job check SLA, gửi reminder

#### 2.3 — Tích hợp với model hiện có
- [ ] Khi tạo `Leave` mới → tự động `POST /api/workflows/start` nếu org có template LEAVE
- [ ] Khi tạo Document mới (Sprint 1) → trigger workflow DOCUMENT nếu cần
- [ ] Cập nhật `Leave.approvalStatus` theo kết quả workflow instance

#### 2.4 — UI
- [ ] `app/(dashboard)/workflows/page.tsx` — trang quản lý templates (admin)
- [ ] `_components/workflow-builder.tsx` — drag-drop step builder
- [ ] `app/(dashboard)/approvals/page.tsx` — Inbox phê duyệt (việc cần tôi làm)
- [ ] `_components/approval-card.tsx` — hiển thị từng yêu cầu + lịch sử bước
- [ ] `_components/approval-timeline.tsx` — progress indicator các bước
- [ ] Thêm badge "Chờ duyệt" vào sidebar navigation

#### 2.5 — Thông báo
- [ ] Email notification khi có việc cần duyệt (dùng Resend/SendGrid)
- [ ] Reminder email khi SLA còn 2 giờ
- [ ] In-app toast khi yêu cầu của mình được duyệt/từ chối

### Definition of Done
- [ ] Admin tạo được workflow template LEAVE với 2 bước
- [ ] Nhân viên tạo đơn nghỉ → workflow tự khởi động
- [ ] Manager thấy inbox, duyệt/từ chối, nhân viên nhận kết quả
- [ ] SLA reminder hoạt động qua cron

---

## Sprint 3 — Quản lý Kho (Inventory Management)

### Mục tiêu
Quản lý tài sản, thiết bị, vật tư của công ty: nhập kho, xuất kho, theo dõi tồn kho, gán cho nhân viên, cảnh báo tồn kho thấp.

### Các việc cần làm

#### 3.1 — Schema mới
```prisma
model InventoryCategory {
  id             Int       @id @default(autoincrement())
  organizationId String
  name           String                     // "Thiết bị IT", "Văn phòng phẩm"
  code           String?
  items          InventoryItem[]
  @@map("inventory_categories")
}

model InventoryItem {
  id             String    @id @default(cuid())
  organizationId String
  categoryId     Int
  category       InventoryCategory @relation(...)
  name           String
  sku            String?   @unique
  unit           String                     // "cái", "hộp", "bộ"
  quantity       Int       @default(0)
  minQuantity    Int       @default(0)      // ngưỡng cảnh báo
  costPrice      Decimal?  @db.Decimal(15,2)
  location       String?                   // Kho A, Tủ B2
  description    String?
  imageUrl       String?
  transactions   InventoryTransaction[]
  assignments    InventoryAssignment[]
  createdAt      DateTime  @default(now())
  @@map("inventory_items")
}

model InventoryTransaction {
  id           String              @id @default(cuid())
  organizationId String
  itemId       String
  item         InventoryItem       @relation(...)
  type         InventoryTxType     // IN | OUT | ADJUST | RETURN
  quantity     Int
  note         String?
  referenceNo  String?             // số phiếu nhập/xuất
  actorId      Int
  actor        Employee            @relation(...)
  createdAt    DateTime            @default(now())
  @@map("inventory_transactions")
}

model InventoryAssignment {
  id           String    @id @default(cuid())
  itemId       String
  employeeId   Int
  quantity     Int
  assignedAt   DateTime  @default(now())
  returnedAt   DateTime?
  note         String?
  @@map("inventory_assignments")
}

enum InventoryTxType { IN OUT ADJUST RETURN }
```

#### 3.2 — API Routes
- [ ] `GET/POST /api/inventory/categories`
- [ ] `GET/POST /api/inventory/items` — list với filter (category, low_stock, search)
- [ ] `GET/PUT/DELETE /api/inventory/items/[id]`
- [ ] `POST /api/inventory/transactions` — nhập/xuất kho
- [ ] `GET /api/inventory/transactions` — lịch sử giao dịch
- [ ] `POST /api/inventory/assign` — gán thiết bị cho nhân viên
- [ ] `POST /api/inventory/return` — thu hồi thiết bị
- [ ] `GET /api/inventory/report` — báo cáo tồn kho, top sử dụng
- [ ] `GET /api/inventory/low-stock` — danh sách sắp hết hàng

#### 3.3 — UI
- [ ] `app/(dashboard)/inventory/page.tsx` — trang chính, tabs: Kho hàng / Giao dịch / Gán thiết bị / Báo cáo
- [ ] `_components/inventory-table.tsx` — DataTable với filter + sort
- [ ] `_components/item-form-modal.tsx` — tạo/sửa item
- [ ] `_components/transaction-form.tsx` — phiếu nhập/xuất kho
- [ ] `_components/assign-modal.tsx` — gán thiết bị cho nhân viên + QR code
- [ ] `_components/low-stock-alert.tsx` — widget cảnh báo trên dashboard
- [ ] `_components/inventory-chart.tsx` — biểu đồ trend tồn kho (Recharts, đã có sẵn)

#### 3.4 — Dashboard widget
- [ ] Thêm card "Tồn kho thấp" vào `/dashboard`
- [ ] Badge số lượng cảnh báo trong sidebar

### Definition of Done
- [ ] Nhập kho, xuất kho, điều chỉnh tồn kho
- [ ] Gán/thu hồi thiết bị cho nhân viên
- [ ] Cảnh báo tồn kho thấp hiển thị trên dashboard
- [ ] Báo cáo tồn kho export được (CSV)

---

## Sprint 4A — Message Hub (Gom tin nhắn đa kênh)

### Mục tiêu
Gom tin nhắn từ Microsoft Teams, Email (Microsoft Graph Mail), Zalo OA về một luồng duy nhất. Nhân viên trả lời từ HR-System mà không cần mở app khác.

### Phân tích hiện tại
Đã có `Message` model với `MessageChannel` enum (EMAIL, SLACK, PHONE, ZALO, CHAT, OTHER) và `/dashboard/messages`. Cần mở rộng thêm connector thực sự cho từng kênh.

### Các việc cần làm

#### 4.1 — Schema mở rộng
```prisma
// Thêm vào Message model
model Message {
  // ... fields hiện tại giữ nguyên ...
  externalId     String?          // ID tin nhắn trên kênh gốc
  externalThread String?          // Thread/conversation ID
  rawPayload     Json?            // Payload gốc từ webhook
  replyToId      String?          // Reply chain
  attachments    MessageAttachment[]
}

model MessageAttachment {
  id        String   @id @default(cuid())
  messageId String
  message   Message  @relation(...)
  name      String
  url       String
  size      Int?
  mimeType  String?
  @@map("message_attachments")
}

model ChannelIntegration {
  id             String          @id @default(cuid())
  organizationId String
  channel        MessageChannel
  config         Json            // webhook_url, bot_token, etc. (encrypted)
  isActive       Boolean         @default(true)
  lastSyncAt     DateTime?
  createdAt      DateTime        @default(now())
  @@unique([organizationId, channel])
  @@map("channel_integrations")
}
```

#### 4.2 — Webhook Receivers (inbound)
- [ ] `POST /api/webhooks/teams` — nhận tin từ Microsoft Teams (Bot Framework)
- [ ] `POST /api/webhooks/zalo` — nhận tin từ Zalo OA webhook
- [ ] `POST /api/webhooks/email` — nhận email qua Microsoft Graph subscription (change notification)
- [ ] Verify signature cho mỗi kênh (HMAC/secret)
- [ ] Parse → chuẩn hóa → lưu vào `Message` table với `channel` field

#### 4.3 — Reply (outbound)
- [ ] `lib/channels/teams.ts` — gửi reply qua Teams Bot API
- [ ] `lib/channels/zalo.ts` — gửi reply qua Zalo OA API
- [ ] `lib/channels/email.ts` — gửi reply qua Microsoft Graph `sendMail`
- [ ] `POST /api/messages/[id]/reply` — route xử lý, dispatch đến đúng channel

#### 4.4 — UI
- [ ] Cập nhật `app/(dashboard)/messages/page.tsx` — unified inbox, filter theo kênh
- [ ] Thêm icon kênh (Teams logo, Zalo logo, Email icon) vào mỗi message card
- [ ] `_components/reply-composer.tsx` — hộp soạn trả lời với file attachment
- [ ] `app/(dashboard)/settings/_components/channel-setup.tsx` — cấu hình từng kênh (nhập bot token, webhook URL)
- [ ] Realtime update (polling 30s hoặc Server-Sent Events)

### Definition of Done
- [ ] Tin nhắn Teams/Zalo/Email hiện trong inbox unified
- [ ] Trả lời được từ HR-System, tin đến đúng kênh gốc
- [ ] Filter theo kênh hoạt động
- [ ] Kênh hiển thị rõ nguồn gốc (icon + label)

---

## Sprint 4B — Office Online Embed (Word/Excel trong trình duyệt)

### Mục tiêu
Mở và chỉnh sửa file Word/Excel/PowerPoint từ OneDrive ngay trong app, không cần tải về.

### Lưu ý quan trọng
Yêu cầu tài khoản **Microsoft 365 Business** (không có trong Free/Personal). Sử dụng Microsoft Graph `createLink` để lấy embed URL, hoặc dùng **Office Online Viewer** cho file chỉ đọc.

### Hai phương án

#### Phương án A — Office Online Viewer (chỉ đọc, dễ làm)
- Lấy `@microsoft.graph.downloadUrl` từ Graph API
- Dùng `https://view.officeapps.live.com/op/embed.aspx?src=<encodedUrl>` để embed iframe
- Không cần license đặc biệt, **xem được ngay**

#### Phương án B — Office Online Editor (đọc + sửa, cần M365 Business)
- Sử dụng Microsoft Graph `POST /drive/items/{id}/createLink` với `type: "edit"`
- Lấy `webUrl` → embed trong iframe với `allowfullscreen`
- Người dùng phải đăng nhập Microsoft trong iframe

#### Các việc cần làm (Phương án A trước)
- [ ] `lib/office-embed.ts` — hàm `getOfficeEmbedUrl(driveItemId, mode: 'view'|'edit')`
- [ ] `_components/office-viewer-modal.tsx` — modal fullscreen với iframe + toolbar
- [ ] Thêm nút "Xem" / "Chỉnh sửa" vào `file-card.tsx` (Sprint 1)
- [ ] Hỗ trợ định dạng: `.docx`, `.xlsx`, `.pptx`, `.pdf`

### Definition of Done
- [ ] Click file Word/Excel trong Document Manager → mở được trong modal
- [ ] Viewer mode hoạt động không cần license thêm
- [ ] Editor mode hoạt động khi có M365 Business (optional)

---

## Kế hoạch triển khai (Staging)

### Môi trường
```
Production:  hr-systems.vercel.app  (branch: main)
Staging:     hr-systems-staging.vercel.app  (branch: develop)
```

### Biến môi trường cần thêm
```env
# Microsoft Graph (Sprint 1, 4)
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=
AZURE_REDIRECT_URI=

# Email (Sprint 2 notifications)
RESEND_API_KEY=        # hoặc SENDGRID_API_KEY

# Zalo OA (Sprint 4A)
ZALO_OA_ACCESS_TOKEN=
ZALO_OA_SECRET_KEY=
```

### Database migration thứ tự
1. `MicrosoftToken` + `DrivePermission` (Sprint 1)
2. `WorkflowTemplate`, `WorkflowStep`, `WorkflowInstance`, `WorkflowApproval` (Sprint 2)
3. `InventoryCategory`, `InventoryItem`, `InventoryTransaction`, `InventoryAssignment` (Sprint 3)
4. `ChannelIntegration`, `MessageAttachment` + extend `Message` (Sprint 4A)

---

## Checklist tổng (theo dõi tiến độ)

### Sprint 1 — OneDrive/SharePoint
- [ ] Azure App Registration
- [ ] OAuth2 flow (connect/disconnect)
- [ ] Token auto-refresh
- [ ] File browser UI
- [ ] Upload/download
- [ ] Tìm kiếm file
- [ ] Phân quyền VIEW/EDIT/ADMIN

### Sprint 2 — Workflow Engine
- [ ] Schema Prisma
- [ ] API CRUD templates
- [ ] API start/approve/reject instance
- [ ] Tích hợp Leave → workflow
- [ ] UI workflow builder
- [ ] UI approval inbox
- [ ] Email notification
- [ ] SLA cron reminder

### Sprint 3 — Inventory
- [ ] Schema Prisma
- [ ] API CRUD items + categories
- [ ] API transactions (nhập/xuất)
- [ ] API assign/return
- [ ] UI inventory table
- [ ] UI transaction form
- [ ] Dashboard widget low-stock
- [ ] Export CSV

### Sprint 4A — Message Hub
- [ ] Schema extend Message
- [ ] Webhook Teams inbound
- [ ] Webhook Zalo inbound
- [ ] Graph Mail inbound
- [ ] Reply outbound (3 kênh)
- [ ] Unified inbox UI
- [ ] Channel setup settings

### Sprint 4B — Office Embed
- [ ] `getOfficeEmbedUrl` util
- [ ] Office viewer modal
- [ ] Tích hợp vào file-card

---

## Rủi ro và giải pháp

| Rủi ro | Khả năng | Giải pháp |
|--------|----------|-----------|
| Azure App bị từ chối / chờ duyệt | Trung bình | Đăng ký sớm, dùng personal tenant để dev |
| Token Microsoft hết hạn đột ngột | Cao | Background job refresh 5 phút trước expiry |
| Zalo OA webhook không ổn định | Cao | Polling fallback + retry queue |
| Office Editor cần M365 license | Cao | Phương án A (viewer) không cần license |
| Schema migration ảnh hưởng production | Thấp | Chỉ thêm table mới, không sửa table cũ |
| Vượt rate limit Microsoft Graph | Trung bình | Cache response 60s, retry với exponential backoff |

---

*File này được cập nhật liên tục sau mỗi sprint. Mỗi khi hoàn thành một task, đánh dấu `[x]` tương ứng.*
