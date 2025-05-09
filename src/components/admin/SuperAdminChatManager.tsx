// src/components/admin/SuperAdminChatManager.tsx

/**
 * This component is used to manage the chat windows for the superadmin.
 * It allows the superadmin to monitor and send messages to all contests.
 */

import React, { useState } from "react";

import { useUserContests } from "../../hooks/data/legacy/useUserContests";

// Define ContestStatus type based on UserContest
type ContestStatus = "upcoming" | "active" | "completed";

interface SuperAdminChatManagerProps {
  userId?: string; // Make userId optional since useUserContests doesn't take parameters
}

// Superadmin Chat Manager
export const SuperAdminChatManager: React.FC<
  SuperAdminChatManagerProps
> = () => {
  const { contests, loading, error } = useUserContests();
  const [selectedContests, setSelectedContests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContestStatus | "all">(
    "all",
  );
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState("");

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
        : [...prev, contestId],
    );
  };

  // Send broadcast message to all selected contests
  const sendBroadcastMessage = () => {
    if (!broadcastMessage.trim()) return;

    // Implementation would connect to your backend API
    console.log(
      `[SUPERADMIN BROADCAST] to contests ${selectedContests.join(
        ", ",
      )}: ${broadcastMessage}`,
    );

    // Here you would call your API endpoint to send admin messages
    // Example API call:
    // api.sendAdminBroadcast({
    //   contestIds: selectedContests,
    //   message: broadcastMessage,
    //   senderType: 'superadmin'
    // });

    // Clear the message input after sending
    setBroadcastMessage("");
  };

  // Send broadcast to ALL contests
  const sendGlobalBroadcast = () => {
    if (!broadcastMessage.trim()) return;

    // Implementation would connect to your backend API
    console.log(
      `[SUPERADMIN GLOBAL BROADCAST] to ALL contests: ${broadcastMessage}`,
    );

    // Here you would call your API endpoint to send admin messages
    // Example API call:
    // api.sendGlobalAdminBroadcast({
    //   message: broadcastMessage,
    //   senderType: 'superadmin'
    // });

    // Clear the message input after sending
    setBroadcastMessage("");
  };

  return (
    <div className="super-admin-chat-manager bg-gray-900 text-white p-6 rounded-lg shadow-xl border-2 border-yellow-500/30">
      <div className="header mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 mr-2 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Super Admin Chat Manager
          <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">
            GOLD ACCESS
          </span>
        </h2>
        <p className="text-gray-400">
          Monitor and manage contest chats without being visible to participants
        </p>
      </div>

      {/* Controls */}
      <div className="controls bg-gray-800 p-4 rounded-lg mb-6 border border-yellow-700/30">
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
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="mr-2 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded"
              />
              <span className="text-gray-300">Show Active Only</span>
            </label>
          </div>
        </div>

        {/* Broadcast message */}
        <div className="broadcast-form mt-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-600/30">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            Broadcast Message
            <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">
              SUPERADMIN ONLY
            </span>
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Send an admin message to{" "}
            {selectedContests.length > 0
              ? `${selectedContests.length} selected contest${
                  selectedContests.length !== 1 ? "s" : ""
                }`
              : "all contests (global broadcast)"}
          </p>

          <div className="flex flex-col space-y-2">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={sendGlobalBroadcast}
                disabled={!broadcastMessage.trim()}
                className="flex-1 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Global Broadcast
              </button>
              {selectedContests.length > 0 && (
                <button
                  onClick={sendBroadcastMessage}
                  disabled={!broadcastMessage.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Broadcast to Selected ({selectedContests.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="loading text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
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
                  ? "bg-yellow-900/20 border-yellow-500 shadow-lg shadow-yellow-900/20"
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
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
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

      {filteredContests.length > 0 && selectedContests.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-yellow-700/30">
          <h3 className="text-lg font-semibold text-yellow-400">Selected for Broadcast:</h3>
          <ul className="list-disc list-inside text-gray-300">
            {selectedContests.map(id => {
              const c = contests.find(co => co.contestId === id);
              return <li key={id}>{c ? c.name : id}</li>;
            })}
          </ul>
          <p className="text-xs text-gray-500 mt-2">SuperAdmin chat view simplified. Broadcast functionality retained. Full chat monitoring UI TBD.</p>
        </div>
      )}
    </div>
  );
};
