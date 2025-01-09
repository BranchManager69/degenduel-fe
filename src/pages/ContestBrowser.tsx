import React, { useEffect, useMemo, useState } from "react";
import { ContestCard } from "../components/contests/ContestCard";
import { ContestSort } from "../components/contests/ContestSort";
import { CreateContestButton } from "../components/contests/CreateContestButton";
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-dark-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Available Contests</h1>
        <CreateContestButton />
      </div>

      <div className="mb-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            className="bg-dark-200 text-gray-100 rounded px-3 py-2"
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="bg-dark-200 text-gray-100 rounded px-3 py-2"
            value={activeDifficultyFilter}
            onChange={(e) =>
              setActiveDifficultyFilter(
                e.target.value as ContestSettings["difficulty"] | ""
              )
            }
          >
            <option value="">All Difficulties</option>
            <option value="guppy">Guppy</option>
            <option value="tadpole">Tadpole</option>
            <option value="squid">Squid</option>
            <option value="dolphin">Dolphin</option>
            <option value="shark">Shark</option>
            <option value="whale">Whale</option>
          </select>
        </div>

        {/* Sort Controls */}
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedContests.map((contest) => (
          <div key={contest.id}>
            <ContestCard
              contest={contest}
              onClick={() => (window.location.href = `/contests/${contest.id}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
