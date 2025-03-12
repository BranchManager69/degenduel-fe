import { motion } from "framer-motion";
import React from "react";

import { AchievementCard } from "./AchievementCard";
import { Achievement } from "../../types/profile";

interface AchievementsListProps {
  achievements: Achievement[];
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
}) => {
  if (achievements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Empty state content */}
        <div className="relative text-center space-y-4">
          <div className="text-4xl animate-bounce">🏆</div>
          <div>
            <h3 className="text-xl font-cyber text-brand-300 mb-2">
              No Achievements Yet
            </h3>
            <p className="text-gray-400 group-hover:animate-cyber-pulse">
              Start competing in contests to earn achievements and unlock
              rewards!
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-500/20 to-transparent" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
    >
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.achievement}
          variants={{
            hidden: {
              opacity: 0,
              y: 20,
              scale: 0.95,
            },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 1,
              },
            },
          }}
          className="relative"
        >
          {/* Achievement connector lines */}
          {index > 0 && (
            <div className="absolute -top-4 left-1/2 w-px h-4 bg-gradient-to-b from-brand-500/0 via-brand-500/20 to-brand-500/0" />
          )}
          {index % 2 === 1 && (
            <div className="absolute top-1/2 -left-4 w-4 h-px bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0" />
          )}

          <AchievementCard achievement={achievement} />
        </motion.div>
      ))}
    </motion.div>
  );
};
