# KẾ HOẠCH 6 TUẦN — VIETNAM-WORK.COM
**Phiên bản:** 1.0
**Ngày soạn:** 07/05/2026
**Khoảng triển khai:** 07/05/2026 → 21/06/2026 (Gate 0: 07–10/05 · Tuần 1 bắt đầu 11/05 · Tuần 6 kết thúc 21/06)
**Thị trường:** Tuần 1–4 = Việt Nam nội địa · Tuần 5–6 = Đức (DE)
**Người chủ trì chính:** Lan — toàn quyền quyết định mọi mặt: kỹ thuật, dữ liệu, vận hành, tiếp tục/dừng
**Người hỗ trợ:** Thông — làm theo SOP và danh sách việc Lan đã duyệt
**Chú Hùng:** chỉ nhận báo cáo tuần + duyệt chi tiền khi Lan đề xuất, không can thiệp triển khai

---

## BẢNG CHÚ THÍCH THUẬT NGỮ

| Thuật ngữ | Giải thích |
|---|---|
| **Concierge** | Team trực tiếp giúp employer chuẩn hoá và đăng tin thay vì để họ tự làm — đây là kênh dữ liệu duy nhất trong 6 tuần này |
| **3 kênh outreach** | Email B2B + LinkedIn message/connect + Zalo — gửi đồng thời cùng 1 employer trong ngày 1 |
| **Push toàn bộ vị trí** | Khi employer đồng ý, hỏi ngay toàn bộ vị trí đang tuyển (không chỉ vị trí đã thấy) để tối đa hoá jobs/employer |
| **market tag** | Cờ `market=VN` hoặc `market=DE` gắn vào mỗi employer/job — dùng để lọc hiển thị và phân tích kênh |
| **Importer** | Lệnh `php artisan import:job` — nhập JD từ employer vào DB, gắn đầy đủ cờ dữ liệu, đặt `verified_status=pending` |
| **AI Rewrite** | Service nội bộ chuẩn hoá JD từ employer: `POST /internal/ai/rewrite-job` — input raw JD, output title sạch + description chuẩn |
| **Admin Review Queue** | Trang admin list job pending theo `quality_score` desc, phím tắt A/E/R, Thông duyệt <30 giây/job |
| **Quality score** | Điểm 0–100 sau AI rewrite: title ≥10 ký tự, description ≥150 ký tự, có location, có category, không trùng, còn hạn — ≥80 mới vào queue |
| **Verification type** | `owner_submitted` / `owner_confirmed` / `partner_feed` = được public/index. `public_source_lead_only` / `external_aggregated` = chỉ nội bộ, không public |
| **public_indexable** | Boolean — `true` chỉ khi `verification_type ∈ {owner_submitted, owner_confirmed, partner_feed}`. Mọi job concierge trong kế hoạch này đều đạt điều kiện này |
| **Warm-up email** | Lịch tăng dần volume gửi mail để xây domain reputation: T1=20/ngày → T2=50 → T3-4=100 |
| **Hard bounce** | Email không tồn tại → blacklist vĩnh viễn tự động |
| **Complaint** | Người nhận bấm "Spam" trên Gmail/Outlook → blacklist vĩnh viễn + ghi audit log |
| **B2B email** | Email công ty công khai (`info@`, `kontakt@`, `hr@`…) — KHÔNG phải gmail/yahoo hay `ten.nguoi@firma.de` |
| **Gate 0** | Bộ điều kiện bắt buộc đạt đủ trước khi bắt đầu Tuần 1 — thiếu 1 = lùi ngày khởi động |

---

## PHẦN A — 5 QUYẾT ĐỊNH CHIẾN LƯỢC

### Quyết định 1 — Thứ tự thị trường: Việt Nam trước, Đức sau

**Chốt:** Tuần 1–4 tập trung 100% thị trường Việt Nam nội địa. Tuần 5–6 chuyển sang Đức.

**Lý do:**
- Cùng ngôn ngữ → Thông viết email/Zalo/LinkedIn nhanh hơn, không cần duyệt ngôn ngữ, không cần tốn thời gian dịch JD
- Tỷ lệ response thị trường VN cao hơn đáng kể (Email ~15–20%, LinkedIn ~25–35%, Zalo ~30–50%) so với DE (Email ~5–8%, LinkedIn ~15–25%)
- JD tiếng Việt xử lý nhanh hơn → pipeline concierge chạy mượt trong 4 tuần đầu, phát hiện và sửa bug trước khi chuyển thị trường khó hơn
- Đến Tuần 5, Lan đã fix hầu hết lỗi concierge, pipeline ổn định → Lan chủ động chuyển toàn bộ sang DE với ít rủi ro hơn

**Đánh đổi chấp nhận được:** employer VN ít phù hợp định vị "người Việt tại Đức" hơn employer DE. Xử lý bằng cách gắn tag `market=VN` / `market=DE` — trang mặc định lọc theo market nhưng public cả hai.

---

### Quyết định 2 — Outreach đa kênh (VN: 3 kênh; DE: 3 kênh không-email)

**Chốt:**
- **Việt Nam (Tuần 1–4):** Email B2B + LinkedIn + Zalo, gửi đồng thời cùng ngày 1
- **Đức (Tuần 5–6):** **LinkedIn + XING + Referral từ candidate VN tại DE** — KHÔNG cold email, KHÔNG cold call. Email DE chỉ được gửi nếu employer reply một trong 3 kênh trên trước (đã có "prior contact"), HOẶC employer chủ động cung cấp email với lời mời rõ ràng

**Lý do bỏ DE email:**
- UWG §7 + IHK München khẳng định mọi email "quảng cáo" tại Đức (kể cả "xin phép đăng tin miễn phí") đều cần consent TRƯỚC. Đăng email B2B trên Impressum không tạo consent
- Trần thiệt hại nếu vi phạm rất rộng: abmahnung + Unterlassungserklärung + Vertragsstrafe (vài nghìn EUR/vụ); § 890 ZPO Ordnungsgeld tới **250.000 EUR/vi phạm** nếu tái phạm sau lệnh tòa; GDPR Art. 83 trần **20 triệu EUR hoặc 4% doanh thu toàn cầu**
- Plan này là giai đoạn non-revenue — không có ngân sách luật sư DE để bảo vệ vụ kiện

**Lý do giữ 3 kênh DE (LinkedIn + XING + Referral):**
- **LinkedIn:** kênh chính, response rate ~15–25%, connection request KHÔNG bị xem là Werbung
- **XING:** ~21M user DACH, HR/Recruiter Đức truyền thống vẫn dùng song song LinkedIn. Cơ chế giống LinkedIn (connection + message), cùng UWG framework — an toàn. Free tier đủ cho 6–10 connection/ngày
- **Referral từ candidate VN tại DE:** sau T5 candidate ops, hỏi candidate đang làm tại công ty DE giới thiệu HR/manager → warm intro (NGOÀI phạm vi UWG vì có quan hệ trước). Conversion ~30–50% (cao hơn cold rất nhiều)
- 3 kênh kết hợp → response rate kỳ vọng ~30–40%, đạt 25–35 employer DE trong 2 tuần

**Lý do giữ 3 kênh VN:**
- Mỗi kênh có tập người dùng khác nhau: người ít dùng email có thể dùng LinkedIn hằng ngày, người ít LinkedIn có thể dùng Zalo
- Response rate tổng hợp ước ~40–55% với VN thay vì ~15–20% nếu chỉ dùng email
- Chi phí thêm không đáng kể — chỉ cần Thông dành thêm 30–45 phút/ngày cho LinkedIn và Zalo
- Luật cold email VN không nghiêm ngặt như Đức (vẫn phải tuân Nghị định 91/2020 về spam, nhưng B2B với prefix công khai được chấp nhận trong thực tế)

