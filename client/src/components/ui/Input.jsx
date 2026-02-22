import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={cn("input", error && "input-error", className)}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
