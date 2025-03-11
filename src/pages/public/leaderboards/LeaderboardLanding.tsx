// src/pages/public/leaderboards/LeaderboardLanding.tsx

import { Link } from "react-router-dom";

export const LeaderboardLanding = () => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header for leaderboards page - without Logo3D */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
        <div className="w-full md:w-2/3 text-center md:text-left relative group">
          <h1 className="text-4xl font-bold text-gray-100 mb-2 relative inline-flex items-center">
            <span className="text-cyber-400 text-xl font-bold mr-3 animate-cyber.pulse md:inline-block">
              DEGEN×DUEL
            </span>
            <span className="relative z-10 group-hover:animate-cyber.glitch">
              Leaderboards
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-cyber.data-stream" />
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto md:mx-0 group-hover:animate-cyber.pulse">
            Choose your path to glory. Track performance rankings or check the
            global leaderboard standings.
          </p>
        </div>
      </div>

      {/* Buttons Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Performance Rankings Button */}
        <Link
          to="/rankings/performance"
          className="group perspective-1000 relative"
        >
          <div className="relative transform transition-all duration-500 group-hover:scale-105">
            <div className="bg-dark-200/80 backdrop-blur-sm border border-brand-500/30 rounded-xl p-8 text-center relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 animate-cyber.scan-vertical opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-brand-400 to-transparent" />

              {/* Icon */}
              <div className="text-5xl mb-4 text-brand-400 group-hover:animate-cyber.neon-flicker">
                🏆
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-100 mb-3 relative z-10 group-hover:animate-cyber.glitch">
                Performance Rankings
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 relative z-10 group-hover:text-gray-300">
                Track true performance and competitive win rates
              </p>

              {/* Call to Action */}
              <div className="text-brand-400 font-medium group-hover:animate-cyber.pulse">
                View Rankings →
              </div>
            </div>
          </div>
        </Link>

        {/* Global Rankings Button */}
        <Link to="/rankings/global" className="group perspective-1000 relative">
          <div className="relative transform transition-all duration-500 group-hover:scale-105">
            <div className="bg-dark-200/80 backdrop-blur-sm border border-cyber-500/30 rounded-xl p-8 text-center relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/10 via-cyber-400/5 to-cyber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 animate-cyber.scan-vertical opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-cyber-400 to-transparent" />

              {/* Icon */}
              <div className="text-5xl mb-4 text-cyber-400 group-hover:animate-cyber.neon-flicker">
                🌍
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-100 mb-3 relative z-10 group-hover:animate-cyber.glitch">
                Global Rankings
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 relative z-10 group-hover:text-gray-300">
                See the overall points leaders and standings
              </p>

              {/* Call to Action */}
              <div className="text-cyber-400 font-medium group-hover:animate-cyber.pulse">
                View Rankings →
              </div>
            </div>
          </div>
        </Link>
        
        {/* Degen Level Rankings Button */}
        <Link to="/leaderboard" className="group perspective-1000 relative">
          <div className="relative transform transition-all duration-500 group-hover:scale-105">
            <div className="bg-dark-200/80 backdrop-blur-sm border border-brand-500/30 rounded-xl p-8 text-center relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 animate-cyber.scan-vertical opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

              {/* Icon */}
              <div className="text-5xl mb-4 text-amber-400 group-hover:animate-cyber.neon-flicker">
                📈
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-100 mb-3 relative z-10 group-hover:animate-cyber.glitch">
                Degen Levels
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 relative z-10 group-hover:text-gray-300">
                Check your level and unlock special discounts
              </p>

              {/* Call to Action */}
              <div className="text-amber-400 font-medium group-hover:animate-cyber.pulse">
                View Levels →
              </div>
            </div>
          </div>
        </Link>
      </div>
      
    </div>
  );
};
