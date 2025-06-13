// src/components/contest-chat/ContestChat.tsx

/**
 * Contest Chat
 * 
 * @description A component that displays a chat interface for a contest.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-02-14
 * @updated 2025-05-08
 */

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useCustomToast } from "../../components/toast";
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { ChatMessage, ChatParticipant, useContestChat } from '../../hooks/websocket/topic-hooks/useContestChat';
import { ChatInput } from './ChatInput';
import { aiService } from '../../services/ai';

// Default contest chat profile picture URL
const DEFAULT_PROFILE_PICTURE = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

interface ContestChatProps {
  contestId: string;
  className?: string;
  onNewMessage?: () => void;
  adminType?: "admin" | "superadmin"; // Optional admin type for styling
}

interface AITip {
  id: string;
  text: string;
  source: "market-insight" | "trading-tip" | "sentiment" | "news";
  timestamp?: string;
}

// Configuration for sender badges based on role or type
const badgeConfig = {
  system: { text: "SYSTEM", style: "bg-cyber-800 text-cyber-300 border border-cyber-700" },
  'ai-agent': { text: "AI AGENT", style: "bg-cyber-800 text-cyber-300 border border-cyber-700" },
  superadmin: { text: "Super Admin", style: "bg-yellow-800 text-yellow-300 border border-yellow-700" },
  admin: { text: "Admin", style: "bg-red-800 text-red-300 border border-red-700" },
  moderator: { text: "Admin", style: "bg-red-800 text-red-300 border border-red-700" }, // Moderator gets Admin badge for now
  // Add future titles/levels here, e.g.:
  // 'elite-degen': { text: "Elite Degen", style: "bg-purple-800 text-purple-300 border border-purple-700" }
};
type BadgeRole = keyof typeof badgeConfig;

