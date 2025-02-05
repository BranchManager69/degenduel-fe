// src/pages/other/BannedIP.tsx

import React from "react";
import { Link } from "react-router-dom";

export const BannedIP: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-red-500/50 shadow-lg">
        <div className="mb-6">
          <div className="text-red-500 text-6xl mb-4">🛡️</div>
          <h1 className="text-4xl font-heading text-red-500 mb-4 animate-pulse">
            IP BLOCKED
          </h1>
          <div className="font-mono text-sm text-red-400 mb-6">
            ERROR CODE: IP_BANNED
          </div>
        </div>

        <div className="space-y-4 text-gray-300">
          <p className="text-lg">
            Your IP address has been blocked from accessing DegenDuel.
          </p>
          <p className="text-sm text-gray-400">
            This may be due to suspicious activity or repeated violations of our
            security policies.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="text-sm text-gray-400">
            If you believe this is an error, please contact our security team:
          </div>
          <Link
            to="/contact"
            className="inline-block px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 
                     border border-red-500/50 rounded-lg transition-all duration-300"
          >
            Contact Security Team
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-red-500/20">
          <div className="text-sm text-gray-400 mb-4">
            Your IP will be automatically unblocked after a review period if no
            further violations occur.
          </div>
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};
