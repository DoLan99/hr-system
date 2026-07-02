# PRD-13 — Vault — Kho bí mật & eSign

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Vault / Secrets / eSign |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Admin, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Công ty có nhiều loại thông tin bí mật cần lưu trữ an toàn: mật khẩu hệ thống, API keys, credentials server, thông tin tài khoản ngân hàng... Hiện tại lưu trong file Excel không mã hoá hoặc chia sẻ qua chat — cực kỳ rủi ro. Ngoài ra, hợp đồng và tài liệu pháp lý cần chữ ký điện tử có giá trị pháp lý.

### 1.2 Mục tiêu sản phẩm (Goals)

- Lưu trữ secrets (credentials, API keys, passwords) được mã hoá AES-256 end-to-end.
- Phân quyền chi tiết: ai được xem secret nào.
- Audit log đầy đủ cho mọi lần truy cập vault.
- eSign: gửi tài liệu để ký điện tử, theo dõi trạng thái ký.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD secrets với mã hoá, phân quyền access, audit log truy cập, eSign workflow (gửi → ký → lưu).

**Ngoài phạm vi:** Hardware Security Module (HSM) (enterprise v2), tích hợp HashiCorp Vault (v2), eSign với CA certificate được công nhận pháp lý Việt Nam (v2 cần đối tác).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Admin / IT Admin** | Lưu và quản lý credentials hệ thống; cấp quyền truy cập cho team. | Mã hoá mạnh, biết ai đã xem secret nào, thu hồi quyền nhanh. | Hiện lưu Excel không mã hoá, share qua Slack → rủi ro rò rỉ cao. |
| **HR Admin** | Lưu thông tin ngân hàng, tài khoản công ty; gửi hợp đồng eSign cho nhân viên mới. | eSign đơn giản, không cần phần mềm bên ngoài. | Phải in ra, ký tay, scan lại → chậm, không có bản gốc dễ xác minh. |
| **Employee** | Ký hợp đồng điện tử. | Nhận notification, xem tài liệu, ký trong app. | Phải đến văn phòng ký tay hoặc dùng app thứ 3 không quen. |

### 2.2 User Journey

**Admin — Lưu secret mới:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /vault → [+ Thêm secret] | Truy cập vault |
| 2 | Nhập: Tên, Giá trị (bị mask), Category, Ghi chú | Tạo secret |
| 3 | Set quyền: chỉ Admin + DevOps team xem được | Phân quyền |
| 4 | Hệ thống mã hoá AES-256 trước khi lưu DB | Bảo mật |

**HR Admin — eSign hợp đồng:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Upload hợp đồng PDF vào eSign | Chuẩn bị tài liệu |
| 2 | Thêm người ký: nhân viên, chọn vị trí ký trên PDF | Cấu hình ký |
| 3 | Gửi → Nhân viên nhận email/notification | Thông báo |
| 4 | Nhân viên review tài liệu → [Ký] | Ký điện tử |
| 5 | Sau tất cả đã ký → Tài liệu finalized, lưu với timestamp | Lưu trữ |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Secrets | Tạo, xem (decrypt), sửa, xóa secrets; mã hoá AES-256 at rest | Must Have | 8 |
| FR-002 | Danh mục secret | Categories: Database, API Key, SSH, Banking, Other | Must Have | 2 |
| FR-003 | Phân quyền secret | Set quyền xem/edit per secret: user cụ thể hoặc role | Must Have | 8 |
| FR-004 | Audit log vault | Ghi log mỗi lần xem secret: ai, khi nào, IP | Must Have | 5 |
| FR-005 | Mask/reveal | Secret value bị mask (***) mặc định; click Reveal để xem plaintext | Must Have | 3 |
| FR-006 | eSign: Upload và gửi | Upload PDF → chỉ định người ký → gửi | Should Have | 13 |
| FR-007 | eSign: Ký điện tử | Người ký xem PDF trong browser → ký (vẽ hoặc typed signature) → submit | Should Have | 13 |
| FR-008 | eSign: Tracking | Xem trạng thái ký của từng người: PENDING/SIGNED/DECLINED | Should Have | 5 |
| FR-009 | eSign: Finalize | Khi tất cả ký → PDF finalized với chữ ký nhúng + timestamp | Should Have | 8 |
| FR-010 | Secret rotation reminder | Nhắc nhở khi secret chưa được rotate > 90 ngày | Nice to Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Admin, tôi muốn lưu API keys vào vault với mã hoá mạnh, để không ai có thể đọc plaintext từ DB dù có quyền DB. | AC1: Nhập secret: Tên*, Category, Value* (input type=password), Ghi chú. AC2: Value được mã hoá AES-256 trước khi INSERT vào DB. AC3: Chỉ decrypt khi user có quyền click [Reveal]. AC4: Mỗi lần Reveal → ghi audit log: userId, secretId, timestamp, IP. | High |
| US-002 | Là Admin, tôi muốn chỉ cho phép những người nhất định xem secret, để ngăn nhân viên không liên quan truy cập. | AC1: Tạo/sửa secret → Tab "Quyền truy cập" → Thêm user hoặc role. AC2: User không được phân quyền → không thấy secret trong danh sách (hidden hoàn toàn). AC3: Thu hồi quyền ngay lập tức (không cần logout). | High |
| US-003 | Là HR Admin, tôi muốn gửi hợp đồng PDF cho nhân viên ký điện tử, để không cần gặp mặt hoặc dùng phần mềm bên ngoài. | AC1: Upload PDF (≤ 20MB). AC2: Thêm người ký: tìm tên nhân viên, chọn thứ tự ký (sequential) hoặc song song (parallel). AC3: Gửi → mỗi người ký nhận email + in-app notification với link xem tài liệu. AC4: Link có thời hạn 30 ngày. | Medium |
| US-004 | Là Employee, tôi muốn ký hợp đồng điện tử ngay trong app, để không cần cài phần mềm khác. | AC1: Nhận notification → click vào link. AC2: Xem PDF inline trong browser (không cần download). AC3: [Ký] → vẽ chữ ký hoặc nhập tên (typed signature). AC4: Xác nhận → hệ thống ghi timestamp + metadata ký (userId, IP, device). AC5: Nhận email xác nhận đã ký kèm bản PDF. | Medium |
| US-005 | Là HR Admin, tôi muốn theo dõi trạng thái ký của từng người, để biết ai chưa ký và nhắc nhở. | AC1: Dashboard eSign: danh sách tài liệu đang chờ ký. AC2: Chi tiết: Người ký | Trạng thái (PENDING/SIGNED/DECLINED) | Ngày ký. AC3: [Nhắc nhở] → gửi email reminder cho người chưa ký. AC4: Nếu DECLINED: người ký phải ghi lý do; HR Admin nhận notification. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Security | Mã hoá AES-256 cho tất cả secret values | Coverage | 100% |
| Audit | Mọi lần reveal secret có audit log | Coverage | 100% |
| Availability | Vault phải luôn accessible | Uptime | 99.9% |
| Performance | Decrypt và reveal secret | Response time | < 500ms |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Reveal Secret**

