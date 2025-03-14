import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";

import { useContestChatWebSocket } from "../../hooks/useContestChatWebSocket";

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE =
  "https://api.dicebear.com/7.x/avataaars/svg?seed="; // TODO: change to user's profile picture

interface ContestChatProps {
  contestId: string;
  className?: string;
  onNewMessage?: () => void;
  adminType?: "admin" | "superadmin"; // Optional admin type for styling
}

export const ContestChat: React.FC<ContestChatProps> = ({
  contestId,
  className = "",
  onNewMessage,
  adminType,
}) => {
  const {
    participants,
    messages,
    isRateLimited,
    error,
    sendMessage,
    leaveRoom, // Use leaveRoom instead of close
    currentUserId
  } = useContestChatWebSocket(contestId);
  
  // Properly clean up the WebSocket connection when component unmounts
  useEffect(() => {
    return () => {
      console.log(`[ContestChat] Closing WebSocket for contest ${contestId}`);
      leaveRoom(); // Leave the room when unmounting
    };
  }, [contestId, leaveRoom]);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Call onNewMessage if messages length increased and callback exists
    if (messages.length > prevMessagesLengthRef.current && onNewMessage) {
      onNewMessage();
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, onNewMessage]);

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
    };

    // Add event listener for clicking outside the emoji picker
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

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

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "just now";
    }
  };

  // Get profile picture URL, using default if none provided
  const getProfilePicture = (userId: string, profilePicture?: string) => {
    return profilePicture || `${DEFAULT_PROFILE_PICTURE}${userId}`;
  };

  // Get admin badge styling based on admin type
  const getAdminBadgeStyle = () => {
    if (adminType === "superadmin") {
      return "bg-yellow-900/50 text-yellow-300 border border-yellow-700/30";
    } else if (adminType === "admin") {
      return "bg-red-900/50 text-red-300 border border-red-700/30";
    } else {
      return "bg-purple-900/50 text-purple-300";
    }
  };

  // Get admin message styling based on admin type
  const getAdminMessageStyle = () => {
    if (adminType === "superadmin") {
      return "bg-yellow-900/20 border-l-2 border-yellow-500";
    } else if (adminType === "admin") {
      return "bg-red-900/20 border-l-2 border-red-500";
    } else {
      return "bg-purple-900/20 border-l-2 border-purple-500";
    }
  };

  // Get admin text color based on admin type
  const getAdminTextColor = () => {
    if (adminType === "superadmin") {
      return "text-yellow-400";
    } else if (adminType === "admin") {
      return "text-red-400";
    } else {
      return "text-purple-400";
    }
  };

  // Get send button gradient based on admin type
  const getSendButtonGradient = () => {
    if (adminType === "superadmin") {
      return "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500";
    } else if (adminType === "admin") {
      return "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400";
    } else {
      return "bg-gradient-to-r from-brand-600 to-cyber-600 hover:from-brand-500 hover:to-cyber-500";
    }
  };

  // Get focus ring color based on admin type
  const getFocusRingColor = () => {
    if (adminType === "superadmin") {
      return "focus:ring-yellow-500";
    } else if (adminType === "admin") {
      return "focus:ring-red-500";
    } else {
      return "focus:ring-brand-500";
    }
  };

  // Get admin badge text
  const getAdminBadgeText = () => {
    if (adminType === "superadmin") {
      return "Super Admin";
    } else if (adminType === "admin") {
      return "Admin";
    } else {
      return "Admin";
    }
  };

  return (
    <div
      className={`contest-chat flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Header with room info */}
      <div className="chat-header bg-gray-800/90 p-3 border-b border-gray-700/80 flex justify-between items-center backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white">Contest Chat</h3>
        <div className="text-sm text-gray-400 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {participants.length} online
          {adminType && (
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs ${getAdminBadgeStyle()}`}
            >
              {getAdminBadgeText()}
            </span>
          )}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`ml-2 p-1 rounded transition-colors ${
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

      <div className="flex flex-1 overflow-hidden">
        {/* Participants sidebar - conditionally shown */}
        {showParticipants && (
          <div className="participants-sidebar w-1/3 max-w-[200px] bg-gray-800/70 border-r border-gray-700/50 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              Participants
            </h4>
            <div className="space-y-1">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center p-2 rounded-md hover:bg-gray-700/50 transition-colors"
                >
                  <img
                    src={getProfilePicture(
                      participant.userId,
                      participant.profilePicture,
                    )}
                    alt={participant.nickname}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-300 truncate">
                    {participant.nickname}
                  </span>
                  {participant.isAdmin && (
                    <span className="ml-1 text-xs text-purple-400">★</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages container */}
        <div
          className={`messages-container flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${
            showParticipants ? "w-2/3" : "w-full"
          }`}
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-600 animate-pulse-slow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p>No messages yet. Be the first to say hello!</p>
              <p className="text-xs mt-2 text-gray-600">
                Press Ctrl+Enter to send messages quickly
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`message mb-4 rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                    (msg.isAdmin)
                      ? getAdminMessageStyle()
                      : msg.userId === currentUserId
                        ? "self-message bg-brand-900/20 border-l-2 border-brand-500"
                        : "bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <img
                        src={getProfilePicture(msg.userId, msg.profilePicture)}
                        alt={msg.nickname}
                        className={`w-8 h-8 rounded-full ${
                          msg.isAdmin
                            ? "ring-2 ring-purple-500"
                            : msg.userId === currentUserId
                              ? "ring-2 ring-brand-500"
                              : ""
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${
                            msg.isAdmin
                              ? getAdminTextColor()
                              : msg.userId === currentUserId
                                ? "text-brand-400"
                                : "text-white"
                          }`}
                        >
                          {msg.nickname}
                        </span>
                        {msg.isAdmin && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${getAdminBadgeStyle()}`}
                          >
                            {getAdminBadgeText()}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-gray-500">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-300 break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
          <div className="mb-2 text-red-500 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
        {isRateLimited && (
          <div className="mb-2 text-yellow-500 text-sm bg-yellow-900/20 p-2 rounded">
            Please wait a moment before sending another message.
          </div>
        )}
        <div className="relative">
          <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={`w-full bg-gray-700 text-white rounded-md px-3 py-2 pr-24 resize-none focus:outline-none focus:ring-2 ${getFocusRingColor()} transition-all`}
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

            {/* Simple emoji picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-10 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-64 z-10"
              >
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "😀",
                    "😂",
                    "😊",
                    "😍",
                    "🤔",
                    "😎",
                    "👍",
                    "👏",
                    "🎉",
                    "🔥",
                    "❤️",
                    "👋",
                    "🙏",
                    "🤝",
                    "💪",
                    "🚀",
                    "✅",
                    "⭐",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-xl p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || isRateLimited || isSending}
            className={`absolute right-2 bottom-2 ${getSendButtonGradient()} text-white px-3 py-1 rounded transition-all duration-300 
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
