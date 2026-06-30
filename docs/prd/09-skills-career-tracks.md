# PRD-09: Kỹ năng & Lộ trình nghề nghiệp (Skills & Career Tracks)

**Module:** Skills / Career Tracks / Employee Skills  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Xây dựng hệ thống quản lý kỹ năng nhân viên, định nghĩa lộ trình thăng tiến (career track) theo từng ngành nghề, so sánh gap kỹ năng giữa nhân viên và yêu cầu vị trí, AI hỗ trợ đề xuất learning path.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD Skills, Career Tracks, Career Levels |
| Manager | Gán kỹ năng cho nhân viên, xem gap report |
| Employee | Khai báo kỹ năng của mình, xem career path |

---

## 3. Luồng chức năng

### 3.1 Quản lý Kỹ năng (Skills)

```
Admin vào /skills → Tab "Quản lý kỹ năng"
    → Tạo kỹ năng: POST /api/skills
        {
          name: "React",
          category: "Frontend",
          description: "...",
          levelDescriptions: {
            1: "Biết cơ bản",
            2: "Có thể làm việc độc lập",
            3: "Thành thạo",
            4: "Chuyên gia",
            5: "Mentor được người khác"
          }
        }
    → Cập nhật / xóa: PUT/DELETE /api/skills/[id]
```

### 3.2 Tạo Career Track & Level

```
Admin vào /skills → Tab "Career Tracks"
    → Tạo Career Track: POST /api/career-tracks
        { name: "Frontend Developer", description }
    → Tạo Level trong track: POST /api/career-tracks/[id]/levels
        { name: "Junior", order: 1, description, salaryRange }
    → Gán kỹ năng yêu cầu cho level:
        POST /api/career-tracks/[id]/levels/[levelId]/skills
        { skillId, requiredLevel: 3 }
    → Cập nhật / xóa level: PUT/DELETE /api/career-tracks/[id]/levels/[levelId]
```

**Ví dụ Career Track "Frontend Developer":**
```
Level 1: Junior Frontend
    - HTML/CSS: level 2
    - JavaScript: level 2
    - React: level 2

Level 2: Mid Frontend  
    - JavaScript: level 3
    - React: level 3
    - TypeScript: level 2
    - Git: level 3

Level 3: Senior Frontend
    - React: level 4
    - TypeScript: level 3
    - Performance Optimization: level 3
    - System Design: level 2
```

### 3.3 Nhân viên khai báo kỹ năng

```
Nhân viên vào hồ sơ → Tab "Kỹ năng"
    → Thêm kỹ năng: POST /api/employee-skills
        { skillId, level: 3, yearsOfExperience: 2 }
    → Cập nhật level: PUT /api/employee-skills/[id]
    → Xóa kỹ năng: DELETE /api/employee-skills/[id]
```

**Hoặc Manager gán kỹ năng cho nhân viên:**
```
Manager vào hồ sơ nhân viên → Tab "Kỹ năng"
    → POST /api/employees/[id]/skills { skillId, level, verifiedByManager: true }
```

### 3.4 Phân tích Gap kỹ năng

```
Nhân viên / Manager:
    → Vào /skills → "Phân tích Gap"
    → Chọn nhân viên + Career Track Target
    → GET /api/skills/career-path?employeeId=&targetLevelId=
    → Hệ thống so sánh:
        - Kỹ năng nhân viên hiện tại vs Yêu cầu level target
        - Hiển thị: ✅ Đạt | ⚠️ Chưa đủ level | ❌ Chưa có
    → Tính % sẵn sàng cho vị trí
```

### 3.5 AI đề xuất Learning Task

```
Dựa trên gap kỹ năng:
    → GET /api/skills/learning-task?employeeId=&skillId=&targetLevel=
    → AI phân tích gap + tạo danh sách task học:
        - Khóa học đề xuất
        - Tài liệu đọc
        - Project thực hành
        - Mentor nội bộ
    → Có thể tạo task học từ đề xuất này
```

### 3.6 Skill Load (Capacity theo kỹ năng)

```
Manager / Admin:
    → GET /api/capacity/skill-load
    → Xem: Skill nào đang thiếu người?
    → Heatmap: kỹ năng vs số người có
    → So sánh với demand từ task backlog
    → Phát hiện bottleneck kỹ năng trong team
```

---

## 4. API Endpoints

### Skills
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/skills` | Danh sách, tạo kỹ năng |
| GET/PUT/DELETE | `/api/skills/[id]` | Chi tiết, cập nhật, xóa |
| GET | `/api/skills/career-path` | Phân tích career path + gap |
| GET | `/api/skills/learning-task` | AI đề xuất task học |

### Career Tracks
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/career-tracks` | Danh sách, tạo track |
| GET/PUT/DELETE | `/api/career-tracks/[id]` | Chi tiết track |
| GET/POST | `/api/career-tracks/[id]/levels` | Levels của track |
| GET/PUT/DELETE | `/api/career-tracks/[id]/levels/[levelId]` | Chi tiết level |
| GET/POST | `/api/career-tracks/[id]/levels/[levelId]/skills` | Kỹ năng yêu cầu |

### Employee Skills
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/employee-skills` | Kỹ năng nhân viên |
| PUT/DELETE | `/api/employee-skills/[id]` | Cập nhật, xóa |
| GET/POST | `/api/employees/[id]/skills` | Kỹ năng của nhân viên cụ thể |

### Role Skill Requirements
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/role-skill-requirements` | Yêu cầu kỹ năng của chức vụ |
| PUT/DELETE | `/api/role-skill-requirements/[id]` | Sửa, xóa |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/skills` | Quản lý skills + career tracks + gap analysis |

---

## 6. Data Model

**Skill:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên kỹ năng |
| `category` | String | Nhóm (Frontend/Backend/Soft skill...) |
| `description` | String | Mô tả |
| `levelDescriptions` | JSON | Mô tả từng level 1-5 |

**EmployeeSkill:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `employeeId` | UUID | FK → Employee |
| `skillId` | UUID | FK → Skill |
| `level` | Int | 1-5 |
| `yearsOfExperience` | Float | Số năm kinh nghiệm |
| `verifiedByManager` | Boolean | Manager xác nhận |
| `verifiedAt` | DateTime | Ngày xác nhận |

**CareerTrack:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên track |
| `description` | String | Mô tả |

**CareerLevel:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `trackId` | UUID | FK → CareerTrack |
| `name` | String | Tên level |
| `order` | Int | Thứ tự (1, 2, 3...) |
| `salaryRange` | JSON | { min, max, currency } |

---

## 7. Business Rules

- Level kỹ năng từ 1 đến 5 (không thể 0 hoặc > 5).
- 1 nhân viên + 1 skill = 1 record (không duplicate).
- Career Track level phải có order duy nhất trong cùng track.
- Kỹ năng khai báo bởi chính nhân viên cần Manager verify để có trọng số cao hơn trong gap analysis.
- Kỹ năng xóa khỏi hệ thống: soft delete, vẫn giữ employee-skill records.