```
/vault → Danh sách secrets (value bị mask "••••••••")
→ Click secret → [👁 Reveal]
→ Confirm popup: "Hành động này sẽ được ghi log"
→ [Confirm] → GET /api/vault/:id/reveal
→ Giải mã phía server → trả về plaintext (chỉ trong response, không lưu)
→ Hiện plaintext 30 giây rồi tự mask lại
→ Audit log: { userId, secretId, action: "REVEAL", ip, timestamp }
```

**Luồng 2: eSign Workflow**

```
/vault/esign → [+ Gửi tài liệu ký]
→ Upload PDF → Chỉ định người ký (thứ tự)
→ [Gửi] → POST /api/esign/documents
→ Email + notification đến người ký đầu tiên
→ Người ký: xem PDF → [Ký] → vẽ/typed signature → Submit
→ Nếu sequential: sau khi người 1 ký → gửi tiếp cho người 2
→ Tất cả ký → [Finalize] → PDF nhúng chữ ký → lưu → notify tất cả
```

---

## 6. Business Rules

### BR-001 — Mã hoá AES-256 end-to-end

Secret value phải được mã hoá bằng AES-256-GCM trước khi INSERT vào DB. Khoá mã hoá được lưu riêng (không cùng DB), xoay định kỳ. Không bao giờ log plaintext value.

### BR-002 — Reveal secret phải xác nhận và ghi log

Mọi hành động reveal secret phải: (1) hiện confirm dialog, (2) ghi audit log đầy đủ. Audit log không thể xóa bởi bất kỳ user nào (immutable).

### BR-003 — eSign sequential vs parallel

Sequential: người ký theo thứ tự đã set — người sau chỉ nhận notification khi người trước đã ký. Parallel: tất cả nhận notification cùng lúc, không phụ thuộc nhau. Sau khi tất cả ký → finalize.

### BR-004 — PDF finalized không thể sửa

Sau khi eSign document được finalized → PDF được hash (SHA-256) và lưu hash. Bất kỳ sửa đổi nào sau đó → hash không khớp → tài liệu bị đánh dấu TAMPERED.

### BR-005 — Secret rotation reminder

Secret chưa được cập nhật trong 90 ngày → hệ thống gửi notification cho owner: "Secret [tên] chưa được rotate 90 ngày. Cân nhắc cập nhật."

### BR-006 — Người không có quyền không thấy secret tồn tại

Khác với "không xem được giá trị" — người không có quyền hoàn toàn không thấy secret trong danh sách. Tránh information leakage về tên/sự tồn tại của secret.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem danh sách secrets của mình | ✅ (được share) | ✅ (được share) | ✅ (được share) | ✅ |
| Tạo secret | ❌ | ❌ | ✅ | ✅ |
| Reveal secret (có quyền) | ✅ | ✅ | ✅ | ✅ |
| Sửa / Xóa secret | ❌ | ❌ | ✅ (của mình) | ✅ |
| Quản lý quyền secret | ❌ | ❌ | ✅ (của mình) | ✅ |
| Xem vault audit log | ❌ | ❌ | ❌ | ✅ |
| Gửi tài liệu eSign | ❌ | ✅ | ✅ | ✅ |
| Ký tài liệu eSign | ✅ (được mời) | ✅ | ✅ | ✅ |
| Xem trạng thái eSign | ❌ | ✅ (gửi từ mình) | ✅ | ✅ |
