// src/components/contest-detail/ContestDetailHeader.tsx

/**
 * Contest Detail Header Component
 * 
 * @description This component is used to display the contest detail header
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-02-14
 * @updated 2025-05-08
 */

import React from "react";
import { Link } from "react-router-dom";
import { Contest } from "../../types";
import { CountdownTimer } from "../ui/CountdownTimer";
import { ShareContestButton } from "./ShareContestButton";

interface ContestDetailHeaderProps {
  contest: Contest;
  isParticipating: boolean;
  isWalletConnected: boolean;
  onJoinContest: () => void;
  onCountdownComplete: () => void;
  isContestLive: (contest: Contest) => boolean;
}

export const ContestDetailHeader: React.FC<ContestDetailHeaderProps> = ({
  contest,
  isParticipating,
  isWalletConnected,
  onJoinContest,
  onCountdownComplete,
  // isContestLive is not used directly because we calculate status internally
}) => {
  // Determine the contest's current state
  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);

  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;

  // Contest status for UI display
  const contestStatus = hasEnded ? "ended" : hasStarted ? "live" : "upcoming";

  // Status badge styling
  const getStatusBadgeStyle = () => {
    switch (contestStatus) {
      case "live":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ended":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Button label based on wallet connection and contest status
  const getButtonLabel = () => {
    // Not connected - always show connect wallet
    if (!isWalletConnected) {
      return "Connect Wallet to Enter";
    }

    // Connected and participating
    if (isParticipating) {
      if (contestStatus === "ended") {
        return "View Results";
      } else if (contestStatus === "live") {
        return "View Live Contest";
      } else {
        return "Modify Portfolio";
      }
    }

    // Connected but not participating
    if (contestStatus === "ended") {
      return "Contest Ended";
    } else if (contestStatus === "live") {
      return "Contest in Progress";
    } else {
      return "Select Your Portfolio";
    }
  };

  // Button is disabled in these cases
  const isButtonDisabled = () => {
    return (
      !isWalletConnected ||
      (contestStatus === "ended" && !isParticipating) ||
      (contestStatus === "live" && !isParticipating)
    );
  };

  // Button styling based on state
  const getButtonStyle = () => {
    // Base styles
    const baseStyle =
      "relative group px-8 py-4 border-l-2 font-bold text-lg overflow-hidden transition-all duration-300";

    // Not connected - prominent connect style
    if (!isWalletConnected) {
      return `${baseStyle} bg-gradient-to-r from-brand-500 to-brand-600 border-brand-400/50 hover:border-brand-400 text-white shadow-lg shadow-brand-500/30 animate-pulse-slow`;
    }

    // Disabled state
    if (
      isButtonDisabled() &&
      (contestStatus === "ended" || contestStatus === "live")
    ) {
      return `${baseStyle} bg-dark-300/50 border-gray-500/30 text-gray-400 cursor-not-allowed`;
    }

    // Participating - already in the contest
    if (isParticipating) {
      if (contestStatus === "ended") {
        return `${baseStyle} bg-gray-500/20 border-gray-500/30 text-gray-300 hover:text-white hover:bg-gray-500/30 transform hover:translate-x-1`;
      } else if (contestStatus === "live") {
        return `${baseStyle} bg-green-500/20 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/30 transform hover:translate-x-1`;
      } else {
        return `${baseStyle} bg-dark-300/80 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300 transform hover:translate-x-1`;
      }
    }

    // Default - not participating but can join
    return `${baseStyle} bg-brand-500/20 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300 transform hover:translate-x-1`;
  };
  
  // Mobile-specific button styling (just the color part, not dimensions)
  const getMobileButtonColorStyle = () => {
    // Not connected - prominent connect style
    if (!isWalletConnected) {
      return `bg-gradient-to-r from-brand-500 to-brand-600 border-brand-400/50 hover:border-brand-400 text-white shadow-sm shadow-brand-500/30`;
    }

    // Disabled state
    if (
      isButtonDisabled() &&
      (contestStatus === "ended" || contestStatus === "live")
    ) {
      return `bg-dark-300/50 border-gray-500/30 text-gray-400 cursor-not-allowed`;
    }

    // Participating - already in the contest
    if (isParticipating) {
      if (contestStatus === "ended") {
        return `bg-gray-500/20 border-gray-500/30 text-gray-300 hover:text-white hover:bg-gray-500/30`;
      } else if (contestStatus === "live") {
        return `bg-green-500/20 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/30`;
      } else {
        return `bg-dark-300/80 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300`;
      }
    }

    // Default - not participating but can join
    return `bg-brand-500/20 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300`;
  };

  return (
    <div className="relative mb-8">
      {/* Breadcrumb navigation */}
      <div className="mb-4 flex items-center text-sm text-gray-400">
        <Link to="/" className="hover:text-brand-400 transition-colors">
          Home
        </Link>
        <span className="mx-2">›</span>
        <Link to="/contests" className="hover:text-brand-400 transition-colors">
          Contests
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{contest.name}</span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/50">
        <div className="space-y-2 flex-1">
          {/* Status badge - prominent above the title */}
          <div className="flex items-center mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeStyle()}`}
            >
              {contestStatus === "upcoming"
                ? "Upcoming"
                : contestStatus === "live"
                  ? "Live Now"
                  : "Ended"}
            </span>
          </div>

          {/* Contest title */}
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x">
            {contest.name}
          </h1>

          {/* Contest description */}
          <p className="text-lg text-gray-400 max-w-2xl">
            {contest.description}
          </p>
        </div>

        {/* Contest Details */}
        <div className="flex flex-col md:flex-row items-end gap-4">
          {/* Prize Distribution Badge */}
          <div className="flex-shrink-0">
            <div className="text-xs text-gray-500 italic">(Difficulty/Prize display TBD)</div>
          </div>

          {/* Desktop Action Button with Timer */}
          <div className="hidden md:flex flex-col items-end gap-2">
            {/* Timer with clear label */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {contestStatus === "upcoming"
                  ? "Starts in:"
                  : contestStatus === "live"
                    ? "Ends in:"
                    : "Contest Ended"}
              </span>
              {contestStatus !== "ended" ? (
                <div className="text-xl font-bold text-brand-400 animate-pulse">
                  <CountdownTimer
                    targetDate={
                      contestStatus === "live"
                        ? contest.end_time
                        : contest.start_time
                    }
                    onComplete={onCountdownComplete}
                    showSeconds={true}
                  />
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-500">
                  {new Date(contest.end_time).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Dynamic Action Button */}
            <button
              onClick={onJoinContest}
              disabled={isButtonDisabled()}
              className={getButtonStyle()}
            >
              {/* Button Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <span className="relative flex items-center gap-2">
                <span>{getButtonLabel()}</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </button>
            
            {/* Desktop Share Button */}
            <ShareContestButton 
              contest={contest}
              contestStatus={contestStatus}
              className="mt-2"
            />
          </div>

          {/* Mobile Action Button with Timer */}
          <div className="flex md:hidden flex-col items-end gap-2">
            {/* Timer with label */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {contestStatus === "upcoming"
                  ? "Starts in:"
                  : contestStatus === "live"
                    ? "Ends in:"
                    : "Contest Ended"}
              </span>
              {contestStatus !== "ended" ? (
                <div className="text-xl font-bold text-brand-400 animate-pulse">
                  <CountdownTimer
                    targetDate={
                      contestStatus === "live"
                        ? contest.end_time
                        : contest.start_time
                    }
                    onComplete={onCountdownComplete}
                    showSeconds={true}
                  />
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-500">
                  {new Date(contest.end_time).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Mobile Action Button */}
            <button
              onClick={onJoinContest}
              disabled={isButtonDisabled()}
              className={`relative group w-full px-4 py-2 border-l-2 font-medium text-sm overflow-hidden transition-all duration-300 ${getMobileButtonColorStyle()}`}
            >
              {/* Button Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <span className="relative flex items-center gap-2">
                <span>{getButtonLabel()}</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </button>
            
            {/* Mobile Share Button */}
            <ShareContestButton 
              contest={contest}
              contestStatus={contestStatus}
              className="mt-2 w-full text-xs py-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
