import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";
  const isQuickBuild = mode === "quick";

  return {
    server: {
      port: 3004,
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react({
        babel: {
          // Ensure JSX is handled properly
          presets: [
            [
              "@babel/preset-react",
              { runtime: "automatic", importSource: "react" },
            ],
            "@babel/preset-typescript",
          ],
        },
      }),
    ],
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      // Production build settings (default)
      ...(!isDev &&
        !isQuickBuild && {
          typescript: {
            checker: true,
          },
          rollupOptions: {
            output: {
              manualChunks: {
                react: ["react", "react-dom"],
                router: ["react-router-dom"],
              },
            },
          },
          minify: true,
          sourcemap: true,
        }),
      // Quick build settings
      ...(isQuickBuild && {
        typescript: {
          checker: false,
        },
        minify: false,
        sourcemap: "inline",
      }),
    },
  };
});
