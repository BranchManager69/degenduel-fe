import React from "react";
import { Contest } from "../../types";
import { ContestDifficulty } from "../landing/contests-preview/ContestDifficulty";
import { CountdownTimer } from "../ui/CountdownTimer";

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
  isContestLive,
}) => {
  return (
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/50">
        <div className="space-y-2 flex-1">
          {/* Contest title */}
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x">
            {contest.name}
          </h1>
          {/* Contest description */}
          <p className="text-lg text-gray-400 max-w-2xl">
            {contest.description}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-4">
          {/* Contest Style Badge */}
          <div className="flex-shrink-0">
            <ContestDifficulty
              difficulty={contest.settings.difficulty || "guppy"}
            />
          </div>

          {/* Desktop Action Button with Timer */}
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="text-xl font-bold text-brand-400 animate-pulse">
              <CountdownTimer
                targetDate={
                  isContestLive(contest) ? contest.end_time : contest.start_time
                }
                onComplete={onCountdownComplete}
                showSeconds={true}
              />
            </div>
            {isParticipating ? (
              <button
                onClick={onJoinContest}
                className="relative group px-8 py-4 bg-dark-300/80 border-l-2 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300 transition-all duration-300 transform hover:translate-x-1 font-bold text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span>Modify Portfolio</span>
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
            ) : isWalletConnected ? (
              <button
                onClick={onJoinContest}
                className="relative group px-8 py-4 bg-brand-500/20 border-l-2 border-brand-400/50 hover:border-brand-400 text-brand-400 hover:text-brand-300 transition-all duration-300 transform hover:translate-x-1 font-bold text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span>Draft Tokens for Portfolio</span>
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
            ) : (
              <button
                onClick={onJoinContest}
                className="relative group px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 border-l-2 border-brand-400/50 hover:border-brand-400 text-white font-bold text-lg overflow-hidden shadow-lg shadow-brand-500/30 animate-pulse-slow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span>Connect Wallet to Enter</span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