**Quy tắc cứng:** mỗi employer chỉ nhận tối đa 1 outreach + 1 follow-up (sau 5 ngày) trên toàn bộ kênh cộng lại — không phải mỗi kênh 1 follow-up riêng.

---

### Quyết định 3 — Push toàn bộ vị trí khi employer đồng ý

**Chốt:** Ngay khi employer reply đồng ý qua bất kỳ kênh nào, câu hỏi đầu tiên của Thông phải là:

> *"Ngoài vị trí [X] mà tụi mình thấy [Công ty] đang tuyển, hiện tại công ty còn vị trí nào đang cần người không? Tụi mình đăng hộ tất cả, hoàn toàn miễn phí, trong 15 phút."*

**Lý do:** Mục tiêu chuyển từ 2–3 jobs/employer (chỉ hỏi vị trí thấy được) lên 5–10 jobs/employer (push toàn bộ danh sách đang tuyển). Mỗi employer phản hồi đại diện cho một cơ hội gấp 2–4 lần — bỏ qua câu hỏi này là bỏ phí phần lớn cơ hội từ outreach đã tốn công gửi.

---

### Quyết định 4 — Chỉ build 3 module kỹ thuật trong 6 tuần

**Chốt:** Chỉ build đúng 3 module đủ để publish job thật:
1. **Importer + cờ dữ liệu** — nhập JD từ employer vào DB
2. **AI Rewrite Service** — chuẩn hoá JD trước khi vào queue
3. **Admin Review Queue** — Thông duyệt nhanh, Lan publish

**Bị lùi lại sau Tuần 6 (không build trong giai đoạn này):**

| Module | Thay thế tạm |
|---|---|
| Crawler | Không dùng — 100% concierge |
| Distribution helper | Thông copy-paste text thủ công |
| Auto-refresh stale | Manual check: job >21 ngày + 0 apply → email employer re-confirm (T4). Cron 5 dòng tự động unpublish nếu không reply sau 3 ngày |
| Counter & Trust dynamic | Hard-code câu định tính khi <100 jobs |
| Landing pages auto | Làm sau khi có ≥10 jobs/cụm |
| AI matching (embedding/semantic) | Làm sau Tuần 6; **rule-based matching v1 (Tuần 3) vẫn được phép** — QĐ4 chỉ lùi AI/semantic matching, không lùi rule-based |

**Lý do:** Crawler mất 2–3 tuần build và chỉ tạo ra lead nội bộ (không publish được theo rule `verification_type`). Các module phụ khác không ảnh hưởng đến việc publish job thật trong 6 tuần — bỏ để Lan dồn toàn bộ thời gian build vào 3 module cốt lõi.

---

### Quyết định 5 — Public/index chỉ khi có verification_type hợp lệ

**Chốt cứng, kế thừa từ KE-HOACH-TONG-HOP.md — không đàm phán:**

Mọi job trong kế hoạch này đều đến từ employer đồng ý (concierge). Luồng 2 bước:
- **Import:** Importer tạo record với `verified_status=pending`, `verification_type=owner_submitted`, `public_indexable=false`
- **Publish:** Sau khi employer confirm preview → Lan bấm publish → đổi thành `verification_type=owner_confirmed`, `public_indexable=true`

Không có job crawl, không có job chỉ có `source_url`, không có trường hợp ngoại lệ.

---

## PHẦN B — KẾ HOẠCH CHI TIẾT

### B.1. Nguyên tắc "không thương lượng" trong 6 tuần

1. **Không thu phí** employer hay candidate.
2. **Không tạo giả** đánh giá, báo giá đã chấp nhận, hoặc hoạt động giả trên bản công khai.
3. **Không dùng crawler** — mọi job public đều phải có employer xác nhận.
4. **Không gửi email cá nhân** — chỉ B2B (xem danh sách 10 prefix được phép trong B.5: `info@`, `kontakt@`, `office@`, `hr@`, `jobs@`, `careers@`, `recruiting@`, `contact@`, `hello@`, `team@`). Không gửi `gmail.com`, `yahoo.de`, hoặc `ten.nguoi@firma.de` dù trên domain công ty.
5. **Không gửi lần 3** — chỉ 1 outreach + 1 follow-up sau 5 ngày trên toàn bộ kênh. Không reply sau đó = chuyển "No Reply", thử lại tháng sau.
6. **Chỉ 3 ngôn ngữ:** tiếng Việt / tiếng Anh / tiếng Đức — tắt tạm các ngôn ngữ khác.
7. **Mọi job public phải qua Lan duyệt cuối** — Thông không tự publish.

---

### B.2. Điều kiện Gate 0 — bắt buộc đạt đủ trước Tuần 1

> Lan tự kiểm và xác nhận trong **07–10/05/2026** (3–4 ngày pre-launch). Thiếu 1 điều kiện = lùi ngày khởi động Tuần 1, không chạy bù.

| # | Điều kiện | Đạt chưa? |
|---|---|---|
| 1 | 0 lỗi phân quyền nghiêm trọng (CV, file đính kèm, hồ sơ ứng tuyển không lộ public) | ✅ |
| 2 | 0 lỗi lẫn "Nộp hồ sơ" và "Đặt giá" (giao diện, nút bấm, email đều tách đúng) | ✅ |
| 3 | Trang chủ không còn số liệu giả — dùng câu định tính khi <100 jobs | ☐ |
| 4 | Email hệ thống chạy được + SPF/DKIM/DMARC đã cấu hình cho `mail.vietnam-work.com` | ☐ |
| 5 | Sitemap / robots.txt / canonical đúng + đã gửi Google Search Console | ☐ |
| 6 | `demo_flag=true` không xuất hiện ngoài public | ✅ |
| 7 | `MAIL_FROM_NAME` đã đổi từ "Laravel" sang "Vietnam-Work" + `MAIL_PASSWORD` đã rotate | ☐ |
| 8 | Domain phụ `outreach.vietnam-work.de` setup xong + SPF/DKIM riêng + mail-tester ≥8/10 | ☐ |
| 9 | Build `EmailValidator::isB2BAcceptable()` + 3 webhook (hard_bounce / complaint / unsubscribe) | ☐ |
| 10 | Thông có LinkedIn profile đầy đủ, ≥50 connections, sẵn sàng gửi 30–50 message/ngày | ☐ |
| 11 | Script outreach 3 kênh (email + LinkedIn + Zalo) bằng tiếng Việt đã soạn + Lan duyệt | ☐ |
| 12 | Danh sách 500 employer VN đầu tiên đã enrich: tên, website, email B2B, LinkedIn page, Zalo (nếu có), vị trí đang tuyển | ☐ |

---

### B.3. Lịch 6 tuần

#### MỐC THÀNH CÔNG THEO TUẦN

| Mốc | Employer verified | Jobs published | Candidate opt-in | Applies thật |
|---|---|---|---|---|
| Cuối Tuần 2 (24/05) | 40–60 (VN) | 120–180 | 15–25 | ≥5 |
| Cuối Tuần 4 (07/06) | 80–120 (VN) | 300–400 | 50–80 | ≥25 |
| Cuối Tuần 6 (21/06) | 105–155 (VN+DE; DE qua LinkedIn+XING+Referral) | 380–530 | 100–150 | ≥60 |

> Nút thắt thực tế: không phải outreach, mà là công suất concierge (~15–20 jobs/ngày với 2 người). Nếu inbox JD vượt công suất xử lý → ưu tiên employer có nhiều vị trí nhất trước.

