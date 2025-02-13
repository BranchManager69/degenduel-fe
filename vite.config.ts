import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { ModuleFormat } from "rollup";
import { defineConfig, LogLevel, UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }): UserConfig => {
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

  const config: UserConfig = {
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
        "/portfolio": {
          target: "ws://localhost:3003",
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
        usePolling: false,
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
      exclude: ["@react-three/fiber", "@react-three/drei"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      sourcemap: isDev,
      minify: isDev ? false : ("esbuild" as const),
      target: "esnext",
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        cache: true,
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "three-vendor": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],
            "ui-vendor": ["framer-motion", "react-icons", "styled-components"],
          },
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
          format: "esm" as ModuleFormat,
          compact: !isDev,
          generatedCode: {
            symbols: true,
            constBindings: true,
          },
          minifyInternalExports: !isDev,
        },
      },
      terserOptions: isDev
        ? undefined
        : {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: [
                "console.log",
                "console.info",
                "console.debug",
                "console.trace",
              ],
            },
            mangle: true,
            format: {
              comments: false,
            },
          },
    },
    logLevel: "info" as LogLevel,
  };

  return config;
});
