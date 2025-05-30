// src/pages/public/general/HowItWorks.tsx

import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: "Connect Your Wallet",
      description:
        "Start by connecting your Solana wallet to participate in trading contests.",
      icon: "🔗",
      step: "01",
      gradient: "from-purple-500/20 to-blue-500/20",
      borderGradient: "from-purple-500/50 to-blue-500/50",
    },
    {
      title: "Choose a Contest",
      description:
        "Browse available contests and select one that matches your skill level and preferred entry fee.",
      icon: "🎯",
      step: "02",
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderGradient: "from-blue-500/50 to-cyan-500/50",
    },
    {
      title: "Build Your Portfolio",
      description:
        "Select tokens to create your contest portfolio within the specified time limit.",
      icon: "📊",
      step: "03",
      gradient: "from-cyan-500/20 to-green-500/20",
      borderGradient: "from-cyan-500/50 to-green-500/50",
    },
    {
      title: "Watch & Win",
      description:
        "Track your portfolio performance in real-time and compete for prizes.",
      icon: "🏆",
      step: "04",
      gradient: "from-green-500/20 to-yellow-500/20",
      borderGradient: "from-green-500/50 to-yellow-500/50",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-brand-400/3 to-transparent rounded-full animate-spin" style={{ animationDuration: '30s' }} />
      </div>

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Enhanced Header */}
          <div className="text-center mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/10 to-transparent blur-xl" />
            <div className="relative">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-brand-400 to-white bg-clip-text text-transparent mb-6">
                How It Works
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent mx-auto mb-8" />
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Get started with DegenDuel in four simple steps. Join thousands of traders competing in real-time contests.
              </p>
            </div>
          </div>

          {/* Enhanced Steps Section */}
          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/30 to-transparent transform -translate-y-1/2" />
            
            <div className="grid gap-12 md:gap-8 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="relative group">
                  {/* Step Connection Dots for Desktop */}
                  <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-brand-400 rounded-full border-4 border-dark-200 z-10 group-hover:scale-125 transition-transform" />
                  
                  <Card className="bg-dark-200/80 backdrop-blur-lg border-dark-300/50 hover:border-brand-400/50 transition-all duration-500 group relative overflow-hidden h-full">
                    {/* Animated Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.borderGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse`} />
                    
                    {/* Scanning Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-scan-fast" 
                           style={{ animationDelay: `${index * 200}ms` }} />
                    </div>

                    <CardContent className="p-8 relative z-10 h-full flex flex-col">
                      {/* Step Number */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl group-hover:scale-110 transition-transform">
                        {step.step}
                      </div>

                      {/* Icon */}
                      <div className="text-6xl mb-6 text-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        {step.icon}
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-brand-300 transition-colors">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-300 group-hover:text-gray-200 transition-colors text-center leading-relaxed flex-grow">
                        {step.description}
                      </p>

                      {/* Progress Indicator */}
                      <div className="mt-6 w-full bg-dark-300/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"
                          style={{ transitionDelay: `${index * 100}ms` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Call to Action */}
          <div className="mt-24 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/5 to-transparent blur-xl" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Trading?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join the competition and test your trading skills against other degens
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/contests"
                  className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shine-slow" />
                  <span className="relative flex items-center">
                    Browse Contests
                    <svg
                      className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform"
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

                <a
                  href="/tokens"
                  className="group inline-flex items-center px-8 py-4 bg-dark-200/80 backdrop-blur-lg border border-brand-400/30 text-brand-300 rounded-xl hover:bg-dark-200 hover:border-brand-400/50 transition-all duration-300 font-semibold text-lg"
                >
                  <span className="flex items-center">
                    Explore Tokens
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
