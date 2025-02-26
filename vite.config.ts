import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { ModuleFormat } from "rollup";
import { defineConfig, LogLevel, UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }): UserConfig => {
  // Force development mode when running dev server
  const isDev = command === "serve" || mode === "development";
  // Add local dev mode check
  const isLocalDev = mode === "dev-local";
  console.log(
    "Running in",
    isLocalDev ? "local development" : isDev ? "development" : "production",
    "mode"
  );

  // Determine build output directory based on mode
  const outDir = mode === "development" ? "dist-dev" : "dist";
  console.log("Building to", outDir);

  // For local dev, use simplified config
  if (isLocalDev) {
    return {
      server: {
        port: 3006,
        host: true,
        strictPort: true,
        https: undefined,
        hmr: {
          clientPort: 3006,
          host: "localhost",
          protocol: "ws",
        },
        proxy: {
          "^/api/.*": {
            target: "https://dev.degenduel.me",
            changeOrigin: true,
            secure: true,
            cookieDomainRewrite: "localhost",
            headers: {
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, PATCH, OPTIONS",
              "Access-Control-Allow-Headers":
                "X-Requested-With,content-type,Authorization",
            },
            configure: (proxy, _options) => {
              proxy.on("error", (err, _req, _res) => {
                console.log("proxy error", err);
              });
              proxy.on("proxyReq", (proxyReq, req, _res) => {
                console.log("Sending Request:", req.method, req.url);
              });
              proxy.on("proxyRes", (proxyRes, req, _res) => {
                console.log("Received Response:", proxyRes.statusCode, req.url);
              });
            },
          },
          "^/status": {
            target: "https://dev.degenduel.me",
            changeOrigin: true,
            secure: true,
          },
          "^/admin/.*": {
            target: "https://dev.degenduel.me",
            changeOrigin: true,
            secure: true,
          },
          "^/auth/.*": {
            target: "https://dev.degenduel.me",
            changeOrigin: true,
            secure: true,
            cookieDomainRewrite: "localhost",
            headers: {
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Origin": "*",
            },
          },
          "^/portfolio": {
            target: "wss://dev.degenduel.me",
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v2/ws": {
            target: "wss://dev.degenduel.me",
            ws: true,
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [react()],
      optimizeDeps: {
        include: ["react", "react-dom", "react-router-dom"],
        exclude: ["@react-three/fiber", "@react-three/drei"],
        esbuildOptions: {
          target: "esnext",
        },
      },
      build: {
        minify: false,
        sourcemap: true,
      },
    };
  }

  // Try to load SSL certs - both domains use the same certificate
  const certPath = "/etc/letsencrypt/live/degenduel.me-0001";
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
          cookieDomainRewrite: "localhost",
          headers: {
            "Access-Control-Allow-Credentials": "true",
          },
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "Sending Request to the Target:",
                req.method,
                req.url
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "Received Response from the Target:",
                proxyRes.statusCode,
                req.url
              );
            });
          },
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/portfolio": {
          target: isDev
            ? "wss://dev.degenduel.me/api/v2/ws"
            : "wss://degenduel.me/api/v2/ws",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v2/ws": {
          target: isDev
            ? "wss://dev.degenduel.me"
            : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
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
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@aptos-labs/wallet-adapter-react",
        "@aptos-labs/wallet-adapter-core",
        "aptos",
        "graphql",
        "@telegram-apps/bridge",
      ],
      exclude: ["@react-three/fiber", "@react-three/drei"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      outDir,
      sourcemap: true,
      minify: isDev ? false : "esbuild",
      target: "esnext",
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        cache: true,
        external: [],
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "three-vendor": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],
            "ui-vendor": ["framer-motion", "react-icons", "styled-components"],
            "wallet-vendor": [
              "@aptos-labs/wallet-adapter-react",
              "@mizuwallet-sdk/core",
              "@mizuwallet-sdk/aptos-wallet-adapter",
              "graphql-request",
            ],
          },
          entryFileNames: isDev
            ? "assets/[name].js"
            : "assets/[name].[hash].js",
          chunkFileNames: isDev
            ? "assets/[name].js"
            : "assets/[name].[hash].js",
          assetFileNames: isDev
            ? "assets/[name].[ext]"
            : "assets/[name].[hash].[ext]",
          format: "esm" as ModuleFormat,
          compact: false,
          generatedCode: {
            symbols: true,
            constBindings: true,
          },
          minifyInternalExports: false,
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
    esbuild: {
      keepNames: isDev,
      minifyIdentifiers: !isDev,
      minifySyntax: !isDev,
      minifyWhitespace: !isDev,
      sourcemap: true,
    },
    logLevel: "info" as LogLevel,
  };

  return config;
});
