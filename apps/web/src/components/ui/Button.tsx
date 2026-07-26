import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive" | "ai";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-brand-950",
  secondary:
    "border-primary-subtle bg-primary-subtle text-brand-950 hover:border-brand-200 hover:bg-brand-200",
  outline:
    "border-border-strong bg-surface text-foreground hover:border-primary hover:bg-primary-subtle hover:text-brand-950",
  ghost:
    "border-transparent bg-transparent text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
  destructive:
    "border-transparent bg-danger text-white shadow-sm hover:bg-red-800 active:bg-red-900",
  ai: "border-transparent bg-ai text-white shadow-sm hover:bg-violet-800 active:bg-violet-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "h-11 w-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border font-semibold outline-none transition-[background-color,border-color,color,box-shadow,opacity] duration-standard ease-out",
        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
