/**
 * useUnifiedWebSocket Hook
 * 
 * Provides access to the unified WebSocket system through a React hook
 * 
 * THIS COMMENT IS SUSPECTED TO BE OUTDATED:
 * This hook depends on the WebSocketManager component being mounted in the application
 */

import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { ConnectionState, DDExtendedMessageType } from './types';

// Interface for the WebSocket instance that the hook can access
interface WebSocketInstance {
  registerListener: (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => () => void;
  sendMessage: (message: any) => boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
}

// Singleton instance set by the WebSocketManager or WebSocketContext
let instance: WebSocketInstance | null = null;

// Track which component IDs have already logged warnings to reduce console spam
const loggedInstanceWarnings = new Set<string>();

// Create a default instance to prevent "WebSocketManager not initialized" errors
// This ensures hooks will work even before the main WebSocket connection is ready
if (!instance) {
  instance = {
    registerListener: (id: string, _types: DDExtendedMessageType[], _callback: (message: any) => void) => {
      console.log(`WebSocket: Component '${id}' registered but WebSocket not yet fully initialized`);
      return () => {}; // No-op cleanup
    },
    sendMessage: () => {
      console.log("WebSocket: Attempted to send message before initialization");
      return false;
    },
    connectionState: ConnectionState.CONNECTING,
    connectionError: null
  };
}

// Function to set up the singleton instance
/**
 * @param registerFn - Function to register a listener
 * @param sendFn - Function to send a message
 * @param state - Connection state
 * @param error - Connection error
 */
export const setupWebSocketInstance = (
  registerFn: (id: string, types: DDExtendedMessageType[], callback: (message: any) => void) => () => void,
  sendFn: (message: any) => boolean,
  state: ConnectionState,
  error: string | null
) => {
  instance = {
    registerListener: registerFn,
    sendMessage: sendFn,
    connectionState: state,
    connectionError: error
  };
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
  // Effect for registration
  useEffect(() => {
    if (!instance) {
      console.error("WebSocketManager: Cannot register listener - WebSocketManager not initialized");
      return () => {};
    }
    
    // Use the registerListener with topics filtering applied in the callback
    const unregister = instance.registerListener(id, types, message => {
      // If topics are provided, only forward messages with matching topics
      if (topics && message.topic && !topics.includes(message.topic)) {
        return; // Skip messages with non-matching topics
      }
      // Call onMessage with the data
      onMessage(message as T);
    });
    
    // Clean up on unmount
    return unregister;
  }, [id, types, topics, onMessage]);
  
  // We should always have an instance now with our default initialization
  // But just in case, add an extra safety check with much friendlier messaging
  if (!instance) {
    // Only log once per component ID
    if (!loggedInstanceWarnings.has(id)) {
      console.log(`WebSocket: Component '${id}' waiting for WebSocket to fully initialize`);
      loggedInstanceWarnings.add(id);
    }
    
    // Return a benign fallback that won't crash components
    return {
      sendMessage: () => false,
      isConnected: false,
      isAuthenticated: false,
      connectionState: ConnectionState.CONNECTING,
      error: "Connecting...",
      subscribe: () => false,
      unsubscribe: () => false,
      request: () => false
    };
  }
  
  // Helper for subscribing to topics
  const subscribe = (topicsToSubscribe: string[]) => {
    if (!instance || topicsToSubscribe.length === 0) return false;
    
    const message: SubscriptionMessage = {
      type: DDExtendedMessageType.SUBSCRIBE,
      topics: topicsToSubscribe
    };
    
    // Add auth token if available
    const user = useStore.getState().user;
    if (user?.wsToken || user?.jwt) {
      message.authToken = user.wsToken || user.jwt;
    }
    
    return instance.sendMessage(message);
  };
  
  // Helper for unsubscribing from topics
  const unsubscribe = (topicsToUnsubscribe: string[]) => {
    if (!instance || topicsToUnsubscribe.length === 0) return false;
    
    return instance.sendMessage({
      type: DDExtendedMessageType.UNSUBSCRIBE,
      topics: topicsToUnsubscribe
    });
  };
  
  // Helper for making requests
  const request = (topic: string, action: string, params: any = {}) => {
    if (!instance) return false;
    
    const requestMessage: any = {
      type: DDExtendedMessageType.REQUEST,
      topic,
      action,
      ...params
    };
    
    return instance.sendMessage(requestMessage);
  };
  
  // Return functions for interacting with the WebSocket
  return {
    sendMessage: (message: any) => instance!.sendMessage(message),
    isConnected: instance.connectionState === ConnectionState.CONNECTED || 
                instance.connectionState === ConnectionState.AUTHENTICATED,
    isAuthenticated: instance.connectionState === ConnectionState.AUTHENTICATED,
    connectionState: instance.connectionState,
    error: instance.connectionError,
    // Add higher-level methods
    subscribe,
    unsubscribe,
    request
  };
}

export default useUnifiedWebSocket;