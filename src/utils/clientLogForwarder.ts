// src/utils/clientLogForwarder.ts

/**
 * Client Log Forwarder
 * 
 * @description This utility forwards client-side logs, warnings, and errors to the server.
 * It uses both the WebSocket system and API fallback to ensure reliable delivery.
 * It also conditionally controls output to the user's browser console.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-01
 * @updated 2025-05-08
 */

/**
 * ✨ USES DD SHARED TYPES ✨
 * This file uses DegenDuel shared types from the degenduel-shared package.
 * These types are the official standard for frontend-backend communication.
 */

import { NODE_ENV } from "../config/config"; // Import environment status
import { MessageType } from "../hooks/websocket";
import { clientLogService } from "../services/clientLogService";
import { useStore } from "../store/useStore";

// Store original console methods before overriding
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Client log forwarder thresholds
const MAX_QUEUE_SIZE = 50;
const BATCH_SEND_INTERVAL = 10 * 1000; // 10 seconds
const ERROR_RETRY_COUNT = 3;
const MAX_LOG_SIZE = 5000; // Truncate large logs
const MESSAGE_CACHE_CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const MESSAGE_COOLDOWN = 5 * 1000; // 5 seconds between showing the same log message
const MAX_REPEAT_COUNT = 3; // Show the message at most 3 times in the cooldown period

// Debug verbosity flag for *server* logging (forwarding)
const VERBOSE_SERVER_LOGGING = false; // Set to false to reduce log spam sent to server

// ** NEW **: Control flag for verbose (debug/info) output in the *client* console
// Defaults to true in dev, false in prod. Can be overridden by remote setting.
let enableVerboseClientConsole = (NODE_ENV === 'development');

// Log levels
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal"
}

// Log entry structure
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  userWallet?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  stackTrace?: string;
  tags?: string[];
}

// Rate limiting for repeated logs
interface MessageCacheEntry {
  count: number;
  lastTime: number;
}

// Message cache
let messageCache: Map<string, MessageCacheEntry> = new Map();

// Check if a message should be rate limited
const shouldRateLimit = (message: string): boolean => {
  // Rate-limit noisy messages
  //   - expanded list to include Terminal/TerminalDataService errors
  if (!message.includes('[Jupiter Wallet]') && 
      !message.includes('WebSocketContext:') && 
      !message.includes('WebSocketManager:') && 
      !message.includes('WalletContext') &&
      !message.includes('Cannot refresh tokens') &&
      !message.includes('App configuration has Solana wallet login enabled') &&
      !message.includes('[TerminalDataService]') &&
      !message.includes('[Terminal]') &&
      !message.includes('Error fetching terminal data') &&
      !message.includes('[WebSocketContext]')) {
    return false;
  }
  
  // Cache key
  const key = message.substring(0, 50); // Use first 50 chars as cache key
  const now = Date.now();
  const cacheEntry = messageCache.get(key);
  
  // If we've shown this message too many times recently, suppress it
  if (cacheEntry) {
    // If it's been shown too many times recently, suppress it
    if (cacheEntry.count >= MAX_REPEAT_COUNT && now - cacheEntry.lastTime < MESSAGE_COOLDOWN) {
      return true; // Should be rate limited
    }
    
    //// More aggressive throttling for Terminal data errors
    //if (message.includes('Error fetching terminal data') && 
    //    cacheEntry.count >= 2 && 
    //    now - cacheEntry.lastTime < MESSAGE_COOLDOWN * 5) {
    //  return true; // Rate limit more aggressively for terminal errors
    //}
    
    // Update count and time
    cacheEntry.count++;
    cacheEntry.lastTime = now;
    messageCache.set(key, cacheEntry);
  } else {
    // First time seeing this message
    messageCache.set(key, { count: 1, lastTime: now });
  }
  
  return false; // Should not be rate limited
};

