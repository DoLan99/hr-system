import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

// GET /api/documents?employeeId=&category=
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const category = searchParams.get("category");

  const docs = await prisma.systemDocument.findMany({
    where: {
      organizationId: auth.orgId,
      ...(employeeId ? { employeeId: parseInt(employeeId) } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true, avatarUrl: true } },
      employee: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: docs });
});

// POST /api/documents — multipart: file, name?, description?, category?, employeeId?
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File vượt quá 20MB" }, { status: 413 });
  }

  const name = (formData.get("name") as string | null) || file.name;
  const description = (formData.get("description") as string | null) ?? undefined;
  const category = (formData.get("category") as string | null) ?? undefined;
  const empIdRaw = formData.get("employeeId") as string | null;
  const employeeId = empIdRaw ? parseInt(empIdRaw) : null;

  // Save to local filesystem
  const ext = file.name.split(".").pop() ?? "";
  const fileKey = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
  const filePath = path.join(uploadDir, fileKey);

  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
  } catch (e) {
    console.error("[documents] writeFile failed:", e);
    return NextResponse.json({ error: `Lỗi lưu file: ${(e as Error).message}` }, { status: 500 });
  }

  const fileUrl = `/uploads/documents/${fileKey}`;

  let doc;
  try {
    doc = await prisma.systemDocument.create({
      data: {
        organizationId: auth.orgId,
        name,
        description,
        fileUrl,
        fileKey,
        mimeType: file.type || undefined,
        size: file.size,
        category,
        employeeId,
        uploadedById: auth.actorId,
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true, avatarUrl: true } },
        employee: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  } catch (e) {
    console.error("[documents] prisma.create failed:", e);
    return NextResponse.json({ error: `Lỗi lưu DB: ${(e as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({ data: doc }, { status: 201 });
});
