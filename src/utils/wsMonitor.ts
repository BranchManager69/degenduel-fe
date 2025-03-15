/**
 * WebSocket Monitoring and Management Utilities
 * 
 * This file contains utilities for monitoring, tracking, and managing WebSocket connections
 * across the application. It provides a centralized way to track active connections,
 * log events, and help debug WebSocket-related issues.
 */

// Type declarations to extend Window interface
declare global {
  interface Window {
    DDActiveWebSockets: {
      [key: string]: number;
      total: number;
    };
    DDConnectionAttempts: {
      [key: string]: number;
      total: number;
    };
    DDLastWebSocketErrors: {
      [key: string]: {
        timestamp: number;
        code?: number;
        message?: string;
      };
    };
  }
}

// Initialize global WebSocket tracking if it doesn't exist
export const initializeWebSocketTracking = (): void => {
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = {
      total: 0
    };
    
    console.log('[WSMonitor] WebSocket connection tracking initialized');
  }
  
  // Initialize connection attempt tracking
  if (!window.DDConnectionAttempts) {
    window.DDConnectionAttempts = {
      total: 0
    };
    
    console.log('[WSMonitor] WebSocket connection attempt tracking initialized');
  }
  
  // Initialize error tracking
  if (!window.DDLastWebSocketErrors) {
    window.DDLastWebSocketErrors = {};
    
    console.log('[WSMonitor] WebSocket error tracking initialized');
  }
};

// Track a connection attempt
export const trackConnectionAttempt = (type: string): void => {
  initializeWebSocketTracking();
  
  // Initialize counter for this type if it doesn't exist
  if (typeof window.DDConnectionAttempts[type] !== 'number') {
    window.DDConnectionAttempts[type] = 0;
  }
  
  // Ensure total is initialized
  if (typeof window.DDConnectionAttempts.total !== 'number') {
    window.DDConnectionAttempts.total = 0;
  }
  
  // Increment counters
  window.DDConnectionAttempts[type]++;
  window.DDConnectionAttempts.total++;
  
  console.log(`[WSMonitor] ${type} connection attempt. Attempts: ${window.DDConnectionAttempts[type]}, Total attempts: ${window.DDConnectionAttempts.total}`);
  
  dispatchWebSocketEvent('connection-attempt', {
    socketType: type,
    attemptCount: window.DDConnectionAttempts[type],
    totalAttempts: window.DDConnectionAttempts.total
  });
};

// Track a new WebSocket connection
export const trackWebSocketConnection = (type: string): void => {
  initializeWebSocketTracking();
  
  // Initialize counter for this type if it doesn't exist
  if (typeof window.DDActiveWebSockets[type] !== 'number') {
    window.DDActiveWebSockets[type] = 0;
  }
  
  // Ensure total is initialized
  if (typeof window.DDActiveWebSockets.total !== 'number') {
    window.DDActiveWebSockets.total = 0;
  }
  
  // Increment counters
  window.DDActiveWebSockets[type]++;
  window.DDActiveWebSockets.total++;
  
  console.log(`[WSMonitor] ${type} connection opened. Active: ${window.DDActiveWebSockets[type]}, Total: ${window.DDActiveWebSockets.total}`);
  
  dispatchWebSocketEvent('connection-tracking', {
    socketType: type,
    activeCount: window.DDActiveWebSockets[type],
    totalCount: window.DDActiveWebSockets.total,
    attemptCount: window.DDConnectionAttempts[type] || 0
  });
};

// Untrack a WebSocket connection (when it's closed)
export const untrackWebSocketConnection = (type: string): void => {
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = { total: 0 };
  }
  
  // Initialize counter for this type if it doesn't exist
  if (typeof window.DDActiveWebSockets[type] !== 'number') {
    window.DDActiveWebSockets[type] = 0;
    console.warn(`[WSMonitor] Trying to untrack ${type} connection, but it's not being tracked - initializing to 0`);
  }
  
  // Ensure total is initialized
  if (typeof window.DDActiveWebSockets.total !== 'number') {
    window.DDActiveWebSockets.total = 0;
  }
  
  // Decrement counters, ensuring they don't go below 0
  window.DDActiveWebSockets[type] = Math.max(0, window.DDActiveWebSockets[type] - 1);
  window.DDActiveWebSockets.total = Math.max(0, window.DDActiveWebSockets.total - 1);
  
  console.log(`[WSMonitor] ${type} connection closed. Active: ${window.DDActiveWebSockets[type]}, Total: ${window.DDActiveWebSockets.total}`);
  
  dispatchWebSocketEvent('connection-tracking', {
    socketType: type,
    activeCount: window.DDActiveWebSockets[type],
    totalCount: window.DDActiveWebSockets.total
  });
};

