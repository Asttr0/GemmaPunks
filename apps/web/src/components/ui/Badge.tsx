import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant =
  "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "ai";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-subtle text-foreground-muted",
  primary: "border-brand-200 bg-primary-subtle text-brand-950",
  info: "border-sky-200 bg-info-subtle text-info",
  success: "border-emerald-200 bg-success-subtle text-success",
  warning: "border-amber-200 bg-warning-subtle text-warning",
  danger: "border-red-200 bg-danger-subtle text-danger",
  ai: "border-violet-200 bg-ai-subtle text-ai",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2.5 py-0.5 text-xs font-semibold leading-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
