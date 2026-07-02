# PRD-03 — Phòng ban, Chức vụ & Team

> **Product Requirements Document**
> Version 1.0 · 02/07/2026 · Status: IN REVIEW

| Trường | Giá trị |
|---|---|
| Module | Departments / Roles / Teams |
| Phiên bản | v1.0 |
| Trạng thái | IN REVIEW |
| Ngày tạo | 02/07/2026 |
| Cập nhật lần cuối | 02/07/2026 |
| Stakeholders | PO, Dev, HR Admin, Manager |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Cơ cấu tổ chức là nền tảng để phân quyền và routing thông báo trong toàn hệ thống. Khi không có cơ cấu rõ ràng trong hệ thống: không biết ai quản lý ai, phép ai gửi cho ai duyệt, báo cáo nhân viên thuộc về phòng ban nào.

### 1.2 Mục tiêu sản phẩm (Goals)

- Admin thiết lập cơ cấu tổ chức (phòng ban, chức vụ, team) phản ánh đúng thực tế công ty.
- Hệ thống tự động routing: đơn nghỉ phép, workflow approval theo cây tổ chức.
- Manager của phòng ban nhận đúng thông báo liên quan đến team mình.

### 1.3 Phạm vi (Scope)

**Trong phạm vi:** CRUD phòng ban phân cấp, CRUD chức vụ với yêu cầu kỹ năng, CRUD team linh hoạt (cross-functional).

**Ngoài phạm vi:** Sơ đồ tổ chức dạng visual org chart (v2), phân quyền phức tạp theo địa điểm/chi nhánh (v2).

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| **HR Admin** | Duy trì cơ cấu tổ chức chính xác, cập nhật khi công ty thay đổi. | CRUD nhanh, không bị lỗi khi rename hay chuyển người. | Không có hệ thống → phải cập nhật thủ công nhiều chỗ khi tái cơ cấu. |
| **Manager** | Biết ai trong team của mình, cấu trúc báo cáo là thế nào. | Xem danh sách nhân viên phòng ban, xem cây tổ chức. | Phải hỏi HR mới biết ai mới vào phòng ban. |

### 2.2 User Journey

**HR Admin — Thiết lập cơ cấu lần đầu:**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Vào /departments → Tạo phòng ban gốc (Kỹ thuật, Marketing...) | Thiết lập tầng 1 |
| 2 | Tạo phòng ban con (Frontend, Backend trong Kỹ thuật) | Cấu trúc phân cấp |
| 3 | Vào /roles → Tạo chức vụ cho từng phòng ban | Gán chức danh |
| 4 | Gán yêu cầu kỹ năng cho từng chức vụ | Định nghĩa tiêu chuẩn |
| 5 | Tạo team cross-functional | Team linh hoạt |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | CRUD Phòng ban | Tạo, sửa, xóa phòng ban; hỗ trợ phân cấp (parent-child) | Must Have | 5 |
| FR-002 | Xem cây phòng ban | Tree view thể hiện cấu trúc phân cấp | Must Have | 3 |
| FR-003 | CRUD Chức vụ | Tạo, sửa, xóa chức vụ gắn với phòng ban | Must Have | 3 |
| FR-004 | Gán yêu cầu kỹ năng cho chức vụ | Link chức vụ với kỹ năng yêu cầu + level tối thiểu | Should Have | 5 |
| FR-005 | CRUD Team | Tạo team cross-functional, thêm/xóa thành viên | Must Have | 5 |
| FR-006 | Gán nhân viên vào phòng ban/chức vụ/team | Quản lý từ trang Employee hoặc từ trang phòng ban | Must Have | 3 |

