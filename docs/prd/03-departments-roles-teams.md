# PRD-03: Phòng ban, Chức vụ & Team

**Module:** Departments / Roles / Teams  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Quản lý cơ cấu tổ chức của doanh nghiệp bao gồm: phòng ban phân cấp, chức vụ với yêu cầu kỹ năng, và team linh hoạt (cross-functional).

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD đầy đủ phòng ban, chức vụ, team |
| Manager | Xem cơ cấu, xem danh sách nhân viên trong phòng ban mình |
| Employee | Xem cơ cấu tổ chức |

---

## 3. Luồng chức năng

### 3.1 Quản lý Phòng ban (Department)

```
Admin vào /departments
    → Xem cây phòng ban (tree view)
    → Tạo phòng ban gốc: POST /api/departments { name, parentId: null }
    → Tạo phòng ban con: POST /api/departments { name, parentId }
    → Cập nhật: PUT /api/departments/[id]
    → Xóa: DELETE /api/departments/[id]
        → Cảnh báo nếu còn nhân viên trong phòng ban
        → Không cho xóa nếu có phòng ban con
```

**Thông tin phòng ban:**
- Tên phòng ban
- Phòng ban cha (parent department)
- Mô tả
- Trưởng phòng (manager: FK → Employee)
- Số lượng nhân viên (computed)

### 3.2 Quản lý Chức vụ (Role)

```
Admin vào /roles
    → Danh sách chức vụ trong workspace
    → Tạo chức vụ: POST /api/roles { name, departmentId, level }
    → Gán yêu cầu kỹ năng cho chức vụ:
        POST /api/role-skill-requirements
        { roleId, skillId, requiredLevel (1-5) }
    → Xem gap kỹ năng giữa nhân viên và yêu cầu chức vụ
    → Cập nhật / xóa yêu cầu kỹ năng:
        PUT/DELETE /api/role-skill-requirements/[id]
```

**Thông tin chức vụ:**
- Tên chức vụ
- Phòng ban (departmentId)
- Level/cấp bậc (numeric)
- Mô tả, trách nhiệm
- Danh sách yêu cầu kỹ năng (skills + level tối thiểu)

### 3.3 Quản lý Team

```
Admin / Manager vào Settings → Teams
    → Tạo team: POST /api/teams { name, description, leaderId }
    → Thêm thành viên: PUT /api/teams/[id] { memberIds: [...] }
    → Xem team và thành viên
    → Giải thể team: DELETE /api/teams/[id]
```

**Đặc điểm team:**
- Team là cross-functional (nhân viên từ nhiều phòng ban khác nhau)
- Mỗi team có 1 Team Lead
- 1 nhân viên có thể thuộc nhiều team
- Team được gắn vào Sprint / Project để phân công task

---

## 4. API Endpoints

### Departments
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/departments` | Danh sách phòng ban (tree hoặc flat) |
| POST | `/api/departments` | Tạo phòng ban mới |
| GET | `/api/departments/[id]` | Chi tiết phòng ban + nhân viên |
| PUT | `/api/departments/[id]` | Cập nhật phòng ban |
| DELETE | `/api/departments/[id]` | Xóa phòng ban |

### Roles
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/roles` | Danh sách chức vụ |
| POST | `/api/roles` | Tạo chức vụ |
| GET | `/api/roles/[id]` | Chi tiết chức vụ |
| PUT | `/api/roles/[id]` | Cập nhật chức vụ |
| DELETE | `/api/roles/[id]` | Xóa chức vụ |
| GET/POST | `/api/role-skill-requirements` | Yêu cầu kỹ năng của chức vụ |
| PUT/DELETE | `/api/role-skill-requirements/[id]` | Sửa/xóa yêu cầu |

### Teams
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/teams` | Danh sách team |
| POST | `/api/teams` | Tạo team |
| GET | `/api/teams/[id]` | Chi tiết team + thành viên |
| PUT | `/api/teams/[id]` | Cập nhật team / thêm thành viên |
| DELETE | `/api/teams/[id]` | Giải thể team |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/departments` | Cây phòng ban + danh sách chức vụ |
| `/roles` | Danh sách chức vụ + skill requirements |

---

## 6. Business Rules

- Phòng ban có thể lồng nhau nhiều cấp (không giới hạn depth trong v1).
- Không thể xóa phòng ban đang có nhân viên hoặc phòng ban con.
- Không thể xóa chức vụ đang được nhân viên giữ.
- Team không bắt buộc gắn với phòng ban.
- Yêu cầu kỹ năng của chức vụ (role-skill-requirements) được dùng để tính gap kỹ năng trong module Skills.

---

## 7. Điều kiện lỗi

| Tình huống | Xử lý |
|---|---|
| Xóa phòng ban có nhân viên | 409 — "Phòng ban còn nhân viên, không thể xóa" |
| Xóa phòng ban có phòng ban con | 409 — "Cần xóa phòng ban con trước" |
| Tên phòng ban trùng | 409 — "Tên phòng ban đã tồn tại" |
| Xóa chức vụ đang có nhân viên | 409 — "Chức vụ đang có nhân viên sử dụng" |
