import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encryptVault } from "@/lib/vault";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const createSchema = z.object({
  scope: z.enum(["COMPANY", "CUSTOMER"]),
  entityName: z.string().optional(),
  customerId: z.number().int().optional(),
  serviceApp: z.string().optional(),
  loginUrl: z.string().optional(),
  username: z.string().optional(),
  emailUsed: z.string().optional(),
  password: z.string().min(1),
  twoFaMethod: z.string().optional(),
  twoFaBackup: z.string().optional(),
  ownerId: z.number().int().optional(),
  rotationDays: z.number().int().optional(),
  notes: z.string().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (scope) where.scope = scope;
  if (search) {
    where.OR = [
      { entityName: { contains: search, mode: "insensitive" } },
      { serviceApp: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { emailUsed: { contains: search, mode: "insensitive" } },
    ];
  }

  const vaults = await prisma.passwordVault.findMany({
    where,
    select: {
      id: true, scope: true, entityName: true, customerId: true, serviceApp: true,
      loginUrl: true, username: true, emailUsed: true, twoFaMethod: true,
      ownerId: true, rotationDays: true, notes: true, createdDate: true, lastUpdated: true,
      customer: { select: { id: true, customerName: true } },
      owner: { select: { id: true, fullName: true } },
    },
    orderBy: { lastUpdated: "desc" },
  });

  return NextResponse.json({ data: vaults });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const vault = await prisma.passwordVault.create({
    data: {
      scope: d.scope,
      entityName: d.entityName,
      customerId: d.customerId,
      serviceApp: d.serviceApp,
      loginUrl: d.loginUrl,
      username: d.username,
      emailUsed: d.emailUsed,
      passwordEncrypted: encryptVault(d.password),
      twoFaMethod: d.twoFaMethod,
      twoFaBackup: d.twoFaBackup ? encryptVault(d.twoFaBackup) : null,
      ownerId: d.ownerId ?? auth.actorId,
      rotationDays: d.rotationDays,
      notes: d.notes,
    },
    select: {
      id: true, scope: true, entityName: true, serviceApp: true,
      loginUrl: true, username: true, emailUsed: true, twoFaMethod: true,
      ownerId: true, rotationDays: true, notes: true, createdDate: true, lastUpdated: true,
      customer: { select: { id: true, customerName: true } },
      owner: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: vault }, { status: 201 });
});
