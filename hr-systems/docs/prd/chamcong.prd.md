# LeaveMS — Quản lý chấm công

> **Product Requirements Document**
> Version 1.0 · 03/03/2026 · Status: DONE

| Trường | Giá trị |
|---|---|
| Sản phẩm | LeaveMS |
| Phiên bản | v1.1 |
| Trạng thái | IN REVIEW |
| PM / PO | Nguyễn Thị Thảo |
| Ngày tạo | 02/03/2026 |
| Cập nhật lần cuối | 12/03/2026 |
| Stakeholders | PO, Dev, QA, Hành chính, Admin chi nhánh |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Bối cảnh & Vấn đề

Bộ phận Hành chính hiện quản lý toàn bộ dữ liệu chấm công thông qua file Excel — từ nhập liệu, đối chiếu đến tổng hợp báo cáo cuối tháng. Quy trình thủ công này phát sinh nhiều vấn đề: tốn thời gian xử lý, dễ mắc lỗi khi dữ liệu lớn, thiếu tính minh bạch và khó truy vết khi có sai lệch.

Tính năng này được xây dựng để số hóa quy trình chấm công, tự động tổng hợp dữ liệu và giảm thiểu thao tác thủ công — từ đó giúp Hành chính rút ngắn thời gian xử lý và đảm bảo độ chính xác của thông tin.

### 1.2 Mục tiêu sản phẩm (Goals)

**Mục tiêu kinh doanh:**

- Giảm thời gian tổng hợp công của bộ phận Hành chính xuống ít nhất [X]% so với quy trình hiện tại. X sẽ update sau khi vận hành
- Loại bỏ sai sót do nhập liệu thủ công, đảm bảo dữ liệu chấm công chính xác 100%.
- Chuẩn hóa quy trình chấm công trên toàn công ty, dễ kiểm soát và truy vết.

**Mục tiêu người dùng:**

- Hành chính có thể xem và tổng hợp dữ liệu công nhanh chóng mà không cần thao tác trên Excel.
- Nhân viên chủ động tra cứu được lịch sử chấm công của bản thân.
- Quản lý dễ dàng theo dõi tình hình công của nhân viên theo thời gian thực.

### 1.3 Phạm vi (Scope)

**Trong phạm vi (In Scope):**

- Quản lý ca làm việc (tạo, cấu hình, phân công theo phòng ban)
- Bảng chấm công nhân viên (xem, chỉnh sửa, chốt công theo kỳ)
- Thiết lập kỳ chấm công, ngày reset phép lũy kế và các cài đặt khác
- Quản lý ngày lễ, Tết
- Quản lý ngày phép nhân viên (theo dõi, điều chỉnh thủ công)
- Truy thu / Bù công

**Ngoài phạm vi (Out of Scope):**

- Tích hợp thiết bị chấm công vật lý
- Quản lý chấm công cho team DVKH

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Personas

| Persona | Mô tả | Nhu cầu chính | Pain Point |
|---|---|---|---|
| Hành chính, Admin chi nhánh | Phụ trách cấu hình hệ thống chấm công, theo dõi công toàn công ty. Không nhất thiết có nền tảng kỹ thuật. | Thiết lập ca làm việc, kỳ chấm công, ngày lễ; xem và chốt bảng công theo tháng; quản lý phép và điều chỉnh truy thu/bù công. | Mất nhiều thời gian tổng hợp dữ liệu từ nhiều phòng ban; dễ nhầm lẫn khi chỉnh sửa thủ công trên Excel; khó kiểm soát khi có nhiều ca và lịch đặc biệt (Tết, T7 luân phiên). |
| Nhân viên | Nhân viên chính thức, thử việc hoặc cộng tác viên tại các phòng ban KiotViet. | Xem bảng công cá nhân theo tháng, kiểm tra số ngày phép còn lại, theo dõi lịch sử nghỉ phép. | Cuối tháng mới biết mình bị ghi nhận sai công; không rõ phép còn lại bao nhiêu và lũy kế hết hạn khi nào. |
| Quản lý phòng ban (Team Lead / Manager) | Trưởng phòng hoặc quản lý trực tiếp, theo dõi công của team. | Xem tổng quan công, phép của nhân viên trong phòng, nắm được ai đi muộn/vắng mặt bất thường, thừa nhiều phép. | Thiếu cái nhìn tổng hợp nhanh theo phòng ban; cuối tháng mới xem được; phải hỏi HC từng trường hợp thay vì tự tra cứu được. |

### 2.2 User Journey (tóm tắt)

**Hành chính, Admin chi nhánh**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Thiết lập ca làm việc (tên, giờ, ngày, phòng ban) | Cấu hình ca trước khi vận hành |
| 2 | Cấu hình kỳ chấm công, ngày reset lũy kế và các cấu hình khác | Xác định chu kỳ tính công hàng tháng |
| 3 | Khai báo ngày lễ, Tết theo năm | Hệ thống tự tính công nghỉ lễ đúng |
| 4 | Theo dõi bảng công hàng tháng, chỉnh sửa khi cần | Đảm bảo dữ liệu chính xác trước khi chốt |
| 5 | Xử lý truy thu / bù công phát sinh | Điều chỉnh các trường hợp ngoại lệ |
| 6 | Chốt công theo kỳ | Khóa dữ liệu, chuyển sang tính lương |
| 7 | Quản lý ngày phép nhân viên, điều chỉnh thủ công nếu cần | Đảm bảo số phép chính xác theo chính sách |

**Nhân viên**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Xem bảng công cá nhân theo tháng | Kiểm tra hệ thống ghi nhận đúng không |
| 2 | Xem chi tiết ngày cụ thể (giờ vào, giờ ra, tổng giờ) | Phát hiện sai sót nếu có |
| 3 | Giải trình với hành chính khi bị ghi nhận thiếu công trong trường hợp không có/sai dữ liệu chấm công | Hành chính cập nhật lại công chuẩn |
| 4 | Kiểm tra số ngày phép còn lại và lịch sử nghỉ phép | Chủ động lên kế hoạch nghỉ |