// Periodically clean up the message cache to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of messageCache.entries()) {
    if (now - entry.lastTime > MESSAGE_COOLDOWN * 2) {
      messageCache.delete(key);
    }
  }
}, MESSAGE_CACHE_CLEANUP_INTERVAL); // Clean up message cache every 1 minute

// Queue to store logs
let logQueue: LogEntry[] = [];
let isSending = false;
let retryCount = 0;
let batchSendTimer: number | null = null;
let isWebSocketConnected = false;
let sessionId = '';

// Initialize the session ID with cryptographically secure random values
const generateSessionId = (): string => {
  // Use Web Crypto API which is available in all modern browsers
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Initialize the client log forwarder
 */
export const initializeClientLogForwarder = (): void => {
  sessionId = sessionStorage.getItem('logSessionId') || generateSessionId();
  sessionStorage.setItem('logSessionId', sessionId);
  
  originalConsole.log(`[LogForwarder] Initializing. Default verbose client console output: ${enableVerboseClientConsole} (NODE_ENV: ${NODE_ENV})`);

  // Override console methods
  console.log = (...args: any[]) => {
    if (args.length > 0) {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (shouldRateLimit(message)) return;
    }
    // *** Conditional output ***
    if (enableVerboseClientConsole) {
      originalConsole.log(...args);
    }
    // Forwarding logic (optional for debug level)
    // if (VERBOSE_SERVER_LOGGING) addToQueue(LogLevel.DEBUG, args);
  };

  console.info = (...args: any[]) => {
    if (args.length > 0) {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (shouldRateLimit(message)) return;
    }
    // *** Conditional output ***
    if (enableVerboseClientConsole) {
      originalConsole.info(...args);
    }
    // Forwarding logic (optional for info level)
    // if (VERBOSE_SERVER_LOGGING) addToQueue(LogLevel.INFO, args);
  };

  console.warn = (...args: any[]) => {
    if (args.length > 0) {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (shouldRateLimit(message)) return;
    }
    // *** Always output to console ***
    originalConsole.warn(...args);
    // Forwarding logic (use existing filters)
    // (Keeping existing logic which already filters some warnings before queuing)
    const forwardToServer = VERBOSE_SERVER_LOGGING || (args.length > 0 && typeof args[0] === 'string' && 
      !args[0].includes('App configuration has Solana wallet login enabled') &&
      !args[0].includes('WalletContext without providing one') &&
      !args[0].includes('Solana wallet connectors have been passed') &&
      !args[0].includes('[Jupiter Wallet]') &&
      !args[0].includes('UnifiedTicker: ') &&
      !args[0].includes('[TokenData]') &&
      !args[0].includes('WebSocketManager:') &&
      !args[0].includes('WebSocketContext:') &&
      !args[0].includes('[WebSocketContext]') &&
      !args[0].includes('Cannot refresh tokens'));

    if (forwardToServer) {
      addToQueue(LogLevel.WARN, args);
    }
  };

  console.error = (...args: any[]) => {
    if (args.length > 0) {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (shouldRateLimit(message)) return;
    }
    // *** Always output to console ***
    originalConsole.error(...args);
    // Forwarding logic (use existing filters)
    // (Keeping existing logic which already filters some errors before queuing)
     const forwardToServer = VERBOSE_SERVER_LOGGING || (args.length > 0 && typeof args[0] === 'string' && 
      !args[0].includes('tried to read "publicKey" on a WalletContext') &&
      !args[0].includes('tried to read "wallet" on a WalletContext') &&
      !args[0].includes('tried to read "wallets" on a WalletContext') &&
      !(args[0].includes('You have tried to read') && args[0].includes('WalletContext')) &&
      !args[0].includes('[Jupiter Wallet]') &&
      !args[0].includes('App configuration has Solana wallet login enabled') &&
      !args[0].includes('WebSocketManager:') &&
      !args[0].includes('WebSocketContext:') &&
      !args[0].includes('[WebSocketContext]') &&
      !args[0].includes('Solana wallet connectors have been passed'));

    if (forwardToServer) {
      addToQueue(LogLevel.ERROR, args);
    }
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    originalConsole.error('Unhandled error:', event.error || event.message);
    addToQueue(LogLevel.ERROR, [event.message], {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    originalConsole.error('Unhandled promise rejection:', event.reason);
    addToQueue(LogLevel.ERROR, ['Unhandled Promise Rejection:', event.reason], {
      stack: event.reason?.stack
    });
  });

  // Start batch sending timer
  scheduleBatchSend();

  // Add handler for WebSocket connection status
  window.addEventListener('websocket-status', (event: any) => {
    isWebSocketConnected = event.detail?.connected || false;
  });

  // Fetch remote setting asynchronously *after* overrides are in place
  fetchRemoteLoggingSetting();
};

/**
 * Add a log to the queue
 */
const addToQueue = (level: LogLevel, args: any[], context: Record<string, any> = {}): void => {
  try {
    const message = formatLogMessage(args);
    
    // Get user information if available
    const store = useStore.getState();
    const user = store.user;
    
    // Truncate message if too large
    const truncatedMessage = message.length > MAX_LOG_SIZE 
      ? message.substring(0, MAX_LOG_SIZE) + '... [truncated]'
      : message;
    
    // Create log entry
    const logEntry: LogEntry = {
      level,
      message: truncatedMessage,
      timestamp: new Date().toISOString(),
      context,
      userId: user?.wallet_address, // Use wallet_address as userId
      userWallet: user?.wallet_address,
      sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: extractStackTrace(args)
    };
    
    // Add to queue
    logQueue.push(logEntry);
    
    // Limit queue size to prevent memory issues
    if (logQueue.length > MAX_QUEUE_SIZE) {
      logQueue.shift();
    }
    
    // Send immediately if it's an error
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      sendLogsNow();
    }
  } catch (err) {
    originalConsole.error('[LogForwarder] Error adding log to queue:', err);
  }
};

/**
 * Extract stack trace from log arguments if available
 */
const extractStackTrace = (args: any[]): string | undefined => {
  // Extract stack trace from log arguments if available
  for (const arg of args) {
    if (arg instanceof Error && arg.stack) {
      return arg.stack;
    }
    if (typeof arg === 'object' && arg !== null && 'stack' in arg) {
      return String(arg.stack);
    }
  }
  
  // If no stack found in args, generate one
  try {
    throw new Error('Stack trace');
  } catch (err) {
    if (err instanceof Error) {
      // Remove the first line which is our dummy error
      const lines = err.stack?.split('\n') || [];
      return lines.slice(3).join('\n');
    }
  }
  
  return undefined;
};

/**
 * Format log message from arguments
 */
const formatLogMessage = (args: any[]): string => {
  return args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message;
    try {
      return JSON.stringify(arg);
    } catch (err) {
      return String(arg);
    }
  }).join(' ');
};

