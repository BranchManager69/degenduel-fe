import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    host: "0.0.0.0",
    strictPort: true,
    hmr: {
      overlay: true,
      timeout: 30000,
      clientPort: 3003,
      protocol: "ws",
      host: "localhost",
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
  logLevel: "info",
  clearScreen: false,
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.VITE_DEV_SERVER_URL": '"http://localhost:3004"',
  },
  esbuild: {
    logLevel: "info",
    logLimit: 0,
  },
});