**Quản lý phòng ban**

| Bước | Hành động | Mục tiêu |
|---|---|---|
| 1 | Xem bảng công tổng hợp của team theo kỳ | Nắm tình hình chuyên cần toàn phòng |
| 2 | Lọc theo phòng ban, phát hiện bất thường (NKL, đi muộn nhiều) | Xử lý kịp thời |
| 3 | Xem chi tiết từng nhân viên khi cần xác nhận | Hỗ trợ HC phê duyệt giải trình |

---

## 3. Yêu cầu chức năng (Functional Requirements)

### 3.1 Danh sách tính năng

| ID | Tính năng | Mô tả | Độ ưu tiên | SP |
|---|---|---|---|---|
| FR-001 | Quản lý ca làm việc | Tạo, chỉnh sửa, kích hoạt/vô hiệu hóa các loại ca; cấu hình giờ vào/ra, ngày làm việc, phòng ban áp dụng | Must Have |  |
| FR-002 | Cấu hình ca luân phiên T7 | Thiết lập lịch làm việc thứ 7 theo từng tháng (sáng/chiều/cả ngày/nghỉ) cho ca có lịch luân phiên | Must Have |  |
| FR-003 | Thiết lập kỳ chấm công | Cấu hình ngày bắt đầu – kết thúc kỳ mặc định và ngoại lệ riêng từng tháng | Must Have |  |
| FR-004 | Thiết lập ngày reset phép lũy kế và các cài đặt khác | Cấu hình ngày/tháng/giờ hệ thống tự động reset phép lũy kế hàng năm; các cài đặt khác | Must Have |  |
| FR-005 | Quản lý ngày lễ, Tết | Khai báo các kỳ nghỉ lễ theo năm, áp dụng cho toàn công ty hoặc từng phòng ban | Must Have |  |
| FR-006 | Bảng chấm công tổng hợp | Xem công toàn bộ nhân viên theo kỳ; lọc theo phòng ban, địa điểm; xuất Excel | Must Have |  |
| FR-007 | Bảng chấm công cá nhân | Nhân viên xem lịch công theo tháng với đầy đủ ký hiệu trạng thái từng ngày | Must Have |  |
| FR-008 | Chi tiết chấm công từng ngày | Xem giờ vào/ra, tổng giờ, phút đi muộn/về sớm; nhập giải trình | Must Have |  |
| FR-009 | Chỉnh sửa chấm công thủ công | HC/Admin chỉnh sửa dữ liệu công của nhân viên khi có sai sót | Must Have |  |
| FR-010 | Chốt công theo kỳ | Khóa dữ liệu chấm công theo từng địa điểm sau khi xác nhận; không thể chỉnh sửa sau khi chốt (setting người chốt công) | Must Have |  |
| FR-011 | Quản lý ngày phép nhân viên | Xem tổng hợp phép toàn công ty; chi tiết phép từng người (cơ bản, thâm niên, lũy kế, còn lại) | Must Have |  |
| FR-012 | Điều chỉnh phép thủ công | HC/Admin thêm/bớt ngày phép cho nhân viên kèm ghi chú lý do | Must Have |  |
| FR-013 | Lịch sử giao dịch phép | Xem toàn bộ lịch sử cộng phép, nghỉ phép, reset theo từng thời điểm | Must Have |  |
| FR-014 | Truy thu / Bù công | Tạo, chỉnh sửa, xóa các khoản truy thu hoặc bù công theo kỳ phát sinh và kỳ áp dụng | Must Have |  |
| FR-015 | Cấu hình cho phép đi muộn / về sớm | Thiết lập ngưỡng phút tối đa cho phép đi muộn/về sớm theo từng loại ca | Must Have |  |
| FR-016 | Miễn chấm công cá nhân | Cấu hình danh sách nhân viên không bắt buộc chấm công trong từng ca | Must Have |  |
| FR-017 | Duyệt hàng loạt đơn nghỉ phép | HC/Admin có thể chọn nhiều đơn nghỉ phép và duyệt/từ chối cùng lúc thay vì xử lý từng đơn | Must Have |  |
| FR-018 | Tạo đơn nghỉ thai sản tự động (script) | Hệ thống tự động tạo đơn nghỉ loại "Nghỉ thai sản" cho nhân viên đang nghỉ thai sản chưa đến hẹn đi làm | Must Have |  |
| FR-019 | Import phép các tháng đã qua | HC/Admin upload file do Hành chính cung cấp để hệ thống cập nhật dữ liệu phép các tháng trong quá khứ (áp dụng năm 2026) | Must Have |  |
| FR-020 | Kiểm soát thời hạn tạo và duyệt đơn nghỉ phép | Chặn nhân viên tạo đơn sau 12:00 ngày 26; chặn Quản lý duyệt đơn sau 18:30 ngày 26 theo kỳ công tháng N | Must Have |  |

> **Ghi chú độ ưu tiên:**
> - `Must Have` — Bắt buộc có trong MVP
> - `Should Have` — Quan trọng, cần có trong giai đoạn gần
> - `Nice to Have` — Tốt nếu có, có thể đưa vào backlog

### 3.2 User Stories

