import React, { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FeatureCard } from "./FeatureCard";

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

  // Removed card flip and reveal animation states
  
  // Removed the Candlestick Chart Component since it's now inside FeatureCard component

  // Enhanced FeatureCard wrapper with animations
  const AnimatedFeatureCard = useMemo(
    () =>
      ({
        feature,
        isUpcoming = false,
        index,
      }: {
        feature: Feature;
        isUpcoming?: boolean;
        index: number;
      }) => {
        // Create ref to check if card is in view
        const ref = useRef(null);
        const isInView = useInView(ref, { once: true, amount: 0.3 });
        
        // Card entrance animation variants
        const cardVariants = {
          hidden: { opacity: 0, y: 50 },
          visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.1 + i * 0.1,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }
          })
        };
        
        return (
          <motion.div
            ref={ref}
            custom={index}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={cardVariants}
          >
            <FeatureCard 
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={feature.gradient}
              isUpcoming={isUpcoming}
            />
          </motion.div>
        );
      },
    []
  );

  // Fix SVG animations to be more performant - create optimized versions of the icons
  /* Optimization function ready for use when animating SVG elements
  const optimizeAnimation = (element: JSX.Element): JSX.Element => {
    // This will clone element and modify any animation classes to use transform-based animations
    // that are more performant (CPU to GPU)
    return React.cloneElement(element, {
      className: (element.props.className || "").replace("animate-pulse", "animate-pulse-gpu")
        .replace("animate-ping", "animate-pulse-gpu")
    });
  };
  */
  
  // Removed noise texture and candlestick patterns generation

  return (
    <div className="relative py-20 overflow-hidden">
      {CosmicEffects}

      {/* Content Container */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
            Platform Features
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500"></div>
          </h2>
          <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg font-cyber tracking-wide">
            Experience the future of competitive token trading with our
            innovative platform
          </p>
        </motion.div>

        {/* Feature Cards Grid with improved spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 relative z-10">
          {existingFeatures.map((feature, index) => (
            <AnimatedFeatureCard 
              key={feature.title} 
              feature={feature} 
              index={index} 
            />
          ))}
          {upcomingFeatures.map((feature, index) => (
            <AnimatedFeatureCard
              key={feature.title}
              feature={feature}
              isUpcoming={true}
              index={existingFeatures.length + index}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
