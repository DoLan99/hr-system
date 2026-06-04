import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ghost" | "purple";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200",
  danger:  "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200",
  info:    "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200",
  ghost:   "bg-transparent text-slate-500 dark:text-slate-400 border border-slate-200",
  purple:  "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
