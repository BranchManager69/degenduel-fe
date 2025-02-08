// src/pages/LandingPage.tsx

import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ContestSection } from "../../../components/landing/ContestSection";
import { Features } from "../../../components/landing/Features";
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

// Landing Page
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
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
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
        // Check if the error is a 503 (maintenance mode)
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        } else {
          setError("Failed to load contests");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContests();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            {/* Title Section */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <h2 className="text-brand-300 text-xl tracking-wider font-medium">
                UNLEASH THE POWER OF
              </h2>
              <h1 className="text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-brand-400 to-brand-500 text-transparent bg-clip-text">
                  DEGEN
                </span>
                <span className="text-gray-400 mx-2">×</span>
                <span className="text-gray-400">DUEL</span>
              </h1>
              <p className="text-white text-lg mt-2">Trading Championship</p>
            </div>

            {/* Main content with enhanced animations */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              {/* Welcome text with enhanced effect */}
              <div className="relative inline-block mb-6">
                <span className="text-2xl sm:text-3xl font-light tracking-widest text-brand-300 opacity-90 hover:opacity-100 transition-opacity uppercase group">
                  <span className="group-hover:animate-glitch relative">
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-scan-line" />
                  </span>
                </span>
              </div>

              {/* Epic tagline with enhanced effects */}
              <div className="mt-4 max-w-4xl mx-auto space-y-3">
                <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 text-transparent bg-clip-text animate-gradient-x tracking-tight leading-none">
                  Where Diamond Hands Meet AI Supremacy
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 leading-snug font-medium tracking-wide">
                  Challenge the elite in
                  <span className="text-brand-400 font-bold mx-1.5">
                    high-stakes
                  </span>
                  competitions. Trade against both
                  <span className="text-brand-400 font-bold mx-1.5">
                    human degens
                  </span>
                  and
                  <span className="text-brand-400 font-bold mx-1.5">
                    neural networks
                  </span>
                </p>
              </div>

              {/* Animated separator - made thinner */}
              <div className="relative h-px w-40 mx-auto my-8 overflow-hidden rounded-full bg-dark-300/50">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
              </div>

              {/* Stats section with cleaner styling */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 mb-12">
                {[
                  {
                    label: "Live Contests",
                    value: activeContests.length,
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Open Contests",
                    value: openContests.length,
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Total Prize Pool",
                    value: "∞ SOL",
                    valueColor: "text-brand-300",
                  },
                  {
                    label: "Agents Ready",
                    value: "42",
                    valueColor: "text-brand-300",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
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
                  </div>
                ))}
              </div>

              {/* Interactive particle effect container */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(127,0,255,0.1)_0%,transparent_50%)]" />
              </div>

              {/* CTA Buttons with dramatic effects */}
              <div className="mt-12 max-w-lg mx-auto sm:flex sm:justify-center gap-8">
                <RouterLink
                  to="/contests"
                  className="block w-full sm:w-auto mb-4 sm:mb-0"
                >
                  <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,rgba(127,0,255,0.3)_0%,transparent_70%)]" />

                    {/* Button content */}
                    <div className="relative flex items-center justify-center space-x-2">
                      <span className="text-xl font-bold text-white group-hover:text-brand-200 transition-colors">
                        BATTLE NOW
                      </span>
                      <svg
                        className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
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

                    {/* Glowing border */}
                    <div className="absolute inset-0 border border-white/20 rounded-lg group-hover:border-brand-400/50 transition-colors duration-300" />
                  </button>
                </RouterLink>

                <RouterLink
                  to="/how-it-works"
                  className="block w-full sm:w-auto"
                >
                  <button className="w-full group relative px-8 py-4 bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    {/* Hover effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Button content */}
                    <span className="relative text-xl font-bold text-brand-300 group-hover:text-brand-200 transition-colors">
                      LEARN MORE
                    </span>

                    {/* Border */}
                    <div className="absolute inset-0 border border-brand-400/20 rounded-lg group-hover:border-brand-400/40 transition-colors duration-300" />
                  </button>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="relative mt-20">
          <div className="absolute inset-0 bg-dark-200/50 backdrop-blur-sm" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <Features />
          </div>
        </div>

        {/* Contest sections */}
        {isMaintenanceMode ? (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <span className="animate-pulse">⚠</span>
                  <span>
                    ⚙️ DegenDuel is currently undergoing scheduled maintenance.
                    Please try again later.
                  </span>
                  <span className="animate-pulse">⚠</span>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="text-center p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg">
                <div className="text-red-500 animate-glitch">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
