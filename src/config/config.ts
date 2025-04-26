// src/config/config.ts

/* Environment */
const isDev =
  window.location.hostname === "localhost" ||
  ////window.location.hostname.startsWith("127.0.0.1") ||
  window.location.hostname === "dev.degenduel.me"; // if window is localhost or dev.degenduel.me, then isDev = TRUE
// Base URLs
const PROD_URL = "https://degenduel.me";
const DEV_URL = "https://dev.degenduel.me";
// Use correct ports for each environment
const PROD_PORT = "3004";
const DEV_PORT = "3005";
const LOCAL_PORT = "3006"; // almost NEVER if EVER used
// NODE_ENV gets set and exported; is either "development" or "production"
export const NODE_ENV = isDev ? "development" : "production";
// ^ Note: I'm going to allow this to stay exported for now but the new preferred method is to just use the config object at config.ENV.NODE_ENV

/* Debug Mode */
export const DDAPI_DEBUG_MODE = isDev ? "true" : "false";
export const AUTH_DEBUG_MODE = isDev ? "true" : "false";

// Helper function for auth debugging
export const authDebug = (context: string, message: string, data?: any) => {
  if (AUTH_DEBUG_MODE === "true") {
    const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.sss
    if (data) {
      console.log(`%c[AuthDebug:${context}] %c${timestamp} %c${message}`, 
        'color: #00a8e8; font-weight: bold', 
        'color: #888', 
        'color: #fff', 
        data);
    } else {
      console.log(`%c[AuthDebug:${context}] %c${timestamp} %c${message}`, 
        'color: #00a8e8; font-weight: bold', 
        'color: #888', 
        'color: #fff');
    }
  }
};

/* Server */
export const PORT_CONFIG = isDev
  ? window.location.hostname === "localhost"
    ? LOCAL_PORT // Use 3006 for local development
    : DEV_PORT // Use 3005 for deve
  : PROD_PORT; // Use 3004 for production

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
export const WS_URL = window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.0.0.1")
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }`
    : `wss://${window.location.hostname}`; // Always use current hostname to avoid cross-domain issues

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
  SHOW_HERO_TITLE: false, // Set to false to hide the animated HeroTitle component
};

/* System Settings */
export const SYSTEM_SETTINGS = {
  // Currently this contains ONLY the background_scene settings
  BACKGROUND_SCENE: {
    ENABLED: true,
    SCENES: [
      {
        name: "CyberGrid",
        enabled: true,
        zIndex: 0,
        blendMode: "normal",
      },
      {
        name: "Dodgeball",
        enabled: false,
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

// Official Contract Address
const CONTRACT_ADDRESS_REAL = import.meta.env.VITE_CONTRACT_ADDRESS_REAL || '0x1111111111111111111111111111111111111111';
const CONTRACT_ADDRESS_FAKE = import.meta.env.VITE_CONTRACT_ADDRESS_FAKE || '0x42069';

// Solana RPC Base URL - points to our proxy system
const SOLANA_RPC_BASE_URL = `${window.location.origin}/api/solana-rpc`;
// Token Launch Date/Time
const RELEASE_DATE_TOKEN_LAUNCH_DATETIME = new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00'); // December 31, 2025 at 11:59 PM EST
const RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL = import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL || 'December 31, 2025';
const RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT = import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT || 'Dec 31, 2025';
const RELEASE_DATE_DISPLAY_LAUNCH_TIME = import.meta.env.VITE_RELEASE_DATE_DISPLAY_LAUNCH_TIME || '23:59:59'; // 11:59 PM EST

// Debug log to see what environment variables are being used at build time
console.log('[Config] Release date from environment variables:', {
  env_var: import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME,
  parsed_date: RELEASE_DATE_TOKEN_LAUNCH_DATETIME,
  display_full: RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL,
  display_short: RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT,
  display_time: RELEASE_DATE_DISPLAY_LAUNCH_TIME
});
const RELEASE_DATE_PRE_LAUNCH_COUNTDOWN_START = new Date(RELEASE_DATE_TOKEN_LAUNCH_DATETIME.getTime() - ((60 * 60 * 1000) * Number(import.meta.env.VITE_RELEASE_DATE_PRE_LAUNCH_COUNTDOWN_HOURS) || 6)); // hours before token launch
const RELEASE_DATE_END_OF_LAUNCH_PARTY_FESTIVITIES = new Date(RELEASE_DATE_TOKEN_LAUNCH_DATETIME.getTime() + ((60 * 60 * 1000) * Number(import.meta.env.VITE_RELEASE_DATE_END_OF_LAUNCH_PARTY_FESTIVITIES_HOURS) || 1)); // hours after token launch

// ------------------------------------------------------------

// Config export
export const config = {
  // Environment
  ENV: {
    NODE_ENV: NODE_ENV,
    IS_DEV: isDev,
    IS_PROD: !isDev
  },
  CONTRACT_ADDRESS: {
    REAL: CONTRACT_ADDRESS_REAL,
    FAKE: CONTRACT_ADDRESS_FAKE
  },
  SOLANA: {
    // Use the real contract address for the DegenDuel token
    DEGEN_TOKEN_ADDRESS: CONTRACT_ADDRESS_REAL,
    // Our RPC proxy system URL
    RPC_BASE_URL: SOLANA_RPC_BASE_URL,
  },
  RELEASE_DATE: {
    PRE_LAUNCH_COUNTDOWN_START: RELEASE_DATE_PRE_LAUNCH_COUNTDOWN_START,
    TOKEN_LAUNCH_DATETIME: RELEASE_DATE_TOKEN_LAUNCH_DATETIME,
    END_OF_LAUNCH_PARTY_FESTIVITIES: RELEASE_DATE_END_OF_LAUNCH_PARTY_FESTIVITIES,
    DISPLAY: {
      LAUNCH_DATE_SHORT: RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT,
      LAUNCH_DATE_FULL: RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL,
      LAUNCH_TIME: RELEASE_DATE_DISPLAY_LAUNCH_TIME,
    }
  }
};

// Log successful config export
console.log("⚔️ DegenDuel client configuration successful:");
if (NODE_ENV === "development") {
  console.log("Using:", {
    environment: NODE_ENV,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    port: PORT_CONFIG,
    hostname: window.location.hostname,
    featureFlags: FEATURE_FLAGS,
  });
} else {
  console.log("Using:", {
    environment: NODE_ENV,
    hostname: window.location.hostname,
  });
}