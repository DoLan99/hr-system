# LeaveMS — Quản lý Chấm công

> **Product Requirements Document** · v1.1 · CRM 2025.2  
> PM/PO: Nguyễn Thị Thảo · Cập nhật: 12/03/2026 · Trạng thái: IN REVIEW  
> Stakeholders: PO, Dev, QA, Hành chính, Admin chi nhánh

---

## 1. Problem Statement

Bộ phận Hành chính hiện quản lý toàn bộ dữ liệu chấm công qua file Excel — từ nhập liệu, đối chiếu đến tổng hợp báo cáo cuối tháng. Quy trình thủ công này tốn nhiều thời gian, dễ xảy ra sai sót khi dữ liệu lớn, thiếu tính minh bạch và khó truy vết khi có sai lệch.

**Ai bị ảnh hưởng và tần suất:**

- **Hành chính / Admin chi nhánh** — mỗi tháng phải tổng hợp công thủ công, xử lý ngoại lệ (T7 luân phiên, Tết, truy thu/bù công) và chốt bảng công cho toàn bộ nhân viên.
- **Nhân viên** — chỉ biết mình bị ghi nhận sai khi đã đến cuối tháng; không chủ động tra cứu được số phép còn lại.
- **Quản lý phòng ban** — thiếu cái nhìn real-time về tình trạng chuyên cần, phải hỏi HC thủ công từng trường hợp.

**Chi phí nếu không giải quyết:**

- HC mất ≥ 2–3 ngày/tháng chỉ để tổng hợp và đối chiếu công.
- Sai sót lương phát sinh, ảnh hưởng niềm tin nhân viên và uy tín HC.
- Không thể scale khi KiotViet tăng số lượng nhân viên và phòng ban.

**Bằng chứng:** Phản hồi trực tiếp từ team Hành chính, yêu cầu số hóa quy trình trong roadmap CRM 2025.2.

---

## 2. Goals

### Mục tiêu kinh doanh


| #   | Mục tiêu                                                                              | Cách đo                                                                                           |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| G1  | Giảm thời gian tổng hợp công của HC xuống ≥ X% so với quy trình Excel hiện tại        | Đo thời gian xử lý trung bình/tháng trước và sau khi go-live (X sẽ cập nhật sau 1 tháng vận hành) |
| G2  | Loại bỏ sai sót do nhập liệu thủ công — dữ liệu chấm công chính xác 100% sau khi chốt | Số ticket lương sai / tháng = 0 sau 3 tháng vận hành                                              |
| G3  | Chuẩn hóa quy trình chấm công toàn công ty, dễ kiểm soát và truy vết                  | 100% phòng ban sử dụng hệ thống thay cho Excel trong vòng 2 tháng sau go-live                     |


### Mục tiêu người dùng


| #   | Mục tiêu                                                               | Cách đo                                           |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| G4  | HC có thể xem và chốt bảng công trong ≤ 3 bước thao tác chính          | Task completion rate ≥ 90% trong usability test   |
| G5  | Nhân viên chủ động tra cứu công và phép của bản thân bất kỳ lúc nào    | % nhân viên tự tra cứu ≥ 70% trong tháng đầu tiên |
| G6  | Quản lý theo dõi tình hình chuyên cần team real-time, không cần hỏi HC | Số yêu cầu HC hỗ trợ tra cứu công giảm ≥ 50%      |


---

## 3. Non-Goals


| #   | Không làm                                                        | Lý do                                                                                                                        |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| NG1 | Tích hợp thiết bị chấm công vật lý (máy vân tay, thẻ từ, camera) | Phức tạp về phần cứng và tích hợp; không thuộc phạm vi CRM 2025.2; sẽ xem xét trong roadmap riêng                            |
| NG2 | Quản lý chấm công cho khối DVKH                                  | DVKH có quy trình ca và công đặc thù khác biệt; cần spec riêng; sẽ bổ sung trong version sau                                 |
| NG3 | Tích hợp trực tiếp với hệ thống tính lương để tự động thanh toán | Phạm vi của module này là cung cấp dữ liệu công chuẩn xác; tính lương và thanh toán là bước tiếp theo do team khác phụ trách |
| NG4 | Ứng dụng di động (mobile app) cho nhân viên chấm công            | MVP tập trung vào web; mobile là kênh bổ sung, cần nghiên cứu riêng về UX và hạ tầng                                         |
| NG5 | Tự động duyệt đơn nghỉ phép bằng AI / rule engine                | Duyệt phép cần phán đoán của Quản lý; tự động hóa hoàn toàn có thể tạo rủi ro nghiệp vụ; sẽ xem xét khi có đủ dữ liệu        |


