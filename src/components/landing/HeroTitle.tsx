import React from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Particles } from './Particles';

export const HeroTitle: React.FC = () => {
  return (
    <div className="relative h-32 overflow-hidden">
      {/* Smoke/Fog Effect Canvas */}
      <div className="absolute inset-0 z-10">
        <Canvas>
          <Particles />
        </Canvas>
      </div>

      <div className="relative z-20 flex items-center justify-center h-full">
        {/* DEGEN from left */}
        <motion.div
          initial={{ x: "-100vw", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 10,
            duration: 0.8
          }}
          className="text-6xl font-bold text-brand-400"
        >
          DEGEN
        </motion.div>

        {/* X spinning on collision */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            rotate: 360
          }}
          transition={{
            delay: 0.8,
            duration: 0.5,
            rotate: {
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }
          }}
          className="relative -mx-1 text-5xl font-bold text-brand-400"
          style={{
            marginTop: "-0.2em",
            zIndex: 30
          }}
        >
          X
        </motion.div>

        {/* DUEL from right */}
        <motion.div
          initial={{ x: "100vw", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 10,
            duration: 0.8
          }}
          className="text-6xl font-bold"
          style={{
            background: "linear-gradient(to right, #ffffff, #a0a0a0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          DUEL
        </motion.div>
      </div>
    </div>
  );
}; 