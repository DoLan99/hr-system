import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// GET /api/checkin — trạng thái hôm nay
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const record = await prisma.officeTime.findUnique({
    where: {
      organizationId_date_employeeId: {
        organizationId: auth.orgId,
        date: todayDate(),
        employeeId: auth.actorId,
      },
    },
    select: { startWork1: true, endWorkday: true, actualWorked: true },
  });

  return NextResponse.json({
    checkedIn: !!record?.startWork1,
    checkedOut: !!record?.endWorkday,
    checkInAt: record?.startWork1?.toISOString() ?? null,
    checkOutAt: record?.endWorkday?.toISOString() ?? null,
    actualWorked: record?.actualWorked ?? null,
  });
});

// POST /api/checkin  body: { action: "in" | "out", note?: string }
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const action = body.action as "in" | "out";
  if (action !== "in" && action !== "out") {
    return NextResponse.json({ error: "action phải là 'in' hoặc 'out'" }, { status: 400 });
  }

  const now = new Date();
  const date = todayDate();

  // Lấy hoặc tạo record hôm nay
  const existing = await prisma.officeTime.findUnique({
    where: {
      organizationId_date_employeeId: {
        organizationId: auth.orgId,
        date,
        employeeId: auth.actorId,
      },
    },
  });

  if (action === "in") {
    if (existing?.startWork1) {
      return NextResponse.json({ error: "Bạn đã check-in rồi" }, { status: 409 });
    }
    const record = await prisma.officeTime.upsert({
      where: {
        organizationId_date_employeeId: {
          organizationId: auth.orgId,
          date,
          employeeId: auth.actorId,
        },
      },
      create: {
        organizationId: auth.orgId,
        employeeId: auth.actorId,
        date,
        startWork1: now,
      },
      update: { startWork1: now },
    });
    return NextResponse.json({
      ok: true,
      checkInAt: record.startWork1?.toISOString(),
      message: `Check-in lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
    });
  }

  // action === "out"
  if (!existing?.startWork1) {
    return NextResponse.json({ error: "Bạn chưa check-in hôm nay" }, { status: 409 });
  }
  if (existing?.endWorkday) {
    return NextResponse.json({ error: "Bạn đã check-out rồi" }, { status: 409 });
  }

  // Tính actualWorked (phút) từ startWork1 đến now
  const workedMinutes = Math.round((now.getTime() - existing.startWork1.getTime()) / 60_000);

  const record = await prisma.officeTime.update({
    where: {
      organizationId_date_employeeId: {
        organizationId: auth.orgId,
        date,
        employeeId: auth.actorId,
      },
    },
    data: {
      endWorkday: now,
      actualWorked: workedMinutes,
    },
  });

  return NextResponse.json({
    ok: true,
    checkOutAt: record.endWorkday?.toISOString(),
    actualWorked: workedMinutes,
    message: `Check-out lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
  });
});
