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

// Updated props interface to match the new implementation
interface ContractDisplayProps {
  isRevealed: boolean;
  contractAddress?: string;
}

/**
 * ContractDisplay - Displays contract address with appropriate styling
 * Now gets data from the terminal data API instead of hardcoded props
 */
export const ContractDisplay: React.FC<ContractDisplayProps> = ({ 
  isRevealed, 
  contractAddress 
}) => {
  if (isRevealed && contractAddress) {
    // When contract is revealed, show the real contract address in terminal-style green
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
    // Before reveal, show redacted display (placeholder)
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