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
  if (loading) {
    return (
      <section className="py-12">
        <div className="space-y-4">
          <div className="h-8 bg-dark-300/50 w-64 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-dark-300/50 rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (contests.length === 0) {
    return (
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-brand-400 to-brand-500 text-transparent bg-clip-text">
          {title}
        </h2>
        <div className="text-center py-12 text-gray-400">
          No {type === "active" ? "live" : "joinable"} contests available at the
          moment.
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text">
            {title}
          </h2>
          {type === "active" && contests.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <span className="text-sm text-brand-400 animate-pulse">
                {contests.length} Live Match{contests.length !== 1 && "es"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => (
          <ContestCard
            key={contest.id}
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
        ))}
      </div>
    </section>
  );
};
