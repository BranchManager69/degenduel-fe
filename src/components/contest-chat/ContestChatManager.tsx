import React, { useCallback, useEffect, useRef, useState } from "react";

import { FloatingContestChat } from "./FloatingContestChat";
import { useUserContests } from "../../hooks/useUserContests";
import { UserContest } from "../../services/contestService";

export const ContestChatManager: React.FC = () => {
  const { contests, loading } = useUserContests();
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [minimizedChats] = useState<Record<string, boolean>>({});
  const [isButtonExpanded, setIsButtonExpanded] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showContestSelector, setShowContestSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contestSelectorRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);

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
      handleUnreadUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "contest-chat-unread" as any,
        handleUnreadUpdate as EventListener,
      );
    };
  }, [minimizedChats]);

  // Handle WebSocket connection errors
  useEffect(() => {
    const handleWSError = (e: CustomEvent) => {
      if (e.detail.type === "error") {
        console.log("Connection error");
        // If the connection error is due to a missing contestId, show a different message
        if (e.detail.message.includes("Missing contestId")) {
          console.log("Missing contestId");
          setConnectionError("Please select a contest to start chatting.");
        } else {
          console.log("Chat connection lost. Trying to reconnect...");
          setConnectionError("Chat connection lost. Trying to reconnect...");
        }
      } else if (e.detail.type === "connection") {
        console.log("Connection established");
        setConnectionError(null);
      }
    };

    window.addEventListener("ws-debug" as any, handleWSError as EventListener);
    console.log("WebSocket connection listener added");

    return () => {
      window.removeEventListener(
        "ws-debug" as any,
        handleWSError as EventListener,
      );
      console.log("WebSocket connection listener removed");
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+C to toggle chat selector
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        setShowContestSelector((prev) => !prev);
        if (!showContestSelector && searchInputRef.current) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }

      // Escape to close contest selector
      if (e.key === "Escape" && showContestSelector) {
        setShowContestSelector(false);
      }

      // Alt+M to mark all as read
      if (e.altKey && e.key === "m" && totalUnreadCount > 0) {
        e.preventDefault();
        handleMarkAllAsRead();
      }

      // Alt+1-9 to switch between open chats
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0) {
        const chatIndex = parseInt(e.key) - 1;
        if (chatIndex < openChats.length) {
          e.preventDefault();
          handleActivateChat(openChats[chatIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showContestSelector, openChats, totalUnreadCount]);

  // Close contest selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showContestSelector &&
        contestSelectorRef.current &&
        !contestSelectorRef.current.contains(e.target as Node) &&
        chatButtonRef.current &&
        !chatButtonRef.current.contains(e.target as Node)
      ) {
        setShowContestSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showContestSelector]);

  // Handle closing a chat
  const handleCloseChat = (contestId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== contestId));

    // If the closed chat was active, set a new active chat
    if (activeChat === contestId) {
      const remainingChats = openChats.filter((id) => id !== contestId);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  // Handle activating a chat
  const handleActivateChat = (contestId: string) => {
    // If the chat isn't already open, add it to openChats
    if (!openChats.includes(contestId)) {
      setOpenChats((prev) => [...prev, contestId]);
    }
    setActiveChat(contestId);

    // On mobile, close the contest selector after selecting a chat
    if (isMobile) {
      setShowContestSelector(false);
    }
  };

  // Find contest by ID
  const getContestById = (contestId: string): UserContest | undefined => {
    return contests.find((contest) => contest.contestId === contestId);
  };

  // Mark all chats as read
  const handleMarkAllAsRead = useCallback(() => {
    setTotalUnreadCount(0);
    // Dispatch event to reset all unread counts
    window.dispatchEvent(new CustomEvent("contest-chat-mark-all-read"));
  }, []);

  // Filter contests based on search query
  const filteredContests = contests.filter((contest) =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group contests by status
  const groupedContests = {
    active: filteredContests.filter((contest) => contest.status === "active"),
    upcoming: filteredContests.filter(
      (contest) => contest.status === "upcoming",
    ),
    completed: filteredContests.filter(
      (contest) => contest.status === "completed",
    ),
    other: filteredContests.filter(
      (contest) =>
        !["active", "upcoming", "completed"].includes(contest.status || ""),
    ),
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
          ref={chatButtonRef}
          className={`group relative flex items-center ${
            isButtonExpanded ? "pr-4" : "pr-3"
          } pl-3 py-3 
            bg-gradient-to-r from-brand-600/90 to-cyber-600/90 hover:from-brand-500 hover:to-cyber-500
            text-white rounded-full shadow-lg transition-all duration-300 ease-in-out
            hover:shadow-xl hover:shadow-brand-500/20 transform hover:-translate-y-0.5`}
          onClick={() => {
            // Toggle contest selector
            setShowContestSelector(!showContestSelector);
            if (!showContestSelector && searchInputRef.current) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }}
          onMouseEnter={() => setIsButtonExpanded(true)}
          onMouseLeave={() => setIsButtonExpanded(false)}
          aria-label="Toggle chat"
          title="Toggle chat (Alt+C)"
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

      {/* Contest selector dropdown */}
      {showContestSelector && (
        <div
          ref={contestSelectorRef}
          className={`fixed z-40 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-brand-500/30 transition-all duration-300 ease-in-out
            ${
              isMobile
                ? "bottom-0 left-0 right-0 rounded-b-none max-h-[70vh] overflow-y-auto"
                : "bottom-1/3 right-16 w-72"
            }`}
          style={{
            transform: showContestSelector
              ? "translateY(0)"
              : "translateY(20px)",
            opacity: showContestSelector ? 1 : 0,
          }}
        >
          {/* Header with search */}
          <div className="p-3 border-b border-gray-700/50 sticky top-0 bg-gray-900/95 backdrop-blur-md z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">Contest Chats</h3>
              {totalUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
                  title="Mark all as read (Alt+M)"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div
              className={`relative ${
                isSearchFocused ? "ring-2 ring-brand-500/50 rounded-md" : ""
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search contests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
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
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>
                {filteredContests.length} contest
                {filteredContests.length !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-500">Alt+C to toggle</span>
            </div>
          </div>

          {/* Contest groups */}
          <div className="p-2 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {/* Active contests */}
            {groupedContests.active.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <h4 className="text-green-400 text-xs font-semibold uppercase tracking-wider">
                    Active
                  </h4>
                </div>
                {groupedContests.active.map((contest, index) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="text-sm truncate max-w-[180px]">
                        {contest.name}
                      </span>
                      {index < 9 && (
                        <span className="ml-2 text-xs text-gray-500">
                          Alt+{index + 1}
                        </span>
                      )}
                    </div>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Upcoming contests */}
            {groupedContests.upcoming.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <h4 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">
                    Upcoming
                  </h4>
                </div>
                {groupedContests.upcoming.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Completed contests */}
            {groupedContests.completed.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Completed
                  </h4>
                </div>
                {groupedContests.completed.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Other contests */}
            {groupedContests.other.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center px-2 py-1 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <h4 className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                    Other
                  </h4>
                </div>
                {groupedContests.other.map((contest) => (
                  <button
                    key={contest.contestId}
                    onClick={() => handleActivateChat(contest.contestId)}
                    className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all flex items-center justify-between
                      ${
                        openChats.includes(contest.contestId) &&
                        activeChat === contest.contestId
                          ? "bg-brand-600/30 text-white"
                          : "text-gray-300 hover:bg-gray-800/80"
                      }`}
                  >
                    <span className="text-sm truncate max-w-[180px]">
                      {contest.name}
                    </span>
                    {openChats.includes(contest.contestId) && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {filteredContests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p>No contests found matching "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Mobile drawer handle */}
          {isMobile && (
            <div className="w-full flex justify-center py-1 border-t border-gray-800">
              <div className="w-10 h-1 bg-gray-700 rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Floating chat windows */}
      {openChats.map((contestId, index) => {
        const contest = getContestById(contestId);
        if (!contest) return null;

        // On mobile, only show the active chat
        if (isMobile && activeChat !== contestId) return null;

        // Render the floating chat window
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
