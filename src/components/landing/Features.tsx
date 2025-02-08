// src/components/landing/Features.tsx

import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import React, { useRef, useState } from "react";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient: string;
  isUpcoming: boolean;
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
    isUpcoming: false,
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
    isUpcoming: false,
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
    isUpcoming: false,
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
    isUpcoming: false,
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
    isUpcoming: true,
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
    isUpcoming: true,
  },
] as const;

// Combine all features with a type flag
const allFeatures = [
  ...existingFeatures.map((feature) => ({ ...feature, isUpcoming: false })),
  ...upcomingFeatures.map((feature) => ({ ...feature, isUpcoming: true })),
];

export const Features: React.FC = () => {
  const [expandedFeature, setExpandedFeature] = useState<
    (typeof allFeatures)[0] | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 3;
  const totalItems = allFeatures.length;

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    const itemWidth = carouselRef.current?.offsetWidth || 0;
    const snapPoint = Math.round(currentX / itemWidth) * itemWidth;
    x.set(snapPoint);
  };

  const navigateCarousel = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? Math.min(currentIndex + 1, totalItems - itemsPerView)
        : Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
  };

  return (
    <motion.section
      className="relative w-full py-16 md:py-24 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,0,255,0.05)_0%,transparent_70%)] animate-pulse-slow" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed" />
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1.0, 0.22, 1.0] }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-200">
            Platform Features
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Experience the future of competitive trading
          </p>
        </motion.div>

        {/* Features Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={() => navigateCarousel("prev")}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-200/80 backdrop-blur-sm rounded-r-lg border border-brand-400/20 
              ${
                currentIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-brand-400/20"
              }`}
          >
            <svg
              className="w-6 h-6 text-brand-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => navigateCarousel("next")}
            disabled={currentIndex >= totalItems - itemsPerView}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-200/80 backdrop-blur-sm rounded-l-lg border border-brand-400/20
              ${
                currentIndex >= totalItems - itemsPerView
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-brand-400/20"
              }`}
          >
            <svg
              className="w-6 h-6 text-brand-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Features Grid */}
          <motion.div
            ref={carouselRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden"
            drag="x"
            dragConstraints={{
              left: -(totalItems - itemsPerView) * 100,
              right: 0,
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            animate={{
              x:
                (-currentIndex * (carouselRef.current?.offsetWidth || 0)) /
                itemsPerView,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {allFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.19, 1.0, 0.22, 1.0],
                }}
                className="h-full"
                onClick={() => !isDragging && setExpandedFeature(feature)}
              >
                <div
                  className={`relative h-full p-6 rounded-lg backdrop-blur-sm cursor-pointer border
                    ${
                      feature.isUpcoming
                        ? "bg-dark-200/30 border-emerald-400/20"
                        : "bg-dark-200/40 border-dark-300/50"
                    }
                    transition-all duration-300`}
                >
                  {/* Feature content remains the same ... */}
                  <motion.div className="relative w-12 h-12 mb-4">
                    <div
                      className={`text-${
                        feature.isUpcoming ? "emerald" : "brand"
                      }-400`}
                    >
                      {feature.icon}
                    </div>
                  </motion.div>

                  <motion.h3
                    className={`text-xl font-cyber mb-2 ${
                      feature.isUpcoming ? "text-emerald-400" : "text-brand-400"
                    }`}
                  >
                    {feature.title}
                    {feature.isUpcoming && (
                      <span className="ml-2 text-xs text-emerald-400/60 font-cyber">
                        SOON™
                      </span>
                    )}
                  </motion.h3>

                  <p className="text-gray-400 text-sm md:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Enhanced Expanded Feature Modal */}
      <AnimatePresence>
        {expandedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 p-4 bg-black/80 backdrop-blur-lg overflow-y-auto"
            onClick={() => setExpandedFeature(null)}
          >
            <div className="min-h-full flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, rotateX: -10 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.95, opacity: 0, rotateX: 10 }}
                transition={{ type: "spring", damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-dark-200/90 rounded-lg overflow-hidden transform-gpu"
                style={{ perspective: "1000px" }}
              >
                <motion.div
                  className="p-6 md:p-8"
                  whileHover={{ scale: 1.02, rotateX: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  {/* Modal Content */}
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={`w-12 h-12 flex-shrink-0 ${
                        expandedFeature.isUpcoming
                          ? "text-emerald-400"
                          : "text-brand-400"
                      }`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {expandedFeature.icon}
                    </motion.div>
                    <div className="flex-1">
                      <motion.h2
                        className={`text-2xl md:text-3xl font-cyber mb-4 ${
                          expandedFeature.isUpcoming
                            ? "text-emerald-400"
                            : "text-brand-400"
                        }`}
                        whileHover={{ x: 10 }}
                      >
                        {expandedFeature.title}
                        {expandedFeature.isUpcoming && (
                          <motion.span
                            className="ml-3 text-sm tracking-wider bg-dark-200/60 px-3 py-1 rounded-sm"
                            whileHover={{ scale: 1.1 }}
                          >
                            COMING SOON
                          </motion.span>
                        )}
                      </motion.h2>
                      <motion.p
                        className="text-gray-300 text-lg leading-relaxed"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {expandedFeature.description}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
