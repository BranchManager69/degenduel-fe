import React from "react";
import type { Contest } from "../../types/index";
import { ContestCard } from "./ContestCard";

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
  // Don't render the active contests section if there are no active contests
  if (type === "active" && contests.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="relative py-12">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base dark gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-800 opacity-90" />

          {/* Animated gradient overlays */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-gradient-x"
              style={{ animationDuration: "15s" }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-gradient-y"
              style={{ animationDuration: "20s" }}
            />
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="h-8 bg-dark-300/50 w-64 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-dark-300/50 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // For pending contests with no entries, show empty state
  if (type === "pending" && contests.length === 0) {
    return (
      <section className="relative py-12">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base dark gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-800 opacity-90" />

          {/* Animated gradient overlays */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-gradient-x"
              style={{ animationDuration: "15s" }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent animate-gradient-y"
              style={{ animationDuration: "20s" }}
            />
          </div>
        </div>

        <div className="relative">
          <h2 className="text-2xl font-bold mb-8 font-cyber tracking-wide bg-gradient-to-r from-green-400 to-brand-500 text-transparent bg-clip-text">
            {title}
          </h2>
          <div className="text-center py-12 text-gray-400 font-cyber">
            No joinable contests available at the moment.
          </div>
        </div>
      </section>
    );
  }

  const isPending = type === "pending";

  return (
    <section className="relative py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base dark gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-800 opacity-90" />

        {/* Animated gradient overlays */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 bg-gradient-to-r from-transparent ${
              isPending ? "via-green-500/5" : "via-purple-500/5"
            } to-transparent animate-gradient-x`}
            style={{ animationDuration: "15s" }}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b from-transparent ${
              isPending ? "via-brand-500/5" : "via-brand-500/5"
            } to-transparent animate-gradient-y`}
            style={{ animationDuration: "20s" }}
          />
        </div>

        {/* Energy disruption lines */}
        <div className="absolute inset-0">
          <div
            className={`absolute h-[2px] w-[200px] ${
              isPending ? "bg-green-400/20" : "bg-brand-400/20"
            } blur-sm animate-random-slide`}
            style={{ animationDuration: "7s", animationDelay: "-2s" }}
          />
          <div
            className={`absolute h-[2px] w-[300px] ${
              isPending ? "bg-brand-400/20" : "bg-purple-400/20"
            } blur-sm animate-random-slide-reverse`}
            style={{ animationDuration: "8s", animationDelay: "-4s" }}
          />
        </div>

        {/* Ambient glow effects */}
        <div className="absolute inset-0 opacity-30">
          <div
            className={`absolute top-[20%] left-[10%] w-[40%] h-[40%] ${
              isPending ? "bg-green-500/10" : "bg-brand-500/10"
            } rounded-full blur-[100px] animate-float`}
            style={{ animationDuration: "18s" }}
          />
          <div
            className={`absolute bottom-[10%] right-[20%] w-[35%] h-[35%] ${
              isPending ? "bg-brand-500/10" : "bg-purple-500/10"
            } rounded-full blur-[100px] animate-float`}
            style={{ animationDuration: "15s", animationDelay: "-5s" }}
          />
        </div>

        {/* Grid overlay */}
        <div
          className={`absolute inset-0 bg-[linear-gradient(${
            isPending ? "rgba(0,255,128,0.05)" : "rgba(68,0,255,0.05)"
          }_1px,transparent_1px),linear-gradient(90deg,${
            isPending ? "rgba(0,255,128,0.05)" : "rgba(68,0,255,0.05)"
          }_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]`}
        />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2
              className={`text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r ${
                isPending
                  ? "from-green-400 via-brand-400 to-brand-500"
                  : "from-brand-400 via-purple-400 to-brand-500"
              } text-transparent bg-clip-text relative group`}
            >
              {title}
              {/* Glitch effect for title */}
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
        </div>

        {/* Contest Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [perspective:1000px]">
          {contests.map((contest, index) => (
            <div
              key={contest.id}
              className="opacity-0 translate-x-full rotate-y-12 animate-contest-card-entrance"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: "forwards",
                transformStyle: "preserve-3d",
              }}
            >
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
