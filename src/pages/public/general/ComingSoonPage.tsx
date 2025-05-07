// src/pages/public/general/ComingSoonPage.tsx

/**
 * Coming Soon Page
 * 
 * @description A page that displays a coming soon message.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-07
 * @updated 2025-05-07
 */

import React from 'react';
import Logo from '../../../components/ui/Logo'; // Adjusted path

const ComingSoonPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-gray-100 items-center justify-center p-4 text-center">
      <div className="my-8">
        {/* You can choose the logo color and size appropriate for this page */}
        <Logo size="lg" logoColor="white" animated />
      </div>

      <div className="max-w-lg w-full px-4">
        <h1 className="text-3xl sm:text-4xl font-semibold text-brand-400">
          <b>DegenDuel</b> is Coming.
        </h1>
        <p className="text-md sm:text-lg text-gray-300 mt-4 leading-relaxed">
          We're gearing up for launch. Get ready to dive into high-stakes trading competitions on Solana.
        </p>
        
        <div className="mt-8 text-sm space-y-3">
          <div>
            <span>Follow for updates:</span>
            <a 
              href="https://x.com/DegenDuelMe" // Replace with your actual X link
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
            >
              X (Twitter)
            </a>
            {/* Add other links like Discord if desired */}
            {/* <a 
              href="https://discord.gg/yourinvite" // Replace with your actual Discord link
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
            >
              Discord
            </a> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage; 