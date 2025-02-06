import React from "react";
import { Card, CardContent } from "../ui/Card";

const features = [
  {
    title: "Real-Time Trading",
    description:
      "Experience the thrill of live token trading competitions with real-time price updates and portfolio tracking.",
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
    gradient: "from-cyan-500 via-brand-400 to-purple-500",
  },
  {
    title: "Prize Pools",
    description:
      "Compete for substantial prize pools distributed among top performers in each contest.",
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
    gradient: "from-yellow-500 via-brand-500 to-pink-500",
  },
  {
    title: "Fair Competition",
    description:
      "All participants start with equal resources, ensuring a level playing field for everyone.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3V21M3 12H21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    ),
    gradient: "from-green-500 via-brand-400 to-blue-500",
  },
  {
    title: "Performance Analytics",
    description:
      "Track your trading performance with detailed analytics and historical data.",
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
    gradient: "from-blue-500 via-brand-500 to-purple-500",
  },
  {
    title: "Community Rankings",
    description:
      "Climb the global leaderboard and establish yourself as a top trader.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15L8 11M12 15L16 11M12 15V3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-bounce"
        />
        <path
          d="M5 21H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    gradient: "from-purple-500 via-brand-400 to-pink-500",
  },
  {
    title: "Instant Rewards",
    description: "Automagically receive your winnings as soon as contests end.",
    icon: (
      <svg
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      </svg>
    ),
    gradient: "from-red-500 via-brand-500 to-yellow-500",
  },
];

export const Features: React.FC = () => {
  return (
    <div className="relative py-16 overflow-hidden">
      {/* Background Effects - Matching Landing Page Style */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base dark gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-800 opacity-90" />

        {/* Animated gradient overlays */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-gradient-x"
            style={{ animationDuration: "15s" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-gradient-y"
            style={{ animationDuration: "20s" }}
          />
        </div>

        {/* Energy disruption lines */}
        <div className="absolute inset-0">
          <div
            className="absolute h-[2px] w-[200px] bg-brand-400/20 blur-sm animate-random-slide"
            style={{ animationDuration: "7s", animationDelay: "-2s" }}
          />
          <div
            className="absolute h-[2px] w-[300px] bg-purple-400/20 blur-sm animate-random-slide-reverse"
            style={{ animationDuration: "8s", animationDelay: "-4s" }}
          />
        </div>

        {/* Ambient glow effects */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px] animate-float"
            style={{ animationDuration: "18s" }}
          />
          <div
            className="absolute bottom-[10%] right-[20%] w-[35%] h-[35%] bg-purple-500/10 rounded-full blur-[100px] animate-float"
            style={{ animationDuration: "15s", animationDelay: "-5s" }}
          />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(68,0,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(68,0,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Content Container */}
      <div className="relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase">
            Platform Features
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg font-cyber tracking-wide">
            Experience the future of competitive token trading with our
            innovative platform
          </p>
        </div>

        {/* Feature Cards Grid - To be converted to 3D carousel later */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 relative z-10">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative bg-dark-200/40 backdrop-blur-sm border-dark-300 hover:border-purple-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden"
            >
              {/* Animated gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              {/* Animated border glow */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-400/10 via-brand-500/10 to-purple-400/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Scan line effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] bg-[length:100%_8px] animate-scan" />

              <CardContent className="relative p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-purple-400 group-hover:text-brand-400 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-purple-400 transition-colors duration-300 font-cyber tracking-wide">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
