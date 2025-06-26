/**
 * useGeneralChatRoom Hook
 * 
 * A flexible WebSocket hook for any chat room functionality.
 * Can be used for contests, general chat, private rooms, etc.
 * 
 * @author Branch Manager
 * @created 2025-01-27
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDWebSocketActions } from '../../../websocket-types-implementation';
import { TopicType } from '../index';
import { DDExtendedMessageType, WebSocketMessage } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Generic chat message interface
export interface ChatRoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  is_system?: boolean;
  is_admin?: boolean;
  user_role?: 'user' | 'admin' | 'moderator' | 'system' | 'superadmin';
  profile_picture?: string;
  message_type?: 'text' | 'system' | 'join' | 'leave';
}

// Chat participant interface
export interface ChatRoomParticipant {
  user_id: string;
  username: string;
  role?: string;
  is_online?: boolean;
  joined_at?: string;
  profile_picture?: string;
}

// Chat room data interface
interface ChatRoomData {
  messages?: ChatRoomMessage[];
  participants?: ChatRoomParticipant[];
  message?: ChatRoomMessage;
  participant?: ChatRoomParticipant;
  user_id?: string;
  room_id?: string;
  message_id?: string;
}

// Default state
const DEFAULT_STATE = {
  messages: [] as ChatRoomMessage[],
  participants: [] as ChatRoomParticipant[],
  isLoading: true,
  lastMessageTime: null as Date | null
};

/**
 * Hook for accessing and managing any chat room with real-time updates
 * 
 * @param roomId The ID of the room to connect to
 * @param roomType The type of room ('contest', 'general', 'private', etc.)
 */
