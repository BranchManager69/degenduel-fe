/**
 * Unified WebSocket Topic Hook
 * 
 * ONLY USED BY LIQ SIM RIGHT NOW? WHY? MUST BE WRONG??
 * 
 * This hook provides a way to interact with a specific topic on the unified WebSocket.
 * It abstracts the details of the WebSocket connection and provides a simple interface
 * for subscribing to topics and making requests.
 * 
 * Based on official WebSocket protocol documented in WS.TXT.
 */

import { useCallback, useEffect } from 'react';
import { MessageType, TopicType, useUnifiedWebSocket } from './index';

interface WebSocketTopicOptions {
  autoSubscribe?: boolean;  // Whether to automatically subscribe to the topic
  requestOnConnect?: {     // Optional request to make when connected
    action: string;
    params?: Record<string, any>;
  };
}

/**
 * Hook for interacting with a specific WebSocket topic
 * 
 * @param topicName The topic to subscribe to (from TopicType enum)
 * @param messageTypes The message types to listen for (default: [DATA])
 * @param onMessage Callback for handling incoming messages
 * @param options Additional options for topic behavior
 */
export function useWebSocketTopic<T = any>(
  topicName: TopicType,
  messageTypes: MessageType[] = [MessageType.DATA],
  onMessage: (data: T) => void,
  options: WebSocketTopicOptions = { autoSubscribe: true }
) {
  // Generate a unique ID for this subscription
  const subscriptionId = `${topicName}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Use the unified WebSocket connection
  const ws = useUnifiedWebSocket(
    subscriptionId,
    messageTypes,
    onMessage,
    [topicName] // Only listen to messages for this topic
  );
  
  // Subscribe to the topic when connected (if autoSubscribe is true)
  useEffect(() => {
    if (ws.connectionState === 'connected' && options.autoSubscribe) {
      // Subscribe to the topic
      ws.subscribe([topicName]);
      
      // Make initial request if specified
      if (options.requestOnConnect) {
        const { action, params = {} } = options.requestOnConnect;
        ws.request(topicName, action, params);
      }
    }
  }, [ws.connectionState, topicName, options.autoSubscribe]);
  
  // Helper for making requests on this topic
  const request = useCallback((action: string, params: Record<string, any> = {}) => {
    if (!ws.isConnected) {
      console.warn(`Cannot make request: WebSocket not connected (Topic: ${topicName})`);
      return false;
    }
    
    return ws.request(topicName, action, params);
  }, [ws.isConnected, topicName, ws.request]);
  
  // Subscribe to the topic (manual control)
  const subscribe = useCallback(() => {
    if (!ws.isConnected) {
      console.warn(`Cannot subscribe: WebSocket not connected (Topic: ${topicName})`);
      return false;
    }
    
    return ws.subscribe([topicName]);
  }, [ws.isConnected, topicName, ws.subscribe]);
  
  // Unsubscribe from the topic
  const unsubscribe = useCallback(() => {
    if (!ws.isConnected) {
      console.warn(`Cannot unsubscribe: WebSocket not connected (Topic: ${topicName})`);
      return false;
    }
    
    return ws.unsubscribe([topicName]);
  }, [ws.isConnected, topicName, ws.unsubscribe]);
  
  return {
    // Connection status
    isConnected: ws.isConnected,
    isAuthenticated: ws.isAuthenticated,
    connectionState: ws.connectionState,
    error: ws.error,
    
    // Topic interaction
    subscribe,
    unsubscribe,
    request,
    
    // Raw message sending (use sparingly, prefer request)
    sendMessage: ws.sendMessage,
    
    // Internal (for debugging)
    _topicName: topicName,
    _subscriptionId: subscriptionId
  };
}

export default useWebSocketTopic;