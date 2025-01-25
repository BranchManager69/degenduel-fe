// src/config/config.ts
/* Environment */
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.0.0.1");
const PROD_URL = "https://degenduel.me";
const PORT = "3003";

export const NODE_ENV = isDev ? "development" : "production";

/* Server */
export const PORT_CONFIG = PORT;
export const PROD_URL_CONFIG = PROD_URL;

/* API_URL */
export const API_URL = isDev
  ? `http://localhost:${PORT}/api`
  : `${PROD_URL}/api`;

console.log("API_URL configuration in use:", {
  environment: NODE_ENV,
  apiUrl: API_URL,
  port: PORT,
  hostname: window.location.hostname,
});

/* Superadmin Secret */
export const SUPERADMIN_SECRET = import.meta.env.VITE_SUPERADMIN_SECRET;
