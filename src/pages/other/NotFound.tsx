// src/pages/other/NotFound.tsx

import React from "react";
import { Link, useLocation } from "react-router-dom";

export const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-cyber-500/50 shadow-lg">
        <div className="mb-6">
          <div className="text-cyber-500 text-6xl mb-4">404</div>
          <h1 className="text-4xl font-heading text-cyber-500 mb-4">
            THIS PAGE GOT RUGGED!
          </h1>
          <div className="font-mono text-sm text-cyber-400 mb-6">
            <span className="animate-pulse">█</span> PAGE_NOT_FOUND
          </div>
        </div>

        <div className="space-y-4 text-gray-300">
          <p className="text-lg">
            This degenerate shit you were looking for doesn't exist:
          </p>
          <p className="text-sm font-mono text-cyber-400 bg-dark-300/50 p-2 rounded">
            degenduel.me{location.pathname}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/"
            className="px-6 py-3 bg-cyber-500/20 hover:bg-cyber-500/30 text-cyber-400 
                     border border-cyber-500/50 rounded-lg transition-all duration-300
                     flex items-center justify-center space-x-2"
          >
            <span>← Degen Elsewhere</span>
          </Link>
          <Link
            to="/contests"
            className="px-6 py-3 bg-cyber-500/20 hover:bg-cyber-500/30 text-cyber-400 
                     border border-cyber-500/50 rounded-lg transition-all duration-300
                     flex items-center justify-center space-x-2"
          >
            <span>Browse Duels →</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-cyber-500/20">
          <div className="text-sm text-gray-400">
            Lost? Check out the DegenDuel{" "}
            <Link
              to="/how-it-works"
              className="text-cyber-400 hover:text-cyber-300 transition-colors"
            >
              guide
            </Link>{" "}
            or{" "}
            <Link
              to="/contact"
              className="text-cyber-400 hover:text-cyber-300 transition-colors"
            >
              contact the Admin team
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
};
