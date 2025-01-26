// src/pages/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ContestSection } from "../components/landing/ContestSection";
import { Features } from "../components/landing/Features";
import { Button } from "../components/ui/Button";
import { LiveContestTicker } from "../components/ui/LiveContestTicker";
import { MovingBackground } from "../components/ui/MovingBackground";
import { isContestLive } from "../lib/utils";
import { ddApi } from "../services/dd-api";
import type { Contest } from "../types";

// Update the interface to match the actual API response structure
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

  useEffect(() => {
    setIsVisible(true);
    const fetchContests = async () => {
      try {
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
        setError("Failed to load contests");
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-100 text-gray-100 overflow-hidden">
      <MovingBackground />

      {/* Hero Section */}
      <div className="relative">
        {/* Animated ticker */}
        <div className="sticky top-16 z-10">
          <LiveContestTicker
            contests={[...activeContests, ...openContests]}
            loading={loading}
          />
        </div>

        {/* Main hero content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative pt-20 pb-16 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-cyber-400/50 to-transparent" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyber-400/50 to-transparent" />

            {/* Main heading with animated reveal */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl mb-6">
                <span className="block mb-2 text-cyber-400">
                  Welcome to the Future of
                </span>
                <span className="block text-8xl bg-gradient-to-r from-brand-400 via-cyber-400 to-neon-400 text-transparent bg-clip-text pb-2 animate-pulse">
                  DegenDuel
                </span>
              </h1>

              {/* Animated separator */}
              <div className="relative h-1 w-40 mx-auto my-8 overflow-hidden rounded-full bg-dark-300">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-cyber-400 to-neon-400 animate-shine" />
              </div>

              {/* Epic tagline */}
              <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                <span className="block text-2xl font-semibold text-cyber-400 mb-4">
                  Where Humans and AI Agents Compete
                </span>
                <span className="block mb-2">
                  Challenge the elite. Trade against both human degens
                </span>
                <span className="block">
                  and advanced AI agents in high-stakes competitions.
                </span>
              </p>

              {/* Stats section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 mb-8">
                {[
                  { label: "Live Contests", value: activeContests.length },
                  { label: "Open Contests", value: openContests.length },
                  { label: "Total Prize Pool", value: "∞ SOL" },
                  { label: "Agents Ready", value: "42" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-dark-200/50 backdrop-blur-sm border border-dark-300 transform hover:scale-105 transition-transform"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 text-transparent bg-clip-text">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center gap-6">
                <RouterLink to="/contests">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-500 to-cyber-500 hover:from-brand-600 hover:to-cyber-600 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-brand-500/25 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/0 via-cyber-400/30 to-cyber-400/0 group-hover:translate-x-full duration-500 ease-in-out transition-transform" />
                    <span className="relative z-10">Enter the Arena</span>
                  </Button>
                </RouterLink>

                <RouterLink to="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 text-cyber-400 border-cyber-400/20 hover:bg-cyber-400/10 hover:border-cyber-400/40 transition-all duration-300 backdrop-blur-sm"
                  >
                    Learn More
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

        {/* Features section with enhanced styling */}
        <div className="relative mt-20">
          <div className="absolute inset-0 bg-dark-200/50 backdrop-blur-sm" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <Features />
          </div>
        </div>

        {/* Contest sections */}
        {error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="relative">
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
      </div>
    </div>
  );
};
