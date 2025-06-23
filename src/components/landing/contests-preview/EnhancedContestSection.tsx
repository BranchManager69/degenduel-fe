import React from "react";

// Import both card types
import { useStore } from "../../../store/useStore";
import type { Contest } from "../../../types/index";
import { ContestCard } from "../../contest-browser/ContestCard";
import { ProminentContestCard } from "../../contest-browser/ProminentContestCard";

interface EnhancedContestSectionProps {
  title: string;
  type: "active" | "pending" | "completed" | "cancelled";
  contests: Contest[];
  loading: boolean;
  featuredContest?: Contest;
  featuredLabel?: string;
  isFeatureSection?: boolean; // NEW: Flag to indicate this is showing the featured contest
}

export const EnhancedContestSection: React.FC<EnhancedContestSectionProps> = ({
  title,
  type,
  contests,
  loading,
  featuredContest,
  featuredLabel = "🏆 CONTEST OF THE WEEK",
  isFeatureSection = false
}) => {
  const performanceMode = useStore(state => state.performanceMode);
  
  // For feature section, show prominent card if provided - CHECK THIS FIRST!
  // Currently ENABLED for debugging
  const isFeatureSectionActivatedFlag = true;
  if (isFeatureSectionActivatedFlag && isFeatureSection && featuredContest) {
    return (
      <section className="relative py-6">
        {/* Simplified cosmic effects for featured section */}
        {!performanceMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Simple gradient glow */}
            <div className="absolute -top-[200px] left-[5%] w-[600px] h-[600px] bg-gradient-to-r from-brand-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-[200px] right-[0%] w-[600px] h-[600px] bg-gradient-to-l from-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Simple static stars */}
            <div className="absolute inset-0">
              {Array(6).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: '2px',
                    height: '2px',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    top: `${(i * 16) + 10}%`,
                    left: `${(i * 15) + 20}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          {/* Featured Contest Card */}
          <div className="max-w-2xl mx-auto">
            <ProminentContestCard 
              contest={featuredContest} 
              featuredLabel={featuredLabel}
            />
          </div>
        </div>
      </section>
    );
  }

  // Don't render the active contests section if there are no active contests (but only for non-feature sections)
  if (type === "active" && contests.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="relative py-12">
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
      </section>
    );
  }

  // For pending contests with no entries, show empty state
  if (type === "pending" && contests.length === 0) {
    return (
      <section className="relative py-12">
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
      {/* Simplified effects container */}
      {!performanceMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Simple gradient background */}
          <div className="absolute -top-[100px] left-[10%] w-[400px] h-[400px] bg-gradient-to-r from-brand-500/3 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-[100px] right-[5%] w-[400px] h-[400px] bg-gradient-to-l from-purple-500/3 to-transparent rounded-full blur-3xl" />
        </div>
      )}

      <div className="relative">
        {/* Section Header with cosmic glow */}
        <div className="flex items-center justify-between mb-8">
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
        </div>

        {/* Contest Grid with enhanced perspective */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [perspective:1500px]">
          {contests.map((contest, index) => (
            <div
              key={contest.id}
              className="opacity-0 translate-x-full rotate-y-12 animate-contest-card-entrance group/card"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: "forwards",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/0 via-brand-400/10 to-purple-500/0 rounded-lg blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

              <div
                className="relative"
                style={{ zIndex: contests.length - index }}
              >
                <ContestCard contest={contest} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};