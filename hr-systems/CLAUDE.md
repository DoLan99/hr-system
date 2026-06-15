# HR System — Developer Guide

Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth (JWT) + Tailwind.
Mã quản lý nhân sự cho công ty công nghệ với mixed workforce (freelance + full-time).

## Quick start

```bash
# 1. Đảm bảo PostgreSQL chạy (macOS local, port 5432 — KHÔNG phải laradock)
pg_isready -h localhost -p 5432   # phải trả về "accepting connections"

# 2. Sync schema từ macOS terminal (KHÔNG chạy trong Docker container)
cd hr-systems
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma db push

# 3. Seed nếu DB trống
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npm run db:seed

# 4. Dev server (chạy trong laradock-workspace-1 hoặc local đều được)
npm run dev           # http://localhost:3003
```

> **Lưu ý DB connection:**
> - App trong container dùng `host.docker.internal:5432` (đã set trong `.env`)
> - Prisma CLI từ macOS shell phải override: `DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma ...`
> - Không có password trong chuỗi kết nối (PostgreSQL dùng peer auth cho user `lan.dt1`)

## App URLs (local)

| Trang | URL |
|---|---|
| App chính | http://localhost:3003 |
| Đăng nhập | http://localhost:3003/sign-in |
| Dashboard | http://localhost:3003/dashboard |
| Quản lý nhân viên | http://localhost:3003/employees |
| Tài liệu (OneDrive) | http://localhost:3003/documents |
| Kho vật tư | http://localhost:3003/inventory |
| Phê duyệt | http://localhost:3003/approvals |
| Workflow (manager+) | http://localhost:3003/workflows |
| Hộp thư | http://localhost:3003/messages |
| Cài đặt kênh | http://localhost:3003/settings |
| Admin — Audit log | http://localhost:3003/admin/audit |
| Admin — Audit timeline | http://localhost:3003/admin/audit/timeline |
| Admin — Anomalies | http://localhost:3003/admin/anomalies |
| Admin — Activity | http://localhost:3003/admin/activity |
| Prisma Studio | http://localhost:5555 (chạy riêng, xem bên dưới) |

> **Đăng nhập:** Dùng Clerk. Tài khoản SUPER_ADMIN được set qua biến `SUPER_ADMIN_CLERK_USER_IDS` trong `.env`.
> Trang admin (`/admin/*`) chỉ accessible khi role = `SUPER_ADMIN` hoặc `ADMIN`.

## Prisma Studio (xem/sửa DB trực tiếp)

```bash
# Chạy từ macOS terminal
cd hr-systems
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma studio
# Mở http://localhost:5555
```

## Kiến trúc — Tasks + Time Logs

Đã đơn giản hoá từ thiết kế Excel ban đầu (Task Library + Work List + Work Report → unified `tasks` + `time_logs` kiểu Jira/Linear). Xem chi tiết: [docs/HR-SYSTEM-DESIGN.md](docs/HR-SYSTEM-DESIGN.md), [docs/HR-SYS-HUONG-DAN.md](docs/HR-SYS-HUONG-DAN.md).

- **Task**: mọi việc làm = 1 task (`TSK-0001`, `taskType: NORMAL | LEARNING | NEW_RESEARCH | MEETING | …`). Có parent/sub, billable, customer link.
- **TimeLog**: mọi log thời gian phải link tới 1 task (FK Restrict). Có start/end, duration, video proof, approval lifecycle.

## Tracking & Compliance Layer

Hệ thống có pipeline truy vết user tự động (không nhập tay), gồm 4 lớp:

### Lớp 0 — Foundation
- [lib/request-context.ts](lib/request-context.ts) — `AsyncLocalStorage` lưu `{ actorId, sessionId, requestId, ipAddress, userAgent, endpoint, method }` cho mỗi request.
- [lib/with-context.ts](lib/with-context.ts) — HOC `withContext(handler)` bọc 1 route. Mọi route trong [app/api/](app/api) đều phải dùng pattern này:
  ```ts
  export const POST = withContext(async (req: NextRequest) => { ... });
  ```
- [lib/audit-extension.ts](lib/audit-extension.ts) — Prisma Client Extension. Mọi `prisma.create / update / delete / upsert / updateMany / deleteMany` trên `AUDITED_MODELS` (17 bảng) tự sinh 1 dòng `AuditLog` kèm full context. Không cần code `prisma.auditLog.create(…)` thủ công ở route handler.

