// src/pages/LandingPage.tsx

import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { MarketVerse } from "../../../components/animated-background/MarketVerse";
import { TokenVerse } from "../../../components/animated-background/TokenVerse";
import { ContestSection } from "../../../components/landing/duplicates-to-delete/ContestSection";
import { Features } from "../../../components/landing/duplicates-to-delete/Features";
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
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        // First check maintenance mode
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch contests
        if (isInMaintenance) {
          setError("DegenDuel is undergoing maintenance ⚙️ Try again later.");
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
          setError("DegenDuel is undergoing maintenance ⚙️ Try again later.");
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
          setError("DegenDuel is undergoing maintenance ⚙️ Try again later.");
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000);

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Single shared dark background */}
      <div className="fixed inset-0 bg-black/40 z-0" />

      {/* Background Layer Group - All visual effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* TokenVerse - Base layer */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <TokenVerse />
        </div>

        {/* MarketVerse - Blended layer */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 2, mixBlendMode: "lighten" }}
        >
          <MarketVerse />
        </div>

        {/* Cyberpunk Overlay Effects */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 3, opacity: 0.3 }}
        >
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "20%" }}
          />
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "80%", animationDelay: "-2s" }}
          />
        </div>
      </div>

      {/* Content Section */}
      <section className="relative" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            {/* Title Section */}
            <div className="flex flex-col items-center justify-center">
              {/* Logo */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <h1 className="text-5xl sm:text-6xl font-black tracking-tighter whitespace-nowrap">
                  <span className="relative inline-block">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                      DEGEN
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 blur-lg -z-10" />
                  </span>
                  <span className="relative inline-block mx-4 text-cyan-400 transform -skew-x-12 font-cyber">
                    ×
                  </span>
                  <span className="relative inline-block">
                    <span className="relative z-10 text-gray-400">DUEL</span>
                  </span>
                </h1>
              </div>

              {/* Single focused tagline */}
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 mb-6">
                High Stakes Trading Battles on Solana
              </h2>

              {/* Call to action buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                <RouterLink to="/contests" className="w-full sm:w-auto">
                  <button className="w-full relative group overflow-hidden">
                    <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500">
                      <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
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
                  </button>
                </RouterLink>

                <RouterLink to="/how-it-works" className="w-full sm:w-auto">
                  <button className="w-full relative group overflow-hidden">
                    <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm border border-brand-400/20 px-8 py-4 transition-all duration-300 hover:bg-dark-200/60">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                        <span className="text-brand-400 group-hover:text-brand-300">
                          MORE INFO
                        </span>
                        <svg
                          className="w-6 h-6 text-brand-400 group-hover:text-brand-300 transform group-hover:translate-x-1 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        {/* Features section - Reduced spacing */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Features />
          </div>
        </div>

        {/* Contest sections */}
        {isMaintenanceMode ? (
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <span className="animate-pulse">⚠</span>
                  <span>
                    DegenDuel is undergoing maintenance ⚙️ Try again later.
                  </span>
                  <span className="animate-pulse">⚙️</span>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg">
                <div className="text-red-500 animate-glitch">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {/* Add significant bottom margin to prevent footer overlap */}
              <div className="mb-32">
                <ContestSection
                  title="Live Duels"
                  type="active"
                  contests={activeContests}
                  loading={loading}
                />
                <ContestSection
                  title="Starting Soon"
                  type="pending"
                  contests={openContests}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
