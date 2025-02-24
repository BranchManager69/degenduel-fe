import React, { useEffect, useState } from "react";
import { useUserContests } from "../../hooks/useUserContests";
import { UserContest } from "../../services/contestService";
import { FloatingContestChat } from "./FloatingContestChat";

export const ContestChatManager: React.FC = () => {
  const { contests, loading } = useUserContests();
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [minimizedChats] = useState<Record<string, boolean>>({});
  const [isButtonExpanded, setIsButtonExpanded] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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

  // When contests change, don't auto-open chats - just update state
  useEffect(() => {
    if (!loading && contests.length > 0) {
      // No longer auto-open chats - only initialize active chat if needed
      if (!activeChat && contests.length > 0) {
        setActiveChat(contests[0].contestId);
      }
    }
  }, [contests, loading, activeChat]);

  // Update total unread count
  useEffect(() => {
    // This would be updated by the FloatingContestChat components
    const handleUnreadUpdate = (e: CustomEvent) => {
      setTotalUnreadCount((prev) => {
        const { contestId, count, action } = e.detail;
        if (action === "set") {
          return (
            prev -
            (minimizedChats[contestId]
              ? Number(minimizedChats[contestId])
              : 0) +
            Number(count)
          );
        } else if (action === "increment") {
          return prev + 1;
        } else if (action === "reset") {
          return (
            prev -
            (minimizedChats[contestId] ? Number(minimizedChats[contestId]) : 0)
          );
        }
        return prev;
      });
    };

    window.addEventListener(
      "contest-chat-unread" as any,
      handleUnreadUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "contest-chat-unread" as any,
        handleUnreadUpdate as EventListener
      );
    };
  }, [minimizedChats]);

  // Handle WebSocket connection errors
  useEffect(() => {
    const handleWSError = (e: CustomEvent) => {
      if (e.detail.type === "error") {
        setConnectionError("Chat connection lost. Trying to reconnect...");
      } else if (e.detail.type === "connection") {
        setConnectionError(null);
      }
    };

    window.addEventListener("ws-debug" as any, handleWSError as EventListener);

    return () => {
      window.removeEventListener(
        "ws-debug" as any,
        handleWSError as EventListener
      );
    };
  }, []);

  const handleCloseChat = (contestId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== contestId));

    // If the closed chat was active, set a new active chat
    if (activeChat === contestId) {
      const remainingChats = openChats.filter((id) => id !== contestId);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  const handleActivateChat = (contestId: string) => {
    // When activating a chat, make sure it's the only one open
    setOpenChats([contestId]);
    setActiveChat(contestId);
  };

  // Find contest by ID
  const getContestById = (contestId: string): UserContest | undefined => {
    return contests.find((contest) => contest.contestId === contestId);
  };

  // If no contests or all chats are closed, don't render anything
  if (loading || contests.length === 0) {
    return null;
  }

  return (
    <>
      {/* Connection error notification */}
      {connectionError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-pulse">
          {connectionError}
        </div>
      )}

      {/* Chat toggle button - positioned higher on the page */}
      <div className="fixed bottom-1/3 right-4 z-50">
        <button
          className={`group relative flex items-center ${
            isButtonExpanded ? "pr-4" : "pr-3"
          } pl-3 py-3 
            bg-gradient-to-r from-brand-600/90 to-cyber-600/90 hover:from-brand-500 hover:to-cyber-500
            text-white rounded-full shadow-lg transition-all duration-300 ease-in-out
            hover:shadow-xl hover:shadow-brand-500/20 transform hover:-translate-y-0.5`}
          onClick={() => {
            // Toggle chats open/closed
            if (openChats.length === 0) {
              // Only open first contest chat
              if (contests.length > 0) {
                setOpenChats([contests[0].contestId]);
                setActiveChat(contests[0].contestId);
              }
            } else {
              // Close all chats
              setOpenChats([]);
              setActiveChat(null);
            }
          }}
          onMouseEnter={() => setIsButtonExpanded(true)}
          onMouseLeave={() => setIsButtonExpanded(false)}
        >
          {/* Animated glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 to-cyber-400/20 animate-pulse-slow"></div>

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${
                isButtonExpanded ? "mr-2" : ""
              } transition-all duration-300`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>

            {/* Text that appears on hover */}
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                ${
                  isButtonExpanded
                    ? "max-w-24 opacity-100"
                    : "max-w-0 opacity-0"
                }`}
            >
              {contests.length} Contest{contests.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Notification badge */}
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Floating chat windows */}
      {openChats.map((contestId, index) => {
        const contest = getContestById(contestId);
        if (!contest) return null;

        // On mobile, only show the active chat
        if (isMobile && activeChat !== contestId) return null;

        return (
          <FloatingContestChat
            key={contestId}
            contest={contest}
            position={isMobile ? 0 : index}
            isActive={activeChat === contestId}
            onActivate={() => handleActivateChat(contestId)}
            onClose={() => handleCloseChat(contestId)}
            className={isMobile ? "w-full left-0 right-0 mx-auto" : ""}
          />
        );
      })}
    </>
  );
};
