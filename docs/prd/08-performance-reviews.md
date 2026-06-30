# PRD-08: Đánh giá Hiệu suất (Performance Reviews)

**Module:** Performance Reviews  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Tổ chức chu kỳ đánh giá hiệu suất nhân viên định kỳ (quý, năm). Bao gồm: tự đánh giá của nhân viên, đánh giá từ manager, tổng hợp điểm, gắn mục tiêu phát triển cá nhân sau đánh giá.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | Tạo chu kỳ, xem toàn bộ kết quả, recalculate, export |
| Manager | Đánh giá nhân viên trong team, xem kết quả team |
| Employee | Tự đánh giá, xem kết quả đánh giá của mình |

---

## 3. Luồng chức năng

### 3.1 Tạo chu kỳ đánh giá (Review Cycle)

```
Admin vào /performance-reviews → Tab "Chu kỳ"
    → Click "Tạo chu kỳ mới"
    → POST /api/performance-reviews/cycles
        {
          name: "Đánh giá Q2/2026",
          period: "Q2_2026",
          type: "QUARTERLY" | "ANNUAL" | "PROBATION" | "CUSTOM",
          startDate: "2026-07-01",
          endDate: "2026-07-31",
          scope: "ALL" | departmentIds[],
          criteria: [
            { name: "Hoàn thành công việc", weight: 30 },
            { name: "Kỹ năng chuyên môn", weight: 25 },
            { name: "Tinh thần team", weight: 20 },
            { name: "Sáng kiến", weight: 15 },
            { name: "Tuân thủ quy định", weight: 10 }
          ]
        }
    → Hệ thống tự động tạo PerformanceReview record cho mỗi nhân viên
       thuộc scope
    → Gửi thông báo cho tất cả nhân viên và manager liên quan
```

### 3.2 Nhân viên tự đánh giá (Self-Review)

```
Nhân viên nhận thông báo → Vào /performance-reviews
    → Thấy "Đánh giá Q2/2026 - Chờ tự đánh giá"
    → Click "Điền tự đánh giá"
    → Với mỗi tiêu chí: cho điểm (1-5) + nhận xét
    → Điền tổng kết tự đánh giá (textarea)
    → Ghi điểm nổi bật, khó khăn gặp phải
    → PUT /api/performance-reviews/[id]
        { selfRatings: [...], selfComment: "..." }
    → Status của self review = SUBMITTED
```

### 3.3 Manager đánh giá nhân viên

```
Manager nhận thông báo khi nhân viên đã self-review
    → Vào /performance-reviews → Tab "Team của tôi"
    → Chọn nhân viên → Xem self-review
    → Điền đánh giá manager:
        - Điểm theo từng tiêu chí (1-5) + nhận xét
        - Nhận xét tổng quát
        - Điểm mạnh, điểm cần cải thiện
        - Kế hoạch phát triển đề xuất
    → PUT /api/performance-reviews/[id]
        { managerRatings: [...], managerComment: "..." }
    → Submit → Status = MANAGER_SUBMITTED
```

### 3.4 Tổng hợp & Tính điểm

```
Admin / Hệ thống tự động:
    → POST /api/performance-reviews/cycles/[id]/recalculate
    → Với mỗi review:
        Điểm tổng = Σ (điểm_tiêu_chí × trọng_số) / 100
        Kết hợp: self_score × 0.3 + manager_score × 0.7 (tuỳ cấu hình)
    → Cập nhật finalScore, rating:
        - 4.5 - 5.0 → EXCELLENT
        - 3.5 - 4.4 → GOOD
        - 2.5 - 3.4 → MEETS_EXPECTATIONS
        - 1.5 - 2.4 → NEEDS_IMPROVEMENT
        - 1.0 - 1.4 → UNSATISFACTORY
    → Status cycle = COMPLETED
```

### 3.5 Nhân viên xem kết quả

