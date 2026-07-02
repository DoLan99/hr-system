# PRD-12 — Tài liệu & Drive

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Documents / Drive Integration |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Tài liệu công ty (hợp đồng, quy trình, form HR, tài liệu dự án) đang được lưu rải rác: Google Drive cá nhân, email, ổ cứng local. Khi cần tài liệu → mất thời gian tìm; khi nhân viên nghỉ → tài liệu mất theo. Hệ thống cần một nơi tập trung để lưu và chia sẻ tài liệu, đồng thời tích hợp OneDrive (Microsoft 365) cho những workspace dùng hệ sinh thái Microsoft.

### 1.2 Mục tiêu sản phẩm (Goals)

- Upload và quản lý tài liệu nội bộ với phân quyền rõ ràng.
- Tích hợp OneDrive: browse, upload file từ OneDrive vào hệ thống.
- Gắn tài liệu vào task, nhân viên, phòng ban.
- Version history cho tài liệu quan trọng.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Upload file, folder structure, phân quyền xem/sửa, tích hợp OneDrive browse, gắn file vào entities, version history, search theo tên file.

**Ngoài phạm vi:** Co-editing real-time (Google Docs style) (v2), OCR full-text search (v2), eSign (xem PRD-13).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Lưu hợp đồng lao động, form HR, chính sách công ty; chia sẻ cho đúng người. | Upload nhanh, phân quyền theo role, không lo nhân viên xem lương nhau. | File rải rác → không kiểm soát được ai đang xem gì. |
| **Manager** | Lưu tài liệu dự án, tài liệu meeting; chia sẻ với team. | Tìm nhanh, gắn file vào task. | Gửi file qua chat/email → không tìm lại được; không có version history. |
| **Employee** | Xem tài liệu được chia sẻ, tải về form cần thiết. | Tìm và tải file dễ dàng. | Phải hỏi xin file thay vì tự tìm. |

### 2.2 User Journey

**HR Admin — Upload hợp đồng nhân viên:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /documents → Folder "Hợp đồng" → [Upload] | Chọn nơi lưu |
| 2 | Chọn file (PDF, Word...) → Upload | Lưu vào hệ thống |
| 3 | Gắn tag: nhân viên liên quan, năm ký | Dễ tìm sau này |
| 4 | Set quyền: chỉ HR Admin + nhân viên đó xem được | Bảo mật |
| 5 | Nhân viên nhận notification "Hợp đồng của bạn đã được tải lên" | Thông báo |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Upload file | Upload file lên hệ thống (tối đa 50MB/file); lưu trên S3/cloud storage | Must Have | 5 |
| FR-002 | Folder structure | Tạo, đổi tên, xóa folder; di chuyển file giữa folders | Must Have | 5 |
| FR-003 | Phân quyền file/folder | Set quyền: PUBLIC (toàn workspace) / DEPARTMENT / SPECIFIC_USERS / PRIVATE | Must Have | 8 |
| FR-004 | Gắn file vào entity | Gắn file vào: Task, Employee profile, Customer, Project | Must Have | 5 |
| FR-005 | Tích hợp OneDrive | Browse OneDrive của user, import file từ OneDrive vào hệ thống | Should Have | 13 |
| FR-006 | Version history | Mỗi lần upload file cùng tên → tạo version mới; xem và restore version cũ | Should Have | 8 |
| FR-007 | Tìm kiếm tài liệu | Search theo tên file, tag, người upload | Must Have | 5 |
| FR-008 | Preview file | Preview inline: PDF, ảnh (JPG/PNG), Office files (qua OneDrive viewer) | Should Have | 8 |
| FR-009 | Download | Tải file về | Must Have | 2 |
| FR-010 | Xóa và khôi phục | Xóa file → vào Trash; khôi phục trong 30 ngày | Should Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn upload file lên folder và set quyền chỉ cho nhân viên cụ thể xem, để bảo mật tài liệu nhạy cảm. | AC1: Chọn file (≤ 50MB) → upload → xuất hiện trong folder với metadata: tên, size, người upload, thời gian. AC2: Set quyền: PUBLIC / DEPARTMENT (chọn phòng ban) / SPECIFIC_USERS (tìm tên) / PRIVATE (chỉ mình). AC3: Người không có quyền → không thấy file trong danh sách. | High |
| US-002 | Là Manager, tôi muốn gắn file tài liệu vào task, để team có thể xem tài liệu liên quan ngay trên task. | AC1: Task detail → Tab "Files" → [Gắn file] → browse từ Documents hoặc upload mới. AC2: File đã gắn hiển thị trong task: tên, preview thumbnail, nút download. AC3: Xóa gắn kết file khỏi task không xóa file gốc. | High |
| US-003 | Là HR Admin, tôi muốn tích hợp OneDrive của công ty để import file từ đó, vì toàn bộ tài liệu công ty đang ở OneDrive. | AC1: Settings → Connect OneDrive → OAuth flow với Microsoft. AC2: Sau connect: browse folder OneDrive ngay trong /documents. AC3: [Import vào hệ thống] → tải file từ OneDrive về lưu trên hệ thống (không chỉ link). AC4: Token OneDrive mã hoá AES-256 khi lưu DB. | High |
| US-004 | Là HR Admin, tôi muốn xem version history của tài liệu, để khôi phục phiên bản cũ nếu cần. | AC1: Upload file cùng tên vào cùng folder → tạo version mới (v2, v3...). AC2: Click "Version history" → list versions: số version, ngày, người upload, kích thước. AC3: [Restore version X] → version X trở thành current; version cũ vẫn lưu. | Medium |
| US-005 | Là Employee, tôi muốn tìm file theo tên mà không cần nhớ folder, để tiết kiệm thời gian. | AC1: Search bar → gõ tên → filter real-time theo tên file + tag. AC2: Kết quả chỉ hiển thị file mình có quyền xem. AC3: Click kết quả → navigate đến file trong folder. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Security | File phải qua phân quyền trước khi download | URL expiry | Presigned URL hết hạn sau 15 phút |
| Performance | Upload file lớn | Upload 50MB | < 30 giây (LTE) |
| Storage | Giới hạn storage per workspace | Per plan | Xem PRD-19 Billing |
| Availability | File phải accessible | Uptime | 99.9% |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Upload file và set quyền**

