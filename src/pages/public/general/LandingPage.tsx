// src/pages/LandingPage.tsx

import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { MarketVerse } from "../../../components/visualization/MarketVerse";
import { ddApi } from "../../../services/dd-api";
import { Contest } from "../../../types/index";

export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
          return;
        }

        const response: Contest[] = await ddApi.contests.getAll();
        setActiveContests(response.filter((c) => c?.status === "active"));
        setOpenContests(response.filter((c) => c?.status === "pending"));
      } catch (err) {
        console.error("Failed to load contests:", err);
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load contests"
          );
        }
      }
    };

    fetchContests();
    const interval = setInterval(fetchContests, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Full-screen MarketVerse */}
      <div className="fixed inset-0">
        <MarketVerse />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-7xl w-full space-y-16">
            {/* Logo and Title */}
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-4 animate-fade-in">
                <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 animate-title-float">
                  DEGEN
                  <span className="inline-block mx-2 text-cyan-400 animate-spin-occasional">
                    ×
                  </span>
                  DUEL
                </h1>
              </div>
              <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto">
                Where <span className="text-brand-400">degens</span> battle for
                glory in
                <span className="text-brand-400"> high-stakes</span> portfolio
                warfare
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: "Live Duels", value: activeContests.length },
                { label: "Open Duels", value: openContests.length },
                { label: "Total Prize Pool", value: "∞ SOL" },
                { label: "Active Degens", value: "420+" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative bg-dark-200/20 backdrop-blur-sm rounded-lg p-4 border border-brand-400/10 hover:border-brand-400/30 transition-all duration-300"
                >
                  <div className="text-2xl font-bold text-brand-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 group-hover:text-brand-300 transition-colors">
                    {stat.label}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x rounded-lg" />
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <RouterLink to="/contests" className="w-full sm:w-auto">
                <button className="w-full group relative px-8 py-4 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative text-xl font-bold text-white">
                    ENTER THE ARENA
                  </span>
                </button>
              </RouterLink>

              <RouterLink to="/how-it-works" className="w-full sm:w-auto">
                <button className="w-full group relative px-8 py-4 bg-dark-200/40 backdrop-blur-sm rounded-lg border border-brand-400/20 overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative text-xl font-bold text-brand-400">
                    LEARN MORE
                  </span>
                </button>
              </RouterLink>
            </div>
          </div>
        </div>

        {/* Error/Maintenance Display */}
        {(error || isMaintenanceMode) && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
