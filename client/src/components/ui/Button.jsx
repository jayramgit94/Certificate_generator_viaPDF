import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Button = forwardRef(
  (
    { className, variant = "primary", size = "default", children, ...props },
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

    return (
      <button
        ref={ref}
        className={cn("btn", variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