> Định dạng: _Là một [persona], tôi muốn [hành động], để [lợi ích]._

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | Là HC/Admin, tôi muốn tạo và cấu hình các loại ca làm việc với giờ vào/ra, ngày làm việc và phòng ban áp dụng, để nhân viên được theo dõi công đúng theo lịch của mình. | AC1: Tạo được ca với đầy đủ thông tin bắt buộc (tên, mã, loại, giờ vào/ra, ngày làm việc). AC2: Ca mới hiển thị trong danh sách và có thể áp dụng cho phòng ban. | High |
| US-002 | Là HC/Admin, tôi muốn cấu hình lịch làm việc thứ 7 luân phiên theo từng tháng, để hệ thống tính công đúng cho nhân viên có lịch T7 xen kẽ. | AC1: Chọn được từng tuần T7 trong tháng và gán ca (sáng/chiều/cả ngày/nghỉ). AC2: Lịch T7 lưu riêng theo tháng và phản ánh đúng trên bảng công. | High |
| US-003 | Là HC/Admin, tôi muốn thiết lập kỳ chấm công mặc định và cấu hình riêng cho từng tháng ngoại lệ, để chu kỳ tính công luôn chính xác kể cả dịp Tết hay lịch đặc biệt. | AC1: Cấu hình được ngày bắt đầu/kết thúc kỳ mặc định. AC2: Thiết lập được kỳ riêng cho từng tháng. | High |
| US-004 | Là HC/Admin, tôi muốn cấu hình ngày reset phép lũy kế hàng năm, để hệ thống tự động reset đúng thời điểm mà không cần thao tác thủ công. | AC1: Thiết lập được ngày, tháng, giờ cụ thể để reset. AC2: Hệ thống tự động reset đúng thời điểm và ghi nhận vào lịch sử giao dịch phép. | High |
| US-005 | Là HC/Admin, tôi muốn khai báo các ngày lễ, Tết theo năm cho toàn công ty hoặc từng phòng ban, để hệ thống tự động ghi nhận đúng ký hiệu nghỉ lễ trên bảng công. | AC1: Thêm được kỳ nghỉ lễ với tên, ngày bắt đầu/kết thúc, phòng ban áp dụng. AC2: Ngày lễ hiển thị đúng ký hiệu trên bảng công nhân viên. | High |
| US-006 | Là HC/Admin, tôi muốn xem bảng công tổng hợp toàn bộ nhân viên theo kỳ, để nhanh chóng phát hiện bất thường trước khi chốt công. | AC1: Hiển thị đủ các cột: công chuẩn, công thực tế, NKL, đi muộn/về sớm, ngày phép,… AC2: Lọc được theo phòng ban, địa điểm và xuất Excel. | High |
| US-007 | Là Nhân viên, tôi muốn xem lịch chấm công cá nhân theo tháng, để kiểm tra hệ thống ghi nhận công của mình có chính xác không. | AC1: Hiển thị đúng ký hiệu trạng thái từng ngày (X, P, L, NKL, TS…). AC2: Xem được chi tiết từng ngày khi nhấn vào, từng tháng khác nhau. | High |
| US-008 | Là Nhân viên, tôi muốn xem chi tiết giờ vào/ra từng ngày. | AC1: Hiển thị giờ vào, giờ ra, tổng giờ, tổng phút đi muộn/về sớm. | High |
| US-009 | Là HC/Admin, tôi muốn chỉnh sửa thủ công dữ liệu chấm công của nhân viên, để sửa các sai sót do quên chấm công hoặc lỗi hệ thống. | AC1: Chỉnh sửa được trạng thái công từng ngày. AC2: Lưu lại lịch sử người chỉnh sửa và thời điểm thay đổi. | High |
| US-010 | Là HC/Admin, tôi muốn chốt công sau khi kiểm tra xong, để dữ liệu không bị thay đổi khi chuyển sang bước tính lương. | AC1: Chốt được tất cả phòng ban. AC2: Đã chốt thì không chốt lại được. AC3: Không thể chỉnh sửa dữ liệu sau khi đã chốt. | High |
| US-011 | Là HC/Admin, tôi muốn xem số ngày phép của từng nhân viên bao gồm phép cơ bản, thâm niên và lũy kế, để đảm bảo quyền lợi phép được áp dụng đúng chính sách. | AC1: Hiển thị đủ phép năm cơ bản, phép thâm niên, phép lũy kế (kèm ngày hết hạn), phép còn lại. AC2: Xem được chi tiết theo từng tháng trong năm. | High |
| US-012 | Là HC/Admin, tôi muốn điều chỉnh thủ công số ngày phép của nhân viên kèm ghi chú lý do, để xử lý các trường hợp ngoại lệ không có trong quy tắc tự động. | AC1: Thêm hoặc bớt được số ngày phép với ghi chú lý do. AC2: Thay đổi được ghi vào lịch sử giao dịch phép. AC3: Hệ thống tự động cập nhật lại Phép còn lại và các thông tin liên quan. | High |
| US-013 | Là HC/Admin, tôi muốn xem toàn bộ lịch sử giao dịch phép của từng nhân viên, để kiểm tra và giải thích khi có sai lệch về số ngày phép. | AC1: Hiển thị đầy đủ các giao dịch: cộng phép, nghỉ phép, reset, điều chỉnh thủ công theo thứ tự thời gian. AC2: Lọc được theo năm. | High |
| US-014 | Là HC/Admin, tôi muốn tạo các khoản truy thu hoặc bù công cho nhân viên, để điều chỉnh lương đúng với thực tế phát sinh từ kỳ trước. | AC1: Tạo được bản ghi với đầy đủ thông tin: kỳ phát sinh, kỳ áp dụng, loại, số lượng, lý do chi tiết. AC2: Chỉnh sửa và xóa được bản ghi. AC3 (Bù công): Hệ thống hỏi "Có trừ phép không?" — nếu Có thì trừ phép và cộng 1 công tính lương; nếu Không thì không trừ phép và cộng 1 công tính lương. AC4 (Truy thu): Hệ thống tự động trừ vào công tính lương. AC5: Nếu chọn "Có trừ phép" nhưng nhân viên không còn đủ phép, hệ thống hiển thị thông báo lỗi và không cho phép lưu — HC/Admin phải chuyển sang chọn "Không trừ phép" hoặc xử lý bằng NKL thủ công. AC6: Chỉ role Hành chính và Admin chi nhánh được sửa hoặc xóa bản ghi truy thu/bù công. AC7: Không thể sửa hoặc xóa bản ghi thuộc kỳ đã chốt công — hệ thống hiển thị thông báo rõ lý do khi người dùng cố thực hiện. | High |
| US-015 | Là HC/Admin, tôi muốn cấu hình số phút tối đa cho phép đi muộn/về sớm theo từng loại ca, để không phạt oan nhân viên vì sai lệch nhỏ. | AC1: Nhập được số phút tối đa cho phép đi muộn và về sớm riêng biệt cho từng ca. AC2: Hệ thống không tính phạt nếu trong ngưỡng cho phép. | High |
| US-016 | Là HC/Admin, tôi muốn cấu hình danh sách nhân viên được miễn chấm công theo từng ca, để những nhân viên có vai trò đặc biệt không bị đánh dấu vắng mặt sai. | AC1: Thêm/xóa được nhân viên khỏi danh sách miễn chấm công trong từng ca. AC2: Nhân viên được miễn không bị cảnh báo vắng mặt khi không có dữ liệu chấm công. AC3: Nhân viên tính công chuẩn theo đúng ca đã cài đặt. | High |
| US-017 | Là HC/Admin, tôi muốn duyệt nhiều đơn nghỉ phép cùng lúc, để tiết kiệm thời gian xử lý vào cuối kỳ khi số đơn phát sinh lớn. | AC1: Có thể chọn nhiều đơn bằng checkbox. AC2: Thực hiện duyệt/từ chối hàng loạt qua 1 thao tác. AC3: Trạng thái từng đơn cập nhật chính xác sau khi xử lý hàng loạt. | High |
| US-018 | Là HC/Admin, tôi muốn hệ thống tự động tạo đơn nghỉ thai sản cho nhân viên đang trong thời gian nghỉ thai sản chưa đến hẹn đi làm, để không phải nhập thủ công từng trường hợp. | AC1: Script chạy được và tạo đúng đơn nghỉ loại "Nghỉ thai sản" cho danh sách nhân viên liên quan. AC2: Đơn tạo ra có đủ thông tin: mã NV, kỳ áp dụng, loại nghỉ. AC3: Audit log ghi nhận đơn được tạo tự động bởi hệ thống. | High |
| US-019 | Là HC/Admin, tôi muốn import file phép các tháng đã qua do Hành chính cung cấp, để hệ thống có đủ dữ liệu lịch sử phép từ đầu năm 2026. | AC1: Hệ thống nhận và xử lý được file theo đúng định dạng quy định. AC2: Dữ liệu phép được cập nhật chính xác vào đúng tháng tương ứng. AC3: Có thông báo kết quả import (thành công / lỗi từng dòng). | High |
| US-020 | Là Nhân viên và Quản lý, tôi muốn hệ thống kiểm soát thời hạn tạo và duyệt đơn nghỉ phép theo kỳ công, để dữ liệu phép đảm bảo kịp thời cho việc chốt công. | AC1: Nhân viên không thể tạo đơn nghỉ cho kỳ tháng N sau 12:00 ngày 26. AC2: Quản lý không thể duyệt đơn nghỉ cho kỳ tháng N sau 18:30 ngày 26. AC3: Hệ thống hiển thị thông báo rõ ràng khi người dùng cố tạo hoặc duyệt ngoài thời hạn. | High |

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | KPI / Ngưỡng |
|---|---|---|
| Performance | Thời gian tải bảng công (có thể lên đến hàng nghìn nhân viên) phải nhanh; các thao tác lưu, chỉnh sửa phản hồi tức thì; có loading khi đang tải. | < 5 giây với dataset ≤ 1.500 nhân viên; 99.9% uptime. |
| Security | Phân quyền theo vai trò (HC/Admin, Manager, Employee); nhân viên chỉ xem được dữ liệu của bản thân. | Theo chuẩn OWASP Top 10; HTTPS bắt buộc; log toàn bộ thao tác chỉnh sửa dữ liệu công. |
| Scalability | Hệ thống hoạt động ổn định khi KiotViet mở rộng số lượng nhân viên và phòng ban. | Hỗ trợ tối thiểu 1.500 nhân viên đồng thời; dễ dàng mở rộng theo chiều ngang. |
| Usability | Giao diện thân thiện với HC/Admin không có nền tảng kỹ thuật; thuật ngữ sử dụng tiếng Việt phổ thông; thao tác chính hoàn thành trong ≤ 3 bước. | SUS Score > 70; HC/Admin mới có thể sử dụng thành thạo sau ≤ 2 giờ làm quen. |
| Compatibility | Hỗ trợ các trình duyệt và thiết bị phổ biến trong môi trường văn phòng. | Chrome, Firefox, Edge (2 phiên bản mới nhất); responsive trên màn hình ≥ 1280px. |
| Availability | Hệ thống phải sẵn sàng liên tục, đặc biệt vào cuối kỳ chấm công khi HC thực hiện chốt công. | 99.9% monthly uptime; bảo trì theo lịch, thông báo trước 24h. |
| Data Integrity | Dữ liệu chấm công sau khi chốt không thể bị thay đổi; mọi chỉnh sửa trước khi chốt phải có audit trail. | 100% thao tác chỉnh sửa được ghi log với thông tin người dùng và timestamp. |

