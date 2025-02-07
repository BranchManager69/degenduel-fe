import React, { useMemo } from "react";
import { Card, CardContent } from "../../ui/Card";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient: string;
}

const existingFeatures: Feature[] = [
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
    gradient: "from-blue-400 via-indigo-400 to-purple-400",
  },
  {
    title: "1v1 Duels",
    description:
      "Challenge specific traders to head-to-head trading battles. Prove your skills in intense, direct competition with custom stakes.",
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
    gradient: "from-indigo-400 via-blue-400 to-cyan-400",
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
    gradient: "from-cyan-400 via-blue-400 to-indigo-400",
  },
] as const;

export const Features: React.FC = () => {
  // Memoize the cosmic effects container
  const CosmicEffects = useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Solar flares */}
        <div className="absolute -top-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Star field */}
        <div
          className="absolute inset-0 animate-float"
          style={{ animationDuration: "15s" }}
        >
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[15%] left-[35%] animate-sparkle"
            style={{ animationDelay: "-2s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[45%] left-[75%] animate-sparkle"
            style={{ animationDelay: "-1s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[65%] left-[25%] animate-sparkle"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[85%] left-[65%] animate-sparkle"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        {/* Cosmic dust streams */}
        <div className="absolute inset-0">
          <div
            className="absolute h-[1px] w-[250px] bg-brand-400/10 blur-sm animate-random-slide"
            style={{ animationDuration: "18s", top: "25%" }}
          />
          <div
            className="absolute h-[1px] w-[350px] bg-purple-400/10 blur-sm animate-random-slide-reverse"
            style={{ animationDuration: "23s", top: "55%" }}
          />
          <div
            className="absolute h-[1px] w-[200px] bg-brand-400/10 blur-sm animate-random-slide"
            style={{ animationDuration: "20s", top: "75%" }}
          />
        </div>

        {/* Energy waves */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"
            style={{ animationDuration: "10s" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-vertical opacity-20"
            style={{ animationDuration: "15s" }}
          />
        </div>
      </div>
    ),
    []
  );

  // Memoize the feature cards
  const FeatureCard = useMemo(
    () =>
      ({
        feature,
        isUpcoming = false,
      }: {
        feature: Feature;
        isUpcoming?: boolean;
      }) =>
        (
          <Card
            key={feature.title}
            className={`group relative backdrop-blur-sm border-dark-300/20 hover:border-purple-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden ${
              isUpcoming ? "bg-[#1e1a42]/80" : "bg-[#1a1333]/80"
            }`}
          >
            {isUpcoming && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/20 z-20">
                <span className="text-xs font-cyber text-blue-400/90 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  COMING SOON
                </span>
              </div>
            )}

            {/* Animated gradient background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-${
                isUpcoming ? "15" : "10"
              } transition-opacity duration-500 ${feature.gradient}`}
            />

            {/* Animated border glow */}
            <div
              className={`absolute -inset-[1px] rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isUpcoming
                  ? "bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-blue-400/10"
                  : "bg-gradient-to-r from-purple-400/10 via-brand-500/10 to-purple-400/10"
              }`}
            />

            {/* Scan line effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_8px] animate-scan" />

            <CardContent className="relative p-6">
              <div className="flex items-start space-x-4">
                <div
                  className={`${
                    isUpcoming ? "text-blue-400/80" : "text-purple-400/80"
                  } group-hover:text-brand-400 transition-colors duration-300`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold text-gray-100 mb-2 ${
                      isUpcoming
                        ? "group-hover:text-blue-400"
                        : "group-hover:text-purple-400"
                    } transition-colors duration-300 font-cyber tracking-wide`}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-400/90 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Inner glow effect */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  isUpcoming
                    ? "bg-gradient-to-t from-blue-500/5 via-transparent to-transparent"
                    : "bg-gradient-to-t from-purple-500/5 via-transparent to-transparent"
                }`}
              />
            </CardContent>
          </Card>
        ),
    []
  );

  return (
    <div className="relative py-16 overflow-hidden">
      {CosmicEffects}

      {/* Content Container */}
      <div className="relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
            Platform Features
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg font-cyber tracking-wide">
            Experience the future of competitive token trading with our
            innovative platform
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 relative z-10">
          {existingFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
          {upcomingFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              isUpcoming={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
