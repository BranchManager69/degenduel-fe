import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    host: "0.0.0.0",
    strictPort: true,
    hmr: false,
    watch: {
      usePolling: false,
      interval: 1000,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
  build: {
    sourcemap: true,
    manifest: false,
  },
  logLevel: "info",
  clearScreen: false,
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.VITE_DEV_SERVER_URL": '"http://localhost:3003"',
  },
  esbuild: {
    logLevel: "info",
    logLimit: 0,
  },
});
