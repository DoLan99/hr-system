# Cách tính "Đánh giá hiệu suất"

Tài liệu mô tả chi tiết cách hệ thống HR tính điểm hiệu suất nhân viên — gồm Auto-KPI từ data, Self review, Manager review, và snapshot vào Performance Review cycle.

## Tổng quan

Hệ thống chấm điểm trên **5 tiêu chí cố định** (thang 0-10), với **3 nguồn điểm** chạy song song:

| Nguồn | Ai chấm | Mục đích |
|---|---|---|
| **Auto-KPI** | Hệ thống (từ data Tasks + Time Logs) | Gợi ý khách quan, snapshot vào lúc tạo cycle |
| **Self-review** | Chính nhân viên | Tự đánh giá, viết highlights/challenges/goals |
| **Manager review** | Sếp | **Điểm chính thức** dùng cho lương/thăng chức |

`totalScore` = trung bình cộng 5 tiêu chí (chỉ những tiêu chí có chấm).

5 tiêu chí cố định:
1. **Tốc độ làm việc** (Speed)
2. **Chất lượng** (Quality)
3. **Đúng hạn** (Deadline)
4. **Học hỏi** (Learning)
5. **Chủ động** (Initiative)

---

## 1. Tốc độ làm việc (Speed)

**File:** `lib/kpi/speed.ts`

### Công thức

```
efficiency mỗi task = estimatedTime ÷ actualTimeTotal
Speed Score = median(efficiency) → map sang 0-10
```

Tỷ số `Estimate ÷ Actual` quy ước: **càng cao càng nhanh**.

| efficiency | Ý nghĩa |
|---|---|
| > 1.0 | Làm **nhanh hơn** estimate |
| = 1.0 | Đúng estimate |
| < 1.0 | Làm **chậm hơn** estimate |

### Ví dụ efficiency

| Task | Estimate | Actual | Efficiency |
|---|---|---|---|
| TSK-001 | 60ph | 30ph | 2.0 (nhanh gấp đôi) |
| TSK-002 | 60ph | 60ph | 1.0 (đúng) |
| TSK-003 | 60ph | 90ph | 0.67 (chậm 50%) |
| TSK-004 | 60ph | 120ph | 0.5 (tốn gấp đôi) |

### Tại sao MEDIAN thay vì MEAN

Chống outlier. Ví dụ 7 task với efficiency `[0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 5.0]`:

- **Mean**: 1.57 → điểm sẽ 10/10 (sai)
- **Median**: 1.0 → điểm 8/10 (chuẩn — "đa số task đúng estimate")

Median ignore giá trị đầu/cuối → robust với estimate sai, quên dừng timer, multitask.

### Map median efficiency → điểm

| Median efficiency | Điểm |
|---|---|
| ≥ 1.20× | 10 |
| 1.10× | 9 |
| 1.00× | 8 |
| 0.875× | 7 |
| 0.75× | 6 |
| 0.625× | 5 |
| 0.50× | 4 |
| 0.33× | 2 |
| < 0.33× | 0–2 |

```js
if (eff >= 1.2)   return 10;
if (eff >= 1.0)   return 8 + (eff - 1.0) * 10;
if (eff >= 0.75)  return 6 + (eff - 0.75) * 8;
if (eff >= 0.5)   return 4 + (eff - 0.5) * 8;
if (eff >= 0.33)  return 2 + (eff - 0.33) * 12;
return clamp(eff * 6, 0, 2);
```

### Filter dữ liệu

1. `status = DONE`
2. `dateCompleted` trong tháng
3. `estimatedTime > 0`
4. `actualTimeTotal > 0`
5. `taskType ≠ LEARNING / MEETING / ADMIN` (vì 3 loại này không có "speed" rõ ràng)
6. **Tối thiểu 3 task** sau filter — `<3` → `score: null` ("Không đủ dữ liệu")

---

## 2. Chất lượng (Quality)

**File:** `lib/kpi/quality.ts`

### 2 chỉ số kết hợp

