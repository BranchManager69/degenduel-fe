import React, { useEffect, useState } from "react";
import { UserContest } from "../../services/contestService";
import { ContestChat } from "./ContestChat";

// Default contest icon based on contest type
const getContestIcon = (contestId: string, contestName: string) => {
  // Use the contest name to generate a consistent icon
  const seed = contestName.replace(/\s+/g, "-").toLowerCase() || contestId;
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=0984e3`;
};

interface FloatingContestChatProps {
  contest: UserContest;
  onClose: () => void;
  position: number;
  isActive: boolean;
  onActivate: () => void;
  adminType?: "admin" | "superadmin"; // Optional admin type for styling
  className?: string;
}

export const FloatingContestChat: React.FC<FloatingContestChatProps> = ({
  contest,
  onClose,
  position,
  isActive,
  onActivate,
  adminType,
  className = "",
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Reset unread count when chat becomes active and expanded
  useEffect(() => {
    if (isActive && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isActive, isMinimized]);

  // Listen for "mark all as read" event
  useEffect(() => {
    const handleMarkAllAsRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener(
      "contest-chat-mark-all-read" as any,
      handleMarkAllAsRead as EventListener
    );

    return () => {
      window.removeEventListener(
        "contest-chat-mark-all-read" as any,
        handleMarkAllAsRead as EventListener
      );
    };
  }, []);

  const handleToggleMinimize = () => {
    if (isMinimized) {
      // When expanding, make this chat active
      onActivate();
    }
    setIsMinimized(!isMinimized);
  };

  // Calculate position from right with increased spacing
  const rightPosition = `${position * 340 + 20}px`;

  // Calculate vertical position - place higher on page
  const bottomPosition = "calc(33.33vh + 56px)";

  // Get status color based on contest status
  const getStatusColor = () => {
    switch (contest.status) {
      case "active":
        return "bg-green-500";
      case "upcoming":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get header gradient based on admin type
  const getHeaderGradient = () => {
    if (adminType === "superadmin") {
      return isActive
        ? "bg-gradient-to-r from-yellow-700/95 to-amber-600/95 backdrop-blur-sm"
        : "bg-gray-800/90 hover:bg-gray-700/95 border-l-2 border-yellow-600/80 backdrop-blur-sm";
    } else if (adminType === "admin") {
      return isActive
        ? "bg-gradient-to-r from-red-700/95 to-red-600/95 backdrop-blur-sm"
        : "bg-gray-800/90 hover:bg-gray-700/95 border-l-2 border-red-600/80 backdrop-blur-sm";
    } else {
      return isActive
        ? "bg-gradient-to-r from-brand-600/95 to-cyber-600/95 backdrop-blur-sm shadow-brand-500/20 shadow-inner"
        : "bg-gray-800/90 hover:bg-gray-700/95 backdrop-blur-sm";
    }
  };

  // Get icon animation based on admin type
  const getIconAnimation = () => {
    if (adminType === "superadmin") {
      return isActive ? "animate-pulse-slow ring-2 ring-yellow-500" : "";
    } else if (adminType === "admin") {
      return isActive ? "animate-pulse-slow ring-2 ring-red-500" : "";
    } else {
      return isActive ? "animate-pulse-slow" : "";
    }
  };

  // Get badge color based on admin type
  const getBadgeColor = () => {
    if (adminType === "superadmin") {
      return "bg-yellow-500 text-black";
    } else if (adminType === "admin") {
      return "bg-red-500 text-white";
    } else {
      return "bg-red-500 text-white";
    }
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-xl ${className}`}
      style={{
        right: className?.includes("w-full") ? "0" : rightPosition,
        bottom: className?.includes("w-full") ? "0" : bottomPosition,
        width: className?.includes("w-full") ? "100%" : "300px",
        height: isMinimized ? "48px" : "450px",
        opacity: isActive ? 0.95 : 0.7,
        maxWidth: className?.includes("w-full") ? "100%" : "300px",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Chat header - always visible */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer rounded-t-lg transition-all duration-300 ${getHeaderGradient()}`}
        onClick={() => {
          if (!isActive) {
            onActivate();
          } else {
            handleToggleMinimize();
          }
        }}
      >
        <div className="flex items-center">
          <div className="mr-2 flex-shrink-0 relative">
            <img
              src={getContestIcon(contest.contestId, contest.name)}
              alt={contest.name}
              className={`w-7 h-7 rounded-full ${getIconAnimation()}`}
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor()}`}
            ></div>
          </div>
          <div className="flex items-center">
            <h3 className="font-medium text-white truncate max-w-[160px]">
              {contest.name}
            </h3>
            {unreadCount > 0 && (
              <span
                className={`ml-2 ${getBadgeColor()} text-xs rounded-full px-2 py-0.5 animate-pulse`}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMinimize();
            }}
            className={`text-white rounded p-1 mr-1 transition-colors duration-200
              ${isActive ? "hover:bg-opacity-80" : "hover:bg-gray-600"}`}
          >
            {isMinimized ? (
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-red-600 rounded p-1 transition-colors duration-200"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat content - only visible when not minimized */}
      {!isMinimized && (
        <div
          className={`${
            className?.includes("w-full")
              ? "h-[calc(100vh-120px)]"
              : "h-[402px]"
          } bg-gray-900/95 rounded-b-lg overflow-hidden shadow-lg border border-brand-500/30`}
        >
          <ContestChat
            contestId={contest.contestId}
            onNewMessage={() => {
              if (!isActive || isMinimized) {
                setUnreadCount((prev) => prev + 1);
                // Dispatch event for ContestChatManager to update total unread count
                window.dispatchEvent(
                  new CustomEvent("contest-chat-unread", {
                    detail: {
                      contestId: contest.contestId,
                      action: "increment",
                    },
                  })
                );
              }
            }}
            adminType={adminType}
          />
        </div>
      )}
    </div>
  );
};
