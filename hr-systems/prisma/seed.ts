import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Roles ──────────────────────────────────────────────────────────────────
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

  const roles = await Promise.all(
    roleSpecs.map((r) =>
      prisma.role.upsert({
        where: { name: r.name },
        update: { permissions: rolePerms[r.name] },
        create: { name: r.name, label: r.label, permissions: rolePerms[r.name] },
      })
    )
  );

  console.log("✅ Roles created:", roles.map((r) => r.name).join(", "));

  const adminRole = roles.find((r) => r.name === "ADMIN")!;
  const managerRole = roles.find((r) => r.name === "MANAGER")!;
  const teamLeadRole = roles.find((r) => r.name === "TEAM_LEAD")!;
  const employeeRole = roles.find((r) => r.name === "EMPLOYEE")!;

  const password = await bcrypt.hash("password123", 10);

  // ── Employees ──────────────────────────────────────────────────────────────
  const admin = await prisma.employee.upsert({
    where: { emailCompany: "admin@hung-it-solutions.com" },
    update: {},
    create: {
      employeeCode: "EMP001",
      fullName: "Admin Hệ Thống",
      department: "Management",
      roleId: adminRole.id,
      company: "Hung IT/GM",
      emailCompany: "admin@hung-it-solutions.com",
      payType: "MONTHLY",
      monthlySalary: 3000,
      maxHoursMonth: 160,
      startDate: new Date("2023-01-01"),
      status: "ACTIVE",
      passwordHash: password,
    },
  });

  const manager = await prisma.employee.upsert({
    where: { emailCompany: "manager@hung-it-solutions.com" },
    update: {},
    create: {
      employeeCode: "EMP002",
      fullName: "Lê Văn Quản",
      department: "Dev",
      roleId: managerRole.id,
      company: "Hung IT/GM",
      emailCompany: "manager@hung-it-solutions.com",
      payType: "HOURLY",
      hourlyRate: 15,
      maxHoursMonth: 180,
      startDate: new Date("2023-03-01"),
      managerId: admin.id,
      status: "ACTIVE",
      passwordHash: password,
    },
  });

  const lan = await prisma.employee.upsert({
    where: { emailCompany: "lanit@hung-it-solutions.com" },
    update: {},
    create: {
      employeeCode: "EMP015",
      fullName: "Đỗ Lan",
      department: "Dev & Team Lead",
      roleId: teamLeadRole.id,
      company: "Hung IT/GM",
      emailCompany: "lanit@hung-it-solutions.com",
      emailGoogle: "lanit@hung-it-solutions.com",
      payType: "HOURLY",
      hourlyRate: 10,
      maxHoursMonth: 160,
      driveLink1: "https://drive.google.com/drive/folders/1gtU3qlcFI3aMBTz2z80ioSKTDObCLAxx",
      driveLink2: "https://drive.google.com/drive/folders/1mFbEs13a5YOUaSOAh2gZI0RXJ38N9y98",
      startDate: new Date("2024-01-01"),
      managerId: manager.id,
      status: "ACTIVE",
      passwordHash: password,
    },
  });

  const nv2 = await prisma.employee.upsert({
    where: { emailCompany: "nv2@hung-it-solutions.com" },
    update: {},
    create: {
      employeeCode: "EMP008",
      fullName: "Nguyễn Văn An",
      department: "Dev",
      roleId: employeeRole.id,
      company: "Hung IT/GM",
      emailCompany: "nv2@hung-it-solutions.com",
      payType: "HOURLY",
      hourlyRate: 12,
      maxHoursMonth: 160,
      startDate: new Date("2024-06-01"),
      managerId: lan.id,
      status: "ACTIVE",
      passwordHash: password,
    },
  });

  console.log("✅ Employees created:", [admin, manager, lan, nv2].map((e) => e.fullName).join(", "));

  // ── Customers ──────────────────────────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { custId: "C001" },
    update: {},
    create: {
      custId: "C001",
      customerName: "Anna Schmidt",
      businessName: "Ht-nails.com",
      contactPerson: "Anna Schmidt",
      phone: "+49 123 456 789",
      email: "anna@ht-nails.com",
      city: "München",
      plz: "80333",
      preferredLanguage: "German",
      status: "ACTIVE",
      responsibleStaffId: lan.id,
      lastContactDate: new Date("2026-04-17"),
      notes: "Dự án ht-nails.com — trang web nail salon",
    },
  });

  console.log("✅ Customers created:", customer1.businessName);

  // ── Task Templates ─────────────────────────────────────────────────────────
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
      where: { code: t.code },
      update: {},
      create: { ...t, createdById: admin.id },
    });
  }

  console.log(`✅ Task Templates: ${templates.length} created`);

  // ── Sample Tasks ───────────────────────────────────────────────────────────
  const codeReviewTpl = await prisma.taskTemplate.findUnique({ where: { code: "CODE_REVIEW" } });
  const learningTpl = await prisma.taskTemplate.findUnique({ where: { code: "LEARNING_SESSION" } });

  const task1 = await prisma.task.upsert({
    where: { code: "TSK-0001" },
    update: {},
    create: {
      code: "TSK-0001",
      title: "Thiết kế giao diện trang chủ Ht-nails",
      description: "Thiết kế và code giao diện trang chủ theo mockup đã duyệt",
      taskType: "BILLABLE_CLIENT",
      priority: "HIGH",
      status: "IN_PROGRESS",
      estimatedTime: 480, // 8h
      progressPct: 60,
      customerId: customer1.id,
      billable: true,
      assignedToId: lan.id,
      assignedById: manager.id,
      dueDate: new Date("2026-05-15"),
      dateStarted: new Date("2026-05-01"),
    },
  });

  const task2 = await prisma.task.upsert({
    where: { code: "TSK-0002" },
    update: {},
    create: {
      code: "TSK-0002",
      title: "Fix bug form đặt lịch",
      description: "Form booking không gửi được email xác nhận",
      taskType: "BILLABLE_CLIENT",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      estimatedTime: 120, // 2h
      progressPct: 80,
      customerId: customer1.id,
      billable: true,
      assignedToId: nv2.id,
      assignedById: lan.id,
      dueDate: new Date("2026-05-07"),
      dateStarted: new Date("2026-05-02"),
    },
  });

  const task3 = await prisma.task.upsert({
    where: { code: "TSK-0003" },
    update: {},
    create: {
      code: "TSK-0003",
      title: "Viết tài liệu hướng dẫn admin",
      description: "Hướng dẫn cho khách hàng cách dùng trang admin",
      taskType: "NORMAL",
      priority: "NORMAL",
      status: "BACKLOG",
      estimatedTime: 180,
      assignedToId: lan.id,
      assignedById: manager.id,
      dueDate: new Date("2026-05-20"),
    },
  });

  const task4 = await prisma.task.upsert({
    where: { code: "TSK-0004" },
    update: {},
    create: {
      code: "TSK-0004",
      title: "Học Next.js 15 App Router",
      description: "Đọc docs + làm tutorial",
      taskType: "LEARNING",
      priority: "NORMAL",
      status: "IN_PROGRESS",
      estimatedTime: 120,
      requiresVideo: true,
      templateId: learningTpl?.id,
      assignedToId: lan.id,
      assignedById: lan.id,
    },
  });

  const task5 = await prisma.task.upsert({
    where: { code: "TSK-0005" },
    update: {},
    create: {
      code: "TSK-0005",
      title: "Code review PR #42",
      description: "Review PR feature booking calendar",
      taskType: "NORMAL",
      priority: "NORMAL",
      status: "DONE",
      estimatedTime: 30,
      progressPct: 100,
      templateId: codeReviewTpl?.id,
      assignedToId: nv2.id,
      assignedById: lan.id,
      dateStarted: new Date("2026-05-05"),
      dateCompleted: new Date("2026-05-05"),
    },
  });

  console.log(`✅ Sample Tasks: ${[task1, task2, task3, task4, task5].length} created`);

  // ── Sample Time Logs ───────────────────────────────────────────────────────
  await prisma.timeLog.createMany({
    data: [
      {
        taskId: task1.id,
        employeeId: lan.id,
        date: new Date("2026-05-05"),
        durationMinutes: 180,
        note: "Layout header + hero section",
        completionPctAfter: 30,
        creditedMinutes: 180,
        approvalStatus: "AUTO_APPROVED",
      },
      {
        taskId: task1.id,
        employeeId: lan.id,
        date: new Date("2026-05-06"),
        durationMinutes: 200,
        note: "Service section + footer",
        completionPctAfter: 60,
        creditedMinutes: 200,
        approvalStatus: "AUTO_APPROVED",
      },
      {
        taskId: task2.id,
        employeeId: nv2.id,
        date: new Date("2026-05-06"),
        durationMinutes: 90,
        note: "Tìm root cause: SMTP config sai",
        completionPctAfter: 80,
        creditedMinutes: 90,
        approvalStatus: "AUTO_APPROVED",
      },
      {
        taskId: task5.id,
        employeeId: nv2.id,
        date: new Date("2026-05-05"),
        durationMinutes: 35,
        note: "Review PR, comment 3 issues",
        completionPctAfter: 100,
        taskStatusAfter: "DONE",
        creditedMinutes: 30,
        approvalStatus: "AUTO_APPROVED",
      },
      {
        taskId: task4.id,
        employeeId: lan.id,
        date: new Date("2026-05-07"),
        durationMinutes: 60,
        note: "Đọc App Router docs",
        videoLink: "https://drive.google.com/file/d/sample-learning-video",
        videoCount: 1,
        videoDuration: 60,
        approvalStatus: "PENDING", // learning task → pending approval
      },
    ],
  });

  // Update task1 actualTimeTotal
  await prisma.task.update({
    where: { id: task1.id },
    data: { actualTimeTotal: 380, lastUpdate: new Date() },
  });
  await prisma.task.update({
    where: { id: task2.id },
    data: { actualTimeTotal: 90, lastUpdate: new Date() },
  });
  await prisma.task.update({
    where: { id: task5.id },
    data: { actualTimeTotal: 35, lastUpdate: new Date() },
  });
  await prisma.task.update({
    where: { id: task4.id },
    data: { actualTimeTotal: 60, lastUpdate: new Date() },
  });

  console.log(`✅ Sample Time Logs: 5 created`);

  // ── Work Rules ─────────────────────────────────────────────────────────────
  const rules = [
    {
      ruleNo: 1,
      title: "Báo cáo công việc cuối ngày",
      description: "Vào cuối ngày làm việc, nếu trong ngày có phát sinh công việc, vui lòng log time vào hệ thống. Mỗi time log phải gắn với 1 task và có đủ thông tin để người khác hiểu và kiểm tra lại.",
    },
    {
      ruleNo: 2,
      title: "Mọi công việc đều phải có Task",
      description: "Không có giờ làm 'tự do'. Mỗi phiên làm việc phải log vào 1 Task cụ thể. Việc nhỏ — tạo Quick Task hoặc dùng Template. Việc dài hạn — tạo Task có due date và estimate.",
    },
    {
      ruleNo: 3,
      title: "Ưu tiên sử dụng công cụ hỗ trợ",
      description: "Công ty khuyến khích nhân viên sử dụng các công cụ hỗ trợ phù hợp nhằm tiết kiệm thời gian và nâng cao chất lượng công việc (AI, speech-to-text, ...).",
    },
    {
      ruleNo: 4,
      title: "Quy trình xin hỗ trợ: Tự tra cứu → AI → hỏi đồng nghiệp",
      description: "Trước khi hỏi đồng nghiệp: (a) Tự tra cứu trong hệ thống, (b) Thử dùng AI để tự giải quyết, (c) Nếu vẫn cần hỏi: gửi câu hỏi kèm link + screenshot + video.",
    },
    {
      ruleNo: 5,
      title: "Tách biệt thông tin cá nhân và công việc",
      description: "Không sử dụng thông tin cá nhân (email, tài khoản riêng) cho công việc của công ty.",
    },
    {
      ruleNo: 6,
      title: "Quản lý tài khoản & mật khẩu rõ ràng",
      description: "Các tài khoản tạo cho công ty cần được lưu đầy đủ trong tab Password. Các tài khoản tạo cho khách hàng cần được lưu trong tab riêng của từng khách hàng.",
    },
    {
      ruleNo: 7,
      title: "Về chênh lệch thời gian thực tế",
      description: "Nếu actual_time vượt estimated_time của task: bắt buộc quay màn hình kèm audio giải thích, đính kèm video_link vào time log để Manager duyệt.",
    },
    {
      ruleNo: 8,
      title: "Duyệt thời gian làm việc & chi phí",
      description: "Công ty giữ quyền xem xét và duyệt lại thời gian làm việc, cũng như các khoản chi phí hoặc mức lương liên quan, nhằm đảm bảo tính công bằng và thống nhất.",
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.workRule.findFirst({ where: { ruleNo: rule.ruleNo } });
    if (existing) {
      await prisma.workRule.update({ where: { id: existing.id }, data: rule });
    } else {
      await prisma.workRule.create({ data: rule });
    }
  }

  console.log(`✅ Work Rules: ${rules.length} rules created`);

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Test accounts (password: password123):");
  console.log("   Admin:    admin@hung-it-solutions.com");
  console.log("   Manager:  manager@hung-it-solutions.com");
  console.log("   TeamLead: lanit@hung-it-solutions.com");
  console.log("   Employee: nv2@hung-it-solutions.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
