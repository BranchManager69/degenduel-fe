/**
 * Contest Chat WebSocket Hook - Using Unified WebSocket System
 * 
 * This hook connects to the unified WebSocket service with the CONTEST topic
 * and provides real-time chat messaging, participant tracking, and room management.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { MessageType, TopicType, useUnifiedWebSocket } from './index';
import { useStore } from '../../store/useStore';

// These interface definitions are used internally in the component
// and will be needed when we fully implement the contest chat system
export interface ContestChatMessageTypes {
  ROOM_STATE: "ROOM_STATE";
  CHAT_MESSAGE: "CHAT_MESSAGE";
  PARTICIPANT_JOINED: "PARTICIPANT_JOINED";
  PARTICIPANT_LEFT: "PARTICIPANT_LEFT";
  ERROR: "ERROR";
}

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
  const [error, setError] = useState<string | null>(null);

  // Connect to the unified WebSocket using the topic filter for contest
  const ws = useUnifiedWebSocket(
    `contest-chat-${contestId}`, // Unique ID for this connection
    [MessageType.DATA], // We want to receive DATA messages
    (message) => {
      // Message handler for contest-related messages
      if (message.topic !== TopicType.CONTEST) return;
      if (!message.data) return;
      
      try {
        const data = message.data;
        // Process the message based on its type
        switch (data.type) {
          case "ROOM_STATE":
            setParticipants(data.participants);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('contest_chat_room_state', {
              socketType: 'contest',
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
              socketType: 'contest',
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
              socketType: 'contest',
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
              socketType: 'contest',
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
            
            setError(data.error || "Unknown chat error");
            
            dispatchWebSocketEvent('contest_chat_error', {
              socketType: 'contest',
              message: data.error,
              contestId,
              code: data.code,
              timestamp: new Date().toISOString()
            });
            break;
        }
      } catch (err) {
        console.error('Error processing contest chat message:', err);
        setError(err instanceof Error ? err.message : String(err));
        dispatchWebSocketEvent('error', {
          socketType: 'contest',
          message: 'Error processing contest chat data',
          error: err instanceof Error ? err.message : String(err),
          contestId
        });
      }
    },
    [TopicType.CONTEST] // Only listen to CONTEST topic
  );

  // Subscribe to the CONTEST topic when the WebSocket is connected
  useEffect(() => {
    if (ws.isConnected) {
      // Subscribe to the CONTEST topic
      ws.subscribe([TopicType.CONTEST]);
      
      // Join the specific contest room
      joinRoom();
    }
  }, [ws.isConnected, contestId]);

  // Join the chat room
  const joinRoom = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('Cannot join contest chat room: WebSocket not connected');
      return;
    }
    
    // Send a request to join the contest room
    ws.request(TopicType.CONTEST, 'JOIN_ROOM', {
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_chat_join_room', {
      socketType: 'contest',
      message: `Joining contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, ws.request]);

  // Leave the chat room
  const leaveRoom = useCallback(() => {
    if (!ws.isConnected) return;
    
    // Send a request to leave the contest room
    ws.request(TopicType.CONTEST, 'LEAVE_ROOM', {
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_chat_leave_room', {
      socketType: 'contest',
      message: `Leaving contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, ws.request]);

  // Send a chat message
  const sendMessage = useCallback((text: string) => {
    if (isRateLimited) {
      dispatchWebSocketEvent('contest_chat_rate_limited', {
        socketType: 'contest',
        message: 'Rate limited: Cannot send message',
        contestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (text.length > 200) {
      setError('Message too long (max 200 characters)');
      dispatchWebSocketEvent('contest_chat_error', {
        socketType: 'contest',
        message: 'Message too long (max 200 characters)',
        contestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!ws.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    // Send a request to send a chat message
    ws.request(TopicType.CONTEST, 'SEND_CHAT_MESSAGE', {
      contestId: contestId.toString(),
      text
    });
    
    dispatchWebSocketEvent('contest_chat_send_message', {
      socketType: 'contest',
      message: 'Sending chat message',
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, ws.request, isRateLimited]);
  
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
    isConnected: ws.isConnected,
    error,
    lastUpdate,
    sendMessage,
    joinRoom,
    leaveRoom,
    currentUserId: user?.wallet_address || "",
    connect: () => {}, // No-op since we use the unified system
    close: () => {}    // No-op since we use the unified system
  };
}