---

## 5. Thiết kế & UX (Design & UX)

### 5.1 Wireframes / Mockups

Thiết kế chi tiết được thực hiện trên Figma:
🔗 [CRM 2025.2 – Module Chấm công](https://www.figma.com/design/uvsONXMAAHAvVpNZPDZZxC/CRM-2025.2?node-id=1723-2)

**Mô tả các màn hình chính:**

| Màn hình | Mô tả |
|---|---|
| Quản lý ca làm việc | Danh sách các loại ca; form thêm/chỉnh sửa ca với cấu hình giờ, ngày làm việc, phòng ban áp dụng. |
| Cấu hình ca luân phiên T7 | Giao diện chọn từng tuần T7 trong tháng và gán loại ca (sáng/chiều/cả ngày/nghỉ). |
| Thiết lập khác | Bảng cấu hình kỳ mặc định và kỳ riêng từng tháng theo dạng timeline năm; các cài đặt khác. |
| Bảng chấm công tổng hợp (HC/Admin, Quản lý) | Table view toàn bộ nhân viên theo kỳ; filter phòng ban, địa điểm; popup chi tiết từng ngày. |
| Bảng chấm công cá nhân (Employee) | Calendar view theo tháng với ký hiệu màu sắc từng trạng thái ngày công. |
| Quản lý ngày lễ, Tết | Danh sách kỳ nghỉ lễ; form khai báo ngày nghỉ mới. |
| Quản lý ngày phép nhân viên | Danh sách tổng hợp phép; màn hình chi tiết phép từng người theo năm và lịch sử giao dịch. |
| Truy thu / Bù công | Danh sách các khoản truy thu/bù công; form thêm mới với đầy đủ thông tin kỳ phát sinh và kỳ áp dụng. |

### 5.2 Design System / Branding

- **Màu sắc chính:** KiotViet Blue, White
- **Component library:** Tham chiếu Figma CRM 2025.2

### 5.3 Luồng màn hình (Screen Flow)

**Luồng 1: Hành chính cấu hình hệ thống (lần đầu)**

```
Thiết lập kỳ chấm công
→ Cấu hình ngày reset lũy kế
→ Khai báo ngày lễ, Tết
→ Tạo loại ca làm việc
→ Phân công ca cho phòng ban
```

**Luồng 2: Tạo ca làm việc mới**

```
Quản lý ca làm việc
→ [Thêm loại ca]
→ Nhập thông tin ca (tên, mã, giờ, ngày làm việc)
→ Chọn phòng ban áp dụng
→ Cấu hình cho phép đi muộn/về sớm
→ Lưu
→ Hiển thị trong danh sách
```

**Luồng 3: HC/Admin theo dõi và chốt công hàng tháng**

```
Bảng chấm công tổng hợp
→ Lọc theo kỳ / phòng ban / địa điểm
→ Xem chi tiết ngày bất thường
→ Chỉnh sửa thủ công (nếu cần)
→ Xử lý truy thu / bù công (nếu có)
→ Xác nhận chốt công
→ Hoàn tất
```

**Luồng 4: Nhân viên kiểm tra công cá nhân**

```
Bảng chấm công cá nhân
→ Xem lịch tháng
→ Nhấn vào ngày cụ thể
→ Xem chi tiết giờ vào/ra
```

**Luồng 5: Xử lý dữ liệu chấm công sai hoặc thiếu**

```
Nhân viên phát hiện sai sót / không có dữ liệu chấm công
→ Liên hệ Hành chính kèm thông tin ngày, lý do
→ HC/Admin mở Bảng chấm công tổng hợp
→ Tìm nhân viên và ngày cần sửa
→ Chỉnh sửa thủ công giờ vào/ra hoặc cập nhật trạng thái ngày công
→ Ghi nhận giải trình lý do chỉnh sửa
→ Lưu
→ Hệ thống cập nhật lại dữ liệu công và thống kê tháng
```

**Luồng 6: HC/Admin xuất bảng chấm công**

```
Bảng chấm công tổng hợp
→ Chọn kỳ / phòng ban / địa điểm cần xuất
→ [Xuất Excel]
→ Tải file về máy
```

**Luồng 7: HC/Admin quản lý ngày phép**

```
Quản lý ngày phép
→ Xem danh sách tổng hợp toàn công ty
→ Chọn nhân viên
→ Xem chi tiết phép theo năm (cơ bản / thâm niên / lũy kế)
→ Điều chỉnh thủ công (nếu cần)
→ Xem lịch sử giao dịch phép
```

**Luồng 8: HC/Admin tạo truy thu / bù công**

```
Truy thu / Bù công
→ [Thêm mới]
→ Nhập mã NV / họ tên
→ Chọn kỳ phát sinh và kỳ áp dụng
→ Chọn loại (truy thu / bù công)
→ Nhập số lượng và lý do chi tiết
→ Lưu
→ Công tự động cộng cho kỳ tương ứng
```

> ⚠️ Toàn bộ thao tác chỉnh sửa dữ liệu công được ghi **audit log** (người sửa, thời điểm, nội dung thay đổi).

---

## 6. Business Rules

> Nguồn tham chiếu: Nội quy lao động KiotViet v1.9 (hiệu lực 26/01/2025), Điều 7.

### BR-001 — Điều kiện hưởng phép năm

Chỉ áp dụng cho CBNV đã ký **hợp đồng lao động chính thức**. CBNV thử việc được tích lũy phép nhưng chỉ được sử dụng sau khi kết thúc thử việc.

### BR-002 — Số ngày phép cơ bản

| Loại | Số ngày |
|---|---|
| Phép năm cơ bản | 12 ngày/năm |
| Tối đa (bao gồm thâm niên) | 20 ngày/năm |

### BR-003 — Phép thâm niên

Cứ mỗi **5 năm** làm việc liên tục, CBNV được cộng thêm **1 ngày phép/năm**.

| Thâm niên | Phép năm |
|---|---|
| < 5 năm | 12 ngày |
| 5 – 9 năm | 13 ngày |
| 10 – 14 năm | 14 ngày |
| 15 – 19 năm | 15 ngày |
| ≥ 20 năm | 16 ngày |
| *(tối đa)* | 20 ngày |

### BR-004 — Cách tính phép tháng đầu tiên

| Trường hợp | Phép tháng đó |
|---|---|
| Vào làm **trước** ngày 15 | Được hưởng 1 ngày phép |
| Vào làm **từ** ngày 15 trở đi | Không được hưởng phép tháng đó |

### BR-005 — Công thức tính phép còn lại

```
Phép còn lại = Phép năm cơ bản + Phép thâm niên + Phép lũy kế - Phép đã dùng
```

> Trong đó: Phép lũy kế = phép dư từ năm trước chưa sử dụng hết (xem BR-006).

### BR-006 — Phép lũy kế (carry-over)

- Phép dư cuối năm **không được quy đổi thành tiền**.
- Phép dư được chuyển sang **Quý I năm tiếp theo** và phải sử dụng hết.
- Hệ thống **tự động reset** phép lũy kế vào ngày cấu hình (xem FR-004). Tại KiotViet, ngày reset hiện tại là **25/03** hàng năm.
- Phép lũy kế hết hạn sau ngày reset; số ngày chưa dùng sẽ bị xóa.

### BR-007 — Nửa ngày phép

Nghỉ buổi sáng (8h00–12h00 hoặc 8h30–12h00) hoặc buổi chiều (13h30–17h30 hoặc 13h30–18h00) tính là **0.5 ngày phép**.

### BR-008 — Tạm ứng phép năm

Áp dụng cho CBNV (trừ khối Kinh doanh và DVKH) có thời gian làm việc chính thức **≥ 12 tháng**.


Tối đa tạm ứng **3 ngày/năm**.

### BR-009 — Ký hiệu trạng thái ngày công

**Bảng ký hiệu đầy đủ:**

| Ký hiệu | Ý nghĩa |
|---|---|
| X | Đi làm cả ngày |
| X/2 | Đi làm sáng thứ 7 |
| XU | Đi làm nửa ngày, NKL nửa ngày |
| XP | Đi làm nửa ngày, nghỉ phép nửa ngày |
| P | Nghỉ phép cả ngày |
| P/2 | Nghỉ phép sáng thứ 7 |
| PU | Nghỉ phép nửa ngày, NKL nửa ngày |
| CĐ | Nghỉ chế độ cả ngày (tang gia, cưới hỏi,…) |
| CĐ/2 | Nghỉ chế độ sáng thứ 7 |
| CĐP | Nghỉ chế độ nửa ngày, nghỉ phép nửa ngày |
| CĐU | Nghỉ chế độ nửa ngày, NKL nửa ngày |
| TS | Nghỉ thai sản cả ngày |
| TS/2 | Nghỉ thai sản sáng thứ 7 |
| L | Nghỉ lễ, Tết cả ngày |
| L/2 | Nghỉ lễ, Tết sáng thứ 7 |
| U | NKL / Nghỉ bảo hiểm cả ngày |
| U/2 | NKL / Nghỉ bảo hiểm sáng thứ 7 |
| -- | Không đi làm (không có ca làm việc) |

**Điều kiện xác định ký hiệu:**

| Ký hiệu | Điều kiện xác định |
|---|---|
| X, X/2, XP, XU | Dựa vào dữ liệu check-in/check-out thực tế theo ca đã cấu hình trong hệ thống |
| L, L/2 | Dựa vào cài đặt ngày nghỉ lễ, Tết đã khai báo trong hệ thống |
| P, P/2, XP, PU, CĐP | Có đơn nghỉ phép đã được Quản lý duyệt |
| CĐ, CĐ/2, CĐP, CĐU | Có đơn nghỉ chế độ (tang gia, cưới hỏi,…) đã được duyệt |
| TS, TS/2 | Có đơn / quyết định nghỉ thai sản được ghi nhận trong hệ thống |
| U, U/2, XU, PU, CĐU | Không có đủ dữ liệu check-in/check-out **hoặc** có đơn nghỉ không lương **hoặc** có đơn nghỉ ốm đau theo chế độ BHXH đã tạo |
| -- | Không có ca làm việc được phân công cho nhân viên trong ngày đó |

> **Lưu ý quan trọng:** Hệ thống chỉ ghi nhận dữ liệu chấm công từ **6:01 sáng** trở đi (có thể cấu hình). Check-in trước 6:01 sẽ bị bỏ qua và không tính là hợp lệ.

### BR-020 — Ghi nhận phép bù sau OT đêm

- Nhân viên làm **OT đêm** (tăng ca ngoài giờ làm việc ban đêm) được ghi nhận **+0.5 ngày phép bù**.
- Phép bù được **cộng vào số ngày phép** của nhân viên nếu nhân viên **không nghỉ bù** (không có đơn Nghỉ bù tương ứng).
- Nếu nhân viên đã đăng ký nghỉ bù → không cộng thêm phép; ngày nghỉ bù được ghi nhận theo ký hiệu **NB** trên bảng công.
- Audit log ghi nhận nguồn phát sinh phép (OT đêm ngày nào, ca nào).

### BR-010 — Quy tắc tính công chuẩn theo ca

| Nhóm | Công chuẩn |
|---|---|
| Khối Phát triển sản phẩm, Hỗ trợ | 8 tiếng/ngày, T2–T6 |
| Khối Kinh doanh KiotViet Software | 8 tiếng/ngày, T2–T7 (linh hoạt thứ 7 theo cài đặt) |
| Khối Back Office | T2–sáng T7 |
| Khối DVKH | hệ thống update ver sau |

> Nghỉ trưa 1.5 tiếng **không tính** vào giờ làm việc. Chi tiết xem [Nội quy lao động](https://drive.google.com/file/d/1nTEpqqRj-nciLtPLMUlTXYqO6tpaj7R1/view)

### BR-011 — Vi phạm đi muộn / về sớm (khối ngoài Kinh doanh)

| Mức vi phạm | Hình thức |
|---|---|
| 1 – 15 phút | Trừ Thưởng YTCLCV tương đương 15 phút |
| 16 – 30 phút | Trừ tương đương 30 phút |
| 31 – 60 phút | Trừ tương đương 1 giờ |
| 61 – 120 phút | Trừ tương đương 2 giờ |
| > 120 phút | Trừ tương đương ½ ngày |
| Quên chấm công | Trừ tương đương ½ ngày |

> Rule này ảnh hưởng trực tiếp đến cấu hình FR-015 (ngưỡng cho phép đi muộn/về sớm).

### BR-012 — Slot đi muộn / về sớm hàng tháng

- Mỗi nhân viên có tối đa **3 slot đi muộn/về sớm mỗi tháng** (slot = 1 ngày sử dụng ân hạn).
- Mỗi ngày sử dụng slot, tổng thời gian đi muộn + về sớm **không vượt quá 2 tiếng**.
- **Trường hợp đặc biệt:** Nhân viên đang hưởng chế độ **con nhỏ** được phép đi muộn/về sớm tối đa **3 tiếng/ngày** (thay vì 2 tiếng).
- Hết slot trong tháng → áp dụng BR-013.

> ⚠️ Hành chính cần cấu hình danh sách nhân viên đang hưởng chế độ con nhỏ để hệ thống tự động áp ngưỡng đúng.

### BR-013 — Xử lý đi muộn / về sớm khi đã hết slot

Khi nhân viên đã hết 3 slot đi muộn/về sớm trong tháng, áp dụng theo tổng giờ vi phạm trong ngày:

| Tổng giờ đi muộn + về sớm | Hình thức xử lý |
|---|---|
| ≤ 2 tiếng | Trừ lương tương ứng số giờ vi phạm |
| > 2 tiếng | Trừ **0.5 ngày phép** |

> Nếu nhân viên không còn phép, trường hợp > 2 tiếng sẽ xử lý theo NKL (Nghỉ không lương) nửa buổi.

### BR-014 — Giới hạn đi muộn theo giờ trong ngày

- Đi muộn tối đa **2 tiếng/ngày** và **không quá 10:30** (tức là vào muộn nhất lúc 10:30 đối với ca bắt đầu 8:30).
- Nếu nhân viên đến sau mốc thời gian giới hạn hoặc muộn hơn 2 tiếng → hệ thống tự động tính **nghỉ nửa buổi** (buổi sáng hoặc buổi chiều tương ứng) cho ngày đó.

| Thời điểm vào/về | Xử lý |
|---|---|
| Muộn ≤ 2h và vào trước 10:30 | Ghi nhận đi muộn theo số phút thực tế |
| Muộn > 2h hoặc vào sau 10:30 | Tính **nghỉ buổi sáng** (0.5 ngày) |
| Về sớm > 2h trước giờ kết thúc ca | Tính **nghỉ buổi chiều** (0.5 ngày) |

### BR-015 — Bù công: logic trừ phép và tính công

Khi HC/Admin tạo bản ghi **Bù công**, hệ thống yêu cầu chọn:

| Tùy chọn | Trừ phép | Công tính lương |
|---|---|---|
| **Có trừ phép** | Trừ 1 ngày phép | Cộng +1 công |
| **Không trừ phép** | Không trừ phép | Cộng +1 công |

> Cả hai trường hợp đều cộng +1 công tính lương. Sự khác biệt chỉ ở việc có trừ phép hay không.

### BR-016 — Truy thu: logic trừ công tính lương

Khi HC/Admin tạo bản ghi **Truy thu**:
- Hệ thống tự động **trừ vào công tính lương** của nhân viên tại kỳ áp dụng.
- Không có tùy chọn trừ phép.

### BR-017 — Duyệt hàng loạt đơn nghỉ phép

- HC/Admin được phép chọn nhiều đơn nghỉ phép và thực hiện duyệt hoặc từ chối cùng lúc.
- Kết quả xử lý từng đơn được hiển thị rõ (thành công / lỗi) sau khi thao tác hàng loạt hoàn tất.
- Audit log ghi nhận người duyệt, thời điểm, và danh sách đơn được xử lý.

### BR-018 — Tự động tạo đơn nghỉ thai sản

- Áp dụng cho nhân viên đang nghỉ thai sản và **chưa đến ngày đi làm trở lại** theo hợp đồng/thỏa thuận.
- Script tạo đơn nghỉ với loại = **"Nghỉ thai sản"** cho toàn bộ khoảng thời gian nghỉ được ghi nhận.
- Đơn tạo tự động được đánh dấu nguồn = `system_generated` trong audit log.

### BR-019 — Kiểm soát thời hạn tạo và duyệt đơn nghỉ phép theo kỳ

Áp dụng cho kỳ công tháng N (thường chốt công vào ngày 26):

| Hành động | Thời hạn | Người áp dụng |
|---|---|---|
| Tạo đơn nghỉ phép | Trước **12:00 ngày 26** | Nhân viên |
| Duyệt đơn nghỉ phép | Trước **18:30 ngày 26** | Quản lý |

- Sau thời hạn, hệ thống **chặn thao tác** và hiển thị thông báo lý do rõ ràng.
- HC/Admin có thể xử lý các trường hợp ngoại lệ bằng cách điều chỉnh thủ công trực tiếp trên bảng công (không qua luồng đơn).

### BR-020 — Thời điểm bắt đầu ghi nhận chấm công

- Hệ thống **chỉ ghi nhận dữ liệu check-in từ 6:01 sáng** trở đi. Đây là giá trị mặc định, có thể cấu hình trong phần cài đặt hệ thống.
- Dữ liệu check-in trước 6:01 sẽ bị bỏ qua và không ảnh hưởng đến bảng công.

### BR-021 — OT đêm và quy đổi phép bù

- Nhân viên làm **OT đêm** được ghi nhận **+0,5 ngày phép bù** cho ca OT đó.
- Nếu nhân viên **không sử dụng phép bù** (không tạo đơn nghỉ bù), số ngày phép bù này được **cộng vào tổng ngày phép** của nhân viên.
- Nếu nhân viên **sử dụng phép bù** (tạo và duyệt đơn nghỉ bù), ngày nghỉ đó được ghi nhận bằng ký hiệu phù hợp và không cộng thêm vào phép.

> ⚠️ Cần xác nhận thêm: định nghĩa "OT đêm" (khung giờ cụ thể), và cơ chế trigger ghi nhận OT đêm trong hệ thống (thủ công HC nhập hay tự động từ dữ liệu chấm công).

---

## 7. Phân quyền
### 7.1 Mô tả các role

| Role | Tên hiển thị | Mô tả |
|---|---|---|
| `administrator` | Administrator | Tài khoản hệ thống cấp cao nhất. Full quyền toàn bộ module, bao gồm quản lý user và phân role. Dùng cho System Admin. |
| `hanhchinh` | Hành chính | Quản trị toàn bộ nghiệp vụ chấm công + toàn quyền cấu hình hệ thống (ca làm việc, kỳ chấm công, ngày lễ, reset phép…). Phạm vi toàn công ty. |
| `admin_chinhanh` | Admin chi nhánh | Xử lý nghiệp vụ chấm công hàng ngày (xem, sửa công, chốt công, điều chỉnh phép, truy thu/bù công). **Không** được tạo ca, cấu hình hệ thống. Phạm vi theo chi nhánh/địa điểm được phân công. |
| `cnb` | C&B (Compensation & Benefits) | Xem toàn bộ dữ liệu công và phép để phục vụ tính lương. Chỉ xem, export không chỉnh sửa. |
| `manager` | Quản lý phòng ban (Team Lead / Manager) | Xem dữ liệu công và phép của nhân viên trong phòng ban mình. Không chỉnh sửa dữ liệu gốc. |
| `employee` | Nhân viên | Chỉ xem dữ liệu của bản thân. Không truy cập dữ liệu người khác. |

### 7.2 Điều kiện đặc biệt về phạm vi dữ liệu

| Role | Phạm vi dữ liệu |
|---|---|
| `administrator` | Toàn hệ thống, không giới hạn |
| `hanhchinh` | Toàn công ty (tất cả phòng ban, địa điểm) |
| `admin_chinhanh` | Chi nhánh / địa điểm được phân công |
| `cnb` | Toàn công ty — chỉ xem, không sửa |
| `manager` | Chỉ phòng ban / team trực thuộc mình quản lý |
| `employee` | Chỉ dữ liệu cá nhân của bản thân |

### 7.3 Bảng phân quyền theo tính năng

> Ký hiệu: ✅ Được phép · 👁 Chỉ xem · ❌ Không được phép · `*` Cần xác nhận thêm

#### Cấu hình hệ thống

| Tính năng | Admin | HC | Admin CN | C&B | Manager | Employee |
|---|---|---|---|---|---|---|
| FR-001 Tạo / sửa / xóa ca làm việc | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-002 Cấu hình ca luân phiên T7 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-003 Thiết lập kỳ chấm công | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-004 Thiết lập ngày reset phép lũy kế và các setting khác trong màn | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-005 Quản lý ngày lễ, Tết | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-015 Cấu hình cho phép đi muộn/về sớm | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FR-016 Miễn chấm công cá nhân | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

#### Bảng chấm công

| Tính năng | Admin | HC | Admin CN | C&B | Manager | Employee |
|---|---|---|---|---|---|---|
| FR-006 Bảng tổng hợp — xem | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | 👁 phòng ban | ❌ |
| FR-006 Xuất Excel | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | 👁 phòng ban  | ❌ |
| FR-007 Bảng chấm công cá nhân — xem | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | 👁 team | 👁 của mình |
| FR-008 Chi tiết chấm công từng ngày | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | 👁 team  | 👁 của mình |
| FR-009 Chỉnh sửa chấm công thủ công | ✅ | ✅ | ✅ chi nhánh | ❌ | ❌ | ❌ |
| FR-010 Chốt công theo kỳ | ✅ | ✅ | ❌| ❌ | ❌ | ❌ |

#### Quản lý phép

| Tính năng | Admin | HC | Admin CN | C&B | Manager | Employee |
|---|---|---|---|---|---|---|
| FR-011 Xem tổng hợp phép toàn công ty | ✅ | ✅ | ❌ | 👁 | ❌ | ❌ |
| FR-011 Xem chi tiết phép theo chi nhánh | ✅ | ✅ | 👁 chi nhánh | 👁 | 👁 team | ❌ |
| FR-011 Xem phép của bản thân | ✅ | 👁 | 👁 | 👁 | 👁 | 👁 |
| FR-012 Điều chỉnh phép thủ công | ✅ | ✅ | ✅ chi nhánh `*` | ❌ | ❌ | ❌ |
| FR-013 Xem lịch sử giao dịch phép | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | 👁 team `*` | 👁 của mình |
| FR-014 Tạo / sửa / xóa truy thu – bù công | ✅ | ✅ | ✅ chi nhánh | ❌ | ❌ | ❌ |
| FR-014 Xem danh sách truy thu – bù công | ✅ | ✅ | 👁 chi nhánh | 👁 toàn cty | ❌ | ❌ |

### 7.4 Màn hình theo role

| Màn hình | Admin | HC | Admin CN | C&B | Manager | Employee |
|---|---|---|---|---|---|---|
| Quản lý ca làm việc | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cấu hình ca luân phiên T7 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Thiết lập khác (kỳ, reset, lễ Tết) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bảng chấm công tổng hợp | ✅ | ✅ | ✅ (chi nhánh) | ✅ (view only) | ✅ (phòng ban) | ❌ |
| Bảng chấm công cá nhân | ✅ | ✅ | ✅ (chi nhánh) | ✅ (view only) | ✅ (team) `*` | ✅ (của mình) |
| Quản lý ngày phép nhân viên | ✅ | ✅ | ✅ (chi nhánh) `*` | ✅ (view only) | 👁 (team) `*` | 👁 (của mình) |
| Truy thu / Bù công | ✅ | ✅ | ✅ (chi nhánh) | 👁 `*` | ❌ | ❌ |