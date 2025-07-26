import { motion } from 'framer-motion';

export const TravelingPieSlice = () => {
  // Fixed positions based on the layout - Stage 2 is center, Stage 3 is right
  const stage2X = 350; // Approximate center position
  const stage2Y = 100; // Below Stage 2 header
  const stage3X = 590; // Approximate right position
  const stage3Y = 60;  // Stage 3 pie area
  
  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      style={{ width: '96px', height: '96px' }}
      initial={{ x: stage2X, y: stage2Y, opacity: 0 }}
      animate={{
        x: [stage2X, stage2X, stage3X, stage3X, stage2X],
        y: [stage2Y, stage2Y, stage3Y, stage3Y, stage2Y],
        scale: [0.8, 0.8, 1, 0.8, 0.8],
        opacity: [0, 1, 1, 1, 0]
      }}
      transition={{
        times: [0, 0.1, 0.35, 0.65, 1],
        duration: 8,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* 10% pie slice */}
        <path d="M 50,50 L 50,5 A 45,45 1 0,1 85.1,35.5 z" 
              fill="#A855F7" 
              stroke="none" />
        <text x="67" y="22" textAnchor="middle" className="fill-white text-sm font-bold">10%</text>
      </svg>
    </motion.div>
  );
};