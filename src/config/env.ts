// src/config/env.ts

declare global {
  interface ImportMetaEnv {
    readonly VITE_WS_URL: string;
    // Add other Vite env variables as needed
  }
}

export const env = {
  WS_URL: import.meta.env.VITE_WS_URL as string,
  // Add other environment variables as needed
};
