export const NODE_ENV = import.meta.env.MODE || "production";

export const PORT = 3004;
export const PROD_URL = "https://degenduel.me";

// Base API URL
export const API_URL =
  NODE_ENV === "development"
    ? `http://localhost:${PORT}/api`
    : "https://degenduel.me/api";

//// Remove /api from base URL as it's added in the API calls
////export const API_BASE = API_URL.replace(/\/api$/, "");
export const API_BASE = API_URL;