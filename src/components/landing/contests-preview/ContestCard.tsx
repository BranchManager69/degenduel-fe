import React, { useMemo } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

import { ContestButton } from "./ContestButton";
import { ContestDifficulty } from "./ContestDifficulty";
import { formatCurrency } from "../../../lib/utils";
import { ContestStatus, DifficultyLevel } from "../../../types/index";
import { Card, CardHeader } from "../../ui/Card";

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
          `Invalid date string received: ${isLive ? endTime : startTime}`,
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
            `Status: ${status}`,
        );
      }

      // If the time has passed or is now
      if (diff <= 0) {
        if (Math.abs(diff) > 7 * 24 * 60 * 60 * 1000) {
          // More than one week in the past
          console.warn(
            `Contest time is far in the past:\n` +
              `${isLive ? "End" : "Start"} time: ${
                isLive ? endTime : startTime
              }\n` +
              `Contest ID: ${id}\n` +
              `Status: ${status}`,
          );
        }
        return isLive ? "Ending soon" : "Starting soon";
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else if (seconds > 0 || (seconds === 0 && days + hours + minutes > 0)) {
        // Prevent seconds value from disappearing once per minute
        return `${seconds}s`;
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
        status,
      );
      return "Time unavailable";
    }
  }, [isLive, startTime, endTime, id, status]);

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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

  // Get gradient colors based on status
  const getGradient = () => {
    switch (status) {
      case "active":
        return "from-green-500/10 via-brand-500/10 to-green-500/10";
      case "pending":
        return "from-blue-500/10 via-brand-500/10 to-blue-500/10";
      case "completed":
        return "from-purple-500/10 via-brand-500/10 to-purple-500/10";
      case "cancelled":
        return "from-red-500/10 via-brand-500/10 to-red-500/10";
      default:
        return "from-brand-500/10 via-brand-400/10 to-brand-600/10";
    }
  };

  return (
    <Card className="group relative backdrop-blur-sm border transform transition-all duration-500 hover:scale-[1.03] hover:shadow-xl overflow-hidden h-full bg-gradient-to-br from-[#1a1333]/90 to-[#120d24]/90 border-brand-500/10 hover:border-brand-400/30 hover:shadow-brand-500/10">
      {/* Animated gradient overlay */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${getGradient()}`}
      />

      {/* Animated border glow */}
      <div
        className={`absolute -inset-[1px] rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r ${getGradient()}`}
      />

      {/* Scan line effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_8px] animate-scan" />

      {/* Enhanced Header with Banner Style */}
      <CardHeader className="relative p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {/* Background gradient with shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-brand-400/30 to-brand-600/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-0 group-hover:opacity-100" />

          {/* Content */}
          <div className="relative p-8 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1 min-w-0">
                <Link to={`/contests/${id}`}>
                  <h3 className="text-2xl font-bold font-cyber tracking-wide relative inline-block">
                    <span className="text-gray-100 group-hover:text-brand-300 transition-colors duration-500">
                      {name}
                    </span>
                    <span className="absolute -bottom-1 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out bg-gradient-to-r from-brand-400 to-brand-500"></span>
                  </h3>
                </Link>
                <p className="text-sm font-medium text-brand-300 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLive ? "bg-red-400 animate-pulse" : "bg-blue-400"
                    }`}
                  ></span>
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
                  className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor()} ${
                    status === "active" ? "animate-cyber-pulse" : ""
                  }`}
                >
                  {getStatusText()}
                </span>

                {/* Entered Badge */}
                {isParticipating && (
                  <div className="flex items-center gap-1.5 bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full border border-brand-400/30 backdrop-blur-sm">
                    <FaCheckCircle className="w-3 h-3" />
                    <span className="text-xs font-medium">Entered</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contest Description - no border */}
            <div className="relative py-2">
              <p
                className="text-sm text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors duration-500"
                title={description}
              >
                {description || "No description available"}
              </p>
            </div>

            {/* Prize Pool and Entry Fee side by side with enhanced styling */}
            <div className="grid grid-cols-2 gap-6 mt-2">
              <div className="space-y-2 relative">
                <span className="text-sm text-gray-400">Prize Pool</span>
                <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text relative group-hover:scale-105 transform transition-transform duration-500 inline-block">
                  {formatCurrency(prizePool)}
                  <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>
                </div>
              </div>
              <div className="space-y-2 relative">
                <span className="text-sm text-gray-400">Entry Fee</span>
                <div className="text-2xl font-bold text-gray-200 group-hover:text-gray-100 transition-colors duration-500 relative inline-block">
                  {formatCurrency(entryFee)}
                  <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Players Progress with enhanced styling */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Players</span>
                <span className="text-sm font-medium text-gray-300">
                  {participantCount}/{maxParticipants}
                </span>
              </div>
              <div className="relative h-2.5 bg-dark-300/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                {/* Animated dots for progress bar */}
                {progress > 10 && progress < 90 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse-slow"
                    style={{ left: `${progress - 5}%` }}
                  ></div>
                )}
                {/* Contest code hidden in tiny text */}
                <div className="absolute bottom-0 right-0 text-[4px] text-white/10 pointer-events-none select-none">
                  {contestCode}
                </div>
              </div>
            </div>

            {/* Difficulty indicator */}
            <div className="mt-2">
              <ContestDifficulty difficulty={difficulty} />
            </div>

            {/* Enhanced ContestButton */}
            <div className="mt-4">
              <ContestButton
                id={parseInt(id)}
                type={
                  status === "active"
                    ? "live"
                    : status === "pending"
                      ? "upcoming"
                      : status === "completed"
                        ? "completed"
                        : "cancelled"
                }
              />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
