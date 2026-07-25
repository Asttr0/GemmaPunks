import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-surface-subtle text-foreground border border-border",
        primary: "bg-brand-100 text-brand-950 border border-brand-200",
        secondary: "bg-surface-subtle text-foreground border border-border",
        destructive: "bg-danger-subtle text-danger border border-danger/20",
        outline: "text-foreground",
        success: "bg-success-subtle text-success border border-success/20",
        warning: "bg-warning-subtle text-warning border border-warning/20",
        info: "bg-info-subtle text-info border border-info/20",
        ai: "bg-ai-subtle text-ai border border-ai/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
