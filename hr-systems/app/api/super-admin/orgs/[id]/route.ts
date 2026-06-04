import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rawPrisma } from "@/lib/prisma";
import { isSuperAdminAuthed } from "@/lib/super-admin";

const patchSchema = z.object({
  plan: z.enum(["FREE", "STARTER", "TEAM"]).optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"]).optional(),
  seatLimit: z.number().int().min(1).max(1000).optional(),
  extendTrialDays: z.number().int().min(1).max(365).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isSuperAdminAuthed())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const org = await rawPrisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return NextResponse.json({ error: "Không tìm thấy workspace" }, { status: 404 });

  const data: any = {};
  if (parsed.data.plan) data.plan = parsed.data.plan;
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.seatLimit !== undefined) data.seatLimit = parsed.data.seatLimit;
  if (parsed.data.extendTrialDays) {
    const base = org.trialEndsAt && org.trialEndsAt > new Date() ? org.trialEndsAt : new Date();
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + parsed.data.extendTrialDays);
    data.trialEndsAt = newEnd;
  }

  const updated = await rawPrisma.organization.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ data: updated });
}
