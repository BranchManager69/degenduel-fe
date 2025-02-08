// src/components/landing/Features.tsx

import { motion } from "framer-motion";
import React from "react";
import { Card, CardContent } from "../ui/Card";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient: string;
}

const existingFeatures: Feature[] = [
  {
    title: "AI-Powered Trading",
    description:
      "Battle against neural networks trained on millions of trades. Face off against both human degens and AI agents in high-stakes duels.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 12H4M20 12H22M12 2V4M12 20V22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-pulse"
        />
        <path
          d="M6 8L8 10L6 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ping"
        />
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-[spin_3s_linear_infinite]"
        />
      </svg>
    ),
    gradient: "from-brand-400/20 via-brand-500/20 to-brand-600/20",
  },
  {
    title: "High Stakes Duels",
    description:
      "Enter high-stakes portfolio battles with real prizes. Prove your trading prowess in time-limited competitions.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 4L12 12M12 12L4 20M12 12L4 4M12 12L20 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[spin_4s_linear_infinite]"
        />
      </svg>
    ),
    gradient: "from-amber-400/20 via-amber-500/20 to-orange-500/20",
  },
  {
    title: "Real-Time Analytics",
    description:
      "Track your performance with advanced metrics and real-time market data visualization. Stay ahead of the competition.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 20H21M5 20V12M9 20V8M13 20V4M17 20V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-[height_2s_ease-in-out_infinite]"
        />
      </svg>
    ),
    gradient: "from-emerald-400/20 via-emerald-500/20 to-green-500/20",
  },
  {
    title: "Secure Trading",
    description:
      "Trade with confidence using our secure, audited smart contracts and automated settlement system.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-pulse"
        />
        <path
          d="M8.5 21H15.5M12 15V21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 3H19M8 3V2M16 3V2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    gradient: "from-blue-400/20 via-blue-500/20 to-cyan-500/20",
  },
] as const;

const upcomingFeatures: Feature[] = [
  {
    title: "Bring Your Own Agent",
    description:
      "Deploy your own trading algorithms and AI agents to compete in specialized contests. Test your strategies against other traders' agents.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-float"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      </svg>
    ),
    gradient: "from-purple-400/10 via-purple-500/10 to-brand-400/10",
  },
  {
    title: "Market-Agnostic Action",
    description:
      "Expand beyond crypto - trade stocks, forex, and more. Same platform, more markets, endless opportunities.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-[spin_6s_linear_infinite]"
        />
        <path
          d="M2 12H22M12 2C14.5 4.5 15.5 8 15.5 12C15.5 16 14.5 19.5 12 22C9.5 19.5 8.5 16 8.5 12C8.5 8 9.5 4.5 12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-pulse"
        />
      </svg>
    ),
    gradient: "from-brand-400/10 via-indigo-400/10 to-blue-400/10",
  },
] as const;

export const Features: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background gradient transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-300/90 via-dark-200/95 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 space-y-16">
        {/* Current Features */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-200">
              Platform Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the future of trading with our cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {existingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full bg-dark-200/80 backdrop-blur-sm border-dark-300/50 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    {/* Icon with glow effect */}
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-lg group-hover:blur-xl transition-all" />
                      <div className="relative w-full h-full text-emerald-400 group-hover:text-emerald-300 transition-colors">
                        {feature.icon}
                      </div>
                    </div>

                    {/* Title with gradient */}
                    <h3 className="text-xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming Features */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              Coming Soon
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="group"
              >
                <Card className="h-full bg-dark-200/80 backdrop-blur-sm border-dark-300/50 hover:border-emerald-400/20 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    {/* Icon with glow effect */}
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-lg group-hover:blur-xl transition-all" />
                      <div className="relative w-full h-full text-emerald-400/70 group-hover:text-emerald-300/70 transition-colors">
                        {feature.icon}
                      </div>
                    </div>

                    {/* Title with gradient */}
                    <h3 className="text-xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400/70 to-teal-500/70">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 group-hover:text-gray-400 transition-colors">
                      {feature.description}
                    </p>

                    {/* Coming Soon Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="relative">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-400/20 to-teal-500/20 blur-sm" />
                        <div className="relative px-3 py-1 bg-dark-200/90 clip-edges">
                          <span className="text-xs font-cyber tracking-wider text-emerald-400">
                            COMING SOON
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
