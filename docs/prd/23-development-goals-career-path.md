# PRD-23 — Development Goals & Career Path Tự động

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Development Goals / Career Path |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager, Employee |
| API chính | `GET/POST /api/development-goals`, `GET /api/skills/career-path`, `POST /api/skills/learning-task` |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Nhân viên muốn phát triển nghề nghiệp nhưng không biết bắt đầu từ đâu: kỹ năng nào cần học, cần đạt level nào, mất bao lâu. Manager muốn hỗ trợ phát triển nhưng thiếu công cụ tracking. Kết quả: mục tiêu phát triển chỉ được thảo luận trong performance review 1-2 lần/năm rồi bị quên — không có hệ thống nhắc, không đo progress.

**3 vấn đề:**
1. Không có chỗ đặt mục tiêu phát triển cá nhân (Development Goals).
2. Không biết mình cần gì để lên cấp tiếp theo (Career Path gap tự động).
3. Khi biết gap rồi vẫn không biết học gì cụ thể → cần auto-generate learning task.

### 1.2 Mục tiêu sản phẩm (Goals)

- Nhân viên/Manager tạo **Development Goals** có thể tracking progress theo %.
- **Career Path tự động:** Dựa trên Career Track được gán (PRD-09) + kỹ năng hiện tại → tính readiness % cho từng level, xác định critical gaps.
- **Auto-generate Learning Task:** Từ skill gap → 1 click tạo task LEARNING với estimate phù hợp.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD Development Goals (link với Skill tùy chọn), Career Path readiness computation, auto-generate learning task từ gap.

