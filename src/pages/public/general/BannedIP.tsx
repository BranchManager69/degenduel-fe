// src/pages/public/general/BannedIP.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../components/toast";

export const BannedIP: React.FC = () => {
  const { addToast } = useToast();
  
  const showToastExamples = () => {
    // Success example
    addToast("success", "Successfully entered the trading competition!", "Competition Entry");
    
    // Delayed error example
    setTimeout(() => {
      addToast("error", "Insufficient balance to join this competition", "Transaction Failed");
    }, 1000);
    
    // Delayed warning example
    setTimeout(() => {
      addToast("warning", "5 minutes remaining in current trading round", "Time Warning");
    }, 2000);
    
    // Delayed info example
    setTimeout(() => {
      addToast("info", "New high-stakes competition starting in 10 minutes", "Upcoming Event");
    }, 3000);
  };
  
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
          
          {/* Test the new toast system */}
          <div className="mt-8 pt-6 border-t border-red-500/20">
            <h3 className="text-xl font-heading text-purple-400 mb-4">New Toast System Demo</h3>
            <p className="text-sm text-gray-400 mb-4">
              Test our new unified toast notification system:
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => addToast("success", "Action completed successfully", "Success")}
                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-md"
              >
                Success Toast
              </button>
              
              <button
                onClick={() => addToast("error", "Something went wrong", "Error")}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-md"
              >
                Error Toast
              </button>
              
              <button
                onClick={() => addToast("warning", "Proceed with caution", "Warning")}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 rounded-md"
              >
                Warning Toast
              </button>
              
              <button
                onClick={() => addToast("info", "Here's some information", "Info")}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-md"
              >
                Info Toast
              </button>
            </div>
            
            <button
              onClick={showToastExamples}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500/30 to-blue-500/30 hover:from-purple-500/40 hover:to-blue-500/40 text-purple-300 border border-purple-500/30 rounded-md"
            >
              Show All Toast Examples
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
