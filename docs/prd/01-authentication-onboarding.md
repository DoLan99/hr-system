# PRD-01 — Authentication & Onboarding

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Authentication & Onboarding |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, DevOps, IT Admin |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Jobihome là nền tảng SaaS multi-tenant phục vụ quản trị nhân sự và công việc. Để đảm bảo mỗi doanh nghiệp có không gian làm việc độc lập, bảo mật và dễ triển khai, hệ thống cần một luồng đăng ký — đăng nhập — thiết lập workspace rõ ràng, không đòi hỏi kiến thức kỹ thuật từ phía người dùng.

Thực tế hiện tại: nhiều doanh nghiệp vừa và nhỏ vẫn quản lý nhân sự trên Excel, chưa có hệ thống tập trung. Bước đầu tiên khi đến với Jobihome là onboarding — nếu luồng này phức tạp hoặc lỗi thì toàn bộ trải nghiệm sản phẩm bị ảnh hưởng ngay từ đầu.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**
- Giảm thời gian từ lúc đăng ký đến lúc vào được dashboard xuống dưới 3 phút.
- Tỷ lệ hoàn thành onboarding > 90% (không bỏ dở giữa chừng).
- Hỗ trợ đăng nhập qua Microsoft để tăng adoption ở doanh nghiệp dùng Microsoft 365.

**Mục tiêu người dùng:**
- Admin có thể thiết lập workspace mà không cần hỗ trợ kỹ thuật.
- Nhân viên được mời tham gia mà không cần tự tạo tài khoản riêng.
- Tất cả người dùng có thể đăng nhập nhanh, an toàn, không gặp lỗi.

### 1.3 Phạm vi (Scope)

**Trong phạm vi (In Scope):**
- Đăng ký tài khoản mới (email hoặc Google OAuth qua Clerk)
- Luồng onboarding tạo workspace lần đầu
- Đăng nhập / đăng xuất
- Kết nối Microsoft (SSO + OneDrive/Teams integration)
- Mời nhân viên tham gia workspace qua email
- Webhook đồng bộ user từ Clerk

**Ngoài phạm vi (Out of Scope):**
- Multi-workspace (1 user thuộc nhiều workspace) — để backlog v2
- 2FA / MFA nâng cao (Clerk hỗ trợ, nhưng chưa expose config trong app)
- SSO SAML Enterprise

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Admin / Người sáng lập** | Người đại diện doanh nghiệp đăng ký dùng Jobihome, thường là HR Manager hoặc CEO công ty nhỏ. Không nhất thiết có nền tảng kỹ thuật. | Đăng ký nhanh, thiết lập tên công ty, mời nhân viên vào. | Sợ quy trình phức tạp, không biết làm gì sau khi đăng ký xong. |
| **Nhân viên được mời** | Nhận email mời, cần tạo tài khoản và vào workspace của công ty. | Click link mời → vào được app ngay, không cần điền nhiều form. | Link mời hết hạn, không biết tài khoản đã tồn tại hay chưa. |
| **IT Admin doanh nghiệp** | Quản trị viên IT có thể muốn kết nối Microsoft 365 (Teams, OneDrive) cho toàn công ty. | Kết nối Microsoft OAuth 1 lần, tích hợp chạy tự động. | Không rõ quyền nào cần grant, lo ngại bảo mật. |

### 2.2 User Journey

**Admin — Đăng ký lần đầu:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Truy cập trang chủ → Click "Dùng thử miễn phí" | Đến trang đăng ký |
| 2 | Điền email + mật khẩu hoặc đăng nhập Google | Tạo tài khoản Clerk |
| 3 | Xác nhận email (nếu cần) | Xác thực email |
| 4 | Điền thông tin tổ chức (tên công ty, quy mô, ngành nghề) | Tạo workspace |
| 5 | Hoàn thành onboarding → Vào /welcome | Bắt đầu dùng sản phẩm |
| 6 | Mời nhân viên qua email | Mở rộng workspace |

**Nhân viên — Nhận lời mời:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận email mời từ hệ thống | Biết được lời mời |
| 2 | Click link mời | Đến trang Clerk |
| 3 | Tạo tài khoản hoặc đăng nhập nếu đã có | Tạo/liên kết tài khoản |
| 4 | Được redirect vào dashboard workspace | Bắt đầu làm việc |

