# PRD-16: Workflow & Phê duyệt (Workflows / Approvals)

**Module:** Workflow Engine / Approvals  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Cung cấp engine workflow linh hoạt để tự động hóa quy trình phê duyệt đa cấp trong tổ chức. Admin có thể thiết kế workflow template cho nhiều loại quy trình (nghỉ phép, mua sắm, đề xuất, ...). Người dùng xem tất cả việc đang chờ mình phê duyệt tại một nơi (/approvals).

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | Tạo/sửa workflow templates, xem tất cả instances |
| Manager | Phê duyệt / từ chối ở bước mình phụ trách |
| Employee | Trigger workflow, theo dõi trạng thái |

---

## 3. Luồng chức năng

### 3.1 Thiết kế Workflow Template

```
Admin vào /workflows → Tab "Templates"
    → "Tạo template mới"
    → POST /api/workflows/templates
        {
          name: "Quy trình xin nghỉ phép",
          triggerType: "LEAVE_REQUEST" | "PURCHASE" | "PROPOSAL" | "CUSTOM",
          steps: [
            {
              order: 1,
              name: "Manager trực tiếp duyệt",
              approverType: "DIRECT_MANAGER" | "ROLE" | "SPECIFIC_EMPLOYEE",
              approverRoleId: null,
              approverEmployeeId: null,
              timeoutHours: 24,  (tự động từ chối nếu không duyệt sau X giờ)
              requiredApprovals: 1
            },
            {
              order: 2,
              name: "HR duyệt",
              approverType: "ROLE",
              approverRoleId: "hr-role-id",
              timeoutHours: 48
            }
          ]
        }
    → Cập nhật: PUT /api/workflows/templates/[id]
    → Xóa: DELETE /api/workflows/templates/[id]
```

### 3.2 Trigger Workflow (Khởi động quy trình)

```
Nhân viên / System trigger workflow:
    → POST /api/workflows/start
        {
          templateId: "leave-workflow-id",
          entityType: "LEAVE_REQUEST",
          entityId: "leave-id",
          title: "Xin nghỉ phép 3 ngày: 5-7/7/2026",
          requestedBy: employeeId,
          data: { ... }   (context data của request)
        }
    → Tạo WorkflowInstance { status: PENDING }
    → Tạo WorkflowStep records cho mỗi bước
    → Kích hoạt bước đầu tiên
    → Gửi thông báo đến người cần duyệt bước 1
```

### 3.3 Phê duyệt từng bước

```
Người phê duyệt nhận thông báo
    → Vào /approvals → Thấy danh sách chờ duyệt của mình
    → GET /api/workflows/pending (filter theo người dùng)
    → Click xem chi tiết request
    → Phê duyệt: POST /api/workflows/instances/[id]/approve
        { stepId, comment: "Đồng ý" }
        → Bước hiện tại = APPROVED
        → Nếu còn bước tiếp: kích hoạt bước kế, gửi thông báo người kế
        → Nếu là bước cuối: Instance = COMPLETED
        → Thông báo người khởi tạo
    → Từ chối: POST /api/workflows/instances/[id]/reject
        { stepId, comment: "Lý do từ chối" }
        → Bước = REJECTED
        → Instance = REJECTED
        → Thông báo người khởi tạo + lý do
```

### 3.4 Hủy workflow

```
Người khởi tạo / Admin:
    → POST /api/workflows/instances/[id]/cancel
        { reason: "Không cần nữa" }
    → Instance = CANCELLED
    → Thông báo đến tất cả người liên quan
```

### 3.5 Trang Approvals (Trung tâm phê duyệt)

```
Mọi người dùng vào /approvals
    → GET /api/workflows/pending (filter: tôi cần duyệt)
    → Hiển thị tất cả request đang chờ mình phê duyệt:
        - Xin nghỉ phép của nhân viên X
        - Đề xuất mua sắm Y
        - Yêu cầu Z
    → Filter theo loại, ngày, người gửi
    → Sort theo ngày tạo / deadline
    → Badge count trên navigation
```

### 3.6 Timeout tự động

```
Cron job hàng giờ:
    → Quét các workflow steps đã quá timeoutHours
    → Tự động REJECT step và REJECT instance
    → Thông báo người khởi tạo: "Yêu cầu đã hết thời gian chờ duyệt"
    → Ghi log timeout reason
```

---

## 4. API Endpoints

### Workflow Templates
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/workflows/templates` | Danh sách, tạo template |
| GET/PUT/DELETE | `/api/workflows/templates/[id]` | Chi tiết, sửa, xóa |

### Workflow Instances
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/workflows/start` | Khởi động workflow |
| GET | `/api/workflows/pending` | Danh sách chờ duyệt (của user hiện tại) |
| GET | `/api/workflows/instances/[id]` | Chi tiết instance + steps |
| POST | `/api/workflows/instances/[id]/approve` | Phê duyệt bước |
| POST | `/api/workflows/instances/[id]/reject` | Từ chối |
| POST | `/api/workflows/instances/[id]/cancel` | Hủy |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/workflows` | Quản lý templates + xem instances |
| `/approvals` | Trung tâm phê duyệt — tất cả chờ duyệt của tôi |

---

## 6. Data Model

**WorkflowTemplate:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên template |
| `triggerType` | Enum | LEAVE / PURCHASE / PROPOSAL / CUSTOM |
| `steps` | JSON | Mảng bước duyệt |
| `isActive` | Boolean | Đang hoạt động |

**WorkflowInstance:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `templateId` | UUID | FK → Template |
| `entityType` | String | Loại entity (leave, purchase...) |
| `entityId` | UUID | ID của entity |
| `requestedBy` | UUID | FK → Employee |
| `currentStep` | Int | Bước hiện tại |
| `status` | Enum | PENDING / APPROVED / REJECTED / CANCELLED / COMPLETED |
| `title` | String | Tiêu đề |

**WorkflowStepRecord:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `instanceId` | UUID | FK → Instance |
| `stepOrder` | Int | Thứ tự bước |
| `approverId` | UUID | FK → Employee |
| `status` | Enum | PENDING / APPROVED / REJECTED / TIMEOUT |
| `comment` | String | Ghi chú khi duyệt |
| `actionAt` | DateTime | Thời điểm hành động |
| `timeoutAt` | DateTime | Deadline tự động |

---

## 7. Business Rules

- 1 entity (leave request) chỉ có 1 workflow instance active tại 1 thời điểm.
- Khi 1 bước bị reject → toàn bộ instance bị REJECTED (không tiếp tục).
- Người approve không thể là người tạo request (trong cùng 1 bước).
- COMPLETED instance không thể thay đổi.
- Admin có thể force-approve/reject bất kỳ instance nào.
- Template deactivated: instances đang chạy vẫn tiếp tục, không tạo instance mới.
