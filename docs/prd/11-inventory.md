# PRD-11: Tài sản & Thiết bị (Inventory)

**Module:** Inventory Management  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Quản lý toàn bộ tài sản và thiết bị của công ty: nhập kho, cấp phát cho nhân viên, theo dõi tình trạng, thu hồi, và cảnh báo tồn kho thấp.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD tài sản, cấp phát, thu hồi, xuất báo cáo |
| Manager | Xem tài sản của team |
| Employee | Xem tài sản được cấp phát cho mình |

---

## 3. Luồng chức năng

### 3.1 Nhập kho tài sản

```
Admin vào /inventory → "Thêm tài sản"
    → POST /api/inventory/items
        {
          name: "MacBook Pro M3",
          categoryId,
          serialNumber: "FVFXXXXXX",
          purchaseDate: "2026-01-15",
          purchasePrice: 45000000,
          condition: "NEW",
          quantity: 1,
          location: "Kho tầng 2",
          note
        }
    → Tạo InventoryItem record, status = AVAILABLE
    → Tạo transaction: IMPORT
```

### 3.2 Quản lý danh mục (Categories)

```
Admin tạo danh mục: POST /api/inventory/categories
    - Laptop, Desktop, Điện thoại, Bàn ghế, Máy in, ...
    → Dùng để filter và báo cáo theo nhóm
```

### 3.3 Cấp phát tài sản

```
Admin click "Cấp phát"
    → POST /api/inventory/assign
        {
          itemId,
          employeeId,
          assignedAt: now,
          note: "Cấp phát cho nhân viên onboarding"
        }
    → InventoryItem.status = ASSIGNED
    → InventoryItem.assignedTo = employeeId
    → Tạo transaction: ASSIGN
    → Ghi nhận vào lịch sử tài sản
    → Thông báo nhân viên
```

### 3.4 Thu hồi tài sản

```
Admin click "Thu hồi"
    → POST /api/inventory/return { itemId, returnedAt, condition, note }
    → Hoặc: POST /api/inventory/return/[id] (theo transaction)
    → InventoryItem.status = AVAILABLE (hoặc DAMAGED nếu hỏng)
    → InventoryItem.assignedTo = null
    → Tạo transaction: RETURN
```

### 3.5 Xem lịch sử tài sản

```
Admin xem item detail → GET /api/inventory/items/[id]
    → Xem toàn bộ lịch sử: ai nhận, khi nào, trả lại khi nào, tình trạng
    → GET /api/inventory/transactions (filter: itemId, employeeId)
```

### 3.6 Cảnh báo tồn kho thấp

```
GET /api/inventory/low-stock
    → Trả về danh sách items/categories dưới mức tối thiểu
    → Hiển thị cảnh báo trên dashboard Admin
    → Có thể cấu hình ngưỡng cảnh báo per category
```

### 3.7 Báo cáo tài sản

```
Admin → GET /api/inventory/report
    → Tổng tài sản theo danh mục
    → Giá trị tài sản còn lại (sau khấu hao)
    → Tài sản theo nhân viên (ai đang giữ gì)
    → Tài sản sắp hết bảo hành
    → Export CSV/Excel
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/inventory/items` | Danh sách, thêm tài sản |
| GET/PUT/DELETE | `/api/inventory/items/[id]` | Chi tiết, cập nhật, xóa |
| GET/POST | `/api/inventory/categories` | Danh mục tài sản |
| POST | `/api/inventory/assign` | Cấp phát tài sản |
| POST | `/api/inventory/return` | Thu hồi tài sản (tạo mới) |
| PUT | `/api/inventory/return/[id]` | Cập nhật phiếu thu hồi |
| GET | `/api/inventory/transactions` | Lịch sử giao dịch |
| GET | `/api/inventory/low-stock` | Tài sản tồn kho thấp |
| GET | `/api/inventory/report` | Báo cáo tổng hợp |
| GET | `/api/inventory` | Dashboard tổng quan tài sản |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/inventory` | Dashboard + danh sách tài sản + lịch sử |

---

## 6. Data Model

**InventoryItem:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên tài sản |
| `categoryId` | UUID | FK → Category |
| `serialNumber` | String | Số serial |
| `purchaseDate` | Date | Ngày mua |
| `purchasePrice` | Decimal | Giá mua |
| `condition` | Enum | NEW / GOOD / FAIR / DAMAGED / DISPOSED |
| `status` | Enum | AVAILABLE / ASSIGNED / MAINTENANCE / DISPOSED |
| `assignedTo` | UUID | FK → Employee (nullable) |
| `assignedAt` | DateTime | Ngày cấp phát |
| `location` | String | Vị trí lưu trữ |
| `warrantyExpiry` | Date | Ngày hết bảo hành |

**InventoryTransaction:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `itemId` | UUID | FK → InventoryItem |
| `type` | Enum | IMPORT / ASSIGN / RETURN / MAINTENANCE / DISPOSE |
| `employeeId` | UUID | FK → Employee |
| `performedBy` | UUID | FK → Employee (admin) |
| `performedAt` | DateTime | Thời điểm |
| `note` | String | Ghi chú |
| `conditionBefore` | Enum | Tình trạng trước |
| `conditionAfter` | Enum | Tình trạng sau |

---

## 7. Business Rules

- 1 tài sản có serial number chỉ có 1 người giữ tại 1 thời điểm.
- Không thể cấp phát tài sản đang ở trạng thái MAINTENANCE hoặc DISPOSED.
- Thu hồi phải ghi nhận tình trạng tài sản khi trả lại.
- Khi nhân viên nghỉ việc: system cảnh báo còn tài sản chưa trả.
- Tài sản DISPOSED không thể cấp phát lại.
