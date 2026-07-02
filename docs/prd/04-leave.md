# PRD-04 — Quản lý Nghỉ phép (Leave Management)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Leave Management |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Quy trình xin nghỉ phép hiện tại ở nhiều doanh nghiệp vừa và nhỏ được thực hiện qua Zalo, email, hoặc hỏi trực tiếp — dẫn đến thiếu minh bạch, manager dễ quên, không có lịch sử tra cứu, và nhân viên không biết còn bao nhiêu ngày phép.

Vấn đề cụ thể:
- Manager không có cái nhìn tổng hợp về ai đang nghỉ phép trong team.
- Nhân viên không biết mình còn bao nhiêu ngày phép và khi nào hết hạn.
- HR không có báo cáo nghỉ phép để tổng hợp cuối tháng.
- Không có luồng duyệt chính thức — đôi khi nghỉ rồi mới duyệt sau.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**
- 100% đơn xin nghỉ phép được gửi và duyệt qua hệ thống, không qua Zalo/email.
- HR rút ngắn thời gian tổng hợp báo cáo nghỉ phép cuối tháng ≥ 70%.
- Manager duyệt đơn trong ≤ 24 giờ kể từ khi nhận thông báo.

**Mục tiêu người dùng:**
- Nhân viên biết chính xác số ngày phép còn lại bất kỳ lúc nào.
- Manager xem được lịch nghỉ của cả team trước khi duyệt.
- HR xem và xuất báo cáo nghỉ phép theo tháng không cần tổng hợp thủ công.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:**
- Tạo, xem, hủy đơn nghỉ phép (nhân viên)
- Duyệt / từ chối đơn (manager, HR Admin)
- Duyệt hàng loạt nhiều đơn cùng lúc (HR Admin)
- Xem số ngày phép còn lại
- Xem lịch nghỉ phép (calendar view)
- Thông báo qua email + in-app khi có thay đổi trạng thái
- Tích hợp với Workflow engine cho quy trình duyệt đa cấp

**Ngoài phạm vi:**
- Tích hợp phép với bảng lương (module Payments xử lý)
- Quản lý phép thai sản, phép bệnh có BHXH chi trả (v2)
- Tạo đơn nghỉ thay cho người khác (chỉ HC mới làm được)

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Nhân viên** | Muốn nghỉ phép phải xin phép. Không nhất thiết rành hệ thống. | Tạo đơn nhanh, biết trạng thái duyệt, biết còn bao nhiêu ngày phép. | Xin qua Zalo rồi manager quên; cuối năm mới biết hết phép; không biết phép hết hạn khi nào. |
| **Manager / Team Lead** | Người phê duyệt đơn của nhân viên trực thuộc. | Thấy được lịch nghỉ của team, duyệt/từ chối nhanh với lý do. | Nhận quá nhiều Zalo xin phép; không nhớ ai đã xin; không biết cùng ngày có người khác nghỉ chưa. |
| **HR Admin** | Quản lý tổng thể nghỉ phép của toàn công ty. | Duyệt hàng loạt, xem báo cáo, điều chỉnh số ngày phép thủ công. | Cuối tháng phải tổng hợp từ Zalo/email vào Excel tốn hàng giờ. |

### 2.2 User Journey

**Nhân viên — Tạo đơn xin nghỉ:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /leave → Click "Xin nghỉ phép" | Tạo đơn mới |
| 2 | Chọn loại phép, ngày bắt đầu, ngày kết thúc | Điền thông tin |
| 3 | Hệ thống tự tính số ngày (trừ cuối tuần, lễ) + hiển thị phép còn lại | Kiểm tra phép đủ không |
| 4 | Điền lý do, đính kèm file nếu cần | Hoàn chỉnh đơn |
| 5 | Submit → Nhận xác nhận "Đơn đã gửi, đang chờ duyệt" | Biết đơn đã được gửi |
| 6 | Nhận thông báo khi được duyệt/từ chối | Cập nhật trạng thái |

**Manager — Duyệt đơn:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận thông báo "X xin nghỉ từ ngày Y đến Z" | Biết có đơn cần duyệt |
| 2 | Vào /leave hoặc /approvals → Xem đơn chi tiết | Đọc thông tin |
| 3 | Xem calendar — ngày đó team có ai nghỉ khác không | Đánh giá ảnh hưởng team |
| 4 | Duyệt + ghi chú hoặc Từ chối + lý do | Hành động |
| 5 | Nhân viên nhận thông báo | Kết thúc luồng |

