// src/config/config.ts

/* Environment */
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.0.0.1") ||
  window.location.hostname === "degenduel.me"; // MANUAL OVERRIDE

const PROD_URL = "https://degenduel.me";
const DEV_URL = "https://degenduel.me"; // MANUAL OVERRIDE

// Use correct ports for each environment
const PROD_PORT = "3004";
const DEV_PORT = "3005";
const LOCAL_PORT = "3006";

export const NODE_ENV = isDev ? "development" : "production";

/* Debug Mode */
export const DDAPI_DEBUG_MODE = isDev ? "true" : "false";

/* Server */
export const PORT_CONFIG = isDev
  ? window.location.hostname === "localhost"
    ? LOCAL_PORT // Use 3006 for local development
    : DEV_PORT // Use 3005 for deve
  : PROD_PORT;

export const PROD_URL_CONFIG = PROD_URL;
export const DEV_URL_CONFIG = DEV_URL;

/* API_URL */
export const API_URL = isDev
  ? window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.0.0.1")
    ? `${window.location.protocol}//${window.location.host}/api` // Use full URL with current host/port
    : `${DEV_URL}/api`
  : `${PROD_URL}/api`;

/* WebSocket URL */
export const WS_URL = isDev
  ? window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.0.0.1")
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }/portfolio`
    : `wss://degenduel.me/portfolio` // MANUAL OVERRIDE
  : `wss://degenduel.me/portfolio`;

/* Rates */
export const TOKEN_SUBMISSION_COST = isDev
  ? 0.01 // 0.01 SOL in dev
  : 1; // 1.00 SOL in prod
export const DD_PLATFORM_FEE = isDev
  ? 0.1 // 10% in dev
  : 0.1; // 10% in prod

/* Superadmin Secret */
export const SUPERADMIN_SECRET = import.meta.env.VITE_SUPERADMIN_SECRET;

/* Treasury Wallet */
export const TREASURY_WALLET = import.meta.env.VITE_TREASURY_WALLET;

/* Virtuals Game SDK API Key */
export const VIRTUALS_GAME_SDK_API_KEY = import.meta.env
  .VITE_VIRTUALS_GAME_SDK_API_KEY;

/* OpenAI API Key */
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/* Moralis API Key */
//export const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;

/* OpenRouter API Key */
//export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/* Feature Flags */
export const FEATURE_FLAGS = {
  SHOW_FEATURES_SECTION: false, // Set to false to disable the Features section on landing page
};

/* System Settings */
export const SYSTEM_SETTINGS = {
  BACKGROUND_SCENE: {
    ENABLED: true,
    SCENE_NAME: "Dodgeball", // Options: "Dodgeball", "TokenVerse", "MarketVerse", etc.
  }
};

/* Done */
if (NODE_ENV === "development") {
  console.log("API_URL configuration in use:", {
    environment: NODE_ENV,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    port: PORT_CONFIG,
    hostname: window.location.hostname,
    featureFlags: FEATURE_FLAGS,
  });
} else {
  console.log("API_URL configuration in use:", {
    environment: NODE_ENV,
    hostname: window.location.hostname,
  });
}
