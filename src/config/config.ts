export const NODE_ENV = "production"; // "production" || "development";

export const PORT = 3004;
export const PROD_URL = "https://degenduel.me";

export const API_URL =
  NODE_ENV === "production"
    ? `${PROD_URL}/api`
    : `http://localhost:${PORT}/api`;
