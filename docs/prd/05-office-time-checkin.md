# PRD-05 — Văn phòng & Giờ làm việc & Check-in

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Office / Work Schedule / Check-in |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Công ty có thể làm việc hybrid (một số ngày remote, một số ngày tại văn phòng) hoặc theo ca. HR cần:
- Định nghĩa lịch làm việc (giờ vào/ra, ngày làm việc trong tuần) cho từng văn phòng/nhóm.
- Nhân viên check-in khi đến văn phòng để ghi nhận chấm công thực tế.
- Manager xem trạng thái có mặt của team trong ngày.

Không có hệ thống → HR phải đối chiếu thủ công, không biết nhân viên đi muộn bao nhiêu lần.

### 1.2 Mục tiêu sản phẩm (Goals)

- Admin thiết lập danh sách văn phòng với vị trí địa lý và múi giờ.
- Admin định nghĩa lịch làm việc (WorkSchedule) gắn với workspace hoặc phòng ban.
- Nhân viên check-in/check-out qua app; hệ thống ghi nhận giờ thực tế.
- Tự động tính đi trễ, về sớm dựa trên lịch làm việc.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD văn phòng, CRUD lịch làm việc, check-in/out manual, tính đi trễ/về sớm, báo cáo check-in theo ngày.

**Ngoài phạm vi:** Check-in bằng GPS/geofence (v2), check-in bằng nhận diện khuôn mặt (v3), ca làm việc OT night (xem chamcong.prd.md).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Cấu hình văn phòng và lịch làm việc cho toàn công ty. | Thiết lập 1 lần, áp dụng cho tất cả. | Khi có văn phòng mới phải cập nhật thủ công nhiều hệ thống. |
| **Manager** | Theo dõi team check-in ngày hôm nay, ai đi muộn. | Xem real-time danh sách check-in của team. | Phải gọi điện hỏi từng người khi họ chưa thấy mặt ở office. |
| **Employee** | Check-in khi đến văn phòng, check-out khi về. | Thao tác nhanh (1-tap). | Quên check-in → bị tính vắng mặt oan. |

### 2.2 User Journey

**HR Admin — Thiết lập lịch làm việc:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào Settings → Offices → Tạo văn phòng | Khai báo địa điểm làm việc |
| 2 | Tạo WorkSchedule: ngày làm việc + giờ bắt đầu/kết thúc | Định nghĩa giờ chuẩn |
| 3 | Gán WorkSchedule cho workspace (mặc định) hoặc phòng ban cụ thể | Áp dụng lịch |
| 4 | Publish → Nhân viên xem được lịch của mình | Thông báo |

