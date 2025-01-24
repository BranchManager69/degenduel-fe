import React from "react";
import type { Contest } from "../../types";
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
  if (loading) {
    return (
      <div className="py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-dark-300 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-dark-300 h-[300px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contests.length) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-8">{title}</h2>
        <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            No {type} contests available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      {/* Section Header */}
      <div className="relative mb-8">
        {/* Decorative line */}
        <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-transparent" />

        <h2 className="relative inline-block text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text">
          {title}
          {/* Decorative dot */}
          <span className="absolute -right-3 top-0 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
        </h2>
      </div>

      {/* Contest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest, index) => (
          <div
            key={contest.id}
            className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
            style={{ animationDelay: `${index * 100}ms` }}
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
            />
          </div>
        ))}
      </div>

      {/* Bottom gradient line */}
      <div className="mt-12 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
    </div>
  );
};