---

#### TUẦN 0 — Pre-launch (07/05 – 10/05)
**Mục tiêu:** xong toàn bộ hạ tầng, Gate 0 đạt 12/12 trước 10/05, Thông sẵn sàng bắt đầu ngày 11/05 (Tuần 1).

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Hạ tầng | Fix 2 rủi ro đỏ: comment dòng `MailService::send()` trong `JobExampleController.php` ~426, đổi `MAIL_FROM_NAME=Vietnam-Work`, rotate `MAIL_PASSWORD`, kiểm `.gitignore` đã ignore `.env` | Lan | — | 07/05 | P1 |
| 2 | Hạ tầng | Setup domain phụ `outreach.vietnam-work.de`: SPF + DKIM 2048-bit + DMARC `p=none`. Test bằng mail-tester.com — đạt ≥8/10 mới tiếp tục | Lan | — | 07/05 | P1 |
| 3 | Hạ tầng | Build `EmailValidator::isB2BAcceptable()` — chỉ cho prefix B2B, block mọi email cá nhân và free domain | Lan | — | 08/05 | P1 |
| 4 | Hạ tầng | Build 3 webhook: `POST /webhook/mail/bounce` → blacklist hard_bounce, `POST /webhook/mail/complaint` → blacklist complaint + audit log, `GET /unsubscribe/{token}` → blacklist opt_out | Lan | — | 08/05 | P1 |
| 5 | Hạ tầng | Đăng ký Brevo (free 300 email/ngày), verify domain phụ, setup warm-up cron: Tuần 1=20/ngày, Tuần 2=50/ngày, Tuần 3–4=100/ngày — hard cap, tự động chặn nếu vượt | Lan | — | 08/05 | P1 |
| 6 | Nội dung | Build template email tiếng Việt chuẩn 7 phần: lời chào cá nhân hoá tên công ty + vị trí đang tuyển → value prop 2–3 câu → 1 link CTA → Impressum (tên + địa chỉ + đại diện) → câu "Reply STOP" → link unsubscribe HMAC. Subject ≤50 ký tự, không CAPS, không emoji | Lan | Thông soạn nháp | 08/05 | P1 |
| 7 | Nội dung | Thông soạn template LinkedIn message VN (~150 ký tự, không attach file): *"Chào [Tên], mình thấy [Công ty] đang tuyển [Vị trí]. Vietnam-Work hỗ trợ đăng tin miễn phí — [Công ty] có muốn thử không?"* + template Zalo (ngắn hơn, thân mật hơn) | Thông | Lan duyệt | 08/05 | P1 |
| 8 | Dữ liệu | Compile danh sách 500 employer VN đầu tiên (IT company / startup / agency HCM + HN): tên, website, email B2B (qua EmailValidator), LinkedIn company page, Zalo nếu có, vị trí đang tuyển (lấy từ LinkedIn Jobs hoặc website) | Thông | — | 08–09/05 | P1 |
| 9 | Kỹ thuật | Build Importer framework: `php artisan import:job` + bảng `raw_jobs` + đầy đủ cờ: `data_source`, `source_url`, `verified_status=pending`, `verification_type=owner_submitted`, `public_indexable=false`, `consent_at`, `consent_source`, `market`, `imported_by`, `imported_at`. **Chú ý:** `verification_type` chỉ đổi sang `owner_confirmed` và `public_indexable=true` tại bước Lan publish cuối — không set trước | Lan | — | 09/05 | P1 |
| 10 | Gate 0 | Setup subdomain `mail.vietnam-work.com`: SPF + DKIM 2048-bit + DMARC `p=none`. Verify bằng mail-tester.com ≥8/10 | Lan | — | 10/05 | P1 |
| 11 | Gate 0 | `home.blade.php`: thêm câu định tính tổng số jobs/employer khi db <100 jobs (hard-code tạm, không lấy số ảo) | Lan | — | 10/05 | P1 |
| 12 | Gate 0 | Tạo `sitemap.xml`, `robots.txt`, canonical tag trên tất cả trang job. Submit sitemap lên Google Search Console | Lan | — | 10/05 | P1 |
| 13 | Gate 0 | Lan tự kiểm 12/12 điều kiện Gate 0, ghi kết quả vào tracker, xác nhận ngày bắt đầu Tuần 1 | Lan | — | 10/05 | P1 |

---

#### TUẦN 1 (11/05 – 17/05) — Khai hoả 3 kênh VN + AI Rewrite
**Mục tiêu:** 3 kênh đang chạy đồng thời, AI Rewrite xong, publish 30–50 jobs đầu tiên.

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach | **Email:** Brevo gửi 20/ngày cho 20 employer đầu của danh sách VN (warm-up tuần 1) | Brevo auto | Lan | 11/05 | P1 |
| 2 | Outreach | **LinkedIn:** Thông tìm HR manager / Founder / Recruiter của cùng 20 employer đó trên LinkedIn → gửi connection + message trong ngày 1–2 (30–40 người/ngày) | Thông | — | 12/05 | P1 |
| 3 | Outreach | **Zalo:** với employer nào có Zalo công ty trên website → Thông nhắn Zalo trong ngày 2–3 | Thông | — | 13/05 | P2 |
| 4 | Outreach | **Khi nhận reply** qua bất kỳ kênh nào → Thông trả lời ngay + hỏi: *"Ngoài [vị trí X], [Công ty] còn tuyển vị trí nào khác không? Mình đăng hộ tất cả miễn phí"* | Thông | — | hằng ngày | P1 |
| 5 | Kỹ thuật | Build AI Rewrite Service: `POST /internal/ai/rewrite-job` cho 2 ngành VN — **IT** (startup/agency) và **Văn phòng/Sales**. Prompt bắt buộc kết thúc bằng: *"Không được tự bịa hoặc suy đoán lương, quyền lợi, visa. Nếu dữ liệu gốc không có → ghi: 'Thông tin sẽ được trao đổi trực tiếp với nhà tuyển dụng'"* | Lan | — | 13/05 | P1 |
| 6 | Kỹ thuật | Validation score sau AI rewrite: title ≥10 ký tự, description ≥150 ký tự, có location, có category, không trùng job 7 ngày gần nhất (similarity <0.8), còn hạn. Tổng ≥80/100 → vào queue. <80 → drop + log | Lan | — | 14/05 | P1 |
| 7 | Kỹ thuật | Log mọi AI call: `prompt_version`, `tokens_in`, `tokens_out`, `cost`, `success`, `retry_count` | Lan | — | 14/05 | P2 |
| 8 | Concierge | Nhận JD đầu tiên từ employer VN đồng ý → AI rewrite → Lan preview → email employer xem trước → employer confirm → Lan publish. Tag: `market=VN`, `verification_type=owner_confirmed` | Lan | Thông | 15/05 | P1 |
| 9 | Concierge | Mục tiêu cuối tuần: 30–50 jobs published (20 employer respond × trung bình 2–3 vị trí/employer ban đầu) | Lan + Thông | — | 17/05 | P1 |
| 10 | Candidate | Thông invite 20 candidate VN đầu tiên qua group FB "IT jobs Vietnam" / "Tìm việc IT HCM-HN": form 1 phút (CV + tick consent) | Thông | — | 15/05 | P2 |
| 11 | Tracker | Thêm cột vào tracker: `kênh reply đầu tiên | số vị trí đã hỏi | số JD nhận được | số jobs published` per employer | Thông | — | 12/05 | P2 |

**Kết quả kỳ vọng cuối Tuần 1:** 15–25 employer VN verified + 30–50 jobs published + 3 kênh đang chạy + AI Rewrite hoạt động end-to-end.

