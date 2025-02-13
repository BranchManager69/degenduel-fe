// src/config/config.ts

/* Environment */
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.0.0.1") ||
  window.location.hostname === "dev.degenduel.me";

const PROD_URL = "https://degenduel.me";
const DEV_URL = "https://dev.degenduel.me";

// Use correct ports for each environment
const PROD_PORT = "3004";
const DEV_PORT = "3005";

export const NODE_ENV = isDev ? "development" : "production";

/* Debug Mode */
export const DDAPI_DEBUG_MODE = isDev ? "true" : "false";

/* Server */
export const PORT_CONFIG = isDev ? DEV_PORT : PROD_PORT;
export const PROD_URL_CONFIG = PROD_URL;
export const DEV_URL_CONFIG = DEV_URL;

/* API_URL */
export const API_URL = isDev
  ? `${DEV_URL}/api`  // Use dev.degenduel.me in dev
  : `${PROD_URL}/api`;

/* WebSocket URL */
export const WS_URL = isDev
  ? `wss://dev.degenduel.me/api/v2/ws`  // Development WebSocket
  : `wss://degenduel.me/api/v2/ws`;     // Production WebSocket

console.log("API_URL configuration in use:", {
  environment: NODE_ENV,
  apiUrl: API_URL,
  wsUrl: WS_URL,
  port: PORT_CONFIG,
  hostname: window.location.hostname,
});

/* Superadmin Secret */
export const SUPERADMIN_SECRET = import.meta.env.VITE_SUPERADMIN_SECRET;
