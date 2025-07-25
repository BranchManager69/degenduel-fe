/**
 * useGeneralChat Hook
 * 
 * WebSocket Hook for General Chat
 * This hook provides real-time updates for the global general chat
 * Based on the backend's general chat implementation
 * 
 * @author Claude + Branch Manager
 * @created 2025-07-24
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDExtendedMessageType, WebSocketMessage } from '../types';
import { TopicType } from '../index';

// General chat message interface
export interface GeneralChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  is_system?: boolean;
  is_admin?: boolean;
  user_role?: 'user' | 'admin' | 'moderator' | 'system' | 'superadmin';
  profile_picture?: string;
}

// Default state - start with isLoading false since we'll get history on subscription
const DEFAULT_STATE = {
  messages: [] as GeneralChatMessage[],
  isLoading: false,
  lastMessageTime: null as Date | null
};

/**
 * Hook for accessing and managing general chat with real-time updates
 * Uses the unified WebSocket system
 */
export function useGeneralChat() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  
  const ws = useWebSocket();
  const subscribedTopics = useRef<Set<string>>(new Set());
  const componentId = useRef(`general-chat-${Date.now()}`);
  
  // Debug: Add message when hook is created
  useEffect(() => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: `debug-hook-init-${Date.now()}`,
        user_id: 'system',
        username: 'DEBUG',
        message: `[Hook] useGeneralChat initialized`,
        timestamp: new Date().toISOString(),
        is_system: true
      }]
    }));
  }, []); // Empty dependency array = runs once on mount

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      // Debug message when we receive anything
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: `debug-received-${Date.now()}`,
          user_id: 'system',
          username: 'DEBUG',
          message: `[Received] Type: ${message.type}, Topic: ${message.topic}, Action: ${message.action || 'none'}`,
          timestamp: new Date().toISOString(),
          is_system: true
        }]
      }));
      
      // Process messages for the general-chat topic
      if (message.topic === TopicType.GENERAL_CHAT) {
        
        // Handle message history on subscription
        if (message.type === DDExtendedMessageType.DATA && message.action === 'history' && Array.isArray(message.data)) {
          const historyMessages = message.data || [];
          
          setState(prev => ({
            ...prev,
            messages: [
              ...historyMessages,
              {
                id: `debug-history-${Date.now()}`,
                user_id: 'system',
                username: 'DEBUG',
                message: `[History] Loaded ${historyMessages.length} messages`,
                timestamp: new Date().toISOString(),
                is_system: true
              }
            ],
            isLoading: false,
            lastMessageTime: new Date()
          }));
          
          // Mark loading as complete
          
          dispatchWebSocketEvent('general_chat_loaded', {
            socketType: 'general-chat',
            message: `Loaded ${historyMessages.length} chat messages`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle new real-time message
        else if (message.type === DDExtendedMessageType.MESSAGE && message.data) {
          const newMessage = message.data as GeneralChatMessage;
          
          // Add debug message to see what we're receiving
          setState(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: `debug-msg-${Date.now()}`,
                user_id: 'system',
                username: 'DEBUG',
                message: `[Received] New message from ${newMessage.username}: "${newMessage.message}"`,
                timestamp: new Date().toISOString(),
                is_system: true
              },
              newMessage
            ],
            isLoading: false,
            lastMessageTime: new Date()
          }));
          
          dispatchWebSocketEvent('general_chat_new_message', {
            socketType: 'general-chat',
            message: `New chat message from ${newMessage.username}`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle errors
        else if (message.type === DDExtendedMessageType.ERROR) {
          console.error('[GeneralChat WebSocket] Error:', message.data);
          setError(message.data?.message || 'Unknown error');
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: `debug-error-${Date.now()}`,
              user_id: 'system',
              username: 'DEBUG',
              message: `[Error] ${message.data?.message || 'Unknown error'}`,
              timestamp: new Date().toISOString(),
              is_system: true
            }]
          }));
        }
        // Add debug for any other message types
        else {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: `debug-unknown-${Date.now()}`,
              user_id: 'system',
              username: 'DEBUG',
              message: `[Unknown] Got message type: ${message.type}, action: ${message.action || 'none'}`,
              timestamp: new Date().toISOString(),
              is_system: true
            }]
          }));
        }
      }
    } catch (err) {
      console.error('[GeneralChat WebSocket] Error processing message:', err);
      setError(err instanceof Error ? err.message : String(err));
      
      dispatchWebSocketEvent('error', {
        socketType: 'general-chat',
        message: 'Error processing general chat data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Note: ws is initialized above with useWebSocket()

  // Update connection status and debug
  useEffect(() => {
    setError(ws.connectionError);
    
    // Debug connection state changes
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: `debug-conn-state-${Date.now()}`,
        user_id: 'system',
        username: 'DEBUG',
        message: `[WebSocket] Connected: ${ws.isConnected}, Error: ${ws.connectionError || 'none'}`,
        timestamp: new Date().toISOString(),
        is_system: true
      }]
    }));
  }, [ws.isConnected, ws.connectionError]);

  // WebSocket subscriptions - following useBatchTokens pattern
  useEffect(() => {
    if (!ws.isConnected) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: `debug-disconn-${Date.now()}`,
          user_id: 'system',
          username: 'DEBUG',
          message: `[Connection] WebSocket not connected`,
          timestamp: new Date().toISOString(),
          is_system: true
        }]
      }));
      return;
    }

    // Subscribe to general chat topic
    const topic = TopicType.GENERAL_CHAT;
    
    // Only subscribe if not already subscribed
    if (!subscribedTopics.current.has(topic)) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: `debug-subscribe-${Date.now()}`,
          user_id: 'system',
          username: 'DEBUG',
          message: `[Subscribe] Subscribing to ${topic}`,
          timestamp: new Date().toISOString(),
          is_system: true
        }]
      }));
      
      ws.subscribe([topic], componentId.current);
      subscribedTopics.current.add(topic);
    }

    // Register listener for messages
    const unregister = ws.registerListener(
      componentId.current,
      [DDExtendedMessageType.DATA, DDExtendedMessageType.MESSAGE, DDExtendedMessageType.ERROR],
      handleMessage
    );

    return () => {
      unregister();
      
      // Unsubscribe on cleanup
      if (subscribedTopics.current.size > 0 && ws.isConnected) {
        const topicsToUnsubscribe = Array.from(subscribedTopics.current);
        ws.unsubscribe(topicsToUnsubscribe, componentId.current);
        subscribedTopics.current.clear();
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: `debug-unsubscribe-${Date.now()}`,
            user_id: 'system',
            username: 'DEBUG',
            message: `[Unsubscribe] Cleaned up subscriptions`,
            timestamp: new Date().toISOString(),
            is_system: true
          }]
        }));
      }
    };
  }, [ws, ws.isConnected, handleMessage]);

  // Send a chat message
  const sendMessage = useCallback((text: string) => {
    // Add debug message about sending attempt
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: `debug-send-attempt-${Date.now()}`,
        user_id: 'system',
        username: 'DEBUG',
        message: `[Send] Attempting to send: "${text}" (Connected: ${ws.isConnected})`,
        timestamp: new Date().toISOString(),
        is_system: true
      }]
    }));
    
    if (!ws.isConnected) {
      console.warn('[GeneralChat WebSocket] Cannot send message - WebSocket not connected');
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: `debug-send-fail-${Date.now()}`,
          user_id: 'system',
          username: 'DEBUG',
          message: `[Send] FAILED - WebSocket not connected`,
          timestamp: new Date().toISOString(),
          is_system: true
        }]
      }));
      return false;
    }
    
    // Send using COMMAND type with SEND_MESSAGE action as per backend spec
    const message = {
      type: 'COMMAND',
      topic: TopicType.GENERAL_CHAT,
      action: 'SEND_MESSAGE',
      data: { text }
    };
    
    const requestSent = ws.sendMessage(message);
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: `debug-send-result-${Date.now()}`,
        user_id: 'system',
        username: 'DEBUG',
        message: `[Send] Result: ${requestSent ? 'SUCCESS' : 'FAILED'}`,
        timestamp: new Date().toISOString(),
        is_system: true
      }]
    }));
    
    if (requestSent) {
      dispatchWebSocketEvent('general_chat_send_message', {
        socketType: 'general-chat',
        message: 'Sent chat message to general chat',
        timestamp: new Date().toISOString(),
        messageLength: text.length
      });
    }
    
    return requestSent;
  }, [ws.isConnected, ws.sendMessage]);

  // Load older messages using GET_HISTORY action
  const loadOlderMessages = useCallback((before?: string, limit: number = 50) => {
    if (!ws.isConnected) {
      console.warn('[GeneralChat WebSocket] Cannot load history - WebSocket not connected');
      return false;
    }
    
    const message = {
      type: 'COMMAND',
      topic: TopicType.GENERAL_CHAT,
      action: 'GET_HISTORY',
      requestId: `history-${Date.now()}`,
      data: {
        ...(before && { before }),
        limit: Math.min(limit, 100) // Cap at 100 as per backend
      }
    };
    
    // Add debug message
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `debug-load-${Date.now()}`,
          user_id: 'system',
          username: 'DEBUG',
          message: `[Loading] Fetching ${limit} messages${before ? ' before ' + before : ''}`,
          timestamp: new Date().toISOString(),
          is_system: true
        }
      ]
    }));
    
    const requestSent = ws.sendMessage(message);
    
    if (requestSent) {
      dispatchWebSocketEvent('general_chat_load_history', {
        socketType: 'general-chat',
        message: 'Requested chat history',
        timestamp: new Date().toISOString()
      });
    }
    
    return requestSent;
  }, [ws.isConnected, ws.sendMessage]);

  // Return chat data and helper functions
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isConnected: ws.isConnected,
    error,
    lastUpdate: state.lastMessageTime,
    sendMessage,
    loadOlderMessages
  };
}