**HR Admin — Báo cáo cuối tháng:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /leave → Filter theo tháng | Lọc dữ liệu |
| 2 | Xem tổng hợp: ai nghỉ bao nhiêu ngày, loại phép nào | Kiểm tra |
| 3 | Xuất CSV/Excel | Gửi báo cáo hoặc tích hợp tính lương |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Tạo đơn xin nghỉ phép | Nhân viên tạo đơn với loại phép, ngày, lý do | Must Have | 5 |
| FR-002 | Xem danh sách đơn của mình | Lịch sử đơn nghỉ + trạng thái | Must Have | 3 |
| FR-003 | Hủy đơn đang pending | Nhân viên hủy đơn chưa được duyệt | Must Have | 2 |
| FR-004 | Duyệt / từ chối đơn | Manager / HR duyệt hoặc từ chối kèm comment | Must Have | 5 |
| FR-005 | Duyệt hàng loạt | HR chọn nhiều đơn và duyệt/từ chối cùng lúc | Must Have | 5 |
| FR-006 | Xem calendar nghỉ phép | Calendar view theo team/phòng ban | Must Have | 5 |
| FR-007 | Xem số ngày phép còn lại | Widget hiển thị phép còn lại cho nhân viên | Must Have | 3 |
| FR-008 | Cấu hình loại phép | Admin tạo loại phép: phép năm, phép bệnh, phép OT... | Must Have | 3 |
| FR-009 | Thông báo khi thay đổi trạng thái | Email + in-app notification | Must Have | 5 |
| FR-010 | Xuất báo cáo nghỉ phép | CSV/Excel theo tháng, phòng ban | Must Have | 3 |
| FR-011 | Tích hợp Workflow đa cấp | Đơn nghỉ kích hoạt workflow template nếu cần duyệt 2+ cấp | Should Have | 8 |
| FR-012 | Điều chỉnh số ngày phép thủ công | HR Admin thêm/bớt ngày phép cho nhân viên + ghi chú | Must Have | 3 |
| FR-013 | Kiểm soát thời hạn tạo/duyệt | Chặn tạo/duyệt đơn sau deadline của kỳ chốt công | Should Have | 5 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là nhân viên, tôi muốn tạo đơn xin nghỉ phép nhanh, để không mất thời gian và biết ngay đơn có được duyệt không. | AC1: Form gồm: Loại phép (dropdown), Từ ngày, Đến ngày, Lý do (bắt buộc), File đính kèm (tuỳ chọn). AC2: Hệ thống tự tính số ngày nghỉ thực tế (trừ cuối tuần + ngày lễ đã cấu hình). AC3: Hiển thị số ngày phép còn lại trước và sau khi nghỉ. AC4: Nếu không đủ phép: hiển thị cảnh báo, cho phép chọn "Nghỉ không lương". AC5: Submit thành công → Status = PENDING, thông báo cho Manager. | High |
| US-002 | Là nhân viên, tôi muốn hủy đơn đang chờ duyệt, để linh hoạt khi kế hoạch thay đổi. | AC1: Chỉ hủy được khi Status = PENDING. AC2: Sau khi hủy: Status = CANCELLED, thông báo Manager. AC3: Không thể hủy đơn đã APPROVED (cần xin lại hoặc liên hệ HR). | High |
| US-003 | Là manager, tôi muốn xem lịch nghỉ của team trước khi duyệt, để không để team thiếu người cùng ngày. | AC1: Calendar hiển thị ngày nào trong team có ai nghỉ (màu sắc theo người). AC2: Khi hover vào ngày: tooltip hiển thị tên nhân viên nghỉ và loại phép. AC3: Filter theo tuần/tháng. | High |
| US-004 | Là manager, tôi muốn duyệt hoặc từ chối đơn với lý do, để nhân viên biết kết quả và có cơ sở khi từ chối. | AC1: Nút "Duyệt" và "Từ chối" trong chi tiết đơn. AC2: Từ chối bắt buộc điền lý do (không để trống). AC3: Sau khi hành động: trạng thái đơn cập nhật ngay, thông báo email + in-app gửi đến nhân viên. AC4: Nếu đơn đã được duyệt: trừ ngày phép tương ứng khỏi số dư. | High |
| US-005 | Là HR Admin, tôi muốn duyệt nhiều đơn nghỉ phép cùng lúc, để tiết kiệm thời gian vào cuối kỳ khi đơn phát sinh nhiều. | AC1: Checkbox chọn nhiều đơn trong danh sách. AC2: Nút "Duyệt tất cả" / "Từ chối tất cả" (từ chối hàng loạt cần nhập 1 lý do chung). AC3: Kết quả hiển thị: X đơn duyệt thành công, Y đơn lỗi (kèm lý do). AC4: Audit log ghi nhận người duyệt, thời điểm, danh sách đơn. | High |
| US-006 | Là nhân viên, tôi muốn xem số ngày phép còn lại, để chủ động lên kế hoạch nghỉ mà không bị thiếu. | AC1: Widget phép còn lại hiển thị trên trang /leave: Phép năm / Phép bệnh / Phép OT (nếu có). AC2: Cập nhật real-time sau khi đơn được duyệt. AC3: Hiển thị ngày hết hạn của phép lũy kế nếu có. | High |
| US-007 | Là HR Admin, tôi muốn điều chỉnh số ngày phép của nhân viên kèm ghi chú, để xử lý các trường hợp ngoại lệ không có trong quy tắc tự động. | AC1: HR chọn nhân viên → "Điều chỉnh phép" → Nhập số ngày (dương = cộng, âm = trừ) + lý do. AC2: Số dư phép cập nhật ngay sau khi lưu. AC3: Lịch sử điều chỉnh ghi vào transaction log với đầy đủ: ai điều chỉnh, bao nhiêu, lý do, thời điểm. | High |
| US-008 | Là HR Admin, tôi muốn xuất báo cáo nghỉ phép theo tháng, để nộp cho kế toán tính lương mà không cần tổng hợp thủ công. | AC1: Filter: Tháng, Phòng ban, Nhân viên, Loại phép. AC2: Xuất CSV/Excel gồm: Tên NV, Mã NV, Phòng ban, Ngày nghỉ, Loại phép, Số ngày, Trạng thái. AC3: Download bắt đầu trong < 5 giây. | High |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Performance | Trang danh sách đơn và calendar load nhanh. | < 2 giây với ≤ 1.000 đơn/tháng. |
| Security | Nhân viên chỉ xem đơn của mình. Manager chỉ xem team trực thuộc. | Phân quyền server-side. 100% hành động duyệt được audit. |
| Notification | Thông báo phải đến tay người nhận trong vòng 1 phút sau hành động. | Delivery rate thông báo > 99%. |
| Data Integrity | Số ngày phép không bao giờ âm do lỗi đồng thời (race condition). | Sử dụng DB transaction khi trừ phép. |
| Usability | Nhân viên tạo đơn trong ≤ 3 bước. | Tổng click từ vào trang đến submit ≤ 5. |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Nhân viên tạo đơn nghỉ**

