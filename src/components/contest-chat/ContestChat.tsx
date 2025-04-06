import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useContestChatWebSocket } from "../../hooks/websocket/useContestChatWebSocket";

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

interface ContestChatProps {
  contestId: string;
  className?: string;
  onNewMessage?: () => void;
  adminType?: "admin" | "superadmin"; // Optional admin type for styling
}

interface ChatMessage {
  messageId: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
  isAiAgent?: boolean;
  profilePicture?: string;
}

interface AITip {
  id: string;
  text: string;
  source: "market-insight" | "trading-tip" | "sentiment" | "news";
}

// AI agent tips and insights
const AI_TIPS: AITip[] = [
  {
    id: "tip1",
    text: "SOL showing strong momentum, volume increasing 37% in the last hour.",
    source: "market-insight"
  },
  {
    id: "tip2",
    text: "Most profitable portfolios have diversified between 3-5 assets in this contest.",
    source: "trading-tip"
  },
  {
    id: "tip3",
    text: "Market sentiment shifting bullish on Layer 1s after recent price action.",
    source: "sentiment"
  },
  {
    id: "tip4",
    text: "BREAKING: Federal Reserve hints at possible rate cut in upcoming meeting.",
    source: "news"
  },
  {
    id: "tip5",
    text: "AI analysis shows consolidation pattern forming on BTC, potential breakout within 24hrs.",
    source: "market-insight"
  }
];

