/**
 * Contest Chat WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the contest chat WebSocket service and provides real-time
 * chat messaging, participant tracking, and room management for contest chats.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { useStore } from '../../store/useStore';

// Message types from server
interface RoomStateMessage {
  type: "ROOM_STATE";
  participants: Array<{
    userId: string;
    nickname: string;
    isAdmin: boolean;
    profilePicture?: string;
  }>;
}

interface ChatMessage {
  type: "CHAT_MESSAGE";
  messageId: string;
  userId: string;
  nickname: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
  profilePicture?: string;
}

interface ParticipantJoinedMessage {
  type: "PARTICIPANT_JOINED";
  participant: {
    userId: string;
    nickname: string;
    isAdmin: boolean;
    profilePicture?: string;
  };
}

interface ParticipantLeftMessage {
  type: "PARTICIPANT_LEFT";
  userId: string;
}

// Error message from server
interface ErrorMessage {
  type: "ERROR";
  error: string;
  code: number;
}

// Server message types
type ServerMessage =
  | RoomStateMessage
  | ChatMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | ErrorMessage;

// Data structure for a chat participant
export interface ChatParticipant {
  userId: string;
  nickname: string;
  isAdmin: boolean;
  profilePicture?: string;
}

// Data structure for a chat message
export interface ChatMessageData {
  messageId: string;
  userId: string;
  nickname: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
  profilePicture?: string;
}

export function useContestChatWebSocket(contestId: string) {
  const user = useStore(state => state.user);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<ServerMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.CONTEST_CHAT,
    socketType: SOCKET_TYPES.CONTEST_CHAT,
    requiresAuth: true, // Contest chat requires authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('contest_chat_status', {
      socketType: SOCKET_TYPES.CONTEST_CHAT,
      status,
      message: `Contest chat WebSocket is ${status}`,
      contestId
    });
    
    // Join the specific contest room when connected
    if (status === 'online') {
      joinRoom();
    }
  }, [status, contestId]);

  // Join the chat room
  const joinRoom = useCallback(() => {
    if (status !== 'online') {
      console.warn('Cannot join contest chat room: WebSocket not connected');
      return;
    }
    
    send({
      type: "JOIN_ROOM",
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_chat_join_room', {
      socketType: SOCKET_TYPES.CONTEST_CHAT,
      message: `Joining contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [status, send, contestId]);

  // Leave the chat room
  const leaveRoom = useCallback(() => {
    if (status !== 'online') {
      return;
    }
    
    send({
      type: "LEAVE_ROOM",
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_chat_leave_room', {
      socketType: SOCKET_TYPES.CONTEST_CHAT,
      message: `Leaving contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [status, send, contestId]);

  // Send a chat message
  const sendMessage = useCallback((text: string) => {
    if (isRateLimited) {
      dispatchWebSocketEvent('contest_chat_rate_limited', {
        socketType: SOCKET_TYPES.CONTEST_CHAT,
        message: 'Rate limited: Cannot send message',
        contestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (text.length > 200) {
      dispatchWebSocketEvent('contest_chat_error', {
        socketType: SOCKET_TYPES.CONTEST_CHAT,
        message: 'Message too long (max 200 characters)',
        contestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (status !== 'online') {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    send({
      type: "SEND_CHAT_MESSAGE",
      contestId: contestId.toString(),
      text
    });
    
    dispatchWebSocketEvent('contest_chat_send_message', {
      socketType: SOCKET_TYPES.CONTEST_CHAT,
      message: 'Sending chat message',
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [status, send, contestId, isRateLimited]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "ROOM_STATE":
          setParticipants(data.participants);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('contest_chat_room_state', {
            socketType: SOCKET_TYPES.CONTEST_CHAT,
            message: `Room state received with ${data.participants.length} participants`,
            contestId,
            participantCount: data.participants.length,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "CHAT_MESSAGE":
          setMessages(prev => [
            ...prev,
            {
              messageId: data.messageId,
              userId: data.userId,
              nickname: data.nickname,
              isAdmin: data.isAdmin,
              text: data.text,
              timestamp: data.timestamp,
              profilePicture: data.profilePicture,
            },
          ]);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('contest_chat_message', {
            socketType: SOCKET_TYPES.CONTEST_CHAT,
            message: 'Chat message received',
            contestId,
            messageId: data.messageId,
            userId: data.userId,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "PARTICIPANT_JOINED":
          setParticipants(prev => [...prev, data.participant]);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('contest_chat_participant_joined', {
            socketType: SOCKET_TYPES.CONTEST_CHAT,
            message: 'Participant joined',
            contestId,
            userId: data.participant.userId,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "PARTICIPANT_LEFT":
          setParticipants(prev => 
            prev.filter(p => p.userId !== data.userId)
          );
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('contest_chat_participant_left', {
            socketType: SOCKET_TYPES.CONTEST_CHAT,
            message: 'Participant left',
            contestId,
            userId: data.userId,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "ERROR":
          if (data.code === 4290) {
            setIsRateLimited(true);
            // Reset rate limit after 10 seconds
            setTimeout(() => setIsRateLimited(false), 10000);
          }
          
          dispatchWebSocketEvent('contest_chat_error', {
            socketType: SOCKET_TYPES.CONTEST_CHAT,
            message: data.error,
            contestId,
            code: data.code,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing contest chat message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CONTEST_CHAT,
        message: 'Error processing contest chat data',
        error: err instanceof Error ? err.message : String(err),
        contestId
      });
    }
  }, [data, contestId]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Contest chat WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CONTEST_CHAT,
        message: error.message,
        error,
        contestId
      });
    }
  }, [error, contestId]);
  
  // Leave room on component unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);
  
  return {
    participants,
    messages,
    isRateLimited,
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    sendMessage,
    joinRoom,
    leaveRoom,
    currentUserId: user?.wallet_address || "",
    connect,
    close
  };
}