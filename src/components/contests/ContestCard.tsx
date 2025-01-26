import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { formatCurrency } from "../../lib/utils";
import type { Contest, ContestStatus } from "../../types";
import { ContestDifficulty } from "../landing/contests/ContestDifficulty";
import { CountdownTimer } from "../ui/CountdownTimer";

interface ContestCardProps {
  contest: Contest;
  onClick?: () => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  onClick,
}) => {
  // Calculate actual status based on timestamps
  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);

  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;

  let displayStatus: ContestStatus = contest.status;
  if (contest.status !== "cancelled") {
    if (hasEnded) {
      displayStatus = "completed";
    } else if (hasStarted) {
      displayStatus = "active";
    } else {
      displayStatus = "pending";
    }
  }

  const getStatusColor = () => {
    switch (displayStatus) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusText = () => {
    switch (displayStatus) {
      case "active":
        return "Live";
      case "pending":
        return "Upcoming";
      case "completed":
        return "Ended";
      case "cancelled":
        return "Cancelled";
      default:
        return displayStatus;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-dark-200/80 backdrop-blur-sm border border-dark-300 hover:border-brand-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10 rounded-lg p-6 cursor-pointer animate-cyber-scan"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg animate-data-stream" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-1 group-hover:animate-glitch">
              {contest.name}
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              {hasEnded ? (
                "Contest Ended"
              ) : (
                <>
                  {hasStarted ? "Ends in " : "Starts in "}
                  <CountdownTimer
                    targetDate={
                      hasStarted ? contest.end_time : contest.start_time
                    }
                    onComplete={() => {
                      console.log("Timer completed");
                    }}
                    showSeconds={true}
                  />
                </>
              )}
            </p>
            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
              {contest.description}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${
                displayStatus === "active" ? "animate-cyber-pulse" : ""
              }`}
            >
              {getStatusText()}
            </span>
            <ContestDifficulty difficulty={contest.settings.difficulty} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text group-hover:animate-neon-flicker">
                {formatCurrency(Number(contest.prize_pool))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Entry Fee</p>
              <p className="text-lg font-semibold text-gray-200">
                {formatCurrency(Number(contest.entry_fee))}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Players</span>
              <span className="text-sm font-medium text-gray-300">
                {contest.participant_count}/{contest.max_participants}
              </span>
            </div>
            <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-600 transform transition-transform duration-500 ease-out rounded-full group-hover:animate-data-stream"
                style={{
                  width: `${
                    (Number(contest.participant_count) /
                      contest.max_participants) *
                    100
                  }%`,
                }}
              />
              {/* Animated shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Min Trades:</span>
              <span className="font-medium text-gray-200">
                {contest.settings.min_trades}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Contest Code: {contest.contest_code}
            </span>
          </div>
        </div>

        {contest.is_participating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full">
            <FaCheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Entered</span>
          </div>
        )}
      </div>
    </div>
  );
};
