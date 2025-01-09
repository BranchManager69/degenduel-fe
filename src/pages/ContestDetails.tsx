import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContestRules } from "../components/contests/ContestRules";
import { ParticipantsList } from "../components/contests/ParticipantsList";
import { PrizeStructure } from "../components/contests/PrizeStructure";
import { ContestDifficulty } from "../components/landing/contests/ContestDifficulty";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import { formatCurrency, isContestLive, mapContestStatus } from "../lib/utils";
import { ddApi } from "../services/dd-api";
import type { Contest } from "../types";

const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-dark-300 rounded w-1/2"></div>
            <div className="h-6 bg-dark-300 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContest = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await ddApi.contests.getById(id);
        const sanitizedContest = {
          ...data,
          entry_fee:
            typeof data.entry_fee === "string"
              ? data.entry_fee
              : String(data.entry_fee),
          prize_pool:
            typeof data.prize_pool === "string"
              ? data.prize_pool
              : String(data.prize_pool),
          participant_count: Number(data.participant_count) || 0,
          start_time: data.start_time,
          end_time: data.end_time,
          settings: {
            ...data.settings,
            max_participants: Number(data.settings?.max_participants) || 0,
            token_types: Array.isArray(data.settings?.token_types)
              ? data.settings.token_types
              : [],
            rules: Array.isArray(data.settings?.rules)
              ? data.settings.rules
              : [],
            difficulty: data.settings?.difficulty || "guppy",
          },
          participants: Array.isArray(data.participants)
            ? data.participants
            : [],
        };
        setContest(sanitizedContest);
      } catch (err) {
        console.error("Error fetching contest:", err);
        setError("Failed to load contest details");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  const handleJoinContest = () => {
    if (contest) {
      navigate(`/contests/${contest.id}/select-tokens`);
    }
  };

  if (loading) return <StatsSkeleton />;
  if (error || !contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500">
          {error || "Contest not found"}
        </div>
      </div>
    );
  }

  const tokenTypes = contest.settings?.token_types || [];
  const rules = contest.settings?.rules || [];
  const participants = contest.participants || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              {contest.name}
            </h1>
            <p className="text-gray-400">{contest.description}</p>
          </div>
          <ContestDifficulty
            difficulty={contest.settings.difficulty || "guppy"}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Entry Fee</div>
              <div className="text-xl font-bold text-brand-400">
                {formatCurrency(Number(contest.entry_fee))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Prize Pool</div>
              <div className="text-xl font-bold text-brand-400">
                {formatCurrency(Number(contest.prize_pool))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                {isContestLive(contest) ? "Ends In" : "Starts In"}
              </div>
              <div className="text-lg font-medium text-gray-100">
                <CountdownTimer
                  targetDate={
                    isContestLive(contest)
                      ? contest.end_time
                      : contest.start_time
                  }
                  onComplete={() => {
                    // Refresh contest data when timer completes
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Players</div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{
                      width: `${
                        (Number(contest.participant_count) /
                          contest.settings.max_participants) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-lg font-medium text-gray-100">
                  {contest.participant_count}/
                  {contest.settings.max_participants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <ContestRules rules={rules} />

          {/* Available Tokens */}
          <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Available Tokens
              </h3>
              <div className="flex flex-wrap gap-2">
                {tokenTypes.map((token: string) => (
                  <span
                    key={token}
                    className="px-3 py-1 bg-dark-300 rounded-full text-sm text-gray-300"
                  >
                    {token}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <PrizeStructure prizePool={Number(contest.prize_pool)} />
          <ParticipantsList
            participants={participants}
            contestStatus={mapContestStatus(contest.status)}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant="gradient"
          onClick={handleJoinContest}
          className="relative group overflow-hidden"
          disabled={
            contest.is_participating ||
            Number(contest.participant_count) >=
              contest.settings.max_participants
          }
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-32 bg-white/10 rotate-45 transform translate-x-32 group-hover:translate-x-48 transition-transform duration-500" />
          </div>
          <span className="relative flex items-center justify-center font-medium">
            {contest.is_participating
              ? "Already Joined"
              : Number(contest.participant_count) >=
                contest.settings.max_participants
              ? "Contest Full"
              : `Enter Contest (${formatCurrency(
                  parseInt(contest.entry_fee)
                )})`}
            <svg
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
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
        </Button>
      </div>
    </div>
  );
};