---

#### TUẦN 2 (18/05 – 24/05) — Scale 3 kênh + Admin Review Queue + Push toàn bộ vị trí
**Mục tiêu:** Admin Queue v1 xong để Thông duyệt độc lập, scale email lên 50/ngày, push toàn bộ vị trí để tối đa hoá jobs/employer (KPI tối thiểu ≥3; mục tiêu lý tưởng 5–10).

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach | Check reputation trước khi scale: MXToolbox (0 blacklist) + bounce rate Brevo <2% + mail-tester ≥8/10. Nếu đạt → scale Email lên 50/ngày. **Lưu ý:** Google Postmaster có thể không có dữ liệu ở volume 20–50 email/ngày — dùng làm tham khảo, không phải cửa chặn cứng | Lan | — | 18/05 | P1 |
| 2 | Outreach | Scale LinkedIn lên 50–60 message/ngày. Thông gửi cho 50 employer mới trong danh sách | Thông | — | 18/05 | P1 |
| 3 | Outreach | Với **employer đã reply Tuần 1 nhưng chỉ gửi 1–2 JD:** Thông push thêm — *"[Công ty] còn vị trí nào đang mở không? Mình đăng hộ tất cả trong hôm nay"* | Thông | — | 18–19/05 | P1 |
| 4 | Outreach | Enrich thêm 200–300 employer VN mới (IT tier 2 + fintech + e-commerce) vào danh sách | Thông | — | 20/05 | P1 |
| 5 | Kỹ thuật | Build Admin Review Queue v1: list job `pending` sort theo `quality_score` desc. Mỗi row hiện title + company + quality score + source. Phím tắt: `A` = approve, `E` = edit, `R` = reject + bắt buộc ghi lý do. Mục tiêu <30 giây/job | Lan | — | 20/05 | P1 |
| 6 | Kỹ thuật | Duplicate detector: hash `title + company + location + 200 ký tự đầu description`. Threshold 0.8 = trùng → drop + log lý do. Cron sample 20 case/tuần để Thông kiểm false positive | Lan | — | 21/05 | P2 |
| 7 | Concierge | Thông bắt đầu duyệt Admin Queue 10–15 job/ngày (từ 21/05). Lan chỉ duyệt cuối trước khi publish | Thông | Lan | từ 21/05 | P1 |
| 8 | Concierge | Mục tiêu: 80–120 jobs publish trong tuần (tăng mạnh nhờ push toàn bộ vị trí) | Lan + Thông | — | 24/05 | P1 |
| 9 | Candidate | Thêm 15–20 candidate VN opt-in. Ưu tiên candidate có kỹ năng khớp jobs VN đang có | Thông | — | 24/05 | P2 |

**Kết quả kỳ vọng cuối Tuần 2:** 40–60 employer VN verified + 120–180 jobs published + Admin Queue chạy + Thông duyệt độc lập.

---

#### TUẦN 3 (25/05 – 31/05) — Tăng tốc Concierge VN + SEO cơ bản
**Mục tiêu:** pipeline concierge chạy đều 20+ jobs/ngày, SEO cơ bản xong, bắt đầu match candidate.

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach | Scale Email lên 100/ngày (check reputation trước). LinkedIn giữ 50–60/ngày. Zalo tiếp tục | Lan + Brevo | — | 25/05 | P1 |
| 2 | Outreach | Rà soát status: employer từ Tuần 1–2 đã nhận follow-up ngày 6 mà **vẫn chưa reply** → đánh dấu "No Reply" trong tracker, không liên hệ thêm (follow-up ngày 6 đã diễn ra trong T1–T2 theo SOP — T3 chỉ xác nhận status, không gửi thêm lần nào) | Thông | — | 26–27/05 | P2 |
| 3 | Concierge | Mục tiêu 100–130 jobs publish trong tuần. Ưu tiên xử lý employer tồn đọng nhiều vị trí trước | Lan + Thông | — | 31/05 | P1 |
| 4 | Concierge | Với employer đã publish 1–2 jobs: Thông hỏi thêm — *"Có vị trí nào mới trong tháng tới không? Mình đăng trước cho anh/chị"* | Thông | — | 28/05 | P2 |
| 5 | SEO | JobPosting structured data (`JSON-LD`) cho trang chi tiết job — **chỉ** khi `verification_type ∈ {owner_submitted, owner_confirmed}`. Gắn `jobLocationType=TELECOMMUTE` nếu là remote. Job hết hạn → set `validThrough` về quá khứ hoặc trả 404/410 | Lan | — | 28/05 | P1 |
| 6 | SEO | Google Indexing API: gọi báo khi job mới publish / unpublish / hết hạn | Lan | — | 29/05 | P2 |
| 7 | Candidate | Build rule-based matching v1: `desired_role × category × city × experience` → Top 5 jobs per candidate. Không dùng embedding (chưa đủ data) | Lan | — | 30/05 | P2 |
| 8 | Candidate | Thêm 15–20 candidate VN opt-in | Thông | — | 31/05 | P2 |

**Kết quả kỳ vọng cuối Tuần 3:** 65–90 employer VN + 220–320 jobs published + 40–60 candidate + JobPosting schema chạy.

---

#### TUẦN 4 (01/06 – 07/06) — Chốt VN + QA + Chuẩn bị chuyển sang DE
**Mục tiêu:** đạt mốc VN, dọn data, build pipeline DE, dừng outreach VN.

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach VN | Gửi batch cuối cho phần còn lại của danh sách VN chưa gửi. Sau Tuần 4 không outreach VN mới — chỉ xử lý tồn đọng | Brevo + Thông | — | 01–04/06 | P1 |
| 2 | Concierge VN | Mục tiêu 80–100 jobs publish trong tuần. Tập trung xử lý hết inbox JD tồn đọng từ employer VN | Lan + Thông | — | 07/06 | P1 |
| 3 | QA | Sample 20 job thủ công: kiểm duplicate detector false positive, chỉnh threshold nếu cần | Lan | Thông | 03/06 | P2 |
| 4 | QA | Dọn job stale: job >21 ngày + 0 apply → email employer xin re-confirm. Không reply 3 ngày → unpublish + log | Thông | — | 05/06 | P2 |
| 5 | Chuẩn bị DE | Compile danh sách 300–500 employer DE: IT company + startup DACH. Format: tên, website, **LinkedIn + XING company page (BẮT BUỘC)**, profile HR/Recruiter/CTO trên LinkedIn và XING. Email B2B từ Impressum chỉ ghi tham khảo — KHÔNG dùng để cold email | Lan | — | 05–07/06 | P1 |
| 6 | Chuẩn bị DE | Viết template **3 kênh DE** (KHÔNG cold email — theo QĐ2 và B.5): (a) LinkedIn connection ≤200 ký tự + follow-up; (b) XING connection + message; (c) Referral warm intro template (gửi qua kênh candidate giới thiệu). Tiếng Anh, có Impressum | Lan | — | 06/06 | P1 |
| 7 | Chuẩn bị DE | Template LinkedIn/XING DE: *"Hi [Name], noticed [Company] is hiring [Role]. Vietnam-Work connects German companies with Vietnamese IT talent — free to list. Would you like us to add your opening?"* + template reply khi accept connection | Lan | — | 06/06 | P1 |
| 7.5 | Chuẩn bị DE | Setup tài khoản XING Vietnam-Work (free): profile đầy đủ ảnh + headline + Über mich + Impressum link. Connection ≥30 với Vietnamese IT người trên DACH (làm trước để mở khoá invite quota) | Lan | — | 07/06 | P1 |
| 7.6 | Chuẩn bị DE | Build Referral form: *"Bạn có làm tại công ty Đức không? Có thể giới thiệu HR/Manager để Vietnam-Work liên hệ?"* — gắn vào candidate onboarding form (chỉ optional). Lan duyệt từng case warm intro trước khi gửi | Lan | Thông build form | 07/06 | P1 |
| 8 | Kỹ thuật DE | AI Rewrite Service thêm template IT cho DE: format tiếng Anh. Quy tắc: nếu source có salary/visa/remote → giữ đúng; nếu không có → ghi *"Thông tin sẽ trao đổi trực tiếp với nhà tuyển dụng"* — **không tự bù hoặc suy đoán các trường còn thiếu** | Lan | — | 07/06 | P1 |
| 9 | Báo cáo | Báo cáo mốc 4 tuần: VN employer / jobs / candidate / applies / tỷ lệ response theo từng kênh (email vs LinkedIn vs Zalo) | Lan | — | 07/06 | P1 |

