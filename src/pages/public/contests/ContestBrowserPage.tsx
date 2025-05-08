// src/pages/public/ContestBrowserPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ContestCard } from "../../../components/contest-browser/ContestCard";
import { ContestSort } from "../../../components/contest-browser/ContestSort";
import { CreateContestButton } from "../../../components/contest-browser/CreateContestButton";
import { CreateContestModal } from "../../../components/contest-browser/CreateContestModal";
import { AuthDebugPanel } from "../../../components/debug";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { ddApi } from "../../../services/dd-api";
import { Contest, ContestSettings } from "../../../types/index";
import type { SortDirection, SortField } from "../../../types/sort";

// Contest browser page
export const ContestBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useMigratedAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState<
    ContestSettings["difficulty"] | ""
  >("");
  const [sortField, setSortField] = useState<SortField>("start_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchContests = async () => {
    try {
      setLoading(true);

      // First check maintenance mode
      const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
      setIsMaintenanceMode(isInMaintenance);

      // If in maintenance mode, don't fetch contests
      if (isInMaintenance) {
        setError(
          "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
        );
        return;
      }

      const data = await ddApi.contests.getAll({
        field: sortField,
        direction: sortDirection,
      });
      setContests(data);
    } catch (error) {
      console.error("Failed to fetch contests:", error);
      // Check if the error is a 503 (maintenance mode)
      if (error instanceof Error && error.message.includes("503")) {
        setIsMaintenanceMode(true);
        setError(
          "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
        );
      } else {
        setError("Failed to load contests");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
  }, [sortField, sortDirection]);

  // Filter and sort contests
  const filteredAndSortedContests = useMemo(() => {
    let filtered = [...contests];

    // First, apply completed/cancelled filters
    filtered = filtered.filter((contest) => {
      const now = new Date();
      const endTime = new Date(contest.end_time);
      const isCompleted = now >= endTime || contest.status === "completed";
      const isCancelled = contest.status === "cancelled";

      // Skip completed contests unless showCompleted is true
      if (isCompleted && !showCompleted) return false;

      // Skip cancelled contests unless showCancelled is true
      if (isCancelled && !showCancelled) return false;

      return true;
    });

    // Apply status filter
    if (activeStatusFilter !== "all") {
      filtered = filtered.filter((contest) => {
        const now = new Date();
        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);

        switch (activeStatusFilter) {
          case "live":
            return (
              now >= startTime &&
              now < endTime &&
              contest.status !== "cancelled"
            );
          case "upcoming":
            return now < startTime && contest.status !== "cancelled";
          case "completed":
            return (
              (now >= endTime || contest.status === "completed") &&
              showCompleted
            );
          case "cancelled":
            return contest.status === "cancelled" && showCancelled;
          default:
            return true;
        }
      });
    }

    // Apply difficulty filter
    if (activeDifficultyFilter) {
      filtered = filtered.filter(
        (contest) => contest.settings.difficulty === activeDifficultyFilter,
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const getValue = (contest: Contest) => {
        switch (sortField) {
          case "start_time":
            return new Date(contest.start_time).getTime();
          case "participant_count":
            return contest.participant_count;
          case "prize_pool":
            return Number(contest.prize_pool);
          case "entry_fee":
            return Number(contest.entry_fee);
          default:
            return 0;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [
    contests,
    activeStatusFilter,
    activeDifficultyFilter,
    sortField,
    sortDirection,
    showCompleted,
    showCancelled,
  ]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-dark-200 rounded-lg h-64 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span className="animate-pulse">⚠</span>
            <span>
              DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.
            </span>
            <span className="animate-pulse">⚠</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Auth Debug Panel */}
      <AuthDebugPanel position="top-right" />
      
      {/* Content Section */}
      <div className="relative flex-1" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb navigation */}
          <div className="mb-4 flex items-center text-sm text-gray-400">
            <Link to="/" className="hover:text-brand-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-300">Contests</span>
          </div>

          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative group">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 relative group">
              <span className="relative z-10 group-hover:animate-glitch">
                Duel Explorer
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            </h1>
            {isAdmin && (
              <CreateContestButton
                onCreateClick={() => setIsCreateModalOpen(true)}
              />
            )}
          </div>

          {/* Enhanced Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="md:hidden w-full mb-4 px-4 py-2 bg-dark-200 rounded-lg text-gray-100 flex items-center justify-between relative group hover:bg-dark-300/50 transition-colors"
          >
            <span className="flex items-center space-x-2 group-hover:animate-cyber-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sort/Filter</span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform duration-300 ${
                isFilterMenuOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Enhanced Filters Section */}
          <div
            className={`${
              isFilterMenuOpen ? "block" : "hidden"
            } md:block mb-8 space-y-4 bg-dark-200/50 backdrop-blur-sm p-4 rounded-lg border border-dark-300 relative group animate-fade-in`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream rounded-lg" />
            <div className="relative z-10">
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-4">
                {/* Status Filter - Now as buttons */}
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <label className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors mb-2 block">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "upcoming", label: "Open" },
                      { value: "live", label: "Live" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setActiveStatusFilter(value)}
                        className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                          activeStatusFilter === value
                            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                            : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duel Style Filter - Compact dropdown */}
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <label className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors mb-2 block">
                    Duel Style
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-dark-300/50 text-gray-100 rounded-lg px-4 py-2 border border-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-brand-400 transition-colors appearance-none"
                      value={activeDifficultyFilter}
                      onChange={(e) =>
                        setActiveDifficultyFilter(
                          e.target.value as ContestSettings["difficulty"] | "",
                        )
                      }
                    >
                      <option value="">All Styles</option>
                      <option value="guppy">Guppy</option>
                      <option value="tadpole">Tadpole</option>
                      <option value="squid">Squid</option>
                      <option value="dolphin">Dolphin</option>
                      <option value="shark">Shark</option>
                      <option value="whale">Whale</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Include Finished Duels - Now as toggle buttons */}
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <label className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors mb-2 block">
                    Include Finished
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                        showCompleted
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {showCompleted ? "✓" : ""} Completed
                      </span>
                    </button>
                    <button
                      onClick={() => setShowCancelled(!showCancelled)}
                      className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                        showCancelled
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {showCancelled ? "✓" : ""} Cancelled
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort Controls - Keep as is since it looks good */}
              <div className="pt-4 border-t border-dark-400">
                <ContestSort
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={(field: SortField, direction: SortDirection) => {
                    setSortField(field);
                    setSortDirection(direction);
                    fetchContests();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Active Filters Display */}
          {(activeStatusFilter !== "all" || activeDifficultyFilter !== "") && (
            <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
              {activeStatusFilter !== "all" && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm group hover:bg-brand-500/30 transition-all duration-300">
                  <span className="group-hover:animate-glitch">
                    {activeStatusFilter}
                  </span>
                  <button
                    onClick={() => setActiveStatusFilter("all")}
                    className="ml-2 hover:text-brand-200 group-hover:animate-neon-flicker"
                  >
                    ×
                  </button>
                </div>
              )}
              {activeDifficultyFilter && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm group hover:bg-brand-500/30 transition-all duration-300">
                  <span className="group-hover:animate-glitch">
                    {activeDifficultyFilter}
                  </span>
                  <button
                    onClick={() => setActiveDifficultyFilter("")}
                    className="ml-2 hover:text-brand-200 group-hover:animate-neon-flicker"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Contest Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedContests.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12 bg-dark-200/50 rounded-lg animate-fade-in">
                No duels matching these filters
              </div>
            ) : (
              filteredAndSortedContests.map((contest) => (
                <div
                  key={contest.id}
                  className="transform hover:scale-102 transition-transform duration-300"
                >
                  <ContestCard
                    contest={contest}
                    onClick={() => navigate(`/contests/${contest.id}`)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Create Contest Modal */}
          <CreateContestModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            userRole="admin"
            onSuccess={fetchContests}
          />
        </div>
      </div>
    </div>
  );
};
