// src/pages/public/general/HowItWorks.tsx

import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: "1. Connect Your Wallet",
      description:
        "Start by connecting your Solana wallet to participate in trading contests.",
      icon: "👛",
    },
    {
      title: "2. Choose a Contest",
      description:
        "Browse available contests and select one that matches your skill level and preferred entry fee.",
      icon: "🎯",
    },
    {
      title: "3. Build Your Portfolio",
      description:
        "Select tokens to create your contest portfolio within the specified time limit.",
      icon: "📊",
    },
    {
      title: "4. Watch & Win",
      description:
        "Track your portfolio performance in real-time and compete for prizes.",
      icon: "🏆",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h1 className="text-4xl font-bold text-gray-100 group-hover:animate-glitch relative">
          How It Works
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
          Learn how to participate in DegenDuel trading contests
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Card
            key={step.title}
            className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            />
            <CardContent className="p-6 relative">
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform group-hover:animate-cyber-pulse">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:animate-glitch">
                {step.title}
              </h3>
              <p className="text-gray-400 group-hover:text-brand-400 transition-colors">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Call to Action */}
      <div className="mt-16 text-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
          Ready to Start Trading?
        </h2>
        <a
          href="/contests"
          className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
          <span className="relative flex items-center font-medium group-hover:animate-glitch">
            Browse Contests
            <svg
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
};
