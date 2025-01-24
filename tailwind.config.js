/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3e6ff",
          100: "#e5ccff",
          200: "#cc99ff",
          300: "#b266ff",
          400: "#9933ff",
          500: "#7f00ff",
          600: "#6600cc",
          700: "#4c0099",
          800: "#330066",
          900: "#190033",
        },
        dark: {
          100: "#1a1625",
          200: "#211d2f",
          300: "#2d2844",
        },
      },
      animation: {
        shine: "shine 2s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        ticker: "ticker 30s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        shine: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};
