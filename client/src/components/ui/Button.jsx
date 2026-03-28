import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import Spinner from "./Spinner";

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "default",
      children,
      loading = false,
      loadingText,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      danger: "btn-danger",
      ghost: "btn-ghost",
    };
    const sizes = {
      sm: "btn-sm",
      default: "",
      lg: "btn-lg",
    };

    const spinnerColor =
      variant === "primary" || variant === "danger"
        ? "text-white"
        : "text-current";

    return (
      <button
        ref={ref}
        className={cn("btn", variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner size="sm" className={cn("shrink-0", spinnerColor)} />}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