---

## 4. User Stories

> Định dạng: *Là một [persona], tôi muốn [hành động], để [lợi ích].*

### 4.1 Hành chính / Admin chi nhánh (HC/Admin)

**Cấu hình hệ thống**


| ID     | User Story                                                                                                                                                        | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-001 | Là HC, tôi muốn tạo và cấu hình các loại ca làm việc với giờ vào/ra, ngày làm việc và phòng ban áp dụng, để nhân viên được theo dõi công đúng theo lịch của mình. | P0       |
| US-002 | Là HC, tôi muốn cấu hình lịch làm việc thứ 7 luân phiên theo từng tháng (sáng/chiều/cả ngày/nghỉ), để hệ thống tính công đúng cho nhân viên có lịch T7 xen kẽ.    | P0       |
| US-003 | Là HC, tôi muốn thiết lập kỳ chấm công mặc định và cấu hình riêng cho từng tháng ngoại lệ, để chu kỳ tính công luôn chính xác kể cả dịp Tết hay lịch đặc biệt.    | P0       |
| US-004 | Là HC, tôi muốn cấu hình ngày reset phép lũy kế hàng năm, để hệ thống tự động reset đúng thời điểm mà không cần thao tác thủ công.                                | P0       |
| US-005 | Là HC, tôi muốn khai báo các ngày lễ, Tết theo năm cho toàn công ty hoặc từng phòng ban, để hệ thống tự động ghi nhận ký hiệu nghỉ lễ đúng trên bảng công.        | P0       |
| US-015 | Là HC, tôi muốn cấu hình số phút tối đa cho phép đi muộn/về sớm theo từng loại ca, để không phạt oan nhân viên vì sai lệch nhỏ.                                   | P0       |
| US-016 | Là HC, tôi muốn cấu hình danh sách nhân viên được miễn chấm công theo từng ca, để những nhân viên có vai trò đặc biệt không bị đánh dấu vắng mặt sai.             | P0       |


**Bảng chấm công**


| ID     | User Story                                                                                                                                                        | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-006 | Là HC/Admin, tôi muốn xem bảng công tổng hợp toàn bộ nhân viên theo kỳ và lọc theo phòng ban / địa điểm, để nhanh chóng phát hiện bất thường trước khi chốt công. | P0       |
| US-009 | Là HC/Admin, tôi muốn chỉnh sửa thủ công dữ liệu chấm công của nhân viên, để sửa các sai sót do quên chấm công hoặc lỗi hệ thống.                                 | P0       |
| US-010 | Là HC, tôi muốn chốt công sau khi kiểm tra xong, để dữ liệu không bị thay đổi khi chuyển sang bước tính lương.                                                    | P0       |


**Quản lý phép và điều chỉnh công**


| ID     | User Story                                                                                                                                                                | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-011 | Là HC/Admin, tôi muốn xem số ngày phép của từng nhân viên (cơ bản, thâm niên, lũy kế, còn lại), để đảm bảo quyền lợi phép được áp dụng đúng chính sách.                   | P0       |
| US-012 | Là HC/Admin, tôi muốn điều chỉnh thủ công số ngày phép của nhân viên kèm ghi chú lý do, để xử lý các trường hợp ngoại lệ không có trong quy tắc tự động.                  | P0       |
| US-013 | Là HC/Admin, tôi muốn xem toàn bộ lịch sử giao dịch phép của từng nhân viên, để kiểm tra và giải thích khi có sai lệch về số ngày phép.                                   | P0       |
| US-014 | Là HC/Admin, tôi muốn tạo các khoản truy thu hoặc bù công cho nhân viên, để điều chỉnh lương đúng với thực tế phát sinh từ kỳ trước.                                      | P0       |
| US-017 | Là HC/Admin, tôi muốn duyệt nhiều đơn nghỉ phép cùng lúc, để tiết kiệm thời gian xử lý cuối kỳ khi số đơn phát sinh lớn.                                                  | P0       |
| US-018 | Là HC, tôi muốn hệ thống tự động tạo đơn nghỉ thai sản cho nhân viên đang trong thời gian nghỉ thai sản chưa đến hẹn đi làm, để không phải nhập thủ công từng trường hợp. | P0       |
| US-019 | Là HC, tôi muốn import file phép các tháng đã qua, để hệ thống có đủ dữ liệu lịch sử phép từ đầu năm 2026.                                                                | P0       |


