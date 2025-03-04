import React, { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "../../ui/Card";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useDebounce } from "../../../hooks/useDebounce";

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

  // State to track the flipped card
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [revealedCard, setRevealedCard] = useState<string | null>(null);
  
  // Debounce reveal state to prevent accidental triggers
  const debouncedReveal = useDebounce(revealedCard, 300);
  
  // Track drag position for the cover reveal animation
  const dragEndHandler = (title: string, info: { velocity: { y: number } }) => {
    const velocity = Math.abs(info.velocity.y);
    if (velocity > 500) {
      setRevealedCard(title);
      
      // Auto-reset after animation completes
      setTimeout(() => {
        setRevealedCard(null);
      }, 3000);
    }
  };
  
  // Enhanced FeatureCard component
  const FeatureCard = useMemo(
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
          <Card
            key={feature.title}
            className={`group relative backdrop-blur-sm border transform transition-all duration-500 hover:scale-[1.03] hover:shadow-xl overflow-hidden h-full ${
              isUpcoming
                ? "bg-gradient-to-br from-[#1e1a42]/90 to-[#1a1333]/90 border-blue-500/10 hover:border-blue-400/30 hover:shadow-blue-500/10"
                : "bg-gradient-to-br from-[#1a1333]/90 to-[#120d24]/90 border-purple-500/10 hover:border-purple-400/30 hover:shadow-purple-500/10"
            }`}
            onClick={() => setFlippedCard(flippedCard === feature.title ? null : feature.title)}
          >
            {isUpcoming && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-blue-400/10 border border-blue-400/30 z-20 backdrop-blur-sm">
                <span className="text-xs font-cyber text-blue-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  COMING SOON
                </span>
              </div>
            )}

            {/* Animated gradient overlay */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${feature.gradient}`}
            />

            {/* Animated border glow */}
            <div
              className={`absolute -inset-[1px] rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                isUpcoming
                  ? "bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-blue-400/20"
                  : "bg-gradient-to-r from-purple-400/20 via-brand-500/20 to-purple-400/20"
              }`}
            />

            {/* Scan line effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_8px] animate-scan" />

            {/* Digital Cover Animation */}
            <AnimatePresence>
              {revealedCard !== feature.title && (
                <motion.div 
                  className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(e, info) => dragEndHandler(feature.title, info)}
                  initial={{ y: 0 }}
                  exit={{ 
                    y: -400, 
                    opacity: 0,
                    transition: { 
                      type: "spring", 
                      damping: 12, 
                      stiffness: 100 
                    } 
                  }}
                >
                  <div className={`
                    absolute inset-0 backdrop-blur-sm
                    ${isUpcoming
                      ? "bg-gradient-to-br from-[#1e1a42]/95 to-[#1a1333]/95 border-blue-500/30"
                      : "bg-gradient-to-br from-[#1a1333]/95 to-[#120d24]/95 border-purple-500/30"
                    }
                  `}>
                    <div 
                      className="absolute inset-0 opacity-5"
                      style={{ backgroundImage: noiseTexture ? `url(${noiseTexture})` : 'none' }}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-brand-500/20 to-transparent"></div>
                    
                    {/* Pull indicator */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <motion.div 
                        className="text-white/50 text-sm"
                        animate={{ y: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        Swipe up to reveal
                      </motion.div>
                      <motion.div 
                        className="w-8 h-8 mt-2 text-white/50"
                        animate={{ y: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                      </motion.div>
                    </div>
                    
                    {/* Corner fold effect */}
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-r-[30px] border-b-0 border-l-0 border-transparent border-t-white/5 border-r-white/5"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <CardContent className="relative p-8">
              {/* Icon with animated background - optimized animations */}
              <div className="mb-6 relative">
                <div
                  className={`
                  relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-lg
                  ${
                    isUpcoming
                      ? "bg-blue-500/10 text-blue-400 group-hover:text-blue-300"
                      : "bg-purple-500/10 text-purple-400 group-hover:text-purple-300"
                  } transition-colors duration-500
                `}
                >
                  {feature.icon}
                </div>
                <div
                  className={`
                  absolute inset-0 rounded-lg blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500
                  ${isUpcoming ? "bg-blue-500/20" : "bg-purple-500/20"}
                `}
                ></div>
              </div>

              {/* Title with animated underline */}
              <h3
                className={`
                text-xl font-bold mb-3 font-cyber tracking-wide relative inline-block
                ${
                  isUpcoming
                    ? "text-blue-300 group-hover:text-blue-200"
                    : "text-purple-300 group-hover:text-purple-200"
                } transition-colors duration-500
              `}
              >
                {feature.title}
                <span
                  className={`
                  absolute -bottom-1 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out
                  ${
                    isUpcoming
                      ? "bg-gradient-to-r from-blue-400 to-indigo-400"
                      : "bg-gradient-to-r from-purple-400 to-brand-500"
                  }
                `}
                ></span>
              </h3>

              {/* Description with improved readability */}
              <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                {feature.description}
              </p>

              {/* Hover indicator */}
              <div
                className={`
                absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                ${
                  isUpcoming
                    ? "bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
                    : "bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
                }
              `}
              ></div>
              
              {/* Click/swipe hint */}
              <div className="absolute bottom-4 right-4 text-xs text-white/30">
                {revealedCard === feature.title ? "Revealed" : "Swipe to reveal"}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        );
      },
    []
  );

  // Fix SVG animations to be more performant - create optimized versions of the icons
  const optimizeAnimation = (element: JSX.Element): JSX.Element => {
    // This will clone element and modify any animation classes to use transform-based animations
    // that are more performant (CPU to GPU)
    return React.cloneElement(element, {
      className: (element.props.className || "").replace("animate-pulse", "animate-pulse-gpu")
        .replace("animate-ping", "animate-pulse-gpu")
    });
  };
  
  // Create a noise texture effect for the card covers
  const [noiseTexture, setNoiseTexture] = useState<string | null>(null);
  
  React.useEffect(() => {
    // Create a canvas noise texture for better performance than image loading
    const canvas = document.createElement("canvas");
    canvas.width = 200; 
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      const imageData = ctx.createImageData(200, 200);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 255);
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 15; // Very transparent
      }
      
      ctx.putImageData(imageData, 0, 0);
      setNoiseTexture(canvas.toDataURL("image/png"));
    }
  }, []);

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
            <FeatureCard 
              key={feature.title} 
              feature={feature} 
              index={index} 
            />
          ))}
          {upcomingFeatures.map((feature, index) => (
            <FeatureCard
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
