import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <motion.div 
      className="text-center mb-8 md:mb-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="relative inline-block">
        <h2 className="text-2xl md:text-4xl font-bold font-russo text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block">
          {title}
          {/* Animated underline */}
          <motion.div 
            className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 rounded-full"
            initial={{ width: '0%', left: '50%' }}
            animate={{ width: '100%', left: '0%' }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </h2>
      </div>

      {/* Subtitle with typewriter cursor */}
      <motion.div className="mt-4 md:mt-6 flex items-center justify-center px-2">
        <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-lg font-mono tracking-wide text-center">
          {subtitle}
        </p>
        <motion.span 
          className="ml-1 md:ml-2 inline-block w-1.5 md:w-2 h-4 md:h-5 bg-brand-400"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        />
      </motion.div>
    </motion.div>
  );
};