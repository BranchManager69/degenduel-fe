// src/config/config.ts

/* Environment */
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.0.0.1") ||
  window.location.hostname === "dev.degenduel.me"; // Use dev subdomain for development

const PROD_URL = "https://degenduel.me";
const DEV_URL = "https://dev.degenduel.me";

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

/* WebSocket Base URL */
export const WS_URL = isDev
  ? window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.0.0.1")
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }`
    : import.meta.env.VITE_WS_URL || "wss://dev.degenduel.me" // Use dev domain for development
  : import.meta.env.VITE_WS_URL || "wss://degenduel.me";

/* Platform Fees */
export const TOKEN_SUBMISSION_COST = isDev // New token whitelisting cost
  ? 0.01 // 0.01 SOL in dev
  : 1; // 1.00 SOL in prod
export const DD_PLATFORM_FEE = isDev // Contests vig
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
  SHOW_FEATURES_SECTION: true, // Set to false to hide the FeatureCards on the landing page
};

/* System Settings */
export const SYSTEM_SETTINGS = {
  // Currently this contains ONLY the background_scene settings
  BACKGROUND_SCENE: {
    ENABLED: true,
    SCENES: [
      {
        name: "Dodgeball",
        enabled: true,
        zIndex: 4,
        blendMode: "screen",
      },
      {
        name: "TokenVerse",
        enabled: false,
        zIndex: 1,
        blendMode: "normal",
      },
      {
        name: "MarketVerse",
        enabled: false,
        zIndex: 2,
        blendMode: "lighten",
      },
      {
        name: "MarketBrain",
        enabled: false,
        zIndex: 3,
        blendMode: "normal",
      },
      {
        name: "AmbientMarketData",
        enabled: false,
        zIndex: 5,
        blendMode: "normal",
      },
    ],
  },
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

// TODO: Add a config for the API_URL *and* WS_URL
