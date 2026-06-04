import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ORG_ID = "org_demo_seed";
const DEMO_ORG_SLUG = "demo";
const DEMO_CLERK_ORG_ID = "clerk_org_demo_placeholder";

async function main() {
  console.log("🌱 Seeding multi-tenant database...");

  const demoOrg = await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      clerkOrgId: DEMO_CLERK_ORG_ID,
      slug: DEMO_ORG_SLUG,
      name: "Demo Workspace",
      plan: "FREE",
      status: "ACTIVE",
      seatLimit: 20,
    },
  });

  console.log(`✅ Organization: ${demoOrg.name} (slug: ${demoOrg.slug})`);

  await seedRolesForOrg(demoOrg.id);
  await seedTaskTemplatesForOrg(demoOrg.id);
  await seedWorkRulesForOrg(demoOrg.id);

  console.log("\n🎉 Seed completed!");
  console.log(`\n📋 Demo organization ready:`);
  console.log(`   ID:       ${demoOrg.id}`);
  console.log(`   Slug:     ${demoOrg.slug}`);
  console.log(`   URL:      http://${demoOrg.slug}.localhost:3000`);
  console.log(`\n👤 Next: sign up via Clerk to create your owner account.`);
}

async function seedRolesForOrg(organizationId: string) {
  const rolePerms = {
    SUPER_ADMIN: { all: true },
    ADMIN: {
      employees: { create: true, read: true, update: true, delete: false },
      salary: { create: true, read: true, update: true, delete: false },
      tasks: { create: true, read: true, update: true, delete: true },
      timeLogs: { create: true, read: true, update: true, approve: true },
      taskTemplates: { create: true, read: true, update: true, delete: true },
      taskReviews: { read: true, approve: true },
      officeTime: { create: true, read: true, approve: true },
    },
    MANAGER: {
      employees: { read: true, scope: "team" },
      tasks: { create: true, read: true, update: true, scope: "team" },
      timeLogs: { read: true, approve: true, scope: "team" },
      taskTemplates: { create: true, read: true, update: true },
      taskReviews: { read: true, approve: true, scope: "team" },
      officeTime: { read: true, approve: true, scope: "team" },
      salary: { read: true, scope: "team" },
    },
    TEAM_LEAD: {
      tasks: { create: true, read: true, update: true, scope: "team" },
      timeLogs: { read: true, approve: true, scope: "team" },
      taskTemplates: { read: true, update: true },
      taskReviews: { read: true, approve: true, scope: "team" },
    },
    EMPLOYEE: {
      tasks: { create: true, read: true, update: true, scope: "self" },
      timeLogs: { create: true, read: true, update: true, scope: "self" },
      taskReviews: { create: true, read: true, scope: "self" },
      officeTime: { create: true, read: true, scope: "self" },
      leave: { create: true, read: true, scope: "self" },
    },
    HR: {
      employees: { create: true, read: true, update: true },
      leave: { create: true, read: true, update: true, approve: true },
    },
    ACCOUNTANT: {
      salary: { read: true, create: true, update: true },
      payments: { read: true, create: true, update: true },
    },
  } as const;

  const roleSpecs: { name: keyof typeof rolePerms; label: string }[] = [
    { name: "SUPER_ADMIN", label: "Super Admin" },
    { name: "ADMIN", label: "Admin" },
    { name: "MANAGER", label: "Manager" },
    { name: "TEAM_LEAD", label: "Team Lead" },
    { name: "EMPLOYEE", label: "Nhân viên" },
    { name: "HR", label: "HR" },
    { name: "ACCOUNTANT", label: "Kế toán" },
  ];

  for (const spec of roleSpecs) {
    await prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: spec.name } },
      update: { permissions: rolePerms[spec.name] },
      create: {
        organizationId,
        name: spec.name,
        label: spec.label,
        permissions: rolePerms[spec.name],
      },
    });
  }

  console.log(`✅ Roles: ${roleSpecs.length} seeded for org ${organizationId}`);
}

