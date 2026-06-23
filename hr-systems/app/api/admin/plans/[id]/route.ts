import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  name:      z.string().min(1).max(40),
  priceVnd:  z.number().int().min(0),
  seatLimit: z.number().int().min(1).max(9999),
  features:  z.array(z.string()).min(1),
  isActive:  z.boolean().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.type !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const plan = await prisma.planConfig.update({
    where: { id: params.id },
    data: { ...parsed.data, updatedBy: session.username },
  });

  return NextResponse.json({ data: plan });
});