### 4.2 Nhân viên


| ID     | User Story                                                                                                                                                        | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-007 | Là Nhân viên, tôi muốn xem lịch chấm công cá nhân theo tháng với ký hiệu trạng thái từng ngày, để kiểm tra hệ thống ghi nhận công của mình có chính xác không.    | P0       |
| US-008 | Là Nhân viên, tôi muốn xem chi tiết giờ vào/ra từng ngày (tổng giờ, tổng phút đi muộn/về sớm), để phát hiện sai sót và liên hệ HC kịp thời.                       | P0       |
| US-020 | Là Nhân viên, tôi muốn hệ thống chặn tôi tạo đơn nghỉ cho kỳ tháng N sau 12:00 ngày 26 và hiển thị lý do rõ ràng, để tôi hiểu deadline và không bị mất đơn vô lý. | P0       |


### 4.3 Quản lý phòng ban (Manager)


| ID    | User Story                                                                                                                                                             | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-Q1 | Là Manager, tôi muốn xem bảng công tổng hợp của team theo kỳ và lọc theo phòng ban, để nắm tình hình chuyên cần và phát hiện bất thường (NKL, đi muộn nhiều) kịp thời. | P0       |
| US-Q2 | Là Manager, tôi muốn xem chi tiết bảng công từng nhân viên trong team, để hỗ trợ HC xác nhận và giải quyết các trường hợp sai lệch.                                    | P0       |
| US-Q3 | Là Manager, tôi muốn hệ thống chặn tôi duyệt đơn nghỉ phép cho kỳ tháng N sau 18:30 ngày 26 và hiển thị lý do rõ ràng, để tôi biết deadline và xử lý đúng hạn.         | P0       |


---

## 5. Requirements

### P0 — Must Have (MVP không thể thiếu)

#### 5.1 Cấu hình hệ thống


| ID     | Yêu cầu                                                                                                                            | Acceptance Criteria                                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | **Quản lý ca làm việc:** Tạo, chỉnh sửa, kích hoạt/vô hiệu hóa các loại ca; cấu hình giờ vào/ra, ngày làm việc, phòng ban áp dụng. | ✅ Tạo ca với đầy đủ thông tin bắt buộc (tên, mã, loại, giờ vào/ra, ngày làm việc). ✅ Ca mới hiển thị trong danh sách và áp dụng được cho phòng ban. ✅ Vô hiệu hóa ca không xóa dữ liệu lịch sử. |
| FR-002 | **Cấu hình ca luân phiên T7:** Thiết lập lịch làm việc thứ 7 theo từng tháng (sáng/chiều/cả ngày/nghỉ) cho ca có lịch luân phiên.  | ✅ Chọn được từng tuần T7 trong tháng và gán ca. ✅ Lịch T7 lưu riêng theo tháng và phản ánh đúng trên bảng công.                                                                                 |
| FR-003 | **Thiết lập kỳ chấm công:** Cấu hình ngày bắt đầu – kết thúc kỳ mặc định và ngoại lệ riêng từng tháng.                             | ✅ Cấu hình được ngày bắt đầu/kết thúc kỳ mặc định. ✅ Thiết lập được kỳ riêng cho từng tháng. ✅ Hệ thống dùng kỳ ngoại lệ khi có, kỳ mặc định khi không.                                         |
| FR-004 | **Thiết lập ngày reset phép lũy kế & cài đặt khác:** Cấu hình ngày/tháng/giờ hệ thống tự động reset phép lũy kế hàng năm.          | ✅ Thiết lập được ngày, tháng, giờ reset. ✅ Hệ thống tự động reset đúng thời điểm và ghi vào lịch sử giao dịch phép.                                                                             |
| FR-005 | **Quản lý ngày lễ, Tết:** Khai báo các kỳ nghỉ lễ theo năm, áp dụng toàn công ty hoặc theo phòng ban.                              | ✅ Thêm kỳ nghỉ lễ với tên, ngày bắt đầu/kết thúc, phòng ban áp dụng. ✅ Ngày lễ hiển thị đúng ký hiệu L/L/2 trên bảng công.                                                                      |
| FR-015 | **Cấu hình ngưỡng đi muộn/về sớm:** Thiết lập số phút tối đa cho phép cho từng loại ca.                                            | ✅ Cấu hình được số phút tối đa đi muộn và về sớm riêng biệt theo ca. ✅ Hệ thống không tính vi phạm nếu trong ngưỡng.                                                                            |
| FR-016 | **Miễn chấm công cá nhân:** Cấu hình danh sách nhân viên không bắt buộc chấm công trong từng ca.                                   | ✅ Thêm/xóa được nhân viên khỏi danh sách miễn theo ca. ✅ Nhân viên miễn không bị cảnh báo vắng mặt. ✅ Công chuẩn vẫn tính theo ca đã cài đặt.                                                   |