export const ContestChat: React.FC<ContestChatProps> = ({
  contestId,
  className = "",
  onNewMessage,
  adminType,
}) => {
  const {
    participants,
    messages: websocketMessages,
    isRateLimited,
    error,
    sendMessage,
    leaveRoom,
    currentUserId
  } = useContestChatWebSocket(contestId);
  
  // Local state to handle real messages + AI messages
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const aiAgentRef = useRef<HTMLDivElement>(null);

  // Properly clean up when component unmounts
  useEffect(() => {
    return () => {
      console.log(`[ContestChat] Closing WebSocket for contest ${contestId}`);
      leaveRoom();
    };
  }, [contestId, leaveRoom]);

  // Combine websocket messages with AI agent messages
  useEffect(() => {
    setAllMessages([...websocketMessages]);
    
    // Show AI intro message if not seen yet
    if (websocketMessages.length > 0 && !hasSeenIntro) {
      setTimeout(() => {
        const aiIntroMessage: ChatMessage = {
          messageId: `ai-intro-${Date.now()}`,
          userId: "ai-agent",
          nickname: "DegenDuelAI",
          text: "Hello traders! I'll be providing market insights and trading tips throughout this contest. Good luck!",
          timestamp: new Date().toISOString(),
          isAiAgent: true,
          profilePicture: "/ai-assistant.png" // You'll need to add this image
        };
        
        setAllMessages(prev => [...prev, aiIntroMessage]);
        setHasSeenIntro(true);
      }, 3000);
    }
    
    // Periodically add AI tips
    if (hasSeenIntro && websocketMessages.length > 3) {
      const randomTipInterval = Math.floor(Math.random() * (120000 - 60000)) + 60000; // 1-2 minutes
      
      const tipTimer = setTimeout(() => {
        const randomTip = AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)];
        const aiTipMessage: ChatMessage = {
          messageId: `ai-tip-${Date.now()}`,
          userId: "ai-agent",
          nickname: "DegenDuelAI",
          text: randomTip.text,
          timestamp: new Date().toISOString(),
          isAiAgent: true,
          profilePicture: "/ai-assistant.png"
        };
        
        setAllMessages(prev => [...prev, aiTipMessage]);
      }, randomTipInterval);
      
      return () => clearTimeout(tipTimer);
    }
  }, [websocketMessages, hasSeenIntro]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Call onNewMessage if messages length increased and callback exists
    if (allMessages.length > prevMessagesLengthRef.current && onNewMessage) {
      onNewMessage();
    }

    prevMessagesLengthRef.current = allMessages.length;
  }, [allMessages, onNewMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      
      // Also hide AI panel when clicking outside
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
  }, [showEmojiPicker, showAiPanel]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter to send message
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !isRateLimited && !isSending) {
      setIsSending(true);
      sendMessage(messageText.trim());
      setMessageText("");

      // Reset sending state after a short delay
      setTimeout(() => {
        setIsSending(false);
        // Focus the input after sending
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 300);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    // Focus the input after selecting emoji
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Format time for messages
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "just now";
    }
  };

  // Get profile picture URL
  const getProfilePicture = (userId: string, profilePicture?: string) => {
    return profilePicture || `${DEFAULT_PROFILE_PICTURE}${userId}`;
  };

  // Get admin badge styling based on admin type
  const getAdminBadgeStyle = (messageType?: "admin" | "superadmin" | "ai") => {
    if (messageType === "superadmin" || adminType === "superadmin") {
      return "bg-yellow-900/50 text-yellow-300 border border-yellow-700/30";
    } else if (messageType === "admin" || adminType === "admin") {
      return "bg-red-900/50 text-red-300 border border-red-700/30";
    } else if (messageType === "ai") {
      return "bg-cyber-900/50 text-cyber-300 border border-cyber-700/30";
    } else {
      return "bg-purple-900/50 text-purple-300";
    }
  };

  // Get message styling based on type
  const getMessageStyle = (message: ChatMessage) => {
    if (message.isAiAgent) {
      return "bg-cyber-900/20 border-l-2 border-cyber-500";
    } else if (message.isAdmin && adminType === "superadmin") {
      return "bg-yellow-900/20 border-l-2 border-yellow-500";
    } else if (message.isAdmin) {
      return "bg-red-900/20 border-l-2 border-red-500";
    } else if (message.userId === currentUserId) {
      return "bg-brand-900/20 border-l-2 border-brand-500";
    } else {
      return "bg-gray-800/50";
    }
  };

  // Get text color based on user type
  const getTextColor = (message: ChatMessage) => {
    if (message.isAiAgent) {
      return "text-cyber-300";
    } else if (message.isAdmin && adminType === "superadmin") {
      return "text-yellow-400";
    } else if (message.isAdmin) {
      return "text-red-400";
    } else if (message.userId === currentUserId) {
      return "text-brand-400";
    } else {
      return "text-white";
    }
  };

  // Get badge text
  const getBadgeText = (message: ChatMessage) => {
    if (message.isAiAgent) {
      return "AI AGENT";
    } else if (message.isAdmin && adminType === "superadmin") {
      return "Super Admin";
    } else if (message.isAdmin) {
      return "Admin";
    } else {
      return "Admin";
    }
  };

  // Generate AI-specific styling for message
  const getAiMessageEffects = (message: ChatMessage) => {
    if (!message.isAiAgent) return "";
    return "shadow-[0_0_10px_rgba(49,200,180,0.2)] bg-gradient-to-r from-cyber-900/30 to-cyber-800/10";
  };

  return (
    <div
      className={`contest-chat flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Header with room info */}
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
          <span className="mr-2">{participants.length} online</span>
          {adminType && (
            <span
              className={`mr-2 px-2 py-0.5 rounded text-xs ${getAdminBadgeStyle(adminType as any)}`}
            >
              {adminType === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          )}
          
          {/* AI Assistant button */}
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
          
          {/* Participants toggle button */}
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
        {/* AI Assistant panel - conditionally shown */}
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
                
                <div className="space-y-2">
                  {AI_TIPS.map(tip => (
                    <div 
                      key={tip.id} 
                      className="p-2 rounded-md border border-cyber-500/20 bg-cyber-900/20 text-xs text-gray-300"
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
                      </div>
                      {tip.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participants sidebar - conditionally shown */}
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
                {/* AI Agent always included */}
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
                
                {/* Human participants */}
                {participants.map((participant) => (
                  <motion.div
                    key={participant.userId}
                    className="flex items-center p-2 rounded-md hover:bg-gray-700/50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={getProfilePicture(
                        participant.userId,
                        participant.profilePicture,
                      )}
                      alt={participant.nickname}
                      className={`w-6 h-6 rounded-full mr-2 ${
                        participant.isAdmin ? "ring-1 ring-red-500" : ""
                      }`}
                    />
                    <span className={`text-sm truncate ${
                      participant.isAdmin ? "text-red-400" : "text-gray-300"
                    }`}>
                      {participant.nickname}
                    </span>
                    {participant.isAdmin && (
                      <span className="ml-1 text-xs text-red-400">★</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages container */}
        <div
          className={`messages-container flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${
            showParticipants ? "w-2/3" : "w-full"
          }`}
        >
          {allMessages.length === 0 ? (
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
                {allMessages.map((msg, index) => (
                  <motion.div
                    key={msg.messageId}
                    className={`message mb-4 rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                      getMessageStyle(msg)
                    } ${getAiMessageEffects(msg)}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.4,
                      delay: index === allMessages.length - 1 ? 0 : 0
                    }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 relative">
                        {/* Profile picture with effects for special users */}
                        <div className="relative">
                          <img
                            src={getProfilePicture(msg.userId, msg.profilePicture)}
                            alt={msg.nickname}
                            className={`w-8 h-8 rounded-full ${
                              msg.isAiAgent
                                ? "ring-2 ring-cyber-500"
                                : msg.isAdmin && adminType === "superadmin"
                                  ? "ring-2 ring-yellow-500"
                                  : msg.isAdmin
                                    ? "ring-2 ring-red-500"
                                    : msg.userId === currentUserId
                                      ? "ring-2 ring-brand-500"
                                      : ""
                            }`}
                          />
                          
                          {/* Animated effects for AI agent */}
                          {msg.isAiAgent && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-cyber-400"
                              initial={{ scale: 1 }}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [1, 0, 1]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: 1,
                                repeatType: "reverse"
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span
                            className={`font-medium ${getTextColor(msg)}`}
                          >
                            {msg.nickname}
                          </span>
                          {(msg.isAdmin || msg.isAiAgent) && (
                            <span
                              className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                getAdminBadgeStyle(
                                  msg.isAiAgent 
                                    ? "ai" 
                                    : msg.isAdmin && adminType === "superadmin" 
                                      ? "superadmin" 
                                      : "admin"
                                )
                              }`}
                            >
                              {getBadgeText(msg)}
                            </span>
                          )}
                          <span className="ml-2 text-xs text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div className={`mt-1 text-gray-300 break-words relative ${
                          msg.isAiAgent ? "pl-2 border-l-2 border-cyber-500/30" : ""
                        }`}>
                          {/* AI message typing animation */}
                          {msg.isAiAgent && index === allMessages.length - 1 ? (
                            <TypewriterText text={msg.text} speed={25} />
                          ) : (
                            msg.text
                          )}
                          
                          {/* Subtle animated background for AI messages */}
                          {msg.isAiAgent && (
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-r from-cyber-500/5 to-cyber-500/0 rounded-r"
                              animate={{ 
                                opacity: [0.1, 0.3, 0.1],
                                x: [0, 5, 0]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message input form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-gray-800/90 border-t border-gray-700/80 backdrop-blur-sm"
      >
        {error && (
          <motion.div 
            className="mb-2 text-red-500 text-sm bg-red-900/20 p-2 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
        {isRateLimited && (
          <motion.div 
            className="mb-2 text-yellow-500 text-sm bg-yellow-900/20 p-2 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            Please wait a moment before sending another message.
          </motion.div>
        )}
        <div className="relative">
          <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={`w-full bg-gray-700 text-white rounded-md px-3 py-2 pr-24 resize-none focus:outline-none focus:ring-2 ${
              adminType === "superadmin" 
                ? "focus:ring-yellow-500" 
                : adminType === "admin" 
                  ? "focus:ring-red-500" 
                  : "focus:ring-brand-500"
            } transition-all`}
            rows={2}
            disabled={isRateLimited || isSending}
          />

          {/* Emoji picker button */}
          <div className="absolute right-16 bottom-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              title="Add emoji"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Enhanced emoji picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-10 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 w-64 z-10"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400">Quick Emojis</span>
                  <button 
                    className="text-xs text-gray-400 hover:text-white"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "😀", "😂", "😊", "😍", "🤔", "😎", "👍", "👏",
                    "🎉", "🔥", "❤️", "👋", "🙏", "🤝", "💪", "🚀",
                    "✅", "⭐", "💰", "💎", "🌙", "📈", "📉", "🤑"
                  ].map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-xl p-1 hover:bg-gray-700 rounded transition-colors"
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.2 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
                
                {/* Trading-specific emojis */}
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-400 block mb-1">Trading</span>
                  <div className="grid grid-cols-8 gap-1">
                    {[
                      "📈", "📉", "💸", "💰", "💵", "💴", "💶", "💷",
                      "🪙", "💎", "⏰", "⚡", "🔍", "🏆", "🥇", "🚀"
                    ].map((emoji) => (
                      <motion.button
                        key={`trading-${emoji}`}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl p-1 hover:bg-gray-700 rounded transition-colors"
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || isRateLimited || isSending}
            className={`absolute right-2 bottom-2 ${
              adminType === "superadmin"
                ? "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500"
                : adminType === "admin"
                  ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
                  : "bg-gradient-to-r from-brand-600 to-cyber-600 hover:from-brand-500 hover:to-cyber-500"
            } text-white px-3 py-1 rounded transition-all duration-300 
              ${
                !messageText.trim() || isRateLimited || isSending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-md"
              }`}
          >
            {isSending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center">
                Send
                <span className="ml-1 text-xs opacity-70">(Ctrl+Enter)</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Typewriter text effect component for AI messages
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