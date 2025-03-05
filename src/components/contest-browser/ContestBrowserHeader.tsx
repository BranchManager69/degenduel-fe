import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

interface ContestBrowserHeaderProps {
  onCreateContest: () => void;
}

export const ContestBrowserHeader: React.FC<ContestBrowserHeaderProps> = ({
  onCreateContest,
}) => {
  const { user } = useAuth();

  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(127,0,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-200/50 via-transparent to-dark-200/50" />
      </div>

      {/* Content Container */}
      <div className="relative p-8 sm:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 relative group">
              <span className="relative inline-block">
                <span className="absolute -inset-2 bg-gradient-to-r from-brand-400/20 to-brand-600/20 blur-lg group-hover:blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x">
                  Active Duels
                </span>
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto relative group">
              <span className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
              <span className="relative">
                Join live duels, compete with other degens, and prove your worth
                in the ultimate token trading competition.
              </span>
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-400">
                  <span className="font-medium text-gray-300">24</span> Live
                  Duels
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-gray-400">
                  <span className="font-medium text-gray-300">142</span> Degens
                  Online
                </span>
              </div>
            </div>

            {/* Create Contest Button (Administrators Only) */}
            {user?.is_admin && (
              <Button
                onClick={onCreateContest}
                className="relative group px-6 py-2.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span>Create New Duel</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </span>
              </Button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button className="px-4 py-1.5 rounded-full bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 hover:border-brand-400/50 hover:text-brand-400 transition-all duration-300">
              All Duels
            </button>
            <button className="px-4 py-1.5 rounded-full bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 hover:border-brand-400/50 hover:text-brand-400 transition-all duration-300">
              Upcoming
            </button>
            <button className="px-4 py-1.5 rounded-full bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 hover:border-brand-400/50 hover:text-brand-400 transition-all duration-300">
              Live Now
            </button>
            <button className="px-4 py-1.5 rounded-full bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 hover:border-brand-400/50 hover:text-brand-400 transition-all duration-300">
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-400/5 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/5 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
};
