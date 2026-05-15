export type LabelCategory = "TASK_TYPE" | "TASK_PRIORITY" | "TASK_STATUS" | "LEAVE_TYPE" | "PAYMENT_TYPE";

export type LabelDef = { label: string; color: string };

export type LabelConfig = {
  taskType: Record<string, LabelDef>;
  taskStatus: Record<string, LabelDef>;
  taskPriority: Record<string, LabelDef>;
  leaveType: Record<string, LabelDef>;
  paymentType: Record<string, LabelDef>;
};

export const CATEGORY_META: Record<LabelCategory, { title: string; description: string }> = {
  TASK_TYPE: { title: "Loại Task", description: "Phân loại công việc theo mục đích" },
  TASK_PRIORITY: { title: "Độ ưu tiên", description: "Mức độ ưu tiên của task" },
  TASK_STATUS: { title: "Trạng thái Task", description: "Các bước tiến triển của task" },
  LEAVE_TYPE: { title: "Loại nghỉ phép", description: "Các loại nghỉ phép trong hệ thống" },
  PAYMENT_TYPE: { title: "Loại thanh toán", description: "Phân loại khoản thanh toán" },
};

export const DEFAULT_LABELS: Record<LabelCategory, Record<string, LabelDef>> = {
  TASK_TYPE: {
    NORMAL: { label: "Bình thường", color: "bg-slate-100 text-slate-700" },
    LEARNING: { label: "Học & Tìm hiểu", color: "bg-violet-100 text-violet-700" },
    NEW_RESEARCH: { label: "Việc mới / R&D", color: "bg-amber-100 text-amber-700" },
    MEETING: { label: "Họp", color: "bg-sky-100 text-sky-700" },
    ADMIN: { label: "Hành chính", color: "bg-zinc-100 text-zinc-700" },
    BILLABLE_CLIENT: { label: "Tính tiền khách", color: "bg-emerald-100 text-emerald-700" },
    INTERNAL: { label: "Nội bộ", color: "bg-indigo-100 text-indigo-700" },
  },
  TASK_PRIORITY: {
    CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700" },
    HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
    NORMAL: { label: "Normal", color: "bg-blue-100 text-blue-700" },
    LOW: { label: "Low", color: "bg-slate-100 text-slate-600" },
  },
  TASK_STATUS: {
    BACKLOG: { label: "Backlog", color: "bg-slate-100 text-slate-600" },
    IN_PROGRESS: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
    BLOCKED: { label: "Huỷ", color: "bg-red-100 text-red-700" },
    REVIEW: { label: "Chờ review", color: "bg-amber-100 text-amber-700" },
    DONE: { label: "Xong", color: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-400" },
  },
  LEAVE_TYPE: {
    VACATION: { label: "Nghỉ phép năm", color: "bg-green-100 text-green-700" },
    HOLIDAY: { label: "Nghỉ lễ", color: "bg-blue-100 text-blue-700" },
    ILLNESS: { label: "Nghỉ bệnh", color: "bg-red-100 text-red-700" },
    OTHER: { label: "Khác", color: "bg-slate-100 text-slate-600" },
  },
  PAYMENT_TYPE: {
    SALARY: { label: "Lương", color: "bg-blue-100 text-blue-700" },
    BONUS: { label: "Thưởng", color: "bg-emerald-100 text-emerald-700" },
    ADVANCE: { label: "Tạm ứng", color: "bg-amber-100 text-amber-700" },
    DEDUCTION: { label: "Khấu trừ", color: "bg-red-100 text-red-700" },
    OTHER: { label: "Khác", color: "bg-slate-100 text-slate-600" },
  },
};

export const COLOR_PRESETS: { name: string; value: string }[] = [
  { name: "Xám", value: "bg-slate-100 text-slate-700" },
  { name: "Đen", value: "bg-zinc-100 text-zinc-700" },
  { name: "Xanh dương", value: "bg-blue-100 text-blue-700" },
  { name: "Trời", value: "bg-sky-100 text-sky-700" },
  { name: "Chàm", value: "bg-indigo-100 text-indigo-700" },
  { name: "Xanh lá", value: "bg-emerald-100 text-emerald-700" },
  { name: "Lá", value: "bg-green-100 text-green-700" },
  { name: "Vàng", value: "bg-amber-100 text-amber-700" },
  { name: "Cam", value: "bg-orange-100 text-orange-700" },
  { name: "Đỏ", value: "bg-red-100 text-red-700" },
  { name: "Hồng", value: "bg-pink-100 text-pink-700" },
  { name: "Tím", value: "bg-violet-100 text-violet-700" },
  { name: "Teal", value: "bg-teal-100 text-teal-700" },
  { name: "Nâu", value: "bg-stone-100 text-stone-700" },
  { name: "Cyan", value: "bg-cyan-100 text-cyan-700" },
  { name: "Fuchsia", value: "bg-fuchsia-100 text-fuchsia-700" },
];

type DbLabel = {
  category: string;
  key: string;
  label: string;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
};

export function buildLabelConfig(dbLabels: DbLabel[]): LabelConfig {
  function mergeCategory(category: LabelCategory): Record<string, LabelDef> {
    const defaults = DEFAULT_LABELS[category];
    const result = { ...defaults };
    for (const row of dbLabels) {
      if (row.category !== category || !row.isActive) continue;
      if (defaults[row.key]) {
        result[row.key] = {
          label: row.label,
          color: row.color ?? defaults[row.key].color,
        };
      }
    }
    return result;
  }

  return {
    taskType: mergeCategory("TASK_TYPE"),
    taskStatus: mergeCategory("TASK_STATUS"),
    taskPriority: mergeCategory("TASK_PRIORITY"),
    leaveType: mergeCategory("LEAVE_TYPE"),
    paymentType: mergeCategory("PAYMENT_TYPE"),
  };
}

export const DEFAULT_LABEL_CONFIG: LabelConfig = buildLabelConfig([]);