**Kết quả kỳ vọng cuối Tuần 4:** 80–120 employer VN verified + 300–400 jobs VN published + 50–80 candidate + ≥25 applies thật + pipeline DE sẵn sàng.

---

#### TUẦN 5 (08/06 – 14/06) — Chuyển sang thị trường Đức (Lan toàn quyền DE)
**Mục tiêu:** outreach DE bắt đầu qua **3 kênh không-email: LinkedIn + XING + Referral** (KHÔNG cold email — theo QĐ2 + B.5), pipeline VN vẫn xử lý tồn đọng, thêm 25–45 jobs DE đầu tiên.

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach DE | **LinkedIn (kênh chính):** Lan gửi connection request + message cho HR Manager / Recruiter / CTO của 30–40 employer DE đầu trong tuần. Tốc độ 6–8 connection/ngày × 5 ngày | Lan | — | 08–14/06 | P1 |
| 2 | Outreach DE | **XING (song song LinkedIn):** Lan gửi connection request + message cho HR/Recruiter của cùng employer DE trên XING. Tốc độ 6–8 connection/ngày × 5 ngày. Template tương tự LinkedIn nhưng tone Đức hơn | Lan | — | 08–14/06 | P1 |
| 3 | Outreach DE | **Referral pipeline:** Thông gom danh sách candidate VN đã opt-in đang làm tại công ty DE (từ form Referral). Forward list cho Lan → Lan gửi warm intro qua kênh candidate giới thiệu (LinkedIn của candidate, không phải email công ty) | Lan + Thông | — | từ 10/06 | P1 |
| 4 | Outreach DE | Khi DE employer accept connection (LinkedIn/XING) hoặc reply warm intro (Referral): Lan trả lời + push — *"Besides [Role], does [Company] have other open positions? We'll list them all for free."* | Lan | — | hằng ngày | P1 |
| 5 | Outreach DE | **Chỉ khi employer DE chủ động cung cấp email** trong reply 3 kênh trên → Lan có thể email lại để gửi JD preview. KHÔNG dùng email B2B từ Impressum để cold email | Lan | — | hằng ngày | P1 |
| 6 | Concierge VN | Tiếp tục xử lý tồn đọng JD VN (không outreach VN mới). Mục tiêu 20–30 jobs VN thêm trong tuần | Thông | — | 14/06 | P2 |
| 7 | Concierge DE | Xử lý JD DE đầu tiên: AI Rewrite (template DE) → Lan review → employer confirm (qua LinkedIn/XING DM hoặc email họ chủ động cung cấp) → publish. Tag: `market=DE`, `verification_type=owner_confirmed` | Lan | — | 12/06 | P1 |
| 8 | Candidate DE | Invite candidate VN tại Đức qua group Facebook "Người Việt tại München / Berlin / Frankfurt": form 1 phút (CV + consent + Referral question), profile ghi cả tiếng Việt lẫn tiếng Anh | Thông | — | 14/06 | P2 |
| 9 | Email | Weekly digest v1: top 10 jobs mới (mix VN + DE) gửi candidate đã opt-in (chiều thứ 6) — dùng Brevo automation. Đây là email gửi candidate đã consent, KHÔNG phải cold email DE | Lan | — | 12/06 | P2 |
| 10 | Reputation | Check MXToolbox + mail-tester cho domain VN (`outreach.vietnam-work.de` — vẫn dùng cho VN). Postmaster: tham khảo. Không kiểm "DE stream" vì không gửi cold email DE | Lan | — | 10/06 | P1 |

**Kết quả kỳ vọng cuối Tuần 5:** +12–20 employer DE (LinkedIn + XING + Referral) + 25–45 jobs DE + tổng cộng ~345–475 jobs + 80–110 candidate.

---

#### TUẦN 6 (15/06 – 21/06) — Scale DE + QA tổng + Chốt kế hoạch tiếp theo
**Mục tiêu:** đạt mốc tổng, QA toàn bộ, báo cáo đầy đủ, quyết định giai đoạn tiếp theo.

| STT | Nhóm việc | Việc cần làm | Phụ trách | Hỗ trợ | Hạn | Ưu tiên |
|---|---|---|---|---|---|---|
| 1 | Outreach DE | Scale **3 kênh DE**: LinkedIn 10–12 connection/ngày + XING 8–10 connection/ngày + Referral pipeline tiếp tục. Tổng 50–70 employer DE mới/tuần. **KHÔNG bật cold email DE.** Email DE vẫn chỉ gửi cho ai đã reply 3 kênh trên | Lan | — | 15/06 | P1 |
| 2 | Concierge DE | Xử lý JD DE tồn đọng. Mục tiêu 35–55 jobs DE publish trong tuần | Lan | — | 21/06 | P1 |
| 3 | QA tổng | Rà toàn bộ data public: `verification_type` đúng, `public_indexable` đúng, `market` tag đúng, không claim sai | Lan | — | 18/06 | P1 |
| 4 | QA tổng | Bộ đếm trang chủ, biểu ngữ, blog — số liệu khớp `COUNT WHERE public_indexable=true AND demo_flag=false` | Lan | — | 19/06 | P1 |
| 5 | Reputation | Check cuối: MXToolbox (0 blacklist) + mail-tester (≥9/10) cho domain VN (`outreach.vietnam-work.de` — chỉ dùng cho VN). Google Postmaster: xem tham khảo. Không có "DE stream" vì DE = LinkedIn only | Lan | — | 17/06 | P1 |
| 6 | Candidate | Thêm 20–30 candidate VN tại Đức opt-in (ưu tiên vì khớp với jobs DE) | Thông | — | 21/06 | P2 |
| 7 | Báo cáo | Báo cáo tổng 6 tuần: VN employer / DE employer / jobs theo market / candidate / applies / tỷ lệ response từng kênh / chi phí thực tế | Lan | Thông gom số liệu | 21/06 | P1 |
| 8 | Quyết định | Lan tự quyết dựa trên 4 câu hỏi Phần D: có build crawler để scale VN không? Có thêm người ops không? Có bật quảng cáo nhỏ không? | Lan | — | 21/06 | P1 |

**Kết quả kỳ vọng cuối Tuần 6:** 105–155 employer (VN 80–120 + DE 25–35 — DE qua 3 kênh không-email) + 380–530 jobs published + 100–150 candidate + ≥60 applies thật.

---

### B.4. KPI tổng theo tuần

