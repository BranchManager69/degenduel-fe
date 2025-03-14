import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface ChatMessage {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isSystemMessage?: boolean;
  isModerated?: boolean;
  reactionCount?: number;
  userReacted?: boolean;
}

export interface ContestChatState {
  messages: ChatMessage[];
  participants: number;
  isConnected: boolean;
  error: Error | null;
}

export interface ContestChatHook extends ContestChatState {
  sendMessage: (content: string) => boolean;
  reactToMessage: (messageId: string) => boolean;
  deleteMessage: (messageId: string) => boolean;
  close: () => void;
}

export function useContestChatWebSocket(contestId: string): ContestChatHook {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'chat_message':
        // Add a new message to the list
        setMessages(prev => [
          {
            id: data.id,
            contestId: data.contestId,
            userId: data.userId,
            username: data.username,
            avatar: data.avatar,
            content: data.content,
            timestamp: data.timestamp,
            isSystemMessage: data.isSystemMessage,
            isModerated: data.isModerated,
            reactionCount: data.reactionCount || 0,
            userReacted: data.userReacted || false
          },
          ...prev.slice(0, 199) // Keep max 200 messages
        ]);
        break;
        
      case 'message_deleted':
        // Remove a message from the list
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        break;
        
      case 'reaction_updated':
        // Update reaction count for a message
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? {
                ...msg, 
                reactionCount: data.reactionCount, 
                userReacted: data.userReacted
              }
            : msg
        ));
        break;
        
      case 'participant_count':
        setParticipants(data.count);
        break;
        
      case 'chat_history':
        // Replace messages with history
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        break;
        
      case 'error':
        setError(new Error(data.message));
        break;
    }
  }, []);

  // Initialize WebSocket connection
  const {
    isConnected,
    sendMessage: sendToSocket,
    disconnect
  } = useWebSocket(`contest-chat/${contestId}`, {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Request chat history when connected
  useEffect(() => {
    if (isConnected) {
      sendToSocket({
        type: 'get_chat_history',
        contestId
      });
    }
  }, [isConnected, contestId, sendToSocket]);

  // Function to send a chat message
  const sendMessage = useCallback((content: string): boolean => {
    if (!isConnected || !content.trim()) return false;
    
    return sendToSocket({
      type: 'send_message',
      contestId,
      content: content.trim()
    });
  }, [isConnected, contestId, sendToSocket]);

  // Function to react to a message
  const reactToMessage = useCallback((messageId: string): boolean => {
    if (!isConnected) return false;
    
    return sendToSocket({
      type: 'toggle_reaction',
      messageId
    });
  }, [isConnected, sendToSocket]);

  // Function to delete a message (admin/mod only)
  const deleteMessage = useCallback((messageId: string): boolean => {
    if (!isConnected) return false;
    
    return sendToSocket({
      type: 'delete_message',
      messageId
    });
  }, [isConnected, sendToSocket]);

  return {
    messages,
    participants,
    isConnected,
    error,
    sendMessage,
    reactToMessage,
    deleteMessage,
    close: disconnect
  };
}