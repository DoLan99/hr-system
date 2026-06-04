"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bootstrapOrg, RESERVED_SLUGS, slugify } from "@/lib/org-bootstrap";
import { buildTenantUrl } from "@/lib/tenant";

const inputSchema = z.object({
  name: z.string().trim().min(2, "Tên tổ chức tối thiểu 2 ký tự").max(50, "Tên tổ chức tối đa 50 ký tự"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug tối thiểu 2 ký tự")
    .max(32, "Slug tối đa 32 ký tự")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số, dấu gạch ngang"),
});

export type CreateOrgInput = z.infer<typeof inputSchema>;
export type CreateOrgResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createOrganization(input: CreateOrgInput): Promise<CreateOrgResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { name } = parsed.data;
  const slug = slugify(parsed.data.slug);

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "Slug này đã được hệ thống reserved, vui lòng chọn slug khác" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Bạn cần đăng nhập" };
  }

  const existingSlug = await prisma.organization.findUnique({ where: { slug } });
  if (existingSlug) {
    return { ok: false, error: "Slug này đã được sử dụng, vui lòng chọn slug khác" };
  }

  const existingEmployee = await prisma.employee.findFirst({ where: { clerkUserId: userId } });
  if (existingEmployee) {
    return { ok: false, error: "Bạn đã thuộc về 1 tổ chức rồi" };
  }

  const client = await clerkClient();

  let clerkOrgId: string;
  try {
    const clerkOrg = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });
    clerkOrgId = clerkOrg.id;
  } catch (err) {
    console.error("[onboarding] Clerk createOrganization failed:", err);
    const anyErr = err as { errors?: Array<{ message?: string; code?: string; longMessage?: string }>; status?: number; clerkError?: boolean };
    const detail =
      anyErr.errors?.[0]?.longMessage ??
      anyErr.errors?.[0]?.message ??
      (err instanceof Error ? err.message : String(err));
    const code = anyErr.errors?.[0]?.code ? ` (code: ${anyErr.errors[0].code})` : "";
    const status = anyErr.status ? ` [HTTP ${anyErr.status}]` : "";
    return { ok: false, error: `Không tạo được organization: ${detail}${code}${status}` };
  }

  const user = await client.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  const email = primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    email ||
    "Owner";

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const org = await prisma.organization.create({
    data: {
      clerkOrgId,
      slug,
      name,
      plan: "FREE",
      status: "TRIAL",
      seatLimit: 1,
      trialEndsAt,
    },
  });

  await bootstrapOrg(org.id);

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { organizationId_name: { organizationId: org.id, name: "SUPER_ADMIN" } },
  });

  await prisma.employee.create({
    data: {
      organizationId: org.id,
      clerkUserId: userId,
      isOwner: true,
      membershipRole: "OWNER",
      employeeCode: "EMP001",
      fullName,
      emailCompany: email || `${userId}@noemail.local`,
      roleId: ownerRole.id,
      payType: "MONTHLY",
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  const target = await buildTenantUrl(slug, "/welcome");
  redirect(target);
}
