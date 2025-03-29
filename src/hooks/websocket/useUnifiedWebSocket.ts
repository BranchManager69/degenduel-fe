/**
 * useUnifiedWebSocket Hook
 * 
 * Provides access to the unified WebSocket system through a React hook
 * This hook depends on the WebSocketManager component being mounted in the application
 */

import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { ConnectionState, MessageType } from './types';

// Interface for the WebSocket instance that the hook can access
// This matches what the WebSocketManager sets up
interface WebSocketInstance {
  registerListener: (id: string, types: string[], callback: (message: any) => void) => () => void;
  sendMessage: (message: any) => boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
}

// Singleton instance that gets set by the WebSocketManager component
let instance: WebSocketInstance | null = null;

// Function to set up the singleton instance (called by WebSocketManager)
export const setupWebSocketInstance = (
  registerFn: (id: string, types: string[], callback: (message: any) => void) => () => void,
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
interface SubscriptionMessage {
  type: MessageType.SUBSCRIBE | MessageType.UNSUBSCRIBE;
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
  types: string[] = [MessageType.DATA], 
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
  
  // Safety check
  if (!instance) {
    return {
      sendMessage: () => false,
      isConnected: false,
      isAuthenticated: false,
      connectionState: ConnectionState.DISCONNECTED,
      error: "WebSocketManager not initialized",
      // Subscription helpers
      subscribe: () => false,
      unsubscribe: () => false,
      request: () => false
    };
  }
  
  // Helper for subscribing to topics
  const subscribe = (topicsToSubscribe: string[]) => {
    if (!instance || topicsToSubscribe.length === 0) return false;
    
    const message: SubscriptionMessage = {
      type: MessageType.SUBSCRIBE,
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
      type: MessageType.UNSUBSCRIBE,
      topics: topicsToUnsubscribe
    });
  };
  
  // Helper for making requests
  const request = (topic: string, action: string, params: any = {}) => {
    if (!instance) return false;
    
    const requestMessage: any = {
      type: MessageType.REQUEST,
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