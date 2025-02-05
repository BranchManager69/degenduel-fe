// src/pages/other/Maintenance.tsx

import React from "react";

export const Maintenance: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/50 shadow-lg">
        <div className="mb-6">
          <div className="text-brand-500 text-6xl mb-4">🔧</div>
          <h1 className="text-4xl font-heading text-brand-500 mb-4">
            SYSTEM UPGRADE
          </h1>
          <div className="font-mono text-sm text-brand-400 mb-6 animate-pulse">
            STATUS: MAINTENANCE_IN_PROGRESS
          </div>
        </div>

        <div className="space-y-4 text-gray-300">
          <p className="text-lg">
            DegenDuel is currently undergoing scheduled maintenance.
          </p>
          <p className="text-sm text-gray-400">
            We're upgrading our systems to provide you with an even better
            trading experience.
          </p>
        </div>

        <div className="mt-8">
          <div className="inline-block px-8 py-4 bg-dark-300/50 rounded-lg border border-brand-500/20">
            <div className="text-sm text-gray-400 mb-2">Estimated Downtime</div>
            <div className="font-mono text-2xl text-brand-400">02:00:00</div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="text-sm text-gray-400">
            For real-time updates, follow us on:
          </div>
          <div className="flex justify-center space-x-4">
            <a
              href="https://twitter.com/degenduel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 
                       border border-brand-500/50 rounded-lg transition-all duration-300"
            >
              Twitter
            </a>
            <a
              href="https://discord.gg/degenduel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 
                       border border-brand-500/50 rounded-lg transition-all duration-300"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-500/20">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ↻ Check if we're back online
          </button>
        </div>
      </div>
    </div>
  );
};
