// Business logic cho Work Report — credited time calculation

const SPECIAL_NEEDS_VIDEO = ["1001", "2001", "2002"];

export type CreditResult = {
  creditedTime: number;
  status: "ok" | "capped" | "zero" | "pending_approval";
  reason: string | null;
};

/**
 * Tính credited time theo đúng business rules từ Work Rules.
 *
 * Rules:
 * - 2001/2002/1001: bắt buộc video, nếu không có → credited = 0
 * - actual > std (task thường): không có video → credited = std * qty
 * - actual > std + có video → credited = actual * qty, cần manager duyệt
 * - actual <= std (bình thường) → credited = actual * qty, tự động
 */
export function calcCreditedTime({
  taskId,
  actualTime,
  stdTime,
  quantity,
  videoLink,
}: {
  taskId: string;
  actualTime: number;
  stdTime: number | null;
  quantity: number;
  videoLink?: string | null;
}): CreditResult {
  const qty = quantity ?? 1;
  const totalActual = actualTime * qty;
  const totalStd = (stdTime ?? actualTime) * qty;
  const hasVideo = !!videoLink?.trim();

  // Task đặc biệt: 1001, 2001, 2002 — bắt buộc video
  if (SPECIAL_NEEDS_VIDEO.includes(taskId)) {
    if (!hasVideo) {
      return {
        creditedTime: 0,
        status: "zero",
        reason: "Thiếu video bắt buộc cho task này",
      };
    }
    return {
      creditedTime: totalActual,
      status: "pending_approval",
      reason: "Chờ Manager duyệt",
    };
  }

  // Task thường: actual > std
  if (stdTime !== null && actualTime > stdTime) {
    if (!hasVideo) {
      return {
        creditedTime: totalStd,
        status: "capped",
        reason: `Actual > Std nhưng thiếu video → chỉ tính ${totalStd} phút`,
      };
    }
    return {
      creditedTime: totalActual,
      status: "pending_approval",
      reason: "Actual > Std, có video — chờ Manager duyệt",
    };
  }

  // Bình thường
  return { creditedTime: totalActual, status: "ok", reason: null };
}

/** Kiểm tra xem task có bắt buộc video không */
export function needsVideo(taskId: string, actualTime: number, stdTime: number | null): boolean {
  if (SPECIAL_NEEDS_VIDEO.includes(taskId)) return true;
  if (stdTime !== null && actualTime > stdTime) return true;
  return false;
}

/** Format hiển thị credited time status */
export function creditStatusLabel(status: CreditResult["status"]) {
  return {
    ok: { label: "OK", color: "text-green-600 bg-green-50" },
    capped: { label: "Cắt giờ", color: "text-amber-600 bg-amber-50" },
    zero: { label: "Không tính", color: "text-red-600 bg-red-50" },
    pending_approval: { label: "Chờ duyệt", color: "text-blue-600 bg-blue-50" },
  }[status];
}

/** Tổng hợp credited time cho một ngày */
export function sumCredited(entries: { creditedTime: number | null }[]) {
  return entries.reduce((s, e) => s + (e.creditedTime ?? 0), 0);
}

export function sumActual(entries: { actualTime: number; quantity: number }[]) {
  return entries.reduce((s, e) => s + e.actualTime * (e.quantity ?? 1), 0);
}