#### 5.2 Bảng chấm công


| ID     | Yêu cầu                                                                                                    | Acceptance Criteria                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-006 | **Bảng chấm công tổng hợp:** Xem công toàn bộ nhân viên theo kỳ; lọc theo phòng ban, địa điểm; xuất Excel. | ✅ Hiển thị đủ cột: công chuẩn, công thực tế, NKL, đi muộn/về sớm, ngày phép, v.v. ✅ Lọc được theo phòng ban, địa điểm, kỳ. ✅ Xuất file Excel đúng định dạng.  |
| FR-007 | **Bảng chấm công cá nhân:** Nhân viên xem lịch công theo tháng với đầy đủ ký hiệu trạng thái từng ngày.    | ✅ Hiển thị đúng ký hiệu trạng thái (X, P, L, NKL, TS,…) theo bảng BR-009. ✅ Xem được chi tiết từng ngày khi nhấn vào. ✅ Chuyển được giữa các tháng khác nhau. |
| FR-008 | **Chi tiết chấm công từng ngày:** Xem giờ vào/ra, tổng giờ, phút đi muộn/về sớm.                           | ✅ Hiển thị giờ vào, giờ ra, tổng giờ, tổng phút đi muộn/về sớm.                                                                                               |
| FR-009 | **Chỉnh sửa chấm công thủ công:** HC/Admin chỉnh sửa dữ liệu công nhân viên khi có sai sót.                | ✅ Chỉnh sửa được trạng thái công từng ngày. ✅ Lưu audit log: người sửa, timestamp, nội dung thay đổi. ✅ Không thể sửa dữ liệu của kỳ đã chốt.                 |
| FR-010 | **Chốt công theo kỳ:** Khóa dữ liệu chấm công theo từng địa điểm sau khi xác nhận.                         | ✅ Chốt được tất cả phòng ban. ✅ Không thể chốt lại lần 2. ✅ Không thể chỉnh sửa dữ liệu sau khi đã chốt. ✅ Chỉ role được cấu hình mới có quyền chốt công.     |


#### 5.3 Quản lý phép nhân viên