export const ContestChat: React.FC<ContestChatProps> = ({
  contestId,
  className = "",
  onNewMessage,
  adminType,
}) => {
  const { user } = useMigratedAuth();
  const currentUserId = user?.id;
  const currentUserRole = user?.role;
  const {
    messages,
    participants,
    isLoading,
    isConnected,
    sendMessage,
    pinMessage,
    deleteMessage,
  } = useContestChat(contestId);
  
  const { addToast } = useCustomToast();
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTips, setAiTips] = useState<AITip[]>([]);
  const [_isAiThinking, setIsAiThinking] = useState(false);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const aiAgentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      console.log(`[ContestChat] Closing WebSocket for contest ${contestId}`);
    };
  }, [contestId]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      onNewMessage?.();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, onNewMessage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showAiPanel &&
        aiAgentRef.current &&
        !aiAgentRef.current.contains(e.target as Node)
      ) {
        setShowAiPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAiPanel]);

  const formatTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      console.warn("Failed to format timestamp:", timestamp, e);
      return "a moment ago"; // Fallback
    }
  };

  const getProfilePicture = (userId: string, username?: string) => {
    const seed = username || userId || 'default';
    if (userId === 'ai-agent') return "/ai-assistant.png";
    return `${DEFAULT_PROFILE_PICTURE}${seed}`;
  };

  const getAdminBadgeStyle = (role?: ChatMessage['user_role'], isAdmin?: boolean) => {
    if (role === "superadmin") return "bg-yellow-900/50 text-yellow-300 border border-yellow-700/30";
    if (role === "admin" || role === "moderator" || isAdmin) return "bg-red-900/50 text-red-300 border border-red-700/30";
    if (role === "system") return "bg-cyber-900/50 text-cyber-300 border border-cyber-700/30";
    return "bg-purple-900/50 text-purple-300";
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.user_id === 'ai-agent' || message.is_system) {
      return "bg-cyber-900/20 border-l-2 border-cyber-500";
    } else if (message.is_admin && message.user_role === "superadmin") {
      return "bg-yellow-900/20 border-l-2 border-yellow-500";
    } else if (message.is_admin) {
      return "bg-red-900/20 border-l-2 border-red-500";
    } else if (message.user_id === currentUserId) {
      return "bg-brand-900/20 border-l-2 border-brand-500";
    } else {
      return "bg-gray-800/50";
    }
  };

  const getAiMessageEffects = (message: ChatMessage) => {
    if (message.user_id !== 'ai-agent' && !message.is_system) return "";
    return "shadow-[0_0_10px_rgba(49,200,180,0.2)] bg-gradient-to-r from-cyber-900/30 to-cyber-800/10";
  };

  const getMessageSenderBadge = (message: ChatMessage): { text: string; style: string } | null => {
    let role: BadgeRole | null = null;

    if (message.is_system) role = 'system';
    else if (message.user_id === 'ai-agent') role = 'ai-agent';
    else if (message.user_role && badgeConfig[message.user_role as BadgeRole]) {
      role = message.user_role as BadgeRole;
    }
    // TODO: Add logic for custom titles like "Elite Degen" when data is available
    // else if (message.user_title && badgeConfig[message.user_title as BadgeRole]) {
    //   role = message.user_title as BadgeRole;
    // }

    return role ? badgeConfig[role] : null;
  };

  const handleSendMessageInput = (msgText: string) => {
    if (msgText.trim()) {
      if (!isConnected) {
        addToast("error", "Not connected to chat. Cannot send message.", "Chat Error");
        return;
      }
      
      setIsSendingMessage(true);
      const sent = sendMessage(msgText.trim());
      if (!sent) {
        addToast("error", "Failed to send message. Please try again.", "Chat Error");
      }
      setIsSendingMessage(false);
    }
  };

  const handlePinMessage = (message: ChatMessage) => {
    const currentlyPinned = !!message.is_pinned;
    const targetPinState = !currentlyPinned;
    const actionText = targetPinState ? "pin" : "unpin";
    
    console.log(`[Admin Action] Attempting to ${actionText} message: ${message.id}`);
    if (!pinMessage) {
      addToast("error", "Pin/Unpin function not available.", "Chat Error");
      return;
    }
    const success = pinMessage(message.id, targetPinState); 
    if (success) {
      addToast("info", `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} request sent.`, "Chat Admin");
    } else {
      addToast("error", `Failed to send ${actionText} request.`, "Chat Admin");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    console.log(`[Admin Action] Attempting to delete message: ${messageId}`);
    if (!deleteMessage) {
      addToast("error", "Delete function not available.", "Chat Error");
      return;
    }
    const success = deleteMessage(messageId);
    if (success) {
      addToast("info", "Delete request sent.", "Chat Admin");
    } else {
      addToast("error", "Failed to send delete request.", "Chat Admin");
    }
  };

  // Handle AI Assistant interactions
  const askAI = async (question?: string) => {
    setIsAiThinking(true);
    
    try {
      // Build context for AI
      const contestContext = `I'm in a DegenDuel contest (ID: ${contestId}) with ${participants.length} participants. `;
      const recentMessages = messages.slice(-10).map(m => `${m.username}: ${m.message}`).join('\n');
      
      const prompt = question || "Give me a real-time market insight or trading tip for this contest.";
      
      const response = await aiService.chat([
        {
          role: "system",
          content: `You are DegenDuel AI, a trading assistant for crypto contests. Provide real-time insights, market analysis, and trading tips. Keep responses concise and actionable. Current contest context: ${contestContext}. Recent chat: ${recentMessages}`
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        conversationId: aiConversationId || undefined,
        context: 'trading',
        streaming: true,
        onChunk: (chunk: string) => {
          // Could show typing indicator here
          console.log('[AI Assistant] Streaming chunk:', chunk);
        }
      });
      
      if (response.content) {
        // Determine the type of response
        let source: AITip['source'] = 'market-insight';
        if (response.content.toLowerCase().includes('tip')) {
          source = 'trading-tip';
        } else if (response.content.toLowerCase().includes('sentiment')) {
          source = 'sentiment';
        } else if (response.content.toLowerCase().includes('news') || response.content.toLowerCase().includes('breaking')) {
          source = 'news';
        }
        
        // Add AI response as a tip
        const newTip: AITip = {
          id: `ai-tip-${Date.now()}`,
          text: response.content,
          source,
          timestamp: new Date().toISOString()
        };
        
        setAiTips(prev => [...prev.slice(-4), newTip]); // Keep last 5 tips
        
        // Store conversation ID for follow-ups
        if (response.conversationId) {
          setAiConversationId(response.conversationId);
        }
        
        // Also send as a chat message from AI
        sendMessage(`[AI Insight] ${response.content}`);
      }
    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      addToast("error", "AI Assistant is temporarily unavailable", "AI Error");
    } finally {
      setIsAiThinking(false);
    }
  };
  
  // Trigger AI when panel opens
  useEffect(() => {
    if (showAiPanel && aiTips.length === 0) {
      askAI();
    }
  }, [showAiPanel]);

  return (
    <div
      className={`contest-chat flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      <div className="chat-header bg-gray-800/90 p-3 border-b border-gray-700/80 flex justify-between items-center backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white flex items-center">
          Contest Chat
          <motion.span 
            className="w-2 h-2 rounded-full bg-green-500 ml-2"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </h3>
        <div className="text-sm text-gray-400 flex items-center">
          <span className="mr-2">{participants.length} Participants</span>
          {adminType && (
            <span
              className={`mr-2 px-2 py-0.5 rounded text-xs ${getAdminBadgeStyle(adminType as any)}`}
            >
              {adminType === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          )}
          
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`mr-2 p-1 rounded transition-colors ${
              showAiPanel
                ? "bg-cyber-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            title="AI Assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.659 1.591L19.5 14.5M9.75 3.104c.251.023.501.05.75.082m0 0a24.301 24.301 0 004.5 0m0 0v5.714a2.25 2.25 0 001.659 1.591L19.5 14.5M19.5 14.5v-2.25a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v2.25m5.25 0h-10.5a2.25 2.25 0 00-2.25 2.25v4.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-2.25-2.25z" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-1 rounded transition-colors ${
              showParticipants
                ? "bg-brand-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            title="Toggle participants list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {showAiPanel && (
            <motion.div
              ref={aiAgentRef}
              className="ai-assistant-panel absolute right-4 top-2 z-10 w-72 bg-gray-800/95 border border-cyber-500/50 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-3 bg-cyber-900/50 border-b border-cyber-500/30 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-cyber-800 flex items-center justify-center">
                    <img 
                      src="/ai-assistant.png" 
                      alt="AI Assistant" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_PROFILE_PICTURE}ai-assistant`;
                      }}
                    />
                  </div>
                  <span className="font-medium text-cyber-300">DegenDuelAI</span>
                </div>
                <button 
                  onClick={() => setShowAiPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-3">
                <p className="text-sm text-gray-300 mb-3">
                  I'm your trading assistant for this contest. I'll provide market insights and tips to help you make better trading decisions.
                </p>
                
                {/* AI Thinking Indicator */}
                {_isAiThinking && (
                  <div className="flex items-center justify-center py-2 mb-2">
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-cyber-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyber-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyber-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-cyber-400">Analyzing...</span>
                  </div>
                )}
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {aiTips.length === 0 && !_isAiThinking && (
                    <div className="text-center py-4 text-xs text-gray-500">
                      No insights yet. Click below to get started!
                    </div>
                  )}
                  {aiTips.map((tip: AITip) => (
                    <motion.div 
                      key={tip.id} 
                      className="p-2 rounded-md border border-cyber-500/20 bg-cyber-900/20 text-xs text-gray-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center mb-1">
                        {tip.source === "market-insight" && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-cyber-900/60 text-cyber-400 mr-1">INSIGHT</span>
                        )}
                        {tip.source === "trading-tip" && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-900/60 text-green-400 mr-1">TIP</span>
                        )}
                        {tip.source === "sentiment" && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-900/60 text-yellow-400 mr-1">SENTIMENT</span>
                        )}
                        {tip.source === "news" && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-400 mr-1">NEWS</span>
                        )}
                        {tip.timestamp && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {new Date(tip.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {tip.text}
                    </motion.div>
                  ))}
                </div>
                
                {/* Quick Action Buttons */}
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => askAI("What's the current market sentiment?")}
                    disabled={_isAiThinking}
                    className="w-full text-xs py-1.5 px-2 bg-cyber-900/50 hover:bg-cyber-800/50 text-cyber-300 rounded border border-cyber-500/30 transition-colors disabled:opacity-50"
                  >
                    Market Sentiment
                  </button>
                  <button
                    onClick={() => askAI("Give me a trading tip for this contest")}
                    disabled={_isAiThinking}
                    className="w-full text-xs py-1.5 px-2 bg-cyber-900/50 hover:bg-cyber-800/50 text-cyber-300 rounded border border-cyber-500/30 transition-colors disabled:opacity-50"
                  >
                    Trading Tip
                  </button>
                  <button
                    onClick={() => askAI("What are the latest crypto news?")}
                    disabled={_isAiThinking}
                    className="w-full text-xs py-1.5 px-2 bg-cyber-900/50 hover:bg-cyber-800/50 text-cyber-300 rounded border border-cyber-500/30 transition-colors disabled:opacity-50"
                  >
                    Latest News
                  </button>
                  <button
                    onClick={() => askAI()}
                    disabled={_isAiThinking}
                    className="w-full text-xs py-1.5 px-2 bg-brand-600 hover:bg-brand-500 text-white rounded font-medium transition-colors disabled:opacity-50"
                  >
                    Get Fresh Insight
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showParticipants && (
            <motion.div 
              className="participants-sidebar w-1/3 max-w-[200px] bg-gray-800/70 border-r border-gray-700/50 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              initial={{ opacity: 0, x: -40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "30%" }}
              exit={{ opacity: 0, x: -40, width: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Participants
              </h4>
              <div className="space-y-1">
                <div className="flex items-center p-2 rounded-md bg-cyber-900/20 border border-cyber-500/30">
                  <div className="w-6 h-6 rounded-full mr-2 relative overflow-hidden bg-cyber-800 flex items-center justify-center">
                    <img 
                      src="/ai-assistant.png" 
                      alt="AI Assistant" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_PROFILE_PICTURE}ai-assistant`;
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-cyber-400/10"
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-sm text-cyber-300 truncate">DegenDuelAI</span>
                  <span className="ml-1 text-xs text-cyber-400">★</span>
                </div>
                
                {participants.map((participant: ChatParticipant) => (
                  <motion.div
                    key={participant.user_id}
                    className="flex items-center p-2 rounded-md hover:bg-gray-700/50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={getProfilePicture(participant.user_id, participant.username)}
                      alt={participant.username}
                      className={`w-6 h-6 rounded-full mr-2 ${
                        (participant.role === 'admin' || participant.role === 'superadmin') ? "ring-1 ring-red-500" : ""
                      }`}
                    />
                    <span className={`text-sm truncate ${
                      (participant.role === 'admin' || participant.role === 'superadmin') ? "text-red-400" : "text-gray-300"
                    }`}>
                      {participant.username}
                    </span>
                    {(participant.role === 'admin' || participant.role === 'moderator' || participant.role === 'superadmin') && (
                      <span className="ml-1 text-xs text-red-400">★</span>
                    )}
                  </motion.div>
                ))}
                {isLoading && participants.length === 0 && <div className="text-xs text-gray-500">Loading...</div>}
                {!isLoading && participants.length === 0 && <div className="text-xs text-gray-500">No participants</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`messages-container flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${
            showParticipants ? "w-2/3" : "w-full"
          }`}
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <div className="mb-4">
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: [0.8, 1.1, 0.9, 1],
                    opacity: [0.5, 1, 0.8, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </motion.svg>
              </div>
              <p>No messages yet. Be the first to say hello!</p>
              <p className="text-xs mt-2 text-gray-600">
                Press Ctrl+Enter to send messages quickly
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, index) => {
                  const senderBadge = getMessageSenderBadge(msg);
                  const isAdminMessage = msg.user_role === 'admin' || msg.user_role === 'superadmin' || msg.user_role === 'moderator';
                  const isCurrentUserMsg = msg.user_id === currentUserId;

                  return (
                    <motion.div
                      key={msg.id}
                      className={`message mb-3 p-3 rounded-lg transition-all duration-300 hover:shadow-md ${
                        getMessageStyle(msg)
                      } ${getAiMessageEffects(msg)}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: index === messages.length - 1 ? 0 : 0 }}
                    >
                      <div className="flex items-start">
                        <img
                          src={msg.profile_picture || getProfilePicture(msg.user_id, msg.username)}
                          alt={msg.username}
                          className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${
                            isAdminMessage ? "ring-2 ring-red-500/70" : ""
                          } ${msg.user_id === 'ai-agent' ? "ring-2 ring-cyber-500/70" : ""}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className={`font-semibold text-sm ${
                              msg.user_id === 'ai-agent' || msg.is_system ? 'text-cyber-300' :
                              isAdminMessage ? 'text-red-400' :
                              isCurrentUserMsg ? 'text-brand-400' : 'text-gray-200'
                            }`}>
                              {msg.username}
                            </span>
                            {senderBadge && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${senderBadge.style}`}>
                                {senderBadge.text}
                              </span>
                            )}
                            <span className="ml-auto text-xs text-gray-500 hover:text-gray-400 transition-colors pl-2">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div className={`text-sm leading-relaxed ${
                             msg.user_id === 'ai-agent' || msg.is_system ? "text-gray-300 pl-1" : "text-gray-100"
                          }`}>
                            {(msg.user_id === 'ai-agent' || msg.is_system) && index === messages.length - 1 ? (
                              <TypewriterText text={msg.message ?? ''} speed={25} />
                            ) : (
                              msg.message ?? ''
                            )}
                          </div>
                        </div>
                      </div>
                      {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && !isCurrentUserMsg && !msg.is_system && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-end space-x-2">
                          <button 
                            onClick={() => handlePinMessage(msg)}
                            className="text-xs text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                            disabled={!isConnected || !pinMessage}
                            title={msg.is_pinned ? "Unpin Message" : "Pin Message"}
                          >
                            {msg.is_pinned ? "Unpin" : "Pin"}
                          </button>
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                            disabled={!isConnected || !deleteMessage}
                            title="Delete Message"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <ChatInput 
        onSendMessage={handleSendMessageInput} 
        disabled={isSendingMessage || !isConnected || isLoading}
      />
    </div>
  );
};

const TypewriterText: React.FC<{ text: string; speed: number }> = ({ text, speed }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);
  
  return (
    <>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span 
          className="inline-block h-4 w-1 bg-cyber-500/80 ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </>
  );
};