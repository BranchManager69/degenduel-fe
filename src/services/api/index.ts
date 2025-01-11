import { API_URL, NODE_ENV, PORT } from "../../config/config";

// Log API configuration
console.log("API_URL configuration in use:", {
  environment: NODE_ENV,
  apiUrl: API_URL,
  port: PORT,
});

// Import all API modules
import { admin } from "./admin.ts";
import { balance } from "./balance.ts";
import { contests } from "./contests.ts";
import { portfolio } from "./portfolio.ts";
import { stats } from "./stats.ts";
import { tokens } from "./tokens.ts";
import { transactions } from "./transactions.ts";
import { users } from "./users.ts";

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
export * from "./utils.ts";
