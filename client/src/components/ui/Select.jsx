import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  error,
  className,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("w-full relative", className)} ref={ref}>
      {label && <label className="label">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input text-left flex items-center justify-between",
          error && "input-error",
          !selected && "text-gray-400",
        )}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto scrollbar-thin animate-scale-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3.5 py-2.5 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors",
                value === opt.value &&
                  "bg-primary-50 text-primary-700 font-medium",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