| ID     | Yêu cầu                                                                                                                              | Acceptance Criteria                                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-011 | **Quản lý ngày phép nhân viên:** Xem tổng hợp phép toàn công ty; chi tiết phép từng người (cơ bản, thâm niên, lũy kế, còn lại).      | ✅ Hiển thị đủ: phép cơ bản, thâm niên, lũy kế (+ ngày hết hạn), phép còn lại. ✅ Xem được chi tiết theo từng tháng trong năm.                                                                                                                                                                                                |
| FR-012 | **Điều chỉnh phép thủ công:** HC/Admin thêm/bớt ngày phép cho nhân viên kèm ghi chú lý do.                                           | ✅ Thêm hoặc bớt được số ngày phép kèm ghi chú. ✅ Ghi vào lịch sử giao dịch phép. ✅ Phép còn lại và các thông số liên quan tự động cập nhật.                                                                                                                                                                                 |
| FR-013 | **Lịch sử giao dịch phép:** Xem toàn bộ lịch sử cộng phép, nghỉ phép, reset theo thứ tự thời gian.                                   | ✅ Hiển thị đầy đủ giao dịch: cộng, nghỉ, reset, điều chỉnh thủ công. ✅ Lọc được theo năm.                                                                                                                                                                                                                                   |
| FR-014 | **Truy thu / Bù công:** Tạo, chỉnh sửa, xóa các khoản truy thu hoặc bù công theo kỳ phát sinh và kỳ áp dụng.                         | ✅ Tạo bản ghi đầy đủ: kỳ phát sinh, kỳ áp dụng, loại, số lượng, lý do. ✅ Bù công: hỏi "Có trừ phép?" — Có → trừ 1 phép + cộng 1 công; Không → chỉ cộng 1 công. ✅ Truy thu: tự động trừ công tính lương. ✅ Nếu chọn "Có trừ phép" nhưng NV không đủ phép → lỗi, không cho lưu. ✅ Không thể sửa/xóa bản ghi thuộc kỳ đã chốt. |
| FR-017 | **Duyệt hàng loạt đơn nghỉ phép:** HC/Admin chọn nhiều đơn và duyệt/từ chối cùng lúc.                                                | ✅ Chọn được nhiều đơn bằng checkbox. ✅ Thực hiện duyệt/từ chối hàng loạt qua 1 thao tác. ✅ Trạng thái từng đơn cập nhật chính xác. ✅ Audit log ghi nhận người duyệt, thời điểm, danh sách đơn.                                                                                                                              |
| FR-018 | **Tự động tạo đơn nghỉ thai sản (script):** Hệ thống tự động tạo đơn "Nghỉ thai sản" cho NV đang nghỉ thai sản chưa đến hẹn đi làm.  | ✅ Script tạo đúng đơn nghỉ loại "Nghỉ thai sản" cho danh sách NV liên quan. ✅ Đơn có đủ: mã NV, kỳ áp dụng, loại nghỉ. ✅ Audit log đánh dấu `source = system_generated`.                                                                                                                                                    |
| FR-019 | **Import phép các tháng đã qua:** HC/Admin upload file để hệ thống cập nhật dữ liệu phép các tháng trong quá khứ (áp dụng năm 2026). | ✅ Nhận và xử lý file đúng định dạng quy định. ✅ Dữ liệu phép cập nhật chính xác vào đúng tháng. ✅ Thông báo kết quả import (thành công / lỗi từng dòng).                                                                                                                                                                    |
| FR-020 | **Kiểm soát thời hạn tạo và duyệt đơn nghỉ phép:** Chặn NV tạo đơn sau 12:00 ngày 26; chặn Manager duyệt sau 18:30 ngày 26.          | ✅ NV không tạo được đơn nghỉ kỳ tháng N sau 12:00 ngày 26. ✅ Manager không duyệt được đơn sau 18:30 ngày 26. ✅ Thông báo lý do rõ ràng khi bị chặn. ✅ HC/Admin xử lý ngoại lệ bằng chỉnh sửa thủ công trực tiếp trên bảng công.                                                                                             |


### P1 — Nice to Have (Fast-follow sau MVP)


| ID     | Yêu cầu                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| P1-001 | Dashboard tổng quan cho HC: biểu đồ xu hướng chuyên cần theo tuần/tháng, cảnh báo NKL nhiều bất thường.                  |
| P1-002 | Thông báo push/email tự động cho nhân viên khi bảng công được chỉnh sửa hoặc kỳ công sắp đến deadline.                   |
| P1-003 | Tìm kiếm/lọc nâng cao trên bảng công tổng hợp (lọc theo nhiều điều kiện đồng thời: NKL ≥ N ngày, đi muộn ≥ X lần, v.v.). |
| P1-004 | Lịch sử phiên bản (version history) cho từng bản ghi truy thu/bù công.                                                   |