// Get count of active WebSocket connections by type
export const getWebSocketCount = (type?: string): number => {
  if (!window.DDActiveWebSockets) {
    return 0;
  }
  
  if (type) {
    return window.DDActiveWebSockets[type] || 0;
  }
  
  return window.DDActiveWebSockets.total || 0;
};

// Get connection attempt count by type
export const getConnectionAttemptCount = (type?: string): number => {
  if (!window.DDConnectionAttempts) {
    return 0;
  }
  
  if (type) {
    return window.DDConnectionAttempts[type] || 0;
  }
  
  return window.DDConnectionAttempts.total || 0;
};

// Get all active WebSocket connection counts
export const getAllWebSocketCounts = (): Record<string, number> => {
  if (!window.DDActiveWebSockets) {
    return { total: 0 };
  }
  
  return { ...window.DDActiveWebSockets };
};

// Get all connection attempts
export const getAllConnectionAttempts = (): Record<string, number> => {
  if (!window.DDConnectionAttempts) {
    return { total: 0 };
  }
  
  return { ...window.DDConnectionAttempts };
};

// Dispatch WebSocket event for monitoring
export const dispatchWebSocketEvent = (type: string, data?: any): void => {
  // Ensure data includes socketType if provided
  const socketType = data?.socketType || null;
  
  window.dispatchEvent(
    new CustomEvent('ws-debug', {
      detail: {
        type,
        socketType,
        timestamp: new Date().toISOString(),
        data
      }
    })
  );
};

// Check if we should throttle an error toast for a given socketType
export const shouldThrottleErrorToast = (socketType: string, errorCode?: number): boolean => {
  initializeWebSocketTracking();
  
  const now = Date.now();
  const lastError = window.DDLastWebSocketErrors[socketType];
  
  // If this is a 1006 error (abnormal closure), use a longer throttle time
  // since these tend to happen in rapid succession
  const throttleTime = errorCode === 1006 ? 60000 : 30000; // 60 seconds for 1006, 30 seconds for others
  
  // If we've seen this error type recently, throttle it
  if (lastError && (now - lastError.timestamp) < throttleTime) {
    return true;
  }
  
  // Update the last error timestamp for this socket type
  window.DDLastWebSocketErrors[socketType] = {
    timestamp: now,
    code: errorCode
  };
  
  return false;
};

// Log WebSocket event with consistent formatting
export const logWebSocketEvent = (type: string, socketType: string, message: string, data?: any): void => {
  console.log(`[WebSocket:${socketType}] [${type}] ${message}`, data);
  
  dispatchWebSocketEvent(type, {
    socketType,
    message,
    ...data
  });
};

// Reset all WebSocket tracking (useful for testing or recovering from errors)
export const resetWebSocketTracking = (): void => {
  // Reset active connections
  if (!window.DDActiveWebSockets) {
    window.DDActiveWebSockets = { total: 0 };
  } else {
    const previousCounts = { ...window.DDActiveWebSockets };
    
    // Reset all counters
    Object.keys(window.DDActiveWebSockets).forEach(key => {
      window.DDActiveWebSockets[key] = 0;
    });
    
    console.log('[WSMonitor] Active WebSocket connections reset. Previous counts:', previousCounts);
  }
  
  // Reset connection attempts
  if (!window.DDConnectionAttempts) {
    window.DDConnectionAttempts = { total: 0 };
  } else {
    const previousAttempts = { ...window.DDConnectionAttempts };
    
    // Reset all counters
    Object.keys(window.DDConnectionAttempts).forEach(key => {
      window.DDConnectionAttempts[key] = 0;
    });
    
    console.log('[WSMonitor] Connection attempts reset. Previous counts:', previousAttempts);
  }
  
  // Reset error tracking
  if (window.DDLastWebSocketErrors) {
    window.DDLastWebSocketErrors = {};
  }
  
  console.log('[WSMonitor] WebSocket tracking completely reset');
  
  dispatchWebSocketEvent('reset', {
    message: 'WebSocket tracking completely reset',
    timestamp: new Date().toISOString()
  });
};

// Initialize tracking when this module is imported
initializeWebSocketTracking();