async function seedTaskTemplatesForOrg(organizationId: string) {
  const templates = [
    { code: "DAILY_STANDUP",    title: "Daily Standup",      defaultTaskType: "MEETING" as const,         defaultEstimatedTime: 15, department: "All" },
    { code: "CODE_REVIEW",      title: "Review Pull Request", defaultTaskType: "NORMAL" as const,         defaultEstimatedTime: 30, department: "Dev" },
    { code: "REPLY_EMAIL",      title: "Trả email khách",    defaultTaskType: "ADMIN" as const,           defaultEstimatedTime: 10, department: "All" },
    { code: "DEPLOY_STAGING",   title: "Deploy lên staging", defaultTaskType: "NORMAL" as const,          defaultEstimatedTime: 15, department: "Dev" },
    { code: "BUG_FIX_QUICK",    title: "Fix bug nhỏ",        defaultTaskType: "NORMAL" as const,          defaultEstimatedTime: 30, department: "Dev" },
    { code: "LEARNING_SESSION", title: "Học công nghệ mới",  defaultTaskType: "LEARNING" as const,        defaultEstimatedTime: 60, department: "All",  requiresVideo: true },
    { code: "CLIENT_SUPPORT",   title: "Hỗ trợ khách hàng",   defaultTaskType: "BILLABLE_CLIENT" as const, defaultEstimatedTime: 30, department: "All" },
    { code: "WRITE_DOCS",       title: "Viết tài liệu",      defaultTaskType: "NORMAL" as const,          defaultEstimatedTime: 30, department: "Dev" },
    { code: "INTERNAL_MEETING", title: "Họp nội bộ",         defaultTaskType: "MEETING" as const,         defaultEstimatedTime: 60, department: "All" },
    { code: "PROGRESS_REPORT",  title: "Báo cáo tiến độ",    defaultTaskType: "ADMIN" as const,           defaultEstimatedTime: 15, department: "All" },
  ];

  for (const t of templates) {
    await prisma.taskTemplate.upsert({
      where: { organizationId_code: { organizationId, code: t.code } },
      update: {},
      create: { organizationId, ...t },
    });
  }

  console.log(`✅ Task Templates: ${templates.length} seeded`);
}

async function seedWorkRulesForOrg(organizationId: string) {
  const rules = [
    { ruleNo: 1, title: "Báo cáo công việc cuối ngày", description: "Vào cuối ngày làm việc, nếu trong ngày có phát sinh công việc, vui lòng log time vào hệ thống. Mỗi time log phải gắn với 1 task và có đủ thông tin để người khác hiểu và kiểm tra lại." },
    { ruleNo: 2, title: "Mọi công việc đều phải có Task", description: "Không có giờ làm 'tự do'. Mỗi phiên làm việc phải log vào 1 Task cụ thể. Việc nhỏ — tạo Quick Task hoặc dùng Template. Việc dài hạn — tạo Task có due date và estimate." },
    { ruleNo: 3, title: "Ưu tiên sử dụng công cụ hỗ trợ", description: "Công ty khuyến khích nhân viên sử dụng các công cụ hỗ trợ phù hợp nhằm tiết kiệm thời gian và nâng cao chất lượng công việc (AI, speech-to-text, ...)." },
    { ruleNo: 4, title: "Quy trình xin hỗ trợ: Tự tra cứu → AI → hỏi đồng nghiệp", description: "Trước khi hỏi đồng nghiệp: (a) Tự tra cứu trong hệ thống, (b) Thử dùng AI để tự giải quyết, (c) Nếu vẫn cần hỏi: gửi câu hỏi kèm link + screenshot + video." },
    { ruleNo: 5, title: "Tách biệt thông tin cá nhân và công việc", description: "Không sử dụng thông tin cá nhân (email, tài khoản riêng) cho công việc của công ty." },
    { ruleNo: 6, title: "Quản lý tài khoản & mật khẩu rõ ràng", description: "Các tài khoản tạo cho công ty cần được lưu đầy đủ trong tab Password. Các tài khoản tạo cho khách hàng cần được lưu trong tab riêng của từng khách hàng." },
    { ruleNo: 7, title: "Về chênh lệch thời gian thực tế", description: "Nếu actual_time vượt estimated_time của task: bắt buộc quay màn hình kèm audio giải thích, đính kèm video_link vào time log để Manager duyệt." },
    { ruleNo: 8, title: "Duyệt thời gian làm việc & chi phí", description: "Công ty giữ quyền xem xét và duyệt lại thời gian làm việc, cũng như các khoản chi phí hoặc mức lương liên quan, nhằm đảm bảo tính công bằng và thống nhất." },
  ];

  for (const rule of rules) {
    await prisma.workRule.upsert({
      where: { organizationId_ruleNo: { organizationId, ruleNo: rule.ruleNo } },
      update: rule,
      create: { organizationId, ...rule },
    });
  }

  console.log(`✅ Work Rules: ${rules.length} seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