**Employee — Check-in hàng ngày:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Mở app → Màn hình Check-in | Bắt đầu ngày làm |
| 2 | Chọn văn phòng (nếu có nhiều) → [Check-in] | Ghi nhận có mặt |
| 3 | Hệ thống tính thời gian so với giờ bắt đầu quy định | Xác định đi muộn/đúng giờ |
| 4 | Cuối ngày → [Check-out] | Ghi nhận giờ về |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Văn phòng | Tạo, sửa, xóa văn phòng (tên, địa chỉ, múi giờ, toạ độ) | Must Have | 3 |
| FR-002 | CRUD Lịch làm việc | Tạo WorkSchedule: ngày trong tuần + giờ bắt đầu/kết thúc + grace period | Must Have | 5 |
| FR-003 | Gán lịch làm việc | Gán lịch cho workspace (mặc định) hoặc override theo phòng ban | Must Have | 3 |
| FR-004 | Check-in / Check-out | Nhân viên check-in khi đến, check-out khi về | Must Have | 5 |
| FR-005 | Tính trạng thái chấm công | Tự động phân loại: ĐÚNG GIỜ / ĐI MUỘN / VỀ SỚM / VẮNG MẶT dựa trên lịch | Must Have | 8 |
| FR-006 | Bảng check-in hôm nay | Manager xem danh sách check-in của team trong ngày, real-time | Should Have | 5 |
| FR-007 | Lịch sử chấm công cá nhân | Nhân viên xem lịch sử check-in/out của bản thân | Must Have | 3 |
| FR-008 | Báo cáo chấm công tháng | HR xem tổng hợp: đúng giờ/muộn/vắng theo phòng ban | Should Have | 5 |
| FR-009 | Yêu cầu chỉnh sửa chấm công | Nhân viên gửi yêu cầu sửa khi quên check-in; Manager duyệt | Should Have | 8 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo văn phòng với múi giờ riêng, để hệ thống tính giờ chính xác cho nhân viên ở các địa điểm khác nhau. | AC1: Tạo văn phòng: Tên*, Địa chỉ, Múi giờ (IANA tz), Toạ độ (lat/lng tuỳ chọn). AC2: Workspace có thể có nhiều văn phòng. AC3: Nhân viên chọn văn phòng khi check-in. | High |
| US-002 | Là HR Admin, tôi muốn tạo lịch làm việc và gán grace period, để hệ thống không phạt nhân viên đến sớm/muộn vài phút. | AC1: WorkSchedule: Tên, Ngày làm việc (checkbox T2-CN), Giờ bắt đầu, Giờ kết thúc, Grace period (phút, mặc định 15). AC2: Check-in trong vòng grace period → ĐÚNG GIỜ. AC3: Check-in sau grace period → ĐI MUỘN, ghi nhận số phút muộn. | High |
| US-003 | Là Employee, tôi muốn check-in một chạm khi đến văn phòng, để không phải mở nhiều menu. | AC1: Màn hình check-in hiển thị thời gian thực và trạng thái (Chưa check-in / Đã check-in). AC2: Nút [Check-in] nổi bật. AC3: Sau check-in: hiển thị giờ check-in và trạng thái (Đúng giờ / Muộn X phút). AC4: Chỉ check-in được 1 lần/ngày (nếu muốn sửa → dùng FR-009). | High |
| US-004 | Là Employee, tôi muốn check-out khi về, để ghi nhận đủ số giờ làm việc trong ngày. | AC1: Sau khi check-in, nút [Check-out] xuất hiện. AC2: Check-out sớm hơn giờ kết thúc quy định → trạng thái VỀ SỚM. AC3: Tính tổng giờ làm = check-out − check-in. | High |
| US-005 | Là Manager, tôi muốn xem danh sách check-in của team hôm nay, để biết ai đã đến văn phòng và ai chưa. | AC1: Bảng: Tên nhân viên | Giờ check-in | Trạng thái | Văn phòng. AC2: Lọc theo phòng ban, theo văn phòng. AC3: Nhân viên chưa check-in → trạng thái "Chưa check-in" (không bị tính ABSENT ngay — phải hết ngày mới tính). | Medium |
| US-006 | Là Employee, tôi muốn gửi yêu cầu sửa chấm công khi quên check-in, để không bị tính vắng oan. | AC1: Form: Ngày, Giờ check-in thực tế, Giờ check-out thực tế, Lý do (bắt buộc). AC2: Gửi → Manager nhận thông báo duyệt. AC3: Nếu được duyệt: bản ghi chấm công được cập nhật, audit log ghi lại ai duyệt. AC4: Nếu bị từ chối: nhân viên nhận thông báo kèm lý do. | Medium |
| US-007 | Là HR Admin, tôi muốn xem báo cáo chấm công tháng theo phòng ban, để tổng hợp cho bảng lương. | AC1: Chọn tháng + phòng ban → bảng: Nhân viên | Ngày công | Số lần muộn | Tổng giờ làm. AC2: Export CSV. AC3: Click vào nhân viên → xem chi tiết từng ngày. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Check-in API phải phản hồi nhanh | Response time | < 500ms (P95) |
| Availability | Nhân viên có thể check-in bất cứ lúc nào | Uptime | 99.5% |
| Accuracy | Tính giờ đúng theo múi giờ văn phòng | Sai lệch | 0 phút |
| Concurrency | Nhiều nhân viên check-in cùng lúc (buổi sáng) | Concurrent requests | ≥ 500 đồng thời |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Check-in hàng ngày**

```
Dashboard → Widget "Chấm công hôm nay"
  → Trạng thái: [Chưa check-in] → [Check-in ngay]
  → POST /api/offices/checkin { officeId, timestamp }
  → Phản hồi: { status: "ON_TIME" | "LATE", minutesLate: N }
  → Hiển thị: "Đã check-in lúc 08:05 — Đúng giờ ✓"
```

