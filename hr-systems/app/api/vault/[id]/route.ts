import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encryptVault, decryptVault } from "@/lib/vault";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  scope: z.enum(["COMPANY", "CUSTOMER"]).optional(),
  entityName: z.string().optional(),
  customerId: z.number().int().nullable().optional(),
  serviceApp: z.string().optional(),
  loginUrl: z.string().optional(),
  username: z.string().optional(),
  emailUsed: z.string().optional(),
  password: z.string().min(1).optional(),
  twoFaMethod: z.string().optional(),
  twoFaBackup: z.string().optional(),
  ownerId: z.number().int().nullable().optional(),
  rotationDays: z.number().int().nullable().optional(),
  notes: z.string().optional(),
});

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const vault = await prisma.passwordVault.findFirst({ where: { id: Number(params.id) } });
  if (!vault) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  await prisma.vaultAccessLog.create({
    data: {
      vaultId: vault.id,
      accessedById: auth.actorId,
      action: "VIEW_PASSWORD",
    },
  });

  return NextResponse.json({
    data: {
      ...vault,
      password: decryptVault(vault.passwordEncrypted),
      twoFaBackup: vault.twoFaBackup ? decryptVault(vault.twoFaBackup) : null,
    },
  });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.passwordVault.update({
    where: { id: Number(params.id) },
    data: {
      ...(d.scope && { scope: d.scope }),
      ...(d.entityName !== undefined && { entityName: d.entityName }),
      ...(d.customerId !== undefined && { customerId: d.customerId }),
      ...(d.serviceApp !== undefined && { serviceApp: d.serviceApp }),
      ...(d.loginUrl !== undefined && { loginUrl: d.loginUrl }),
      ...(d.username !== undefined && { username: d.username }),
      ...(d.emailUsed !== undefined && { emailUsed: d.emailUsed }),
      ...(d.password && { passwordEncrypted: encryptVault(d.password) }),
      ...(d.twoFaMethod !== undefined && { twoFaMethod: d.twoFaMethod }),
      ...(d.twoFaBackup !== undefined && { twoFaBackup: d.twoFaBackup ? encryptVault(d.twoFaBackup) : null }),
      ...(d.ownerId !== undefined && { ownerId: d.ownerId }),
      ...(d.rotationDays !== undefined && { rotationDays: d.rotationDays }),
      ...(d.notes !== undefined && { notes: d.notes }),
    },
    select: {
      id: true, scope: true, entityName: true, serviceApp: true,
      loginUrl: true, username: true, emailUsed: true, twoFaMethod: true,
      ownerId: true, rotationDays: true, notes: true, createdDate: true, lastUpdated: true,
      customer: { select: { id: true, customerName: true } },
      owner: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.passwordVault.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
