import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--ap-bg)",
        elevated: "var(--ap-bg-elevated)",
        muted: "var(--ap-bg-muted)",
        ink: "var(--ap-ink)",
        "ink-soft": "var(--ap-ink-soft)",
        "ink-faint": "var(--ap-ink-faint)",
        brand: "var(--ap-brand)",
        "brand-deep": "var(--ap-brand-deep)",
        gold: "var(--ap-gold)",
        "gold-soft": "var(--ap-gold-soft)",
        "gold-ink": "var(--ap-gold-ink)",
        success: "var(--ap-success)",
        warn: "var(--ap-warn)",
        danger: "var(--ap-danger)",
        line: "var(--ap-line)",
        card: "var(--ap-card)",
      },
      fontFamily: {
        display: ["var(--ap-font-display)"],
        sans: ["var(--ap-font-sans)"],
      },
      borderRadius: { ap: "var(--ap-radius)" },
      boxShadow: {
        ap: "var(--ap-shadow)",
        "ap-lg": "var(--ap-shadow-lg)",
        "ap-xl": "var(--ap-shadow-xl)",
      },
    },
  },
  plugins: [],
};
export default config;
