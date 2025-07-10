import React from "react";
import { motion } from "framer-motion";
import Logo from "../../../components/ui/Logo";

export const RoadmapPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* Logo and Page Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" animated enhancedGlow />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            12-Week Roadmap
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Two-week sprints starting July 5, 2025
          </p>
        </div>

        {/* Roadmap Timeline */}
        <div className="max-w-5xl mx-auto relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-400 via-brand-500 to-purple-600"></div>
          
          {/* Week 0-2 */}
          <div className="relative flex items-center mb-16">
            <div className="flex-1 md:text-right md:pr-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 0–2</h2>
              <p className="text-gray-500 text-sm mb-4">Jul 5–Jul 18</p>
              <div className="space-y-3 md:text-left">
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Launch Free Scheduled 50/50 Contests</h3>
                  <p className="text-gray-400 text-sm">The top half doubles their stake. Low variance, grinder-friendly.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Live Updating Leaderboard</h3>
                  <p className="text-gray-400 text-sm">Real-time stats on wallets, volumes, and fee flows.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Didi Analysis Overlays</h3>
                  <p className="text-gray-400 text-sm">AI-powered portfolio insights and guidance.</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="hidden md:block flex-1"></div>
          </div>

          {/* Week 2-4 */}
          <div className="relative flex items-center mb-16">
            <div className="hidden md:block flex-1"></div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="flex-1 md:pl-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 2–4</h2>
              <p className="text-gray-500 text-sm mb-4">Jul 19–Aug 1</p>
              <div className="space-y-3">
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Launch Paid Scheduled 50/50 Contests</h3>
                  <p className="text-gray-400 text-sm">Real money contests with entry fees and prize pools.</p>
                </div>
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Paid Duels (1-v-1) Go Live</h3>
                  <p className="text-gray-400 text-sm">Head-to-head battles for the ultimate PvP trading experience.</p>
                </div>
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Expand Token Universe</h3>
                  <p className="text-gray-400 text-sm">Beyond Jupiter-verified list for more trading opportunities.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Week 4-6 */}
          <div className="relative flex items-center mb-16">
            <div className="flex-1 md:text-right md:pr-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 4–6</h2>
              <p className="text-gray-500 text-sm mb-4">Aug 2–Aug 15</p>
              <div className="space-y-3 md:text-left">
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Launch Free Tournament Contests</h3>
                  <p className="text-gray-400 text-sm">GPP-style where top 10–15% win, most to 1st–3rd.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Free Duels for Onboarding</h3>
                  <p className="text-gray-400 text-sm">Risk-free practice battles for new players.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Sponsored Contests Go Live</h3>
                  <p className="text-gray-400 text-sm">10% creator fee option with special prize splits.</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="hidden md:block flex-1"></div>
          </div>

          {/* Week 6-8 */}
          <div className="relative flex items-center mb-16">
            <div className="hidden md:block flex-1"></div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="flex-1 md:pl-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 6–8</h2>
              <p className="text-gray-500 text-sm mb-4">Aug 16–Aug 29</p>
              <div className="space-y-3">
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Paid Tournament Contests</h3>
                  <p className="text-gray-400 text-sm">High variance, jackpot upside with real entry fees.</p>
                </div>
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Bring-Your-Own-Agent (BYOA) Support</h3>
                  <p className="text-gray-400 text-sm">Connect custom trading agents to draft portfolios autonomously.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Week 8-10 */}
          <div className="relative flex items-center mb-16">
            <div className="flex-1 md:text-right md:pr-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 8–10</h2>
              <p className="text-gray-500 text-sm mb-4">Aug 30–Sep 12</p>
              <div className="space-y-3 md:text-left">
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Begin Multi-Asset Support</h3>
                  <p className="text-gray-400 text-sm">Tokenized equities/stock indices added to contests.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Holder Airdrop Continues</h3>
                  <p className="text-gray-400 text-sm">Off-chain SOL distribution alongside stats API.</p>
                </div>
                <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 rounded-lg border-l-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Draft Smart-Contract Specification</h3>
                  <p className="text-gray-400 text-sm">Planning for on-chain payout migration.</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="hidden md:block flex-1"></div>
          </div>

          {/* Week 10-12 */}
          <div className="relative flex items-center mb-16">
            <div className="hidden md:block flex-1"></div>
            <div className="hidden md:block absolute left-1/2 w-6 h-6 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10"></div>
            <div className="flex-1 md:pl-12">
              <div className="md:hidden absolute left-8 w-4 h-4 bg-brand-400 rounded-full -translate-x-1/2 ring-4 ring-gray-900"></div>
              <h2 className="text-2xl font-bold text-brand-400 mb-2">Week 10–12</h2>
              <p className="text-gray-500 text-sm mb-4">Sep 13–Sep 26</p>
              <div className="space-y-3">
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Seasonal Leagues with Badge Rewards</h3>
                  <p className="text-gray-400 text-sm">Achievement system for competitive seasons.</p>
                </div>
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Kick-off Phased On-Chain Migration</h3>
                  <p className="text-gray-400 text-sm">Beginning transition to trust-minimised payouts.</p>
                </div>
                <div className="bg-gradient-to-l from-brand-500/20 to-transparent p-4 rounded-lg border-r-4 border-brand-400">
                  <h3 className="text-lg font-semibold text-white mb-1">Prepare Next White-Paper Revision</h3>
                  <p className="text-gray-400 text-sm">Updated docs reflecting completed milestones.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Beyond Week 12 */}
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 w-8 h-8 bg-purple-500 rounded-full -translate-x-1/2 ring-4 ring-gray-900 z-10 animate-pulse"></div>
            <div className="ml-20 md:ml-0 md:text-center">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Beyond Week 12 ✨</h2>
              <div className="bg-gradient-to-b from-purple-500/20 to-transparent p-6 rounded-xl border-t-4 border-purple-500 max-w-2xl mx-auto">
                <p className="text-gray-300 mb-4">
                  Season One delivers set-and-forget portfolio combat through 50/50 and Tournament formats. 
                  Mid-Q3 unlocks agent-driven strategies and multi-asset contests, followed by the march toward 
                  fully on-chain, trust-minimised payouts.
                </p>
                <p className="text-gray-300 font-semibold">
                  No gimmicks—just relentless shipping.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            Ready to join the arena? Start competing today!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://t.me/degenduel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Join Telegram
            </a>
            <a 
              href="/whitepaper"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Read Whitepaper
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};