**IT Admin — Kết nối Microsoft:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào Settings → Integrations | Tìm mục Microsoft |
| 2 | Click "Kết nối Microsoft 365" | Khởi động OAuth |
| 3 | Đăng nhập Microsoft, grant permissions | Cấp quyền |
| 4 | Callback thành công → Hiển thị "Connected" | Tích hợp hoàn tất |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Đăng ký tài khoản | Email/password hoặc Google OAuth qua Clerk | Must Have | 3 |
| FR-002 | Đăng nhập / Đăng xuất | Session qua Clerk JWT | Must Have | 2 |
| FR-003 | Onboarding tạo workspace | Form điền tên công ty, quy mô, ngành; tạo Workspace record | Must Have | 5 |
| FR-004 | Webhook đồng bộ user từ Clerk | POST /api/webhooks/clerk xử lý user.created, user.updated | Must Have | 3 |
| FR-005 | Mời nhân viên qua email | Clerk Invitations; nhân viên click link → join workspace | Must Have | 5 |
| FR-006 | Kết nối Microsoft (OAuth) | OAuth 2.0 với Microsoft Identity Platform; lưu token | Should Have | 8 |
| FR-007 | Ngắt kết nối Microsoft | Xóa token, revoke permissions | Should Have | 2 |
| FR-008 | Kiểm tra trạng thái onboarding | Redirect về /onboarding nếu chưa hoàn thành | Must Have | 2 |
| FR-009 | Màn hình Welcome | Hướng dẫn bước đầu sau khi setup xong | Should Have | 2 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Admin mới, tôi muốn đăng ký bằng email/Google, để tạo tài khoản mà không cần nhớ thêm mật khẩu phức tạp. | AC1: Form đăng ký hiển thị ô email + password và nút "Đăng nhập bằng Google". AC2: Sau khi đăng ký thành công → redirect sang /onboarding. AC3: Email đã tồn tại → hiển thị lỗi "Email đã được sử dụng". | High |
| US-002 | Là Admin mới, tôi muốn điền thông tin công ty và tạo workspace, để hệ thống biết tôi đại diện cho tổ chức nào. | AC1: Form gồm: tên công ty (bắt buộc), quy mô (dropdown), ngành nghề (dropdown), múi giờ. AC2: Submit thành công → tạo Workspace record, Admin được gán role ADMIN. AC3: Redirect sang /welcome sau khi hoàn thành. | High |
| US-003 | Là Admin, tôi muốn mời nhân viên bằng email, để họ có thể tham gia workspace mà không cần tự đăng ký. | AC1: Admin nhập email → hệ thống gửi email mời qua Clerk. AC2: Nhân viên click link → tạo tài khoản → tự động join workspace. AC3: Employee record được tạo với email tương ứng. AC4: Link mời hết hạn sau 7 ngày — hiển thị thông báo rõ ràng. | High |
| US-004 | Là người dùng, tôi muốn đăng nhập nhanh, để không mất thời gian mỗi lần vào app. | AC1: Trang /sign-in hiển thị trong < 2 giây. AC2: Đăng nhập thành công → redirect sang /dashboard. AC3: Sai mật khẩu → hiển thị lỗi sau mỗi lần thử, khóa sau 5 lần sai. | High |
| US-005 | Là IT Admin, tôi muốn kết nối Microsoft 365, để nhân viên có thể dùng Teams notifications và OneDrive storage trong Jobihome. | AC1: Nút "Kết nối Microsoft 365" trong Settings → redirect OAuth Microsoft. AC2: Sau khi grant permissions → trạng thái chuyển "Connected". AC3: Token được lưu mã hóa trong DB. AC4: Khi token hết hạn → tự động refresh không yêu cầu đăng nhập lại. | Medium |
| US-006 | Là người dùng chưa hoàn thành onboarding, tôi muốn được nhắc nhở, để không bị mắc kẹt mà không biết phải làm gì. | AC1: Mọi request vào dashboard khi chưa có workspace → redirect về /onboarding. AC2: Trang onboarding hiển thị progress indicator (bước 1/2, 2/2). AC3: Không thể bỏ qua bước onboarding. | High |
| US-007 | Là Admin, tôi muốn ngắt kết nối Microsoft, để thu hồi quyền truy cập khi cần thay đổi tài khoản. | AC1: Nút "Ngắt kết nối" trong Settings. AC2: Sau khi ngắt → xóa token khỏi DB, trạng thái chuyển "Not connected". AC3: Các tính năng Drive/Teams bị vô hiệu hóa cho đến khi kết nối lại. | Medium |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Performance | Trang /sign-in và /sign-up tải nhanh. | < 2 giây first contentful paint. |
| Security | Session được quản lý bởi Clerk (JWT); webhook xác minh bằng Svix signature; Microsoft token mã hóa AES-256 trước khi lưu DB. | 100% webhook request được verify signature trước khi xử lý. HTTPS bắt buộc. |
| Reliability | Webhook Clerk thất bại phải được retry. | Retry tối đa 3 lần với exponential backoff. Clerk tự quản lý retry. |
| Usability | Người dùng không có nền tảng kỹ thuật hoàn thành onboarding không cần hỗ trợ. | Onboarding < 3 phút; tỷ lệ hoàn thành > 90%. |
| Availability | Auth service không bị downtime trong giờ làm việc. | Phụ thuộc SLA của Clerk (99.99%). |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình (Screen Flow)

**Luồng 1: Đăng ký & Onboarding lần đầu**

