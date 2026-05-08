import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "SUPER_ADMIN" },
      update: {},
      create: {
        name: "SUPER_ADMIN",
        label: "Super Admin",
        permissions: {
          all: true,
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        label: "Admin",
        permissions: {
          employees: { create: true, read: true, update: true, delete: false },
          salary: { create: true, read: true, update: true, delete: false },
          workList: { create: true, read: true, update: true, delete: true },
          workReport: { create: true, read: true, update: true, approve: true },
          officeTime: { create: true, read: true, approve: true },
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "MANAGER" },
      update: {},
      create: {
        name: "MANAGER",
        label: "Manager",
        permissions: {
          employees: { read: true, scope: "team" },
          workList: { create: true, read: true, update: true, scope: "team" },
          workReport: { read: true, approve: true, scope: "team" },
          officeTime: { read: true, approve: true, scope: "team" },
          salary: { read: true, scope: "team" },
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "TEAM_LEAD" },
      update: {},
      create: {
        name: "TEAM_LEAD",
        label: "Team Lead",
        permissions: {
          workList: { create: true, read: true, update: true, scope: "team" },
          workReport: { read: true, approve: true, scope: "team" },
          missingTasks: { approve: true, scope: "team" },
          timeCheck: { approve: true, scope: "team" },
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "EMPLOYEE" },
      update: {},
      create: {
        name: "EMPLOYEE",
        label: "Nhân viên",
        permissions: {
          workList: { create: true, read: true, update: true, scope: "self" },
          workReport: { create: true, read: true, update: true, scope: "self" },
          officeTime: { create: true, read: true, scope: "self" },
          leave: { create: true, read: true, scope: "self" },
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "HR" },
      update: {},
      create: {
        name: "HR",
        label: "HR",
        permissions: {
          employees: { create: true, read: true, update: true },
          leave: { create: true, read: true, update: true, approve: true },
        },
      },
    }),
    prisma.role.upsert({
      where: { name: "ACCOUNTANT" },
      update: {},
      create: {
        name: "ACCOUNTANT",
        label: "Kế toán",
        permissions: {
          salary: { read: true, create: true, update: true },
          payments: { read: true, create: true, update: true },
        },
      },
    }),
  ]);

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
      bonusMPct: 0,
      bonusAPct: 0,
      bonusTPct: 0,
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

  // ── Task Library (từ file Excel) ───────────────────────────────────────────
  const tasks = [
    { taskId: "DEV01", taskName: "Tiếp nhận yêu cầu", description: "Nhận yêu cầu từ khách hàng, chủ doanh nghiệp hoặc bộ phận nội bộ", stdTime: 1, department: "Dev" },
    { taskId: "DEV02", taskName: "Làm rõ yêu cầu", description: "Hỏi lại những điểm chưa rõ, xác định mục tiêu thật sự của chức năng/dự án", stdTime: 1, department: "Dev" },
    { taskId: "DEV03", taskName: "Phân tích nghiệp vụ", description: "Chuyển yêu cầu kinh doanh thành yêu cầu kỹ thuật dễ hiểu cho lập trình viên", stdTime: 1, department: "Dev" },
    { taskId: "DEV04", taskName: "Xác định phạm vi công việc", description: "Chốt việc nào làm, việc nào chưa làm, tránh mở rộng ngoài kế hoạch", stdTime: 1, department: "Dev" },
    { taskId: "DEV05", taskName: "Chia nhỏ task", description: "Tách dự án lớn thành các đầu việc nhỏ, rõ ràng, có thể giao cho từng người", stdTime: 1, department: "Dev" },
    { taskId: "DEV06", taskName: "Ước lượng thời gian", description: "Dự tính thời gian hoàn thành từng task, xác định việc gấp và việc có thể để sau", stdTime: 1, department: "Dev" },
    { taskId: "DEV07", taskName: "Phân công công việc", description: "Giao task cho lập trình viên phù hợp với năng lực, kinh nghiệm và thời gian", stdTime: 1, department: "Dev" },
    { taskId: "DEV08", taskName: "Theo dõi tiến độ", description: "Kiểm tra task đang làm, task bị kẹt, task đã xong, task cần hỗ trợ", stdTime: 1, department: "Dev" },
    { taskId: "DEV09", taskName: "Kiểm tra chất lượng đầu ra", description: "Xem chức năng có chạy đúng, giao diện có ổn, dữ liệu có chính xác không", stdTime: 1, department: "Dev" },
    { taskId: "DEV10", taskName: "Viết code chức năng", description: "Lập trình theo spec, đảm bảo đúng logic nghiệp vụ", stdTime: 60, department: "Dev" },
    { taskId: "DEV11", taskName: "Review code", description: "Đọc và kiểm tra code của người khác, đưa ra nhận xét cải thiện", stdTime: 30, department: "Dev" },
    { taskId: "DEV12", taskName: "Fix bug", description: "Tìm nguyên nhân và sửa lỗi được báo cáo", stdTime: 30, department: "Dev" },
    { taskId: "DEV13", taskName: "Viết test", description: "Tạo unit test, integration test cho code đã viết", stdTime: 30, department: "Dev" },
    { taskId: "DEV14", taskName: "Deploy lên staging", description: "Đưa code lên môi trường staging để kiểm thử", stdTime: 30, department: "Dev" },
    { taskId: "DEV15", taskName: "Deploy lên production", description: "Đưa code lên môi trường production sau khi đã test xong", stdTime: 60, department: "Dev" },
    { taskId: "DEV16", taskName: "Viết tài liệu kỹ thuật", description: "Ghi lại cách hoạt động, cấu trúc, hướng dẫn sử dụng API/module", stdTime: 30, department: "Dev" },
    { taskId: "ADM01", taskName: "Họp nội bộ", description: "Tham gia cuộc họp nhóm hoặc công ty", stdTime: 60, department: "Admin" },
    { taskId: "ADM02", taskName: "Báo cáo tiến độ", description: "Cập nhật tình trạng công việc cho quản lý hoặc khách hàng", stdTime: 15, department: "Admin" },
    { taskId: "ADM03", taskName: "Xử lý email công việc", description: "Đọc, trả lời, phân loại email liên quan đến dự án", stdTime: 15, department: "Admin" },
    { taskId: "1001", taskName: "Học & Tìm hiểu", description: "Tự học, nghiên cứu công nghệ mới hoặc kiến thức liên quan đến công việc. BẮT BUỘC: link tài liệu + note tóm tắt + video minh họa", stdTime: 60, department: "All" },
    { taskId: "2001", taskName: "Việc mới (chưa có trong Task Library)", description: "Công việc phát sinh chưa có Task ID. Quantity = số phút thực hiện. BẮT BUỘC: video + link tài liệu + note", stdTime: 1, department: "All" },
    { taskId: "2002", taskName: "Việc mới dạng 2", description: "Tương tự 2001 cho các công việc nhóm 2. BẮT BUỘC: video + link tài liệu", stdTime: 1, department: "All" },
  ];

  for (const task of tasks) {
    await prisma.taskLibrary.upsert({
      where: { taskId: task.taskId },
      update: {},
      create: task,
    });
  }

  console.log(`✅ Task Library: ${tasks.length} tasks created`);

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

  // ── Work List samples ──────────────────────────────────────────────────────
  const wl1 = await prisma.workList.upsert({
    where: { wlId: "WL-0001" },
    update: {},
    create: {
      wlId: "WL-0001",
      dateAssigned: new Date("2026-05-01"),
      title: "Thiết kế giao diện trang chủ Ht-nails",
      description: "Thiết kế và code giao diện trang chủ theo mockup đã duyệt",
      customerId: customer1.id,
      assignedToId: lan.id,
      assignedById: manager.id,
      priority: "HIGH",
      dueDate: new Date("2026-05-15"),
      status: "IN_PROGRESS",
      progressPct: 60,
    },
  });

  const wl2 = await prisma.workList.upsert({
    where: { wlId: "WL-0002" },
    update: {},
    create: {
      wlId: "WL-0002",
      dateAssigned: new Date("2026-05-02"),
      title: "Fix bug form đặt lịch",
      description: "Form booking không gửi được email xác nhận",
      customerId: customer1.id,
      assignedToId: nv2.id,
      assignedById: lan.id,
      priority: "CRITICAL",
      dueDate: new Date("2026-05-07"),
      status: "IN_PROGRESS",
      progressPct: 80,
    },
  });

  const wl3 = await prisma.workList.upsert({
    where: { wlId: "WL-0003" },
    update: {},
    create: {
      wlId: "WL-0003",
      dateAssigned: new Date("2026-05-03"),
      title: "Viết tài liệu hướng dẫn sử dụng",
      description: "Hướng dẫn cho khách hàng cách dùng trang admin",
      assignedToId: lan.id,
      assignedById: manager.id,
      priority: "NORMAL",
      dueDate: new Date("2026-05-20"),
      status: "NOT_STARTED",
      progressPct: 0,
    },
  });

  console.log("✅ Work List:", [wl1, wl2, wl3].map((w) => w.wlId).join(", "));

  // ── Work Rules ─────────────────────────────────────────────────────────────
  const rules = [
    {
      ruleNo: 1,
      title: "Báo cáo công việc cuối ngày",
      description: "Vào cuối ngày làm việc, nếu trong ngày có phát sinh công việc, vui lòng gửi báo cáo công việc (HR_SYS) để công ty tiện theo dõi và hỗ trợ khi cần. Mỗi task phải có đủ thông tin để người khác hiểu và kiểm tra lại.",
    },
    {
      ruleNo: 2,
      title: "Ưu tiên sử dụng công cụ hỗ trợ",
      description: "Công ty khuyến khích nhân viên sử dụng các công cụ hỗ trợ phù hợp nhằm tiết kiệm thời gian và nâng cao chất lượng công việc (AI, speech-to-text, ...).",
    },
    {
      ruleNo: 3,
      title: "Quy trình xin hỗ trợ: Tự tra cứu → AI → hỏi đồng nghiệp",
      description: "Trước khi hỏi đồng nghiệp: (a) Tự tra cứu trong hệ thống, (b) Thử dùng AI để tự giải quyết, (c) Nếu vẫn cần hỏi: gửi câu hỏi kèm link + screenshot + video.",
    },
    {
      ruleNo: 4,
      title: "Tách biệt thông tin cá nhân và công việc",
      description: "Không sử dụng thông tin cá nhân (email, tài khoản riêng) cho công việc của công ty.",
    },
    {
      ruleNo: 5,
      title: "Quản lý tài khoản & mật khẩu rõ ràng",
      description: "Các tài khoản tạo cho công ty cần được lưu đầy đủ trong tab Password. Các tài khoản tạo cho khách hàng cần được lưu trong tab riêng của từng khách hàng.",
    },
    {
      ruleNo: 6,
      title: "Về chênh lệch thời gian thực tế",
      description: "Nếu Actual time > Standard time: bắt buộc quay màn hình kèm audio giải thích, rồi đưa vào Time Check for Tasks để xem xét điều chỉnh std time.",
    },
    {
      ruleNo: 7,
      title: "Duyệt thời gian làm việc & chi phí",
      description: "Công ty giữ quyền xem xét và duyệt lại thời gian làm việc, cũng như các khoản chi phí hoặc mức lương liên quan, nhằm đảm bảo tính công bằng và thống nhất.",
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.workRule.findFirst({ where: { ruleNo: rule.ruleNo } });
    if (!existing) {
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
