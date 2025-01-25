import { format, formatDuration, intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { API_URL } from "../../config/config";

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
  participant_count: number;
  min_participants: number;
  max_participants: number;
}

export function ContestsList() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return formatDuration(duration, { format: ["days", "hours"] });
  };

  const getTimeStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 0) {
      return (
        <span className="text-red-400">{Math.abs(diffInHours)}h overdue</span>
      );
    }
    if (diffInHours < 24) {
      return <span className="text-yellow-400">{diffInHours}h remaining</span>;
    }
    return (
      <span className="text-gray-400">
        {Math.floor(diffInHours / 24)}d {diffInHours % 24}h remaining
      </span>
    );
  };

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
      {contests.map((contest) => (
        <div
          key={contest.id}
          className="bg-dark-300/30 rounded-lg p-4 border border-dark-300 hover:border-cyber-500 transition-colors"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100">
                {contest.name}
              </h3>
              <p className="text-sm text-gray-400">
                Code: {contest.contest_code}
              </p>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
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
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">
                Start:{" "}
                <span className="text-gray-100">
                  {format(new Date(contest.start_time), "PPp")}
                </span>
                <span className="ml-2">
                  {getTimeStatus(contest.start_time)}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                End:{" "}
                <span className="text-gray-100">
                  {format(new Date(contest.end_time), "PPp")}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Duration:{" "}
                <span className="text-gray-100">
                  {getDuration(contest.start_time, contest.end_time)}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">
                Entry Fee:{" "}
                <span className="text-gray-100">${contest.entry_fee} USDC</span>
              </p>
              <p className="text-sm text-gray-400">
                Current Prize Pool:{" "}
                <span className="text-gray-100">
                  ${contest.current_prize_pool} USDC
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Potential Prize Pool:{" "}
                <span className="text-gray-100">
                  ${calculatePotentialPrizePool(contest)} USDC
                </span>
              </p>
            </div>
          </div>

          {/* Participants & Buckets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">
                Participants:{" "}
                <span className="text-gray-100">
                  {contest.participant_count}
                </span>
                <span className="text-gray-400"> / </span>
                <span className="text-gray-100">
                  {contest.max_participants}
                </span>
                <span className="text-gray-400">
                  {" "}
                  (min: {contest.min_participants})
                </span>
              </p>
              {contest.participant_count < contest.min_participants && (
                <p className="text-xs text-red-400">
                  Needs {contest.min_participants - contest.participant_count}{" "}
                  more participants
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Allowed Buckets:</p>
              <div className="grid grid-cols-9 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bucket) => (
                  <div
                    key={bucket}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
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
        </div>
      ))}
    </div>
  );
}
