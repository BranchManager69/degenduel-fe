// src/components/landing/ContestSection.tsx

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import type { Contest } from "../../types";
import { ContestCard } from "./contests/ContestCard";

interface ContestSectionProps {
  title: string;
  type: "active" | "pending";
  contests: Contest[];
  loading: boolean;
}

export const ContestSection: React.FC<ContestSectionProps> = ({
  title,
  type,
  contests,
  loading,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Don't render the active contests section if there are no active contests
  if (type === "active" && contests.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <motion.section
        className="relative py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="relative space-y-4">
          <div className="h-8 w-64 rounded animate-pulse bg-dark-300/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded animate-pulse bg-dark-300/20"
              />
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  // For pending contests with no entries, show empty state
  if (type === "pending" && contests.length === 0) {
    return (
      <motion.section
        className="relative py-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative">
          <h2 className="text-2xl font-bold mb-8 font-cyber tracking-wide bg-gradient-to-r from-green-400 to-brand-500 text-transparent bg-clip-text">
            {title}
          </h2>
          <div className="text-center py-12 text-gray-400 font-cyber">
            No joinable contests available at the moment.
          </div>
        </div>
      </motion.section>
    );
  }

  const isPending = type === "pending";

  return (
    <motion.section
      className="relative py-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      {/* Cosmic effects container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute -top-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-r from-brand-500/2 to-transparent rounded-full blur-[100px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-l from-brand-500/2 to-transparent rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Minimal star field */}
        <div
          className="absolute inset-0 animate-float opacity-30"
          style={{ animationDuration: "15s" }}
        >
          <div
            className="absolute h-1 w-1 bg-white/10 rounded-full top-[10%] left-[25%] animate-sparkle"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/10 rounded-full top-[70%] left-[15%] animate-sparkle"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        {/* Single subtle scan line */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/2 to-transparent animate-scan-fast opacity-10"
            style={{ animationDuration: "8s" }}
          />
        </div>
      </div>

      <div className="relative">
        {/* Section Header with cosmic glow */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="space-y-1">
            <h2
              className={`text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r ${
                isPending
                  ? "from-green-400 via-brand-400 to-brand-500"
                  : "from-brand-400 via-purple-400 to-brand-500"
              } text-transparent bg-clip-text relative group`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
              {title}
              <span
                className={`absolute -left-[1px] top-[1px] text-2xl font-bold font-cyber ${
                  isPending ? "text-green-600/30" : "text-purple-600/30"
                } select-none`}
              >
                {title}
              </span>
            </h2>
            {type === "active" && contests.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
                <span className="text-sm text-brand-400 animate-pulse font-cyber">
                  {contests.length} Live Match{contests.length !== 1 && "es"}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Contest Grid with enhanced perspective */}
        <div
          className={`relative grid grid-cols-1 ${
            isMobile ? "" : "md:grid-cols-2 lg:grid-cols-3"
          } gap-6 [perspective:1500px]`}
        >
          {contests.map((contest, index) => (
            <motion.div
              key={contest.id}
              className="opacity-0 group/card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.19, 1.0, 0.22, 1.0],
              }}
              whileHover={{
                y: -5,
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/0 via-brand-400/10 to-purple-500/0 rounded-lg blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

              <div
                className="relative"
                style={{ zIndex: contests.length - index }}
              >
                <ContestCard
                  id={String(contest.id)}
                  name={contest.name}
                  description={contest.description}
                  entryFee={Number(contest.entry_fee)}
                  prizePool={Number(contest.prize_pool)}
                  startTime={contest.start_time}
                  endTime={contest.end_time}
                  participantCount={contest.participant_count}
                  maxParticipants={contest.max_participants}
                  status={contest.status}
                  difficulty={contest.settings.difficulty}
                  contestCode={contest.contest_code}
                  isParticipating={contest.is_participating ?? false}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
