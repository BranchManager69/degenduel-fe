import { useCallback, useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

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

interface LeaveRoomMessage {
  type: "LEAVE_ROOM";
  contestId: string;
}

interface SendChatMessage {
  type: "SEND_CHAT_MESSAGE";
  contestId: string;
  text: string;
}

// interface ParticipantActivityMessage {
//   type: "PARTICIPANT_ACTIVITY";
//   contestId: string;
//   activityType: string;
//   details?: Record<string, any>;
// }

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

export interface ChatParticipant {
  userId: string;
  nickname: string;
  isAdmin: boolean;
  profilePicture?: string;
}

export interface ChatMessageData {
  messageId: string;
  userId: string;
  nickname: string;
  isAdmin: boolean;
  text: string;
  timestamp: string;
  profilePicture?: string;
}

export const useContestChatWebSocket = (contestId: string) => {
  const { user } = useStore();
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const ws = useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/api/v2/ws/contest`,
    socketType: "contest-chat",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });

  const joinRoom = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message: JoinRoomMessage = {
        type: "JOIN_ROOM",
        contestId: contestId.toString(),
      };
      ws.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

  const leaveRoom = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message: LeaveRoomMessage = {
        type: "LEAVE_ROOM",
        contestId: contestId.toString(),
      };
      ws.send(JSON.stringify(message));
    }
  }, [ws, contestId]);

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

      if (ws && ws.readyState === WebSocket.OPEN) {
        const message: SendChatMessage = {
          type: "SEND_CHAT_MESSAGE",
          contestId: contestId.toString(),
          text,
        };
        ws.send(JSON.stringify(message));
      }
    },
    [ws, contestId, isRateLimited]
  );

  // Join room when component mounts and WebSocket is ready
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      joinRoom();
    }

    // Leave room when component unmounts
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
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
