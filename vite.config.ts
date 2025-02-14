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

  // Determine build output directory based on mode
  const outDir = mode === "development" ? "dist-dev" : "dist";
  console.log("Building to", outDir);

  // Try to load SSL certs - both domains use the same certificate
  const certPath = "/etc/letsencrypt/live/degenduel.me";
  const domain = isDev ? "dev.degenduel.me" : "degenduel.me";
  let hasCerts = false;
  let httpsConfig = undefined;

  try {
    if (fs.existsSync(certPath)) {
      const key = fs.readFileSync(path.join(certPath, "privkey.pem"));
      const cert = fs.readFileSync(path.join(certPath, "fullchain.pem"));
      if (key && cert) {
        hasCerts = true;
        httpsConfig = { key, cert };
        console.log(`Loaded SSL certificates for ${domain} from ${certPath}`);
      }
    } else {
      console.warn(`SSL certificate path ${certPath} does not exist`);
    }
  } catch (error) {
    console.warn(
      `SSL certificates not accessible at ${certPath}, falling back to HTTP only`
    );
  }

  const config: UserConfig = {
    server: {
      port: isDev ? 3005 : 3004,
      host: true,
      strictPort: true,
      https: httpsConfig,
      hmr: {
        clientPort: hasCerts ? 443 : isDev ? 3005 : 3004,
        host: hasCerts ? domain : "localhost",
        protocol: "ws",
      },
      proxy: {
        "/api": {
          target: isDev
            ? "https://dev.degenduel.me/api"
            : "https://degenduel.me/api",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/portfolio": {
          target: isDev
            ? "wss://dev.degenduel.me/api/v2/ws"
            : "wss://degenduel.me/api/v2/ws",
          ws: true,
          changeOrigin: true,
          secure: true,
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
      outDir,
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
