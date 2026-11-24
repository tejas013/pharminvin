import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#060913",
        slateGlass: "#0D1425",
        clinicalLight: "#F8FAFC",
        bioTeal: "#0D9488",
        cyberCyan: "#06B6D4",
        electricEmerald: "#10B981",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.35)",
        "glow-teal": "0 0 28px -6px rgba(13, 148, 136, 0.45)",
        "glow-crimson": "0 0 30px -4px rgba(244, 63, 94, 0.45)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
