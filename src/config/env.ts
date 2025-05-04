// src/config/env.ts

/***********************************************************************
 * ⚠️ CRITICAL ENV VARIABLE MANAGEMENT ISSUE ⚠️
 * 
 * CURRENT PROBLEM:
 * - Environment variables (import.meta.env.VITE_*) are used directly in 
 *   60+ locations throughout the codebase instead of being centralized.
 * 
 * URGENT ACTION REQUIRED:
 * - ALL environment variables should be defined and exported from THIS file
 * - Components should import from here rather than using import.meta.env directly
 * - Update the ImportMetaEnv interface to include ALL environment variables
 * - Add proper typing and documentation for each environment variable
 * - Add validation for required environment variables
 * 
 * This centralization is essential for:
 *   1. Type safety
 *   2. Easier refactoring
 *   3. Better testing
 *   4. Consistent default values
 *   5. Documentation of all available env variables
 ***********************************************************************/

declare global {
  interface ImportMetaEnv {
    readonly VITE_WS_URL: string;
    readonly VITE_PRIVY_APP_ID: string;
    readonly VITE_PRIVY_CLIENT_KEY: string;
    readonly VITE_USE_JUPITER_WALLET?: string;
    // Add other Vite env variables as needed
  }
}

export const env = {
  WS_URL: import.meta.env.VITE_WS_URL as string,
  PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID as string,
  PRIVY_CLIENT_KEY: import.meta.env.VITE_PRIVY_CLIENT_KEY as string,
  // Wallet feature flags - store as a string with wallet priority order
  USE_JUPITER_WALLET: import.meta.env.VITE_USE_JUPITER_WALLET === 'true',
  // Store wallet priority - this determines which wallet gets used first
  // Format: comma-separated list of wallet adapters in order of priority
  // Example: "phantom,jupiter,privy,biometric"
  WALLET_PRIORITY: (import.meta.env.VITE_WALLET_PRIORITY as string) || "phantom,jupiter",
  // Add other environment variables as needed
};
