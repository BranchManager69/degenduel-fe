import React, { useState } from "react";
import { useUserContests } from "../../hooks/useUserContests";
import { FloatingContestChat } from "../contest/FloatingContestChat";

// Define ContestStatus type based on UserContest
type ContestStatus = "upcoming" | "active" | "completed";

interface AdminChatManagerProps {
  userId?: string; // Make userId optional since useUserContests doesn't take parameters
}

export const AdminChatManager: React.FC<AdminChatManagerProps> = () => {
  const { contests, loading, error } = useUserContests();
  const [selectedContests, setSelectedContests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContestStatus | "all">(
    "all"
  );
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [activeContestId, setActiveContestId] = useState<string | null>(null);

  // Position management for floating chats
  const [chatPositions, setChatPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // Filter contests based on search term and status
  const filteredContests = contests.filter((contest) => {
    const matchesSearch = contest.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || contest.status === filterStatus;
    const matchesActive = !showActiveOnly || contest.status === "active";
    return matchesSearch && matchesStatus && matchesActive;
  });

  // Toggle a contest selection
  const toggleContestSelection = (contestId: string) => {
    setSelectedContests((prev) =>
      prev.includes(contestId)
        ? prev.filter((id) => id !== contestId)
        : [...prev, contestId]
    );

    // Initialize position for new chat if not already set
    if (!chatPositions[contestId]) {
      setChatPositions((prev) => ({
        ...prev,
        [contestId]: {
          x: 20 + Object.keys(prev).length * 30,
          y: 20 + Object.keys(prev).length * 30,
        },
      }));
    }

    // Set as active if it's being added
    if (!selectedContests.includes(contestId)) {
      setActiveContestId(contestId);
    }
  };

  // Update chat position - currently unused but keeping for future functionality
  // const updateChatPosition = (contestId: string, x: number, y: number) => {
  //   setChatPositions((prev) => ({
  //     ...prev,
  //     [contestId]: { x, y },
  //   }));
  // };

  // Close a chat
  const closeChat = (contestId: string) => {
    setSelectedContests((prev) => prev.filter((id) => id !== contestId));

    // If the closed chat was active, set a new active chat
    if (activeContestId === contestId) {
      const remainingContests = selectedContests.filter(
        (id) => id !== contestId
      );
      setActiveContestId(
        remainingContests.length > 0 ? remainingContests[0] : null
      );
    }
  };

  // Calculate position for each chat
  const getPositionIndex = (contestId: string) => {
    return selectedContests.indexOf(contestId);
  };

  return (
    <div className="admin-chat-manager bg-gray-900 text-white p-6 rounded-lg shadow-xl border-2 border-red-500/30">
      <div className="header mb-6">
        <h2 className="text-2xl font-bold text-red-400 mb-2 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 mr-2 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Admin Chat Manager
          <span className="ml-2 text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
            ADMIN ACCESS
          </span>
        </h2>
        <p className="text-gray-400">
          Monitor contest chats without being visible to participants
        </p>
      </div>

      {/* Controls */}
      <div className="controls bg-gray-800 p-4 rounded-lg mb-6 border border-red-700/30">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-gray-400 mb-1 text-sm">
              Search Contests
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contest name..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1 text-sm">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as ContestStatus | "all")
              }
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded"
              />
              <span className="text-gray-300">Show Active Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="loading text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading contests...</p>
        </div>
      ) : error ? (
        <div className="error bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
          <p>Error loading contests: {error}</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="no-contests text-center py-8 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No contests match your filters</p>
        </div>
      ) : (
        <div className="contests-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContests.map((contest) => (
            <div
              key={contest.contestId}
              className={`contest-card p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedContests.includes(contest.contestId)
                  ? "bg-red-900/20 border-red-500 shadow-lg shadow-red-900/20"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-800/70"
              }`}
              onClick={() => toggleContestSelection(contest.contestId)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white">{contest.name}</h3>
                <span
                  className={`status-badge px-2 py-1 text-xs rounded-full ${
                    contest.status === "active"
                      ? "bg-green-900/50 text-green-400"
                      : contest.status === "upcoming"
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {contest.status.charAt(0).toUpperCase() +
                    contest.status.slice(1)}
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-3">
                <div>Participants: {contest.participantCount || 0}</div>
                <div>Start: {new Date(contest.startTime).toLocaleString()}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  ID: {contest.contestId}
                </div>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    selectedContests.includes(contest.contestId)
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleContestSelection(contest.contestId);
                  }}
                >
                  {selectedContests.includes(contest.contestId)
                    ? "Unmonitor"
                    : "Monitor"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Chat Windows */}
      {selectedContests.map((contestId) => {
        const contest = contests.find((c) => c.contestId === contestId);
        if (!contest) return null;

        return (
          <div
            key={contestId}
            style={{
              position: "fixed",
              bottom: "0",
              right: `${getPositionIndex(contestId) * 320 + 20}px`,
              zIndex: 1000,
            }}
            className="admin-floating-chat"
          >
            <FloatingContestChat
              contest={contest}
              onClose={() => closeChat(contestId)}
              position={getPositionIndex(contestId)}
              isActive={activeContestId === contestId}
              onActivate={() => setActiveContestId(contestId)}
              adminType="admin" // Add this prop to indicate it's an admin
            />
          </div>
        );
      })}
    </div>
  );
};
