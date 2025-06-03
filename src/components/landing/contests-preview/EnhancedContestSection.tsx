import React from "react";
import { motion } from "framer-motion";

// Import both card types
import { ContestCard } from "../../contest-browser/ContestCard";
import { ProminentContestCard } from "../../contest-browser/ProminentContestCard";
import type { Contest } from "../../../types/index";

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
  // Don't render the active contests section if there are no active contests
  if (type === "active" && contests.length === 0 && !loading) {
    return null;
  }

  // For feature section, show prominent card if provided
  if (isFeatureSection && featuredContest) {
    return (
      <section className="relative py-16">
        {/* Enhanced cosmic effects for featured section */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Enhanced solar flares for featured */}
          <div className="absolute -top-[300px] left-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/10 via-purple-500/15 to-transparent rounded-full blur-[150px] animate-pulse-slow" />
          <div
            className="absolute -bottom-[400px] right-[0%] w-[1000px] h-[1000px] bg-gradient-to-l from-brand-500/10 via-purple-500/15 to-transparent rounded-full blur-[180px] animate-pulse-slow"
            style={{ animationDelay: "-3s" }}
          />

          {/* Enhanced star field */}
          <div className="absolute inset-0">
            {Array(12).fill(null).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  backgroundColor: i % 3 === 0 ? 'rgba(153, 51, 255, 0.6)' : i % 3 === 1 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(128, 0, 255, 0.6)',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  boxShadow: `0 0 8px ${i % 3 === 0 ? 'rgba(153, 51, 255, 0.6)' : i % 3 === 1 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(128, 0, 255, 0.6)'}`
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                  y: [0, -20, 0]
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 3
                }}
              />
            ))}
          </div>

          {/* Enhanced energy waves for featured */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/8 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/8 to-transparent"
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
            />
          </div>
        </div>

        <div className="relative">
          {/* Enhanced Section Header for featured */}
          <div className="flex items-center justify-center mb-12">
            <motion.div
              className="space-y-2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-4xl md:text-5xl font-black font-cyber tracking-wide bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500 text-transparent bg-clip-text relative group"
                style={{
                  textShadow: "0 0 30px rgba(153, 51, 255, 0.5)"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/30 to-transparent blur-2xl animate-pulse-slow" />
                {title}
                <span
                  className="absolute -left-[1px] top-[1px] text-4xl md:text-5xl font-black font-cyber text-purple-600/20 select-none"
                >
                  {title}
                </span>
              </h2>
              <p className="text-lg text-gray-300 font-medium">
                The most anticipated trading competition of the week
              </p>
            </motion.div>
          </div>

          {/* Featured Contest Card */}
          <div className="max-w-5xl mx-auto">
            <ProminentContestCard 
              contest={featuredContest} 
              featuredLabel={featuredLabel}
            />
          </div>
        </div>
      </section>
    );
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
      {/* Cosmic effects container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Solar flares */}
        <div className="absolute -top-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Star field - multiple layers for parallax effect */}
        <div
          className="absolute inset-0 animate-float"
          style={{ animationDuration: "15s" }}
        >
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[10%] left-[25%] animate-sparkle"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[30%] left-[65%] animate-sparkle"
            style={{ animationDelay: "-1s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[70%] left-[15%] animate-sparkle"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[80%] left-[85%] animate-sparkle"
            style={{ animationDelay: "-2s" }}
          />
        </div>

        {/* Cosmic dust streams */}
        <div className="absolute inset-0">
          <div
            className="absolute h-[1px] w-[200px] bg-brand-400/10 blur-sm animate-random-slide"
            style={{ animationDuration: "20s", top: "30%" }}
          />
          <div
            className="absolute h-[1px] w-[300px] bg-purple-400/10 blur-sm animate-random-slide-reverse"
            style={{ animationDuration: "25s", top: "60%" }}
          />
          <div
            className="absolute h-[1px] w-[250px] bg-brand-400/10 blur-sm animate-random-slide"
            style={{ animationDuration: "22s", top: "80%" }}
          />
        </div>

        {/* Energy waves */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-vertical opacity-20"
            style={{ animationDuration: "12s" }}
          />
        </div>
      </div>

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