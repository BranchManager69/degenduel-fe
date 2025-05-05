// src/pages/authenticated/MyContestsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  FaBan,
  FaCalendarAlt,
  FaFire,
  FaHourglassHalf,
  FaTrophy,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "../../components/contest-browser/ContestCard";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { SearchInput } from "../../components/ui/SearchInput";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/Tabs";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useUserContests } from "../../hooks/data/legacy/useUserContests";
import { UserContest } from "../../services/contestService";
import { Contest } from "../../types";

export const MyContestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { contests, loading, error, refetch } = useUserContests();
  const [searchTerm, setSearchTerm] = useState("");

  // We're already inside an AuthenticatedRoute, no need for additional checks
  const { user } = useMigratedAuth();

  // This check is redundant since the AuthenticatedRoute already handles redirection
  // Keeping a simplified version just to be safe
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Transform UserContest to Contest format for ContestCard
  const transformToContestFormat = (userContest: UserContest): Contest => {
    const now = new Date().toISOString();
    return {
      id: parseInt(userContest.contestId) || 0, // Convert to number
      name: userContest.name,
      status:
        userContest.status === "upcoming" ? "pending" : userContest.status,
      start_time: userContest.startTime,
      end_time: userContest.endTime,
      participant_count: userContest.participantCount,
      is_participating: true, // By definition, all contests here are ones the user is participating in
      prize_pool: "", // We don't have this info in UserContest
      entry_fee: "", // We don't have this info in UserContest
      max_participants: 20, // Standard default value
      min_participants: 2, // Standard default value of 2 players minimum
      description: "", // We don't have this info in UserContest
      contest_code: "", // We don't have this info in UserContest
      created_at: now,
      updated_at: now,
      allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Standard default - all buckets allowed
      settings: {
        difficulty: "guppy", // Default to guppy as it's a valid DifficultyLevel
        min_trades: 1, // Standard minimum trades
        token_types: [],
        rules: [],
      },
    } as Contest;
  };

  // Group contests by status and filter by search term
  const groupedContests = useMemo(() => {
    const active: Contest[] = [];
    const upcoming: Contest[] = [];
    const completed: Contest[] = [];
    const cancelled: Contest[] = [];

    // Calculate actual status based on timestamps to ensure accuracy
    contests.forEach((contest) => {
      const now = new Date();
      const startTime = new Date(contest.startTime);
      const endTime = new Date(contest.endTime);

      const hasStarted = now >= startTime;
      const hasEnded = now >= endTime;

      const transformed = transformToContestFormat(contest);
      
      // Apply search filter
      const matchesSearch = 
        searchTerm === "" || 
        transformed.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return;

      if (transformed.status === "cancelled") {
        cancelled.push(transformed);
      } else if (hasEnded) {
        completed.push(transformed);
      } else if (hasStarted) {
        active.push(transformed);
      } else {
        upcoming.push(transformed);
      }
    });

    return {
      active,
      upcoming,
      completed,
      cancelled,
    };
  }, [contests, searchTerm]);

  return (
    <div className="min-h-screen">

      <div className="relative z-10 py-8 container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FaTrophy className="text-brand-400" /> My Contests
          </h1>
          <p className="text-gray-400 mt-2">
            View all contests you've participated in, are currently
            participating in, or will participate in.
          </p>
        </header>

        <div className="mb-6 mx-auto max-w-md">
          <SearchInput
            placeholder="Find your contests..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-8 w-full max-w-3xl mx-auto grid grid-cols-4 bg-dark-200/50 backdrop-blur-md">
            <TabsTrigger
              value="active"
              className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <FaFire className="shrink-0" />
              <span className="hidden sm:inline">Active</span>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                {groupedContests.active.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="upcoming"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <FaCalendarAlt className="shrink-0" />
              <span className="hidden sm:inline">Upcoming</span>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                {groupedContests.upcoming.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="completed"
              className="flex items-center gap-2 data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-400"
            >
              <FaHourglassHalf className="shrink-0" />
              <span className="hidden sm:inline">Completed</span>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-300">
                {groupedContests.completed.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="cancelled"
              className="flex items-center gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
            >
              <FaBan className="shrink-0" />
              <span className="hidden sm:inline">Cancelled</span>
              {groupedContests.cancelled.length > 0 && (
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                  {groupedContests.cancelled.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-dark-200/80 backdrop-blur-sm border-dark-300"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="h-8 w-3/4 bg-dark-300 animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-dark-300 animate-pulse rounded" />
                    <div className="space-y-2">
                      <div className="h-20 w-full bg-dark-300 animate-pulse rounded" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-12 w-full bg-dark-300 animate-pulse rounded" />
                        <div className="h-12 w-full bg-dark-300 animate-pulse rounded" />
                      </div>
                      <div className="h-8 w-full bg-dark-300 animate-pulse rounded" />
                      <div className="h-10 w-full bg-dark-300 animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <Card className="bg-red-900/20 border-red-900/50 mb-8">
              <CardContent className="p-6">
                <p className="text-red-400">{error}</p>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="mt-4 bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && contests.length === 0 && (
            <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                  <FaTrophy className="text-3xl text-brand-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-200 mb-2">
                  No Contests Found
                </h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  You haven't participated in any contests yet. Explore
                  available contests to get started.
                </p>
                <Button
                  onClick={() => navigate("/contests")}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  Browse Contests
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active contests tab */}
          <TabsContent value="active" className="mt-0">
            {!loading && groupedContests.active.length === 0 ? (
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <FaFire className="text-3xl text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">
                    No Active Contests
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    You're not participating in any active contests at the
                    moment.
                  </p>
                  <Button
                    onClick={() => navigate("/contests")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Find Active Contests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading &&
                  groupedContests.active.map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      onClick={() => navigate(`/contests/${contest.id}/lobby`)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming contests tab */}
          <TabsContent value="upcoming" className="mt-0">
            {!loading && groupedContests.upcoming.length === 0 ? (
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <FaCalendarAlt className="text-3xl text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">
                    No Upcoming Contests
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    You haven't joined any upcoming contests yet.
                  </p>
                  <Button
                    onClick={() => navigate("/contests")}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Find Upcoming Contests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading &&
                  groupedContests.upcoming.map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      onClick={() =>
                        navigate(`/contests/${contest.id}/select-tokens`)
                      }
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Completed contests tab */}
          <TabsContent value="completed" className="mt-0">
            {!loading && groupedContests.completed.length === 0 ? (
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mb-4">
                    <FaHourglassHalf className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">
                    No Completed Contests
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    You don't have any completed contests in your history yet.
                  </p>
                  <Button
                    onClick={() => navigate("/contests")}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Browse All Contests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading &&
                  groupedContests.completed.map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      onClick={() =>
                        navigate(`/contests/${contest.id}/results`)
                      }
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Cancelled contests tab */}
          <TabsContent value="cancelled" className="mt-0">
            {!loading && groupedContests.cancelled.length === 0 ? (
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <FaBan className="text-3xl text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">
                    No Cancelled Contests
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Good news! None of your contests have been cancelled.
                  </p>
                  <Button
                    onClick={() => navigate("/contests")}
                    className="bg-dark-300 hover:bg-dark-400 text-white"
                  >
                    Browse All Contests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading &&
                  groupedContests.cancelled.map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      onClick={() => navigate(`/contests/${contest.id}`)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyContestsPage;