| Chỉ số | Cuối T2 | Cuối T4 | Cuối T6 |
|---|---|---|---|
| Employer VN verified (cộng dồn) | 40–60 | 80–120 | 80–120 |
| Employer DE verified (cộng dồn) — qua 3 kênh không-email | 0 | 0 | 25–35 |
| Jobs VN published (cộng dồn) | 120–180 | 300–400 | 320–430 |
| Jobs DE published (cộng dồn) | 0 | 0 | 60–100 |
| **Tổng jobs published** | **120–180** | **300–400** | **380–530** |
| Candidate opt-in (cộng dồn) | 15–25 | 50–80 | 100–150 |
| Applies thật (cộng dồn) | ≥5 | ≥25 | ≥60 |
| Jobs per employer trung bình | ≥3 | ≥3 | ≥4 |
| Response rate Email VN | ≥15% | ≥15% | — |
| Response rate LinkedIn VN | ≥25% | ≥25% | — |
| Response rate LinkedIn DE | — | — | ≥15% |
| Response rate XING DE | — | — | ≥10% |
| Conversion rate Referral DE (warm intro) | — | — | ≥30% |
| Bounce rate email VN | <2% | <2% | <2% |
| Complaint rate VN | <0.1% | <0.1% | <0.1% |
| Domain reputation mail-tester (VN) | ≥8/10 | ≥9/10 | ≥9/10 |
| Cold email DE đã gửi | 0 | 0 | **0 (bắt buộc)** |
| % job public có `verification_type` ∈ owner | 100% | 100% | 100% |

---

### B.5. An toàn email outreach — quy tắc bất di bất dịch

> **🚫 ĐỨC (DE) — KHÔNG GỬI COLD EMAIL TRONG 6 TUẦN NÀY (theo QĐ2):**
> - **Áp dụng:** Tuần 5–6 (DE phase). DE outreach **qua 3 kênh không-email: LinkedIn + XING + Referral**. Email DE chỉ được gửi sau khi employer đã reply một trong 3 kênh trên hoặc chủ động cung cấp email
> - **Cơ sở pháp lý:** UWG §7 + IHK München — mọi email "quảng cáo" (kể cả "xin phép đăng tin miễn phí") cần consent trước. Đăng email B2B trên Impressum KHÔNG tạo consent. Thêm "Reply STOP" trong email đầu KHÔNG chữa được vi phạm
> - **Tại sao LinkedIn + XING + Referral an toàn:**
>   - **LinkedIn / XING connection request:** không bị xem là Werbung theo case law DE (người nhận chủ động accept/decline trong UI của platform; platform tự xử lý consent qua ToS)
>   - **Referral warm intro:** đã có quan hệ trước (qua candidate giới thiệu) → ngoài phạm vi cold contact của UWG §7
> - **Trần thiệt hại nếu vi phạm cold email:**
>   - Abmahnung + Unterlassungserklärung + Vertragsstrafe: vài nghìn EUR/vụ + chi phí luật sư
>   - Tranh chấp tại Landgericht (giá trị ≥5.000 EUR): bắt buộc có luật sư
>   - § 890 ZPO Ordnungsgeld: tới **250.000 EUR/vi phạm** nếu tái phạm sau lệnh tòa, hoặc Ordnungshaft tới 2 năm
>   - GDPR Art. 83: trần **20 triệu EUR hoặc 4% doanh thu toàn cầu năm trước**
>   - Bundesnetzagentur có form khiếu nại email spam riêng — người nhận có thể khiếu nại dễ
> - **Hệ quả vi phạm khả thi:** chỉ cần 1–2 người nhận khiếu nại + 1 abmahnung là đã có thể bị truy đến mức Vertragsstrafe. Không phải "rủi ro 3.000 EUR" mà là dải hậu quả lớn hơn nhiều
> - **Domain `outreach.vietnam-work.de`:** dùng cho VN (Tuần 1–4). KHÔNG kích hoạt outreach DE từ domain này.

#### Phân loại email trước khi gửi — BẮT BUỘC

Chỉ gửi tới prefix B2B công khai: `info@`, `kontakt@`, `office@`, `hr@`, `jobs@`, `careers@`, `recruiting@`, `contact@`, `hello@`, `team@`.

Không bao giờ gửi tới: `gmail.com`, `yahoo.de`, `web.de`, `gmx.de`, `hotmail.com`, `outlook.com`, `t-online.de` — kể cả khi đó là chủ doanh nghiệp. Không bao giờ gửi tới email cá nhân kiểu `peter.schmidt@firma.de` dù trên domain công ty.

Mọi địa chỉ phải qua `EmailValidator::isB2BAcceptable()` + `EmailBlacklist::isBlacklisted()` trước khi gửi.

#### Lịch warm-up — không được vượt

| Giai đoạn | Tốc độ tối đa | Ghi chú |
|---|---|---|
| Tuần 1 (domain mới) | 20 email/ngày VN | Chưa có reputation — chỉ gửi đến đây |
| Tuần 2 | 50 email/ngày VN | Tăng khi bounce <2% và complaint <0.1% |
| Tuần 3–4 | 100 email/ngày VN | — |
| Tuần 5–6 (DE phase) | **0 email cold DE** | DE outreach chỉ qua LinkedIn (theo QĐ2). Email DE chỉ gửi cho employer đã reply LinkedIn |

> LinkedIn và Zalo không bị giới hạn bởi warm-up IP — đây là lý do 3 kênh đồng thời có ưu thế lớn so với chỉ dùng email.

#### Dừng toàn bộ outreach trong 24h nếu phát hiện

1. Domain xuất hiện trong bất kỳ blacklist nào (Spamhaus, SORBS, Barracuda)
2. Bounce rate tuần >5%
3. Complaint rate tuần >0.1%
4. Mail-Tester rơi xuống <7/10 cho template đang dùng
5. Nhận thư khiếu nại từ luật sư hoặc cơ quan bảo vệ dữ liệu

→ Dừng → root-cause analysis 48h → fix → warm-up lại từ 20/ngày → báo Chú Hùng.

#### Theo dõi reputation — Lan check thứ 6 hằng tuần

| Công cụ | Mục tiêu |
|---|---|
| MXToolbox SuperTool | 0 blacklist |
| Mail-Tester | Mỗi template mới ≥9/10 |
| Brevo bounce/complaint | Bounce <2%, Complaint <0.1% |
| Google Postmaster Tools | Tham khảo — có thể thiếu dữ liệu ở volume thấp (<100/ngày); không dùng làm cửa chặn cứng |

---

### B.6. Phân bổ thời gian làm việc (1 ngày = 8h)

> Tính trên ngày làm việc bình thường — không tính thứ 7. Thứ 6 Lan thêm ~1h viết báo cáo (đã tính vào trung bình). Số giờ thay đổi theo tuần: tuần build kỹ thuật nhiều giờ hơn, tuần ổn định sau ít hơn.

#### Tuần 1–4 — Thị trường Việt Nam

**Lan:**

| Việc | Giờ/ngày |
|---|---|
| Build kỹ thuật (Importer, AI Rewrite, Admin Queue, SEO, email hạ tầng) | 3–4h |
| Xử lý JD VN từ Thông forward: AI rewrite + preview + employer confirm + publish | 2–3h |
| Duyệt Admin Queue cuối (approve final trước khi publish) | 0.5h |
| Unblock Thông, duyệt script, trả lời câu hỏi ops | 0.5h |
| Check reputation email + QA nhanh hằng ngày | 0.5h |
| **Tổng** | **6.5–8.5h** |
| **Trung bình** | **~7.5h — chiếm ~94%** |

**Thông:**

