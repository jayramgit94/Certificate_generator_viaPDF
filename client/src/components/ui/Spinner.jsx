import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Spinner({ className, size = "default" }) {
  const sizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary-600", sizes[size], className)}
    />
  );
}

export function InlineLoader({ label = "Loading...", className }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-primary-700", className)}>
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-16" />
              </div>
              <div className="skeleton-circle w-11 h-11" />
            </div>
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2 p-6">
          <div className="skeleton h-5 w-40 mb-2" />
          <div className="skeleton h-3 w-24 mb-6" />
          <div className="skeleton h-52 w-full rounded-xl" />
        </div>
        <div className="card p-6">
          <div className="skeleton h-5 w-36 mb-2" />
          <div className="skeleton h-3 w-24 mb-6" />
          <div className="flex items-center justify-center h-52">
            <div className="skeleton-circle w-40 h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableLoader({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-3">
          {[...Array(cols)].map((_, j) => (
            <div
              key={j}
              className={cn(
                "skeleton h-4",
                j === 0 ? "w-32" : "w-20",
                "flex-shrink-0",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardLoader({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton h-40 w-full rounded-lg" />
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
