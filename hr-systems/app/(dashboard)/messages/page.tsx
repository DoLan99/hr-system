import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { MessagesClient } from "./_components/messages-client";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 500;

export default async function MessagesPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  // For non-managers, scope = messages they're part of (assigned to them OR sent by them)
  const scope: any = { organizationId: organization.id };
  if (!isManager) {
    scope.OR = [
      { assignedToId: userId },
      { senderEmployeeId: userId },
    ];
  }

  const [rawMessages, employees, customers, allEmployeesForLookup] = await Promise.all([
    prisma.message.findMany({
      where: scope,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, fullName: true } },
        attachments: { select: { id: true, name: true, size: true, url: true } },
      },
      orderBy: { date: "desc" },
      take: MAX_MESSAGES,
    }),
    prisma.employee.findMany({
      where: { organizationId: organization.id, status: "ACTIVE", id: { not: userId } },
      select: { id: true, fullName: true, emailCompany: true, department: true, mobileCompany: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.customer.findMany({
      where: { organizationId: organization.id, status: { not: "INACTIVE" } },
      select: { id: true, customerName: true, businessName: true },
      orderBy: { customerName: "asc" },
    }),
    // lookup full employee list (including self) to resolve sender names
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      select: { id: true, fullName: true },
    }),
  ]);
  const empById = new Map(allEmployeesForLookup.map(e => [e.id, e]));

  type Convo = {
    key: string;
    name: string;
    role: string;
    avatarSeed: string;
    channel: string | null;
    type: "cust" | "team";
    customerId: number | null;
    senderContact: string | null;
    senderName: string | null;
    email: string | null;
    phone: string | null;
    otherEmployeeId: number | null;
    unread: number;
    unreadMessageIds: number[];
    lastMessageId: number;
    lastDate: string;
    messages: any[];
    attachments: { name: string; size: number | null; url: string }[];
  };

  const map = new Map<string, Convo>();
  const asc = [...rawMessages].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  for (const m of asc) {
    let key: string;
    let name: string;
    let role: string;
    let avatarSeed: string;
    let type: "cust" | "team";
    let otherEmployeeId: number | null = null;
    let isMine = false;

    if (m.customerId) {
      // Customer conversation: group by customerId
      key = `cust:${m.customerId}`;
      const cn = m.customer?.customerName || m.customer?.businessName || "Khách hàng";
      name = cn;
      role = m.senderName ? `${m.senderName} · ${cn}` : cn;
      avatarSeed = cn;
      type = "cust";
      isMine = m.senderEmployeeId === userId || !!m.replyToId;
    } else if (m.senderEmployeeId || m.assignedToId) {
      // Internal team chat: group by sorted (myId, otherId) so both directions share key
      const a = m.senderEmployeeId ?? 0;
      const b = m.assignedToId ?? 0;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      key = `team:${lo}:${hi}`;
      // Other party = the one in (sender, assigned) that is NOT current user.
      const other =
        a === userId ? b :
        b === userId ? a :
        b || a; // fallback for manager-view
      otherEmployeeId = other;
      const otherName = empById.get(other)?.fullName ?? `Nhân viên #${other}`;
      name = otherName;
      role = "Nội bộ";
      avatarSeed = otherName;
      type = "team";
      isMine = m.senderEmployeeId === userId;
    } else if (m.senderContact) {
      key = `${m.channel ?? "OTHER"}:${m.senderContact}`;
      name = m.senderName || m.senderContact;
      role = `${m.channel || "?"} · ${m.senderContact}`;
      avatarSeed = name;
      type = "team";
      isMine = !!m.replyToId;
    } else if (m.senderName) {
      key = `name:${m.channel ?? "OTHER"}:${m.senderName}`;
      name = m.senderName;
      role = m.channel || "Nội bộ";
      avatarSeed = name;
      type = "team";
      isMine = !!m.replyToId;
    } else {
      key = `msg:${m.id}`;
      name = m.subject || "Tin nhắn";
      role = m.channel || "—";
      avatarSeed = name;
      type = "team";
      isMine = !!m.replyToId;
    }

    let convo = map.get(key);
    if (!convo) {
      convo = {
        key,
        name,
        role,
        avatarSeed,
        channel: m.channel,
        type,
        customerId: m.customerId,
        senderContact: m.senderContact,
        senderName: m.senderName,
        email: m.customer?.email ?? null,
        phone: m.customer?.phone ?? null,
        otherEmployeeId,
        unread: 0,
        unreadMessageIds: [],
        lastMessageId: m.id,
        lastDate: m.date.toISOString(),
        messages: [],
        attachments: [],
      };
      map.set(key, convo);
    }

    convo.messages.push({
      id: m.id,
      content: m.messageSummary || m.subject || "",
      date: m.date.toISOString(),
      isMine,
      senderName: isMine ? null : (
        m.senderEmployeeId ? empById.get(m.senderEmployeeId)?.fullName ?? null : (m.senderName || null)
      ),
      attachments: m.attachments.map(a => ({
        id: a.id, name: a.name, size: a.size, url: a.url,
      })),
      status: m.status,
    });
    for (const a of m.attachments) {
      convo.attachments.push({ name: a.name, size: a.size, url: a.url });
    }
    if (!isMine && !m.readAt) { convo.unread += 1; convo.unreadMessageIds.push(m.id); }
    convo.lastMessageId = m.id;
    convo.lastDate = m.date.toISOString();
  }

  const conversations = Array.from(map.values()).sort(
    (a, b) => +new Date(b.lastDate) - +new Date(a.lastDate)
  );

  return (
    <MessagesClient
      conversations={conversations}
      employees={employees}
      customers={customers}
      currentUserId={userId}
      currentUserName={employee.fullName}
      isManager={isManager}
    />
  );
}
