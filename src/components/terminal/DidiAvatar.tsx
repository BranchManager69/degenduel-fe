import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DidiAvatarProps {
  hasUnreadMessages: boolean;
  easterEggActivated: boolean;
  glitchActive: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export const DidiAvatar = ({
  hasUnreadMessages,
  easterEggActivated,
  glitchActive,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging
}: DidiAvatarProps) => {
  // Optimized blink timing - less frequent, more natural
  const [leftEyeBlink, setLeftEyeBlink] = useState(false);
  const [rightEyeBlink, setRightEyeBlink] = useState(false);

  useEffect(() => {
    const blinkLeft = () => {
      setLeftEyeBlink(true);
      setTimeout(() => setLeftEyeBlink(false), 150);
    };
    
    const blinkRight = () => {
      setRightEyeBlink(true);
      setTimeout(() => setRightEyeBlink(false), 150);
    };

    // Natural blink patterns
    const leftBlinkInterval = setInterval(blinkLeft, 3200 + Math.random() * 2000);
    const rightBlinkInterval = setInterval(blinkRight, 3800 + Math.random() * 2000);

    return () => {
      clearInterval(leftBlinkInterval);
      clearInterval(rightBlinkInterval);
    };
  }, []);

  const colorScheme = easterEggActivated ? 'green' : 'purple';
  const isExcited = hasUnreadMessages;

  return (
    <motion.div
      className="w-16 h-16 md:w-20 md:h-20 cursor-pointer relative"
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ 
        opacity: 0, 
        y: 10
      }}
      animate={{ 
        opacity: 1, 
        y: 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
      whileDrag={{ scale: 1.1, zIndex: 50 }}
      whileHover={{ scale: 1.05 }}
      style={{ perspective: "1000px" }}
    >
      {/* Main Container */}
      <motion.div
        className={`
          w-full h-full rounded-full relative overflow-visible
          bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-purple-900/80
        `}
        animate={{
          boxShadow: [
            `0 0 15px ${colorScheme === 'green' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`,
            `0 0 25px ${colorScheme === 'green' ? 'rgba(52, 211, 153, 0.5)' : 'rgba(147, 51, 234, 0.5)'}`,
            `0 0 15px ${colorScheme === 'green' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`
          ],
          rotate: glitchActive ? [-1, 1, -1, 0] : [0, 0.5, -0.5, 0]
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity },
          rotate: { duration: 4, repeat: Infinity }
        }}
      >
        {/* Luscious Hair System - SVG Based */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24 h-16">
          <svg
            width="96"
            height="64"
            viewBox="0 0 96 64"
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            {/* Hair gradient definition */}
            <defs>
              <radialGradient id="hairGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="40%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#facc15" />
              </radialGradient>
              <filter id="hairGlow">
                <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Main voluminous hair shape */}
            <motion.path
              d="M20 32 Q12 16 24 8 Q32 2 48 8 Q56 2 64 8 Q76 16 68 32 Q72 40 66 48 Q60 42 52 36 Q48 32 44 36 Q36 42 30 48 Q24 40 28 32 Q16 40 20 32 Z"
              fill="url(#hairGradient)"
              filter="url(#hairGlow)"
              animate={{
                d: [
                  "M20 32 Q12 16 24 8 Q32 2 48 8 Q56 2 64 8 Q76 16 68 32 Q72 40 66 48 Q60 42 52 36 Q48 32 44 36 Q36 42 30 48 Q24 40 28 32 Q16 40 20 32 Z",
                  "M20 32 Q8 20 24 4 Q32 -2 48 4 Q56 -2 64 4 Q80 20 68 32 Q74 42 66 50 Q58 44 52 38 Q48 34 44 38 Q38 44 30 50 Q22 42 28 32 Q14 42 20 32 Z",
                  "M20 32 Q12 16 24 8 Q32 2 48 8 Q56 2 64 8 Q76 16 68 32 Q72 40 66 48 Q60 42 52 36 Q48 32 44 36 Q36 42 30 48 Q24 40 28 32 Q16 40 20 32 Z"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Additional hair layers for volume */}
            <motion.path
              d="M24 28 Q18 20 28 12 Q36 6 48 12 Q60 6 68 12 Q78 20 72 28 Q76 36 70 44 Q64 38 56 32 Q48 28 40 32 Q32 38 26 44 Q20 36 24 28 Z"
              fill="url(#hairGradient)"
              opacity="0.7"
              filter="url(#hairGlow)"
              animate={{
                d: [
                  "M24 28 Q18 20 28 12 Q36 6 48 12 Q60 6 68 12 Q78 20 72 28 Q76 36 70 44 Q64 38 56 32 Q48 28 40 32 Q32 38 26 44 Q20 36 24 28 Z",
                  "M24 28 Q16 22 28 8 Q36 4 48 8 Q60 4 68 8 Q80 22 72 28 Q78 38 70 46 Q62 40 56 34 Q48 30 40 34 Q34 40 26 46 Q18 38 24 28 Z",
                  "M24 28 Q18 20 28 12 Q36 6 48 12 Q60 6 68 12 Q78 20 72 28 Q76 36 70 44 Q64 38 56 32 Q48 28 40 32 Q32 38 26 44 Q20 36 24 28 Z"
                ]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Flowing side strands */}
            <motion.path
              d="M16 36 Q12 44 8 56 Q4 64 8 68 Q12 64 16 60"
              stroke="url(#hairGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  "M16 36 Q12 44 8 56 Q4 64 8 68 Q12 64 16 60",
                  "M16 36 Q8 48 4 60 Q0 68 4 72 Q8 68 12 64",
                  "M16 36 Q12 44 8 56 Q4 64 8 68 Q12 64 16 60"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M80 36 Q84 44 88 56 Q92 64 88 68 Q84 64 80 60"
              stroke="url(#hairGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  "M80 36 Q84 44 88 56 Q92 64 88 68 Q84 64 80 60",
                  "M80 36 Q88 48 92 60 Q96 68 92 72 Q88 68 84 64",
                  "M80 36 Q84 44 88 56 Q92 64 88 68 Q84 64 80 60"
                ]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Extra flowing wisps */}
            <motion.path
              d="M28 24 Q24 32 20 48 Q18 52 22 54"
              stroke="url(#hairGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
              animate={{
                d: [
                  "M28 24 Q24 32 20 48 Q18 52 22 54",
                  "M28 24 Q20 36 16 52 Q14 56 18 58",
                  "M28 24 Q24 32 20 48 Q18 52 22 54"
                ]
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M68 24 Q72 32 76 48 Q78 52 74 54"
              stroke="url(#hairGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
              animate={{
                d: [
                  "M68 24 Q72 32 76 48 Q78 52 74 54",
                  "M68 24 Q76 36 80 52 Q82 56 78 58",
                  "M68 24 Q72 32 76 48 Q78 52 74 54"
                ]
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Central flowing strands */}
            <motion.path
              d="M48 20 Q46 28 44 44 Q42 48 46 50"
              stroke="url(#hairGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
              animate={{
                d: [
                  "M48 20 Q46 28 44 44 Q42 48 46 50",
                  "M48 20 Q44 32 40 48 Q38 52 42 54",
                  "M48 20 Q46 28 44 44 Q42 48 46 50"
                ]
              }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Face Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          
          {/* Eyes */}
          <div className="flex items-center gap-2 mb-2">
            {/* Left Eye */}
            <motion.div
              className={`
                relative w-4 h-4 rounded-full bg-white border-2 transition-colors duration-300
                ${colorScheme === 'green' ? 'border-emerald-400' : 'border-purple-400'}
              `}
              animate={{
                scaleY: leftEyeBlink ? 0.1 : 1,
                scale: isExcited ? [1, 1.1, 1] : 1
              }}
              transition={{
                scaleY: { duration: 0.15 },
                scale: { duration: 1, repeat: isExcited ? Infinity : 0 }
              }}
            >
              {/* Pupil with smooth movement */}
              <motion.div
                className="absolute w-2 h-2 bg-gray-900 rounded-full"
                style={{ top: '25%', left: '25%' }}
                animate={{
                  x: isExcited ? [-1, 1, -0.5, 0.5, 0] : [-0.5, 0.5, -0.5],
                  y: isExcited ? [-0.5, 0.5, -0.2, 0.2, 0] : 0
                }}
                transition={{ duration: isExcited ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Eye shine */}
              <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-2 opacity-80" />
            </motion.div>

            {/* Right Eye */}
            <motion.div
              className={`
                relative w-4 h-4 rounded-full bg-white border-2 transition-colors duration-300
                ${colorScheme === 'green' ? 'border-emerald-400' : 'border-purple-400'}
              `}
              animate={{
                scaleY: rightEyeBlink ? 0.1 : 1,
                scale: isExcited ? [1, 1.1, 1] : 1
              }}
              transition={{
                scaleY: { duration: 0.15 },
                scale: { duration: 1.2, repeat: isExcited ? Infinity : 0 }
              }}
            >
              {/* Pupil */}
              <motion.div
                className="absolute w-2 h-2 bg-gray-900 rounded-full"
                style={{ top: '25%', left: '25%' }}
                animate={{
                  x: isExcited ? [1, -1, 0.5, -0.5, 0] : [0.5, -0.5, 0.5],
                  y: isExcited ? [0.5, -0.5, 0.2, -0.2, 0] : 0
                }}
                transition={{ duration: isExcited ? 2.2 : 4.2, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Eye shine */}
              <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-2 opacity-80" />
            </motion.div>
          </div>

          {/* Mouth */}
          <motion.div
            className={`
              relative transition-colors duration-300
              ${colorScheme === 'green' ? 'text-emerald-400' : 
                isExcited ? 'text-purple-400' : 'text-pink-400'}
            `}
            animate={{
              scale: isExcited ? [1, 1.2, 1] : [1, 1.05, 1],
              y: isExcited ? [0, -1, 0] : 0
            }}
            transition={{ duration: isExcited ? 1 : 3, repeat: Infinity }}
          >
            {/* Simple styled mouth */}
            <div className={`w-3 h-1.5 rounded-full ${
              isExcited ? 'bg-pink-500' : 'bg-pink-400'
            } opacity-80`} />
          </motion.div>
        </div>

        {/* Subtle particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                colorScheme === 'green' ? 'bg-emerald-400/30' : 'bg-purple-400/30'
              }`}
              style={{
                top: `${20 + i * 30}%`,
                left: `${20 + i * 20}%`
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.5],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        {/* Message notification indicator */}
        {hasUnreadMessages && (
          <motion.div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              colorScheme === 'green' ? 'bg-emerald-400' : 'bg-purple-400'
            }`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

      </motion.div>

      {/* Enhanced tooltip */}
      {hasUnreadMessages && !isDragging && (
        <motion.div
          className="absolute bottom-full right-0 mb-2 pointer-events-none"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-xl border border-purple-400/30">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                colorScheme === 'green' ? 'bg-emerald-400' : 'bg-purple-400'
              }`} />
              <span className="text-xs text-white font-medium whitespace-nowrap">
                {easterEggActivated ? "Didi is free!" : "New message from Didi"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 