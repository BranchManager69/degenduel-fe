import { motion } from 'framer-motion';
import { polarToCartesian } from '../../../lib/geometry';

export const Player = ({ idx, centre }: { idx: number; centre: [number, number] }) => {
  const radius = 140;  // Move players further out
  const deg = 72 * idx;          // 5 players, 360/5 = 72°
  const { x, y } = polarToCartesian(0, 0, radius, deg);

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Stick figure */}
      <g>
        {/* Head */}
        <circle cx="0" cy="-10" r="6" className="fill-gray-600" />
        {/* Body */}
        <line x1="0" y1="-4" x2="0" y2="8" stroke="#4B5563" strokeWidth="2" />
        {/* Arms */}
        <line x1="0" y1="0" x2="-6" y2="6" stroke="#4B5563" strokeWidth="2" />
        <line x1="0" y1="0" x2="6" y2="6" stroke="#4B5563" strokeWidth="2" />
        {/* Legs */}
        <line x1="0" y1="8" x2="-5" y2="16" stroke="#4B5563" strokeWidth="2" />
        <line x1="0" y1="8" x2="5" y2="16" stroke="#4B5563" strokeWidth="2" />
      </g>
      <motion.g
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
          opacity: [1, 1, 0],
          x: [0, centre[0] - x, centre[0] - x],
          y: [0, centre[1] - y, centre[1] - y],
        }}
        transition={{ delay: idx * 0.3, duration: 1.2, ease: 'easeOut', repeat: Infinity }}
      >
        <image 
          href="/assets/media/logos/solana.svg" 
          x="-8" 
          y="-8" 
          width="16" 
          height="16" 
        />
      </motion.g>
    </g>
  );
};