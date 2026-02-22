import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "../../lib/utils";

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const styles = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export default function Alert({ type = "info", title, children, className }) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        styles[type],
        className,
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
