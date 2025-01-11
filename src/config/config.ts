// src/config/config.ts
/* Environment */
export const NODE_ENV = import.meta.env.VITE_NODE_ENV; // "production" || "development";

/* Server */
export const PORT = import.meta.env.VITE_PORT || 3003;
export const PROD_URL = import.meta.env.VITE_PROD_URL || "https://degenduel.me";

/* API_URL */
export const API_URL =
  import.meta.env.VITE_NODE_ENV === "production"
    ? `${PROD_URL}/api`
    : `http://localhost:${PORT}/api`;

/* Superadmin Secret */
export const SUPERADMIN_SECRET = import.meta.env.VITE_SUPERADMIN_SECRET;
