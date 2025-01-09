import React, { useEffect, useState } from "react";
import { ContestCard } from "../components/contests/ContestCard";
import { ContestFilters } from "../components/contests/ContestFilters";
import { CreateContestButton } from "../components/contests/CreateContestButton";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import { isContestLive } from "../lib/utils";
import { ddApi } from "../services/dd-api";
import type { Contest } from "../types";

// ?
interface ContestResponse {
  contests: Contest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const ContestBrowser: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState("");
  const [activeSort, setActiveSort] = useState("start_time");

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await ddApi.contests.getAll();
        console.log("contests full response:", response);

        // Type guard with explicit type checking
        const isContestResponse = (
          value: unknown
        ): value is ContestResponse => {
          const obj = value as { contests?: unknown };
          return (
            value !== null &&
            typeof value === "object" &&
            "contests" in obj &&
            Array.isArray(obj.contests)
          );
        };

        // Extract contests array with explicit typing
        let contestsArray: Contest[] = [];
        if (Array.isArray(response)) {
          contestsArray = response as Contest[];
        } else if (isContestResponse(response)) {
          contestsArray = (response as ContestResponse).contests;
        }

        setContests(contestsArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contests:", error);
        setError("Failed to load contests (CB)");
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

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

      <div className="mb-8">
        <ContestFilters
          activeStatusFilter={activeStatusFilter}
          activeDifficultyFilter={activeDifficultyFilter}
          activeSort={activeSort}
          onStatusFilterChange={setActiveStatusFilter}
          onDifficultyFilterChange={setActiveDifficultyFilter}
          onSortChange={setActiveSort}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <div key={contest.id}>
            <ContestCard
              contest={contest}
              onClick={() => (window.location.href = `/contests/${contest.id}`)}
            />
            <p className="text-sm text-gray-400">
              {isContestLive(contest) ? "Ends in " : "Starts in "}
              <CountdownTimer
                targetDate={
                  isContestLive(contest) ? contest.end_time : contest.start_time
                }
                onComplete={() => {
                  console.log("Timer completed for contest:", contest.id);
                }}
              />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