```
/documents → Chọn folder → [Upload]
→ Drag & drop hoặc click chọn file (≤ 50MB)
→ Modal: Tên file | Tags | Quyền (dropdown: Public/Department/Users/Private)
→ POST /api/documents { folderId, file, permission }
→ File xuất hiện trong folder
```

**Luồng 2: Browse OneDrive**

```
/documents → [+ Từ OneDrive]
→ Nếu chưa connect: redirect OAuth Microsoft
→ Sau connect: Modal browse OneDrive folders/files
→ Chọn file → [Import] → Tải về S3 → Tạo Document record
```

**Luồng 3: Version history**

```
/documents/:id → [Version history]
→ List: v1 (02/01/2026, 2.5MB, by Lan) | v2 (15/03/2026, 2.7MB, by Lan)
→ [Restore v1] → POST /api/documents/:id/restore { versionId }
→ v1 trở thành current, tạo v3 (bản restore)
```

---

## 6. Business Rules

### BR-001 — Presigned URL cho download

File không được expose URL trực tiếp. Mỗi lần download → tạo presigned URL hết hạn sau 15 phút. Tránh link bị share ngoài phạm vi phân quyền.

### BR-002 — Kích thước file tối đa theo plan

```
Free plan: 10MB/file, 5GB tổng
Pro plan: 50MB/file, 100GB tổng
Enterprise: 200MB/file, unlimited
```

### BR-003 — Xóa file → Trash 30 ngày

Xóa file không xóa ngay. File vào Trash, giữ 30 ngày. Sau 30 ngày tự xóa vĩnh viễn. Admin có thể empty trash ngay lập tức.

### BR-004 — Version history tối đa 10 versions

Mỗi file giữ tối đa 10 versions. Khi thêm version 11 → version cũ nhất tự động bị xóa. Admin plan có thể tăng giới hạn.

### BR-005 — Token OneDrive mã hoá

Access token và refresh token của OneDrive được mã hoá AES-256 trước khi lưu DB. Không lưu plaintext credentials.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem file được chia sẻ với mình | ✅ | ✅ | ✅ | ✅ |
| Upload file vào folder của mình | ✅ | ✅ | ✅ | ✅ |
| Tạo/Xóa folder cá nhân | ✅ | ✅ | ✅ | ✅ |
| Tạo folder dùng chung | ❌ | ✅ | ✅ | ✅ |
| Set quyền file/folder | ✅ (file của mình) | ✅ | ✅ | ✅ |
| Xem tất cả file workspace | ❌ | ❌ | ✅ | ✅ |
| Xóa file của người khác | ❌ | ❌ | ✅ | ✅ |
| Connect OneDrive | ✅ (cá nhân) | ✅ | ✅ | ✅ |
| Xem version history | ✅ (file có quyền) | ✅ | ✅ | ✅ |
| Restore version | ✅ (file của mình) | ✅ | ✅ | ✅ |
