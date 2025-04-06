import confetti from "canvas-confetti";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../../lib/utils";

interface CelebrationOverlayProps {
  finalValue: number;
  initialValue: number;
  onClose?: () => void;
}

// More engaging and less obtrusive celebration overlay
export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  finalValue,
  initialValue,
  onClose
}) => {
  const [show, setShow] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const percentageChange = ((finalValue - initialValue) / initialValue) * 100;
  const isWinner = percentageChange > 0;
  const isBreakEven = Math.abs(percentageChange) < 0.01;

  // Function to handle closing
  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  // Auto-dismiss after timeout
  useEffect(() => {
    if (isBreakEven) return;
    
    const timer = setTimeout(() => handleClose(), 6000);
    return () => clearTimeout(timer);
  }, [isBreakEven]);

  // Animation sequence
  useEffect(() => {
    if (isBreakEven) return;

    // Phase 1 - Initial animation
    setTimeout(() => setAnimationPhase(1), 300);
    
    // Phase 2 - Show content
    setTimeout(() => setAnimationPhase(2), 800);
    
    // Phase 3 - Show value change
    setTimeout(() => setAnimationPhase(3), 1300);
    
    // Trigger confetti for winners
    if (isWinner) {
      // Wait a moment before starting confetti
      setTimeout(() => {
        const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#c084fc", "#a855f7"];
        const end = Date.now() + 3000;

        const frame = () => {
          const now = Date.now();
          if (now > end) return;

          // Left side
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 50,
            origin: { x: 0, y: 0.5 },
            colors: colors,
            startVelocity: 40,
            gravity: 0.8,
            drift: 0,
            ticks: 300,
            shapes: ['circle', 'square'],
          });

          // Right side
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 50,
            origin: { x: 1, y: 0.5 },
            colors: colors,
            startVelocity: 40,
            gravity: 0.8,
            drift: 0,
            ticks: 300,
            shapes: ['circle', 'square'],
          });

          requestAnimationFrame(frame);
        };

        frame();
      }, 500);
    }
  }, [isWinner, isBreakEven]);

  if (!show || isBreakEven) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Dimmed backdrop with gradient - less obtrusive */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
        
        {/* Toast-style notification at the top */}
        <motion.div
          ref={contentRef}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center max-w-md w-full"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div 
            className={`px-6 py-4 rounded-lg shadow-lg border-2 backdrop-blur-md w-full
              ${isWinner 
                ? "bg-gradient-to-br from-green-900/40 to-green-800/30 border-green-500/50" 
                : "bg-gradient-to-br from-red-900/40 to-red-800/30 border-red-500/50"
              }`}
          >
            <AnimatePresence mode="wait">
              {animationPhase >= 1 && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Title with positive/negative styling */}
                  <motion.div 
                    className={`text-2xl font-bold mb-2 ${isWinner ? "text-green-400" : "text-red-400"}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isWinner ? "Contest Complete! 🎯" : "Contest Complete"}
                  </motion.div>
                  
                  {/* Animated divider line */}
                  <motion.div 
                    className={`h-0.5 w-0 mx-auto mb-3 ${isWinner ? "bg-green-500/50" : "bg-red-500/50"}`}
                    initial={{ width: 0 }}
                    animate={{ width: "50%" }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Value change with animation */}
            <AnimatePresence>
              {animationPhase >= 2 && (
                <motion.div
                  className="flex justify-center items-center gap-4 my-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Initial value */}
                  <motion.div 
                    className="text-gray-400 font-mono"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {formatCurrency(initialValue)}
                  </motion.div>
                  
                  {/* Arrow */}
                  <motion.div 
                    className="text-gray-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    →
                  </motion.div>
                  
                  {/* Final value */}
                  <motion.div 
                    className={`text-lg font-medium font-mono ${isWinner ? "text-green-400" : "text-red-400"}`}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {formatCurrency(finalValue)}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Percentage change with counter animation */}
            <AnimatePresence>
              {animationPhase >= 3 && (
                <motion.div
                  className="text-center my-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                >
                  <CounterAnimation 
                    value={percentageChange} 
                    isPositive={isWinner}
                    duration={1.5}
                  />
                  
                  {/* Growth/Loss visualization */}
                  <motion.div 
                    className="flex justify-center gap-1 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-1 w-2 rounded-full ${
                          isWinner 
                            ? "bg-green-500" 
                            : "bg-red-500"
                        }`}
                        initial={{ height: 4 }}
                        animate={{ 
                          height: isWinner
                            ? [4, 8 + i * 2, 4] 
                            : [4, 4 - i * 0.5, 4]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5,
                          delay: i * 0.1,
                          repeatType: "reverse"
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Action button */}
            <motion.div 
              className="flex justify-center mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.button
                className={`px-4 py-1.5 rounded text-sm font-medium
                  ${isWinner 
                    ? "bg-green-800/50 text-green-300 border border-green-600/50 hover:bg-green-700/50" 
                    : "bg-red-800/50 text-red-300 border border-red-600/50 hover:bg-red-700/50"
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
              >
                View Results
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Animated counter component for dramatically revealing percentages
const CounterAnimation: React.FC<{
  value: number;
  isPositive: boolean;
  duration?: number;
}> = ({ value, isPositive, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const absValue = Math.abs(value);
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const updateCounter = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / (duration * 1000));
      // Easing function for more dramatic effect
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      setDisplayValue(eased * absValue);
      
      if (now < endTime) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(absValue);
      }
    };
    
    requestAnimationFrame(updateCounter);
  }, [value, duration]);
  
  return (
    <div 
      ref={counterRef} 
      className={`text-3xl font-bold font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}
    >
      {isPositive ? "+" : "-"}{displayValue.toFixed(2)}%
    </div>
  );
};
