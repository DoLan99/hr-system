import { prisma } from "@/lib/prisma";

export interface ApiAccessLogEntry {
  employeeId: number | null;
  sessionId: string | null;
  requestId: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage?: string | null;
  responseSize?: number | null;
}

/**
 * Lọc các endpoint không cần log (giảm noise).
 * Có thể chuyển sang config động trong system_label sau này.
 */
const SKIP_PREFIXES = ["/_next", "/favicon", "/api/auth/session"];

function shouldSkip(endpoint: string): boolean {
  return SKIP_PREFIXES.some((p) => endpoint.startsWith(p));
}

/**
 * Ghi 1 bản ghi ApiAccessLog. Gọi fire-and-forget từ withContext
 * để không block response. Lỗi được nuốt và log ra console.
 */
export async function writeApiAccessLog(entry: ApiAccessLogEntry): Promise<void> {
  if (shouldSkip(entry.endpoint)) return;
  try {
    await prisma.apiAccessLog.create({
      data: {
        employeeId: entry.employeeId,
        sessionId: entry.sessionId,
        requestId: entry.requestId,
        endpoint: entry.endpoint,
        method: entry.method,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        errorMessage: entry.errorMessage ?? null,
        responseSize: entry.responseSize ?? null,
      },
    });
  } catch (err) {
    console.error("[api-access-log] failed to write:", err);
  }
}