```
Admin/Manager publish kết quả
    → Nhân viên vào /performance-reviews
    → Xem điểm tổng, rating, nhận xét của manager
    → So sánh với self-review
    → Xem so sánh với trung bình team (ẩn danh)
```

### 3.6 Gắn mục tiêu phát triển (Development Goals)

```
Sau đánh giá → Manager / Admin tạo Development Goal cho nhân viên:
    → POST /api/development-goals
        {
          employeeId,
          reviewId,
          title: "Nâng cao kỹ năng React",
          description,
          targetDate,
          linkedSkills: [skillId, ...]
        }
    → Nhân viên theo dõi tiến độ goal
    → Cập nhật tiến độ: PUT /api/development-goals/[id] { progress }
    → Mark done: PUT /api/development-goals/[id] { status: "COMPLETED" }
```

### 3.7 Export báo cáo

```
Admin → Export tất cả kết quả chu kỳ
    → Download CSV/Excel với:
        - Tên nhân viên, phòng ban, chức vụ
        - Điểm từng tiêu chí
        - Điểm tổng, rating
        - Nhận xét manager
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/performance-reviews` | Danh sách reviews |
| POST | `/api/performance-reviews` | Tạo review thủ công |
| GET | `/api/performance-reviews/[id]` | Chi tiết review |
| PUT | `/api/performance-reviews/[id]` | Cập nhật self/manager review |
| GET | `/api/performance-reviews/cycles` | Danh sách chu kỳ |
| POST | `/api/performance-reviews/cycles` | Tạo chu kỳ mới |
| GET | `/api/performance-reviews/cycles/[id]` | Chi tiết chu kỳ |
| PUT | `/api/performance-reviews/cycles/[id]` | Cập nhật chu kỳ |
| DELETE | `/api/performance-reviews/cycles/[id]` | Xóa chu kỳ |
| POST | `/api/performance-reviews/cycles/[id]/recalculate` | Tính lại điểm |
| GET/POST | `/api/development-goals` | Mục tiêu phát triển |
| GET/PUT/DELETE | `/api/development-goals/[id]` | Chi tiết, cập nhật, xóa |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/performance-reviews` | Danh sách reviews + chu kỳ |

---

## 6. Data Model

**PerformanceReviewCycle:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên chu kỳ |
| `type` | Enum | QUARTERLY / ANNUAL / PROBATION / CUSTOM |
| `startDate` | Date | Bắt đầu |
| `endDate` | Date | Kết thúc |
| `status` | Enum | DRAFT / ACTIVE / COMPLETED |
| `criteria` | JSON | Mảng tiêu chí + trọng số |

**PerformanceReview:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `cycleId` | UUID | FK → Cycle |
| `employeeId` | UUID | FK → Employee |
| `reviewerId` | UUID | FK → Employee (manager) |
| `selfRatings` | JSON | Điểm tự đánh giá theo tiêu chí |
| `managerRatings` | JSON | Điểm manager theo tiêu chí |
| `selfScore` | Float | Điểm tự đánh giá tổng |
| `managerScore` | Float | Điểm manager tổng |
| `finalScore` | Float | Điểm tổng cuối cùng |
| `rating` | Enum | EXCELLENT / GOOD / MEETS_EXPECTATIONS / NEEDS_IMPROVEMENT / UNSATISFACTORY |
| `status` | Enum | PENDING / SELF_SUBMITTED / MANAGER_SUBMITTED / COMPLETED |

---

## 7. Business Rules

- Manager không thể đánh giá chính mình.
- Chu kỳ chỉ có thể xóa khi ở trạng thái DRAFT.
- Khi nhân viên chưa self-review, manager vẫn có thể đánh giá.
- Recalculate có thể chạy nhiều lần (idempotent).
- Development Goal gắn với review nhưng có thể tạo độc lập.
- Trọng số các tiêu chí trong chu kỳ phải tổng = 100%.
