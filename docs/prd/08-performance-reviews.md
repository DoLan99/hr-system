# PRD-08 — Đánh giá Hiệu suất (Performance Reviews)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Performance Reviews |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Nhiều doanh nghiệp vừa và nhỏ không có quy trình đánh giá hiệu suất nhân viên chính thức — hoặc có nhưng thực hiện qua email, file Word, Google Form rời rạc, kết quả lưu ở nhiều nơi. Manager đánh giá theo cảm tính, thiếu tiêu chí cụ thể, không có dữ liệu task/time log làm bằng chứng.

Vấn đề cụ thể:
- Không có tiêu chí đánh giá thống nhất giữa các phòng ban.
- Nhân viên không biết mình bị đánh giá theo tiêu chí gì.
- Kết quả đánh giá không được lưu trữ có hệ thống, không truy vết được.
- Không có cơ chế tự đánh giá (self-review) — chỉ có 1 chiều từ manager.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**
- 100% nhân viên được đánh giá chính thức ít nhất 2 lần/năm qua hệ thống.
- Giảm thời gian HR thu thập và tổng hợp kết quả đánh giá từ nhiều ngày xuống vài giờ.
- Kết quả đánh giá làm đầu vào khách quan cho quyết định tăng lương, thăng chức.

**Mục tiêu người dùng:**
- Manager đánh giá nhân viên có hệ thống, có bằng chứng số liệu task/time.
- Nhân viên biết mình đang được đánh giá theo tiêu chí gì, tự đánh giá được.
- HR Admin tổng hợp kết quả toàn công ty và xuất báo cáo không cần tổng hợp thủ công.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:**
- Tạo và quản lý chu kỳ đánh giá (Review Cycle)
- Tự đánh giá (self-review) và đánh giá từ Manager
- Tổng hợp điểm tự động theo trọng số tiêu chí
- Gắn mục tiêu phát triển cá nhân (Development Goals) sau đánh giá
- Export báo cáo kết quả

**Ngoài phạm vi:**
- Đánh giá 360 (peer review) — v2
- Tự động tăng lương dựa trên kết quả đánh giá — module Payments xử lý thủ công
- Đánh giá thử việc (dùng chu kỳ type = PROBATION)

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Thiết lập chu kỳ đánh giá, theo dõi tiến độ điền form, tổng hợp kết quả. | Tạo chu kỳ nhanh, xem ai chưa điền, recalculate điểm, xuất báo cáo. | Phải đi nhắc từng manager điền form; tổng hợp điểm thủ công dễ sai. |
| **Manager** | Đánh giá nhân viên trực thuộc, tham khảo data task/time log thực tế. | Điền form đánh giá nhanh, có data hỗ trợ quyết định. | Đánh giá "từ trí nhớ" vì không có data; khó biện hộ điểm khi nhân viên thắc mắc. |
| **Employee (Nhân viên)** | Tự đánh giá bản thân, xem kết quả sau khi manager submit. | Điền self-review được, xem điểm và nhận xét của manager. | Không biết manager đánh giá theo tiêu chí gì; không có cơ hội tự bào chữa. |

### 2.2 User Journey

**HR Admin — Tạo chu kỳ đánh giá:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /performance-reviews → Tab "Chu kỳ" → "Tạo chu kỳ" | Mở form |
| 2 | Đặt tên, loại (Quý/Năm/Thử việc), ngày bắt đầu/kết thúc | Thiết lập thời gian |
| 3 | Cấu hình tiêu chí đánh giá và trọng số (tổng = 100%) | Định nghĩa thước đo |
| 4 | Chọn phạm vi áp dụng (toàn công ty / phòng ban cụ thể) | Xác định đối tượng |
| 5 | Submit → Hệ thống tự tạo Review record cho mỗi nhân viên | Kích hoạt chu kỳ |
| 6 | Gửi thông báo đến nhân viên và manager | Nhắc nhở điền form |

**Nhân viên — Self-review:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận thông báo "Chu kỳ đánh giá Q2/2026 đang mở" | Biết cần điền form |
| 2 | Vào /performance-reviews → Chọn chu kỳ | Mở form tự đánh giá |
| 3 | Với mỗi tiêu chí: Cho điểm 1-5 + Viết nhận xét | Điền nội dung |
| 4 | Viết tổng kết: thành tích, khó khăn, kế hoạch | Phần tự luận |
| 5 | Submit | Hoàn thành self-review |

