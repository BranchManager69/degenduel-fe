import { format, formatDuration, intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { API_URL } from "../../config/config";

// Helper function to format SOL amounts consistently
const formatSolAmount = (
  amount: string | number | null | undefined
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

  const getDuration = (start: string, end: string) => {
    const duration = intervalToDuration({
      start: new Date(start),
      end: new Date(end),
    });
    return formatDuration(duration, { format: ["days", "hours", "minutes"] });
  };

  const getTimeStatus = (dateStr: string, type: "start" | "end") => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60)
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyber-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-dark-300/20 rounded">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSort("start_time")}
          className={`px-3 py-1 rounded text-sm ${
            sortField === "start_time"
              ? "bg-cyber-500 text-white"
              : "bg-dark-300 text-gray-400"
          }`}
        >
          Sort by Start Time{" "}
          {sortField === "start_time" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("end_time")}
          className={`px-3 py-1 rounded text-sm ${
            sortField === "end_time"
              ? "bg-cyber-500 text-white"
              : "bg-dark-300 text-gray-400"
          }`}
        >
          Sort by End Time{" "}
          {sortField === "end_time" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("prize_pool")}
          className={`px-3 py-1 rounded text-sm ${
            sortField === "prize_pool"
              ? "bg-cyber-500 text-white"
              : "bg-dark-300 text-gray-400"
          }`}
        >
          Sort by Prize Pool{" "}
          {sortField === "prize_pool" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("participant_count")}
          className={`px-3 py-1 rounded text-sm ${
            sortField === "participant_count"
              ? "bg-cyber-500 text-white"
              : "bg-dark-300 text-gray-400"
          }`}
        >
          Sort by Participants{" "}
          {sortField === "participant_count" &&
            (sortDirection === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {sortedContests.map((contest) => (
        <div
          key={contest.id}
          className="bg-dark-300/30 rounded-lg p-4 sm:p-6 border border-dark-300 hover:border-cyber-500 transition-colors"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-100 break-words">
                {contest.name}
              </h3>
              <p className="text-sm text-gray-400">
                Code: {contest.contest_code}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor:
                    contest.status === "active"
                      ? "rgba(16, 185, 129, 0.1)"
                      : contest.status === "pending"
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                  color:
                    contest.status === "active"
                      ? "rgb(16, 185, 129)"
                      : contest.status === "pending"
                      ? "rgb(245, 158, 11)"
                      : "rgb(239, 68, 68)",
                }}
              >
                {contest.status.toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bucket) => (
                  <div
                    key={bucket}
                    title={
                      contest.bucket_contents && contest.bucket_contents[bucket]
                        ? `Bucket ${bucket}: ${contest.bucket_contents[
                            bucket
                          ].join(", ")}`
                        : `Bucket ${bucket} (Empty)`
                    }
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                      contest.allowed_buckets.includes(bucket)
                        ? "bg-cyber-500/20 text-cyber-400 border border-cyber-500"
                        : "bg-dark-300 text-gray-500 border border-dark-300"
                    }`}
                  >
                    {bucket}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time & Prize Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Start Time:</p>
                  <p className="text-sm text-gray-100">
                    {format(new Date(contest.start_time), "PPp")}
                  </p>
                </div>
                <div className="text-sm">
                  {getTimeStatus(contest.start_time, "start")}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">End Time:</p>
                  <p className="text-sm text-gray-100">
                    {format(new Date(contest.end_time), "PPp")}
                  </p>
                </div>
                <div className="text-sm">
                  {getTimeStatus(contest.end_time, "end")}
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Duration:{" "}
                <span className="text-gray-100">
                  {getDuration(contest.start_time, contest.end_time)}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-400 flex justify-between">
                <span>Entry Fee:</span>
                <span className="text-gray-100">
                  {formatSolAmount(contest.entry_fee)} SOL
                </span>
              </p>
              <p className="text-sm text-gray-400 flex justify-between">
                <span>Current Prize Pool:</span>
                <span className="text-gray-100">
                  {formatSolAmount(contest.current_prize_pool)} SOL
                </span>
              </p>
              <p className="text-sm text-gray-400 flex justify-between">
                <span>Potential Prize Pool:</span>
                <span className="text-gray-100">
                  {formatSolAmount(calculatePotentialPrizePool(contest))} SOL
                </span>
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Participants:</span>
                <span
                  className={`text-sm ${
                    contest.participant_count < contest.min_participants
                      ? "text-red-400"
                      : "text-gray-100"
                  }`}
                >
                  {contest.participant_count} / {contest.max_participants}
                  {contest.participant_count < contest.min_participants && (
                    <span className="ml-2">
                      (need{" "}
                      {contest.min_participants - contest.participant_count}{" "}
                      more)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
