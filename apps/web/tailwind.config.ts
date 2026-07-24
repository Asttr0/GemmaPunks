import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#03045E',
          700: '#0077B6',
          500: '#00B4D8',
          200: '#90E0EF',
          100: '#CAF0F8',
        },
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F1F5F9',
        },
        foreground: {
          DEFAULT: '#0F172A',
          muted: '#475569',
        },
        border: {
          DEFAULT: '#CBD5E1',
          strong: '#94A3B8',
        },
        primary: {
          DEFAULT: '#0077B6',
          hover: '#03045E',
          subtle: '#CAF0F8',
        },
        ai: {
          DEFAULT: '#6D28D9',
          subtle: '#F5F3FF',
        },
        success: {
          DEFAULT: '#047857',
          subtle: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#B45309',
          subtle: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#B91C1C',
          subtle: '#FEF2F2',
        },
        info: {
          DEFAULT: '#0369A1',
          subtle: '#F0F9FF',
        },
        focus: '#0077B6',
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Arabic", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        panel: "0 18px 50px rgba(2, 6, 23, 0.22)"
      }
    }
  },
  plugins: []
} satisfies Config;

