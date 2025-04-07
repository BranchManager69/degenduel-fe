/**
 * @fileoverview
 * Contract display component for the terminal
 * 
 * @description
 * Displays the contract address with animation effects
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React from 'react';
import { ContractDisplayProps } from '../types';

/**
 * ContractDisplay - Displays contract address with appropriate styling
 */
export const ContractDisplay: React.FC<ContractDisplayProps> = ({ 
  isReleaseTime, 
  contractAddress 
}) => {
  if (isReleaseTime) {
    // When release time has passed, show the real contract in 24-style green
    return (
      <span className="text-green-400 font-mono tracking-wider relative">
        {contractAddress}
        <motion.span 
          className="absolute top-0 left-0 bg-green-500/10 h-full" 
          style={{ width: "100%" }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </span>
    );
  } else {
    // Before release, show redacted display
    const redactedDisplay = "[ ██-█████████-████████ ]";
    return (
      <span className="text-red-400 font-mono tracking-wider relative">
        {redactedDisplay}
        <motion.span 
          className="absolute top-0 left-0 bg-red-500/20 h-full" 
          style={{ width: "100%" }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </span>
    );
  }
};

export default ContractDisplay;