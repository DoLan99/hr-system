import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { rawPrisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserData }
  | { type: "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: { id: string } }
  | { type: "organizationMembership.created"; data: ClerkOrgMembershipData }
  | { type: "organizationMembership.deleted"; data: ClerkOrgMembershipData }
  | { type: "organization.deleted"; data: { id: string } }
  | { type: string; data: unknown };

interface ClerkUserData {
  id: string;
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

interface ClerkOrgMembershipData {
  id: string;
  organization: { id: string };
  public_user_data: {
    user_id: string;
    identifier: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[clerk webhook] CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log("[clerk webhook] received event:", event.type);

  try {
    switch (event.type) {
      case "organizationMembership.created":
        await handleMembershipCreated(event.data as ClerkOrgMembershipData);
        break;
      case "organizationMembership.deleted":
        await handleMembershipDeleted(event.data as ClerkOrgMembershipData);
        break;
      case "user.updated":
        await handleUserUpdated(event.data as ClerkUserData);
        break;
      case "user.deleted":
        await handleUserDeleted((event.data as { id: string }).id);
        break;
      default:
        console.log("[clerk webhook] ignoring event type:", event.type);
    }
  } catch (err) {
    console.error("[clerk webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleMembershipCreated(data: ClerkOrgMembershipData) {
  const clerkOrgId = data.organization.id;
  const clerkUserId = data.public_user_data.user_id;
  const email = data.public_user_data.identifier;

  const org = await rawPrisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });
  if (!org) {
    console.log("[clerk webhook] org not in DB:", clerkOrgId);
    return;
  }

  const pendingEmployee = await rawPrisma.employee.findFirst({
    where: {
      organizationId: org.id,
      emailCompany: email,
      clerkUserId: { startsWith: "pending:" },
    },
  });

  if (pendingEmployee) {
    await rawPrisma.employee.update({
      where: { id: pendingEmployee.id },
      data: { clerkUserId, status: "ACTIVE" },
    });
    console.log("[clerk webhook] claimed pending employee:", pendingEmployee.id);
  } else {
    console.log("[clerk webhook] no pending employee for", email, "in org", clerkOrgId);
  }
}

async function handleMembershipDeleted(data: ClerkOrgMembershipData) {
  const clerkOrgId = data.organization.id;
  const clerkUserId = data.public_user_data.user_id;

  const org = await rawPrisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });
  if (!org) return;

  await rawPrisma.employee.updateMany({
    where: { organizationId: org.id, clerkUserId },
    data: { status: "INACTIVE" },
  });
}

async function handleUserUpdated(data: ClerkUserData) {
  const primaryEmail = data.email_addresses?.find((e) => e.id === data.primary_email_address_id);
  if (!primaryEmail) return;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();

  await rawPrisma.employee.updateMany({
    where: { clerkUserId: data.id },
    data: {
      ...(fullName && { fullName }),
      ...(data.image_url && { avatarUrl: data.image_url }),
    },
  });
}

async function handleUserDeleted(clerkUserId: string) {
  await rawPrisma.employee.updateMany({
    where: { clerkUserId },
    data: { status: "INACTIVE" },
  });
}