### Lớp 1 — Compliance (Audit/Session/API)
- [UserSession](prisma/schema.prisma) — 1 row mỗi lần đăng nhập (IP, UA, device, browser, OS, loginMethod, logoutReason).
- [ApiAccessLog](prisma/schema.prisma) — 1 row mỗi API request (endpoint, method, statusCode, durationMs, errorMessage). Có skip list ở [lib/api-access-log.ts](lib/api-access-log.ts).
- [lib/auth.ts](lib/auth.ts) — NextAuth callbacks tạo UserSession khi `jwt({ user })` (lần đầu signIn), đóng session ở `events.signOut`.
- [lib/user-session.ts](lib/user-session.ts) — `createSession / endSession / touchActivity` (touch throttled 60s).

### Lớp 2 — Activity Tracking
- [UserActivity](prisma/schema.prisma) — gộp daily (`activeSeconds`, `idleSeconds`, `pageViews JSON`) per (sessionId, date).
- [components/tracking/activity-tracker.tsx](components/tracking/activity-tracker.tsx) — React Provider mount ở [app/(dashboard)/layout.tsx](app/(dashboard)/layout.tsx). Bắt mouse/keyboard/scroll, tick 5s, flush 60s qua `POST /api/activity/heartbeat`. Đóng tab dùng `navigator.sendBeacon`.
- [lib/contexts/timer-context.tsx](lib/contexts/timer-context.tsx) — `TimerProvider` + `useTimer()` poll `/api/time-logs/running` mỗi 30s, share state cho `<TimerButton>` và `<RunningTimerBadge>`.
- Auto TimeLog: `POST /api/tasks/[id]/start` + `/stop` — 1 timer/user tại 1 thời điểm.
- Auto OfficeTime: `GET /api/office-time/auto-derive?date=…` suy ra `startWork1 / endWorkday / actualWorked` từ UserSession + UserActivity (read-only, không persist).

### Lớp 3 — Intelligence
- [AnomalyAlert](prisma/schema.prisma) — alert với `dedupKey` unique tránh trùng. 8 type (`UNUSUAL_IP`, `OFF_HOURS_VAULT`, `BULK_DELETE`, `TIMELOG_OVER_ESTIMATE`, `FAILED_API_SPIKE`, …).
- [lib/anomaly-detection.ts](lib/anomaly-detection.ts) — 5 detector chạy parallel, gọi qua `POST /api/admin/anomalies/refresh` hoặc Vercel cron.
- Admin pages: `/admin/audit` (explorer + CSV export), `/admin/audit/timeline` (gộp Session/Audit/TimeLog/Office/Vault/Message/ApiError vào timeline 1 ngày), `/admin/anomalies` (ack/resolve/dismiss).

## Cách thêm 1 route mới

```ts
// app/api/foo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";

export const POST = withContext(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Bất kỳ prisma.task.update / create / delete / ... đều TỰ ĐỘNG sinh AuditLog
  // với context: actorId, ip, userAgent, sessionId, requestId, endpoint, method.
  await prisma.task.create({ data: { … } });

  return NextResponse.json({ ok: true });
});
```

**Không bao giờ** export `async function` raw (chưa wrap). Pattern này áp dụng cho mọi route trong `app/api/` trừ:
- `app/api/auth/[...nextauth]` — NextAuth's own handler
- `app/api/cron/*` — verify bằng `verifyCronAuth()` từ [lib/cron-auth.ts](lib/cron-auth.ts)
- `app/api/webhooks/*` — verify HMAC hoặc Bearer riêng

## Bật/tắt audit cho 1 bảng

Sửa `AUDITED_MODELS` ở [lib/audit-extension.ts](lib/audit-extension.ts). Bảng KHÔNG trong set sẽ không sinh `AuditLog` (vd: `Message` có audit riêng `MessageAuditLog`, `UserSession`/`ApiAccessLog`/`UserActivity` là tracking layer nên skip).

## Sensitive fields

Cũng ở [lib/audit-extension.ts](lib/audit-extension.ts), `SENSITIVE_FIELDS` set — các field này luôn được redact thành `[REDACTED]` trong `oldData`/`newData`. Hiện gồm: `passwordHash`, `passwordEncrypted`, `twoFaBackup`, `twoFaMethod`.

## DB connection (Docker vs host)

