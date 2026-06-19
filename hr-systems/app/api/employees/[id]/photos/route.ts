import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { getActorId } from "@/lib/request-context";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PHOTO_FIELDS: Record<string, "photoPortrait" | "photoCccdFront" | "photoCccdBack"> = {
  portrait:   "photoPortrait",
  cccd_front: "photoCccdFront",
  cccd_back:  "photoCccdBack",
};

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId();
  const empId = Number(params.id);
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && actorId !== empId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  if (!type || !PHOTO_FIELDS[type]) return NextResponse.json({ error: "type không hợp lệ (portrait|cccd_front|cccd_back)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Chỉ hỗ trợ JPG, PNG, WEBP, HEIC" }, { status: 415 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ảnh vượt quá 5MB" }, { status: 413 });

  const dir = path.join(process.cwd(), "public", "uploads", "employees", String(empId));
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${type}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/employees/${empId}/${filename}`;
  const field = PHOTO_FIELDS[type];
  await prisma.employee.update({ where: { id: empId }, data: { [field]: url } });

  return NextResponse.json({ url });
});
