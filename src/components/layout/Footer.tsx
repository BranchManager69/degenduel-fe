import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-dark-200/80 backdrop-blur-sm border-t border-dark-300">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-100 to-transparent opacity-50 animate-cyber-scan" />

      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Platform Section */}
          <div>
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase group-hover:animate-neon-flicker">
              Platform
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="group-hover:animate-glitch">
                    How it works
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-data-stream" />
                </Link>
              </li>
              <li>
                <Link
                  to="/contests"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="group-hover:animate-glitch">
                    Browse Contests
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-data-stream" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase group-hover:animate-neon-flicker">
              Support
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/faq"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="group-hover:animate-glitch">FAQ</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-data-stream" />
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="group-hover:animate-glitch">Contact</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-data-stream" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8 border-t border-dark-300 relative overflow-hidden">
          {/* Animated separator */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent animate-data-stream" />

          <p className="text-base text-gray-400 text-center group">
            <span className="group-hover:animate-cyber-pulse">
              &copy; {new Date().getFullYear()} DegenDuel. All rights reserved.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
