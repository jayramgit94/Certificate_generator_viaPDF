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

export default function Alert({
  type = "info",
  title,
  reason,
  nextStep,
  technicalDetails,
  details,
  children,
  className,
}) {
  const Icon = icons[type];

  const hasDetailList = Array.isArray(details) && details.length > 0;

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
        {children && <div className="text-sm opacity-90">{children}</div>}

        {reason && <p className="text-sm mt-1.5 opacity-90">{reason}</p>}

        {nextStep && (
          <p className="text-sm mt-2 font-medium">
            Next step: <span className="font-normal">{nextStep}</span>
          </p>
        )}

        {hasDetailList && (
          <ul className="mt-2 space-y-1 text-xs opacity-85 list-disc list-inside">
            {details.map((item, index) => (
              <li key={`${item?.field || "detail"}-${index}`}>
                {item?.field ? `${item.field}: ` : ""}
                {item?.message || "Invalid value"}
              </li>
            ))}
          </ul>
        )}

        {technicalDetails && (
          <details className="mt-2 text-xs opacity-85">
            <summary className="cursor-pointer select-none">Technical details</summary>
            <p className="mt-1 break-words">{technicalDetails}</p>
          </details>
        )}
      </div>
    </div>
  );
}
