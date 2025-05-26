/**
 * useTokenSchedulerStatus Hook
 * 
 * V69 Standardized WebSocket Hook for Token Scheduler Status
 * This hook provides real-time updates for the token refresh scheduler system
 * 
 * @description Monitors token sync health, batch processing, and failure escalation
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-26
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';

// Token Scheduler Event Types from Backend
export interface TokenSchedulerBatchEvent {
  type: 'batch_started' | 'batch_completed';
  batchNumber?: number;
  totalBatches?: number;
  tokenCount: number;
  tokens?: Array<{ id: string; address: string; symbol: string }>;
  timestamp: string;
}

export interface TokenSchedulerFailureEvent {
  type: 'token_failed';
  tokenId: string;
  address: string;
  symbol: string;
  failures: number;
  queuedForInactive: boolean;
  timestamp: string;
}

export interface TokenSchedulerInactiveEvent {
  type: 'tokens_marked_inactive';
  tokenCount: number;
  dbUpdatedCount: number;
  tokens: Array<{ id: string; address: string; symbol: string; reason?: string }>;
  timestamp: string;
}

export interface TokenSchedulerQueueEvent {
  type: 'queue_update';
  processing: boolean;
  batchNumber: number;
  totalBatches: number;
  tokensRemaining: number;
  timestamp: string;
}

export type TokenSchedulerEvent = 
  | TokenSchedulerBatchEvent 
  | TokenSchedulerFailureEvent 
  | TokenSchedulerInactiveEvent 
  | TokenSchedulerQueueEvent;

// Aggregated Token Status
export interface TokenStatus {
  id: string;
  address: string;
  symbol: string;
  failures: number;
  status: 'healthy' | 'warning' | 'critical' | 'queued_inactive' | 'inactive';
  lastUpdated: Date;
  queuedForInactive: boolean;
}

// Persistence Issue Tracking
export interface PersistenceIssue {
  expectedCount: number;
  actualCount: number;
  timestamp: Date;
}

// Hook State Interface
export interface TokenSchedulerStatus {
  // Connection state
  connected: boolean;
  loading: boolean;
  error: string | null;
  
  // Real-time events
  events: TokenSchedulerEvent[];
  latestEvent: TokenSchedulerEvent | null;
  
  // Aggregated state
  tokens: TokenStatus[];
  totalTokens: number;
  healthyTokens: number;
  warningTokens: number;
  criticalTokens: number;
  inactiveTokens: number;
  
  // Batch processing state
  queueStatus: {
    processing: boolean;
    batchNumber: number;
    totalBatches: number;
    tokensRemaining: number;
  };
  
  // Error tracking
  persistenceIssues: PersistenceIssue[];
  recentFailures: TokenSchedulerFailureEvent[];
  
  // Actions
  refreshStatus: () => void;
  clearEvents: () => void;
}

const TOPIC = 'token_scheduler_status';
const MAX_EVENTS_HISTORY = 100;
const MAX_PERSISTENCE_ISSUES = 10;
const MAX_RECENT_FAILURES = 20;

export const useTokenSchedulerStatus = (): TokenSchedulerStatus => {
  const { subscribe, isConnected, sendMessage, registerListener } = useWebSocket();
  
  // State management
  const [events, setEvents] = useState<TokenSchedulerEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<TokenSchedulerEvent | null>(null);
  const [tokens, setTokens] = useState<TokenStatus[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    processing: false,
    batchNumber: 0,
    totalBatches: 0,
    tokensRemaining: 0
  });
  const [persistenceIssues, setPersistenceIssues] = useState<PersistenceIssue[]>([]);
  const [recentFailures, setRecentFailures] = useState<TokenSchedulerFailureEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for stable references
  const latestEventRef = useRef<TokenSchedulerEvent | null>(null);
  const tokensMapRef = useRef<Map<string, TokenStatus>>(new Map());

  // Helper function to determine token status based on failures
  const getTokenStatus = (failures: number, queuedForInactive: boolean): TokenStatus['status'] => {
    if (queuedForInactive) return 'queued_inactive';
    if (failures === 0) return 'healthy';
    if (failures <= 2) return 'warning';
    if (failures <= 4) return 'critical';
    return 'inactive';
  };

  // Process incoming scheduler events
  const processSchedulerEvent = useCallback((event: TokenSchedulerEvent) => {
    const now = new Date();
    
    // Update latest event
    setLatestEvent(event);
    latestEventRef.current = event;

    // Add to events history
    setEvents(prev => [event, ...prev.slice(0, MAX_EVENTS_HISTORY - 1)]);

    // Process specific event types
    switch (event.type) {
      case 'batch_started':
      case 'batch_completed':
        // Update queue status
        setQueueStatus(prev => ({
          ...prev,
          processing: event.type === 'batch_started',
          batchNumber: event.batchNumber || prev.batchNumber,
          totalBatches: event.totalBatches || prev.totalBatches,
          tokensRemaining: event.type === 'batch_completed' ? 0 : prev.tokensRemaining
        }));

        // If batch started with token list, update token statuses
        if (event.type === 'batch_started' && event.tokens) {
          event.tokens.forEach(token => {
            const existingToken = tokensMapRef.current.get(token.id);
            const updatedToken: TokenStatus = {
              id: token.id,
              address: token.address,
              symbol: token.symbol,
              failures: existingToken?.failures || 0,
              status: existingToken?.status || 'healthy',
              lastUpdated: now,
              queuedForInactive: existingToken?.queuedForInactive || false
            };
            tokensMapRef.current.set(token.id, updatedToken);
          });
          setTokens(Array.from(tokensMapRef.current.values()));
        }
        break;

      case 'token_failed':
        // Update individual token failure count
        const failedToken = tokensMapRef.current.get(event.tokenId) || {
          id: event.tokenId,
          address: event.address,
          symbol: event.symbol,
          failures: 0,
          status: 'healthy' as const,
          lastUpdated: now,
          queuedForInactive: false
        };

        const updatedFailedToken: TokenStatus = {
          ...failedToken,
          failures: event.failures,
          status: getTokenStatus(event.failures, event.queuedForInactive),
          lastUpdated: now,
          queuedForInactive: event.queuedForInactive
        };

        tokensMapRef.current.set(event.tokenId, updatedFailedToken);
        setTokens(Array.from(tokensMapRef.current.values()));

        // Add to recent failures
        setRecentFailures(prev => [
          event as TokenSchedulerFailureEvent,
          ...prev.slice(0, MAX_RECENT_FAILURES - 1)
        ]);
        break;

      case 'tokens_marked_inactive':
        // Mark tokens as inactive and check for persistence issues
        event.tokens.forEach(token => {
          const existingToken = tokensMapRef.current.get(token.id);
          const inactiveToken: TokenStatus = {
            id: token.id,
            address: token.address,
            symbol: token.symbol,
            failures: existingToken?.failures || 5,
            status: 'inactive',
            lastUpdated: now,
            queuedForInactive: false
          };
          tokensMapRef.current.set(token.id, inactiveToken);
        });
        setTokens(Array.from(tokensMapRef.current.values()));

        // Check for database persistence issues
        if (event.dbUpdatedCount !== event.tokenCount) {
          const persistenceIssue: PersistenceIssue = {
            expectedCount: event.tokenCount,
            actualCount: event.dbUpdatedCount,
            timestamp: now
          };
          setPersistenceIssues(prev => [persistenceIssue, ...prev.slice(0, MAX_PERSISTENCE_ISSUES - 1)]);
        }
        break;

      case 'queue_update':
        setQueueStatus({
          processing: event.processing,
          batchNumber: event.batchNumber,
          totalBatches: event.totalBatches,
          tokensRemaining: event.tokensRemaining
        });
        break;
    }

    // Dispatch for monitoring
    dispatchWebSocketEvent('token_scheduler_event', { event });
  }, []);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      if (message.type === 'DATA' && message.topic === TOPIC) {
        if (message.data && typeof message.data === 'object') {
          processSchedulerEvent(message.data);
          setError(null);
        }
      } else if (message.type === 'RESPONSE' && message.topic === TOPIC) {
        // Handle response to status request
        if (message.data) {
          setLoading(false);
          setError(null);
        }
      } else if (message.type === 'ERROR' && message.topic === TOPIC) {
        setError(message.data?.message || 'Token scheduler status error');
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTokenSchedulerStatus] Error processing message:', err);
      setError('Failed to process scheduler status update');
    }
  }, [processSchedulerEvent]);

  // Request current status
  const refreshStatus = useCallback(() => {
    if (isConnected) {
      setLoading(true);
      setError(null);
      sendMessage({
        type: 'REQUEST',
        topic: TOPIC,
        action: 'get_current_status',
        data: {}
      });
    }
  }, [isConnected, sendMessage]);

  // Clear events history
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
    setPersistenceIssues([]);
    setRecentFailures([]);
    latestEventRef.current = null;
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTokens = tokens.length;
    const healthyTokens = tokens.filter(t => t.status === 'healthy').length;
    const warningTokens = tokens.filter(t => t.status === 'warning').length;
    const criticalTokens = tokens.filter(t => t.status === 'critical').length;
    const inactiveTokens = tokens.filter(t => t.status === 'inactive').length;

    return { totalTokens, healthyTokens, warningTokens, criticalTokens, inactiveTokens };
  }, [tokens]);

  // Register message listener
  useEffect(() => {
    const unregister = registerListener(
      'token-scheduler-status-listener',
      ['DATA', 'RESPONSE', 'ERROR'] as any[],
      handleMessage,
      [TOPIC]
    );
    return unregister;
  }, [handleMessage, registerListener]);

  // Subscribe to topic on mount
  useEffect(() => {
    if (isConnected) {
      console.log('[useTokenSchedulerStatus] Subscribing to', TOPIC);
      subscribe([TOPIC]);
      
      // Request initial status
      setTimeout(() => refreshStatus(), 100);
    }
  }, [isConnected, subscribe, refreshStatus]);

  // Set loading false after initial connection
  useEffect(() => {
    if (isConnected && loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, loading]);

  return {
    // Connection state
    connected: isConnected,
    loading,
    error,
    
    // Real-time events
    events,
    latestEvent,
    
    // Aggregated state
    tokens,
    ...stats,
    
    // Batch processing state
    queueStatus,
    
    // Error tracking
    persistenceIssues,
    recentFailures,
    
    // Actions
    refreshStatus,
    clearEvents
  };
};

export default useTokenSchedulerStatus;