/**
 * Contest Chat WebSocket Hook - v69 Unified WebSocket System Implementation
 * 
 * This hook connects to the v69 unified WebSocket service with the 'contest' topic
 * and provides real-time chat messaging, participant tracking, and room management.
 * 
 * Last updated: March 28, 2025
 * Based on the v69 Unified WebSocket System specification
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { MessageType, TopicType, useUnifiedWebSocket } from './index';
import { useStore } from '../../store/useStore';

// Message types for contest chat
export enum ContestChatMessageType {
  ROOM_STATE = "ROOM_STATE",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  PARTICIPANT_JOINED = "PARTICIPANT_JOINED",
  PARTICIPANT_LEFT = "PARTICIPANT_LEFT"
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

// Chat room state interface for use in state handling
// Note: Used for internal processing of the ROOM_STATE message type

export function useContestChatWebSocket(contestId: string) {
  // Get user from store for authentication
  const user = useStore(state => state.user);
  
  // State for chat functionality
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Check if contestId is valid
  useEffect(() => {
    if (!contestId) {
      setError("Missing contestId");
      dispatchWebSocketEvent('error', {
        socketType: 'contest',
        message: 'Missing contestId',
        timestamp: new Date().toISOString()
      });
    } else {
      setError(null);
    }
  }, [contestId]);

  // Connect to the unified WebSocket using the topic filter for contest
  const ws = useUnifiedWebSocket(
    `contest-chat-${contestId}`, // Unique ID for this connection
    [MessageType.DATA, MessageType.ERROR, MessageType.SYSTEM, MessageType.ACKNOWLEDGMENT], // Message types to listen for
    (message) => {
      // Handle messages based on type according to v69 Unified WebSocket System spec
      try {
        console.log('[ContestChatWebSocket] Received message:', message);
        
        // Check message type and process accordingly
        switch (message.type) {
          case MessageType.ACKNOWLEDGMENT:
            // Handle subscription acknowledgment
            if (message.operation === 'SUBSCRIBE' && message.topics?.includes(TopicType.CONTEST)) {
              console.log('[ContestChatWebSocket] Successfully subscribed to contest topic');
              setIsSubscribed(true);
              
              dispatchWebSocketEvent('contest_chat_subscribed', {
                socketType: 'contest',
                message: 'Successfully subscribed to contest topic',
                contestId,
                timestamp: new Date().toISOString()
              });
            }
            break;
            
          case MessageType.DATA:
            // Handle data messages for the contest topic
            if (message.topic === TopicType.CONTEST) {
              // First time data after subscribing might have initialData flag
              if (message.initialData) {
                console.log('[ContestChatWebSocket] Received initial contest data');
                dispatchWebSocketEvent('contest_chat_initial_data', {
                  socketType: 'contest',
                  message: 'Received initial contest data',
                  contestId,
                  timestamp: new Date().toISOString()
                });
              }
              
              // Process data based on content
              const data = message.data;
              if (!data) return;
              
              // Handle different contest chat message types
              switch (data.type) {
                case ContestChatMessageType.ROOM_STATE:
                  // Check if this room state is for our contest
                  if (data.contestId === contestId) {
                    setParticipants(data.participants || []);
                    setIsJoined(true);
                    setLastUpdate(new Date());
                    
                    dispatchWebSocketEvent('contest_chat_room_state', {
                      socketType: 'contest',
                      message: `Room state received with ${data.participants.length} participants`,
                      contestId,
                      participantCount: data.participants.length,
                      timestamp: new Date().toISOString()
                    });
                  }
                  break;
                  
                case ContestChatMessageType.CHAT_MESSAGE:
                  // Check if message is for our contest
                  if (data.contestId === contestId) {
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
                  }
                  break;
                  
                case ContestChatMessageType.PARTICIPANT_JOINED:
                  // Check if participant joined our contest
                  if (data.contestId === contestId) {
                    setParticipants(prev => [...prev, data.participant]);
                    setLastUpdate(new Date());
                    
                    dispatchWebSocketEvent('contest_chat_participant_joined', {
                      socketType: 'contest',
                      message: 'Participant joined',
                      contestId,
                      userId: data.participant.userId,
                      timestamp: new Date().toISOString()
                    });
                  }
                  break;
                  
                case ContestChatMessageType.PARTICIPANT_LEFT:
                  // Check if participant left our contest
                  if (data.contestId === contestId) {
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
                  }
                  break;
              }
            }
            break;
            
          case MessageType.ERROR:
            // Handle error messages
            console.error(`[ContestChatWebSocket] Error (${message.code}): ${message.message}`);
            
            // Rate limit error
            if (message.code === 4290) {
              setIsRateLimited(true);
              // Reset rate limit after 10 seconds
              setTimeout(() => setIsRateLimited(false), 10000);
            }
            
            // Missing contestId error
            if (message.message && message.message.includes('Missing contestId')) {
              setError('Missing contestId');
            } else {
              setError(message.message || message.error || "Unknown chat error");
            }
            
            dispatchWebSocketEvent('contest_chat_error', {
              socketType: 'contest',
              message: message.message || message.error || 'Unknown error',
              contestId,
              code: message.code,
              timestamp: new Date().toISOString()
            });
            break;
            
          case MessageType.SYSTEM:
            // Handle system messages
            if (message.action === 'heartbeat') {
              // Heartbeat message - can ignore for chat functionality
              dispatchWebSocketEvent('contest_chat_heartbeat', {
                socketType: 'contest',
                message: 'Received heartbeat',
                timestamp: message.timestamp || new Date().toISOString()
              });
            } else {
              // Other system messages
              console.log(`[ContestChatWebSocket] System message: ${message.message}`);
              
              dispatchWebSocketEvent('contest_chat_system', {
                socketType: 'contest',
                message: message.message || 'System message received',
                timestamp: new Date().toISOString()
              });
            }
            break;
        }
      } catch (err) {
        console.error('[ContestChatWebSocket] Error processing message:', err);
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
    if (ws.isConnected && !isSubscribed && contestId) {
      // Subscribe to the CONTEST topic using the v69 unified system
      ws.subscribe([TopicType.CONTEST]);
      
      dispatchWebSocketEvent('contest_chat_subscribe', {
        socketType: 'contest',
        message: 'Subscribing to contest topic',
        contestId,
        timestamp: new Date().toISOString()
      });
    }
  }, [ws.isConnected, isSubscribed, contestId]);

  // Join the room when subscribed
  useEffect(() => {
    if (ws.isConnected && isSubscribed && contestId && !isJoined) {
      joinRoom();
    }
  }, [ws.isConnected, isSubscribed, contestId, isJoined]);

  // Join the chat room
  const joinRoom = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[ContestChatWebSocket] Cannot join contest chat room: WebSocket not connected');
      return;
    }
    
    if (!contestId) {
      console.warn('[ContestChatWebSocket] Cannot join contest chat room: Missing contestId');
      setError('Missing contestId');
      return;
    }
    
    // Use the v69 WebSocket REQUEST message format
    const requestMessage = {
      type: MessageType.REQUEST,
      topic: TopicType.CONTEST,
      action: 'JOIN_ROOM',
      contestId: contestId.toString(),
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    ws.sendMessage(requestMessage);
    
    dispatchWebSocketEvent('contest_chat_join_room', {
      socketType: 'contest',
      message: `Joining contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, ws.sendMessage]);

  // Leave the chat room
  const leaveRoom = useCallback(() => {
    if (!ws.isConnected || !contestId) return;
    
    // Use the v69 WebSocket REQUEST message format
    const requestMessage = {
      type: MessageType.REQUEST,
      topic: TopicType.CONTEST,
      action: 'LEAVE_ROOM',
      contestId: contestId.toString(),
      requestId: crypto.randomUUID(), 
      timestamp: new Date().toISOString()
    };
    
    ws.sendMessage(requestMessage);
    setIsJoined(false);
    
    dispatchWebSocketEvent('contest_chat_leave_room', {
      socketType: 'contest',
      message: `Leaving contest chat room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, ws.sendMessage]);

  // Send a chat message
  const sendMessage = useCallback((text: string) => {
    if (!contestId) {
      setError('Missing contestId');
      return;
    }
    
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
      console.warn('[ContestChatWebSocket] Cannot send message: WebSocket not connected');
      return;
    }
    
    // Use the v69 WebSocket REQUEST message format
    const requestMessage = {
      type: MessageType.REQUEST,
      topic: TopicType.CONTEST,
      action: 'SEND_CHAT_MESSAGE',
      contestId: contestId.toString(),
      text,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    ws.sendMessage(requestMessage);
    
    dispatchWebSocketEvent('contest_chat_send_message', {
      socketType: 'contest',
      message: 'Sending chat message',
      contestId,
      text: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, contestId, isRateLimited, ws.sendMessage]);
  
  // Leave room on component unmount
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveRoom();
      }
    };
  }, [isJoined, leaveRoom]);
  
  return {
    participants,
    messages,
    isRateLimited,
    isConnected: ws.isConnected && isSubscribed,
    error,
    lastUpdate,
    sendMessage,
    joinRoom,
    leaveRoom,
    currentUserId: user?.wallet_address || "",
    // Expose additional debug properties
    isSubscribed,
    isJoined,
    // Backward compatibility
    connect: joinRoom, 
    close: leaveRoom
  };
}