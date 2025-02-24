import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { useContestChatWebSocket } from "../../hooks/useContestChatWebSocket";

// Default profile picture URL
const DEFAULT_PROFILE_PICTURE =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=";

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
    currentUserId,
  } = useContestChatWebSocket(contestId);

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !isRateLimited) {
      sendMessage(messageText.trim());
      setMessageText("");
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

  // Check if the current user is an admin (for message styling)
  const isAdminUser = !!adminType;

  return (
    <div
      className={`contest-chat flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Header with room info */}
      <div className="chat-header bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
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
          {isMobile && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="ml-2 p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-300"
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
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages container */}
        <div className="messages-container flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
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
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`message mb-4 rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                  msg.isAdmin
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
                        className={`nickname font-semibold ${
                          msg.isAdmin
                            ? getAdminTextColor()
                            : msg.userId === currentUserId
                            ? "text-brand-400"
                            : "text-cyber-400"
                        }`}
                      >
                        {msg.nickname}
                      </span>
                      <span className="timestamp text-xs text-gray-500 ml-2">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className="content mt-1 text-white break-words">
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Participants list - hidden on mobile unless toggled */}
        {(!isMobile || showParticipants) && (
          <div
            className={`participants ${
              isMobile
                ? "absolute right-0 top-16 z-10 w-64 h-[calc(100%-120px)]"
                : "w-64"
            } bg-gray-800 p-4 border-l border-gray-700 hidden md:block overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 ${
              isMobile ? "!block" : ""
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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
                Participants
              </h4>
              {isMobile && (
                <button
                  onClick={() => setShowParticipants(false)}
                  className="text-gray-400 hover:text-white"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {participants.length === 0 ? (
              <div className="text-gray-500 text-sm">No participants yet</div>
            ) : (
              <ul className="space-y-3">
                {participants.map((p) => (
                  <li
                    key={p.userId}
                    className={`flex items-center ${
                      p.isAdmin ? getAdminTextColor() : "text-gray-300"
                    } hover:bg-gray-700/50 p-2 rounded-md transition-colors duration-200`}
                  >
                    <div className="relative mr-3">
                      <img
                        src={getProfilePicture(p.userId, p.profilePicture)}
                        alt={p.nickname}
                        className={`w-8 h-8 rounded-full ${
                          p.isAdmin ? "ring-2 ring-purple-500" : ""
                        }`}
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-gray-800"></div>
                    </div>
                    <span className={p.isAdmin ? "font-bold" : ""}>
                      {p.nickname}{" "}
                      {p.isAdmin && (
                        <span
                          className={`text-xs ${getAdminBadgeStyle()} px-1.5 py-0.5 rounded ml-1`}
                        >
                          Admin
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message bg-red-900/50 text-red-200 p-2 text-sm text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 inline-block mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Message input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-gray-800 border-t border-gray-700"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            maxLength={200}
            disabled={isRateLimited}
            placeholder={
              isAdminUser
                ? "Type your admin message..."
                : "Type your message..."
            }
            className={`flex-1 bg-gray-700 text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 ${getFocusRingColor()} border border-gray-600`}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isRateLimited}
            className={`${getSendButtonGradient()} text-white px-4 py-2 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <div className="char-counter text-xs text-gray-400 mt-1 text-right">
          {messageText.length}/200
          {messageText.length > 150 && (
            <span
              className={`ml-2 ${
                messageText.length > 180 ? "text-red-400" : "text-yellow-400"
              }`}
            >
              {messageText.length > 180
                ? "Almost at limit!"
                : "Getting close to limit"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