```
/leave
→ [Xin nghỉ phép]
→ Form: Loại phép | Từ ngày | Đến ngày | (Tự tính: X ngày, còn lại Y ngày)
→ Lý do* | File đính kèm
→ [Submit] → POST /api/leave
→ Thông báo "Đơn đã gửi, chờ duyệt" → Badge pending trên menu
```

**Luồng 2: Manager duyệt đơn**

```
Nhận email thông báo "X xin nghỉ ngày Y-Z"
→ Click link → /approvals hoặc /leave
→ Xem chi tiết đơn + Calendar team ngày đó
→ [Duyệt] → Comment (tuỳ chọn) → POST /api/leave/[id]/review { action: "APPROVE" }
      hoặc
→ [Từ chối] → Lý do (bắt buộc) → POST /api/leave/[id]/review { action: "REJECT" }
→ Nhân viên nhận thông báo kết quả
```

**Luồng 3: HR Admin duyệt hàng loạt**

```
/leave → Tab "Chờ duyệt" → Filter theo kỳ
→ Checkbox chọn nhiều đơn
→ [Duyệt tất cả] → Confirm dialog → Batch approve
→ Kết quả: X thành công / Y lỗi
```

### 5.2 Trạng thái đơn

```
PENDING
    → APPROVED  (Manager/HR duyệt)
    → REJECTED  (Manager/HR từ chối kèm lý do)
    → CANCELLED (Nhân viên tự hủy — chỉ khi đang PENDING)

APPROVED
    → CANCELLED (Nhân viên hủy trước ngày nghỉ — cần HR xác nhận)
```

