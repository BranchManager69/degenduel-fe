// src/config/env.ts

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
  // Wallet feature flags
  USE_JUPITER_WALLET: import.meta.env.VITE_USE_JUPITER_WALLET === 'true',
  // Add other environment variables as needed
};
