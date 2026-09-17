import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
      colors: {
        medical: {
          deepteal: "#0F766E", // Teal 700
          teal: "#14B8A6", // Teal 500
          mint: "#CCFBF1", // Teal 100
          lightmint: "#F0FDFA", // Teal 50
          slate: "#64748B", // Slate 500
          darkslate: "#334155", // Slate 700
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
