// src/components/layout/Footer.tsx

import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-dark-200/80 backdrop-blur-sm border-t border-dark-300/50">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Cyber scan line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-400/5 to-transparent animate-cyber-scan" />

        {/* Matrix-like data stream */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,var(--color-brand-400)_50%,transparent_100%)] opacity-10 animate-data-stream" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-brand-400) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            opacity: 0.1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Platform Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase relative inline-block group">
              <span className="relative z-10 group-hover:animate-glitch">
                Platform
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    How it works
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/contests"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Browse Contests
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/tokens"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Token Explorer
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Rankings Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase relative inline-block group">
              <span className="relative z-10 group-hover:animate-glitch">
                Rankings
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/rankings/global"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Global Rankings
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/rankings/performance"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Performance
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase relative inline-block group">
              <span className="relative z-10 group-hover:animate-glitch">
                Support
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/faq"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    FAQ
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Contact
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 tracking-wider uppercase relative inline-block group">
              <span className="relative z-10 group-hover:animate-glitch">
                Community
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href="https://twitter.com/degenduel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Twitter
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/degenduel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-400 hover:text-brand-400 transition-colors group relative"
                >
                  <span className="relative z-10 group-hover:animate-glitch">
                    Discord
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section with enhanced styling */}
        <div className="mt-12 pt-8 relative">
          {/* Animated separator */}
          <div className="absolute top-0 left-0 w-full h-px overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent animate-data-stream" />
          </div>

          {/* Logo and copyright text */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Logo */}
            <div className="relative group">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600 group-hover:animate-pulse-fast">
                DegenDuel
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400/20 to-brand-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Copyright text */}
            <p className="text-sm text-gray-400 text-center group">
              <span className="group-hover:animate-cyber-pulse">
                &copy; {new Date().getFullYear()} DegenDuel. All rights
                reserved.
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
