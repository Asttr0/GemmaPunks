import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "var(--color-brand-950)",
          700: "var(--color-brand-700)",
          500: "var(--color-brand-500)",
          200: "var(--color-brand-200)",
          100: "var(--color-brand-100)",
        },
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-subtle": "var(--color-surface-subtle)",
        foreground: "var(--color-foreground)",
        "foreground-muted": "var(--color-foreground-muted)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-subtle": "var(--color-primary-subtle)",
        ai: "var(--color-ai)",
        "ai-subtle": "var(--color-ai-subtle)",
        success: "var(--color-success)",
        "success-subtle": "var(--color-success-subtle)",
        warning: "var(--color-warning)",
        "warning-subtle": "var(--color-warning-subtle)",
        danger: "var(--color-danger)",
        "danger-subtle": "var(--color-danger-subtle)",
        info: "var(--color-info)",
        "info-subtle": "var(--color-info-subtle)",
        focus: "var(--color-focus)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans Arabic",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        badge: "0.5rem",
        control: "0.75rem",
        card: "1rem",
        showcase: "1.25rem",
      },
      boxShadow: {
        raised: "var(--shadow-raised)",
        dialog: "var(--shadow-dialog)",
      },
      transitionDuration: {
        fast: "150ms",
        standard: "225ms",
        reveal: "350ms",
      },
      maxWidth: {
        app: "100rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
