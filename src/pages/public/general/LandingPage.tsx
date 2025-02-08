// src/pages/LandingPage.tsx

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ContestSection } from "../../../components/landing/ContestSection";
import { Features } from "../../../components/landing/Features";
import { MarketVerse } from "../../../components/visualization/MarketVerse";
import { isContestLive } from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import { Contest } from "../../../types";

// TODO: Move to a separate file
interface ContestResponse {
  contests: Contest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const fetchContests = async () => {
      try {
        // First check maintenance mode
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch contests
        if (isInMaintenance) {
          setError(
            "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
          setLoading(false);
          return;
        }

        const response = await ddApi.contests.getAll();
        const contestsArray: Contest[] = Array.isArray(response)
          ? response
          : (response as ContestResponse).contests;
        setActiveContests(contestsArray.filter(isContestLive));
        setOpenContests(
          contestsArray.filter(
            (contest: Contest) => contest.status === "pending"
          )
        );
      } catch (err) {
        console.error("Failed to load contests:", err);
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        } else {
          setError("Failed to load contests");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContests();

    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000);

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  // Animation variants for scroll reveal
  const revealVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.19, 1.0, 0.22, 1.0],
      },
    },
  };

  const statsContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const statItemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* MarketVerse Background with enhanced overlay effects */}
      <div className="fixed inset-0">
        <MarketVerse />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90 pointer-events-none" />
        {/* Additional cosmic effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,0,255,0.1)_0%,transparent_70%)] animate-pulse-slow" />
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/20 to-transparent animate-scan-vertical"
            style={{ left: "20%" }}
          />
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/20 to-transparent animate-scan-vertical"
            style={{ left: "80%", animationDelay: "-2s" }}
          />
        </div>
      </div>

      {/* Hero Section - Reduced vertical padding */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            {/* Title Section */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <h2 className="text-brand-300 text-xl tracking-wider font-medium">
                Make PvP Great Again
              </h2>
              <div className="relative">
                <h1 className="text-7xl font-black tracking-tighter">
                  <span className="relative inline-block">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                      DEGEN
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 blur-lg -z-10" />
                  </span>
                  <span className="relative inline-block mx-2 text-gray-400 transform -skew-x-12 font-cyber">
                    ×
                  </span>
                  <span className="relative inline-block group">
                    <span className="relative z-10 text-gray-400 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-brand-400 group-hover:via-brand-500 group-hover:to-brand-600 transition-all duration-500">
                      DUEL
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-500/10 to-brand-600/0 blur-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </span>
                </h1>
                {/* Subtle line accent */}
                <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
              </div>
              <p className="text-xl text-gray-400 mt-4 font-medium tracking-wide">
                <span className="text-brand-400">Launching Soon</span>
                <span className="mx-2">on</span>
                <span className="text-brand-300">Solana</span>
              </p>
            </div>

            {/* Main content with subtle transitions */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              {/* Welcome text with subtle effect */}
              <div className="relative inline-block mb-6">
                <span className="text-2xl sm:text-3xl font-light tracking-widest text-brand-300 opacity-90 hover:opacity-100 transition-opacity uppercase">
                  Welcome to the Arena
                </span>
              </div>

              {/* Epic tagline with subtle effects */}
              <div className="mt-4 max-w-4xl mx-auto space-y-3">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600">
                  Think You're A Top Trader?
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 leading-snug font-medium tracking-wide">
                  Duel against degens far and wide in
                  <span className="text-brand-400 font-bold mx-1.5">
                    high-stakes battle royales.
                  </span>
                  <br />
                  Why fight the market?
                  <span className="text-brand-400 font-bold mx-1.5">
                    Duel real degens
                  </span>
                  and make
                  <span className="text-brand-400 font-bold mx-1.5">
                    huge profits
                  </span>
                  the fun way.
                </p>
              </div>

              {/* Animated separator - made thinner */}
              <div className="relative h-px w-40 mx-auto my-8 overflow-hidden rounded-full bg-dark-300/50">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
              </div>

              {/* Stats section with synchronized reveal */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={statsContainerVariants}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 mb-12"
              >
                {[
                  {
                    label: "Duels In Progress",
                    value: activeContests.length,
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Joinable Duels",
                    value: openContests.length,
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Total Winnings",
                    value: "∞ SOL",
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Tokens Supported",
                    value: "69",
                    valueColor: "text-brand-300",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    variants={statItemVariants}
                    className="group relative p-6 rounded-xl bg-dark-200/20 backdrop-blur-sm hover:bg-dark-200/40 transition-all duration-300"
                  >
                    <div className="relative z-10">
                      <div
                        className={`text-4xl font-bold ${stat.valueColor} font-mono tracking-wider group-hover:scale-110 transition-transform duration-300`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-gray-400 group-hover:text-brand-300 transition-colors mt-2">
                        {stat.label}
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400/5 via-transparent to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Interactive particle effect container */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(127,0,255,0.1)_0%,transparent_50%)]" />
              </div>

              {/* CTA Buttons with reveal */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
              >
                <RouterLink to="/contests" className="w-full sm:w-auto">
                  <button className="w-full relative group overflow-hidden">
                    {/* Main button container with clip-path */}
                    <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500">
                      {/* Inner content container */}
                      <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                        {/* Button content */}
                        <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                          <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                            FIND A DUEL
                          </span>
                          <svg
                            className="w-6 h-6 text-emerald-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </RouterLink>

                <RouterLink to="/how-it-works" className="w-full sm:w-auto">
                  <button className="w-full relative group overflow-hidden">
                    {/* Main button container with clip-path */}
                    <div className="relative clip-edges bg-gradient-to-r from-dark-300 to-dark-200 p-[1px] transition-all duration-300 group-hover:from-emerald-900/50 group-hover:to-teal-900/50">
                      {/* Inner content container */}
                      <div className="relative clip-edges bg-dark-300/40 backdrop-blur-sm px-8 py-4">
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                        {/* Button content */}
                        <div className="relative flex items-center justify-center space-x-2">
                          <span className="text-xl font-cyber text-gray-400 group-hover:text-emerald-400 transition-colors">
                            MORE INFO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-emerald-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </RouterLink>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features section - Reduced spacing */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-dark-200/50 backdrop-blur-sm" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Features />
          </div>
        </div>

        {/* Contest sections - Adjusted spacing and padding */}
        {isMaintenanceMode ? (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <span className="animate-pulse">⚠</span>
                  <span>
                    DegenDuel is undergoing scheduled maintenance. Please try
                    again later.
                  </span>
                  <span className="animate-pulse">⚠</span>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg">
                <div className="text-red-500 animate-glitch">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ContestSection
                title="Live Battles"
                type="active"
                contests={activeContests}
                loading={loading}
              />
              <ContestSection
                title="Open Challenges"
                type="pending"
                contests={openContests}
                loading={loading}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
