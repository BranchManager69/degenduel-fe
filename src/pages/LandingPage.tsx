// src/pages/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ContestSection } from "../components/landing/ContestSection";
import { Features } from "../components/landing/Features";
import { Button } from "../components/ui/Button";
import { LiveContestTicker } from "../components/ui/LiveContestTicker";
import { MovingBackground } from "../components/ui/MovingBackground";
import { isContestLive } from "../lib/utils";
import { ddApi } from "../services/dd-api";
import type { Contest } from "../types";

// Define contest filter functions
const isPendingContest = (contest: Contest): boolean =>
  contest.status === "pending";

// Update the interface to match the actual API response structure
interface ContestResponse {
  contests: Contest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        //console.log("Retrieving contests...");
        const response = await ddApi.contests.getAll();
        //console.log("Raw response:", response);
        //console.log(
        //  "contests type:",
        //  Array.isArray(response) ? "Array" : typeof response
        //);
        //console.log("contests full response:", response);

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

        //console.log("contestsArray:", contestsArray);

        // Use the predefined filter functions on the guaranteed array
        const active = contestsArray.filter(isContestLive);
        //console.log("active", active);
        const open = contestsArray.filter(isPendingContest);
        //console.log("open", open);

        setActiveContests(active);
        setOpenContests(open);
      } catch (err) {
        const error = err as {
          message: string;
          response?: { status: number; statusText: string; data: any };
        };
        console.error("Detailed error:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        setError(`Failed to load contests: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-100 text-gray-100">
      <MovingBackground />

      <div className="sticky top-16 z-10">
        <LiveContestTicker
          contests={[...activeContests, ...openContests]}
          loading={loading}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative pt-20 pb-16 text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl mb-6">
            <span className="block mb-2">This is</span>
            <span className="block bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text pb-2">
              DegenDuel.
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Compete in trading competitions against schizo degens and based
            chads. Build your stack, challenge other degens, and win some SOL.
          </p>
          <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center">
            <div className="rounded-md shadow">
              <RouterLink to="/contests">
                <Button size="lg" className="bg-brand-600 hover:bg-brand-700">
                  Browse Contests
                </Button>
              </RouterLink>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <RouterLink to="/how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-gray-300 border-gray-700 hover:bg-dark-200"
                >
                  How It Works
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>

        <Features />

        {error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <ContestSection
              title="Spectate Live Matches"
              type="active"
              contests={activeContests}
              loading={loading}
            />
            <ContestSection
              title="Joinable Matches"
              type="pending"
              contests={openContests}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};
