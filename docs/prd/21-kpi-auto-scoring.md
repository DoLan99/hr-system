# PRD-21 — Tự động tính KPI nhân viên (Auto KPI Scoring)

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | KPI Auto Scoring / Salary Summary |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |
| API chính | `POST /api/summary/calculate`, `GET /api/summary/kpi-suggest`, `GET /api/summary/trend`, `PUT /api/summary/:id` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Mỗi tháng Manager phải đánh giá KPI cho từng nhân viên thủ công — quy trình mất thời gian, thiếu nhất quán và phụ thuộc hoàn toàn vào cảm tính. Dữ liệu thực tế về hiệu suất (time logs, task completion, deadline adherence, learning hours) đã tồn tại trong hệ thống nhưng chưa được tổng hợp thành điểm KPI tự động.

**Vấn đề cụ thể:**
- Manager đánh giá KPI mất 1-2 giờ/người/tháng → hàng chục người = hàng chục giờ.
- Không có tiêu chuẩn rõ ràng → cùng một hiệu suất nhưng Manager khác nhau cho điểm khác nhau.
- Nhân viên không hiểu tại sao mình được điểm đó → thiếu transparency, giảm engagement.
- Không có xu hướng (trend) để nhân viên thấy mình đang tiến bộ hay tụt lùi.

### 1.2 Mục tiêu sản phẩm (Goals)

- Hệ thống **tự động tính gợi ý KPI** dựa trên dữ liệu thực tế (time logs, tasks, office time) cho từng nhân viên mỗi tháng.
- Manager **review và điều chỉnh** gợi ý trước khi confirm — không phải nhập từ đầu.
- Nhân viên **xem điểm KPI của mình** kèm lý giải rõ ràng — biết điểm được tính từ đâu.
- Trend chart theo tháng để nhân viên và Manager thấy tiến trình.
- Tích hợp với **tính lương** (SalarySummary): KPI ảnh hưởng đến bonus %.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:**
- 5 chiều KPI tự động: Tốc độ làm việc, Chất lượng, Học hỏi, Hoàn thành đúng hạn, Chủ động & sáng tạo.
- Gợi ý KPI per nhân viên per tháng với confidence level và lý giải chi tiết.
- Manager review/sửa/confirm.
- Tổng hợp tháng: creditedHours, billableAmount, task stats, lương tính toán.
- Trend chart 6-24 tháng.
- Nhân viên xem điểm của bản thân.