**Luồng 2: Yêu cầu chỉnh sửa chấm công**

```
/attendance/history → Chọn ngày → [Yêu cầu sửa]
→ Form: Ngày | Giờ vào thực tế | Giờ ra thực tế | Lý do
→ POST /api/attendance/adjust-requests
→ Manager nhận in-app notification → Duyệt/Từ chối
→ Nếu duyệt: PATCH /api/attendance/:id → cập nhật bản ghi
```

**Luồng 3: Thiết lập lịch làm việc (HR Admin)**

```
Settings → Work Schedules → [+ Tạo lịch]
→ Form: Tên | Ngày làm việc (checkbox) | Giờ bắt đầu | Giờ kết thúc | Grace Period
→ POST /api/work-schedules
→ [Gán cho workspace / phòng ban]
→ PATCH /api/workspaces/:id/work-schedule
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Check-in widget | `/dashboard` | Widget check-in nhanh trên dashboard chính |
| Lịch sử chấm công | `/attendance/history` | Nhân viên xem lịch sử của mình |
| Check-in team hôm nay | `/attendance/team` | Manager xem team |
| Báo cáo tháng | `/attendance/reports` | HR báo cáo tổng hợp |
| Cài đặt lịch làm việc | `/settings/work-schedules` | HR Admin cấu hình |
| Cài đặt văn phòng | `/settings/offices` | HR Admin quản lý văn phòng |

---

## 6. Business Rules

### BR-001 — Chỉ 1 bản ghi check-in mỗi ngày mỗi nhân viên

Mỗi nhân viên chỉ được có 1 bản ghi chấm công (AttendanceRecord) per ngày. Nếu nhân viên cố check-in lần 2 → trả về lỗi "Bạn đã check-in hôm nay. Để sửa, hãy dùng yêu cầu chỉnh sửa."

### BR-002 — Tính trạng thái dựa trên grace period

```
Giờ check-in ≤ (giờ bắt đầu + grace period) → ĐÚNG GIỜ (ON_TIME)
Giờ check-in > (giờ bắt đầu + grace period) → ĐI MUỘN (LATE)
  → lưu minutesLate = checkIn - (scheduleStart + gracePeriod)

Giờ check-out < (giờ kết thúc - grace period) → VỀ SỚM (EARLY_LEAVE)
Chưa check-in khi hết ngày làm việc → VẮNG MẶT (ABSENT)
```

### BR-003 — Ngày không làm việc không tính chấm công

Nếu hôm nay không nằm trong WorkSchedule (ví dụ thứ 7-CN nếu công ty nghỉ), hệ thống không yêu cầu check-in và không tính trạng thái ABSENT.

### BR-004 — Yêu cầu sửa chấm công phải được duyệt trong vòng 3 ngày làm việc

Nếu Manager không duyệt trong 3 ngày làm việc, hệ thống auto-escalate lên HR Admin.

### BR-005 — Múi giờ tính theo văn phòng được chọn khi check-in

Giờ check-in được lưu UTC nhưng hiển thị và so sánh theo múi giờ của văn phòng nhân viên chọn. Tránh sai sót khi nhân viên check-in từ multiple time zones.

### BR-006 — Chấm công ngày lễ

Ngày lễ (lấy từ danh sách Holiday của workspace) → không yêu cầu check-in, không tính ABSENT. Nếu nhân viên check-in ngày lễ → ghi nhận làm thêm (overtime flag).

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Check-in / check-out bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem lịch sử chấm công bản thân | ✅ | ✅ | ✅ | ✅ |
| Gửi yêu cầu sửa chấm công | ✅ | ✅ | ✅ | ✅ |
| Xem check-in team hôm nay | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Duyệt yêu cầu sửa chấm công | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xem báo cáo chấm công tháng | ❌ | 👁 (team của mình) | ✅ | ✅ |
| Tạo / Sửa / Xóa văn phòng | ❌ | ❌ | ✅ | ✅ |
| Tạo / Sửa / Xóa lịch làm việc | ❌ | ❌ | ✅ | ✅ |
| Gán lịch làm việc | ❌ | ❌ | ✅ | ✅ |

**Chú thích:** 👁 = xem chỉ đọc, không sửa được.