Project này chạy bằng **laradock-workspace container**, nên `.env` phải dùng `host.docker.internal:5432` (resolve được từ trong container).

- App trong container → `host.docker.internal:5432` ✓
- Prisma từ macOS shell → `localhost:5432` (override tạm)

Cách chạy prisma từ host:
```bash
DATABASE_URL="postgresql://default:secret@localhost:5432/hr_system" npx prisma db push
DATABASE_URL="postgresql://default:secret@localhost:5432/hr_system" npx prisma studio
```

Inspect DB từ macOS shell:
```bash
docker exec -e PGPASSWORD=secret laradock-postgres-1 psql -U default -d hr_system -c "\dt"
```

**Đừng đổi `.env` sang `localhost`** — app trong container sẽ mất kết nối DB.

## Khi gặp webpack error sau khi thêm file mới

`TypeError: Cannot read properties of undefined (reading 'call')` ở `webpack.js` thường do `.next/` cache stale (module IDs không khớp sau khi thêm/đổi file). Fix:

```bash
rm -rf .next
# rồi restart dev server
```

## Vercel deploy

ENV cần set:
```env
DATABASE_URL=postgresql://…
NEXTAUTH_URL=https://your-domain
NEXTAUTH_SECRET=<random-32+ chars>
CRON_SECRET=<random>               # cho Vercel Cron
GIT_WEBHOOK_SECRET=<random>        # cho Git webhook
GIT_COMMIT_DEFAULT_MINUTES=15      # tuỳ chọn
```

Cron schedule ở [vercel.json](vercel.json):
- `0 * * * *` → `/api/cron/anomalies` (mỗi giờ)
- `*/30 * * * *` → `/api/cron/close-stale-sessions` (mỗi 30 phút, đóng session idle > 8h)

## Git webhook tích hợp

Repo → Settings → Webhooks → URL `https://<domain>/api/webhooks/git`, secret = `GIT_WEBHOOK_SECRET`, content type `application/json`, event "Just push". Mỗi commit có `TSK-xxxx` trong message + author email match `emailCompany/emailGoogle/emailPrivate` → tự tạo TimeLog `durationMinutes=15`, `approvalStatus=PENDING`.

## Type-safety guarantees

- `withContext` generic theo `<TReq extends Request, TCtx extends RouteContext>` → preserve type chính xác từ handler (NextRequest vẫn là NextRequest, `params` không bị widen).
- `getRequestContext()` trả về `RequestContext | null` — luôn check null khi dùng ngoài route handler.
- Audit extension dùng `Prisma.JsonNull` cho field JSON null, KHÔNG dùng `null` JS (Prisma type-strict).

## Test E2E thủ công

1. Login (`/login`) → check bảng `user_sessions` có row mới với IP/UA/device.
2. Mở 1 task → click "Bắt đầu" → check `time_logs` có row `startTime != null, endTime = null` + `tasks.status = IN_PROGRESS`.
3. Đợi 2-3 phút → check `user_activity` có row update `activeSeconds`.
4. Click "Dừng" → check `time_logs` đóng + `tasks.actualTimeTotal` cộng dồn.
5. Tạo/sửa/xoá bất kỳ entity (vd: customer) → check `audit_log` có row mới với `requestId` correlate được với `api_access_log`.
6. Sửa `lastActivityAt` của 1 session về > 8h trước → curl `/api/cron/close-stale-sessions` với `Authorization: Bearer $CRON_SECRET` → check `logoutReason=TIMEOUT`.

## File map quan trọng

| Concern | Path |
|---|---|
| Schema | [prisma/schema.prisma](prisma/schema.prisma) |
| Audit extension | [lib/audit-extension.ts](lib/audit-extension.ts) |
| Request context | [lib/request-context.ts](lib/request-context.ts) |
| Route wrapper | [lib/with-context.ts](lib/with-context.ts) |
| NextAuth + session lifecycle | [lib/auth.ts](lib/auth.ts), [lib/user-session.ts](lib/user-session.ts) |
| Activity helper | [lib/activity.ts](lib/activity.ts), [lib/api-access-log.ts](lib/api-access-log.ts) |
| Anomaly detection | [lib/anomaly-detection.ts](lib/anomaly-detection.ts) |
| Activity Tracker (FE) | [components/tracking/activity-tracker.tsx](components/tracking/activity-tracker.tsx) |
| Timer context | [lib/contexts/timer-context.tsx](lib/contexts/timer-context.tsx) |
| Cron jobs | [app/api/cron/](app/api/cron/), [vercel.json](vercel.json) |
| Git webhook | [app/api/webhooks/git/route.ts](app/api/webhooks/git/route.ts) |
| Admin pages | [app/(dashboard)/admin/audit/](app/(dashboard)/admin/audit/), [admin/anomalies/](app/(dashboard)/admin/anomalies/), [admin/activity/](app/(dashboard)/admin/activity/) |
| Microsoft Graph (OneDrive) | [lib/microsoft-graph.ts](lib/microsoft-graph.ts) |
| Channel adapters | [lib/channels/](lib/channels/) — types, teams, zalo, email, dispatcher |
| Workflow engine | [lib/workflow-engine.ts](lib/workflow-engine.ts) |
| Webhook receivers | [app/api/webhooks/](app/api/webhooks/) — teams, zalo, email, git |

