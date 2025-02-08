// src/components/landing/ContestCard.tsx

import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../lib/utils";
import { ContestStatus, DifficultyLevel } from "../../types";
import { Card } from "../ui/Card";
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
  const [isFlipped, setIsFlipped] = useState(false);
  const isLive = status === "active";
  const progress = (participantCount / maxParticipants) * 100;
  const maxPrizePool = 0.9 * (maxParticipants * entryFee); // 90% after platform fee
  const currentPrizePool = 0.9 * (participantCount * entryFee);

  const timeRemaining = useMemo(() => {
    try {
      const targetDate = new Date(isLive ? endTime : startTime);
      if (isNaN(targetDate.getTime())) {
        console.error(
          `Invalid date string received: ${isLive ? endTime : startTime}`
        );
        return "Time unavailable";
      }

      const targetTime = targetDate.getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (Math.abs(diff) > 365 * 24 * 60 * 60 * 1000) {
        console.warn(
          `Suspicious time difference detected:\n` +
            `Target time: ${new Date(targetTime).toISOString()}\n` +
            `Current time: ${new Date(now).toISOString()}\n` +
            `Difference: ${diff}ms\n` +
            `Contest ID: ${id}\n` +
            `Status: ${status}`
        );
      }

      if (diff <= 0) {
        if (Math.abs(diff) > 7 * 24 * 60 * 60 * 1000) {
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't flip if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("a") ||
      target.closest("button") ||
      target.closest(".interactive")
    ) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="relative w-full h-full cursor-pointer"
      style={{ perspective: "2000px" }}
      onClick={handleCardClick}
    >
      <div
        className={`relative w-full h-full duration-700 preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="h-full group relative bg-dark-200/80 backdrop-blur-sm border-dark-300/50 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10">
            {/* Participation badge with overlap effect */}
            {isParticipating && (
              <div className="absolute -top-1 -right-1 z-30">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand-400 to-brand-600 opacity-75 blur-lg animate-pulse" />
                  {/* Badge background with clip effect */}
                  <div className="relative px-4 py-1 bg-dark-200/95 clip-edges transform rotate-3 border-t border-r border-brand-400/50">
                    <span className="text-xs font-cyber tracking-widest text-brand-400 animate-pulse-slow">
                      ENTERED
                    </span>
                  </div>
                  {/* Decorative corner accent */}
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-brand-400/30 clip-edges transform rotate-45" />
                </div>
              </div>
            )}

            {/* Banner with background image support */}
            <div className="relative h-40 overflow-hidden">
              {/* Background image - commented out until images are provided */}
              {/* <div 
                className="absolute inset-0 bg-cover bg-center blur-sm"
                style={{ 
                  backgroundImage: `url(${backgroundImage})`,
                  filter: 'brightness(0.3) saturate(1.2)'
                }} 
              /> */}

              {/* Shine and gradient effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 opacity-20" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine-slow" />

              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <Link to={`/contests/${id}`} className="flex-1">
                    <h3 className="text-2xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-200 truncate pr-2">
                      {name}
                    </h3>
                  </Link>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span
                    className={`px-3 py-1.5 rounded-sm clip-edges text-xs font-cyber tracking-wider uppercase ${getStatusColor()}`}
                  >
                    {getStatusText()}
                  </span>
                  <div className="flex items-center text-sm font-medium text-brand-300 font-cyber">
                    <FaClock className="inline-block mr-1 -mt-1" />
                    {timeRemaining}
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="p-6 pt-4 flex-1 flex flex-col">
              {/* Description */}
              <p className="text-gray-400/90 text-sm leading-relaxed mb-6">
                {description}
              </p>

              {/* Progress bars */}
              <div className="space-y-2 mb-6">
                {/* Participants progress */}
                <div className="relative h-3 bg-dark-300 clip-edges overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white font-cyber z-10">
                      {participantCount} / {maxParticipants} Degens
                    </span>
                  </div>
                </div>

                {/* Prize pool progress */}
                <div className="relative h-3 bg-dark-300 clip-edges overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(currentPrizePool / maxPrizePool) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white font-cyber z-10">
                      {formatCurrency(currentPrizePool)} /{" "}
                      {formatCurrency(maxPrizePool)} SOL
                    </span>
                  </div>
                </div>
              </div>

              {/* Join button */}
              <button
                className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 transition-all font-cyber text-lg font-bold text-white uppercase tracking-wider clip-edges"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/contests/${id}`;
                }}
              >
                <div className="flex items-center justify-between px-6">
                  <span>{isParticipating ? "VIEW ENTRY" : "JOIN CONTEST"}</span>
                  {!isParticipating && (
                    <span className="text-white/90">
                      {formatCurrency(entryFee)} SOL
                    </span>
                  )}
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Card className="h-full bg-dark-200/90 backdrop-blur-sm border-dark-300/50 hover:border-brand-400/20">
            <div className="p-6 flex flex-col h-full">
              <h3 className="text-xl font-cyber text-brand-400 mb-6">
                Prize Structure
              </h3>

              {/* Payout visualization */}
              <div className="flex-1 space-y-4">
                <div className="bg-dark-300/30 p-4 rounded-sm clip-edges">
                  <h4 className="text-sm font-cyber text-gray-400 mb-2">
                    Total Prize Pool
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-cyber text-green-300">
                      {formatCurrency(prizePool * maxParticipants * 0.9)}
                    </p>
                    <span className="text-xs text-gray-500">max</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-cyber text-gray-400">
                    Payout Distribution
                  </h4>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center bg-dark-300/20 p-2 rounded-sm">
                      <span className="text-sm font-cyber text-amber-400">
                        1st Place
                      </span>
                      <span className="text-sm font-cyber text-gray-300">
                        50%
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-dark-300/20 p-2 rounded-sm">
                      <span className="text-sm font-cyber text-brand-400">
                        2nd Place
                      </span>
                      <span className="text-sm font-cyber text-gray-300">
                        30%
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-dark-300/20 p-2 rounded-sm">
                      <span className="text-sm font-cyber text-purple-400">
                        3rd Place
                      </span>
                      <span className="text-sm font-cyber text-gray-300">
                        10%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom badges */}
              <div className="mt-4 flex justify-between items-center">
                <ContestDifficulty difficulty={difficulty} />
                <p className="text-[10px] font-cyber text-gray-500 tracking-wider">
                  {contestCode}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
