/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        dark: {
          100: "#0f0f0f",
          200: "#1a1a1a",
          300: "#262626",
          400: "#333333",
          500: "#404040",
        },
      },
      animation: {
        shine: "shine 3s linear infinite",
        "fade-in": "fadeIn 0.2s ease-out forwards",
        ticker: "ticker 30s linear infinite",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        shine: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": {
            transform: "translate(0, 0) rotate(0deg) scale(1)",
          },
          "25%": {
            transform: "translate(4px, 4px) rotate(1deg) scale(1.01)",
          },
          "50%": {
            transform: "translate(-2px, 6px) rotate(-1deg) scale(1.02)",
          },
          "75%": {
            transform: "translate(-4px, 2px) rotate(0.5deg) scale(1.01)",
          },
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};
