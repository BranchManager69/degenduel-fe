import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { ContestDifficulty } from "../landing/contests-preview/ContestDifficulty";
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
      className="group relative bg-dark-200/80 backdrop-blur-sm border border-dark-300 hover:border-brand-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10 rounded-lg overflow-hidden"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Enhanced Header with Banner Style */}
      <div className="relative p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-100 truncate pr-2 group-hover:text-brand-300 transition-colors hover:text-brand-400 cursor-pointer">
              {contest.name}
            </h3>
            <p className="text-sm font-medium text-brand-300">
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
          </div>

          {/* Badge Stack - Properly Spaced */}
          <div className="flex flex-col items-end gap-2">
            {/* Status Badge - Hidden when active as we'll use the corner effect */}
            {displayStatus !== "active" && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
              >
                {getStatusText()}
              </span>
            )}

            {/* Entered Badge */}
            {contest.is_participating && (
              <div className="flex items-center gap-1 bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full border border-brand-400/20">
                <FaCheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">Entered</span>
              </div>
            )}
          </div>
          
          {/* Live Corner Effect */}
          {displayStatus === "active" && (
            <div className="absolute top-0 right-0 overflow-hidden">
              <div className="w-24 h-24 flex items-center justify-center rotate-45 translate-x-[40px] translate-y-[-40px] bg-gradient-to-br from-green-500/80 to-green-600/80 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
                <p className="text-white font-bold text-xs rotate-[-45deg] translate-y-[40px] translate-x-[-25px]">
                  LIVE
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contest Description - aligned to top */}
        <div className="relative py-2 flex flex-col justify-start h-[48px]">
          <p
            className="text-sm text-gray-400 line-clamp-2"
            title={contest.description}
          >
            {contest.description || "No description available"}
          </p>
        </div>

        {/* Entry Fee and Prize Pool side by side with enhanced styling */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm text-gray-400">Entry Fee</span>
            <div className="text-2xl font-bold text-gray-200 group-hover:text-brand-300 transition-colors">
              {formatCurrency(Number(contest.entry_fee))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-gray-400">Prize Pool</span>
            <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text group-hover:animate-gradient-x">
              {formatCurrency(Number(contest.prize_pool))}
            </div>
          </div>
        </div>

        {/* Players Progress with enhanced styling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Players</span>
            <span className="text-sm font-medium text-gray-300">
              {contest.participant_count}/{contest.max_participants}
            </span>
          </div>
          <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${
                  (Number(contest.participant_count) /
                    contest.max_participants) *
                  100
                }%`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </div>
        </div>

        {/* Use ContestButton component */}
        <ContestButton
          id={Number(contest.id)}
          type={displayStatus === "active" ? "live" : "upcoming"}
        />

        {/* Reference code in bottom right corner */}
        <div className="absolute bottom-1.5 right-2">
          <p className="text-[10px] text-gray-500">{contest.contest_code}</p>
        </div>

        {/* Difficulty now as an expandable drawer at bottom */}
        <ContestDifficulty
          difficulty={contest.settings?.difficulty || "unknown"}
        />
      </div>
    </div>
  );
};
