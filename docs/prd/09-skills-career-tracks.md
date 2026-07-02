# PRD-09 — Kỹ năng & Lộ trình nghề nghiệp

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Skills / Career Tracks / Employee Skills |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Công ty không có bức tranh rõ ràng về năng lực nhân sự: không biết ai có kỹ năng gì, kỹ năng đang ở level nào, gap với yêu cầu chức vụ là bao nhiêu. Hậu quả:
- Khi có dự án cần kỹ năng đặc biệt → phải hỏi từng người thủ công.
- Nhân viên không biết cần học gì để thăng tiến.
- HR không có dữ liệu để lập kế hoạch training.

### 1.2 Mục tiêu sản phẩm (Goals)

- Xây dựng danh mục kỹ năng (Skill Catalog) toàn công ty.
- Nhân viên/Manager đánh giá level kỹ năng của từng người.
- Hệ thống tính skill gap dựa trên yêu cầu chức vụ (xem PRD-03).
- Định nghĩa lộ trình nghề nghiệp (Career Track) với các milestone rõ ràng.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** Skill Catalog CRUD, đánh giá kỹ năng nhân viên (self + manager), tính skill gap, Career Track với milestones.

**Ngoài phạm vi:** Tích hợp hệ thống LMS (v2), AI gợi ý khóa học (v2), chứng chỉ từ bên ngoài (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Xây dựng danh mục kỹ năng, định nghĩa career track, lập kế hoạch training. | Skill map toàn công ty, báo cáo gap. | Không có dữ liệu → lập kế hoạch training dựa trên cảm tính. |
| **Manager** | Đánh giá kỹ năng team, biết ai có thể nhận task nào. | Xem skill matrix của team, tìm người phù hợp task. | Phải hỏi trực tiếp hoặc đoán khi phân công task cần kỹ năng đặc biệt. |
| **Employee** | Biết mình đang ở đâu trong lộ trình, cần học gì tiếp theo. | Xem skill profile bản thân, xem career track, thấy gap. | Không biết tiêu chuẩn thăng tiến → không có định hướng học tập. |

### 2.2 User Journey

**HR Admin — Xây dựng Skill Catalog:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào Skills → [+ Tạo danh mục kỹ năng] (nhóm: Technical/Soft/Management) | Phân loại kỹ năng |
| 2 | Tạo từng Skill trong danh mục, định nghĩa levels 1-5 | Danh mục kỹ năng chuẩn |
| 3 | Gán kỹ năng yêu cầu cho từng chức vụ (xem PRD-03 FR-004) | Tiêu chuẩn chức vụ |
| 4 | Tạo Career Track: các bước thăng tiến từ Junior → Senior | Lộ trình rõ ràng |

**Employee — Xem skill gap và lộ trình:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào Profile → Tab "Kỹ năng" | Xem skill profile |
| 2 | Xem danh sách kỹ năng: current level vs required level | Nhận ra gap |
| 3 | Click vào Career Track của mình → xem milestones | Hiểu lộ trình |
| 4 | Xem gap: kỹ năng nào cần cải thiện để lên level tiếp theo | Lập kế hoạch học |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Skill Catalog | Tạo, sửa, xóa kỹ năng với danh mục (Technical/Soft/Management) | Must Have | 3 |
| FR-002 | Định nghĩa levels | Mỗi kỹ năng có 5 levels, mỗi level có mô tả rõ ràng | Must Have | 5 |
| FR-003 | Đánh giá kỹ năng nhân viên | Manager/HR gán level kỹ năng cho nhân viên; nhân viên self-assess | Must Have | 8 |
| FR-004 | Tính Skill Gap | So sánh kỹ năng hiện tại vs yêu cầu chức vụ → gap report | Must Have | 8 |
| FR-005 | Skill Matrix Team | Manager xem ma trận kỹ năng của cả team | Should Have | 5 |
| FR-006 | CRUD Career Track | Tạo lộ trình nghề nghiệp: các bước/milestones từ junior đến senior | Should Have | 8 |
| FR-007 | Gán Career Track cho nhân viên | Nhân viên được gán vào career track phù hợp | Should Have | 3 |
| FR-008 | Milestone progress | Hiển thị nhân viên đang ở milestone nào trong career track | Should Have | 5 |
| FR-009 | Báo cáo skill gap toàn công ty | HR xem heat map: kỹ năng nào đang thiếu nhiều nhất | Nice to Have | 8 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo danh mục kỹ năng có phân loại và mô tả từng level, để toàn công ty dùng cùng 1 tiêu chuẩn đánh giá. | AC1: Tạo Skill: Tên*, Danh mục (Technical/Soft/Management/Other), Mô tả tổng quan. AC2: Gán mô tả cho từng level 1-5 (VD: Level 1 = "Biết cơ bản", Level 5 = "Chuyên gia, có thể mentor"). AC3: Có thể deactivate skill (không xóa) nếu đang được nhân viên sử dụng. | High |
| US-002 | Là Manager, tôi muốn đánh giá level kỹ năng cho từng thành viên team, để có dữ liệu chính xác thay vì chỉ self-report. | AC1: Vào Profile nhân viên → Tab Kỹ năng → [Đánh giá]. AC2: Chọn Skill + Level (1-5) + Ghi chú tuỳ chọn. AC3: Bản ghi lưu: skill, level, assessorId, assessedAt. AC4: Lịch sử đánh giá: xem được các lần đánh giá trước. AC5: Manager chỉ đánh giá được nhân viên trong team của mình. | High |
| US-003 | Là Employee, tôi muốn tự đánh giá kỹ năng của bản thân, để tham khảo cho performance review. | AC1: Nhân viên có thể self-assess tất cả kỹ năng (không giới hạn). AC2: Self-assessment được đánh dấu khác biệt với manager-assessment. AC3: Khi xem gap: hiển thị cả 2 nguồn (self vs manager) nếu có. | Medium |
| US-004 | Là HR Admin, tôi muốn xem báo cáo skill gap của từng nhân viên so với chức vụ, để lập kế hoạch training đúng hướng. | AC1: Chọn nhân viên → Skill Gap Report: bảng Kỹ năng | Required Level | Current Level | Gap. AC2: Gap = Required − Current (âm = đủ, dương = thiếu). AC3: Highlight các kỹ năng có gap > 1. AC4: Filter theo phòng ban, chức vụ. | High |
| US-005 | Là Manager, tôi muốn xem skill matrix của cả team, để phân công task phù hợp với kỹ năng thực tế. | AC1: Bảng ma trận: cột = Kỹ năng, hàng = Nhân viên, ô = Level (màu: đỏ/vàng/xanh). AC2: Filter theo danh mục kỹ năng. AC3: Hover vào ô → xem chi tiết level + ghi chú. | Medium |
| US-006 | Là HR Admin, tôi muốn tạo Career Track với các milestones rõ ràng, để nhân viên biết con đường thăng tiến. | AC1: Career Track: Tên*, Phòng ban (tuỳ chọn), Mô tả. AC2: Milestones: Tên milestone, Chức vụ tương ứng, Yêu cầu kỹ năng tối thiểu (link tới skill requirement của chức vụ). AC3: Thứ tự milestone có thể sắp xếp lại. | Medium |
| US-007 | Là Employee, tôi muốn xem mình đang ở milestone nào và còn thiếu gì để lên milestone tiếp theo, để có kế hoạch phát triển. | AC1: Trang Career Track: timeline với milestone hiện tại được highlight. AC2: Mỗi milestone: % hoàn thành (dựa trên % kỹ năng đạt yêu cầu). AC3: Nút [Xem gap chi tiết] → xem kỹ năng cần cải thiện để đạt milestone tiếp. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Skill matrix load nhanh dù nhiều kỹ năng | Load time | < 2 giây với ≤ 50 kỹ năng × 30 người |
| Data integrity | Không xóa skill đang được gán cho nhân viên | Cascade check | Bắt buộc trước khi xóa |
| Usability | Level description rõ ràng để tránh bias khi đánh giá | N/A | Mỗi level phải có mô tả ≥ 1 câu |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Đánh giá kỹ năng nhân viên**

```
/employees/:id → Tab "Kỹ năng" → [+ Đánh giá kỹ năng]
→ Chọn Skill (search/filter theo danh mục)
→ Chọn Level 1-5 (hiển thị mô tả level để tham khảo)
→ Ghi chú (tuỳ chọn) → [Lưu]
→ POST /api/employee-skills { employeeId, skillId, level, note }
→ Skill xuất hiện trong profile nhân viên
```

**Luồng 2: Xem Skill Gap**

```
/employees/:id → Tab "Kỹ năng" → Tab "Skill Gap"
→ Hệ thống tự tính: employee.role.skillRequirements vs employee.skills
→ Bảng gap: Kỹ năng | Required | Current | Gap
→ [Export PDF/CSV]
```

**Luồng 3: Career Track Progress**

```
/employees/:id → Tab "Career Track"
→ Hiển thị career track được gán
→ Timeline: Milestone 1 (✓) → Milestone 2 (hiện tại, 60%) → Milestone 3 (locked)
→ Click milestone → xem yêu cầu kỹ năng và trạng thái hiện tại
```

---

## 6. Business Rules

### BR-001 — Không xóa Skill đang được sử dụng

Skill đang được gán cho ít nhất 1 nhân viên hoặc đang là yêu cầu của chức vụ → không thể xóa. Chỉ được deactivate (ẩn khỏi danh sách tạo mới, giữ dữ liệu lịch sử).

### BR-002 — Đánh giá Manager ưu tiên hơn Self-Assessment

Khi tính Skill Gap và Career Track progress: nếu có cả self-assessment và manager-assessment → dùng manager-assessment. Self-assessment chỉ hiển thị tham khảo.

### BR-003 — Level kỹ năng từ 1 đến 5

Level hợp lệ: 1 (Cơ bản) → 5 (Chuyên gia). Không có level 0 hoặc level trên 5. Gap âm (current > required) = vượt yêu cầu → không cần action.

### BR-004 — Milestone progress tính theo kỹ năng

```
milestone_progress (%) = (số kỹ năng đạt yêu cầu / tổng kỹ năng yêu cầu) × 100
```
Kỹ năng "đạt" = current level ≥ required level của milestone đó.

### BR-005 — Manager chỉ đánh giá được nhân viên trong team

Manager chỉ có thể thêm/sửa skill assessment cho nhân viên thuộc phòng ban của mình. HR Admin có thể đánh giá tất cả.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem Skill Catalog | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa / Xóa Skill | ❌ | ❌ | ✅ | ✅ |
| Self-assess kỹ năng bản thân | ✅ | ✅ | ✅ | ✅ |
| Đánh giá kỹ năng nhân viên khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xem skill profile nhân viên khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xem Skill Matrix team | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Tạo / Sửa Career Track | ❌ | ❌ | ✅ | ✅ |
| Gán Career Track cho nhân viên | ❌ | ❌ | ✅ | ✅ |
| Xem Career Track bản thân | ✅ | ✅ | ✅ | ✅ |
| Báo cáo skill gap toàn công ty | ❌ | ❌ | ✅ | ✅ |
