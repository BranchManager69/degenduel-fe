// src/services/clientLogService.ts

/**
 * Client Log Service
 * 
 * @description This service provides the API to forward client logs to the server.
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-04-01
 * @updated 2025-05-07
 */

import { API_URL } from "../config/config";
import { LogLevel } from "../utils/clientLogForwarder";

// Log entry structure
export interface LogEntry {
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

// Client log service
export const clientLogService = {
  /**
   * Send logs to the server via API
   * @param logs Array of log entries to send
   * @returns Promise that resolves when logs are sent
   */
  sendLogs: async (logs: LogEntry[]): Promise<boolean> => {
    try {
      // Send logs to the server client logs endpoint
      const response = await fetch(`${API_URL}/logs/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending logs:', error);
      return false;
    }
  },
  
  /**
   * Send a critical error to the server with high priority
   * @param error Error object or error message
   * @param context Additional context information
   * @returns Promise that resolves when the error is sent
   */
  reportCriticalError: async (
    error: Error | string,
    context: Record<string, any> = {}
  ): Promise<boolean> => {
    // Get error message and stack trace
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Get user from local storage
    try {
      const user = window.localStorage.getItem('degenduel-storage')
        ? JSON.parse(window.localStorage.getItem('degenduel-storage') || '{}').state?.user
        : null;
      
      // Create log entry
      const logEntry: LogEntry = {
        level: LogLevel.ERROR,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        context,
        userId: user?.wallet_address,
        userWallet: user?.wallet_address,
        sessionId: sessionStorage.getItem('logSessionId') || 'unknown',
        url: window.location.href,
        userAgent: navigator.userAgent,
        stackTrace,
        tags: ['critical', 'high-priority']
      };
      
      // Send log entry to the server
      return await clientLogService.sendLogs([logEntry]);
    } catch (innerError) {
      console.error('Failed to report critical error:', innerError);
      return false;
    }
  }
};

export default clientLogService;