| Việc | Giờ/ngày |
|---|---|
| Inbox 3 kênh VN (Email + LinkedIn + Zalo) + cập nhật tracker | 0.75h |
| Admin Queue duyệt sơ bộ 10–15 job | 1–1.5h |
| Phân phối 3–5 jobs lên kênh (tìm group, viết text, đăng, ghi tracker) | 1h |
| Gửi outreach mới: Email setup Brevo + LinkedIn 30–50 message + Zalo | 1.5h |
| Nhận JD từ employer đồng ý, forward Lan kèm context | 0.5h |
| Follow-up employer đúng ngày 6 | 0.25h |
| **Tổng** | **5–5.5h** |
| **Trung bình** | **~5.25h — chiếm ~66%** |

---

#### Tuần 5–6 — Thị trường Đức (Lan toàn quyền DE)

**Lan:**

| Việc | Giờ/ngày |
|---|---|
| DE outreach **3 kênh**: LinkedIn 6–12 connection/ngày + XING 6–10 connection/ngày + Referral warm intro (3–5 cases/tuần) | 2.5–3h |
| DE concierge: nhận JD → AI rewrite → preview → employer confirm → publish | 2–3h |
| VN tồn đọng: xử lý JD VN còn trong inbox từ Thông forward | 1h |
| Kỹ thuật nhỏ: weekly digest, reputation check (chỉ stream VN), SEO fix nhỏ | 1h |
| **Tổng** | **6.5–8h** |
| **Trung bình** | **~7.25h — chiếm ~91%** |

**Thông** *(chỉ VN tồn đọng, không outreach mới)*:

| Việc | Giờ/ngày |
|---|---|
| Inbox VN còn lại (employer reply muộn, câu hỏi follow-up) | 0.25h |
| Admin Queue duyệt sơ bộ ~5–10 job VN tồn đọng | 0.75h |
| Phân phối job mới published (cả VN + DE) | 1h |
| Candidate ops: invite candidate VN tại Đức, hỗ trợ CV | 1h |
| Cập nhật tracker, gom số liệu cho báo cáo Lan | 0.5h |
| **Tổng** | **3.5–4h** |
| **Trung bình** | **~3.75h — chiếm ~47%** |

---

#### Tổng hợp so sánh

| | Lan | Thông |
|---|---|---|
| **Tuần 1–4** | ~7.5h/ngày — **94%** | ~5.25h/ngày — **66%** |
| **Tuần 5–6** | ~7.25h/ngày — **91%** | ~3.75h/ngày — **47%** |
| **Trung bình 6 tuần** | **~7.4h/ngày — 93%** | **~4.75h/ngày — 59%** |

> **Nhận xét:**
> - Lan T1–T4 gần full-load (94%); T5–T6 ~91% (cao hơn DE-LinkedIn-only do thêm XING + Referral nhưng vẫn đủ buffer 0.5–0.75h/ngày).
> - Thông có dư ~34% (2.75h) trong Tuần 1–4 — đây là buffer để xử lý tình huống inbox JD đột biến hoặc employer phản hồi hàng loạt cùng ngày.
> - Tuần 5–6 Thông còn 53% thời gian trống — dùng để gom danh sách candidate VN tại DE cho Referral pipeline (~30 phút/ngày), recruit candidate DE, hoặc chuẩn bị vòng outreach VN tiếp theo.

---

## PHẦN C — PHÂN CÔNG LAN / THÔNG / CHÚ HÙNG

### C.1. Bảng phân vai

| Mảng | Lan | Thông | Chú Hùng |
|---|---|---|---|
| Kỹ thuật / Mã nguồn | Toàn quyền: 3 module, SEO, email hạ tầng, AI rewrite, cờ dữ liệu | — | Đọc báo cáo tuần |
| Duyệt & publish | **Người duy nhất** bấm publish — employer / job / candidate | Duyệt sơ bộ qua Admin Queue, gắn cờ cần Lan xem | Đọc báo cáo tuần |
| Outreach **thị trường VN** (Tuần 1–4) | Soạn + duyệt script 3 kênh, đặt chỉ tiêu | Thực thi: email (Brevo) + LinkedIn + Zalo; cập nhật tracker; follow-up 1 lần | Đọc báo cáo tuần |
| Outreach **thị trường DE** (Tuần 5–6) | **Toàn quyền — 3 kênh không-email**: compile danh sách, viết template LinkedIn + XING + Referral, gửi connection trên 2 platform, gửi warm intro qua candidate, xử lý reply, push vị trí. KHÔNG cold email DE (theo QĐ2 + B.5) | Gom danh sách candidate VN tại DE từ Referral form, forward Lan | Đọc báo cáo tuần |
| Concierge employer **VN** | Nhận JD → AI rewrite → preview → confirm → publish | Nhận JD từ employer VN, forward Lan; hỏi push thêm vị trí | Đọc báo cáo tuần |
| Concierge employer **DE** | **Toàn quyền**: nhận JD → AI rewrite → preview → confirm → publish | — | Đọc báo cáo tuần |
| Candidate ops | Soạn luồng, duyệt hồ sơ preview, publish | Nhận CV, tạo preview `private`, hướng dẫn bổ sung | Đọc báo cáo tuần |
| Phân phối job | Chốt danh sách kênh, duyệt cách đăng | Đăng max 1 bài/ngày/group, ghi tracker | Đọc báo cáo tuần |
| Báo cáo | Gửi báo cáo tuần thứ Sáu | Cập nhật tracker hằng ngày, gom số liệu | Chỉ đọc, không cần phản hồi trừ đề xuất chi tiền |
| Ngân sách | Lên danh sách cần chi + lý do, gửi Chú Hùng | — | Duyệt chi tiền khi Lan đề xuất |

---

### C.2. SOP hàng ngày — Thông

> **Phạm vi của Thông: thị trường Việt Nam (Tuần 1–4) và xử lý tồn đọng VN (Tuần 5–6).** Mọi việc liên quan đến thị trường Đức (DE) — outreach, inbox, concierge, template — do **Lan toàn quyền phụ trách**.

**Buổi sáng (1.5–2h):**
1. **Inbox 3 kênh VN** (Email outreach reply + LinkedIn messages + Zalo): cập nhật tracker trạng thái từng employer VN. Với employer VN reply đồng ý → hỏi ngay toàn bộ vị trí đang tuyển.
2. **Admin Review Queue**: duyệt 10–15 job (A/E/R, <30 giây/job). Nếu thiếu thông tin → mở nguồn gốc (email/website employer) để điền thêm. Không tự đoán.

**Buổi trưa (1h):**
3. **Phân phối job mới published**: 3–5 jobs/ngày tổng cộng, max 1 bài/ngày/group. Ưu tiên bài tổng hợp "5 việc mới tuần này" thay vì đăng từng job lẻ. Ghi tracker: `job_id | kênh | thời gian | view | apply`.

**Buổi chiều (1.5–2h):**
4. **Gửi outreach VN mới**: Email qua Brevo (theo warm-up schedule) + LinkedIn 30–50 message + Zalo batch mới — **chỉ employer VN**.
5. **Nhận JD mới từ employer VN đồng ý**: forward về Lan kèm context (tên công ty, kênh reply, số vị trí). Không tự AI rewrite.
6. **Follow-up** employer VN đúng 5 ngày sau outreach (1 lần duy nhất, mọi kênh).

**Quy trình tiếp cận 1 employer VN:**
```
Ngày 1: Email B2B → LinkedIn connect + message → Zalo (nếu có)
Ngày 6: Follow-up 1 lần duy nhất qua bất kỳ kênh chưa reply
Sau đó: Không liên hệ thêm → status "No Reply" → thử lại tháng sau

Khi nhận reply bất kỳ kênh:
  → Trả lời ngay
  → Hỏi: "Ngoài [X], còn tuyển vị trí nào không? Đăng hộ tất cả miễn phí"
  → Nhận JD → forward Lan
```