```
/ (landing page)
→ /sign-up (Clerk hosted UI)
→ [Clerk xác thực] → Webhook /api/webhooks/clerk → Tạo Employee
→ /onboarding (Bước 1: Tên công ty, ngành, quy mô, múi giờ)
→ /onboarding (Bước 2: Xác nhận thông tin)
→ [Tạo Workspace, gán Admin]
→ /welcome (màn hình chào + shortcuts)
→ /dashboard
```

**Luồng 2: Đăng nhập thông thường**

```
/sign-in (Clerk hosted UI)
→ [Có workspace] → /dashboard
→ [Chưa có workspace] → /onboarding
```

**Luồng 3: Nhân viên nhận lời mời**

```
Email mời → Click link invitation
→ /sign-up (Clerk, pre-filled email)
→ [Tạo tài khoản] → Webhook clerk → Liên kết Employee record
→ /dashboard (không qua onboarding)
```

**Luồng 4: Kết nối Microsoft**

```
/settings → Tab "Integrations"
→ Click "Kết nối Microsoft 365"
→ GET /api/auth/microsoft → Redirect Microsoft OAuth
→ User đăng nhập Microsoft + grant permissions
→ GET /api/auth/microsoft/callback
→ Lưu token → Redirect /settings → "Connected ✓"
```

### 5.2 Màn hình chính

| Route | Màn hình | Mô tả |
|---|---|---|
| `/sign-in` | Đăng nhập | Clerk hosted UI |
| `/sign-up` | Đăng ký | Clerk hosted UI |
| `/onboarding` | Thiết lập workspace | Multi-step form |
| `/welcome` | Chào mừng | Checklist bắt đầu nhanh |

---

## 6. Business Rules

### BR-001 — Email là định danh duy nhất

Mỗi email chỉ được tạo 1 tài khoản Clerk trên toàn hệ thống. Không thể có 2 tài khoản cùng email dù khác workspace.

### BR-002 — Workspace bắt buộc trước khi vào dashboard

Người dùng chưa có workspace (chưa hoàn thành onboarding) bị redirect về `/onboarding` khi truy cập bất kỳ route dashboard nào. Middleware kiểm tra server-side.

### BR-003 — Nhân viên được mời không qua onboarding

Người nhận lời mời sau khi tạo tài khoản được gán vào workspace của người mời và redirect thẳng vào `/dashboard` — không cần điền thông tin tổ chức (đã có workspace sẵn).

### BR-004 — Webhook Clerk phải idempotent

Hệ thống có thể nhận webhook `user.created` nhiều lần (do Clerk retry). Phải kiểm tra `clerkUserId` đã tồn tại trước khi tạo Employee mới.

### BR-005 — Microsoft token bảo mật

`access_token` và `refresh_token` từ Microsoft được mã hóa AES-256 trước khi lưu vào DB. Key mã hóa lưu trong biến môi trường `MICROSOFT_TOKEN_KEY`, không lưu trong DB.

### BR-006 — Auto-refresh Microsoft token

Khi token hết hạn (< 5 phút còn lại), hệ thống tự động gọi refresh endpoint của Microsoft trước khi gọi Graph API. Không yêu cầu user đăng nhập lại.

### BR-007 — Thứ tự onboarding bắt buộc

Người dùng không thể bỏ qua bước onboarding để vào dashboard. Nếu đóng tab giữa chừng, lần sau vào lại tiếp tục từ bước chưa hoàn thành.

---

## 7. Phân quyền

| Hành động | Guest (chưa đăng nhập) | Employee | Admin |
|---|---|---|---|
| Truy cập /sign-in, /sign-up | ✅ | Redirect /dashboard | Redirect /dashboard |
| Hoàn thành onboarding | ✅ (chỉ người tạo workspace) | ❌ | ✅ |
| Mời nhân viên | ❌ | ❌ | ✅ |
| Kết nối Microsoft | ❌ | ❌ | ✅ |
| Ngắt kết nối Microsoft | ❌ | ❌ | ✅ |
| Xem thông tin tài khoản cá nhân | ❌ | ✅ | ✅ |

---

## 8. API Endpoints

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/webhooks/clerk` | Svix signature | Nhận event user.created / user.updated từ Clerk |
| GET | `/api/auth/microsoft` | Session | Khởi động OAuth flow với Microsoft |
| GET | `/api/auth/microsoft/callback` | OAuth state | Callback sau xác thực Microsoft, lưu token |

---

## 9. Điều kiện lỗi & Xử lý

| Tình huống | Xử lý |
|---|---|
| Email đã tồn tại | Clerk trả lỗi → hiển thị "Email đã được sử dụng, hãy đăng nhập" |
| Link mời hết hạn (> 7 ngày) | Hiển thị trang "Link không hợp lệ hoặc đã hết hạn", nút "Liên hệ Admin" |
| Microsoft OAuth thất bại / user hủy | Redirect về /settings với thông báo "Kết nối không thành công" |
| Webhook Clerk lỗi | Log lỗi vào hệ thống; Clerk tự retry; không block user |
| Onboarding gửi form thiếu trường bắt buộc | Highlight trường bị thiếu, không cho submit |