**Ngoài phạm vi:**
- KPI theo OKR/mục tiêu business tự đặt (v2 — xem PRD-17).
- AI tự động confirm không cần Manager review (v2).
- KPI 360° (nhận đánh giá từ peers) (v2).
- Custom weights per dimension per employee (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Manager / HR Admin** | Đánh giá KPI định kỳ cho team; confirm trước khi chốt lương. | Tiết kiệm thời gian: xem gợi ý, chỉnh sửa nếu cần, confirm 1 click. | Hiện tại nhập thủ công từ đầu, tốn thời gian, thiếu basis rõ ràng để giải thích với nhân viên. |
| **Employee** | Biết điểm KPI tháng này, tại sao được điểm đó, so với tháng trước thế nào. | Transparency: thấy con số và lý giải rõ ràng. Trend: thấy mình đang tiến bộ. | Nhận điểm mà không biết được tính thế nào → cảm giác bất công, không biết cải thiện gì. |
| **HR Admin (Finance)** | Dùng KPI để tính bonus, đối chiếu với payroll. | Điểm KPI đã được confirm → tính thẳng vào lương. | Phải tổng hợp điểm từ Manager rồi nhập lại vào bảng lương — 2 lần nhập, dễ sai. |

### 2.2 User Journey

**Manager — Đánh giá KPI tháng:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào `/summary` → Chọn tháng → [Tính KPI] | Trigger `POST /api/summary/calculate` |
| 2 | Hệ thống tính toán: tổng hợp dữ liệu + gợi ý 5 chiều KPI | SalarySummary được tạo/cập nhật |
| 3 | Manager xem kết quả từng người: điểm gợi ý + lý giải + confidence | Review nhanh |
| 4 | Click vào nhân viên cụ thể → Xem chi tiết → Điều chỉnh điểm nếu cần | Override gợi ý |
| 5 | [Confirm] → Điểm được chốt, tính vào totalScore | Unlock payslip |
| 6 | HR chạy payroll → lương tính theo điểm đã confirm | Tích hợp payroll |

**Employee — Xem KPI của bản thân:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào Profile → Tab "KPI" → Chọn tháng | Xem điểm |
| 2 | Xem 5 chiều: điểm + màu sắc + lý giải ngắn gọn | Hiểu basis |
| 3 | Xem Trend chart 6 tháng gần nhất | Thấy tiến trình |
| 4 | Click vào chiều muốn cải thiện → Xem gợi ý cụ thể | Biết cần làm gì |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Tính tổng hợp tháng | `POST /api/summary/calculate`: tổng hợp creditedHours, billableAmount, task stats, lương tính toán cho 1 hoặc tất cả nhân viên | Must Have | 13 |
| FR-002 | Gợi ý 5 chiều KPI | `GET /api/summary/kpi-suggest`: tính gợi ý điểm 5 chiều với confidence + lý giải + details | Must Have | 13 |
| FR-003 | Manager xem bảng tổng hợp | Danh sách nhân viên × tháng: điểm gợi ý, totalScore, creditedHours, salaryCalc | Must Have | 8 |
| FR-004 | Manager override điểm | `PUT /api/summary/:id`: sửa điểm từng chiều; hệ thống tự tính lại totalScore | Must Have | 5 |
| FR-005 | Confirm KPI | Manager confirm → lưu confirmedById + confirmedAt; sau confirm mới tính vào payroll | Must Have | 5 |
| FR-006 | Trend chart nhân viên | `GET /api/summary/trend`: chuỗi dữ liệu theo tháng (scoreX5 + totalScore + completionRate + creditedHours) | Must Have | 8 |
| FR-007 | Nhân viên xem KPI bản thân | Nhân viên xem điểm đã confirm + lý giải từng chiều | Must Have | 5 |
| FR-008 | Confidence indicator | Hiển thị low/medium/high confidence kèm sampleSize cho từng chiều | Should Have | 3 |
| FR-009 | Gợi ý cải thiện | Dựa trên chiều điểm thấp → gợi ý hành động cụ thể | Should Have | 8 |
| FR-010 | Bulk calculate | Tính KPI cho tất cả nhân viên ACTIVE của tháng trong 1 lần trigger | Must Have | 5 |

### 3.2 Chi tiết 5 chiều KPI tự động

| Chiều KPI | Field | Nguồn dữ liệu | Công thức tóm tắt | Thang |
|---|---|---|---|---|
| **Tốc độ làm việc** | `scoreWorkSpeed` | Task DONE có `estimatedTime` + `actualTimeTotal` | Median efficiency = estimatedTime / actualTime → map sang 0-10 | 0-10 |
| **Chất lượng** | `scoreQuality` | TimeLog: `approvalStatus` + `rating` | 50% approval rate + 50% avg rating (nếu có ≥3 ratings) | 0-10 |
| **Học hỏi & phát triển** | `scoreLearning` | TimeLog với task type `LEARNING` | % giờ học / tổng giờ làm → map sang 0-10 | 0-10 |
| **Hoàn thành đúng hạn** | `scoreDeadlines` | Task DONE có `dueDate` | % task đúng hạn × 0.1 − penalty (open overdue) | 0-10 |
| **Chủ động & sáng tạo** | `scoreInitiative` | TemplateSuggestion APPROVED + TimeLog `NEW_RESEARCH` | Base 5đ + bonus đề xuất được duyệt + bonus R&D % | 0-10 |

### 3.3 Công thức tổng điểm

```
totalScore = round( average(scoreWorkSpeed, scoreQuality, scoreLearning, scoreDeadlines, scoreInitiative) × 100 ) / 100
```

Chỉ tính average từ các chiều đã có điểm (không null). Chiều null = không đủ dữ liệu, bị loại khỏi average.

### 3.4 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Manager, tôi muốn trigger tính KPI tháng cho toàn bộ team trong 1 lần, để không phải vào từng người tính riêng. | AC1: `POST /api/summary/calculate { month, year }` không có `employeeId` → tính cho tất cả ACTIVE employees. AC2: Mỗi nhân viên: tạo SalarySummary mới nếu chưa có, hoặc cập nhật nếu đã có. AC3: Trả về `{ data: [...], count: N }` — danh sách đã tính xong. AC4: Nếu nhân viên không có đủ dữ liệu → vẫn tạo record, để trống các score (null). | High |
| US-002 | Là Manager, tôi muốn xem gợi ý KPI cho từng nhân viên kèm lý giải tại sao được điểm đó, để có basis rõ ràng khi review. | AC1: `GET /api/summary/kpi-suggest?employeeId=X&month=M&year=Y` → trả về 5 chiều KPI. AC2: Mỗi chiều: `{ score, confidence: "low"/"medium"/"high", sampleSize, reason, details }`. AC3: `reason` là string mô tả bằng tiếng Việt: VD "8/10 task đúng hạn (80%) − phạt 1đ do 2 task quá hạn đang mở". AC4: `confidence: "low"` → hiển thị cảnh báo "Ít dữ liệu, điểm có thể chưa chính xác". | High |
| US-003 | Là Manager, tôi muốn điều chỉnh điểm gợi ý trước khi confirm, để bổ sung yếu tố định tính mà data không capture được. | AC1: `PUT /api/summary/:id { scoreWorkSpeed: 8.5, scoreQuality: 7 }` → cập nhật các chiều được truyền. AC2: `totalScore` tự động tính lại sau khi update. AC3: Không truyền chiều nào → giữ nguyên giá trị cũ của chiều đó. AC4: Điểm hợp lệ: 0.0 – 10.0 (decimal 1 chữ số). AC5: Audit log ghi: "Score updated by [managerId]". | High |
| US-004 | Là Manager, tôi muốn confirm KPI sau khi đã review, để chốt điểm và cho phép HR tính lương. | AC1: `PUT /api/summary/:id { confirm: true }` → lưu `confirmedById` = managerId, `confirmedAt` = now. AC2: Sau confirm: nhân viên nhận in-app notification "KPI tháng X/20XX đã được chốt". AC3: Payroll chỉ tính totalScore từ SalarySummary đã có `confirmedAt`. AC4: Không thể unconfirm — chỉ Admin mới có thể reset confirm (với audit log). | High |
| US-005 | Là Employee, tôi muốn xem điểm KPI của mình tháng này cùng lý giải, để biết mình đang làm tốt ở đâu và cần cải thiện gì. | AC1: Nhân viên chỉ xem KPI sau khi đã được confirm. AC2: Hiển thị từng chiều: tên chiều + điểm + màu (đỏ <5, vàng 5-7, xanh >7) + `reason` từ gợi ý. AC3: Tổng điểm `totalScore` hiển thị nổi bật. AC4: Rating label: EXCELLENT (≥9) / GOOD (≥7) / AVERAGE (≥5) / NEEDS_IMPROVEMENT (<5). | High |
| US-006 | Là Employee, tôi muốn xem trend KPI của mình 6 tháng gần nhất, để thấy mình đang tiến bộ hay tụt lùi theo thời gian. | AC1: `GET /api/summary/trend?employeeId=X&months=6` → chuỗi 6 tháng theo thứ tự thời gian. AC2: Mỗi điểm dữ liệu: month, year, label, scoreX5, totalScore, completionRate, creditedHours. AC3: Tháng chưa có dữ liệu → trả null (không bỏ qua, giữ nguyên trục thời gian). AC4: Chart line với 5 đường màu khác nhau cho 5 chiều + 1 đường totalScore đậm hơn. | High |
| US-007 | Là Manager, tôi muốn xem bảng tổng hợp tất cả nhân viên trong tháng với điểm và số giờ, để có cái nhìn so sánh toàn team. | AC1: Bảng: Nhân viên | creditedHours | billableAmount | totalTasks | completionRate | totalScore | Trạng thái (Chưa tính/Chưa confirm/Đã confirm). AC2: Sort theo totalScore (cao → thấp mặc định). AC3: Filter theo phòng ban, trạng thái confirm. AC4: Click vào nhân viên → xem chi tiết 5 chiều. | Medium |
| US-008 | Là HR Admin, tôi muốn xem lương tính toán (salaryCalc) và thực tế đã trả (salaryPaid) cùng trong 1 màn hình, để đối chiếu payroll. | AC1: Detail nhân viên: `salaryCalc` (tính từ payType × creditedHours), `bonusCalc` (bonus % × salary), `totalCalc`. AC2: Manager/HR nhập `salaryPaid`, `bonusPaid`, `moneyReceived` sau khi thanh toán. AC3: `deltaMoney = totalCalc − moneyReceived` → hiển thị dương là còn nợ, âm là trả thừa. AC4: Chỉ MANAGER_ROLES mới có thể cập nhật salaryPaid. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Tính KPI bulk cho 100 nhân viên | Thời gian | < 30 giây |
| Performance | Gợi ý KPI đơn lẻ | Response time | < 2 giây |
| Accuracy | Công thức tính score nhất quán | Sai lệch | 0% khi cùng input |
| Transparency | Mọi điểm phải có `reason` string | Coverage | 100% |
| Confidentiality | Nhân viên không xem điểm người khác | Access control | Enforce tại API |
| Auditability | Mọi thay đổi điểm có audit log | Coverage | 100% |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Manager tính KPI tháng cho toàn team**

```
/summary → Chọn tháng/năm → [Tính KPI cho tháng này]
  → POST /api/summary/calculate { month, year }
  → Loading spinner "Đang tổng hợp dữ liệu..."
  → Bảng kết quả: Nhân viên | Giờ làm | Task | Score gợi ý | Confirm status
  → [Xem chi tiết] (từng người)
```

**Luồng 2: Review và confirm từng nhân viên**

```
/summary/:summaryId
  → Header: Tên nhân viên | Tháng X/20XX | Trạng thái
  → Section "Số giờ & Lương":
      creditedHours | billableHours | billableAmount
      salaryCalc | bonusCalc | totalCalc
  → Section "KPI 5 chiều":
      [Lấy gợi ý từ AI] → GET /api/summary/kpi-suggest
      → Điền vào 5 input (đã pre-filled từ gợi ý)
      → Mỗi chiều: Điểm (0-10) + Badge confidence + Reason text
      → totalScore tự tính real-time
  → [Lưu điều chỉnh] → PUT /api/summary/:id { scores... }
  → [Confirm KPI] → PUT /api/summary/:id { confirm: true }
  → Nhân viên nhận notification
```

**Luồng 3: Nhân viên xem KPI**

```
Profile → Tab "KPI" → Chọn tháng
  → Chỉ hiện nếu đã confirmed
  → Radar chart 5 chiều (optional)
  → List 5 chiều: icon + tên + điểm + màu + reason
  → totalScore badge to + rating label
  → Section "Trend" → Line chart 6 tháng
  → "Gợi ý cải thiện" (nếu có chiều < 7)
```

### 5.2 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Bảng tổng hợp tháng | `/summary` | Manager xem toàn team |
| Chi tiết nhân viên | `/summary/:id` | Review + confirm 1 nhân viên |
| KPI cá nhân | `/profile?tab=kpi` | Nhân viên xem KPI của mình |

---

## 6. Business Rules

### BR-001 — Confidence levels theo sampleSize

```
scoreWorkSpeed: low (<3 tasks), medium (3-9), high (≥10)
scoreQuality:   low (<5 logs),  medium (5-9), high (≥10)
scoreLearning:  low (<10h),     medium (10-79h), high (≥80h)
scoreDeadlines: low (<3 tasks), medium (3-9), high (≥10)
scoreInitiative: low (<2 signals), medium (2-4), high (≥5)
```

Chiều confidence = "low" → Manager được nhắc: "Ít dữ liệu, hãy điều chỉnh thủ công nếu có thông tin khác."

### BR-002 — Công thức Tốc độ làm việc (scoreWorkSpeed)

```
efficiency = estimatedTime / actualTimeTotal (median của tất cả task DONE trong tháng)
efficiency ≥ 1.2 → 10đ   (làm nhanh hơn estimate ≥ 20%)
efficiency ≥ 1.0 → 8-10đ (đúng estimate)
efficiency ≥ 0.75 → 6-8đ
efficiency ≥ 0.5 → 4-6đ
efficiency ≥ 0.33 → 2-4đ
efficiency < 0.33 → 0-2đ

Loại trừ taskType: LEARNING, MEETING, ADMIN (không có estimate thực tế)
Cần ≥ 3 task có cả estimatedTime > 0 và actualTimeTotal > 0
```

### BR-003 — Công thức Chất lượng (scoreQuality)

```
approvalScore = f(approvalPct) — map tuyến tính:
  pct ≥ 95% → 10đ | ≥ 85% → 8-10đ | ≥ 75% → 6-8đ | ≥ 60% → 4-6đ | ≥ 40% → 2-4đ | < 40% → 0-2đ

Nếu có ≥ 3 time logs có rating:
  ratingScore = clamp(avgRating × 2, 0, 10)
  finalScore = 0.5 × approvalScore + 0.5 × ratingScore
Nếu không có rating:
  finalScore = approvalScore

Cần ≥ 5 time logs trong tháng
```

### BR-004 — Công thức Học hỏi (scoreLearning)

```
pct = learnMinutes / totalMinutes × 100
pct ≥ 15% → 10đ | ≥ 10% → 8-10đ | ≥ 7% → 6-8đ | ≥ 4% → 4-6đ | ≥ 2% → 2-4đ | < 2% → 0-2đ

learnMinutes = tổng creditedMinutes của time logs có task.taskType = "LEARNING"
totalMinutes = tổng creditedMinutes của tất cả APPROVED/AUTO_APPROVED time logs
Cần totalHours ≥ 10h
```

### BR-005 — Công thức Đúng hạn (scoreDeadlines)

```
baseScore = (onTime / totalWithDeadline) × 10
penalty = min(2, openOverdue × 0.5)
finalScore = clamp(baseScore − penalty, 0, 10)

Cần ≥ 3 task DONE có dueDate trong tháng
openOverdue = task isOverdue=true, status NOT IN (DONE, CANCELLED)
```

### BR-006 — Công thức Chủ động & Sáng tạo (scoreInitiative)

```
Base = 5đ
+bonus: min(5, approvedSuggestions × 3)  [đề xuất template được duyệt trong tháng]
+2đ nếu researchPct ≥ 10%  [task type NEW_RESEARCH / totalMinutes]
+1đ nếu researchPct ≥ 5%

finalScore = clamp(base + bonus, 0, 10)
```

### BR-007 — Nhân viên chỉ xem KPI sau khi confirm

SalarySummary chỉ visible cho nhân viên khi `confirmedAt IS NOT NULL`. Trước confirm → nhân viên không thấy điểm (dù đã tính). Manager thấy ngay sau khi tính.

### BR-008 — Một SalarySummary per nhân viên per tháng

Unique constraint: `(employeeId, month, year)`. Nếu trigger calculate lần 2 cho cùng tháng → UPDATE (không tạo mới). Lịch sử thay đổi được ghi trong AuditLog.

### BR-009 — totalScore tính lại sau mỗi lần sửa điểm

Sau khi Manager `PUT /api/summary/:id` với bất kỳ scoreX nào → `totalScore` tự tính lại. Không cho phép set totalScore trực tiếp (derived field).

### BR-010 — Đơn vị tiền và giờ

```
creditedHours: số giờ đã được duyệt (creditedMinutes / 60)
workHoursReal: số giờ thực tế từ office check-in (officeTime.actualWorked / 60)
deltaHours = workHoursReal − creditedHours (dương = làm nhiều hơn được credit)

salaryCalc:
  HOURLY: creditedHours × hourlyRate
  MONTHLY: monthlySalary (cố định)

bonusCalc = salaryCalc × (bonusMPct + bonusAPct + bonusTPct) / 100
totalCalc = salaryCalc + bonusCalc
```

---

## 7. Gợi ý cải thiện theo chiều điểm thấp

| Chiều | Điều kiện trigger | Gợi ý cho nhân viên |
|---|---|---|
| scoreWorkSpeed | < 6 | "Hãy estimate kỹ hơn trước khi bắt đầu task. Xem lại các task bị over-estimate để tìm nguyên nhân." |
| scoreQuality | < 6 | "Tỷ lệ time log bị reject cao. Hãy đảm bảo log đúng task và đủ mô tả để được duyệt." |
| scoreLearning | < 5 | "Bạn chưa log nhiều giờ học trong tháng. Hãy tạo task type LEARNING cho các buổi training, đọc tài liệu." |
| scoreDeadlines | < 6 | "Bạn có task quá hạn chưa đóng. Hãy cập nhật tiến độ hoặc trao đổi với Manager để điều chỉnh deadline." |
| scoreInitiative | < 5 | "Hãy thử đề xuất quy trình hoặc template mới. Mỗi đề xuất được duyệt cộng thêm điểm đáng kể." |

---

## 8. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem KPI bản thân (đã confirm) | ✅ | ✅ | ✅ | ✅ |
| Xem trend KPI bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem KPI nhân viên khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Trigger tính KPI | ❌ | ✅ | ✅ | ✅ |
| Xem gợi ý KPI (kpi-suggest) | ❌ | ✅ | ✅ | ✅ |
| Sửa điểm KPI (override) | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Confirm KPI | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Reset confirm | ❌ | ❌ | ❌ | ✅ |
| Nhập salaryPaid / bonusPaid | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xem bảng lương (salaryCalc) | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Export bảng KPI tháng | ❌ | ✅ (team của mình) | ✅ | ✅ |

**Ghi chú phân quyền API:**
- `GET /api/summary/kpi-suggest`: `!isManager && employeeId !== self` → 403
- `GET /api/summary/trend`: `!isManager && employeeId !== self` → 403
- `PUT /api/summary/:id`: chỉ MANAGER_ROLES