| Chỉ số | Đo gì | Ai cấp |
|---|---|---|
| **Approval rate** | % time log được duyệt | Manager qua workflow approve |
| **Rating** (1-5 sao) | Đánh giá chất lượng từng log | Manager (optional) |

### Bước 1: Lấy tất cả TimeLog trong tháng

KHÔNG filter status — cả PENDING / REJECTED / APPROVED / AUTO_APPROVED đều count vào `total`.

### Bước 2: Min sample 5 logs

`total < 5` → `score: null` ("Chỉ có X time log, cần ≥5").

### Bước 3: Approval Rate

```
approved = số log có status ∈ {APPROVED, AUTO_APPROVED}
approvalPct = approved ÷ total × 100
```

| Status TimeLog | Tính là "approved"? |
|---|---|
| `AUTO_APPROVED` | ✅ Có |
| `APPROVED` | ✅ Có |
| `PENDING` | ❌ Không |
| `REJECTED` | ❌ Không |

### Bước 4: Map approvalPct → score

```js
if (pct >= 95)  return 10;
if (pct >= 85)  return 8 + ((pct - 85) / 10) * 2;   // 85-95 → 8-10
if (pct >= 75)  return 6 + ((pct - 75) / 10) * 2;   // 75-85 → 6-8
if (pct >= 60)  return 4 + ((pct - 60) / 15) * 2;   // 60-75 → 4-6
if (pct >= 40)  return 2 + ((pct - 40) / 20) * 2;   // 40-60 → 2-4
return clamp(pct / 40 * 2, 0, 2);                    // 0-40 → 0-2
```

| approvalPct | approvalScore |
|---|---|
| 100% | 10.0 |
| 95% | 10.0 |
| 90% | 9.0 |
| 85% | 8.0 |
| 75% | 6.0 |
| 70% | 5.33 |
| 60% | 4.0 |
| 50% | 3.0 |
| 40% | 2.0 |
| 0% | 0 |

### Bước 5: Blend với Rating (nếu có ≥3 rating)

```ts
if (ratings.length >= 3) {
  avgRating   = trung bình ratings;            // 1-5
  ratingScore = avgRating × 2;                 // → 2-10
  finalScore  = 0.5 × approvalScore + 0.5 × ratingScore;
} else {
  finalScore  = approvalScore;
}
```

| Rating | ratingScore |
|---|---|
| 1 ⭐ | 2 |
| 3 ⭐⭐⭐ | 6 |
| 5 ⭐⭐⭐⭐⭐ | 10 |

Blend 50/50: approval đo "qua được cổng review" (lượng), rating đo "chất lượng task" (chất). Min 3 ratings để tránh 1 outlier làm méo điểm.

### Ví dụ

**Có rating** (20 logs, 18 approved, 5 logs có rating [4,5,5,4,3]):
```
approvalPct  = 90%        → approvalScore = 9.0
avgRating    = 4.2        → ratingScore   = 8.4
finalScore   = 0.5 × 9.0 + 0.5 × 8.4 = 8.7
```

**Không có rating** (12 logs, 9 approved):
```
approvalPct  = 75%        → approvalScore = 6.0
finalScore   = 6.0
```

---

## 3. Đúng hạn (Deadline)

**File:** `lib/kpi/deadline.ts`

### Công thức

```
onTimePct = (số task DONE đúng hạn) ÷ totalCompleted × 100
baseScore = onTimePct ÷ 10
penalty   = min(2, openOverdueTasks × 0.5)
finalScore = clamp(baseScore − penalty, 0, 10)
```

### Cấu thành

1. **onTimeRatio**: với task `status = DONE` có `dueDate`:
   - `onTime = dateCompleted ≤ dueDate ? 1 : 0`
   - Score base = `(onTime/total) × 10`
2. **Phạt** cho task đang quá hạn (chưa làm xong):
   - Mỗi task quá hạn đang mở: **−0.5đ**
   - Tối đa phạt: **−2đ** (5 task overdue trở lên)
