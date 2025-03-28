/**
 * Client Log Forwarder
 * 
 * This utility forwards client-side logs, warnings, and errors to the server.
 * It uses both the WebSocket system and API fallback to ensure reliable delivery.
 */

import { useStore } from "../store/useStore";
import { MessageType } from "../hooks/websocket/WebSocketManager";
import { clientLogService } from "../services/clientLogService";

// Customize these thresholds based on your needs
const MAX_QUEUE_SIZE = 50;
const BATCH_SEND_INTERVAL = 10000; // 10 seconds
const ERROR_RETRY_COUNT = 3;
const MAX_LOG_SIZE = 5000; // Truncate large logs

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
  // Create a unique session ID for this browser session
  sessionId = sessionStorage.getItem('logSessionId') || generateSessionId();
  sessionStorage.setItem('logSessionId', sessionId);
  
  // Override console methods to capture logs
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  // Replace console methods to capture logs
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    // Don't capture regular logs by default (would be too noisy)
    // addToQueue(LogLevel.DEBUG, args);
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    // Don't capture info logs by default (would be too noisy)
    // addToQueue(LogLevel.INFO, args);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    addToQueue(LogLevel.WARN, args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    addToQueue(LogLevel.ERROR, args);
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    addToQueue(LogLevel.ERROR, [event.message], {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
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
    // Fallback to original console to avoid infinite loop
    originalConsoleError('Error in client log forwarder:', err);
  }
};

/**
 * Extract stack trace from log arguments if available
 */
const extractStackTrace = (args: any[]): string | undefined => {
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
 * Store for the original console methods
 */
const originalConsoleError = console.error.bind(console);

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
        originalConsoleError('Failed to send logs after maximum retries, dropping logs');
      }
    }
  } catch (err) {
    originalConsoleError('Error sending logs:', err);
  } finally {
    isSending = false;
  }
};

/**
 * Send logs via WebSocket
 */
const sendLogsViaWebSocket = (logs: LogEntry[]): boolean => {
  try {
    // Import WebSocketManager dynamically to avoid circular dependencies
    const { instance } = require('../hooks/websocket/WebSocketManager');
    
    if (!instance) {
      return false;
    }
    
    // Get user info if available
    const user = useStore.getState().user;
    
    // Use the preferred LOGS message type as specified by backend
    return instance.sendMessage({
      type: MessageType.LOGS,
      logs: logs,
      sessionId: sessionStorage.getItem('logSessionId') || undefined,
      userId: user?.wallet_address,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    originalConsoleError('Error sending logs via WebSocket:', err);
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
    originalConsoleError('Error sending logs via API:', err);
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