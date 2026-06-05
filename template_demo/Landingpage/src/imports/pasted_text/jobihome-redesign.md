You are a senior product designer. Redesign the landing page for **jobihome.vn** — a Vietnamese B2B SaaS platform for team & HR management (tasks, time tracking, payroll, audit) targeting Vietnamese tech startups with 5–20 employees.

---

## DESIGN DIRECTION
- Style: Clean, modern SaaS — inspired by Linear.app and Notion's marketing site
- Color palette: Primary #3B5BDB (blue), Accent #0CA678 (teal-green for success/trust badges), Neutral grays
- Typography: Bold display headline (700), clean body (400–500), generous line-height 1.7
- Language: Vietnamese throughout
- Tone: Professional but approachable — "startup-friendly enterprise"

---

## CURRENT PROBLEMS TO FIX (apply all fixes below)

### FIX 1 — Hero Section: Add product visual + social proof strip
Current: Hero has only headline + CTA buttons, no product visual.
Fix:
- Add a realistic product mockup / dashboard screenshot (browser frame) to the right side of the hero. Use a laptop/browser frame mockup style. Show a fake task board with Vietnamese content.
- Below the two CTA buttons, add a social proof micro-strip: avatar stack (4–5 overlapping user avatars) + text "Đang được tin dùng bởi 120+ startup Việt"
- Add 3 trust badges below the strip: ✓ Không cần thẻ tín dụng  ✓ Setup trong 2 phút  ✓ Hỗ trợ tiếng Việt

### FIX 2 — Sticky CTA Bar (new component)
Add a sticky top bar that appears on scroll (after hero):
- Background: white with 1px bottom border shadow
- Left: logo small + tagline "Quản lý team thông minh hơn"
- Right: "Dùng thử miễn phí 14 ngày →" button (primary blue)
- Height: 56px, full width

### FIX 3 — Testimonial Section (new section, insert after Features)
Create a testimonial section titled "Khách hàng nói gì về jobihome.vn"
Layout: 3-column card grid
Each card contains:
  - Star rating (5 stars, gold)
  - Quote text (2–3 lines, Vietnamese)
  - Avatar (circle, 40px) + Name + Title + Company
  - Subtle card: white bg, 1px border, 12px radius, soft shadow

Sample data for 3 cards:
Card 1: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager giờ chỉ cần nhìn dashboard là nắm được tiến độ." — Minh Tuấn, CTO, Finsify
Card 2: "Tính năng payroll tự động giúp HR của mình tiết kiệm gần 2 ngày làm việc mỗi tháng." — Lan Anh, HR Manager, GrowthHack Agency  
Card 3: "Setup trong 15 phút, team dùng ngay không cần training. Đơn giản hơn Jira rất nhiều." — Đức Anh, Founder, Techlab Studio

### FIX 4 — Trust/Stats Bar (new section, insert between Hero and Pain Points)
Full-width light gray background strip with 4 stat blocks in a row:
- 120+ | Công ty đang dùng
- 4.8★ | Đánh giá trung bình
- 2 phút | Thời gian setup
- 98% | Tỷ lệ gia hạn

Each stat: large bold number (#3B5BDB), small label below in gray.

### FIX 5 — Features Section: Add product screenshots inside cards
Current: 6 feature cards with icon + text only.
Fix:
- Reduce to 3 MAIN feature cards (larger, 2-column layout with text left, image right):
  1. Task Management — show a mini kanban board mockup
  2. Time Tracking — show a timesheet/timer UI mockup
  3. Payroll & Salary — show a salary slip or payroll table mockup
- Below those 3 main cards, keep the remaining 3 features (Multi-team, Audit Log, Activity Heatmap) as smaller secondary cards in a 3-column row.

### FIX 6 — Pricing Section: Add inline CTA + guarantee note
Current: Pricing cards end with buttons, nothing after.
Fix:
- After the 3 pricing cards, add a centered line: "🔒 Dữ liệu được mã hóa SSL • Thanh toán an toàn qua VNPAY, MoMo, chuyển khoản"
- Add an inline CTA block below pricing: "Chưa chắc? Xem demo 15 phút với đội ngũ jobihome" with a ghost button "Đặt lịch demo →"

### FIX 7 — CTA Final Section: Improve the closing section
Current: Simple dark blue box with button.
Fix:
- Add a 2-column layout inside the CTA box:
  Left: headline + subtext + button
  Right: mini checklist of 4 items (✓ Không cần thẻ tín dụng, ✓ Hủy bất cứ lúc nào, ✓ Onboarding miễn phí, ✓ Hỗ trợ 24/7)
- Add subtle geometric pattern or dot grid as background texture

### FIX 8 — Typography & Spacing
- Hero H1: 52px, weight 800, line-height 1.15
- Section titles: 36px, weight 700
- Body text: 16px, line-height 1.75
- Increase vertical spacing between all sections to 96px (currently feels tight)
- All CTA buttons: height 48px, border-radius 8px, font-weight 600

---

## PAGE STRUCTURE (final order)
1. Navigation (existing, keep)
2. Hero Section [UPDATED: add mockup + social proof]
3. Stats/Trust Bar [NEW]
4. Pain Points section (existing)
5. Features Section [UPDATED: product screenshots]
6. Testimonials [NEW]
7. Pricing [UPDATED: guarantee + demo CTA]
8. FAQ (existing, keep)
9. Final CTA [UPDATED: 2-col layout]
10. Footer (existing, keep)

---

## CONSTRAINTS
- Desktop-first design (1280px frame width)
- Consistent 80px horizontal padding / max-width 1200px container
- Use #3B5BDB as primary, #0CA678 as success/accent, #F8F9FA as section alternating bg
- All Vietnamese text — do not use English placeholder text
- Accessible contrast ratios (WCAG AA minimum)