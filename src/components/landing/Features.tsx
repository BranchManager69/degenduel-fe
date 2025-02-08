// src/components/landing/Features.tsx

import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React, { useState } from "react";
import { Card, CardContent } from "../ui/Card";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<
    (typeof allFeatures)[0] | null
  >(null);

  // Motion values for the orbital carousel
  const dragX = useMotionValue(0);
  const rotation = useTransform(dragX, [-200, 200], [30, -30]);
  const controls = useAnimation();

  // Calculate positions for each card in the orbit
  const calculateCardPosition = (
    index: number,
    totalCards: number,
    active: number
  ) => {
    const radius = 600; // Orbit radius
    const angleStep = 360 / totalCards;
    const baseAngle = (index - active) * angleStep;

    return {
      x: Math.sin(baseAngle * (Math.PI / 180)) * radius,
      z: Math.cos(baseAngle * (Math.PI / 180)) * radius - radius,
      rotateY: -baseAngle,
      scale: Math.max(0.8, 1 - Math.abs(index - active) * 0.15),
    };
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100; // Minimum drag distance for navigation
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? -1 : 1;
      const newIndex =
        (activeIndex + direction + allFeatures.length) % allFeatures.length;
      setActiveIndex(newIndex);
    }

    controls.start({ x: 0 });
    setIsDragging(false);
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative w-full overflow-hidden py-32"
    >
      <div className="relative container mx-auto px-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1.0, 0.22, 1.0] }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-200">
            Platform Features
          </h2>
        </motion.div>

        {/* 3D Orbital Carousel */}
        <div className="relative h-[600px] perspective-1000">
          <motion.div
            style={{
              rotateX: 10,
              rotateY: rotation,
              x: dragX,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="relative w-full h-full preserve-3d"
          >
            <AnimatePresence>
              {allFeatures.map((feature, index) => {
                const position = calculateCardPosition(
                  index,
                  allFeatures.length,
                  activeIndex
                );

                return (
                  <motion.div
                    key={feature.title}
                    initial={false}
                    animate={{
                      x: position.x,
                      z: position.z,
                      rotateY: position.rotateY,
                      scale: position.scale,
                      opacity: position.scale,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    style={{
                      position: "absolute",
                      width: "400px",
                      transformStyle: "preserve-3d",
                    }}
                    onClick={() => !isDragging && setExpandedFeature(feature)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`bg-dark-200/40 backdrop-blur-sm border-dark-300/50 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 group ${
                        feature.isUpcoming ? "border-emerald-400/20" : ""
                      }`}
                    >
                      <CardContent className="p-6 space-y-4">
                        {/* Icon with enhanced glow effect */}
                        <div className="relative w-12 h-12">
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${
                              feature.isUpcoming
                                ? "from-emerald-400/10 to-teal-500/10"
                                : "from-emerald-400/20 to-teal-500/20"
                            } rounded-full blur-lg group-hover:blur-xl transition-all`}
                          />
                          <div
                            className={`relative w-full h-full ${
                              feature.isUpcoming
                                ? "text-emerald-400/70 group-hover:text-emerald-300/70"
                                : "text-emerald-400 group-hover:text-emerald-300"
                            } transition-colors`}
                          >
                            {feature.icon}
                          </div>
                        </div>

                        {/* Title with consistent height */}
                        <h3 className="h-[56px] flex items-center text-xl font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                          {feature.title}
                          {feature.isUpcoming && (
                            <span className="ml-2 text-xs font-cyber tracking-wider text-emerald-400/70 bg-dark-200/60 px-2 py-1 rounded-sm">
                              SOON
                            </span>
                          )}
                        </h3>

                        {/* Description with truncation */}
                        <p
                          className={`${
                            feature.isUpcoming
                              ? "text-gray-500 group-hover:text-gray-400"
                              : "text-gray-400 group-hover:text-gray-300"
                          } transition-colors line-clamp-3`}
                        >
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {allFeatures.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex
                  ? feature.isUpcoming
                    ? "bg-emerald-400/70 w-4"
                    : "bg-emerald-400 w-4"
                  : feature.isUpcoming
                  ? "bg-gray-600/70 hover:bg-emerald-600/70"
                  : "bg-gray-600 hover:bg-emerald-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Expanded Feature View */}
      <AnimatePresence>
        {expandedFeature && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedFeature(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl bg-dark-200/90 rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              layoutId={`feature-${expandedFeature.title}`}
            >
              {/* Expanded content here - will enhance in next iteration */}
              <div className="p-8">
                <h2
                  className={`text-3xl font-cyber mb-4 ${
                    expandedFeature.isUpcoming
                      ? "text-emerald-400/70"
                      : "text-emerald-400"
                  }`}
                >
                  {expandedFeature.title}
                  {expandedFeature.isUpcoming && (
                    <span className="ml-4 text-sm font-cyber tracking-wider text-emerald-400/70 bg-dark-200/60 px-3 py-1 rounded-sm">
                      COMING SOON
                    </span>
                  )}
                </h2>
                <p className="text-gray-300">{expandedFeature.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