/**
 * Schedule batch sending of logs
 */
const scheduleBatchSend = (): void => {
  if (batchSendTimer !== null) {
    window.clearTimeout(batchSendTimer);
  }
  
  batchSendTimer = window.setTimeout(() => {
    sendLogs();
    scheduleBatchSend();
  }, BATCH_SEND_INTERVAL);
};

/**
 * Send logs immediately
 */
export const sendLogsNow = (): void => {
  sendLogs();
};

/**
 * Send logs to the server
 */
const sendLogs = async (): Promise<void> => {
  if (isSending || logQueue.length === 0) return;
  
  isSending = true;
  const logsToSend = [...logQueue];
  
  try {
    // Try to send logs via WebSocket first (preferred for real-time)
    if (isWebSocketConnected) {
      const success = sendLogsViaWebSocket(logsToSend);
      if (success) {
        // Clear sent logs from queue
        logQueue = logQueue.slice(logsToSend.length);
        isSending = false;
        retryCount = 0;
        return;
      }
    }
    
    // Fallback to API if WebSocket failed or is not connected
    const success = await sendLogsViaApi(logsToSend);
    
    if (success) {
      // Clear sent logs from queue
      logQueue = logQueue.slice(logsToSend.length);
      retryCount = 0;
    } else {
      // Increment retry count
      retryCount++;
      
      // If we've tried too many times, drop these logs to prevent queue buildup
      if (retryCount >= ERROR_RETRY_COUNT) {
        logQueue = logQueue.slice(logsToSend.length);
        retryCount = 0;
        originalConsole.error('[LogForwarder] Failed to send logs after maximum retries, dropping logs');
      }
    }
  } catch (err) {
    originalConsole.error('[LogForwarder] Error during sendLogs:', err);
  } finally {
    isSending = false;
  }
};

