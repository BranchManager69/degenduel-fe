// src/components/ApiPlaygroundParts/ContestsList.tsx

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { API_URL } from "../../config/config";

// Helper function to format SOL amounts consistently
const formatSolAmount = (
  amount: string | number | null | undefined,
): string => {
  const value = parseFloat(amount?.toString() || "0");
  return value.toFixed(2);
};

interface Contest {
  id: number;
  contest_code: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  status: string;
  current_prize_pool: string;
  allowed_buckets: number[];
  bucket_contents: { [key: number]: string[] };
  participant_count: number;
  min_participants: number;
  max_participants: number;
}

type SortField = "start_time" | "end_time" | "prize_pool" | "participant_count";

export function ContestsList() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("start_time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/contests`, {
        credentials: "include",
      });
      const data = await response.json();
      setContests(data.contests || []);
    } catch (err) {
      console.error("Error fetching contests:", err);
      setError("Failed to fetch contests");
    } finally {
      setLoading(false);
    }
  };

  const calculatePotentialPrizePool = (contest: Contest) => {
    const fee = parseFloat(contest.entry_fee);
    const maxParticipants = contest.max_participants;
    const total = fee * maxParticipants;
    // Assuming 10% platform fee
    return (total * 0.9).toFixed(2);
  };

  const getTimeStatus = (dateStr: string, type: "start" | "end") => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60),
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 0) {
      const absMinutes = Math.abs(diffInMinutes);
      const absHours = Math.floor(absMinutes / 60);
      const absDays = Math.floor(absHours / 24);
      const remainingHours = absHours % 24;
      const remainingMinutes = absMinutes % 60;

      if (type === "start") {
        return (
          <span className="text-red-400">
            Started{" "}
            {absDays > 0
              ? `${absDays}d ${remainingHours}h ago`
              : absHours > 0
                ? `${absHours}h ${remainingMinutes}m ago`
                : `${absMinutes}m ago`}
          </span>
        );
      } else {
        return (
          <span className="text-red-400">
            Ended{" "}
            {absDays > 0
              ? `${absDays}d ${remainingHours}h ago`
              : absHours > 0
                ? `${absHours}h ${remainingMinutes}m ago`
                : `${absMinutes}m ago`}
          </span>
        );
      }
    }

    const remainingHours = diffInHours % 24;
    const remainingMinutes = diffInMinutes % 60;

    if (type === "start") {
      return (
        <span className="text-yellow-400">
          Starts in{" "}
          {diffInDays > 0
            ? `${diffInDays}d ${remainingHours}h`
            : diffInHours > 0
              ? `${diffInHours}h ${remainingMinutes}m`
              : `${diffInMinutes}m`}
        </span>
      );
    } else {
      return (
        <span className="text-green-400">
          Ends in{" "}
          {diffInDays > 0
            ? `${diffInDays}d ${remainingHours}h`
            : diffInHours > 0
              ? `${diffInHours}h ${remainingMinutes}m`
              : `${diffInMinutes}m`}
        </span>
      );
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedContests = [...contests].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "start_time":
        return (
          (new Date(a.start_time).getTime() -
            new Date(b.start_time).getTime()) *
          multiplier
        );
      case "end_time":
        return (
          (new Date(a.end_time).getTime() - new Date(b.end_time).getTime()) *
          multiplier
        );
      case "prize_pool":
        return (
          (parseFloat(a.current_prize_pool) -
            parseFloat(b.current_prize_pool)) *
          multiplier
        );
      case "participant_count":
        return (a.participant_count - b.participant_count) * multiplier;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyber-500 border-t-transparent" />
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-cyber-500 opacity-20" />
        </div>
        <p className="ml-4 text-cyber-400 animate-pulse">Loading contests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-dark-300/20 rounded-lg border border-red-500/30 backdrop-blur-sm group hover:bg-dark-300/30 transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="text-2xl group-hover:animate-bounce">⚠️</span>
          <div>
            <p className="text-red-400 group-hover:animate-glitch">{error}</p>
            <button
              onClick={fetchContests}
              className="mt-2 px-4 py-2 bg-dark-400/50 hover:bg-dark-400 rounded text-neon-400 text-sm transition-all duration-300 hover:scale-105 group-hover:animate-cyber-pulse"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex flex-wrap gap-3 p-4 bg-dark-300/20 rounded-lg backdrop-blur-sm border border-dark-300/50">
        <button
          onClick={() => handleSort("start_time")}
          className={`px-4 py-2 rounded text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 group ${
            sortField === "start_time"
              ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20 animate-cyber-pulse"
              : "bg-dark-300/80 text-gray-400 hover:bg-dark-400 hover:text-white"
          }`}
        >
          <span className="group-hover:animate-glitch">Start Time</span>
          {sortField === "start_time" && (
            <span className="group-hover:animate-bounce">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
        <button
          onClick={() => handleSort("end_time")}
          className={`px-4 py-2 rounded text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 group ${
            sortField === "end_time"
              ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20 animate-cyber-pulse"
              : "bg-dark-300/80 text-gray-400 hover:bg-dark-400 hover:text-white"
          }`}
        >
          <span className="group-hover:animate-glitch">End Time</span>
          {sortField === "end_time" && (
            <span className="group-hover:animate-bounce">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
        <button
          onClick={() => handleSort("prize_pool")}
          className={`px-4 py-2 rounded text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 group ${
            sortField === "prize_pool"
              ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20 animate-cyber-pulse"
              : "bg-dark-300/80 text-gray-400 hover:bg-dark-400 hover:text-white"
          }`}
        >
          <span className="group-hover:animate-glitch">Prize Pool</span>
          {sortField === "prize_pool" && (
            <span className="group-hover:animate-bounce">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
        <button
          onClick={() => handleSort("participant_count")}
          className={`px-4 py-2 rounded text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 group ${
            sortField === "participant_count"
              ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20 animate-cyber-pulse"
              : "bg-dark-300/80 text-gray-400 hover:bg-dark-400 hover:text-white"
          }`}
        >
          <span className="group-hover:animate-glitch">Participants</span>
          {sortField === "participant_count" && (
            <span className="group-hover:animate-bounce">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
      </div>

      {/* Contest List */}
      <div className="grid gap-4">
        {sortedContests.map((contest) => (
          <div
            key={contest.id}
            className="p-6 bg-dark-300/20 rounded-lg backdrop-blur-sm border border-dark-300/50 hover:bg-dark-300/30 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-cyber-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />

            <div className="relative">
              {/* Contest Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-cyber-400 group-hover:animate-glitch mb-2">
                    {contest.name}
                  </h3>
                  <p className="text-neon-300 text-sm group-hover:animate-cyber-pulse">
                    {contest.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    Code: {contest.contest_code}
                  </p>
                  <p className="text-sm text-gray-400">
                    Status: {contest.status}
                  </p>
                </div>
              </div>

              {/* Contest Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Start Time</p>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-400">
                      {format(new Date(contest.start_time), "PPp")}
                    </span>
                    <span className="text-sm">
                      {getTimeStatus(contest.start_time, "start")}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">End Time</p>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-400">
                      {format(new Date(contest.end_time), "PPp")}
                    </span>
                    <span className="text-sm">
                      {getTimeStatus(contest.end_time, "end")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contest Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Entry Fee</p>
                  <p className="text-lg font-medium text-white group-hover:animate-cyber-pulse">
                    ◎ {formatSolAmount(contest.entry_fee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Current Prize Pool
                  </p>
                  <p className="text-lg font-medium text-white group-hover:animate-cyber-pulse">
                    ◎ {formatSolAmount(contest.current_prize_pool)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Max Prize Pool</p>
                  <p className="text-lg font-medium text-white group-hover:animate-cyber-pulse">
                    ◎ {calculatePotentialPrizePool(contest)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Participants</p>
                  <p className="text-lg font-medium text-white group-hover:animate-cyber-pulse">
                    {contest.participant_count} / {contest.max_participants}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
