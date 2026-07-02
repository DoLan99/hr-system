# PRD-25 — External Integrations & Webhooks

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | External Integrations / Webhooks / Channel Integrations |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, IT Admin, Admin |
| API chính | `POST /api/webhooks/email`, `POST /api/webhooks/git`, `POST /api/webhooks/zalo`, `POST /api/webhooks/teams`, `GET/POST /api/channels` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Team đang dùng nhiều công cụ song song: email để nhận yêu cầu từ khách hàng, GitHub/GitLab để push code, Zalo để chat nội bộ, Microsoft Teams cho meeting. Mỗi lần có activity ở công cụ ngoài → nhân viên phải nhớ quay lại HR system tạo task hoặc log time thủ công. Điều này tạo ra friction lớn → nhân viên không log đầy đủ → dữ liệu KPI sai.

**4 pain points cụ thể:**
1. Email từ khách hàng → nhân viên phải tự tạo task thủ công từ nội dung email.
2. Git commit → nhân viên phải nhớ log time thủ công sau khi code.
3. Zalo OA message → nếu không xem trong app sẽ miss notification.
4. Microsoft Teams → phải switch app để check notification HR.

### 1.2 Mục tiêu sản phẩm (Goals)

- **Email → Task (Microsoft Graph):** Email gửi đến hộp thư tích hợp → tự động tạo/update task hoặc message trong hệ thống.
- **Git Commit → TimeLog:** Push event từ GitHub/GitLab chứa task code trong commit message → tự động tạo TimeLog PENDING.
- **Zalo OA → Message:** Tin nhắn từ Zalo Official Account → lưu vào ChannelMessage của nhân viên liên quan.
- **Teams Outbound:** Notification từ HR system → forward ra Microsoft Teams channel (đã cấu hình trong PRD-15/20).
- **Channel Integration Config:** Admin config webhook/token cho từng channel tại 1 chỗ.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Email→Task qua Microsoft Graph Change Notification, Git webhook→TimeLog auto, Zalo webhook→ChannelMessage, Teams outbound notification, Channel Integration CRUD.