### 3.2 User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HR Admin, tôi muốn tạo cấu trúc phòng ban phân cấp, để phản ánh đúng cơ cấu tổ chức thực tế của công ty. | AC1: Tạo phòng ban với: Tên (bắt buộc), Mô tả, Phòng ban cha (tuỳ chọn), Trưởng phòng (FK → Employee). AC2: Tree view hiển thị đúng cấu trúc phân cấp. AC3: Không giới hạn số cấp phòng ban. | High |
| US-002 | Là HR Admin, tôi muốn xóa phòng ban, để dọn dẹp khi tái cơ cấu, nhưng hệ thống phải cảnh báo nếu còn người trong đó. | AC1: Không cho xóa phòng ban đang có nhân viên — hiển thị "Còn X nhân viên". AC2: Không cho xóa phòng ban đang có phòng ban con. AC3: Sau khi xóa thành công: phòng ban biến mất khỏi tree. | High |
| US-003 | Là HR Admin, tôi muốn tạo chức vụ và gán yêu cầu kỹ năng, để hệ thống Skills có thể tính gap kỹ năng của nhân viên. | AC1: Tạo chức vụ: Tên, Phòng ban, Level (numeric), Mô tả. AC2: Gán kỹ năng yêu cầu: chọn Skill + Level tối thiểu (1-5). AC3: Xem danh sách yêu cầu kỹ năng của chức vụ dạng bảng. | High |
| US-004 | Là Manager, tôi muốn tạo team cross-functional, để quản lý nhóm dự án không theo phòng ban. | AC1: Tạo team: Tên, Mô tả, Team Lead (FK → Employee). AC2: Thêm thành viên từ bất kỳ phòng ban nào. AC3: 1 nhân viên có thể thuộc nhiều team. AC4: Xóa team: cảnh báo nếu team đang có sprint active. | Medium |

---

## 4. Yêu cầu phi chức năng

| Loại | Yêu cầu | KPI |
|---|---|---|
| Performance | Tree view phòng ban load nhanh | < 1 giây với ≤ 100 phòng ban |
| Data Integrity | Không orphan node trong tree | Cascade check trước khi xóa |

---

## 5. Thiết kế & UX

### 5.1 Luồng màn hình

**Luồng 1: Tạo phòng ban**

```
/departments → [+ Thêm phòng ban]
→ Form: Tên* | Mô tả | Phòng ban cha | Trưởng phòng
→ [Lưu] → Hiển thị trong tree
```

**Luồng 2: Gán yêu cầu kỹ năng cho chức vụ**

```
/roles → Click chức vụ → Tab "Kỹ năng yêu cầu"
→ [+ Thêm yêu cầu] → Chọn Skill | Level tối thiểu
→ Lưu → POST /api/role-skill-requirements
```

---

## 6. Business Rules

### BR-001 — Không xóa phòng ban đang có người hoặc phòng ban con

Trước khi xóa phòng ban: kiểm tra (1) không còn nhân viên nào thuộc phòng ban này, (2) không có phòng ban con. Vi phạm một trong hai → từ chối xóa với thông báo rõ ràng.

### BR-002 — Không xóa chức vụ đang được nhân viên giữ

Chức vụ đang có nhân viên giữ không thể xóa. Admin phải chuyển nhân viên sang chức vụ khác trước.

### BR-003 — Team là cross-functional

Team không bắt buộc gắn với phòng ban. 1 nhân viên có thể thuộc nhiều team cùng lúc. Không giới hạn số lượng team một người thuộc về.

### BR-004 — Trưởng phòng phải là nhân viên trong workspace

Trưởng phòng (manager của department) phải là Employee đang ACTIVE trong cùng workspace.

---

## 7. Phân quyền

| Hành động | Employee | Manager | HR Admin | Admin |
|---|---|---|---|---|
| Xem cây phòng ban | ✅ | ✅ | ✅ | ✅ |
| Tạo / Sửa / Xóa phòng ban | ❌ | ❌ | ✅ | ✅ |
| Tạo / Sửa / Xóa chức vụ | ❌ | ❌ | ✅ | ✅ |
| Gán yêu cầu kỹ năng | ❌ | ❌ | ✅ | ✅ |
| Tạo team | ❌ | ✅ | ✅ | ✅ |
| Thêm/xóa thành viên team | ❌ | ✅ (team của mình) | ✅ | ✅ |
| Xóa team | ❌ | ✅ (team của mình) | ✅ | ✅ |
