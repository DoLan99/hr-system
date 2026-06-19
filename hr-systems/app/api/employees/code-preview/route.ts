import { NextRequest, NextResponse } from "next/server";
import { rawPrisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

function deptPrefix(deptName: string): string {
  const name = deptName.trim();
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const deptName = searchParams.get("deptName");

  let prefix = "NV";
  if (departmentId) {
    const dept = await rawPrisma.department.findUnique({
      where: { id: Number(departmentId) },
      select: { name: true },
    });
    if (dept) prefix = deptPrefix(dept.name);
  } else if (deptName) {
    prefix = deptPrefix(deptName);
  }

  const existing = await rawPrisma.employee.count({
    where: { organizationId: auth.orgId, employeeCode: { startsWith: prefix + "-" } },
  });
  const seq = existing + 1;
  const code = `${prefix}-${String(seq).padStart(3, "0")}`;

  return NextResponse.json({ code });
});
