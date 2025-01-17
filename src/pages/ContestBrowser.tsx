import React, { useEffect, useMemo, useState } from "react";
import { CreateContestButton } from "../components/admin/CreateContestButton";
import { ContestCard } from "../components/contests/ContestCard";
import { ContestSort } from "../components/contests/ContestSort";
import { ddApi } from "../services/dd-api";
import type { Contest, ContestSettings } from "../types";
import type { SortDirection, SortField } from "../types/sort";

export const ContestBrowser: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState<
    ContestSettings["difficulty"] | ""
  >("");
  const [sortField, setSortField] = useState<SortField>("participant_count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await ddApi.contests.getAll({
        field: sortField,
        direction: sortDirection,
      });
      setContests(data);
    } catch (error) {
      console.error("Failed to fetch contests:", error);
      setError("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [sortField, sortDirection]);

  // Filter and sort contests
  const filteredAndSortedContests = useMemo(() => {
    let filtered = [...contests];

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
            return now >= endTime || contest.status === "completed";
          case "cancelled":
            return contest.status === "cancelled";
          default:
            return true;
        }
      });
    }

    // Apply difficulty filter
    if (activeDifficultyFilter) {
      filtered = filtered.filter(
        (contest) => contest.settings.difficulty === activeDifficultyFilter
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const getValue = (contest: Contest) => {
        switch (sortField) {
          case "start_time":
            return new Date(contest.start_time).getTime();
          case "prize_pool":
            return Number(contest.prize_pool);
          case "entry_fee":
            return Number(contest.entry_fee);
          case "participant_count":
            return contest.participant_count;
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
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
          Find Contests
        </h1>
        <CreateContestButton />
      </div>

      {/* Filter Toggle Button (Mobile) */}
      <button
        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
        className="md:hidden w-full mb-4 px-4 py-2 bg-dark-200 rounded-lg text-gray-100 flex items-center justify-between"
      >
        <span className="flex items-center space-x-2">
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
          <span>Filters & Sort</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transform transition-transform ${
            isFilterMenuOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Filters Section */}
      <div
        className={`${
          isFilterMenuOpen ? "block" : "hidden"
        } md:block mb-8 space-y-4 bg-dark-200/50 p-4 rounded-lg`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Contest Status</label>
            <select
              className="w-full bg-dark-300 text-gray-100 rounded px-3 py-2 border border-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
            >
              <option value="all">All Contests</option>
              <option value="live">Live Now (Spectate)</option>
              <option value="upcoming">Pre-Registration</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Risk Level*</label>
            <select
              className="w-full bg-dark-300 text-gray-100 rounded px-3 py-2 border border-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={activeDifficultyFilter}
              onChange={(e) =>
                setActiveDifficultyFilter(
                  e.target.value as ContestSettings["difficulty"] | ""
                )
              }
            >
              <option value="">All Risk Levels</option>
              <option value="guppy">
                Guppy (Most winners; lowest individual payouts)
              </option>
              <option value="tadpole">
                Tadpole (More winners; lower payouts)
              </option>
              <option value="squid">
                Squid (Many winners; below-average payouts)
              </option>
              <option value="dolphin">
                Dolphin (Few winners; above-average payouts)
              </option>
              <option value="shark">
                Shark (Fewer winners; higher payouts)
              </option>
              <option value="whale">
                Whale (Fewest winner(s); highest individual payout(s))
              </option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
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

      {/* Active Filters Display */}
      {(activeStatusFilter !== "all" || activeDifficultyFilter !== "") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeStatusFilter !== "all" && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm">
              <span>{activeStatusFilter}</span>
              <button
                onClick={() => setActiveStatusFilter("all")}
                className="ml-2 hover:text-brand-200"
              >
                ×
              </button>
            </div>
          )}
          {activeDifficultyFilter && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm">
              <span>{activeDifficultyFilter}</span>
              <button
                onClick={() => setActiveDifficultyFilter("")}
                className="ml-2 hover:text-brand-200"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contest Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-dark-200 rounded-lg h-64"
            ></div>
          ))
        ) : error ? (
          <div className="col-span-full text-center text-red-500">{error}</div>
        ) : filteredAndSortedContests.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No contests found matching your filters
          </div>
        ) : (
          filteredAndSortedContests.map((contest) => (
            <div key={contest.id}>
              <ContestCard
                contest={contest}
                onClick={() =>
                  (window.location.href = `/contests/${contest.id}`)
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
