// src/pages/LandingPage.tsx

import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ContestSection } from "../../../components/landing/contests/ContestSection";
import { Features } from "../../../components/landing/features/Features";
import { ddApi } from "../../../services/dd-api";
import { Contest } from "../../../types/index";

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
            "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
          setLoading(false);
          return;
        }

        const response: Contest[] = await ddApi.contests.getAll();
        console.log("Contest response:", response);

        if (!response || response.length === 0) {
          console.log("No contests found or invalid response format");
        }

        // Filter contests with proper error handling
        const activeContestsArray = response.filter(
          (contest: Contest) =>
            contest && contest.status && contest.status === "active"
        );
        const openContestsArray = response.filter(
          (contest: Contest) =>
            contest && contest.status && contest.status === "pending"
        );

        console.log("Filtered contests:", {
          active: activeContestsArray,
          open: openContestsArray,
        });

        setActiveContests(activeContestsArray);
        setOpenContests(openContestsArray);
      } catch (err) {
        console.error("Failed to load contests:", err);
        // Check if the error is a 503 (maintenance mode)
        if (err instanceof Error) {
          if (err.message.includes("503")) {
            setIsMaintenanceMode(true);
            setError(
              "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
            );
          } else {
            setError(err.message || "Failed to load contests");
          }
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
            "DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden">
      {/* Smooth Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base dark gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-800 to-black opacity-90" />

        {/* Cursor light effect - follows mouse */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(124,58,237,0.03),transparent_100%)] motion-safe:transition-[background-position] duration-1000" />

        {/* Random energy disruptions */}
        <div className="absolute inset-0">
          <div
            className="absolute h-[2px] w-[100px] bg-brand-400/20 blur-sm animate-random-slide"
            style={{ animationDuration: "3s", animationDelay: "-1s" }}
          />
          <div
            className="absolute h-[2px] w-[200px] bg-violet-400/20 blur-sm animate-random-slide-reverse"
            style={{ animationDuration: "7s", animationDelay: "-3s" }}
          />
          <div
            className="absolute h-[3px] w-[150px] bg-cyan-400/20 blur-sm animate-random-slide"
            style={{ animationDuration: "5s", animationDelay: "-2s" }}
          />
        </div>

        {/* Smooth moving gradients */}
        <div className="absolute inset-0">
          {/* Primary ambient glow */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute top-[10%] left-[15%] w-[50%] h-[50%] bg-brand-500/20 rounded-full blur-[100px] animate-float"
              style={{ animationDuration: "15s" }}
            />
            <div
              className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[100px] animate-float"
              style={{ animationDuration: "20s", animationDelay: "-5s" }}
            />
          </div>

          {/* Subtle moving gradient overlay */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/10 to-transparent animate-gradient-x"
              style={{ animationDuration: "15s" }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-gradient-y"
              style={{ animationDuration: "20s" }}
            />
          </div>

          {/* Ultra-subtle energy waves */}
          <div className="absolute inset-0 opacity-[0.05]">
            {/* Indigo wave */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_80%)] animate-pulse-slow" />
            {/* Neon purple wave */}
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.08),transparent_80%)] animate-pulse-slow"
              style={{ animationDelay: "-3s" }}
            />
            {/* Violet wave */}
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_80%)] animate-pulse-slow"
              style={{ animationDelay: "-7s" }}
            />
            {/* Cyan accent */}
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_80%)] animate-pulse-slow"
              style={{ animationDelay: "-10s" }}
            />
          </div>
        </div>

        {/* Random sparkles */}
        <div className="absolute inset-0">
          <div
            className="absolute w-1 h-1 bg-white/30 rounded-full blur-[1px] animate-sparkle"
            style={{ top: "20%", left: "30%", animationDelay: "-1.5s" }}
          />
          <div
            className="absolute w-1 h-1 bg-white/30 rounded-full blur-[1px] animate-sparkle"
            style={{ top: "60%", left: "70%", animationDelay: "-3.5s" }}
          />
          <div
            className="absolute w-1 h-1 bg-white/30 rounded-full blur-[1px] animate-sparkle"
            style={{ top: "40%", left: "85%", animationDelay: "-2.5s" }}
          />
        </div>

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* Add mouse tracking effect */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.addEventListener('mousemove', (e) => {
            document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
            document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
          });
        `,
        }}
      />

      {/* Content container */}
      <div className="relative z-10">
        {/* Logo Section with Epic Entrance */}
        <div className="relative z-10 mt-12">
          {/* Logo Text with Directional Entrances */}
          <div className="flex items-center justify-center mb-2">
            <div className="opacity-0 animate-slide-in-left delay-[500ms] -mr-4">
              <h1 className="text-6xl font-black tracking-tighter text-purple-400 hover:scale-105 transition-transform duration-300 relative group">
                <span className="relative z-10">DEGEN</span>
                {/* Text shadow effect */}
                <span className="absolute -left-0.5 top-0.5 text-purple-900/50 z-0 blur-[1px] select-none">
                  DEGEN
                </span>
                {/* Glowing outline */}
                <div className="absolute inset-0 opacity-75 blur-lg bg-purple-500/50 group-hover:opacity-100 transition-opacity" />
              </h1>
            </div>

            <div className="opacity-0 animate-emerge-center delay-[1000ms] relative z-30 -mx-2">
              <span className="text-6xl font-cyber relative inline-block text-cyan-400 group animate-spin-occasional">
                <span className="absolute inset-0 blur-[2px] text-cyan-400/75 animate-pulse">
                  ×
                </span>
                <span
                  className="absolute inset-0 blur-[3px] text-cyan-400/50 animate-pulse"
                  style={{ animationDelay: "150ms" }}
                >
                  ×
                </span>
                <span className="relative">×</span>
              </span>
            </div>

            <div className="opacity-0 animate-slide-in-right delay-[500ms] -ml-4">
              <h1 className="text-6xl font-black tracking-tighter text-white hover:scale-105 transition-transform duration-300 relative group">
                <span className="relative z-10">DUEL</span>
                {/* Text shadow effect */}
                <span className="absolute -left-0.5 top-0.5 text-gray-800/50 z-0 blur-[1px] select-none">
                  DUEL
                </span>
                {/* Glowing outline */}
                <div className="absolute inset-0 opacity-75 blur-lg bg-gray-500/50 group-hover:opacity-100 transition-opacity" />
              </h1>
            </div>
          </div>

          {/* Radial Glow Effects */}
          <div className="absolute inset-0 -z-20">
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/30 via-cyan-500/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/20 via-transparent to-transparent animate-spin-slow" />
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-4">
              {/* Title Section */}
              <div className="flex flex-col items-center justify-center">
                {/* Top Text - Appears first with glow effect */}
                <div className="overflow-hidden">
                  <h2
                    className="text-2xl font-cyber tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-brand-300 animate-title-slide-down"
                    style={{
                      textShadow: "0 0 20px rgba(139,92,246,0.5)",
                      animationDelay: "0.5s",
                      animationFillMode: "backwards",
                    }}
                  >
                    MAKE PVP GREAT AGAIN
                  </h2>
                </div>

                {/* Bottom Text Container - Appears with typewriter effect */}
                <div className="space-y-4 overflow-hidden">
                  {/* Launching Soon Text */}
                  <div
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: "1.5s",
                      animationFillMode: "backwards",
                    }}
                  >
                    <p className="text-xl font-medium tracking-wide flex items-center justify-center gap-3">
                      <span className="text-brand-400 animate-pulse">
                        {/* Launching Soon */}
                      </span>
                      <span className="h-px w-8 bg-gradient-to-r from-transparent via-brand-400 to-transparent"></span>
                      <span className="text-brand-300 font-cyber tracking-wider">
                        {/* Solana */}
                      </span>
                    </p>
                  </div>

                  {/* Welcome Text - Appears with fade and slide */}
                  <div
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: "3s",
                      animationFillMode: "backwards",
                    }}
                  >
                    <div className="relative">
                      <span className="text-3xl font-light tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-brand-300/50 via-brand-400 to-brand-300/50 uppercase">
                        Welcome to the Arena{" "}
                        {/* this literally doesn't show up anywhere */}
                      </span>
                      {/* Animated underline */}
                      <div className="absolute bottom-0 left-0 w-full h-px">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-slide-right"
                          style={{ animationDelay: "2.5s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content transitions */}
              <div
                className={`transform transition-all duration-1000 mt-8 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ animationDelay: "3s" }}
              >
                {/* Epic tagline with subtle effects */}
                <div className="mt-4 max-w-4xl mx-auto space-y-3">
                  <h2 className="text-3xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600">
                    This Isn't Your Grandpa's Exchange.
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-400 leading-snug font-medium tracking-wide">
                    Duel against degens far and wide
                    <span className="text-brand-400 font-bold mx-1.5">
                      high-stakes battle royales
                    </span>
                    for all the marbles.
                    <br />
                    <br />
                    Why fight the market? Challenge
                    <span className="text-brand-400 font-bold mx-1.5">
                      real degens
                    </span>
                    and make
                    <span className="text-brand-400 font-bold mx-1.5">
                      fat stacks
                    </span>
                    the fun way.
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
                    <button className="w-full group relative px-8 py-3 bg-gradient-to-br from-brand-500/80 via-brand-500/90 to-brand-600 rounded-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-brand-500/20">
                      {/* Glass effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Animated glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-300 animate-glow" />

                      {/* Button content */}
                      <div className="relative flex items-center justify-center space-x-2">
                        <span className="text-lg font-semibold text-white tracking-wide">
                          FIND A DUEL
                        </span>
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                    </button>
                  </RouterLink>

                  <RouterLink
                    to="/how-it-works"
                    className="block w-full sm:w-auto"
                  >
                    <button className="w-full group relative px-8 py-3 bg-dark-200/40 backdrop-blur-sm rounded-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                      {/* Glass effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Subtle border glow */}
                      <div className="absolute inset-0 rounded-lg border border-brand-400/20 group-hover:border-brand-400/40 transition-colors duration-300" />

                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      {/* Button content */}
                      <span className="relative text-lg font-semibold text-brand-300 group-hover:text-brand-200 tracking-wide transition-colors">
                        MORE INFO
                      </span>
                    </button>
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div className="relative mt-20">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <Features />
            </div>
          </div>

          {/* Contest sections */}
          {isMaintenanceMode ? (
            <div className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
            <div className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center p-8 backdrop-blur-sm rounded-lg">
                  <div className="text-red-500">{error}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <ContestSection
                  title="Live Duels"
                  type="active"
                  contests={activeContests}
                  loading={loading}
                />
                <ContestSection
                  title="Open Duels"
                  type="pending"
                  contests={openContests}
                  loading={loading}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
