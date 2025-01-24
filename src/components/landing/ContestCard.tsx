import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../lib/utils";
import { ContestStatus, DifficultyLevel } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { ContestDifficulty } from "./contests/ContestDifficulty";

interface ContestCardProps {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  startTime: string;
  endTime: string;
  participantCount: number;
  maxParticipants: number;
  status: ContestStatus;
  difficulty: DifficultyLevel;
  contestCode: string;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  id,
  name,
  description,
  entryFee,
  prizePool,
  startTime,
  endTime,
  participantCount,
  maxParticipants,
  status,
  difficulty,
  contestCode,
}) => {
  const isLive = status === "active";
  const progress = (participantCount / maxParticipants) * 100;

  const timeRemaining = useMemo(() => {
    const targetTime = new Date(isLive ? endTime : startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, targetTime - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, [isLive, startTime, endTime]);

  return (
    <Card className="group relative bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative border-b border-dark-300/50">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-100 truncate pr-2">
              {name}
            </h3>
            <p className="text-sm font-medium text-brand-400/80">
              {isLive ? "Ends" : "Starts"} in {timeRemaining.hours}h{" "}
              {timeRemaining.minutes}m
            </p>
            {/* Contest Description */}
            <p
              className="text-sm text-gray-400 line-clamp-2"
              title={description}
            >
              {description}
            </p>
            {/* Contest Code */}
            <p className="text-xs text-gray-500">Ref: {contestCode}</p>
          </div>
          <ContestDifficulty difficulty={difficulty} />
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="py-3 space-y-4">
          {/* Prize Pool */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">
              Prize Pool
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text">
              {formatCurrency(prizePool)}
            </span>
          </div>

          {/* Entry Fee */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">Entry Fee</span>
            <span className="font-semibold text-gray-200">
              {formatCurrency(entryFee)}
            </span>
          </div>

          {/* Players Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Players</span>
              <span className="text-sm font-medium text-gray-300">
                {participantCount}/{maxParticipants}
              </span>
            </div>
            <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-600 transform transition-transform duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
              {/* Animated shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/contests/${id}`} className="block mt-6">
          <Button className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-purple-700 border-0">
            {/* Button shine effect */}
            <div className="absolute inset-0 flex items-center">
              <div className="h-[200%] aspect-square bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-700" />
            </div>
            <span className="relative flex items-center justify-center text-base font-semibold">
              {isLive ? "Spectate" : "Play"}
              <svg
                className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform"
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
        </Link>
      </CardContent>
    </Card>
  );
};
