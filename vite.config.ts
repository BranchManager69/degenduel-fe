import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { ModuleFormat } from "rollup";
import { defineConfig, LogLevel, UserConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }): UserConfig => {
  // Resolve path to degen-components
  const degenComponentsPath = path.resolve(__dirname, 'node_modules/degen-components/dist/index.esm.js');
  // Force development mode when running dev server
  const isDev = command === "serve" || mode === "development";
  // Add local dev mode check
  const isLocalDev = mode === "dev-local";
  // Check for forced disable of minification
  const forceDisableMinify = process.env.VITE_FORCE_DISABLE_MINIFY === "true";

  if (forceDisableMinify) {
    console.log(
      "⚠️ MINIFICATION FORCED DISABLED via VITE_FORCE_DISABLE_MINIFY"
    );
  }

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
      resolve: {
        alias: {
          'degen-components': degenComponentsPath
        }
      },
      server: {
        port: 3010,
        host: true,
        strictPort: true,
        https: undefined,
        hmr: {
          clientPort: 3010,
          host: "localhost",
          protocol: "ws",
        },
        proxy: {
          "^/api/.*": {
            target: "https://degenduel.me", // MANUAL OVERRIDE
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
            target: "https://degenduel.me", // MANUAL OVERRIDE
            changeOrigin: true,
            secure: true,
          },
          "^/admin/.*": {
            target: "https://degenduel.me", // MANUAL OVERRIDE
            changeOrigin: true,
            secure: true,
          },
          "^/auth/.*": {
            target: "https://degenduel.me", // MANUAL OVERRIDE
            changeOrigin: true,
            secure: true,
            cookieDomainRewrite: "localhost",
            headers: {
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Origin": "*",
            },
          },
          "^/portfolio": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/monitor": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/token-data": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/contest": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/skyduel": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/wallet": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/market-data": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/notifications": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/portfolio": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/circuit-breaker": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          // "^/api/v69/ws/services" endpoint doesn't exist - removed as per backend team guidance
          // Service monitoring is handled by /api/v69/ws/circuit-breaker and /api/v69/ws/monitor
          "^/api/v69/ws/system-settings": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
          "^/api/v69/ws/analytics": {
            target: "wss://degenduel.me", // MANUAL OVERRIDE
            ws: true,
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [react()],
      optimizeDeps: {
        include: ["react", "react-dom", "react-router-dom"],
        exclude: ["@react-three/fiber", "@react-three/drei", "degen-components"],
        esbuildOptions: {
          target: "esnext",
        },
      },
      build: {
        minify: false,
        sourcemap: true,
        rollupOptions: {
          external: ['degen-components']
        }
      },
    };
  }

  // Try to load SSL certs - both domains use the same certificate
  const certPath = "/etc/letsencrypt/live/beta.degenduel.me";
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
    resolve: {
      alias: {
        'degen-components': degenComponentsPath
      }
    },
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
          target: isDev ? "wss://dev.degenduel.me/api/v69/ws" : "wss://degenduel.me/api/v69/ws",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/monitor": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/token-data": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/contest": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/skyduel": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/wallet": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",  
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/market-data": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/notifications": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/portfolio": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/circuit-breaker": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        // "/api/v69/ws/services" endpoint doesn't exist - removed as per backend team guidance
        // Service monitoring is handled by /api/v69/ws/circuit-breaker and /api/v69/ws/monitor
        "/api/v69/ws/system-settings": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
          ws: true,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
        },
        "/api/v69/ws/analytics": {
          target: isDev ? "wss://dev.degenduel.me" : "wss://degenduel.me",
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
      exclude: ["@react-three/fiber", "@react-three/drei", "degen-components"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      outDir,
      sourcemap: true,
      minify: forceDisableMinify ? false : isDev ? false : "esbuild",
      target: "esnext",
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        cache: true,
        external: ['degen-components'],
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
      terserOptions:
        isDev || forceDisableMinify
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
      keepNames: isDev || forceDisableMinify,
      minifyIdentifiers: !isDev && !forceDisableMinify,
      minifySyntax: !isDev && !forceDisableMinify,
      minifyWhitespace: !isDev && !forceDisableMinify,
      sourcemap: true,
    },
    logLevel: "info" as LogLevel,
  };

  return config;
});
