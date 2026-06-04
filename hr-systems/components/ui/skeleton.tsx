import { cn } from "@/lib/utils";

/**
 * Skeleton primitive — placeholder pulse cho loading state.
 *
 * Dùng:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-10 w-full rounded-lg" />
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-slate-200/70 dark:bg-slate-700/50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Skeleton dạng dòng (cho table). N rows × M columns.
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-3 flex items-center gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton
              key={c}
              className={cn(
                "h-3",
                c === 0 ? "w-24" : c === cols - 1 ? "w-16 ml-auto" : "flex-1",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card-shaped skeleton list (cho anomalies/alerts).
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
