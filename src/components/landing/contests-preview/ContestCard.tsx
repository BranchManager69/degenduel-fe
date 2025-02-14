import React, { useMemo } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../lib/utils";
import { ContestStatus, DifficultyLevel } from "../../../types/index";
import { Card, CardHeader } from "../../ui/Card";
import { ContestButton } from "./ContestButton";
import { ContestDifficulty } from "./ContestDifficulty";

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
  isParticipating: boolean;
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
  isParticipating,
}) => {
  const isLive = status === "active";
  const progress = (participantCount / maxParticipants) * 100;

  const timeRemaining = useMemo(() => {
    try {
      const targetDate = new Date(isLive ? endTime : startTime);
      // Check if date is invalid
      if (isNaN(targetDate.getTime())) {
        console.error(
          `Invalid date string received: ${isLive ? endTime : startTime}`
        );
        return "Time unavailable";
      }

      const targetTime = targetDate.getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      // Log suspicious time differences
      if (Math.abs(diff) > 365 * 24 * 60 * 60 * 1000) {
        // More than a year difference
        console.warn(
          `Suspicious time difference detected:\n` +
            `Target time: ${new Date(targetTime).toISOString()}\n` +
            `Current time: ${new Date(now).toISOString()}\n` +
            `Difference: ${diff}ms\n` +
            `Contest ID: ${id}\n` +
            `Status: ${status}`
        );
      }

      // If the time has passed or is now
      if (diff <= 0) {
        if (Math.abs(diff) > 7 * 24 * 60 * 60 * 1000) {
          // More than a week in the past
          console.warn(
            `Contest time is far in the past:\n` +
              `${isLive ? "End" : "Start"} time: ${
                isLive ? endTime : startTime
              }\n` +
              `Contest ID: ${id}\n` +
              `Status: ${status}`
          );
        }
        return isLive ? "Ending soon" : "Starting soon";
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return isLive ? "Ending soon" : "Starting soon";
      }
    } catch (error) {
      console.error(
        `Error calculating time for contest ${id}:`,
        error,
        "\nStart time:",
        startTime,
        "\nEnd time:",
        endTime,
        "\nStatus:",
        status
      );
      return "Time unavailable";
    }
  }, [isLive, startTime, endTime, id, status]);

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "Live";
      case "pending":
        return "Upcoming";
      case "completed":
        return "Ended";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Card className="group relative bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Enhanced Header with Banner Style */}
      <CardHeader className="relative p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {/* Background gradient with shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-brand-400/30 to-brand-600/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-0 group-hover:opacity-100" />

          {/* Content */}
          <div className="relative p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1 min-w-0">
                <Link to={`/contests/${id}`}>
                  <h3 className="text-2xl font-bold text-gray-100 truncate pr-2 group-hover:text-brand-300 transition-colors hover:text-brand-400">
                    {name}
                  </h3>
                </Link>
                <p className="text-sm font-medium text-brand-300">
                  {timeRemaining.startsWith("Late to start")
                    ? timeRemaining
                    : timeRemaining === "Ending soon" ||
                      timeRemaining === "Starting soon"
                    ? timeRemaining
                    : `${isLive ? "Ends" : "Starts"} in ${timeRemaining}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Status Badge */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${
                    status === "active" ? "animate-cyber-pulse" : ""
                  }`}
                >
                  {getStatusText()}
                </span>

                {/* Entered Badge */}
                {isParticipating && (
                  <div className="flex items-center gap-1 bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full border border-brand-400/20">
                    <FaCheckCircle className="w-3 h-3" />
                    <span className="text-xs font-medium">Entered</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contest Description - no border */}
            <div className="relative py-2">
              <p
                className="text-sm text-gray-400 line-clamp-2"
                title={description}
              >
                {description || "No description available"}
              </p>
            </div>

            {/* Prize Pool and Entry Fee side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm text-gray-400">Prize Pool</span>
                <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text">
                  {formatCurrency(prizePool)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-400">Entry Fee</span>
                <div className="text-2xl font-bold text-gray-200">
                  {formatCurrency(entryFee)}
                </div>
              </div>
            </div>

            {/* Players Progress - no border */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Players</span>
                <span className="text-sm font-medium text-gray-300">
                  {participantCount}/{maxParticipants}
                </span>
              </div>
              <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </div>

            {/* Use ContestButton component */}
            <ContestButton
              id={parseInt(id)}
              type={isLive ? "live" : "upcoming"}
            />

            {/* Reference code in bottom right corner */}
            <div className="absolute bottom-1.5 right-2">
              <p className="text-[10px] text-gray-500">{contestCode}</p>
            </div>

            {/* Difficulty Badge in bottom left corner */}
            <div className="absolute bottom-1.5 left-2">
              <ContestDifficulty difficulty={difficulty} />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
