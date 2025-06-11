// src/hooks/websocket/useUnifiedWebSocket.ts

/**
 * useUnifiedWebSocket Hook
 * 
 * Provides access to the unified WebSocket system through a React hook
 * 
 * THIS COMMENT IS SUSPECTED TO BE OUTDATED:
 * This hook depends on the WebSocketManager component being mounted in the application
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { ConnectionState, DDExtendedMessageType } from './types';

// This file implements a hook (useUnifiedWebSocket) that allows components to interact
// with a single, shared WebSocket connection. It uses a module-level singleton (`instance`)
// to hold the connection details and a pub/sub model (`listeners`) to notify
// components when the connection state changes, forcing them to re-render.

// Interface for the WebSocket instance that the hook can access
interface WebSocketInstance {
  registerListener: (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => () => void;
  sendMessage: (message: any) => boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
}

// Singleton instance set by the WebSocketManager or WebSocketContext
let instance: WebSocketInstance | null = null;

// Queue for messages sent before the connection is ready
const pendingMessages: any[] = [];
let isProcessingQueue = false;

// --- Pub/Sub for instance updates ---
const listeners = new Set<() => void>();
const subscribeToUpdates = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};
// ---

const processMessageQueue = () => {
  if (isProcessingQueue || !instance || instance.connectionState !== ConnectionState.AUTHENTICATED) {
    return;
  }
  isProcessingQueue = true;
  console.log(`[useUnifiedWebSocket] Processing ${pendingMessages.length} pending messages...`);
  while (pendingMessages.length > 0) {
    const message = pendingMessages.shift();
    if (message) {
      instance.sendMessage(message);
    }
  }
  isProcessingQueue = false;
  console.log('[useUnifiedWebSocket] Message queue processed.');
};

// Create a default instance to use before the real one is set up.
// This prevents crashes in components that use the hook during initial render.
if (!instance) {
  instance = {
    registerListener: (id: string) => {
      console.log(`[useUnifiedWebSocket] Component '${id}' registered but WebSocket not yet fully initialized`);
      return () => { };
    },
    sendMessage: (message: any) => {
      console.log("[useUnifiedWebSocket] Connection not ready. Queuing message:", message);
      pendingMessages.push(message);
      return true;
    },
    connectionState: ConnectionState.CONNECTING,
    connectionError: null
  };
}

/**
 * Called by the WebSocket context provider to update the singleton instance
 * with the real connection details and state.
 */
export const setupWebSocketInstance = (
  registerFn: (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => () => void,
  sendFn: (message: any) => boolean,
  state: ConnectionState,
  error: string | null
) => {
  const wasConnected = instance?.connectionState === ConnectionState.AUTHENTICATED;

  instance = {
    registerListener: registerFn,
    sendMessage: sendFn,
    connectionState: state,
    connectionError: error
  };

  notifyListeners(); // Notify all subscribed components of the state change.

  if (state === ConnectionState.AUTHENTICATED && !wasConnected) {
    processMessageQueue();
  }
};

// Helper interface for subscription messages
/**
 * @param type - Message type
 * @param topics - Topics to subscribe to
 * @param authToken - Authentication token
 */
interface SubscriptionMessage {
  type: DDExtendedMessageType;
  topics: string[];
  authToken?: string;
}

/**
 * Hook for components to use the WebSocket with topic filtering
 * 
 * @param id Unique identifier for this listener
 * @param types Array of message types to listen for
 * @param onMessage Callback function when a message is received
 * @param topics Optional array of topics to filter messages by
 * @returns Object with methods to interact with the WebSocket
 */
export function useUnifiedWebSocket<T = any>(
  id: string,
  types: DDExtendedMessageType[] = [DDExtendedMessageType.DATA],
  onMessage: (message: T) => void,
  topics?: string[]
) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    // Subscribe to instance updates on mount and unsubscribe on unmount.
    const unsubscribe = subscribeToUpdates(forceUpdate);
    return unsubscribe;
  }, []);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const stableMessageHandler = useCallback((message: any) => {
    if (topics && message.topic && !topics.includes(message.topic)) {
      return;
    }
    onMessageRef.current(message as T);
  }, [topics]);

  useEffect(() => {
    if (instance) {
      return instance.registerListener(id, types, stableMessageHandler);
    }
    // This return is for the case where instance is null, satisfying TypeScript.
    return () => { };
  }, [id, types, stableMessageHandler]);

  const sendMessage = useCallback((message: any) => {
    if (!instance || (instance.connectionState !== ConnectionState.AUTHENTICATED && instance.connectionState !== ConnectionState.CONNECTED)) {
      console.log(`[useUnifiedWebSocket] Connection not ready (state: ${instance?.connectionState}). Queuing message:`, message);
      pendingMessages.push(message);
      return true;
    }
    return instance.sendMessage(message);
  }, []);

  const subscribe = useCallback((topicsToSubscribe: string[], _componentId?: string) => {
    if (topicsToSubscribe.length === 0) return false;
    const message: SubscriptionMessage = {
      type: DDExtendedMessageType.SUBSCRIBE,
      topics: topicsToSubscribe
    };
    return sendMessage(message);
  }, [sendMessage]);

  const unsubscribe = useCallback((topicsToUnsubscribe: string[], _componentId?: string) => {
    if (topicsToUnsubscribe.length === 0) return false;
    return sendMessage({
      type: DDExtendedMessageType.UNSUBSCRIBE,
      topics: topicsToUnsubscribe
    });
  }, [sendMessage]);

  const request = useCallback((topic: string, action: string, params: any = {}) => {
    const requestMessage: any = {
      type: DDExtendedMessageType.REQUEST,
      topic,
      action,
      ...params
    };
    return sendMessage(requestMessage);
  }, [sendMessage]);

  const connectionState = instance?.connectionState ?? ConnectionState.CONNECTING;
  const connectionError = instance?.connectionError ?? null;

  return useMemo(() => ({
    sendMessage,
    isConnected: connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.AUTHENTICATED,
    isAuthenticated: connectionState === ConnectionState.AUTHENTICATED,
    connectionState,
    error: connectionError,
    subscribe: (topics: string[], componentId?: string) => subscribe(topics, componentId),
    unsubscribe: (topics: string[], componentId?: string) => unsubscribe(topics, componentId),
    request
  }), [connectionState, connectionError, sendMessage, subscribe, unsubscribe, request]);
}

export default useUnifiedWebSocket;