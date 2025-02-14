import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { FONT_PRESETS } from "../../constants/fonts";
import { Particles } from "./Particles";

export const HeroTitle: React.FC = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [degenVisible, setDegenVisible] = useState(false);
  const [duelVisible, setDuelVisible] = useState(false);
  const [collisionComplete, setCollisionComplete] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Atmospheric effect */}
      <div className="absolute inset-0 z-10 opacity-80">
        <Canvas>
          <Particles />
        </Canvas>
      </div>

      {/* Initial darkness */}
      <motion.div
        className="absolute inset-0 bg-black z-30"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 1.5 }}
        onAnimationComplete={() => {
          setIntroComplete(true);
          setTimeout(() => setDegenVisible(true), 500);
          setTimeout(() => setDuelVisible(true), 1500);
        }}
      />

      <div className="relative z-20 flex items-center justify-center h-full">
        {/* DEGEN */}
        <motion.div
          initial={{ x: "-200vw", opacity: 0, scale: 2, filter: "blur(20px)" }}
          animate={{
            x: collisionComplete ? 0 : 20,
            opacity: degenVisible ? 1 : 0,
            scale: collisionComplete ? 1 : 1.4,
            filter: "blur(0px)",
            rotate: collisionComplete ? [-8, 0] : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 20,
            duration: 1.8,
            rotate: {
              duration: 0.4,
              ease: "easeOut",
            },
          }}
          onAnimationComplete={() =>
            setTimeout(() => setCollisionComplete(true), 800)
          }
          className="text-9xl font-black tracking-tighter select-none"
          style={{
            fontFamily: FONT_PRESETS.pixelPerfect.heading,
            textShadow: "0 0 40px rgba(147, 51, 234, 0.4)",
            color: "#9333EA",
            letterSpacing: "-0.05em",
          }}
        >
          DEGEN
        </motion.div>

        {/* X mark */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotateY: 720 }}
          animate={{
            scale: [0, 1.5, 1.2],
            opacity: introComplete ? 1 : 0,
            rotateY: 0,
          }}
          transition={{
            duration: 2,
            delay: 1,
            times: [0, 0.7, 1],
            ease: "easeOut",
          }}
          className="relative mx-6 text-8xl select-none"
          style={{
            fontFamily: FONT_PRESETS.pixelPerfect.heading,
            perspective: "1000px",
            color: "#FFFFFF",
          }}
        >
          <motion.span
            animate={{
              rotateY: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotateY: {
                repeat: Infinity,
                duration: 8,
                ease: "linear",
              },
              scale: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              },
            }}
          >
            x
          </motion.span>
        </motion.div>

        {/* DUEL */}
        <motion.div
          initial={{ x: "200vw", opacity: 0, scale: 2, filter: "blur(20px)" }}
          animate={{
            x: collisionComplete ? 0 : -20,
            opacity: duelVisible ? 1 : 0,
            scale: collisionComplete ? 1 : 1.4,
            filter: "blur(0px)",
            rotate: collisionComplete ? [8, 0] : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 20,
            duration: 1.8,
            rotate: {
              duration: 0.4,
              ease: "easeOut",
            },
          }}
          className="text-9xl font-black tracking-tighter select-none"
          style={{
            fontFamily: FONT_PRESETS.pixelPerfect.heading,
            textShadow: "0 0 40px rgba(255, 255, 255, 0.4)",
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
          }}
        >
          DUEL
        </motion.div>
      </div>

      {/* Font imports */}
      <link
        href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};
