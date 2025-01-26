/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--color-brand-50, #f3e6ff)",
          100: "var(--color-brand-100, #e5ccff)",
          200: "var(--color-brand-200, #cc99ff)",
          300: "var(--color-brand-300, #b266ff)",
          400: "var(--color-brand-400, #9933ff)",
          500: "var(--color-brand-500, #7f00ff)", // Primary purple
          600: "var(--color-brand-600, #6600cc)",
          700: "var(--color-brand-700, #4c0099)",
          800: "var(--color-brand-800, #330066)",
          900: "var(--color-brand-900, #190033)",
        },
        cyber: {
          50: "var(--color-cyber-50, #e6fcff)",
          100: "var(--color-cyber-100, #ccf9ff)",
          200: "var(--color-cyber-200, #99f3ff)",
          300: "var(--color-cyber-300, #66edff)",
          400: "var(--color-cyber-400, #33e7ff)",
          500: "var(--color-cyber-500, #00e1ff)", // Accent neon blue
          600: "var(--color-cyber-600, #00b4cc)",
          700: "var(--color-cyber-700, #008799)",
          800: "var(--color-cyber-800, #005a66)",
          900: "var(--color-cyber-900, #002d33)",
        },
        neon: {
          50: "var(--color-neon-50, #e6f7ff)",
          100: "var(--color-neon-100, #ccefff)",
          200: "var(--color-neon-200, #99dfff)",
          300: "var(--color-neon-300, #66cfff)",
          400: "var(--color-neon-400, #33bfff)",
          500: "var(--color-neon-500, #00afff)", // Secondary lighter blue
          600: "var(--color-neon-600, #008ccc)",
          700: "var(--color-neon-700, #006999)",
          800: "var(--color-neon-800, #004666)",
          900: "var(--color-neon-900, #002333)",
        },

        /* 
        // SCHEME 1 - Neon Green (Matrix)
        brand: {
          50: "#f3fff6",
          100: "#e6ffee",
          200: "#ccffdd",
          300: "#b3ffcc",
          400: "#99ffbb",
          500: "#80ffaa", // Primary green
          600: "#66cc88",
          700: "#4d9966",
          800: "#336644",
          900: "#1a3322",
        },
        cyber: {
          50: "#f0fff0",
          100: "#e0ffe0",
          200: "#c2ffc2",
          300: "#a3ffa3",
          400: "#85ff85",
          500: "#66ff66", // Accent neon green
          600: "#52cc52",
          700: "#3d993d",
          800: "#296629",
          900: "#143314",
        },
        neon: {
          50: "#ebffeb",
          100: "#d6ffd6",
          200: "#adffad",
          300: "#85ff85",
          400: "#5cff5c",
          500: "#33ff33", // Secondary bright green
          600: "#29cc29",
          700: "#1f991f",
          800: "#146614",
          900: "#0a330a",
        },
        */

        /* 
        // SCHEME 2 - Neon Red (Cyberpunk 2077)
        brand: {
          50: "#ffe6e6",
          100: "#ffcccc",
          200: "#ff9999",
          300: "#ff6666",
          400: "#ff3333",
          500: "#ff0000", // Primary red
          600: "#cc0000",
          700: "#990000",
          800: "#660000",
          900: "#330000",
        },
        cyber: {
          50: "#fff0f0",
          100: "#ffe0e0",
          200: "#ffc2c2",
          300: "#ffa3a3",
          400: "#ff8585",
          500: "#ff6666", // Accent neon red
          600: "#cc5252",
          700: "#993d3d",
          800: "#662929",
          900: "#331414",
        },
        neon: {
          50: "#ffebeb",
          100: "#ffd6d6",
          200: "#ffadad",
          300: "#ff8585",
          400: "#ff5c5c",
          500: "#ff3333", // Secondary bright red
          600: "#cc2929",
          700: "#991f1f",
          800: "#661414",
          900: "#330a0a",
        },
        */

        /* 
        // SCHEME 3 - Synthwave (80s Retro)
        brand: {
          50: "#fce6ff",
          100: "#f9ccff",
          200: "#f399ff",
          300: "#ed66ff",
          400: "#e733ff",
          500: "#e100ff", // Primary magenta
          600: "#b400cc",
          700: "#870099",
          800: "#5a0066",
          900: "#2d0033",
        },
        cyber: {
          50: "#fff0fb",
          100: "#ffe0f7",
          200: "#ffc2ef",
          300: "#ffa3e7",
          400: "#ff85df",
          500: "#ff66d7", // Accent hot pink
          600: "#cc52ac",
          700: "#993d81",
          800: "#662956",
          900: "#33142b",
        },
        neon: {
          50: "#f9ebff",
          100: "#f3d6ff",
          200: "#e7adff",
          300: "#db85ff",
          400: "#cf5cff",
          500: "#c333ff", // Secondary purple
          600: "#9c29cc",
          700: "#751f99",
          800: "#4e1466",
          900: "#270a33",
        },
        */

        /* 
        // SCHEME 4 - Gold Rush
        brand: {
          50: "#fff8e6",
          100: "#fff1cc",
          200: "#ffe499",
          300: "#ffd666",
          400: "#ffc933",
          500: "#ffbb00", // Primary gold
          600: "#cc9600",
          700: "#997000",
          800: "#664b00",
          900: "#332500",
        },
        cyber: {
          50: "#fffbf0",
          100: "#fff7e0",
          200: "#fff0c2",
          300: "#ffe8a3",
          400: "#ffe185",
          500: "#ffd966", // Accent yellow
          600: "#ccad52",
          700: "#99823d",
          800: "#665629",
          900: "#332b14",
        },
        neon: {
          50: "#fff6eb",
          100: "#ffedd6",
          200: "#ffdbad",
          300: "#ffc985",
          400: "#ffb75c",
          500: "#ffa533", // Secondary orange
          600: "#cc8429",
          700: "#99631f",
          800: "#664214",
          900: "#33210a",
        },
        */

        /* 
        // SCHEME 5 - Electric Teal
        brand: {
          50: "#e6fff9",
          100: "#ccfff4",
          200: "#99ffe8",
          300: "#66ffdd",
          400: "#33ffd1",
          500: "#00ffc6", // Primary teal
          600: "#00cc9e",
          700: "#009977",
          800: "#00664f",
          900: "#003328",
        },
        cyber: {
          50: "#e6fffa",
          100: "#ccfff5",
          200: "#99ffeb",
          300: "#66ffe0",
          400: "#33ffd6",
          500: "#00ffcc", // Accent bright teal
          600: "#00cca3",
          700: "#00997a",
          800: "#006652",
          900: "#003329",
        },
        neon: {
          50: "#e6fff7",
          100: "#ccfff0",
          200: "#99ffe0",
          300: "#66ffd1",
          400: "#33ffc1",
          500: "#00ffb2", // Secondary light teal
          600: "#00cc8e",
          700: "#00996b",
          800: "#006647",
          900: "#003324",
        },
        */

        /* 
        // SCHEME 6 - Plasma Purple
        brand: {
          50: "#f9e6ff",
          100: "#f3ccff",
          200: "#e799ff",
          300: "#db66ff",
          400: "#cf33ff",
          500: "#c300ff", // Primary deep purple
          600: "#9c00cc",
          700: "#750099",
          800: "#4e0066",
          900: "#270033",
        },
        cyber: {
          50: "#ffe6fc",
          100: "#ffccf9",
          200: "#ff99f3",
          300: "#ff66ed",
          400: "#ff33e7",
          500: "#ff00e1", // Accent electric purple
          600: "#cc00b4",
          700: "#990087",
          800: "#66005a",
          900: "#33002d",
        },
        neon: {
          50: "#ffe6ff",
          100: "#ffccff",
          200: "#ff99ff",
          300: "#ff66ff",
          400: "#ff33ff",
          500: "#ff00ff", // Secondary magenta
          600: "#cc00cc",
          700: "#990099",
          800: "#660066",
          900: "#330033",
        },
        */

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
        float: "float 4s ease-in-out infinite",
        blob: "blob 10s infinite cubic-bezier(0.4, 0.0, 0.2, 1)",
        pulse: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
        "cyber-pulse": "cyber-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glitch: "glitch 1s linear infinite",
        "matrix-rain": "matrix-rain 20s linear infinite",
        hologram: "hologram 3s ease infinite",
        "neon-flicker": "neon-flicker 2s linear infinite",
        "data-stream": "data-stream 15s linear infinite",
        "cyber-scan": "cyber-scan 4s ease-in-out infinite",
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
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
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
            filter: "blur(8px)",
          },
          "33%": {
            transform: "translate(40px, -60px) scale(1.2)",
            filter: "blur(12px)",
          },
          "66%": {
            transform: "translate(-30px, 30px) scale(0.8)",
            filter: "blur(14px)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
            filter: "blur(8px)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: ".9",
            transform: "scale(0.98)",
          },
        },
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center",
          },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "cyber-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(var(--color-cyber-500), 0.7)",
          },
          "50%": {
            boxShadow: "0 0 30px 10px rgba(var(--color-cyber-500), 0)",
          },
        },
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        "matrix-rain": {
          "0%": {
            backgroundPosition: "0% 0%",
            opacity: "0.8",
          },
          "50%": { opacity: "0.5" },
          "100%": {
            backgroundPosition: "0% 100%",
            opacity: "0.8",
          },
        },
        hologram: {
          "0%, 100%": {
            opacity: "1",
            filter: "hue-rotate(0deg) brightness(1)",
          },
          "50%": {
            opacity: "0.8",
            filter: "hue-rotate(180deg) brightness(1.2)",
          },
        },
        "neon-flicker": {
          "0%, 18%, 22%, 25%, 53%, 57%, 100%": {
            textShadow:
              "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px var(--color-cyber-500), 0 0 82px var(--color-cyber-500)",
          },
          "20%, 24%, 55%": {
            textShadow: "none",
          },
        },
        "data-stream": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "cyber-scan": {
          "0%": {
            backgroundPosition: "-100% 0",
            opacity: "0",
          },
          "40%, 60%": { opacity: "0.5" },
          "100%": {
            backgroundPosition: "200% 0",
            opacity: "0",
          },
        },
      },
      animationDelay: {
        2000: "2000ms",
        4000: "4000ms",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};
