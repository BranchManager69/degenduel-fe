// src/config/config.mock.ts
// This is a mock config file for testing that doesn't use import.meta

export const API_URL = 'http://localhost:3000/api';
export const DDAPI_DEBUG_MODE = true;
export const WEBSOCKET_URL = 'ws://localhost:3001';
export const SUPERADMIN_SECRET = 'test-secret';
export const AUTH_TOKEN_KEY = 'auth_token';
export const WALLET_KEY = 'wallet_address';
export const NODE_ENV = 'test';
export const APP_VERSION = '1.0.0-test';
export const BUILD_NUMBER = '123';
export const ENABLE_SENTRY = false;
export const SENTRY_DSN = '';
export const DEFAULT_THEME = 'dark';
export const MAX_CONCURRENT_NETWORK_REQUESTS = 5;

// Add other config values as needed