---

### C.3. Danh sách việc hàng tuần — Lan

**Thứ 2 sáng:** xem tracker của Thông (VN), lên ưu tiên tuần, unblock vướng mắc.
**Thứ 2–5 (Tuần 1–4):** build kỹ thuật theo lịch tuần + xử lý JD VN từ Thông forward + publish qua Admin Queue.
**Thứ 2–5 (Tuần 5–6):** **toàn bộ DE** — check inbox **LinkedIn + XING DE** + xem list Referral mới từ Thông (KHÔNG mở cold email DE), gửi connection 2 platform + warm intro, reply employer DE, push vị trí, nhận JD DE, AI rewrite DE, publish DE + tiếp tục xử lý JD VN tồn đọng.
**Thứ 6 sáng:** QA — check reputation email (MXToolbox + Google Postmaster), sample 5 job random kiểm data.
**Thứ 6 chiều:** viết và gửi báo cáo tuần cho Chú Hùng.
**Thứ 7:** dọn backlog, chuẩn bị plan tuần sau.

---

### C.4. Mẫu báo cáo tuần (Lan gửi Chú Hùng — chiều thứ Sáu, chỉ để biết)

```
TUẦN [số] — VIETNAM-WORK
Ngày báo cáo: [dd/mm/yyyy]
Thị trường đang làm: [VN / Chuyển sang DE]

1. Việc đã hoàn thành tuần này:
   - [gạch đầu dòng có bằng chứng: link, ảnh chụp, số liệu]

2. Số liệu tuần này:
   - Employer outreach: gửi [X] / reply [Y] / tỷ lệ [Z%] / kênh hiệu quả nhất [Email/LinkedIn/Zalo]
   - Jobs published mới: [X] VN + [Y] DE
   - Candidate opt-in mới: [X]
   - Applies thật mới: [X]
   - Bounce rate: [X%] / Complaint rate: [X%]

3. Quyết định Lan đã chốt tuần này:
   - [chỉ để Chú Hùng biết — không cần đồng ý]

4. Đề xuất chi tiền (nếu có):
   - [hạng mục — số tiền — lý do]

5. Kế hoạch tuần tới:
   - [3–5 mục có hạn chót cụ thể]
```

---

### C.5. SOP rút gọn cho Thông

**SOP-01: Tiếp cận 1 employer VN (3 kênh)** — Thông thực hiện, chỉ áp dụng thị trường VN
1. Tìm email B2B từ trang "Liên hệ" / LinkedIn company → qua `EmailValidator` → nếu fail → bỏ qua email, chỉ dùng LinkedIn + Zalo
2. Tìm HR Manager / Founder trên LinkedIn của công ty đó
3. Tìm Zalo công ty trên website (nếu có)
4. Ngày 1: gửi email (qua Brevo) + LinkedIn message + Zalo trong cùng ngày
5. Ghi tracker: `ngày gửi email | ngày gửi LinkedIn | ngày gửi Zalo | status=Sent`
6. Ngày 6: nếu chưa reply → follow-up 1 lần qua kênh chưa trả lời
7. Sau đó: không liên hệ thêm

**SOP-02: Khi employer VN reply đồng ý** — Thông thực hiện, chỉ áp dụng thị trường VN
1. Trả lời ngay: xác nhận + cảm ơn
2. Hỏi ngay: *"Ngoài [vị trí X], công ty còn đang tuyển vị trí nào khác không?"*
3. Nhận JD bất kỳ format (PDF/Word/text/link) → forward cho Lan kèm: tên công ty + kênh reply + số vị trí hỏi được
4. Ghi tracker: `reply_channel | positions_asked | jd_received`
5. Sau 3–5 ngày không thấy Lan publish → hỏi lại Lan (không tự làm)

> **Lưu ý:** employer DE — mọi bước từ outreach, nhận reply, xử lý JD đều do **Lan trực tiếp** xử lý. Thông không tham gia vào luồng DE.

**SOP-03: Duyệt 1 job trong Admin Queue**
1. Mở job → kiểm 6 trường: title rõ ràng, description ≥150 ký tự, location, category, employer thật, expired_time hợp lý
2. Nếu thiếu → mở link nguồn (email employer hoặc website) điền thêm → bấm E (edit)
3. Nếu đủ → bấm A (approve) → đợi Lan publish cuối
4. Nếu sai / không thể sửa → bấm R (reject) + ghi lý do rõ
5. Không bao giờ tự bấm Publish

---

### C.6. KPI cá nhân

**Lan:**
- AI Rewrite success rate ≥90% (cả VN lẫn DE)
- Publish delay <24h sau khi Thông approve trong Admin Queue (VN) hoặc employer DE confirm (DE)
- 0 lỗi data nghiêm trọng sống quá 48h
- 1 báo cáo tuần đúng hạn mỗi tuần
- Reputation email check đầy đủ mỗi thứ 6
- **Tuần 5–6:** inbox **LinkedIn + XING DE** check ít nhất 2 lần/ngày, reply employer DE trong 24h. Warm intro Referral gửi trong 48h sau khi candidate forward. **0 cold email DE đã gửi** (KPI hard gate)

**Thông:** *(áp dụng cho thị trường VN — không có chỉ số DE)*
- 10–15 job duyệt sơ bộ qua Admin Queue mỗi ngày
- Outreach VN bám đúng warm-up schedule (không vượt cap ngày)
- Push câu hỏi toàn bộ vị trí với 100% employer VN reply đồng ý
- 100% tracker VN cập nhật trong ngày (không cập nhật = coi như chưa làm)
- 0 lần tự publish data chưa qua Lan
- 0 lần gửi email/LinkedIn/Zalo tới employer DE (DE thuộc phạm vi Lan)

**Chú Hùng:**
- Đọc báo cáo tuần (5 phút/tuần)
- Phản hồi đề xuất chi tiền trong 24h
- Không can thiệp triển khai

---

## PHẦN D — DANH SÁCH KIỂM TRA NHANH

### Trước khi bấm "Publish" bất kỳ bản ghi nào — 6 câu hỏi

1. `verification_type=owner_confirmed`? *(trong concierge flow 6 tuần, employer phải confirm preview trước publish — không publish khi vẫn ở `owner_submitted`)*
2. Employer đã confirm preview qua email/inbox chưa? *(có log/screenshot)*
3. `public_indexable=true` và `verified_status` đã chuyển khỏi `pending` chưa?
4. Wording khớp dữ liệu thật, không tuyên bố sai, không bịa số liệu?
5. Không trùng job nào trong 7 ngày gần nhất (similarity <0.8)?
6. `expired_time` còn hạn thật (≥7 ngày từ hôm nay) + Người duyệt cuối là **Lan**?

→ **6/6 ĐÚNG** mới được Publish. Thiếu 1 câu = giữ `private` / `pending`.

---

### Trước khi chuyển sang giai đoạn tiếp (cuối Tuần 4 và cuối Tuần 6) — Lan tự quyết

1. Có đạt KPI mốc tương ứng không (xem bảng B.4)?
2. Có lỗi nghiêm trọng đang sống không?
3. Bộ đếm, biểu ngữ, trang chủ có khớp dữ liệu thật không?
4. Reputation email đang ổn (0 blacklist, bounce <2%, complaint <0.1%, mail-tester ≥9/10 cho template hiện dùng)?

→ **4/4 ĐÚNG** → tiến sang giai đoạn tiếp. Thiếu 1 = Lan lùi 1 tuần, không nhảy. Ghi kết quả vào báo cáo tuần.

---

**Hết.**
