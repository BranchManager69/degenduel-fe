import React from 'react';
import { motion } from 'framer-motion';
import { Stage1 } from './revenue-share/stages/Stage1';
import { Stage2 } from './revenue-share/stages/Stage2';
import { Stage3 } from './revenue-share/stages/Stage3';
import { Stage4 } from './revenue-share/stages/Stage4';

export const RevenueShareDiagram: React.FC = () => (
  <div className="py-12" style={{ counterReset: 'step' }}>
    {/* Desktop: Horizontal layout */}
    <div className="hidden lg:flex justify-center gap-16">
      <Stage1 />
      <Stage2 />
      
      {/* Stage 3 with traveling slice */}
      <div className="relative">
        <Stage3 />
        <motion.div
          className="absolute pointer-events-none"
          style={{ 
            top: '52px',  // p(16px) + h3(20px) + gap-4(16px) = 52px
            left: '50%',
            marginLeft: '-130px'  // Half of 260px to center the slice
          }}
          initial={{ opacity: 1 }}
          animate={{
            opacity: 1,
            x: [0, 0, 260, 260, 0],
            y: [0, 0, -10, -10, 0],
            scale: [0.8, 0.8, 1, 0.8, 0.8]
          }}
          transition={{
            times: [0, 0.2, 0.4, 0.8, 1],
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <svg width={260} height={260}>
            <g transform="translate(130 130)">
              <path d="M 0,0 L 0,-100 A 100,100 1 0,1 58.8,-80.9 z" 
                    fill="rgba(147, 51, 234, 0.2)" 
                    stroke="#374151" 
                    strokeWidth="1" 
                    strokeLinejoin="round" />
              <text x="30" y="-50" textAnchor="middle" className="fill-white text-sm font-bold">10%</text>
            </g>
          </svg>
        </motion.div>
      </div>
      
      <Stage4 />
    </div>

    {/* Mobile/Tablet: Vertical layout */}
    <div className="lg:hidden flex flex-col items-center gap-16">
      <Stage1 />
      <Stage2 />
      
      {/* Stage 3 with vertical traveling slice */}
      <div className="relative">
        <Stage3 />
        <motion.div
          className="absolute pointer-events-none"
          style={{ 
            top: '52px',
            left: '50%',
            marginLeft: '-130px'
          }}
          initial={{ opacity: 1 }}
          animate={{
            opacity: 1,
            x: [0, 0, 0, 0, 0],
            y: [0, 0, 320, 320, 0],
            scale: [0.8, 0.8, 1, 0.8, 0.8]
          }}
          transition={{
            times: [0, 0.2, 0.4, 0.8, 1],
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <svg width={260} height={260}>
            <g transform="translate(130 130)">
              <path d="M 0,0 L 0,-100 A 100,100 1 0,1 58.8,-80.9 z" 
                    fill="rgba(147, 51, 234, 0.2)" 
                    stroke="#374151" 
                    strokeWidth="1" 
                    strokeLinejoin="round" />
              <text x="30" y="-50" textAnchor="middle" className="fill-white text-sm font-bold">10%</text>
            </g>
          </svg>
        </motion.div>
      </div>
      
      <Stage4 />
    </div>
  </div>
);

export default RevenueShareDiagram;