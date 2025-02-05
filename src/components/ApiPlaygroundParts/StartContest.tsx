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
  min_participants: number;
  contest_code: string;
}

export function StartContest() {
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
      const response = await fetch(`${API_URL}/contests?status=pending`, {
        credentials: "include",
      });
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

  const handleStartContest = async () => {
    if (!selectedContest) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/contests/${selectedContest.id}/start`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        // Check for specific error messages about participants
        if (data.error?.toLowerCase().includes("minimum participants")) {
          throw new Error(`Cannot start contest: ${data.error}`);
        } else if (
          selectedContest.participant_count < selectedContest.min_participants
        ) {
          throw new Error(
            `Cannot start contest: Needs ${
              selectedContest.min_participants -
              selectedContest.participant_count
            } more participants (minimum ${
              selectedContest.min_participants
            } required)`
          );
        } else {
          throw new Error(data.error || "Failed to start contest");
        }
      }

      setSuccess(`Contest "${selectedContest.name}" started successfully`);
      setSelectedContest(null);
      setShowConfirmation(false);
      fetchContests(); // Refresh the list
    } catch (err: any) {
      console.error("Start contest error:", err);
      setError(err.message || "Failed to start contest");
      setShowConfirmation(false); // Hide confirmation on error
    } finally {
      setLoading(false);
    }
  };

  const handleContestSelect = (contestId: string) => {
    const contest = contests.find((c) => c.id === parseInt(contestId));
    setSelectedContest(contest || null);
    setShowConfirmation(false);
    setError(null);
    setSuccess(null);
  };

  const getParticipantWarning = (contest: Contest) => {
    if (contest.participant_count === 0) {
      return {
        message: "Warning: No participants have joined this contest",
        type: "error",
      };
    } else if (contest.participant_count < contest.min_participants) {
      return {
        message: `Warning: Only ${contest.participant_count} of ${contest.min_participants} minimum participants have joined`,
        type: "warning",
      };
    }
    return null;
  };

  const getStartTimeStatus = (contest: Contest) => {
    const startTime = new Date(contest.start_time);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (startTime.getTime() - now.getTime()) / (1000 * 60)
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

    // Future
    const remainingHours = diffInHours % 24;
    const remainingMinutes = diffInMinutes % 60;

    if (diffInDays > 0) {
      return `starts in ${diffInDays}d ${remainingHours}h`;
    } else if (diffInHours > 0) {
      return `starts in ${diffInHours}h ${remainingMinutes}m`;
    }
    return `starts in ${diffInMinutes}m`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Select Contest to Start
        </label>
        <select
          value={selectedContest?.id || ""}
          onChange={(e) => handleContestSelect(e.target.value)}
          className="w-full px-4 py-2 bg-dark-200 border border-dark-300 rounded text-gray-100 focus:outline-none focus:border-cyber-500 transition-colors"
        >
          {contests.length === 0 ? (
            <option value="" className="bg-dark-200 text-gray-400">
              No pending contests available
            </option>
          ) : (
            <>
              <option value="" className="bg-dark-200 text-gray-400">
                Select a contest...
              </option>
              {contests.map((contest) => {
                const startTime = new Date(contest.start_time);
                const now = new Date();
                const isOverdue = startTime < now;
                return (
                  <option
                    key={contest.id}
                    value={contest.id}
                    className="bg-dark-200 text-gray-100"
                  >
                    {contest.name} ({contest.contest_code}) -{" "}
                    {contest.participant_count < contest.min_participants ? (
                      <span className="text-red-400">
                        {contest.participant_count}/{contest.min_participants}{" "}
                        participants
                      </span>
                    ) : (
                      <span>
                        {contest.participant_count}/{contest.min_participants}{" "}
                        participants
                      </span>
                    )}{" "}
                    -{" "}
                    {isOverdue ? (
                      <span className="text-yellow-400">
                        {getStartTimeStatus(contest)}
                      </span>
                    ) : (
                      <span>{getStartTimeStatus(contest)}</span>
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
              Scheduled Start:{" "}
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
                {selectedContest.participant_count} /{" "}
                {selectedContest.min_participants} minimum
              </span>
            </p>
            {getParticipantWarning(selectedContest) && (
              <p
                className={
                  getParticipantWarning(selectedContest)?.type === "warning"
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              >
                {getParticipantWarning(selectedContest)?.message}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowConfirmation(true)}
            className="w-full px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 transition-colors"
          >
            Start Contest
          </button>
        </div>
      )}

      {showConfirmation && selectedContest && (
        <div className="p-4 bg-dark-300/50 rounded space-y-3">
          <h3 className="text-gray-100 font-medium">Confirm Start Contest</h3>
          <p className="text-gray-400">
            Are you sure you want to start "{selectedContest.name}"?
          </p>
          {getParticipantWarning(selectedContest) && (
            <p
              className={
                getParticipantWarning(selectedContest)?.type === "warning"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              {getParticipantWarning(selectedContest)?.message}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleStartContest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Starting..." : "Confirm Start"}
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