### P2 — Future Considerations (Thiết kế phải hỗ trợ, không build trong v1)


| ID     | Yêu cầu                                                  | Lý do giữ lại để thiết kế tương thích                                                                |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P2-001 | Tích hợp thiết bị chấm công vật lý (máy vân tay, thẻ từ) | Schema dữ liệu chấm công cần có trường `source` (manual / device / system) để sau dễ phân biệt nguồn |
| P2-002 | Quản lý chấm công khối DVKH                              | Ca và công đặc thù — thiết kế cấu trúc ca cần đủ flexible để mở rộng loại ca sau này                 |
| P2-003 | Mobile app chấm công cho nhân viên                       | API phải stateless và chuẩn RESTful để consume được từ mobile                                        |
| P2-004 | Tự động hóa phê duyệt đơn phép theo rule engine          | Cần lưu đầy đủ metadata của từng đơn để rule engine có thể evaluate sau này                          |


---

## 6. Success Metrics

### Leading Indicators (đo trong 1–4 tuần sau go-live)


| Metric                                                              | Mục tiêu                   | Công cụ đo              |
| ------------------------------------------------------------------- | -------------------------- | ----------------------- |
| Adoption rate — % HC/Admin sử dụng hệ thống thay cho Excel          | ≥ 80% trong tháng đầu      | System log              |
| Task completion rate — HC hoàn thành quy trình chốt công end-to-end | ≥ 90%                      | Session recording + log |
| Error rate — % thao tác thất bại (save lỗi, import lỗi)             | ≤ 2%                       | Error log               |
| Time-to-close — thời gian trung bình HC hoàn thành chốt công/tháng  | Giảm ≥ 30% so với baseline | Tự đo + phỏng vấn HC    |
| SUS Score — điểm usability trung bình sau onboarding                | ≥ 70                       | Khảo sát sau training   |


### Lagging Indicators (đo sau 1–3 tháng vận hành)


| Metric                                           | Mục tiêu                     | Công cụ đo              |
| ------------------------------------------------ | ---------------------------- | ----------------------- |
| Ticket lương sai phát sinh do sai công           | = 0 ticket/tháng sau tháng 2 | HR ticketing system     |
| % phòng ban đã ngưng dùng Excel cho chấm công    | 100% sau tháng 2             | Khảo sát HC             |
| NPS / CSAT từ nhân viên về khả năng tra cứu công | ≥ 4/5                        | Khảo sát nội bộ tháng 3 |
| Số yêu cầu HC hỗ trợ tra cứu công từ Manager     | Giảm ≥ 50%                   | HC self-report          |


---

## 7. Open Questions


| #     | Câu hỏi                                                                                                                                               | Người cần trả lời | Blocking?                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| OQ-01 | Định nghĩa chính xác "OT đêm": khung giờ cụ thể là gì? Cơ chế trigger ghi nhận OT đêm là thủ công HC nhập hay tự động từ dữ liệu chấm công?           | PO + Hành chính   | ✅ Blocking — ảnh hưởng BR-021 và FR-011                |
| OQ-02 | Admin chi nhánh có được điều chỉnh phép thủ công không? (FR-012 đang đánh dấu `*` chưa xác nhận)                                                      | PO + HC           | ✅ Blocking — ảnh hưởng role matrix                     |
| OQ-03 | Manager có xem được lịch sử giao dịch phép của team không? (FR-013 đang đánh dấu `*`)                                                                 | PO + Hành chính   | ⚠️ Non-blocking nhưng ảnh hưởng UX màn Manager         |
| OQ-04 | C&B có xem được danh sách truy thu/bù công không? (FR-014 đang đánh dấu `*`)                                                                          | PO + C&B          | ⚠️ Non-blocking                                        |
| OQ-05 | Giá trị baseline cho "thời gian tổng hợp công/tháng" hiện tại của HC là bao nhiêu? (Cần để đặt target G1 cụ thể)                                      | Hành chính        | ⚠️ Non-blocking nhưng cần trước khi đặt KPI chính thức |
| OQ-06 | Nhân viên thử việc có được xem bảng công cá nhân của bản thân không, hay chỉ nhân viên chính thức?                                                    | PO + HR           | ⚠️ Non-blocking                                        |
| OQ-07 | Sau khi chốt công, HC có thể "mở lại" (unclock) để sửa không? Nếu có thì quy trình phê duyệt là gì?                                                   | PO + Dev          | ✅ Blocking — ảnh hưởng thiết kế FR-010                 |
| OQ-08 | Định dạng file import phép (FR-019) là gì? HC có sẵn file mẫu chưa?                                                                                   | Hành chính + Dev  | ✅ Blocking — cần thiết kế trước khi dev                |
| OQ-09 | Danh sách nhân viên hưởng chế độ con nhỏ (BR-012) do ai quản lý trong hệ thống? Cập nhật thủ công hay đồng bộ từ HR system?                           | PO + Dev          | ⚠️ Non-blocking                                        |
| OQ-10 | Nếu kỳ chấm công tháng N không kết thúc vào ngày 26 (ví dụ tháng Tết), deadline tạo/duyệt đơn nghỉ phép có tự động điều chỉnh theo kỳ ngoại lệ không? | PO + Dev          | ✅ Blocking — ảnh hưởng FR-020                          |


