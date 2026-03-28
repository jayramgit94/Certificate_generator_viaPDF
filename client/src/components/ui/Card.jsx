import { cn } from "../../lib/utils";

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardSkeleton({ className, lines = 3 }) {
  return (
    <div className={cn("card p-5 space-y-3", className)}>
      <div className="skeleton h-5 w-1/2" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton h-3 w-full" />
      ))}
    </div>
  );
}
