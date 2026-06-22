import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./_components/inventory-client";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  { name: "Thiết bị",    code: "device",     description: "Laptop, màn hình, phụ kiện máy tính" },
  { name: "VPP",         code: "office",     description: "Văn phòng phẩm tiêu dùng" },
  { name: "Nội thất",    code: "furniture",  description: "Bàn ghế, tủ kệ" },
  { name: "Merchandise", code: "merch",      description: "Quà tặng, áo team, sổ" },
  { name: "Tiêu hao",    code: "consumable", description: "Cà phê, trà, pantry" },
];

export default async function InventoryPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  let categories = await prisma.inventoryCategory.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    await prisma.inventoryCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, organizationId: organization.id })),
      skipDuplicates: true,
    });
    categories = await prisma.inventoryCategory.findMany({
      where: { organizationId: organization.id },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
  }

  return <InventoryClient initialCategories={categories} isManager={isManager} />;
}