---

## 8. Timeline Considerations


| Mốc                                  | Ngày       | Ghi chú                                                                                                       |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Spec freeze (PRD IN REVIEW hoàn tất) | 14/03/2026 | Giải đáp hết Blocking questions trước ngày này                                                                |
| Design handoff Figma → Dev           | TBD        | Tham chiếu: [Figma CRM 2025.2](https://www.figma.com/design/uvsONXMAAHAvVpNZPDZZxC/CRM-2025.2?node-id=1723-2) |
| Dev kickoff                          | TBD        | Phụ thuộc spec freeze                                                                                         |
| Go-live MVP                          | TBD        | Target: vận hành kỳ chấm công tháng đầu tiên trên hệ thống mới                                                |


**Dependencies cần theo dõi:**

- Data migration: Hành chính cần chuẩn bị file phép lịch sử năm 2026 cho FR-019 trước go-live.
- Phân quyền: Cần confirm role matrix (OQ-02, OQ-03, OQ-04) trước khi Dev thiết kế API authorization.
- Tích hợp lương: Module này cung cấp dữ liệu công chuẩn; team tính lương cần align format output (file Excel) trước dev.

**Đề xuất phân phase nếu timeline quá eo hẹp:**

- **Phase 1 (MVP):** FR-001 đến FR-014, FR-017 — Cấu hình + Bảng công + Quản lý phép cơ bản.
- **Phase 2:** FR-015, FR-016, FR-018, FR-019, FR-020 — Cấu hình nâng cao, import, kiểm soát deadline.

---

## Phụ lục A — Business Rules tóm tắt


| ID     | Rule                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| BR-001 | Chỉ CBNV ký HĐLĐ chính thức hưởng phép. Thử việc tích lũy nhưng chỉ dùng sau khi hết thử việc.                          |
| BR-002 | Phép cơ bản: 12 ngày/năm; tối đa 20 ngày (bao gồm thâm niên).                                                           |
| BR-003 | Phép thâm niên: +1 ngày mỗi 5 năm.                                                                                      |
| BR-004 | Vào làm trước ngày 15 → hưởng 1 ngày phép tháng đó; từ ngày 15 trở đi → không hưởng.                                    |
| BR-005 | Phép còn lại = Phép cơ bản + Thâm niên + Lũy kế − Đã dùng.                                                              |
| BR-006 | Phép dư chuyển Quý I năm sau (lũy kế); reset vào ngày 25/03 hàng năm (mặc định, có thể cấu hình).                       |
| BR-007 | Nghỉ nửa buổi = 0.5 ngày phép.                                                                                          |
| BR-008 | Tạm ứng phép: CBNV ≥ 12 tháng (trừ KD, DVKH), tối đa 3 ngày/năm.                                                        |
| BR-009 | Bảng ký hiệu ngày công: X, XP, XU, P, PU, CĐ, TS, L, U, NB, -- (xem mục 6 PRD gốc).                                     |
| BR-010 | Công chuẩn: Phát triển SP/HT 8h T2–T6; KD 8h T2–T7 (linh hoạt T7); Back Office T2–sáng T7.                              |
| BR-011 | Thang xử phạt đi muộn/về sớm theo số phút (trừ Thưởng YTCLCV).                                                          |
| BR-012 | Mỗi NV có tối đa 3 slot đi muộn/về sớm/tháng; NV hưởng chế độ con nhỏ được +3h/ngày.                                    |
| BR-013 | Hết slot: ≤ 2h trừ lương; > 2h trừ 0.5 ngày phép (hoặc NKL nếu hết phép).                                               |
| BR-014 | Đi muộn > 2h hoặc vào sau 10:30 → tính nghỉ buổi sáng (0.5 ngày).                                                       |
| BR-015 | Bù công: Có trừ phép → trừ 1 phép + cộng 1 công; Không trừ phép → chỉ cộng 1 công.                                      |
| BR-016 | Truy thu: tự động trừ công tính lương, không tùy chọn trừ phép.                                                         |
| BR-017 | Duyệt hàng loạt: ghi audit log đầy đủ; hiển thị kết quả từng đơn sau khi xử lý.                                         |
| BR-018 | Script thai sản: đơn tự động đánh dấu `source = system_generated`.                                                      |
| BR-019 | Deadline: NV tạo đơn trước 12:00 ngày 26; Manager duyệt trước 18:30 ngày 26.                                            |
| BR-020 | Chỉ ghi nhận check-in từ 6:01 sáng trở đi (mặc định, có thể cấu hình).                                                  |
| BR-021 | OT đêm: +0.5 ngày phép bù; nếu không nghỉ bù → cộng vào tổng phép; nếu nghỉ bù → ghi ký hiệu NB. *(Chờ xác nhận OQ-01)* |


---

## Phụ lục B — Phân quyền theo role

> Ký hiệu: ✅ Được phép · 👁 Chỉ xem · ❌ Không được phép · `*` Chờ xác nhận


| Tính năng                       | Admin | HC  | Admin CN | C&B             | Manager      | Employee    |
| ------------------------------- | ----- | --- | -------- | --------------- | ------------ | ----------- |
| Tạo/sửa ca làm việc             | ✅     | ✅   | ❌        | ❌               | ❌            | ❌           |
| Cấu hình kỳ, reset, lễ Tết      | ✅     | ✅   | ❌        | ❌               | ❌            | ❌           |
| Bảng công tổng hợp — xem        | ✅     | ✅   | 👁 CN    | 👁 toàn cty     | 👁 phòng ban | ❌           |
| Bảng công tổng hợp — xuất Excel | ✅     | ✅   | 👁 CN    | 👁 toàn cty     | 👁 phòng ban | ❌           |
| Bảng công cá nhân — xem         | ✅     | ✅   | 👁 CN    | 👁 toàn cty     | 👁 team      | 👁 của mình |
| Chỉnh sửa chấm công thủ công    | ✅     | ✅   | ✅ CN     | ❌               | ❌            | ❌           |
| Chốt công theo kỳ               | ✅     | ✅   | ❌        | ❌               | ❌            | ❌           |
| Xem tổng hợp phép toàn cty      | ✅     | ✅   | ❌        | 👁              | ❌            | ❌           |
| Xem chi tiết phép theo CN       | ✅     | ✅   | 👁 CN    | 👁              | 👁 team      | ❌           |
| Xem phép của bản thân           | ✅     | 👁  | 👁       | 👁              | 👁           | 👁          |
| Điều chỉnh phép thủ công        | ✅     | ✅   | ✅ CN `*` | ❌               | ❌            | ❌           |
| Xem lịch sử giao dịch phép      | ✅     | ✅   | 👁 CN    | 👁 toàn cty     | 👁 team `*`  | 👁 của mình |
| Tạo/sửa/xóa truy thu – bù công  | ✅     | ✅   | ✅ CN     | ❌               | ❌            | ❌           |
| Xem truy thu – bù công          | ✅     | ✅   | 👁 CN    | 👁 toàn cty `*` | ❌            | ❌           |

