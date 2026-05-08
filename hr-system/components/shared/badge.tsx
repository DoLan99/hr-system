import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "ghost" | "purple";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger:  "bg-red-50 text-red-700 border border-red-200",
  info:    "bg-blue-50 text-blue-700 border border-blue-200",
  ghost:   "bg-transparent text-slate-500 border border-slate-200",
  purple:  "bg-purple-50 text-purple-700 border border-purple-200",
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
