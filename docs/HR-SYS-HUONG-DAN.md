# HR-SYS — Hướng dẫn triển khai & sử dụng

> Hệ thống HR-SYS dùng để quản lý công việc và ghi nhận thời gian làm việc theo Task.
> **Nguyên tắc cốt lõi:** Mọi giờ làm đều phải gắn với 1 Task — không có giờ làm "tự do".
> Phù hợp cho cả nhân viên freelance (tính tiền theo giờ) và full-time (tính lương tháng).

---

## Mục lục

1. [Yêu cầu trước khi dùng](#bước-0--yêu-cầu-trước-khi-dùng)
2. [Setup ban đầu (Quản lý)](#bước-1--setup-quản-lý-điền-1-lần)
3. [Khái niệm Tasks và Time Logs](#bước-2--khái-niệm-tasks-và-time-logs)
4. [Tạo và làm Task](#bước-3--tạo-và-làm-task)
5. [Log thời gian (Time Log)](#bước-4--log-thời-gian-time-log)
6. [Task đặc biệt (Học, việc mới, billable)](#bước-5--task-đặc-biệt)
7. [Quay video bằng chứng (ShareX)](#bước-6--quay-video-bằng-chứng-sharex)
8. [Cấu hình Google Drive for Desktop](#bước-7--cấu-hình-google-drive-for-desktop)
9. [Xem kết quả tổng hợp](#bước-8--xem-kết-quả-tổng-hợp)
10. [Quy tắc chung](#quy-tắc-chung)
11. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
12. [Tips nhanh](#tips-nhanh)

---

## Bước 0 — Yêu cầu trước khi dùng

| Yêu cầu | Chi tiết |
|---|---|
| **Trình duyệt** | Chrome / Edge / Firefox phiên bản mới |
| **ShareX** | Phần mềm quay màn hình — https://getsharex.com |
| **Google Drive for Desktop** | Chế độ **Stream files** — KHÔNG dùng Mirror |
| **Tài khoản** | Email công ty + mật khẩu được Quản lý cấp |

---

## Bước 1 — Setup (Quản lý điền 1 lần)

Quản lý tạo tài khoản nhân viên qua module **Employees**:

| Trường | Mô tả |
|---|---|
| Employee ID | Tự sinh (EMP015) |
| Full name | Họ tên |
| Department | Bộ phận |
| Company | Tên công ty |
| Email (Company) | Email công ty (đăng nhập) |
| Email (Google) | Email Google Drive |
| Pay type | `hourly` (freelance/FT theo giờ) hoặc `monthly` (FT lương tháng) |
| Hourly rate | Mức lương €/giờ (nếu hourly) |
| Monthly salary | Lương tháng € (nếu monthly) |
| Max hours/month | Giới hạn giờ tính lương/tháng (default 160) |
| Manager | Quản lý trực tiếp |

**Quản lý cũng cần setup:**
- **Task Templates** *(tùy chọn)* — tạo các template cho việc lặp lại (Code Review, Daily Standup…) để nhân viên 1-click tạo Task
- **Customers** — danh sách khách hàng (cho task billable)

---

## Bước 2 — Khái niệm Tasks và Time Logs

### Tasks = đơn vị công việc duy nhất

Mọi việc — từ "fix bug 5 phút" đến "phát triển feature 2 tuần" — đều là **1 Task**, có:
- `code` ngắn dạng **TSK-xxxx** (vd: TSK-0042)
- `title` (tên việc)
- `task_type` (loại — xem [Bước 5](#bước-5--task-đặc-biệt))
- `estimated_time` (ước tính giờ — phút)
- `status` (trạng thái — backlog → in_progress → review → done)
- `assigned_to` (ai làm)

> Không còn khái niệm "Task ID từ Library" hay "WL ID" như Excel cũ.
> Cũng không có Work Report độc lập — mọi giờ làm gắn vào 1 Task.

### Time Log = nhật ký thời gian gắn vào Task

Mỗi lần làm việc → tạo 1 Time Log gắn với Task đang làm:
- `duration_minutes` (làm bao lâu)
- `note` (mô tả ngắn lần này)
- `video_link` (nếu task yêu cầu)
- `task_status_after` (cập nhật task: `in_progress` / `blocked` / `review` / `done`)

**Quy tắc số 1:** Time Log **bắt buộc** có Task. Nếu chưa có Task tương ứng → tạo Task trước (chỉ mất vài giây qua quick-create / template), rồi log time.

---

## Bước 3 — Tạo và làm Task

### Cách 1 — Manager giao task

1. Manager vào **Tasks** → **+ New Task** → điền title, type, estimate, due date, assignee
2. Nhân viên thấy task ở trạng thái **backlog** trong board của mình
3. Bắt đầu làm → đổi status sang **in_progress**

### Cách 2 — Nhân viên tự tạo (việc phát sinh)

1. Vào **Tasks** → **+ Quick Task** (form ngắn)
2. Điền `title` + `task_type` + `estimated_time` (ước tính)
3. Auto status = **in_progress**, auto assigned to = bản thân

### Cách 3 — Tạo từ Template (việc lặp lại)

1. Click **From Template** → chọn (vd: `CODE_REVIEW`, `REPLY_EMAIL`, `LEARNING_SESSION`)
2. Các field auto fill từ template — sửa nếu cần
3. Bấm Create

### Cập nhật Task trong khi làm

| Khi nào | Làm gì |
|---------|--------|
| Đang làm | Đổi status → `in_progress`, log time định kỳ |
| Bị chặn (chờ thông tin) | Đổi status → `blocked`, **bắt buộc điền** `reason_next_action` |
| Làm xong, chờ duyệt/QA | Đổi status → `review` |
| Đã được duyệt / xong hẳn | Đổi status → `done` |
| Hủy không làm | Đổi status → `cancelled` |

---

## Bước 4 — Log thời gian (Time Log)

> **Nguyên tắc:** Mỗi phiên làm việc liên tục cho 1 task = 1 Time Log. Không gộp nhiều phiên rời rạc.

### Cách log

Có 2 cách:

**A. Log thủ công** — sau khi làm xong:
1. Vào Task đang làm → tab **Time Logs** → **+ Log Time**
2. Điền: `duration_minutes` (phút), `note` (mô tả), `video_link` nếu cần
3. Cập nhật `completion_pct_after` (% task hoàn thành sau lần này)
4. Set `task_status_after` (review / done nếu xong)

**B. Timer** *(tùy chọn)* — tự động:
1. Vào task → bấm **Start Timer** → làm việc
2. Bấm **Stop** khi xong → hệ thống tự tạo Time Log với duration thực

### Các field bắt buộc / tùy chọn

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `task_id` | ✅ | Tự fill khi log từ trong task |
| `date` | ✅ | Mặc định = hôm nay |
| `duration_minutes` | ✅ | **Tính theo phút** (60 phút = 1 giờ; 1h20 → nhập 80) |
| `note` | ❌ nhưng nên có | Mô tả ngắn để sau này nhìn lại |
| `completion_pct_after` | ❌ | Set khi task chưa xong 100% |
| `video_link` | Có điều kiện | **Bắt buộc** nếu `task.requires_video = TRUE` (xem Bước 5) |
| `proof_links` | Khuyến nghị | Link tài liệu, output, before/after |

### Hệ thống tự tính credited time

Sau khi log, hệ thống chạy logic:

| Tình huống | Kết quả |
|-----------|---------|
| Task type bình thường, **chưa vượt** estimate | Auto-approved, credited = duration |
| Task type bình thường, **đã vượt** estimate, **có** video | Manager review → approve/reject |
| Task type bình thường, **đã vượt** estimate, **không** video | Prorate: chỉ credit phần trong estimate |
| Task type `learning` / `new_research`, **có** video | Manager review |
| Task type `learning` / `new_research`, **không** video | Auto-rejected, credited = 0 |

> **Thiếu video khi cần → giờ KHÔNG được tính (credited = 0).**

---

## Bước 5 — Task đặc biệt

### Phân loại task (`task_type`)

| Task Type | Khi nào dùng | Video | Credited time |
|-----------|--------------|-------|---------------|
| `normal` | Việc thường (dev, admin, support) | Khi vượt estimate | Tự auto trong estimate |
| `learning` | Học công nghệ mới, đọc tài liệu, training | ✅ Bắt buộc | Manager duyệt; tính vào `learn_hours` (KPI) |
| `new_research` | Việc mới chưa biết estimate (làm prototype, R&D) | ✅ Bắt buộc | Manager duyệt; có video → có giờ |
| `meeting` | Họp, daily standup, sync với team/client | ❌ | Tự auto theo duration |
| `admin` | Báo cáo nội bộ, hành chính | ❌ | Tự auto |
| `billable_client` | Việc tính tiền cho khách (chủ yếu freelance) | Khuyến nghị | Tự auto, đẩy vào `billable_hours` |
| `internal` | Việc nội bộ không billable | ❌ | Tự auto |

### Tương ứng với ID Excel cũ

| ID Excel cũ | Task Type mới |
|-------------|---------------|
| `1001` (Học & Tìm hiểu) | `learning` |
| `2001` / `2002` (Việc mới) | `new_research` |
| `DEV*`, `ADM*` | `normal` (dùng template nếu lặp lại nhiều) |

### Task `billable` (cho freelance)

Khi tạo task cho khách hàng:
- Set `billable = TRUE`
- **Bắt buộc** chọn `customer_id`
- Có thể set `hourly_rate_override` nếu khác mức chuẩn
- Mọi credited_minutes của task này → cộng vào `billable_hours` để xuất hóa đơn

---

## Bước 6 — Quay video bằng chứng (ShareX)

### Cài đặt lần đầu

**1. Tải và cài ShareX**
- https://getsharex.com — cài như phần mềm thông thường, không cần đăng nhập

**2. Bật thu âm Microphone (bắt buộc)**
```
Task settings → Screen recorder → Screen recording options
→ Audio source → chọn Microphone (Realtek/USB/Headset)
→ OK
```

**3. Cài FFmpeg để nén video (khuyến nghị)**
```
Task settings → Screen recorder → Screen recording options
→ Download FFmpeg nếu được hỏi
→ Video: Codec H.264/x264, FPS 10–15, CRF 28–30
→ Audio: chọn Microphone
```

**4. Cấu hình lưu video thẳng vào Google Drive**
```
Application settings → Paths
→ Bật "Use custom screenshots folder"
→ Chọn thư mục: [Ổ Google Drive công ty]/HR-SYS/[Employee ID]
```

**5. Đặt tên file tự động — kèm Task code**
```
Paths → Filename pattern: %username_%d.%mo.%Y_
```
Sau khi quay xong → nhấn **F2** để thêm **Task code** + mô tả ngắn

**Ví dụ tên file:**
```
Lan_02.05.2026_TSK-0042_ReviewLogic.mp4
Lan_02.05.2026_TSK-0089_TestAfterDeploy.mp4
Lan_02.05.2026_TSK-0124_NewTaskAnalysis.mp4
```

### Phím tắt ShareX (Windows)

| Thao tác | Phím tắt |
|---|---|
| Quay màn hình | `Shift + PrtSc` |
| Chụp vùng chọn | `Ctrl + PrtSc` |
| Chụp toàn màn hình | `PrtSc` |
| Chụp cửa sổ đang mở | `Alt + PrtSc` |

> Laptop có thể cần giữ thêm phím **Fn**.

### Khi nào BẮT BUỘC kèm video?

- Task `task_type = learning` hoặc `new_research`
- Task `task_type = normal` mà actual_time đã vượt estimated_time
- Task có cờ `requires_video = TRUE` (manager set)

Có thể bổ sung kèm video:
- Test case, bug list
- Output link, file history
- Before/after screenshot
- Checklist, work note

**Thiếu video/link hoặc link không mở được → Time Log đó sẽ bị reject (credited = 0)**

### Lưu ý bảo mật khi quay

- Không để lộ password hoặc thông tin nhạy cảm trên màn hình đang quay
- Dùng màn hình thứ 2 cho dữ liệu nhạy cảm, chỉ quay màn hình 1
- Nếu bắt buộc thao tác với dữ liệu nhạy cảm: tạm dừng quay hoặc che màn hình

### Quay trên điện thoại

| Thiết bị | Cách quay |
|---|---|
| **iPhone (iOS)** | Control Center → Screen Recording |
| **Android** | Quick Settings → Screen record / Screen recorder |
| Android không có sẵn | Cài **AZ Screen Recorder** từ Google Play (không tải APK ngoài) |

Video điện thoại vẫn phải upload vào Google Drive công ty — không chỉ để trong iCloud/Google Photos.

---

## Bước 7 — Cấu hình Google Drive for Desktop

### Thiết lập đúng để không đầy máy

**1. Chọn chế độ Stream files (bắt buộc)**
- Khi cài: chọn **Stream files**
- KHÔNG chọn Mirror files (Mirror lưu offline xuống máy → dễ đầy dung lượng)

**2. Không bật "Available offline" cho thư mục video**
- Stream files: chỉ xem video trực tiếp trên Drive
- Bật offline → máy tải video về → tốn dung lượng

**3. Quy tắc xóa file**
> Xóa file trong thư mục Drive của công ty trên máy = xóa luôn trên Drive
- Không tự ý xóa video để "dọn máy"
- Muốn dọn: tắt Available offline hoặc xóa bản copy ở Desktop/Downloads

**4. Nếu máy vẫn tăng dung lượng bất thường**

Tự kiểm tra 3 bước:
1. Drive for Desktop có đang ở **Stream files** không (bị đặt nhầm Mirror không)?
2. Thư mục video có bị bật **Offline/Available offline** không → tắt đi
3. Mở Drive for Desktop → Settings/Preferences → kiểm tra phần Offline/Storage

Nếu không tự xử lý được: chụp màn hình phần Settings và gửi kèm khi hỏi.

---

## Bước 8 — Xem kết quả tổng hợp

### Module dành cho Nhân viên

| Module | Nội dung |
|--------|----------|
| **Tasks** | Board cá nhân: backlog / in_progress / blocked / review / done |
| **Time Logs** | Lịch sử log thời gian theo ngày/tháng |
| **Summary** (chỉ phần của mình) | Tổng giờ credited, learn_hours, billable_hours, KPI cá nhân |

### Module dành cho Manager

| Module | Nội dung |
|--------|----------|
| **Tasks** (team scope) | Toàn bộ task của team — overdue, blocked, in review |
| **Time Logs Pending** | Queue duyệt log vượt estimate / log task đặc biệt |
| **Template Suggestions** | Đề xuất template từ nhân viên |
| **Estimate Flags** | Auto-flag template có estimate sai (avg actual >>< estimate) |
| **Summary** (team scope) | Tổng giờ, KPI, billable amount của từng nhân viên |

### Các chỉ số chính trong Summary

| Chỉ số | Ý nghĩa |
|--------|---------|
| `credited_hours` | Giờ được ghi nhận (sau approval) |
| `learn_hours` | Giờ học (task_type = learning) |
| `billable_hours` | Giờ tính tiền khách (task.billable = TRUE) |
| `billable_amount` | Tiền billable (€) — dùng xuất hóa đơn freelance |
| `delta_hours` | Giờ thực tại văn phòng - credited |
| `total_score` | Điểm KPI 5 chỉ số (work_speed, quality, learning, deadlines, initiative) |

---

## Quy tắc chung

- **Mọi Time Log phải gắn 1 Task** — không có ngoại lệ
- **1 Task = 1 đơn vị công việc**, dù lớn hay nhỏ
- **1 Time Log = 1 phiên làm việc liên tục**, không gộp nhiều phiên rời
- **Note ngắn gọn, rõ ràng** — đủ để sau này chính mình hoặc người khác nhìn lại vẫn hiểu
- **Mọi công việc trên máy tính mặc định cần có dấu vết số** (video màn hình khi vượt estimate hoặc task đặc biệt)
- **Đặt tên file kèm Task code** (TSK-xxxx) để dễ tìm lại
- **Upload lên Drive công ty mới tính là bàn giao** — dữ liệu trên máy cá nhân/chat chưa tính
- **Status Task phải đúng thực tế:**
  - Bị chặn → đổi sang `blocked` + lý do, đừng để `in_progress` kéo dài
  - Xong rồi → đổi sang `review` hoặc `done`, đừng quên
- **Áp dụng từ ngày hệ thống lên** — task/việc cũ rà soát theo hướng dẫn riêng

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không tạo được Time Log | Task đã `done` hoặc `cancelled` | Mở lại task hoặc tạo task mới |
| Time Log bị reject (credited=0) | Thiếu video cho task `learning`/`new_research` | Quay video bổ sung → tạo log mới |
| Credited time bị prorate | Task vượt estimate, không có video | Quay video → log lại để manager duyệt full |
| Summary lệch | Nhập phút nhầm thành giờ, hoặc task type sai | Sửa lại Time Log (trong 24h) hoặc nhờ manager sửa |
| Không tìm thấy Task | Manager chưa giao, hoặc đã bị `cancelled` | Tự tạo Quick Task hoặc hỏi manager |
| `#REF` / lỗi tính toán | Bug hệ thống | **Không tự fix** — báo SUPER_ADMIN |

---

## Tips nhanh

| Mẹo | Cách làm |
|-----|----------|
| Tìm task nhanh | Search theo `code` (TSK-xxxx) hoặc title |
| Tạo task siêu nhanh | Dùng **Quick Task** hoặc **From Template** |
| Log nhiều task cùng ngày | Mở Time Logs tab → bulk log |
| Việc lặp lại thường xuyên | Đề xuất Template (Module 06b) → tăng KPI `initiative` |
| Test video trước khi quay thật | Quay 5 giây để kiểm tra Microphone hoạt động |
| Video dài | Chia nhỏ, mỗi video dưới 60 phút |
| Freelance: kiểm tra billable | Filter Tasks `billable = TRUE` để xem doanh thu chưa duyệt |
