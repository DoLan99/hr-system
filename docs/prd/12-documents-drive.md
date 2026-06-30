# PRD-12: Tài liệu & Drive (Documents / Drive Integration)

**Module:** Documents / Drive  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp hệ thống quản lý tài liệu nội bộ với phân quyền truy cập. Tích hợp Google Drive / Microsoft OneDrive để lưu trữ và chia sẻ file, xem video trực tiếp trong hệ thống.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD tài liệu, phân quyền, kết nối Drive |
| Manager | Upload, chia sẻ tài liệu với team |
| Employee | Xem tài liệu được phân quyền, upload tài liệu cá nhân |

---

## 3. Luồng chức năng

### 3.1 Quản lý tài liệu nội bộ

```
Admin / User vào /documents
    → "Tạo tài liệu"
    → POST /api/documents
        {
          title: "Quy trình onboarding nhân viên mới",
          content: "...",  (rich text hoặc markdown)
          type: "POLICY" | "PROCEDURE" | "GUIDE" | "FORM" | "OTHER",
          visibility: "PUBLIC" | "DEPARTMENT" | "TEAM" | "PRIVATE",
          departmentIds: [...],  (nếu visibility = DEPARTMENT)
          tags: [...]
        }
    → Xem danh sách: GET /api/documents
    → Tìm kiếm theo title / tag / type
    → Chi tiết: GET /api/documents/[id]
    → Cập nhật: PUT /api/documents/[id]
    → Xóa: DELETE /api/documents/[id]
```

### 3.2 Kết nối Google Drive / OneDrive

```
Admin vào Settings → Drive Integration
    → Chọn: Google Drive hoặc Microsoft OneDrive
    → GET /api/drive/status → Xem trạng thái kết nối
    → Nếu chưa kết nối:
        - Google: OAuth 2.0 redirect
        - Microsoft: Dùng token từ Microsoft SSO (PRD-01)
    → Sau khi kết nối: lưu access token + refresh token
    → Ngắt kết nối: POST /api/drive/disconnect
```

### 3.3 Duyệt File & Folder trên Drive

```
User vào /documents → Tab "Drive"
    → GET /api/drive/folders → Xem cây thư mục
    → GET /api/drive/files?folderId=... → Xem files trong folder
    → Tìm kiếm: GET /api/drive/search?q=keyword
    → Xem chi tiết file: GET /api/drive/files/[id]
```

### 3.4 Upload File

```
User click "Upload"
    → Chọn file từ máy tính
    → POST /api/drive/upload (multipart/form-data)
        { file, folderId, fileName }
    → File được upload lên Drive (Google hoặc OneDrive)
    → Tạo Document record với driveFileId
    → Hiển thị file trong danh sách
```

### 3.5 Chia sẻ File

```
User chọn file → "Chia sẻ"
    → POST /api/drive/share
        { fileId, shareWith: [email...], permission: "VIEW" | "EDIT" }
    → Gọi Drive API để set sharing permissions
    → Gửi thông báo email đến người được chia sẻ
```

### 3.6 Xem Video trực tiếp

```
User click file video (mp4, mov, ...)
    → GET /api/drive/video-info?fileId=...
    → Trả về streaming URL (signed URL có expiry)
    → Phát video ngay trong browser (không cần download)
    → Hỗ trợ: Google Drive streaming, OneDrive streaming
```

### 3.7 Phân quyền tài liệu

```
visibility = "PUBLIC"     → Mọi nhân viên trong workspace xem được
visibility = "DEPARTMENT" → Chỉ nhân viên thuộc department được chỉ định
visibility = "TEAM"       → Chỉ thành viên team được chỉ định
visibility = "PRIVATE"    → Chỉ người tạo + Admin
```

---

## 4. API Endpoints

### Documents
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/documents` | Danh sách, tạo tài liệu |
| GET/PUT/DELETE | `/api/documents/[id]` | Chi tiết, cập nhật, xóa |

### Drive
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/drive/status` | Trạng thái kết nối Drive |
| POST | `/api/drive/disconnect` | Ngắt kết nối Drive |
| GET | `/api/drive/folders` | Danh sách thư mục |
| GET | `/api/drive/files` | Danh sách files (trong folder) |
| GET | `/api/drive/files/[id]` | Chi tiết file |
| DELETE | `/api/drive/files/[id]` | Xóa file trên Drive |
| GET | `/api/drive/search` | Tìm kiếm file |
| POST | `/api/drive/upload` | Upload file |
| POST | `/api/drive/share` | Chia sẻ file |
| GET | `/api/drive/video-info` | Lấy streaming URL cho video |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/documents` | Quản lý tài liệu + Drive browser |

---

## 6. Data Model (Document)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `title` | String | Tiêu đề |
| `content` | Text | Nội dung (rich text) |
| `type` | Enum | POLICY / PROCEDURE / GUIDE / FORM / OTHER |
| `visibility` | Enum | PUBLIC / DEPARTMENT / TEAM / PRIVATE |
| `driveFileId` | String | ID file trên Google Drive/OneDrive |
| `driveProvider` | Enum | GOOGLE / MICROSOFT |
| `fileUrl` | String | URL truy cập file |
| `tags` | String[] | Tags |
| `createdBy` | UUID | FK → Employee |
| `departmentIds` | UUID[] | Phòng ban có quyền xem |
| `teamIds` | UUID[] | Team có quyền xem |

---

## 7. Business Rules

- Khi token Drive hết hạn: auto refresh trước khi gọi API.
- File video > 100MB: dùng streaming URL, không download về server.
- Tài liệu xóa: soft delete, file trên Drive không bị xóa (chỉ unlink).
- Nếu Drive chưa kết nối: upload file tạm lên local storage.
- Signed URL cho video có expiry 1 giờ (auto regenerate khi cần).
