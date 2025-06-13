/**
 * useContestChat Hook
 * 
 * V69 Standardized WebSocket Hook for Contest Chat
 * This hook provides real-time updates for contest chat messages
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDWebSocketActions } from '../../../websocket-types-implementation';
import { TopicType } from '../index';
import { DDExtendedMessageType, WebSocketMessage } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Chat data interfaces based on backend API documentation
export interface ChatMessage {
  id: string;
  contest_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  is_system?: boolean;
  is_admin?: boolean;
  is_pinned?: boolean;
  user_role?: 'user' | 'admin' | 'moderator' | 'system' | 'superadmin';
  profile_picture?: string;
  reactions?: Record<string, number>;
}

// Add interface for Participant data (based on backend plan)
export interface ChatParticipant {
  user_id: string;
  username: string;
  role?: string; // Or more specific roles
  // Add other fields if backend provides them (e.g., avatar)
}

// Default state
const DEFAULT_STATE = {
  messages: [] as ChatMessage[],
  participants: [] as ChatParticipant[],
  pinnedMessages: [] as ChatMessage[],
  isLoading: true,
  lastMessageTime: null as Date | null
};

/**
 * Hook for accessing and managing contest chat with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param contestId The ID of the contest to get chat for
 */
export function useContestChat(contestId: string) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      // Process only messages for the contest-chat topic
      if (message.type === DDExtendedMessageType.DATA && message.topic === TopicType.CONTEST_CHAT && message.data) {
        const data = message.data;
        const action = message.action;
        
        // Type guard or assertion for data structure expected by contest-chat
        interface ContestChatData {
          message?: ChatMessage;
          messages?: ChatMessage[];
          participants?: ChatParticipant[];
          contest_id?: string;
          message_id?: string;
          pinned?: boolean;
          deleted?: boolean;
        }

        if (typeof data !== 'object' || data === null) {
          console.warn('[ContestChat WebSocket] Received non-object data:', data);
          return;
        }
        
        const chatData = data as ContestChatData;

        // Handle initial messages AND participants load
        if (action === DDWebSocketActions.GET_MESSAGES && Array.isArray(chatData.messages)) {
          setState(prev => ({
            ...prev,
            messages: chatData.messages || [],
            participants: chatData.participants || [],
            pinnedMessages: (chatData.messages || []).filter(m => m.is_pinned),
            isLoading: false,
            lastMessageTime: new Date()
          }));
          
          dispatchWebSocketEvent('contest_chat_loaded', {
            socketType: TopicType.CONTEST_CHAT,
            message: `Loaded ${chatData.messages?.length || 0} chat messages and ${chatData.participants?.length || 0} participants for contest ${contestId}`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle potential separate participant list update (if backend sends them)
        else if (action === 'participants_update' && Array.isArray(chatData.participants)) {
          setState(prev => ({
            ...prev,
            participants: chatData.participants || [],
            lastMessageTime: new Date()
          }));
          
          dispatchWebSocketEvent('contest_chat_participants_update', {
            socketType: TopicType.CONTEST_CHAT,
            message: `Participants updated for contest ${contestId}`,
            participantCount: chatData.participants?.length || 0,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle new message
        else if (action === DDWebSocketActions.SEND_MESSAGE && chatData.message) {
          const newMessage = chatData.message;
          
          setState(prev => {
            // Add new message to the list
            const updatedMessages = [...prev.messages, newMessage];
            
            // Update pinned messages if needed
            const updatedPinned = newMessage.is_pinned
              ? [...prev.pinnedMessages, newMessage]
              : prev.pinnedMessages;
            
            return {
              ...prev,
              messages: updatedMessages,
              pinnedMessages: updatedPinned,
              isLoading: false,
              lastMessageTime: new Date()
            };
          });
          
          dispatchWebSocketEvent('contest_chat_new_message', {
            socketType: TopicType.CONTEST_CHAT,
            message: `New chat message in contest ${contestId}`,
            timestamp: new Date().toISOString(),
            isAdmin: chatData.message.is_admin,
            isSystem: chatData.message.is_system
          });
        }
        
        // Handle message update (e.g., pinning/unpinning)
        else if (action === DDWebSocketActions.PIN_MESSAGE && chatData.message) {
          const updatedMessage = chatData.message;
          
          setState(prev => {
            // Update message in the list
            const updatedMessages = prev.messages.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            );
            
            // Update pinned messages
            const updatedPinned = updatedMessage.is_pinned
              ? [...prev.pinnedMessages.filter(p => p.id !== updatedMessage.id), updatedMessage]
              : prev.pinnedMessages.filter(p => p.id !== updatedMessage.id);
            
            return {
              ...prev,
              messages: updatedMessages,
              pinnedMessages: updatedPinned,
              lastMessageTime: new Date()
            };
          });
          
          dispatchWebSocketEvent('contest_chat_update_message', {
            socketType: TopicType.CONTEST_CHAT,
            message: `Updated chat message in contest ${contestId}`,
            timestamp: new Date().toISOString(),
            isPinned: updatedMessage.is_pinned
          });
        }
        
        // Handle message deletion
        else if (action === DDWebSocketActions.DELETE_MESSAGE && chatData.message_id) {
          setState(prev => {
            // Remove message from lists
            const updatedMessages = prev.messages.filter(msg => msg.id !== chatData.message_id);
            const updatedPinned = prev.pinnedMessages.filter(msg => msg.id !== chatData.message_id);
            
            return {
              ...prev,
              messages: updatedMessages,
              pinnedMessages: updatedPinned,
              lastMessageTime: new Date()
            };
          });
          
          dispatchWebSocketEvent('contest_chat_delete_message', {
            socketType: TopicType.CONTEST_CHAT,
            message: `Deleted chat message in contest ${contestId}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[ContestChat WebSocket] Error processing message:', err);
      setError(err instanceof Error ? err.message : String(err));
      
      dispatchWebSocketEvent('error', {
        socketType: TopicType.CONTEST_CHAT,
        message: 'Error processing contest chat data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [contestId]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    `contest-chat-${contestId}`,
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [`${TopicType.CONTEST_CHAT}-${contestId}`, TopicType.CONTEST_CHAT, TopicType.SYSTEM]
  );

  // Update connection status
  useEffect(() => {
    setIsConnected(ws.isConnected);
    setError(ws.error);
  }, [ws.isConnected, ws.error]);

  // Subscribe to contest chat when connected
  useEffect(() => {
    if (ws.isConnected && state.isLoading && contestId) {
      // Subscribe to specific contest chat topic (e.g., 'contest-chat-768')
      const contestChatTopic = `${TopicType.CONTEST_CHAT}-${contestId}`;
      ws.subscribe([contestChatTopic]);
      
      // Request initial chat messages
      ws.request(contestChatTopic, DDWebSocketActions.GET_MESSAGES, { contestId });
      
      dispatchWebSocketEvent('contest_chat_subscribe', {
        socketType: TopicType.CONTEST_CHAT,
        message: `Subscribing to contest chat for ${contestId}`,
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (state.isLoading) {
          console.warn('[ContestChat WebSocket] Timed out waiting for data');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, ws.subscribe, ws.request, contestId, state.isLoading]);

  // Send a chat message
  const sendMessage = useCallback((message: string) => {
    if (!ws.isConnected || !contestId) {
      console.warn('[ContestChat WebSocket] Cannot send message - WebSocket not connected or missing contestId');
      return false;
    }
    
    const contestChatTopic = `${TopicType.CONTEST_CHAT}-${contestId}`;
    const requestSent = ws.request(contestChatTopic, DDWebSocketActions.SEND_MESSAGE, { 
      contestId, 
      message 
    });
    
    if (requestSent) {
      dispatchWebSocketEvent('contest_chat_send_message', {
        socketType: TopicType.CONTEST_CHAT,
        message: `Sent chat message to contest ${contestId}`,
        timestamp: new Date().toISOString(),
        messageLength: message.length
      });
    }
    
    return requestSent;
  }, [ws.isConnected, ws.request, contestId]);

  // Pin/unpin a message (admin only)
  const pinMessage = useCallback((messageId: string, pinned: boolean = true) => {
    if (!ws.isConnected || !contestId) {
      console.warn('[ContestChat WebSocket] Cannot pin message - WebSocket not connected or missing contestId');
      return false;
    }
    
    const contestChatTopic = `${TopicType.CONTEST_CHAT}-${contestId}`;
    const requestSent = ws.request(contestChatTopic, DDWebSocketActions.PIN_MESSAGE, { 
      contestId, 
      messageId,
      pinned
    });
    
    if (requestSent) {
      dispatchWebSocketEvent('contest_chat_pin_message', {
        socketType: TopicType.CONTEST_CHAT,
        message: `${pinned ? 'Pinned' : 'Unpinned'} chat message in contest ${contestId}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return requestSent;
  }, [ws.isConnected, ws.request, contestId]);

  // Delete a message (admin only)
  const deleteMessage = useCallback((messageId: string) => {
    if (!ws.isConnected || !contestId) {
      console.warn('[ContestChat WebSocket] Cannot delete message - WebSocket not connected or missing contestId');
      return false;
    }
    
    const contestChatTopic = `${TopicType.CONTEST_CHAT}-${contestId}`;
    const requestSent = ws.request(contestChatTopic, DDWebSocketActions.DELETE_MESSAGE, { 
      contestId, 
      messageId 
    });
    
    if (requestSent) {
      dispatchWebSocketEvent('contest_chat_delete_message_request', {
        socketType: TopicType.CONTEST_CHAT,
        message: `Requested to delete chat message in contest ${contestId}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return requestSent;
  }, [ws.isConnected, ws.request, contestId]);

  // Force refresh chat messages
  const refreshChat = useCallback(() => {
    if (!ws.isConnected || !contestId) {
      console.warn('[ContestChat WebSocket] Cannot refresh chat - WebSocket not connected or missing contestId');
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true, messages: [], participants: [], pinnedMessages: [] }));
    
    const contestChatTopic = `${TopicType.CONTEST_CHAT}-${contestId}`;
    const requestSent = ws.request(contestChatTopic, DDWebSocketActions.GET_MESSAGES, { contestId });
    
    if (requestSent) {
      dispatchWebSocketEvent('contest_chat_refresh', {
        socketType: TopicType.CONTEST_CHAT,
        message: `Refreshing chat for contest ${contestId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Reset loading state if request failed
      setState(prev => ({ ...prev, isLoading: false }));
    }
    
    return requestSent;
  }, [ws.isConnected, ws.request, contestId]);

  // Return chat data and helper functions
  return {
    messages: state.messages,
    participants: state.participants,
    pinnedMessages: state.pinnedMessages,
    isLoading: state.isLoading,
    isConnected,
    error,
    lastUpdate: state.lastMessageTime,
    sendMessage,
    pinMessage,
    deleteMessage,
    refreshChat
  };
}