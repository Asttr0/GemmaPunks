import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mizan: {
          ink: "#0f172a",
          panel: "#172033",
          muted: "#273248",
          gold: "#f59e0b",
          violet: "#8b5cf6"
        }
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

