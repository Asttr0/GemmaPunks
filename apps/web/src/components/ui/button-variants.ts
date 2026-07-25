import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-hover shadow-sm border border-primary",
        danger:
          "bg-danger text-white hover:bg-danger/90 shadow-sm border border-danger",
        outline: "border border-border bg-surface hover:bg-surface-subtle",
        secondary:
          "bg-surface-subtle text-foreground hover:bg-border border border-border",
        ghost: "hover:bg-surface-subtle",
        link: "text-primary underline-offset-4 hover:underline",
        ai: "bg-ai text-white hover:bg-ai/90 shadow-sm border border-ai",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-lg px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
