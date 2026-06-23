import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username  = process.argv[2] ?? "admin";
  const password  = process.argv[3] ?? "Admin@123456";
  const fullName  = process.argv[4] ?? "System Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, fullName },
    create: { username, passwordHash, fullName, type: "SUPER_ADMIN" },
  });

  console.log(`✅ Admin user created/updated:`);
  console.log(`   Username : ${user.username}`);
  console.log(`   Full name: ${user.fullName}`);
  console.log(`   Type     : ${user.type}`);
  console.log(`   Login at : http://localhost:3003/system/login`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
