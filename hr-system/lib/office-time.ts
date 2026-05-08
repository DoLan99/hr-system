export type CheckpointKey =
  | "startWork1"
  | "startLunch"
  | "startWork2"
  | "startAfternoonBreak"
  | "startWork3"
  | "endWorkday";

export interface CheckpointRecord {
  startWork1?: Date | string | null;
  startLunch?: Date | string | null;
  startWork2?: Date | string | null;
  startAfternoonBreak?: Date | string | null;
  startWork3?: Date | string | null;
  endWorkday?: Date | string | null;
}

function toMin(d?: Date | string | null): number | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.getHours() * 60 + dt.getMinutes();
}

/** Tính tổng phút làm thực tế (bỏ nghỉ trưa và giải lao) */
export function calcActualWorked(r: CheckpointRecord): number {
  const s1 = toMin(r.startWork1);
  const lunch = toMin(r.startLunch);
  const s2 = toMin(r.startWork2);
  const afBreak = toMin(r.startAfternoonBreak);
  const s3 = toMin(r.startWork3);
  const end = toMin(r.endWorkday);
  let total = 0;

  // Buổi sáng: startWork1 → startLunch (hoặc endWorkday)
  if (s1 !== null) {
    const e = lunch ?? end;
    if (e !== null && e > s1) total += e - s1;
  }
  // Buổi chiều: startWork2 → startAfternoonBreak (hoặc endWorkday)
  if (s2 !== null) {
    const e = afBreak ?? end;
    if (e !== null && e > s2) total += e - s2;
  }
  // Sau giải lao: startWork3 → endWorkday
  if (s3 !== null && end !== null && end > s3) {
    total += end - s3;
  }
  return Math.max(0, total);
}

/** Checkpoint tiếp theo cần bấm (null = đã xong) */
export function nextCheckpoint(r: CheckpointRecord): CheckpointKey | null {
  if (!r.startWork1) return "startWork1";
  if (!r.startLunch) return "startLunch";
  if (!r.startWork2) return "startWork2";
  if (r.startAfternoonBreak && !r.startWork3) return "startWork3";
  if (!r.endWorkday) return "endWorkday";
  return null;
}

export const CHECKPOINT_META: Record<CheckpointKey, { label: string; actionLabel: string; color: string }> = {
  startWork1: { label: "Vào làm", actionLabel: "Bắt đầu làm việc", color: "text-blue-600" },
  startLunch: { label: "Nghỉ trưa", actionLabel: "Nghỉ trưa", color: "text-orange-500" },
  startWork2: { label: "Làm lại", actionLabel: "Tiếp tục làm (chiều)", color: "text-blue-600" },
  startAfternoonBreak: { label: "Giải lao", actionLabel: "Nghỉ giải lao", color: "text-orange-500" },
  startWork3: { label: "Làm lại", actionLabel: "Tiếp tục sau giải lao", color: "text-blue-600" },
  endWorkday: { label: "Kết thúc", actionLabel: "Kết thúc ngày", color: "text-red-500" },
};

export function deltaLabel(delta: number | null | undefined): { text: string; color: string } {
  if (delta === null || delta === undefined) return { text: "—", color: "text-gray-400" };
  if (delta === 0) return { text: "±0", color: "text-green-600" };
  const abs = Math.abs(delta);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const fmt = h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
  const text = delta > 0 ? `+${fmt}` : `-${fmt}`;
  const color = abs > 60 ? "text-red-600" : abs > 30 ? "text-orange-500" : "text-yellow-500";
  return { text, color };
}