**Manager — Đánh giá nhân viên:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Nhận thông báo nhân viên đã tự đánh giá | Biết có thể bắt đầu |
| 2 | Vào chi tiết review → Xem self-review của nhân viên | Tham khảo |
| 3 | Xem sidebar: data thực tế (số task, giờ làm, on-time %) | Có bằng chứng |
| 4 | Cho điểm từng tiêu chí + viết nhận xét | Điền đánh giá |
| 5 | Viết nhận xét tổng, điểm mạnh, cần cải thiện, kế hoạch phát triển | Hoàn chỉnh |
| 6 | Submit | Hoàn thành manager review |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Tạo Review Cycle | Admin tạo chu kỳ đánh giá với tiêu chí + trọng số | Must Have | 8 |
| FR-002 | Tự động tạo Review records | Hệ thống tự tạo 1 record/nhân viên khi cycle được activate | Must Have | 5 |
| FR-003 | Self-review | Nhân viên điền tự đánh giá | Must Have | 5 |
| FR-004 | Manager review | Manager điền đánh giá sau khi xem self-review | Must Have | 5 |
| FR-005 | Data sidebar trong review | Hiển thị task count, hours, on-time % trong kỳ đánh giá | Should Have | 5 |
| FR-006 | Recalculate điểm | Admin trigger tính lại điểm tổng theo trọng số | Must Have | 5 |
| FR-007 | Gắn Development Goals | Manager tạo mục tiêu phát triển sau đánh giá | Should Have | 5 |
| FR-008 | Nhân viên xem kết quả | Nhân viên xem điểm + nhận xét sau khi Admin publish | Must Have | 3 |
| FR-009 | Export báo cáo | CSV/Excel toàn bộ kết quả chu kỳ | Must Have | 3 |
| FR-010 | Nhắc nhở deadline | Thông báo nhắc nhở khi gần deadline nhưng chưa điền | Should Have | 3 |
| FR-011 | Xem tiến độ chu kỳ | Admin xem ai đã điền / chưa điền / đã submit | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo chu kỳ đánh giá với tiêu chí và trọng số tùy chỉnh, để đánh giá phù hợp với văn hóa và mục tiêu của công ty. | AC1: Form: Tên chu kỳ, Loại (QUARTERLY/ANNUAL/PROBATION/CUSTOM), Ngày bắt đầu, Ngày kết thúc, Scope (toàn cty / phòng ban). AC2: Tiêu chí: Tên, trọng số %. Tổng trọng số phải = 100% mới cho submit. AC3: Ít nhất 2 tiêu chí. AC4: Sau khi submit → hệ thống tự tạo Review record cho từng nhân viên thuộc scope. AC5: Gửi thông báo cho tất cả nhân viên và manager liên quan. | High |
| US-002 | Là HR Admin, tôi muốn xem tiến độ ai đã điền và ai chưa điền trong chu kỳ, để nhắc nhở kịp thời trước deadline. | AC1: Dashboard chu kỳ: biểu đồ tròn % đã submit self-review / manager review. AC2: Danh sách nhân viên với cột: Self-review (done/pending), Manager review (done/pending), Điểm (nếu đã calculate). AC3: Filter: Phòng ban, Trạng thái. AC4: Nút "Gửi nhắc nhở" → batch email đến người chưa điền. | High |
| US-003 | Là nhân viên, tôi muốn điền tự đánh giá với từng tiêu chí, để bày tỏ quan điểm của mình trước khi manager đánh giá. | AC1: Với mỗi tiêu chí: Scale điểm 1-5 (có nhãn mô tả từng mức). AC2: Ô nhận xét (textarea, tối đa 500 ký tự) cho mỗi tiêu chí. AC3: Phần tổng kết tự do: Thành tích nổi bật, Khó khăn gặp phải, Kế hoạch kỳ tới. AC4: Lưu draft bất kỳ lúc nào, submit khi sẵn sàng. AC5: Sau khi submit: không chỉnh sửa được (để đảm bảo tính trung thực). | High |
| US-004 | Là Manager, tôi muốn xem self-review của nhân viên và data thực tế trước khi điền đánh giá, để quyết định có cơ sở khách quan. | AC1: Sidebar trong trang manager review: Số task đã hoàn thành trong kỳ, Số task bị reject, Tỷ lệ on-time, Tổng giờ làm thực tế. AC2: Xem được nội dung self-review của nhân viên. AC3: Điền điểm từng tiêu chí + nhận xét, không phụ thuộc vào điểm của nhân viên. AC4: Trường: Nhận xét tổng, Điểm mạnh, Cần cải thiện, Kế hoạch phát triển đề xuất. | High |
| US-005 | Là HR Admin, tôi muốn trigger tính lại điểm tổng, để cập nhật khi có tiêu chí thay đổi hoặc cần verify lại. | AC1: Nút "Recalculate" trong trang chu kỳ → POST /api/performance-reviews/cycles/[id]/recalculate. AC2: Với mỗi review: finalScore = Σ (managerScore_i × weight_i) / 100. AC3: Rating tự động: EXCELLENT (≥4.5), GOOD (3.5-4.4), MEETS_EXPECTATIONS (2.5-3.4), NEEDS_IMPROVEMENT (1.5-2.4), UNSATISFACTORY (<1.5). AC4: Recalculate idempotent — chạy nhiều lần cho kết quả như nhau. | High |
| US-006 | Là Manager, tôi muốn gắn mục tiêu phát triển cho nhân viên sau đánh giá, để theo dõi hành động cụ thể cải thiện kỳ sau. | AC1: Sau khi submit manager review → nút "Thêm Development Goal". AC2: Form: Tiêu đề goal, Mô tả, Ngày đích, Kỹ năng liên kết (từ module Skills). AC3: Nhân viên xem được goal của mình và cập nhật tiến độ. AC4: Goal có status: IN_PROGRESS / COMPLETED / ABANDONED. | Medium |
| US-007 | Là nhân viên, tôi muốn xem kết quả đánh giá sau khi Admin publish, để biết điểm và nhận xét của manager. | AC1: Kết quả chỉ hiển thị khi HR Admin publish (không tự động hiện sau khi manager submit). AC2: Nhân viên thấy: Điểm từng tiêu chí (manager), Điểm tổng, Rating, Nhận xét manager. AC3: Nhân viên KHÔNG thấy điểm của đồng nghiệp (dù có so sánh ẩn danh). | High |
| US-008 | Là HR Admin, tôi muốn xuất toàn bộ kết quả chu kỳ ra Excel, để nộp cho ban giám đốc và lưu hồ sơ. | AC1: Export CSV/Excel gồm: Tên, Mã NV, Phòng ban, Chức vụ, Điểm từng tiêu chí, Điểm tổng, Rating. AC2: Sheet phụ: Nhận xét manager cho từng nhân viên. AC3: Download trong < 10 giây với ≤ 500 nhân viên. | High |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Security | Nhân viên chỉ xem kết quả của mình. Manager chỉ thấy review của team. | Phân quyền server-side. Kết quả ẩn cho đến khi Admin publish. |
| Data Integrity | Điểm không bao giờ sai do lỗi tính toán. | Recalculate chạy lại cho kết quả đúng và nhất quán. Làm tròn 2 chữ số thập phân. |
| Audit | Mọi thay đổi trong review (tạo, submit, publish) đều có audit trail. | 100% action ghi log. |
| Usability | Manager điền xong 1 review trong ≤ 10 phút. | Form tối ưu UX, không quá 5 tiêu chí mặc định. |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo chu kỳ và kích hoạt**