3. **Min sample**: ≥3 task có due date

### Ví dụ

- 10 task DONE có due date, 8 đúng hạn → base = 8.0
- 3 task open đang overdue → penalty = 1.5
- **finalScore = 8.0 − 1.5 = 6.5**

---

## 4. Học hỏi (Learning)

**File:** `lib/kpi/learning.ts`

### Công thức

```
learnMinutes = Σ creditedMinutes của TimeLog có task.taskType = LEARNING
                 + status ∈ {APPROVED, AUTO_APPROVED}
totalMinutes = Σ creditedMinutes của TimeLog APPROVED + AUTO_APPROVED
pct = learnMinutes ÷ totalMinutes × 100
```

### Map pct → score

| Learning pct | Điểm |
|---|---|
| ≥ 15% | 10 |
| 10% | 8 |
| 7% | 6 |
| 4% | 4 |
| 2% | 2 |
| 0% | 0 |

```js
if (pct >= 15) return 10;
if (pct >= 10) return 8 + ((pct - 10) / 5) * 2;
if (pct >= 7)  return 6 + ((pct - 7) / 3) * 2;
if (pct >= 4)  return 4 + ((pct - 4) / 3) * 2;
if (pct >= 2)  return 2 + ((pct - 2) / 2) * 2;
return clamp(pct, 0, 2);
```

### Min sample

`totalHours < 10h` → `score: null` ("Chỉ X.Xh làm việc, cần ≥10h")

### Ví dụ

- Tổng credited 100h trong tháng, 12h là LEARNING task → 12% → **8.8đ**
- Tổng 50h, 0h LEARNING → 0% → **0đ**

---

## 5. Chủ động (Initiative)

**File:** `lib/kpi/initiative.ts`

### Công thức

```
score = 5 (base)
      + min(5, approvedSuggestions × 3)    // mỗi TemplateSuggestion APPROVED: +3 (cap +5)
      + bonus theo NEW_RESEARCH ratio:
          ≥ 10% credited time → +2
          ≥ 5%  credited time → +1
finalScore = clamp(score, 0, 10)
```

### Cấu thành

| Yếu tố | Điểm cộng |
|---|---|
| Base | 5 |
| Mỗi TemplateSuggestion được manager duyệt | +3 (cap +5 tổng) |
| Thời gian R&D (NEW_RESEARCH) ≥10% credited | +2 |
| Thời gian R&D ≥5% (chưa đủ 10%) | +1 |

### Ví dụ

- 0 suggestion, 0% NEW_RESEARCH → **5đ** (base)
- 1 suggestion approved, 8% R&D → 5 + 3 + 1 = **9đ**
- 2 suggestion approved, 12% R&D → 5 + 5 + 2 = **10đ** (cap)

---

## Snapshot vào Performance Review

**File:** `lib/performance-reviews/index.ts`

Khi manager **tạo cycle** (vd Q2 2026), code `snapshotKpiForPeriod()`:

1. Liệt kê **mọi tháng** trong period (vd Q2 = tháng 4, 5, 6 năm 2026)
2. Gọi `computeKpiSuggestion()` cho **từng tháng**
3. **Trung bình hóa** 5 điểm qua các tháng (chỉ tính tháng có score ≠ null)
4. Confidence:
   - `high` nếu data đủ mọi tháng + sample ≥5
   - `medium` nếu ≥½ tháng có data
   - `low` còn lại
5. Lưu vào field `kpiSnapshot` JSON của bảng `performance_reviews` — **đóng băng** tại thời điểm tạo cycle

→ Sau khi snapshot, dù Tasks/TimeLogs có thay đổi, snapshot vẫn giữ nguyên để audit.

---

## Workflow chấm điểm

