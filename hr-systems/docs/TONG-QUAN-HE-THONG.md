# jobihome.vn — Tài liệu tổng quan hệ thống

## Tổng quan

**jobihome.vn** (tên nội bộ: `hr-system`) là một **SaaS HR & Team Management** được xây dựng cho startup và SME Việt Nam, nhắm đến các tech lead quản lý team từ 5–25 người. Sản phẩm gom toàn bộ vòng đời quản lý nhân sự — từ task, chấm công, tính lương đến đánh giá hiệu suất — vào một workspace duy nhất, thay thế Excel và các công cụ rời rạc.

---

## Mục đích & Bài toán giải quyết

| Bài toán | Giải pháp của hệ thống |
|---|---|
| Theo dõi task & tiến độ phân tán | Task management tích hợp, timer theo task |
| Chấm công thủ công bằng Excel | Office Time tracking + duyệt tự động |
| Tính lương mất nhiều công | Salary module, liên kết trực tiếp với time log |
| Không có dữ liệu để đánh giá nhân viên khách quan | Auto-KPI từ task + time log, tính điểm 5 tiêu chí |
| Không có audit trail | Audit log toàn bộ hành động (30 ngày – không giới hạn tùy plan) |

---

## Kiến trúc kỹ thuật

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Auth:** Clerk (multi-tenant, webhook sync)
- **Database:** PostgreSQL + Prisma ORM (với tenant isolation extension)
- **Hosting:** Vercel
- **Ngôn ngữ UI:** Tiếng Việt (i18n hỗ trợ vi/en)
- **Multi-tenancy:** Mỗi tổ chức (org) là một tenant riêng, dữ liệu hoàn toàn tách biệt

---

## Các module chức năng

### 1. Quản lý nhân sự (Employees)
Hồ sơ nhân viên, phòng ban, vai trò (role), kỹ năng (skills), career path. Hỗ trợ phân quyền: Owner / Manager / HR / Accountant / Member.

### 2. Task Management
Tạo và theo dõi task theo trạng thái (Cần làm / Đang làm / Done), ưu tiên, ước tính thời gian. Hỗ trợ task template và task review workflow.

### 3. Time Tracking
- **Time Logs:** Bấm giờ theo task (start/stop timer), lưu actual time
- **Office Time:** Chấm công vào/ra, auto-derive từ time log, manager duyệt
- **Work Rules:** Cấu hình quy tắc giờ làm của org

### 4. Đánh giá hiệu suất (Performance Reviews)
Chu kỳ review theo quý/năm với 3 nguồn điểm chạy song song:
- **Auto-KPI** — hệ thống tự tính từ data (5 tiêu chí: Tốc độ, Chất lượng, Đúng hạn, Học hỏi, Chủ động)
- **Self-review** — nhân viên tự đánh giá
- **Manager review** — điểm chính thức dùng cho quyết định lương/thăng chức

> Chi tiết công thức tính điểm: xem [DANH-GIA-HIEU-SUAT.md](./DANH-GIA-HIEU-SUAT.md)

### 5. Lương & Thanh toán (Salary & Payments)
Tính lương liên kết với time log và work rules. Quản lý lịch sử thanh toán lương cho từng nhân viên.

### 6. Leave Management
Quản lý đơn nghỉ phép (nhiều loại: phép năm, nghỉ ốm, nghỉ không lương...), duyệt và theo dõi số ngày còn lại.

### 7. Customers & Messages
Quản lý danh sách khách hàng, ghi nhận giao tiếp/messages với khách theo kênh (Zalo, Email...).

### 8. Summary & Báo cáo
Dashboard tổng hợp KPI, trend theo thời gian, AI-suggest KPI tiếp theo, capacity forecast theo skill.

### 9. Capacity Planning
Phân tích workload, dự báo năng lực nhóm, phân bổ theo skill — hỗ trợ lead ra quyết định tuyển dụng hoặc phân công.

### 10. Vault (Password Manager)
Lưu trữ mật khẩu/credentials của khách hàng dưới dạng mã hóa, gắn với từng khách hàng.

### 11. Admin & Audit
- Activity heatmap + page stats (theo dõi hoạt động user)
- Anomaly detection (phát hiện bất thường tự động)
- Audit log toàn bộ thao tác

---

## Hệ thống phân quyền

| Role | Phạm vi |
|---|---|
| **Super Admin** | Toàn quyền hệ thống, quản lý tất cả org |
| **Owner** | Chủ workspace, full quyền trong org |
| **Manager** | Quản lý team, duyệt leave/office-time, viết review |
| **HR** | Quản lý nhân sự, lương |
| **Accountant** | Quản lý thanh toán |
| **Member** | Nhân viên — xem thông tin cá nhân, bấm giờ |

---

## Gói dịch vụ (Pricing)

| Gói | Giá | Số thành viên | Đặc điểm nổi bật |
|---|---|---|---|
| **Solo** | Miễn phí | 1 | Tasks & time log cơ bản, audit 30 ngày |
| **Starter** ⭐ | 299.000đ/tháng | ≤ 10 | Phân quyền nâng cao, Office Time, Salary, Payments, audit 90 ngày |
| **Team** | 799.000đ/tháng | ≤ 25 | Anomaly detection, Activity heatmap, Vault, Audit không giới hạn, Priority support |

Dùng thử miễn phí **14 ngày** (không cần thẻ). Thanh toán qua chuyển khoản ngân hàng (Vietcombank).

---

## Tích hợp bên ngoài

| Dịch vụ | Mục đích |
|---|---|
| **Clerk** | Authentication & user management |
| **Google Drive API** | Lấy thông tin video từ link Drive |
| **Git webhook** | Tích hợp commit/PR vào activity log |
| **Vercel Cron** | Anomaly detection định kỳ, đóng session stale |

---

## Target users

Sản phẩm nhắm đến **tech lead / founder người Việt** đang quản lý team 5–20 người tại các startup hoặc công ty phần mềm nhỏ, muốn có một công cụ đủ chuyên nghiệp nhưng không phức tạp như SAP/Workday và phù hợp với quy trình Việt Nam.

---

## Tài liệu liên quan

- [DANH-GIA-HIEU-SUAT.md](./DANH-GIA-HIEU-SUAT.md) — Chi tiết công thức tính Auto-KPI và điểm Performance Review

---

*Cập nhật lần cuối: tháng 6/2026*
