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
