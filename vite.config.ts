import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Force development mode when running dev server
  const isDev = command === "serve" || mode === "development";
  console.log("Running in", isDev ? "development" : "production", "mode");

  // Try to load SSL certs if they exist
  const certPath = "/etc/letsencrypt/live/dev.degenduel.me";
  let hasCerts = false;
  let httpsConfig = undefined;

  try {
    if (fs.existsSync(certPath)) {
      const key = fs.readFileSync(path.join(certPath, "privkey.pem"));
      const cert = fs.readFileSync(path.join(certPath, "fullchain.pem"));
      if (key && cert) {
        hasCerts = true;
        httpsConfig = { key, cert };
      }
    }
  } catch (error) {
    console.warn("SSL certificates not accessible, falling back to HTTP only");
  }

  const config = {
    server: {
      port: 3004,
      host: true,
      strictPort: true,
      https: httpsConfig,
      hmr: {
        clientPort: hasCerts ? 443 : 3004,
        host: hasCerts ? "dev.degenduel.me" : "localhost",
        protocol: "ws",
      },
      proxy: {
        "/api": {
          target: "http://localhost:3003",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
      },
      watch: {
        usePolling: true,
      },
    },
    define: {
      // Remove environment overrides since we determine this in config.ts
    },
    plugins: [
      react({
        babel: {
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
      sourcemap: true,
      minify: false,
    },
  };

  return config;
});
