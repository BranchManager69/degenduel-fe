// src/components/landing/ContestCard.tsx

import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../lib/utils";
import { ContestStatus, DifficultyLevel } from "../../../types";
import { Card } from "../../ui/Card";
import { ContestDifficulty } from "../contests-preview/ContestDifficulty";

export interface ContestCardProps {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  startTime: string;
  endTime: string;
  participantCount: number;
  maxParticipants: number;
  status: ContestStatus;
  difficulty: DifficultyLevel;
  contestCode: string;
  isParticipating: boolean;
}

export const ContestCard: React.FC<ContestCardProps & { index: number }> = ({
  id,
  name,
  description,
  entryFee,
  startTime,
  endTime,
  participantCount,
  maxParticipants,
  status,
  difficulty,
  contestCode,
  isParticipating,
  index,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isLive = status === "active";
  const progress = (participantCount / maxParticipants) * 100;
  const maxPrizePool = 0.9 * (maxParticipants * entryFee);
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

  return (
    <motion.div
      className="relative w-full h-full cursor-pointer preserve-3d"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: "2000px" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        className="relative w-full h-full duration-700"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="h-full group relative bg-dark-200/80 backdrop-blur-sm border-dark-300/50 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col">
            {/* Participation badge */}
            {isParticipating && (
              <div className="absolute -top-2 -right-2 z-30">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-brand-400 to-brand-600 opacity-75 blur-lg animate-pulse" />
                  <div className="relative px-4 py-1 bg-dark-200/95 clip-edges transform rotate-3 border-t border-r border-brand-400/50">
                    <span className="text-xs font-cyber tracking-widest text-brand-400 animate-pulse-slow">
                      ENTERED
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Header section */}
            <div className="relative h-32 overflow-hidden">
              {/* Enhanced gradient background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/40 via-brand-500/30 to-brand-400/40 animate-pulse-slow" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-purple-500/30 to-brand-400/20 animate-gradient-x" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine-slow" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-4 h-full flex flex-col">
                <Link to={`/contests/${id}`} className="flex-1">
                  <h3 className="text-2xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-200 truncate">
                    {name}
                  </h3>
                  <p className="text-gray-400/90 text-sm leading-relaxed mt-2 line-clamp-2">
                    {description}
                  </p>
                </Link>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-sm font-medium text-brand-300 font-cyber">
                    <FaClock className="inline-block mr-1 -mt-1" />
                    {timeRemaining}
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-sm clip-edges text-xs font-cyber tracking-wider uppercase ${getStatusColor()}`}
                  >
                    {getStatusText()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress section */}
            <div className="px-4 py-3 flex-1 flex flex-col">
              {/* Progress bars */}
              <div className="space-y-3">
                {/* Participants progress */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-cyber">
                    <span className="text-gray-400">Participants</span>
                    <span className="text-brand-300">
                      {participantCount} / {maxParticipants}
                    </span>
                  </div>
                  <div className="relative h-2 bg-dark-300/50 rounded-sm overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                    </motion.div>
                  </div>
                </div>

                {/* Prize pool progress */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-cyber">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="text-amber-300">
                      {formatCurrency(currentPrizePool)} /{" "}
                      {formatCurrency(maxPrizePool)} SOL
                    </span>
                  </div>
                  <div className="relative h-2 bg-dark-300/50 rounded-sm overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(currentPrizePool / maxPrizePool) * 100}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Join button - edge to edge */}
            <Link
              to={`/contests/${id}`}
              className="mt-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 transition-all font-cyber text-lg font-bold text-white uppercase tracking-wider">
                <div className="flex items-center justify-between px-6">
                  <span>{isParticipating ? "VIEW ENTRY" : "JOIN CONTEST"}</span>
                  {!isParticipating && (
                    <span className="text-white/90">
                      {formatCurrency(entryFee)} SOL
                    </span>
                  )}
                </div>
              </button>
            </Link>
          </Card>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
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
                      {formatCurrency(maxPrizePool)}
                    </p>
                    <span className="text-xs text-gray-500">SOL</span>
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

              {/* Edge to edge button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="w-full py-3 mt-4 bg-gradient-to-r from-brand-400 to-purple-500 hover:from-brand-300 hover:to-purple-400 transition-all font-cyber text-lg font-bold text-white uppercase tracking-wider"
              >
                <span>Back to Contest</span>
              </button>
            </div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Export a wrapped version that handles array rendering with animations
export const AnimatedContestCards: React.FC<{
  contests: ContestCardProps[];
}> = ({ contests }) => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
    >
      {contests.map((contest, index) => (
        <ContestCard key={contest.id} {...contest} index={index} />
      ))}
    </motion.div>
  );
};