/**
 * Send logs via WebSocket
 */
const sendLogsViaWebSocket = (logs: LogEntry[]): boolean => {
  try {
    // WebSocketContext provides a stable, persistent connection for log forwarding
    const webSocketContext = (window as any).__DD_WEBSOCKET_CONTEXT;
    
    if (!webSocketContext || !webSocketContext.isConnected) {
      return false;
    }
    
    // Get user info if available
    const user = useStore.getState().user;
    
    try {
      // Use the standardized message type from our extended type
      return webSocketContext.sendMessage({
        type: MessageType.LOGS,
        logs: logs,
        sessionId: sessionStorage.getItem('logSessionId') || undefined,
        userId: user?.wallet_address,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      originalConsole.warn("[LogForwarder] Error using WebSocketContext to send logs:", err);
      return false;
    }
  } catch (err) {
    originalConsole.error('[LogForwarder] Error sending logs via WebSocket:', err);
    return false;
  }
};

/**
 * Send logs via API
 */
const sendLogsViaApi = async (logs: LogEntry[]): Promise<boolean> => {
  try {
    return await clientLogService.sendLogs(logs);
  } catch (err) {
    originalConsole.error('[LogForwarder] Error sending logs via API:', err);
    return false;
  }
};

/**
 * Manually log a message
 */
export const log = (
  level: LogLevel,
  message: string,
  context: Record<string, any> = {}
): void => {
  addToQueue(level, [message], context);
};

// Export log levels and functions for convenience
export const clientLogger = {
  debug: (message: string, context?: Record<string, any>) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: Record<string, any>) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: Record<string, any>) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: Record<string, any>) => log(LogLevel.ERROR, message, context),
  fatal: (message: string, context?: Record<string, any>) => log(LogLevel.FATAL, message, context),
};

// --- ** NEW **: Fetch Remote Setting --- //
async function fetchRemoteLoggingSetting() {
  const endpoint = '/api/v1/settings/client-logging-status'; // Stub endpoint
  try {
    // Use original console here to prevent loops if fetch itself logs errors
    originalConsole.log(`[LogForwarder] Fetching remote client logging setting from ${endpoint}`);
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      // Assuming backend returns { "enableConsoleOutput": boolean }
      const remoteSetting = !!data.enableConsoleOutput;
      if (remoteSetting !== enableVerboseClientConsole) {
        enableVerboseClientConsole = remoteSetting;
        originalConsole.log(`[LogForwarder] Remote setting updated verbose client console output to: ${enableVerboseClientConsole}`);
      } else {
        originalConsole.log(`[LogForwarder] Remote setting matches current client console setting (${enableVerboseClientConsole}). No change needed.`);
      }
    } else {
      // Endpoint exists but returned an error (e.g., 500) - keep default
      originalConsole.warn(`[LogForwarder] Failed to fetch remote logging setting (Status: ${response.status}), using default: ${enableVerboseClientConsole}`);
    }
  } catch (error) {
    // Network error or endpoint doesn't exist (e.g., 404 fetch might throw depending on browser/fetch setup)
    // Keep default setting
    originalConsole.warn(`[LogForwarder] Error fetching remote logging setting (Network error or 404?), using default: ${enableVerboseClientConsole}. Error:`, error);
  }
}