---

## 6. Business Rules

### BR-001 — Tính số ngày thực tế

Số ngày nghỉ thực tế = số ngày dương lịch từ startDate đến endDate, **trừ đi** ngày cuối tuần (Thứ 7, Chủ Nhật) và ngày lễ đã được cấu hình trong hệ thống. Nếu kết quả = 0 → không cho tạo đơn.

### BR-002 — Kiểm tra số dư phép

Trước khi tạo đơn, hệ thống kiểm tra: `số dư phép của loại phép đó ≥ số ngày đề nghị`. Nếu không đủ: hiển thị cảnh báo và gợi ý chuyển sang "Nghỉ không lương".

### BR-003 — Không được nghỉ trùng ngày

Không thể tạo 2 đơn nghỉ phép trùng ngày cho cùng 1 nhân viên. Hệ thống kiểm tra overlap và hiển thị lỗi nếu vi phạm.

### BR-004 — Chỉ hủy khi PENDING

Nhân viên chỉ được hủy đơn khi status = PENDING. Đơn đã APPROVED: phải liên hệ HR để điều chỉnh — HR hủy với ghi chú lý do, phép được cộng lại.

### BR-005 — Trừ phép khi APPROVE

Khi HR/Manager duyệt đơn: số dư phép tương ứng bị trừ ngay. Thao tác này dùng DB transaction để tránh race condition.

### BR-006 — Manager không tự duyệt đơn của mình

Nếu Manager xin nghỉ phép, Manager cấp trên hoặc HR Admin là người duyệt. Hệ thống tự xác định người duyệt phù hợp theo cây tổ chức.

### BR-007 — Deadline tạo và duyệt đơn theo kỳ

Admin có thể cấu hình deadline:
- Nhân viên không tạo được đơn cho kỳ tháng N sau `deadline_create` (mặc định: 12:00 ngày 26).
- Manager không duyệt được đơn sau `deadline_approve` (mặc định: 18:30 ngày 26).
- HR Admin không bị giới hạn deadline — có thể xử lý thủ công.

### BR-008 — Nghỉ nửa ngày

Loại phép có thể cấu hình nghỉ nửa ngày (0.5 ngày). Khi chọn: chỉ chọn buổi sáng hoặc buổi chiều — hiển thị rõ trên đơn và trên calendar.

---

## 7. Phân quyền

### 7.1 Bảng phân quyền

| Hành động | Employee (bản thân) | Manager (team) | HR Admin | Admin |
|---|---|---|---|---|
| Tạo đơn nghỉ phép | ✅ | ✅ | ✅ | ✅ |
| Xem đơn của mình | ✅ | ✅ | ✅ | ✅ |
| Xem đơn team | ❌ | ✅ | ✅ | ✅ |
| Xem đơn toàn công ty | ❌ | ❌ | ✅ | ✅ |
| Hủy đơn của mình | ✅ (PENDING) | ✅ (PENDING) | ✅ | ✅ |
| Duyệt / Từ chối đơn | ❌ | ✅ (team) | ✅ | ✅ |
| Duyệt hàng loạt | ❌ | ❌ | ✅ | ✅ |
| Điều chỉnh số ngày phép thủ công | ❌ | ❌ | ✅ | ✅ |
| Cấu hình loại phép | ❌ | ❌ | ✅ | ✅ |
| Xuất báo cáo | ❌ | 👁 team | ✅ | ✅ |
| Xem calendar toàn công ty | ❌ | 👁 team | ✅ | ✅ |

### 7.2 Điều kiện đặc biệt

| Trường hợp | Xử lý |
|---|---|
| Manager xin nghỉ phép | Đơn được gửi đến Manager cấp trên của Manager đó hoặc HR Admin |
| HR Admin xin nghỉ phép | Đơn được gửi đến Admin |
| Không có Manager cấp trên | Đơn được gửi đến HR Admin |

---

## 8. Thông báo

| Sự kiện | Gửi đến | Kênh |
|---|---|---|
| Tạo đơn mới | Manager trực tiếp | Email + In-app |
| Đơn được duyệt | Nhân viên | Email + In-app |
| Đơn bị từ chối | Nhân viên | Email + In-app (kèm lý do) |
| Nhân viên hủy đơn đang PENDING | Manager | In-app |
| Đơn gần deadline chưa được duyệt | Manager | Email nhắc nhở |