**Ngoài phạm vi:** Slack integration (v2), WhatsApp (v2), Telegram (v2), bidirectional Zalo (reply từ HR system sang Zalo) (v2), GitHub PR review → Task status (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **IT Admin / Admin** | Cấu hình và maintain các integration. | Setup 1 lần, hệ thống tự chạy. Biết ngay khi integration lỗi. | Phải dev custom script để bridge giữa các hệ thống. |
| **Developer (Employee)** | Commit code trên GitHub → muốn time log tự động. | Commit là đủ, không cần log thủ công. | Quên log time sau khi code → KPI bị thiếu. |
| **Account Manager** | Nhận email từ khách → muốn task tự tạo. | Email vào → task tạo ngay, không mất yêu cầu. | Email bị miss, task không được tạo → khách phản hồi chậm. |

### 2.2 User Journey

**Developer — Git commit → TimeLog tự động:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Developer viết commit message: `"fix: login bug TSK-0042 TSK-0043"` | Chuẩn bị commit |
| 2 | Push lên GitHub → GitHub gọi webhook `POST /api/webhooks/git` | Webhook trigger |
| 3 | Hệ thống parse: tìm `TSK-0042`, `TSK-0043` trong message; match email commit author với Employee | Parse + match |
| 4 | Tạo 2 TimeLog (1 per task): `durationMinutes = 15`, `approvalStatus = PENDING`, note = "🔗 Git commit: fix: login bug (abc1234)" | TimeLog created |
| 5 | Manager xem time log PENDING → Approve/Reject | Review |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Email → Task (Microsoft Graph)

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Microsoft Graph webhook endpoint | `POST /api/webhooks/email` nhận change notification từ Microsoft Graph Mail API | Must Have | 13 |
| FR-002 | Validation token | Khi Graph đăng ký subscription → respond với `validationToken` (handshake) | Must Have | 2 |
| FR-003 | Parse email payload | Extract: subject, body, from, to, attachments từ `resourceData` | Must Have | 8 |
| FR-004 | Map org bằng clientState | `clientState = orgId` trong subscription → xác định workspace nào nhận email | Must Have | 3 |
| FR-005 | Save inbound message | Gọi `saveInboundMessage(orgId, msg)` → tạo ChannelMessage với channel=EMAIL | Must Have | 5 |
| FR-006 | Respond 202 Accepted | Graph yêu cầu response 202 (không phải 200) | Must Have | 1 |

### 3.2 Git Commit → TimeLog

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-007 | Git webhook endpoint | `POST /api/webhooks/git` nhận push event từ GitHub/GitLab | Must Have | 8 |
| FR-008 | Xác thực webhook | GitHub: `X-Hub-Signature-256` HMAC verification. Fallback: `Authorization: Bearer {secret}` | Must Have | 5 |
| FR-009 | Parse task code | Regex `\bTSK-\d{3,}\b` trong commit message — 1 commit có thể chứa nhiều task codes | Must Have | 5 |
| FR-010 | Map email → Employee | `commits[].author.email` → tìm Employee trong workspace có email khớp | Must Have | 5 |
| FR-011 | Auto-create TimeLog | Mỗi (commit × task_code) → 1 TimeLog: `durationMinutes = GIT_COMMIT_DEFAULT_MINUTES` (default 15), `approvalStatus = PENDING`, `note = "🔗 Git commit: {msg} ({sha7})"` | Must Have | 5 |
| FR-012 | Deduplication | Nếu TimeLog với cùng commitSha + taskId đã tồn tại → skip (idempotent) | Must Have | 3 |

### 3.3 Zalo OA → ChannelMessage

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-013 | Zalo webhook endpoint | `POST /api/webhooks/zalo` nhận events từ Zalo OA | Must Have | 5 |
| FR-014 | URL verification | `GET /api/webhooks/zalo?challenge=xxx` → echo challenge (Zalo verification) | Must Have | 1 |
| FR-015 | Map OA ID → Org | `oaId` trong payload → tìm ChannelIntegration ZALO có config.oaId khớp | Must Have | 3 |
| FR-016 | Parse Zalo payload | Extract: senderId, content, timestamp từ Zalo event | Must Have | 5 |
| FR-017 | Save ChannelMessage | Gọi `saveInboundMessage(orgId, msg)` → tạo ChannelMessage với channel=ZALO | Must Have | 3 |

### 3.4 Channel Integration Config

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-018 | List channel integrations | `GET /api/channels` → list integrations đang có, redact sensitive values (chỉ hiện tên key) | Must Have | 3 |
| FR-019 | Upsert integration config | `POST /api/channels { channel, config, isActive }` — upsert config (token, webhook URL...) | Must Have | 5 |
| FR-020 | Supported channels | EMAIL, SLACK, PHONE, ZALO, CHAT, OTHER | Must Have | 2 |
| FR-021 | Redact config trong response | Response không trả về secret values, chỉ trả về tên keys | Must Have | 3 |

### 3.5 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Developer, tôi muốn commit code với mã task trong message và time log tự động được tạo, để không phải log thủ công sau mỗi coding session. | AC1: Commit message chứa `TSK-0042` (bất kỳ vị trí nào) → TimeLog được tạo cho task TSK-0042. AC2: 1 commit chứa nhiều task codes → tạo nhiều TimeLog. AC3: `durationMinutes = 15` (mặc định, configurable qua env `GIT_COMMIT_DEFAULT_MINUTES`). AC4: `approvalStatus = PENDING` — Manager phải duyệt (không auto-approve). AC5: Nếu email commit author không match Employee nào → bỏ qua, không throw error. | High |
| US-002 | Là IT Admin, tôi muốn cấu hình GitHub webhook một lần, để hệ thống tự động nhận push events mà không cần action gì thêm. | AC1: Setup: Admin vào GitHub repo Settings → Webhooks → Thêm `https://app.example.com/api/webhooks/git` với secret. AC2: Hệ thống verify HMAC `X-Hub-Signature-256` — reject 401 nếu sai. AC3: Fallback: `Authorization: Bearer {GIT_WEBHOOK_SECRET}` (cho GitLab hoặc các Git provider khác). AC4: Nếu không có `GIT_WEBHOOK_SECRET` env → reject tất cả (không allow unverified). | High |
| US-003 | Là Account Manager, tôi muốn email từ khách hàng gửi đến hộp thư công ty tự động tạo message trong hệ thống, để không miss yêu cầu của khách. | AC1: Microsoft Graph subscription được đăng ký cho mailbox của workspace. AC2: Email mới → `POST /api/webhooks/email` → parse subject/body/from → tạo ChannelMessage type EMAIL. AC3: Notification đến nhân viên phụ trách email đó. AC4: Graph yêu cầu renew subscription mỗi 3 ngày → hệ thống tự renew (scheduled job). | High |
| US-004 | Là Admin, tôi muốn cấu hình Zalo OA integration, để nhận tin nhắn từ khách hàng qua Zalo vào trong hệ thống. | AC1: `POST /api/channels { channel: "ZALO", config: { oaId: "xxx", oaToken: "yyy" }, isActive: true }`. AC2: Config lưu encrypted hoặc redacted khi response. AC3: Sau config: `GET /api/channels` → hiện ZALO integration với `isActive: true`, config keys không có values. AC4: Khi Zalo webhook arrive → tìm đúng org bằng oaId → save message. | Medium |
| US-005 | Là IT Admin, tôi muốn webhook của hệ thống idempotent, để không tạo duplicate TimeLog nếu GitHub retry webhook. | AC1: TimeLog có unique constraint hoặc dedup check trên `(commitSha, taskId)`. AC2: Nếu đã có TimeLog với cùng commitSha + taskId → skip, trả 200 OK (không lỗi). AC3: Webhook endpoint luôn trả 200/202 cho GitHub ngay cả khi processing fail bên trong — để không trigger GitHub retry storm. AC4: Lỗi xử lý được ghi vào log internal, không để GitHub biết. | High |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Security | Verify tất cả inbound webhooks | HMAC / token check | 100% — reject ngay nếu fail |
| Reliability | Webhook endpoint không throw unhandled error | Error rate | < 0.1% |
| Latency | Process webhook và tạo TimeLog/Message | Processing time | < 2 giây |
| Idempotency | Duplicate webhook → không tạo duplicate record | Duplicate rate | 0% |
| Availability | Endpoint phải luôn online nhận webhook | Uptime | 99.9% |

---

## 5. Thiết kế & UX

### 5.1 Git Webhook Flow chi tiết

```
[GitHub Push Event]
→ POST /api/webhooks/git
  Headers: X-Hub-Signature-256: sha256=...
  Body: { commits: [{ id, message, author: { email }, timestamp }] }

→ verifyAuth(req, rawBody) → reject 401 nếu fail

→ Parse commits:
  for each commit:
    taskCodes = extract TSK-\d{3,} from message
    if no taskCodes → skip commit
    
    employee = findByEmail(commit.author.email)
    if !employee → skip commit (log warning)
    
    for each taskCode:
      task = findByCode(taskCode, orgId from employee)
      if !task → skip
      
      existing = findTimeLog(commitId, task.id)
      if existing → skip (idempotent)
      
      createTimeLog({
        taskId: task.id,
        employeeId: employee.id,
        date: commit.timestamp,
        durationMinutes: DEFAULT_MINUTES,
        approvalStatus: "PENDING",
        note: `🔗 Git commit: ${message.slice(0,100)} (${commitId.slice(0,7)})`
      })

→ Return 200 OK (always, except auth fail)
```

### 5.2 Email Webhook Flow chi tiết

```
[Microsoft Graph Change Notification]
→ POST /api/webhooks/email
  Query: ?validationToken=xxx (nếu là handshake)
  Body: { value: [{ clientState, resourceData, ... }] }

→ Nếu validationToken present → respond text/plain validationToken (200)

→ for each notification:
  orgId = notification.clientState
  org = findOrg(orgId) → skip nếu không tìm thấy
  
  msg = parseEmailPayload(notification.resourceData)
  if !msg → skip
  
  saveInboundMessage(orgId, msg)

→ Return 202 Accepted (Graph yêu cầu 202, không phải 200)
```

### 5.3 Channel Integration Settings UI

```
/settings/integrations → Tabs: [Email] [Git] [Zalo] [Teams]

Tab Git:
  → Status: Connected / Not Connected
  → Webhook URL: https://app.example.com/api/webhooks/git (copy button)
  → Secret: [Set Secret] (input masked, lưu vào env)
  → Config: GIT_COMMIT_DEFAULT_MINUTES (input number, default 15)

Tab Zalo:
  → Status: Connected / Not Connected
  → [Connect Zalo OA] → POST /api/channels { channel: "ZALO", config: { oaId, oaToken } }
  → Sau connect: "Đã kết nối OA: {oaId}"

Tab Email:
  → Microsoft account: {email} (từ OAuth Microsoft đã connect)
  → [Setup Graph Subscription] → đăng ký Microsoft Graph change notification
  → Status subscription + expiry date
```

---

## 6. Business Rules

### BR-001 — Git TimeLog mặc định 15 phút, configurable

Default `GIT_COMMIT_DEFAULT_MINUTES = 15`. Có thể thay đổi qua env variable hoặc sau này qua workspace settings. Thời gian này là estimate — Manager phải duyệt (PENDING) chứ không auto-approve.

### BR-002 — Chỉ tạo TimeLog khi match được cả Task lẫn Employee

Nếu task code không tồn tại trong workspace → skip commit đó, không báo lỗi. Nếu email commit author không match Employee → skip, không báo lỗi. Webhook luôn trả về 200 thành công.

### BR-003 — Webhook endpoint không expose error details ra ngoài

Mọi lỗi xử lý bên trong (DB error, parse fail...) → log internal nhưng vẫn trả 200/202 cho caller. Tránh GitHub/Zalo/Graph retry liên tục do nhận 5xx.

### BR-004 — Config channel redacted trong response

`GET /api/channels` response không trả về values của config (tokens, secrets) — chỉ trả về tên keys. VD: `config: { "oaId": "***", "oaToken": "***" }`. Tránh leak credentials.

### BR-005 — Microsoft Graph subscription tự renew

Graph subscription expire sau 3 ngày (max). Hệ thống có scheduled job renew subscription trước khi expire. Nếu renewal fail → alert Admin.

### BR-006 — Zalo webhook verify (optional với secret)

Zalo gửi `X-Zevent-Signature` header nếu có app secret. Hiện có thể verify sau khi có app secret thực tế từ Zalo. Nếu chưa có secret → accept all (internal network trusted).

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | IT Admin | Admin |
|---|---|---|---|---|---|
| Xem TimeLog từ Git (của mình) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Duyệt/Reject Git TimeLog | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xem ChannelMessage (Email/Zalo) | ✅ (của mình) | ✅ | ✅ | ✅ | ✅ |
| Cấu hình Channel Integration | ❌ | ❌ | ❌ | ✅ | ✅ |
| Xem status webhooks | ❌ | ❌ | ❌ | ✅ | ✅ |
| Cấu hình Git webhook secret | ❌ | ❌ | ❌ | ✅ | ✅ |
| Cấu hình Microsoft Graph subscription | ❌ | ❌ | ❌ | ✅ | ✅ |
| Xem webhook error logs | ❌ | ❌ | ❌ | ✅ | ✅ |