export function useGeneralChatRoom(roomId: string, roomType: string = 'general') {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      if (message.type === DDExtendedMessageType.DATA && message.topic && message.data) {
        const { action, data } = message;

        if (typeof data !== 'object' || data === null) {
          console.warn('[GeneralChatRoom WebSocket] Received non-object data:', data);
          return;
        }

        const chatData = data as ChatRoomData;

        // Handle initial messages and participants load
        if (action === DDWebSocketActions.GET_MESSAGES && Array.isArray(chatData.messages)) {
          setState(prev => ({
            ...prev,
            messages: chatData.messages || [],
            participants: chatData.participants || [],
            isLoading: false,
            lastMessageTime: new Date()
          }));

          dispatchWebSocketEvent('chat_room_loaded', {
            socketType: 'chat_room',
            message: `Loaded ${chatData.messages?.length || 0} messages and ${chatData.participants?.length || 0} participants for room ${roomId}`,
            roomId,
            roomType,
            timestamp: new Date().toISOString()
          });
        }

        // Handle participants update
        else if (action === 'participants_update' && Array.isArray(chatData.participants)) {
          setState(prev => ({
            ...prev,
            participants: chatData.participants || [],
            lastMessageTime: new Date()
          }));

          dispatchWebSocketEvent('chat_room_participants_update', {
            socketType: 'chat_room',
            message: `Participants updated for room ${roomId}`,
            participantCount: chatData.participants?.length || 0,
            roomId,
            roomType,
            timestamp: new Date().toISOString()
          });
        }

        // Handle new message
        else if (action === DDWebSocketActions.SEND_MESSAGE && chatData.message) {
          const newMessage = chatData.message;

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            isLoading: false,
            lastMessageTime: new Date()
          }));

          dispatchWebSocketEvent('chat_room_new_message', {
            socketType: 'chat_room',
            message: `New chat message in room ${roomId}`,
            roomId,
            roomType,
            timestamp: new Date().toISOString(),
            isAdmin: newMessage.is_admin,
            isSystem: newMessage.is_system
          });
        }

        // Handle user joined
        else if (action === 'user_joined' && chatData.participant) {
          setState(prev => ({
            ...prev,
            participants: [...prev.participants, chatData.participant!],
            lastMessageTime: new Date()
          }));

          // Add system message
          const joinMessage: ChatRoomMessage = {
            id: crypto.randomUUID(),
            room_id: roomId,
            user_id: 'system',
            username: 'System',
            message: `${chatData.participant.username} joined the chat`,
            timestamp: new Date().toISOString(),
            is_system: true,
            message_type: 'join'
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, joinMessage]
          }));
        }

        // Handle user left
        else if (action === 'user_left' && chatData.user_id) {
          setState(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.user_id !== chatData.user_id),
            lastMessageTime: new Date()
          }));

          // Add system message
          const leaveMessage: ChatRoomMessage = {
            id: crypto.randomUUID(),
            room_id: roomId,
            user_id: 'system',
            username: 'System',
            message: `User left the chat`,
            timestamp: new Date().toISOString(),
            is_system: true,
            message_type: 'leave'
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, leaveMessage]
          }));
        }

        // Handle message deletion
        else if (action === DDWebSocketActions.DELETE_MESSAGE && chatData.message_id) {
          setState(prev => ({
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== chatData.message_id),
            lastMessageTime: new Date()
          }));

          dispatchWebSocketEvent('chat_room_delete_message', {
            socketType: 'chat_room',
            message: `Deleted chat message in room ${roomId}`,
            roomId,
            roomType,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[GeneralChatRoom WebSocket] Error processing message:', err);
      setError(err instanceof Error ? err.message : String(err));

      dispatchWebSocketEvent('error', {
        socketType: 'chat_room',
        message: 'Error processing chat room data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [roomId, roomType]);

  // Connect to WebSocket - use flexible topic based on room type
  const ws = useUnifiedWebSocket(
    `chat-room-${roomId}`,
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [`chat-${roomType}-${roomId}`, `chat-${roomType}`, TopicType.SYSTEM]
  );

  // Update connection status
  useEffect(() => {
    setIsConnected(ws.isConnected);
    setError(ws.error);
  }, [ws.isConnected, ws.error]);

  // Subscribe to chat room when connected
  useEffect(() => {
    if (ws.isConnected && state.isLoading && roomId) {
      const chatTopic = `chat-${roomType}-${roomId}`;
      ws.subscribe([chatTopic]);

      // Request initial chat messages and participants
      ws.request(chatTopic, DDWebSocketActions.GET_MESSAGES, { roomId, roomType });

      dispatchWebSocketEvent('chat_room_subscribe', {
        socketType: 'chat_room',
        message: `Subscribing to chat room ${roomId} (${roomType})`,
        roomId,
        roomType,
        timestamp: new Date().toISOString()
      });

      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (state.isLoading) {
          console.warn('[GeneralChatRoom WebSocket] Timed out waiting for data');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, ws.subscribe, ws.request, roomId, roomType, state.isLoading]);

  // Send a chat message
  const sendMessage = useCallback((message: string) => {
    if (!ws.isConnected || !roomId) {
      console.warn('[GeneralChatRoom WebSocket] Cannot send message - WebSocket not connected or missing roomId');
      return false;
    }

    const chatTopic = `chat-${roomType}-${roomId}`;
    const requestSent = ws.request(chatTopic, DDWebSocketActions.SEND_MESSAGE, {
      roomId,
      roomType,
      message
    });

    if (requestSent) {
      dispatchWebSocketEvent('chat_room_send_message', {
        socketType: 'chat_room',
        message: `Sent chat message to room ${roomId}`,
        roomId,
        roomType,
        timestamp: new Date().toISOString(),
        messageLength: message.length
      });
    }

    return requestSent;
  }, [ws.isConnected, ws.request, roomId, roomType]);

  // Join the chat room
  const joinRoom = useCallback(() => {
    if (!ws.isConnected || !roomId) {
      console.warn('[GeneralChatRoom WebSocket] Cannot join room - WebSocket not connected or missing roomId');
      return false;
    }

    const chatTopic = `chat-${roomType}-${roomId}`;
    const requestSent = ws.request(chatTopic, 'join_room', { roomId, roomType });

    if (requestSent) {
      dispatchWebSocketEvent('chat_room_join', {
        socketType: 'chat_room',
        message: `Joining chat room ${roomId}`,
        roomId,
        roomType,
        timestamp: new Date().toISOString()
      });
    }

    return requestSent;
  }, [ws.isConnected, ws.request, roomId, roomType]);

  // Leave the chat room
  const leaveRoom = useCallback(() => {
    if (!ws.isConnected || !roomId) {
      return false;
    }

    const chatTopic = `chat-${roomType}-${roomId}`;
    const requestSent = ws.request(chatTopic, 'leave_room', { roomId, roomType });

    if (requestSent) {
      dispatchWebSocketEvent('chat_room_leave', {
        socketType: 'chat_room',
        message: `Leaving chat room ${roomId}`,
        roomId,
        roomType,
        timestamp: new Date().toISOString()
      });
    }

    return requestSent;
  }, [ws.isConnected, ws.request, roomId, roomType]);

  // Refresh chat messages
  const refreshChat = useCallback(() => {
    if (!ws.isConnected || !roomId) {
      console.warn('[GeneralChatRoom WebSocket] Cannot refresh chat - WebSocket not connected or missing roomId');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, messages: [], participants: [] }));

    const chatTopic = `chat-${roomType}-${roomId}`;
    const requestSent = ws.request(chatTopic, DDWebSocketActions.GET_MESSAGES, { roomId, roomType });

    if (requestSent) {
      dispatchWebSocketEvent('chat_room_refresh', {
        socketType: 'chat_room',
        message: `Refreshing chat for room ${roomId}`,
        roomId,
        roomType,
        timestamp: new Date().toISOString()
      });
    } else {
      // Reset loading state if request failed
      setState(prev => ({ ...prev, isLoading: false }));
    }

    return requestSent;
  }, [ws.isConnected, ws.request, roomId, roomType]);

  // Return chat data and helper functions
  return {
    messages: state.messages,
    participants: state.participants,
    isLoading: state.isLoading,
    isConnected,
    error,
    lastUpdate: state.lastMessageTime,
    sendMessage,
    joinRoom,
    leaveRoom,
    refreshChat,
    // Additional utilities
    participantCount: state.participants.length,
    messageCount: state.messages.length,
    roomInfo: { roomId, roomType }
  };
} 