**Ngoài phạm vi:** Learning path marketplace/LMS (v2), AI gợi ý nguồn học cụ thể (v2), peer review goal (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **Employee** | Muốn phát triển nghề nghiệp có định hướng rõ ràng. | Biết mình cần làm gì để lên cấp; track được progress. | Không có hệ thống → chỉ biết "phải học thêm" nhưng không cụ thể. |
| **Manager** | Theo dõi và hỗ trợ phát triển của từng thành viên team. | Xem goals của team, cập nhật progress, confirm khi đạt. | Phải nhớ target của từng người, dễ quên sau performance review. |
| **HR Admin** | Đảm bảo nhân viên có kế hoạch phát triển phù hợp với career track. | Dashboard: ai có goal, ai chưa, progress tổng thể. | Không có dữ liệu để báo cáo với leadership về mức độ đầu tư vào talent. |

### 2.2 User Journey

**Employee — Xem Career Path và tạo Learning Task:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào Profile → Tab "Career" → `GET /api/skills/career-path` | Xem career track + readiness % từng level |
| 2 | Click level tiếp theo → Xem critical gaps: Kỹ năng X cần Level 4, hiện tại Level 2 | Hiểu cụ thể cần làm gì |
| 3 | Click [+ Tạo learning task] bên cạnh skill gap | `POST /api/skills/learning-task { skillId, fromLevel: 2, toLevel: 4, estimatedHours: 16 }` |
| 4 | Task `TSK-xxxx: Học React (Intermediate → Advanced)` được tạo tự động, type LEARNING | Bắt đầu học với task tracking |
| 5 | Tạo Development Goal liên kết với skill này | Có thể track progress % |

**Manager — Theo dõi development goals team:**

| Bước | Hành động | Kết quả |
|---|---|---|
| 1 | Vào `/development-goals?department=Engineering` | Xem tất cả goals của team |
| 2 | Thấy nhân viên A goal 45 ngày mà progress = 0% | Identify người cần hỗ trợ |
| 3 | Click → Update `progressPct = 30` sau 1-1 meeting | Cập nhật tiến độ |
| 4 | Khi nhân viên đạt goal → set status = DONE | Mark completed |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Development Goals

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Development Goals | Tạo, sửa, xóa goal: title, description, category, targetDate, skillId (optional), targetLevel (1-5) | Must Have | 5 |
| FR-002 | Progress tracking | progressPct (0-100), status: NOT_STARTED/IN_PROGRESS/DONE/CANCELLED | Must Have | 3 |
| FR-003 | Link với Skill | Goal có thể gắn với Skill cụ thể + targetLevel để tính progress tự động từ skill assessment | Should Have | 5 |
| FR-004 | Manager xem goals của team | Filter theo employeeId, status, targetDate | Must Have | 3 |
| FR-005 | Reminder | Nhắc nhở khi targetDate đến mà chưa DONE | Should Have | 3 |

### 3.2 Career Path Tự động

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-006 | Career Path readiness | `GET /api/skills/career-path`: dựa trên careerTrackId của nhân viên → tính readiness % mỗi level | Must Have | 13 |
| FR-007 | Gap analysis chi tiết | Từng level: list skill gaps với importance (CRITICAL/IMPORTANT/NICE_TO_HAVE), currentLevel vs requiredLevel | Must Have | 5 |
| FR-008 | Level status | ready (≥90%) / almost (≥70%) / developing (≥40%) / early (<40%) | Must Have | 3 |
| FR-009 | Auto-generate Learning Task | `POST /api/skills/learning-task { skillId, fromLevel, toLevel, estimatedHours }` → tạo task LEARNING tự động | Must Have | 5 |
| FR-010 | Weighted readiness | Tính readiness theo weight: CRITICAL = 3×, IMPORTANT = 2×, NICE_TO_HAVE = 1× | Must Have | 3 |

### 3.3 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là Employee, tôi muốn đặt mục tiêu phát triển với deadline và theo dõi tiến độ, để không bỏ quên mục tiêu sau performance review. | AC1: Tạo goal: Title*, Category (Technical/Leadership/Communication/Other), TargetDate, Mô tả, Liên kết Skill + TargetLevel (optional). AC2: progressPct có thể cập nhật bất kỳ lúc nào (0-100). AC3: Status workflow: NOT_STARTED → IN_PROGRESS → DONE/CANCELLED. AC4: Danh sách goals của mình, sort theo targetDate tăng dần. | High |
| US-002 | Là Employee, tôi muốn xem career path của mình với readiness % từng level, để biết chính xác mình còn thiếu gì để lên cấp. | AC1: Career Path page: Timeline các levels từ Junior → Senior trong career track được gán. AC2: Mỗi level: readinessPct (%), status badge (ready/almost/developing/early), số critical gaps. AC3: Level hiện tại được highlight. AC4: Click vào level tiếp → xem full gap list: Skill | Current | Required | Gap | Importance. | High |
| US-003 | Là Employee, tôi muốn auto-generate learning task từ skill gap của mình, để bắt đầu học ngay không cần tạo task thủ công. | AC1: Bên cạnh mỗi skill gap → nút [+ Tạo Learning Task]. AC2: `POST /api/skills/learning-task { skillId, fromLevel, toLevel, estimatedHours }`. AC3: Task được tạo: Code = `TSK-xxxx`, Title = `"Học [SkillName] ([FromLabel] → [ToLabel])"`, TaskType = LEARNING, requiresVideo = true, assignedToId = currentUser. AC4: Task link xuất hiện ngay trong gap row sau khi tạo. | High |
| US-004 | Là Manager, tôi muốn xem và update development goals của team sau 1-1 meeting, để có record tiến trình chứ không chỉ dựa vào trí nhớ. | AC1: `GET /api/development-goals?employeeId=X` → list goals của người đó. AC2: Manager có thể update progressPct và status. AC3: Filter: status, targetDate range. AC4: Nhân viên có goal gần deadline (≤7 ngày) và progress < 50% → hiển thị warning indicator. | High |
| US-005 | Là HR Admin, tôi muốn xem overview development goals của toàn công ty, để báo cáo % nhân viên có development plan. | AC1: Dashboard: Tổng nhân viên có ít nhất 1 goal IN_PROGRESS vs không có goal. AC2: Completion rate: % goals đạt DONE trong quý. AC3: Goals sắp quá hạn (≤7 ngày, chưa DONE). AC4: Breakdown theo phòng ban. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI | Ngưỡng |
|---|---|---|---|
| Performance | Career Path computation | Response time | < 2 giây |
| Accuracy | Readiness % tính đúng theo weighted formula | Sai lệch | 0% |
| UX | Learning task auto-generate | Từ click đến task tạo xong | < 1 giây |

---

## 5. Thiết kế & UX

### 5.1 Công thức Career Path Readiness

```
readinessPct = (Σ weight[i] khi skill[i] met) / (Σ weight[i] tất cả skills yêu cầu) × 100

Weight:
  CRITICAL     → 3
  IMPORTANT    → 2
  NICE_TO_HAVE → 1

skill[i] met = empSkillLevel[i] >= requiredLevel[i]

Status:
  readinessPct ≥ 90% → "ready"
  readinessPct ≥ 70% → "almost"
  readinessPct ≥ 40% → "developing"
  readinessPct < 40% → "early"
```

### 5.2 Learning Task Auto-generate

```
POST /api/skills/learning-task
  { skillId, fromLevel, toLevel, estimatedHours (default 8) }

→ Code: TSK-{seq padded 4}
→ Title: "Học {skillName} ({fromLabel} → {toLabel})"
→ Description: 
    "Auto-generated từ skill gap.
     Skill: {skillName} ({category})
     Level hiện tại: {fromLabel}
     Level cần: {toLabel}"
→ TaskType: LEARNING
→ EstimatedTime: estimatedHours × 60 (phút)
→ RequiresVideo: true  (vì LEARNING task cần evidence video để log)
→ AssignedToId: targetEmployeeId
→ AssignedById: actorId (người click generate)
```

### 5.3 Màn hình chính

| Màn hình | Route | Mô tả |
|---|---|---|
| Development Goals của tôi | `/profile?tab=goals` | Nhân viên xem/quản lý goals của mình |
| Career Path của tôi | `/profile?tab=career` | Readiness per level + gap list |
| Goals của team | `/development-goals` | Manager xem goals toàn team |
| HR Dashboard Goals | `/development-goals/dashboard` | HR overview toàn công ty |

---

## 6. Business Rules

### BR-001 — Career Path chỉ hiển thị khi có Career Track

Nếu nhân viên chưa được gán `careerTrackId` → Career Path tab hiển thị "Bạn chưa được gán Career Track. Liên hệ HR để được thiết lập." Không tính toán readiness nếu không có track.

### BR-002 — Progress % khi link với Skill Assessment

Nếu goal gắn với Skill + TargetLevel:
```
progress_auto = min(100, (currentSkillLevel / targetLevel) × 100)
```
Progress được tính tự động từ skill assessment mới nhất. Vẫn cho phép override thủ công.

### BR-003 — Learning Task phải có RequiresVideo = true

Tất cả task được auto-generate từ skill gap đều có `requiresVideo = true` — yêu cầu nhân viên nộp video evidence khi log time, để Manager có thể verify việc học thực sự xảy ra.

### BR-004 — Không xóa Goal đã DONE

Goal ở trạng thái DONE không thể xóa — chỉ được xem. Để tránh mất lịch sử phát triển. Chỉ CANCELLED và NOT_STARTED mới có thể xóa.

### BR-005 — Reminder 7 ngày trước targetDate

Hệ thống gửi in-app notification cho Employee khi goal có targetDate trong vòng 7 ngày và status chưa DONE. Nếu Manager đã set goal cho Employee → Manager cũng nhận notification.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem/Tạo/Sửa goals của bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem goals của người khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Tạo goal cho người khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Update progress/status của người khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xóa goal của bản thân | ✅ (NOT_STARTED/CANCELLED) | ✅ | ✅ | ✅ |
| Xem Career Path của bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem Career Path của người khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Auto-generate Learning Task cho bản thân | ✅ | ✅ | ✅ | ✅ |
| Auto-generate Learning Task cho người khác | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xem HR Dashboard Goals | ❌ | 👁 (team) | ✅ | ✅ |