```
1. Manager → tạo cycle (QUARTERLY / ANNUAL / CUSTOM)
   → system auto-tạo 1 PerformanceReview row/employee ACTIVE
   → snapshot Auto-KPI vào `kpiSnapshot`

2. Nhân viên → mở review của mình
   → thấy cột Auto-KPI gợi ý
   → tự chấm Self (có thể click "Self ← Auto-KPI" copy nhanh)
   → điền selfHighlights / selfChallenges / selfGoalsNext
   → "Gửi self-review" → status: PENDING → SELF_DONE

3. Manager → mở review
   → thấy Auto-KPI + Self side-by-side
   → chấm Manager (có thể "Manager ← Auto-KPI")
   → điền mgrStrengths / mgrAreasToImprove / mgrActionItems
   → optional: recommendedSalaryAdjustPct + recommendedPromotion
   → "Finalize" → status: SELF_DONE → COMPLETED → lock

4. Sau COMPLETED:
   → field tất cả disabled
   → không edit được nữa
   → kết quả hiển thị trong /summary
```

---

## Min sample (ngưỡng tối thiểu data)

Để tránh chấm điểm bừa khi data quá ít:

| KPI | Min sample |
|---|---|
| Speed | ≥3 task DONE có estimate |
| Quality | ≥5 time logs |
| Deadline | ≥3 task DONE có dueDate |
| Learning | tổng ≥10h credited |
| Initiative | luôn có (base 5đ) |

Không đủ → `score: null`, hiện "Không đủ dữ liệu" trong UI, manager tự nhập điểm thay vì dùng gợi ý.

---

## Confidence (mức tin cậy)

Mỗi KPI gợi ý đi kèm `confidence: low | medium | high`:

| Confidence | Ý nghĩa | Khi nào |
|---|---|---|
| **high** | Đáng tin cậy | sample ≥10 (hoặc tương đương) |
| **medium** | Tạm ổn | sample ≥5 |
| **low** | Cẩn trọng | sample <5 |

Hiển thị bằng chấm tròn xanh / xanh dương / xám trong score-modal.

---

## Điểm xuất hiện ở đâu

| Trang | Hiển thị |
|---|---|
| `/performance-reviews` | Review form 3 cột: **Auto-KPI / Self / Manager** + textareas |
| `/summary` | Bảng tháng có `totalScore` + score-modal chỉnh điểm |
| `/summary` (trend chart) | Đường 5 sub-score + tổng theo 6 tháng |

---

## API endpoints liên quan

| Endpoint | Mục đích |
|---|---|
| `GET /api/summary/kpi-suggest?month=&year=&employeeId=` | Lấy gợi ý 5 KPI cho 1 nhân viên/tháng |
| `GET /api/summary/trend?employeeId=&months=6` | Series N tháng cho chart |
| `POST /api/performance-reviews/cycles` | Tạo cycle + snapshot Auto-KPI |
| `GET /api/performance-reviews` | List reviews (filter theo role) |
| `GET /api/performance-reviews/[id]` | Detail 1 review |
| `PUT /api/performance-reviews/[id]` | Update self/manager fields, submit, finalize |

---

## Tinh chỉnh được

Có thể điều chỉnh tại file lib tương ứng:

| Tinh chỉnh | File |
|---|---|
| Ngưỡng map efficiency → điểm Speed | `lib/kpi/speed.ts` (function `efficiencyToScore`) |
| Min sample mỗi KPI | hằng số `MIN_SAMPLES` ở từng file `lib/kpi/*.ts` |
| Ngưỡng approvalPct → điểm Quality | `lib/kpi/quality.ts` (function `approvalPctToScore`) |
| Blend ratio Quality (50/50) | `lib/kpi/quality.ts` (line `0.5 × approvalScore + 0.5 × ratingScore`) |
| Penalty Deadline | `lib/kpi/deadline.ts` (line `Math.min(2, openOverdue × 0.5)`) |
| Bậc thang Learning pct | `lib/kpi/learning.ts` (function `pctToScore`) |
| Bonus Initiative | `lib/kpi/initiative.ts` (suggestion × 3 cap 5, R&D ≥10% +2) |
| Filter task type cho Speed | `EXCLUDED_TYPES` trong `lib/kpi/speed.ts` |