## Tính năng mới (Sprint 1–4) — Câu lệnh liên quan

### Sprint 1 — Microsoft OneDrive (đã xong)
```bash
# Sau khi set AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID trong .env:
# Kết nối tại: http://localhost:3003/settings → "Kết nối Microsoft 365"
# Callback URL phải khớp Azure App Registration:
#   http://localhost:3003/api/auth/microsoft/callback
```

### Sprint 2 — Workflow Approval (đã xong)
```bash
# Không cần setup thêm — workflow tự trigger khi tạo Leave request
# Xem pending approvals: http://localhost:3003/approvals
# Quản lý template (manager): http://localhost:3003/workflows
```

### Sprint 3 — Inventory (đã xong)
```bash
# Xem kho: http://localhost:3003/inventory
# Dashboard hiển thị low-stock widget tự động
```

### Sprint 4A — Message Hub (đã xong)

**Cài đặt kênh tại** http://localhost:3003/settings → "Tích hợp kênh nhắn tin"

```bash
# Webhook URLs cần đăng ký với từng nền tảng:
# Teams:  POST http://localhost:3003/api/webhooks/teams
# Zalo:   POST http://localhost:3003/api/webhooks/zalo
#         GET  http://localhost:3003/api/webhooks/zalo  (URL verification)
# Email:  POST http://localhost:3003/api/webhooks/email (Graph change notification)
#         GET  http://localhost:3003/api/webhooks/email?validationToken=... (subscription handshake)

# Sau khi webhook nhận tin → xem tại: http://localhost:3003/messages
# Nút Reply (↩) hiện khi message đến từ Teams/Zalo/Email
```

### Sync schema sau khi kéo code mới (bắt buộc mỗi khi schema thay đổi)
```bash
# Từ macOS terminal — không chạy trong Docker
cd /Users/lan.dt1/Desktop/LanIT/workspace/hr-system/hr-systems
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma db push

# Nếu gặp "already in sync" nhưng thực ra schema đã đổi → force reset (XOÁ DATA):
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma db push --force-reset
# Sau đó seed lại:
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npm run db:seed
```

### Kiểm tra DB trực tiếp
```bash
# Inspect bảng từ macOS terminal
psql -U lan.dt1 -d hr_system -h localhost -c "\dt"

# Hoặc dùng Prisma Studio
DATABASE_URL="postgresql://lan.dt1@localhost:5432/hr_system" npx prisma studio
# → http://localhost:5555
```

### Khởi động lại dev server nếu bị lỗi webpack
```bash
cd /Users/lan.dt1/Desktop/LanIT/workspace/hr-system/hr-systems
rm -rf .next
npm run dev
```



Vào console.cloud.google.com, tạo project → bật Google Drive API → tạo API key → điền vào .env:


GOOGLE_API_KEY="AIza..."
Video trên Drive cần được share "Anyone with the link can view".

1. Tạo Clerk account (5 phút)
Vào https://clerk.com → đăng ký free account
Tạo application mới (chọn Next.js)
Bật Organizations trong Settings → Organizations
Copy 2 keys: CLERK_PUBLISHABLE_KEY và CLERK_SECRET_KEY


Vào Azure Portal → App Registration → lấy CLIENT_ID, CLIENT_SECRET, TENANT_ID điền vào .env
Thêm AZURE_REDIRECT_URI vào Redirect URIs trong Azure App Registration
Cấp quyền: Files.ReadWrite.All, Sites.ReadWrite.All, User.Read