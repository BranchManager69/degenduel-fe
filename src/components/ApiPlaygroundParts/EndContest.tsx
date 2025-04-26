import { format } from "date-fns";
import { useEffect, useState } from "react";

import { API_URL } from "../../config/config";

interface Contest {
  id: number;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  contest_code: string;
}

export function EndContest() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/contests?status=active`, {
        credentials: "include",
      });

      if (response.status === 503) {
        // Handle maintenance mode
        setContests([]);
        return;
      }

      const data = await response.json();
      setContests(Array.isArray(data.contests) ? data.contests : []);
    } catch (err) {
      console.error("Error fetching contests:", err);
      setError("Failed to fetch contests");
      setContests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEndContest = async () => {
    if (!selectedContest) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/contests/${selectedContest.id}/end`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        // Check for specific error messages
        if (data.error) {
          throw new Error(`Cannot end contest: ${data.error}`);
        } else {
          throw new Error("Failed to end contest");
        }
      }

      setSuccess(`Contest "${selectedContest.name}" ended successfully`);
      setSelectedContest(null);
      setShowConfirmation(false);
      fetchContests(); // Refresh the list
    } catch (err: any) {
      console.error("End contest error:", err);
      setError(err.message || "Failed to end contest");
      setShowConfirmation(false); // Hide confirmation on error
    } finally {
      setLoading(false);
    }
  };

  const handleContestSelect = (contestId: string) => {
    const contest = contests.find((c) => c.id.toString() === contestId);
    setSelectedContest(contest || null);
    setShowConfirmation(false);
    setError(null);
    setSuccess(null);
  };

  const getTimeStatus = (contest: Contest) => {
    const endTime = new Date(contest.end_time);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (endTime.getTime() - now.getTime()) / (1000 * 60),
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 0) {
      // Overdue
      const absMinutes = Math.abs(diffInMinutes);
      const absHours = Math.floor(absMinutes / 60);
      const absDays = Math.floor(absHours / 24);
      const remainingHours = absHours % 24;
      const remainingMinutes = absMinutes % 60;

      if (absDays > 0) {
        return `${absDays}d ${remainingHours}h overdue`;
      } else if (absHours > 0) {
        return `${absHours}h ${remainingMinutes}m overdue`;
      }
      return `${absMinutes}m overdue`;
    }

    // Remaining time
    const remainingHours = diffInHours % 24;
    const remainingMinutes = diffInMinutes % 60;

    if (diffInDays > 0) {
      return `${diffInDays}d ${remainingHours}h remaining`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ${remainingMinutes}m remaining`;
    }
    return `${diffInMinutes}m remaining`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Select Contest to End
        </label>
        <select
          value={selectedContest?.id || ""}
          onChange={(e) => handleContestSelect(e.target.value)}
          className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded text-gray-100 focus:outline-none focus:border-cyber-500 transition-colors"
        >
          {contests.length === 0 ? (
            <option value="" className="bg-dark-200 text-gray-400">
              No active contests available
            </option>
          ) : (
            <>
              <option value="" className="bg-dark-200 text-gray-400">
                Select a contest...
              </option>
              {contests.map((contest) => {
                const endTime = new Date(contest.end_time);
                const now = new Date();
                const isOverdue = endTime < now;
                return (
                  <option
                    key={contest.id}
                    value={contest.id}
                    className="bg-dark-200 text-gray-100"
                  >
                    {contest.name} ({contest.contest_code}) -{" "}
                    {isOverdue ? (
                      <span className="text-red-400">
                        {getTimeStatus(contest)}
                      </span>
                    ) : (
                      <span>{getTimeStatus(contest)}</span>
                    )}
                  </option>
                );
              })}
            </>
          )}
        </select>
      </div>

      {selectedContest && !showConfirmation && (
        <div className="p-4 bg-dark-300/50 rounded space-y-3">
          <h3 className="text-gray-100 font-medium">{selectedContest.name}</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-400">
              Code:{" "}
              <span className="text-gray-100">
                {selectedContest.contest_code}
              </span>
            </p>
            <p className="text-gray-400">
              Started:{" "}
              <span className="text-gray-100">
                {format(new Date(selectedContest.start_time), "PPp")}
              </span>
            </p>
            <p className="text-gray-400">
              Scheduled End:{" "}
              <span className="text-gray-100">
                {format(new Date(selectedContest.end_time), "PPp")}
              </span>
            </p>
            <p className="text-gray-400">
              Participants:{" "}
              <span className="text-gray-100">
                {selectedContest.participant_count}
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowConfirmation(true)}
            className="w-full px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 transition-colors"
          >
            End Contest
          </button>
        </div>
      )}

      {showConfirmation && selectedContest && (
        <div className="p-4 bg-dark-300/50 rounded space-y-3">
          <h3 className="text-gray-100 font-medium">Confirm End Contest</h3>
          <p className="text-gray-400">
            Are you sure you want to end "{selectedContest.name}"?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleEndContest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Ending..." : "Confirm End"}
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-dark-300/20 rounded">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-dark-300/20 rounded">
          <p className="text-green-400">{success}</p>
        </div>
      )}
    </div>
  );
}