```
/performance-reviews → Tab "Chu kỳ" → [+ Tạo chu kỳ]
→ Form: Tên | Loại | Ngày bắt đầu | Ngày kết thúc | Scope
→ Cấu hình tiêu chí: [+ Thêm tiêu chí] → Tên | Trọng số %
→ (Tổng trọng số = 100% → Enable Submit)
→ [Kích hoạt] → Tạo Review records + Gửi thông báo
→ Dashboard chu kỳ: Tiến độ điền form real-time
```

**Luồng 2: Nhân viên tự đánh giá**

```
Nhận thông báo → /performance-reviews → Click chu kỳ
→ Form self-review:
    Tiêu chí 1: [Điểm 1-5 ★] + [Nhận xét textarea]
    Tiêu chí 2: ...
    Tổng kết: Thành tích | Khó khăn | Kế hoạch
→ [Lưu draft] / [Submit]
→ Status = SELF_SUBMITTED
```

**Luồng 3: Manager đánh giá**

```
Nhận thông báo "X đã hoàn thành self-review"
→ /performance-reviews → Tab "Team" → Chọn nhân viên
→ 2 cột: Bên trái: Self-review của NV | Bên phải: Form manager review
→ Sidebar: Data thực tế (task, hours, on-time)
→ Điền điểm từng tiêu chí + nhận xét
→ Điền tổng kết: Điểm mạnh | Cần cải thiện | Kế hoạch
→ [Submit] → Status = MANAGER_SUBMITTED
```

