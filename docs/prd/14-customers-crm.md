# PRD-14: Quản lý Khách hàng / CRM (Customers)

**Module:** Customers / CRM  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-30  

---

## 1. Mục tiêu

Quản lý danh sách khách hàng doanh nghiệp, người liên hệ, lịch sử tương tác và gắn kết công việc với khách hàng. Giúp team Account Management và Sales theo dõi quan hệ khách hàng hiệu quả.

---

## 2. Người dùng liên quan

| Người dùng | Quyền |
|---|---|
| Admin | CRUD khách hàng, xem báo cáo |
| Manager / Account | CRUD khách hàng và liên hệ, ghi activity |
| Employee | Xem khách hàng, ghi activity |

---

## 3. Luồng chức năng

### 3.1 Tạo khách hàng

```
User vào /customers → "Thêm khách hàng"
    → POST /api/customers
        {
          name: "Công ty ABC",
          industry: "Technology",
          size: "50-100",
          website: "https://abc.com",
          address: "123 Nguyễn Huệ, Q1, HCM",
          phone: "028-3456-7890",
          email: "contact@abc.com",
          taxCode: "0123456789",
          status: "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED",
          note,
          assignedTo: employeeId  (Account manager)
        }
    → Tạo Customer record
```

### 3.2 Danh sách & Tìm kiếm

```
/customers
    → GET /api/customers (filter: status, industry, assignedTo, search)
    → Hiển thị: tên, ngành, người phụ trách, trạng thái, lần liên hệ cuối
    → Sort: tên, ngày tạo, lần liên hệ cuối
    → Search: tên công ty, email, MST
```

### 3.3 Chi tiết khách hàng

```
Click khách hàng → /customers/[id]
    → GET /api/customers/[id]
    → Tabs:
        Tab 1 - Thông tin công ty
        Tab 2 - Người liên hệ (Contacts)
        Tab 3 - Lịch sử tương tác (Activities)
        Tab 4 - Tasks liên quan
        Tab 5 - Tài liệu liên quan
```

### 3.4 Quản lý người liên hệ (Contacts)

```
Tab Contacts → "Thêm liên hệ"
    → POST /api/customers/[id]/contacts
        {
          fullName: "Nguyễn Văn A",
          title: "Giám đốc IT",
          email: "a@abc.com",
          phone: "090-123-4567",
          isPrimary: true
        }
    → Cập nhật: PUT /api/customers/[id]/contacts/[contactId]
    → Xóa: DELETE /api/customers/[id]/contacts/[contactId]
```

### 3.5 Ghi nhận hoạt động (Activity Log)

```
Tab Activities → "Ghi hoạt động"
    → POST /api/customers/[id]/activities
        {
          type: "CALL" | "EMAIL" | "MEETING" | "DEMO" | "PROPOSAL" | "OTHER",
          description: "Demo sản phẩm tại văn phòng khách hàng",
          occurredAt: "2026-06-30T10:00:00",
          outcome: "Khách hàng quan tâm, cần gửi proposal",
          nextAction: "Gửi báo giá trước 2026-07-05",
          employeeId: (người thực hiện)
        }
    → Hiển thị timeline activity theo thứ tự thời gian
    → Xem: GET /api/customers/[id]/activities
```

### 3.6 Gắn Task với Khách hàng

```
Khi tạo task → Field "Khách hàng"
    → Gán customerId cho task
    → Trong tab Tasks của customer: xem tất cả task liên quan
    → Filter: đang mở / đã hoàn thành
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/customers` | Danh sách, tạo khách hàng |
| GET/PUT/DELETE | `/api/customers/[id]` | Chi tiết, cập nhật, xóa |
| GET/POST | `/api/customers/[id]/contacts` | Người liên hệ |
| GET/PUT/DELETE | `/api/customers/[id]/contacts/[contactId]` | Chi tiết liên hệ |
| GET/POST | `/api/customers/[id]/activities` | Activity log |

---

## 5. Màn hình UI

| Route | Màn hình |
|---|---|
| `/customers` | Danh sách khách hàng |

---

## 6. Data Model

**Customer:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Tên công ty |
| `industry` | String | Ngành nghề |
| `size` | String | Quy mô (1-10, 10-50, ...) |
| `status` | Enum | PROSPECT / ACTIVE / INACTIVE / CHURNED |
| `assignedTo` | UUID | FK → Employee (account manager) |
| `website` | String | Website |
| `phone` | String | SĐT |
| `email` | String | Email |
| `taxCode` | String | Mã số thuế |
| `address` | String | Địa chỉ |
| `note` | Text | Ghi chú |

**CustomerContact:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `customerId` | UUID | FK → Customer |
| `fullName` | String | Họ tên |
| `title` | String | Chức vụ |
| `email` | String | Email |
| `phone` | String | SĐT |
| `isPrimary` | Boolean | Liên hệ chính |

**CustomerActivity:**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | PK |
| `customerId` | UUID | FK → Customer |
| `type` | Enum | CALL / EMAIL / MEETING / DEMO / PROPOSAL / OTHER |
| `description` | Text | Mô tả |
| `outcome` | Text | Kết quả |
| `nextAction` | Text | Hành động tiếp theo |
| `occurredAt` | DateTime | Thời điểm xảy ra |
| `employeeId` | UUID | FK → Employee |

---

## 7. Business Rules

- Mỗi khách hàng có tối đa 1 account manager.
- Customer không bị xóa cứng (soft delete), giữ history.
- Contact có flag `isPrimary` — mỗi customer chỉ có 1 primary contact.
- Activities ghi nhận mọi tương tác để audit trail đầy đủ.
