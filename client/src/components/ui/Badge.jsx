import { cn } from "../../lib/utils";

export default function Badge({ className, variant = "primary", children }) {
  const variants = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
  };

  return <span className={cn(variants[variant], className)}>{children}</span>;
}
