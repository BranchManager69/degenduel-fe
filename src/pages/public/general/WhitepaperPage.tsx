import React from "react";
import { motion } from "framer-motion";
import Logo from "../../../components/ui/Logo";

export const WhitepaperPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* Logo and Page Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size="lg" animated enhancedGlow />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-brand-400 to-purple-500 bg-clip-text text-transparent">
            Whitepaper
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The future of competitive token trading on Solana
          </p>
        </div>

        {/* Content Sections */}
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Executive Summary */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">01</span>
              Executive Summary
            </h2>
            <div className="ml-12">
              <p className="text-gray-300 text-lg leading-relaxed">
                DegenDuel is a Solana-native PvP trading arena where players stake SOL, lock in token portfolios, and battle for the highest percentage gain over a set period.
              </p>
              <div className="mt-4 p-4 bg-gradient-to-r from-brand-500/10 to-transparent rounded-lg border-l-4 border-brand-400">
                <p className="text-brand-300 font-semibold">
                  Ten percent of every duel or contest's revenue is airdropped daily to DUEL holders in SOL.
                </p>
              </div>
              <p className="text-gray-400 mt-4">
                At launch this distribution is handled by a proprietary off-chain engine; a migration to on-chain smart-contract settlement is slated for a later roadmap phase. 
                There is no inflation, no hidden token buckets, and no complicated emissions—just a transparent, daily yield tied directly to real gameplay volume.
              </p>
            </div>
          </div>

          {/* Problem & Vision */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">02</span>
              Problem & Vision
            </h2>
            <div className="ml-12 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  The Problem
                </h3>
                <p className="text-gray-400">
                  Most play-to-earn schemes rely on inflationary tokens and collapse once hype fades, leaving holders underwater.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Our Vision
                </h3>
                <p className="text-gray-400">
                  Create a skill-based arena where set-and-forget portfolios determine winners, daily yield flows to holders from genuine fee revenue, 
                  and the entire economy ultimately runs on immutable smart contracts. Over time, DegenDuel expands beyond crypto into tokenized equities, 
                  while opening the door for player-built agents to compete head-to-head.
                </p>
              </div>
            </div>
          </div>

          {/* Product Overview */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">03</span>
              Product Overview
            </h2>
            <div className="ml-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">Contest Engine</h3>
                  <p className="text-gray-400 text-sm">
                    Server-side logic escrows entry fees, matches players, and settles performance using Jupiter + Meteora price feeds. 
                    Full on-chain escrow and settlement will arrive in a future phase.
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">Holder Yield Pipeline</h3>
                  <p className="text-gray-400 text-sm">
                    A nightly task slices 10% of the previous 24 hours of duel/contest revenue and airdrops SOL to DUEL holders pro-rata. 
                    This pipeline will also migrate on-chain.
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">AI Analyst "Didi"</h3>
                  <p className="text-gray-400 text-sm">
                    Provides real-time portfolio insights and onboarding guidance, laying the groundwork for richer coaching tools.
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">Live Updating Leaderboard</h3>
                  <p className="text-gray-400 text-sm">
                    A public page that refreshes continuously, showing active wallets, contest/duel volume, fee flows, and (once activated) daily airdrop totals.
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">Future Multi-Asset Support</h3>
                  <p className="text-gray-400 text-sm">
                    Tokenized equities and stock indices will be added, letting players build hybrid crypto–equity portfolios.
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="p-6 bg-gradient-to-br from-gray-800/50 to-transparent rounded-xl border border-gray-700/50 hover:border-brand-500/50 transition-all duration-300 h-full">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">Future BYOA Support</h3>
                  <p className="text-gray-400 text-sm">
                    Players will be able to connect custom trading agents that draft portfolios and compete autonomously.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Economics */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">04</span>
              Token Economics (DUEL)
            </h2>
            <div className="ml-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-brand-400 rounded-full mr-2"></span>
                      Launch Method
                    </h3>
                    <p className="text-gray-400 ml-4">
                      One stealth tweet kicked off a Believe launch; the community—including the dev—minted and traded from zero.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-brand-400 rounded-full mr-2"></span>
                      Total Supply
                    </h3>
                    <p className="text-gray-400 ml-4">
                      Fixed at genesis; no future minting or burns.
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-brand-400 rounded-full mr-2"></span>
                      Transaction Fee
                    </h3>
                    <p className="text-gray-400 ml-4">
                      Every DUEL transfer carries a hard-coded 2% fee—1% to Believe, 1% to the dev wallet.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-400 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-brand-400 rounded-full mr-2"></span>
                      Holder Airdrop
                    </h3>
                    <p className="text-gray-400 ml-4">
                      Independent of the transfer fee, 10% of all arena revenue is distributed daily in SOL (off-chain for now, on-chain later).
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-4 border-purple-500">
                <p className="text-purple-300 font-semibold">
                  No presale, no emissions schedule, no reserved stash.
                </p>
              </div>
            </div>
          </div>

          {/* Contest Mechanics */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">05</span>
              Contest Mechanics & Scheduling
            </h2>
            <div className="ml-12 space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-brand-400 mb-4">Season One Gameplay (Set-and-Forget)</h3>
                <p className="text-gray-400">
                  Players draft a token portfolio before the contest clock starts. Once locked, no in-game trades are allowed; 
                  final standings are based purely on percentage appreciation from start to finish.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-transparent"></div>
                  <h3 className="text-lg font-semibold text-green-400 mb-3">50/50 Contests</h3>
                  <p className="text-gray-400">
                    The top half of the field doubles their stake; the bottom half busts. Low variance, grinder-friendly.
                  </p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-transparent"></div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Tournament Contests (GPP-style)</h3>
                  <p className="text-gray-400">
                    Roughly the top 10–15% finish "in the money," with most of the pot flowing to 1st–3rd. High variance, jackpot upside.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-brand-400 mb-4">Scheduling & Customisation</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-brand-400 mr-3">▸</span>
                    <div>
                      <span className="font-semibold text-gray-300">Scheduled Contests</span>
                      <span className="text-gray-400"> launch at fixed times each day.</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-brand-400 mr-3">▸</span>
                    <div>
                      <span className="font-semibold text-gray-300">Custom Contests</span>
                      <span className="text-gray-400"> let any wallet spin up a lobby (public or allow-list), choose format, entry fee, and prize split.</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-brand-400 mr-3">▸</span>
                    <div>
                      <span className="font-semibold text-gray-300">Sponsored Contests</span>
                      <span className="text-gray-400"> add an optional 10% creator fee—80% to winners, 10% to DUEL holders, 10% to the sponsor—without touching baseline holder yield.</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-500 italic text-sm">
                (Season Two will explore mid-contest portfolio tweaks; Season One remains pure set-and-forget.)
              </p>
            </div>
          </div>

          {/* Launch Recap */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-transparent"></div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <span className="text-brand-400 mr-3">06</span>
              Launch Recap
            </h2>
            <div className="ml-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🚀</span>
                  <div>
                    <span className="font-semibold text-gray-300">When:</span>
                    <span className="text-gray-400 ml-2">Stealth launch—tweet went live, minting started instantly.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🌐</span>
                  <div>
                    <span className="font-semibold text-gray-300">Where:</span>
                    <span className="text-gray-400 ml-2">Believe platform.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">💧</span>
                  <div>
                    <span className="font-semibold text-gray-300">Liquidity:</span>
                    <span className="text-gray-400 ml-2">Seeded organically by early buyers (dev included).</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📈</span>
                  <div>
                    <span className="font-semibold text-gray-300">Current Status:</span>
                    <span className="text-gray-400 ml-2">Actively traded; contest engine rolling out.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Note */}
          <div className="relative">
            <div className="absolute -inset-x-4 -inset-y-4 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-brand-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 border border-brand-500/30">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Closing Note</h2>
              <p className="text-gray-300 text-center text-lg leading-relaxed">
                Season One delivers set-and-forget portfolio combat through 50/50 and Tournament formats, with paid duels live by Week 2–4 and daily SOL yield streamed to DUEL holders. 
                Mid-Q3 unlocks agent-driven strategies and multi-asset contests, followed by the march toward fully on-chain, trust-minimised payouts.
              </p>
              <p className="text-brand-400 font-bold text-center text-xl mt-6">
                No gimmicks—just relentless shipping.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};