**Luồng 4: Tổng hợp và publish**

```
HR Admin: Tất cả đã submit → [Recalculate]
→ Xem kết quả: danh sách nhân viên + điểm + rating
→ Review lại, điều chỉnh nếu cần (Admin only)
→ [Publish] → Nhân viên nhận thông báo "Kết quả đánh giá đã có"
→ Export CSV/Excel
```

---

## 6. Business Rules

### BR-001 — Trọng số tiêu chí phải tổng = 100%

Khi cấu hình chu kỳ, tổng trọng số (weight) của tất cả tiêu chí phải bằng đúng 100%. Hệ thống không cho submit nếu tổng < 100% hoặc > 100%.

### BR-002 — Manager không tự đánh giá mình

Manager không thể vừa là Reviewer vừa là Employee trong cùng 1 Review record. Đánh giá Manager phải do Manager cấp trên hoặc HR Admin phụ trách.

### BR-003 — Chu kỳ chỉ xóa được khi DRAFT

Review Cycle chỉ có thể xóa khi status = DRAFT (chưa activate). Sau khi activate: chỉ deactivate được (không xóa) để đảm bảo tính toàn vẹn dữ liệu.

### BR-004 — Công thức tính điểm

```
managerScore = Σ (managerRating_i × weight_i) / 100
finalScore = selfScore × selfWeight + managerScore × (1 - selfWeight)
```

Mặc định: `selfWeight = 0.3` (30% tự đánh giá, 70% manager). Cấu hình per cycle.

### BR-005 — Rating map tự động

| Điểm | Rating |
|---|---|
| ≥ 4.5 | EXCELLENT |
| 3.5 – 4.4 | GOOD |
| 2.5 – 3.4 | MEETS_EXPECTATIONS |
| 1.5 – 2.4 | NEEDS_IMPROVEMENT |
| < 1.5 | UNSATISFACTORY |

### BR-006 — Kết quả ẩn cho đến khi publish

Nhân viên không xem được điểm và nhận xét cho đến khi HR Admin chủ động click "Publish" cho chu kỳ đó. Tránh xáo trộn trước khi HR review toàn bộ kết quả.

### BR-007 — Self-review không sửa được sau khi submit

Sau khi nhân viên submit self-review: form bị lock. Chỉ HR Admin mới unlock nếu có lý do đặc biệt (và ghi audit log).

---

## 7. Phân quyền

| Hành động | Employee (bản thân) | Manager (team) | HR Admin | Admin |
|---|---|---|---|---|
| Xem danh sách chu kỳ | ✅ (chỉ cycle của mình) | ✅ (team) | ✅ | ✅ |
| Tạo chu kỳ đánh giá | ❌ | ❌ | ✅ | ✅ |
| Điền self-review | ✅ | ✅ | ✅ | ✅ |
| Điền manager review | ❌ | ✅ (team) | ✅ | ✅ |
| Xem kết quả (sau publish) | 👁 của mình | 👁 team | ✅ | ✅ |
| Publish kết quả | ❌ | ❌ | ✅ | ✅ |
| Recalculate điểm | ❌ | ❌ | ✅ | ✅ |
| Export báo cáo | ❌ | ❌ | ✅ | ✅ |
| Tạo Development Goals | ❌ | ✅ (team) | ✅ | ✅ |
| Cập nhật tiến độ Goal | ✅ (của mình) | 👁 | ✅ | ✅ |
