import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
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

interface ContestParticipant {
  wallet_address?: string;
  address?: string;
  nickname?: string;
  username?: string;
  score?: number;
}

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);

  const fetchContest = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await ddApi.contests.getById(id);
      console.log("Contest data (detailed):", {
        participant_count: data.participant_count,
        contest_participants: data.contest_participants,
        raw_data: data,
      });

      // Ensure settings are properly initialized
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
          rules: Array.isArray(data.settings?.rules) ? data.settings.rules : [],
          difficulty: data.settings?.difficulty || "guppy",
        },
        participants: Array.isArray(data.contest_participants)
          ? data.contest_participants.map((p: ContestParticipant) => ({
              address: p.wallet_address || p.address,
              username: p.nickname || p.username,
              score: p.score,
            }))
          : [],
      };

      console.log(
        "Sanitized contest participants:",
        sanitizedContest.participants
      );

      // Check if current user is already participating
      if (account?.address && Array.isArray(data.contest_participants)) {
        const userIsParticipating = data.contest_participants.some(
          (p: ContestParticipant) =>
            (p.wallet_address || p.address)?.toLowerCase() ===
            account.address.toLowerCase()
        );
        setIsParticipating(userIsParticipating);
      }

      setContest(sanitizedContest);
    } catch (err) {
      console.error("Error fetching contest:", err);
      setError("Failed to load contest details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
  }, [id, account?.address]);

  const handleCountdownComplete = () => {
    if (!contest) return;

    if (isContestLive(contest)) {
      // Contest just ended
      setContest((prev) => (prev ? { ...prev, status: "completed" } : null));
    } else if (contest.status === "pending") {
      // Contest just started
      setContest((prev) => (prev ? { ...prev, status: "active" } : null));
    }
  };

  const handleJoinContest = () => {
    if (!contest) return;

    if (isParticipating) {
      setError("You are already entered in this contest.");
      return;
    }

    if (!account) {
      setError("Please connect your wallet to enter the contest.");
      return;
    }

    navigate(`/contests/${contest.id}/select-tokens`);
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-dark-200/50 backdrop-blur-sm border-dark-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream" />
              <CardContent className="p-6 relative">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                  <div className="h-6 bg-dark-300 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );

  if (error || !contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <span className="relative z-10">{error || "Contest not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header Section */}
      <div className="mb-8 relative group">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <h1 className="text-3xl font-bold text-gray-100 mb-2 group-hover:animate-glitch">
              {contest.name}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            </h1>
            <p className="text-gray-400 group-hover:animate-cyber-pulse">
              {contest.description}
            </p>
          </div>
          <ContestDifficulty
            difficulty={contest.settings.difficulty || "guppy"}
          />
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Entry Fee Card */}
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative">
              <div className="text-gray-400 group-hover:text-brand-400 transition-colors">
                Entry Fee
              </div>
              <div className="text-xl font-bold text-brand-400 group-hover:animate-neon-flicker">
                {formatCurrency(Number(contest.entry_fee))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prize Pool Card */}
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative">
              <div className="text-gray-400 group-hover:text-brand-400 transition-colors">
                Prize Pool
              </div>
              <div className="text-xl font-bold text-brand-400 group-hover:animate-neon-flicker">
                {formatCurrency(Number(contest.prize_pool))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative">
              <div className="text-gray-400 group-hover:text-brand-400 transition-colors">
                {isContestLive(contest) ? "Ends In" : "Starts In"}
              </div>
              <div className="text-lg font-medium text-gray-100 group-hover:animate-cyber-pulse">
                <CountdownTimer
                  targetDate={
                    isContestLive(contest)
                      ? contest.end_time
                      : contest.start_time
                  }
                  onComplete={handleCountdownComplete}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Card */}
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative">
              <div className="text-gray-400 group-hover:text-brand-400 transition-colors">
                Players
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full group-hover:animate-data-stream"
                    style={{
                      width: `${
                        (Number(contest.participant_count) /
                          contest.max_participants) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-lg font-medium text-gray-100">
                  {contest.participant_count}/{contest.max_participants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Rules Section */}
          {contest?.settings?.rules && contest.settings.rules.length > 0 ? (
            <ContestRules rules={contest.settings.rules} />
          ) : (
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-lg font-semibold text-gray-100 mb-4 group-hover:animate-glitch">
                  Contest Rules
                </h3>
                <p className="text-gray-400">
                  No rules specified for this contest.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Tokens Section */}
          <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group">
            <CardContent className="p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="text-lg font-semibold text-gray-100 mb-4 group-hover:animate-glitch">
                Available Tokens
              </h3>
              {contest?.settings?.token_types &&
              contest.settings.token_types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contest.settings.token_types.map((token: string) => (
                    <span
                      key={token}
                      className="px-3 py-1 bg-dark-300 rounded-full text-sm text-gray-300 hover:bg-brand-400/20 hover:text-brand-400 transition-colors group-hover:animate-cyber-pulse"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">
                  No tokens specified for this contest.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Prize Structure */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <PrizeStructure prizePool={Number(contest?.prize_pool || 0)} />
          </div>

          {/* Participants List */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {Number(contest.participant_count) > 0 &&
            Array.isArray(contest.participants) ? (
              contest.participants.length > 0 ? (
                <ParticipantsList
                  participants={contest.participants}
                  contestStatus={mapContestStatus(contest.status)}
                />
              ) : (
                <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4 group-hover:animate-glitch">
                      Participants ({contest.participant_count}/
                      {contest.max_participants})
                    </h3>
                    <p className="text-gray-400">Participant list is empty</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4 group-hover:animate-glitch">
                    Participants ({contest.participant_count}/
                    {contest.max_participants})
                  </h3>
                  <p className="text-gray-400">No participants yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Action Button Section */}
      <div className="flex flex-col items-center gap-4">
        {isParticipating && (
          <div className="flex items-center gap-2 text-brand-400 mb-2 animate-cyber-pulse">
            <FaCheckCircle className="w-5 h-5" />
            <span className="font-medium">
              You're entered in this contest
              {contest.status === "pending" &&
                " - You can update your tokens before the contest begins"}
            </span>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 mb-2 animate-glitch">
            {error}
          </div>
        )}
        <Button
          size="lg"
          onClick={handleJoinContest}
          className={`relative group overflow-hidden ${
            isParticipating && contest.status !== "pending"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          disabled={
            (isParticipating && contest.status !== "pending") ||
            Number(contest.participant_count) >= contest.max_participants
          }
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
          <span className="relative flex items-center justify-center font-medium group-hover:animate-glitch">
            {isParticipating
              ? contest.status === "pending"
                ? "Update Tokens"
                : "Already Joined"
              : Number(contest.participant_count) >= contest.max_participants
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </Button>
      </div>
    </div>
  );
};
