import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        jakarta: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lp: {
          bg: "var(--lp-bg)",
          "bg-elev": "var(--lp-bg-elev)",
          surface: "var(--lp-surface)",
          "surface-2": "var(--lp-surface-2)",
          text: "var(--lp-text)",
          "text-2": "var(--lp-text-2)",
          "text-3": "var(--lp-text-3)",
          border: "var(--lp-border)",
          "border-strong": "var(--lp-border-strong)",
          accent: "var(--lp-accent)",
          "accent-2": "var(--lp-accent-2)",
          "accent-ink": "var(--lp-accent-ink)",
          ok: "var(--lp-ok)",
          warn: "var(--lp-warn)",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.22s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
