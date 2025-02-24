import { API_URL, NODE_ENV } from "../../config/config";

// Log API configuration
console.log("API_URL configuration in use:", {
  environment: NODE_ENV,
  apiUrl: API_URL,
});

// Import all API modules
import { admin } from "./admin";
import { balance } from "./balance";
import { contests } from "./contests";
import { portfolio } from "./portfolio";
import { stats } from "./stats";
import { tokens } from "./tokens";
import { transactions } from "./transactions";
import { users } from "./users";

// Export the combined API interface
export const ddApi = {
  users,
  tokens,
  stats,
  admin,
  contests,
  portfolio,
  balance,
  transactions,
};

// Export utility functions
export * from "./utils";
