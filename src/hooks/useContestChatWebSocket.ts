// src/hooks/useContestChatWebSocket.ts

/**
 * This hook is used to connect to the contest chat WebSocket.
 * It is used to send and receive messages to and from the contest chat.
 * It is also used to join and leave the contest chat.
 *
 * @param contestId - The ID of the contest to connect to.
 * @returns An object containing the participants, messages, isRateLimited, error, sendMessage, joinRoom, and leaveRoom functions.
 */

import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

/* Contest chat WebSocket */

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

// Message types to server
interface JoinRoomMessage {
  type: "JOIN_ROOM";
  contestId: string;
}

// Leave room message to server
interface LeaveRoomMessage {
  type: "LEAVE_ROOM";
  contestId: string;
}

// Send chat message to server
interface SendChatMessage {
  type: "SEND_CHAT_MESSAGE";
  contestId: string;
  text: string;
}

// Participant activity message from server
// interface ParticipantActivityMessage {
//   type: "PARTICIPANT_ACTIVITY";
//   contestId: string;
//   activityType: string;
//   details?: Record<string, any>;
// }

// Data structure for a server message
type ServerMessage =
  | RoomStateMessage
  | ChatMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | ErrorMessage;
// Client message types
// | JoinRoomMessage
// | LeaveRoomMessage
// | SendChatMessage
// | ParticipantActivityMessage

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

// Custom hook for the contest chat WebSocket connection
export const useContestChatWebSocket = (contestId: string) => {
  const { user } = useStore();
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming messages from the server
  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "ROOM_STATE":
        setParticipants(message.participants);
        break;
      case "CHAT_MESSAGE":
        setMessages((prev) => [
          ...prev,
          {
            messageId: message.messageId,
            userId: message.userId,
            nickname: message.nickname,
            isAdmin: message.isAdmin,
            text: message.text,
            timestamp: message.timestamp,
            profilePicture: message.profilePicture,
          },
        ]);
        break;
      case "PARTICIPANT_JOINED":
        setParticipants((prev) => [...prev, message.participant]);
        break;
      case "PARTICIPANT_LEFT":
        setParticipants((prev) =>
          prev.filter((p) => p.userId !== message.userId)
        );
        break;
      case "ERROR":
        setError(message.error);
        if (message.code === 4290) {
          setIsRateLimited(true);
          // Reset rate limit after 10 seconds
          setTimeout(() => setIsRateLimited(false), 10000);
        }
        break;
    }
  }, []);

  // Initialize the WebSocket connection
  const ws = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/v2/ws/contest`,
    socketType: "contest-chat",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });

  // Join the room
  const joinRoom = useCallback(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: JoinRoomMessage = {
        type: "JOIN_ROOM",
        contestId: contestId.toString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

  // Leave the room
  const leaveRoom = useCallback(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: LeaveRoomMessage = {
        type: "LEAVE_ROOM",
        contestId: contestId.toString(),
      };
      socket.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

  // Send a message to the room
  const sendMessage = useCallback(
    (text: string) => {
      if (isRateLimited) {
        setError("You're sending messages too quickly. Please wait a moment.");
        return;
      }

      if (text.length > 200) {
        setError("Message too long (max 200 characters)");
        return;
      }

      const socket = ws.wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message: SendChatMessage = {
          type: "SEND_CHAT_MESSAGE",
          contestId: contestId.toString(),
          text,
        };
        socket.send(JSON.stringify(message));
      }
    },
    [ws, contestId, isRateLimited]
  );

  // Join room when component mounts and WebSocket is ready
  useEffect(() => {
    const socket = ws.wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      joinRoom();
    }

    // Leave room when component unmounts
    return () => {
      const socket = ws.wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        leaveRoom();
      }
    };
  }, [ws, joinRoom, leaveRoom]);

  return {
    participants,
    messages,
    isRateLimited,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    currentUserId: user?.wallet_address || "",
  };
};
