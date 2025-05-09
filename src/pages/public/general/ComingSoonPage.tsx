// src/pages/public/general/ComingSoonPage.tsx

/**
 * Coming Soon Page
 * 
 * @description A page that displays a coming soon message and a countdown timer to launch.
 * Now includes the CyberGrid background.
 * 
 * @author BranchManager69
 * @version 2.2.0 // Version incremented for background
 * @created 2025-05-07
 * @updated 2025-05-08 // Date updated
 */

import React, { useEffect, useRef, useState } from 'react';
import { CyberGrid } from '../../../components/animated-background/CyberGrid'; // Import CyberGrid
import Logo from '../../../components/ui/Logo';
import { FALLBACK_RELEASE_DATE, getActiveReleaseDate } from '../../../services/releaseDateService';
import { formatDuration, getTimeRemainingUntilRelease, isReleaseTimePassed } from '../../../utils/dateUtils';

interface CountdownParts {
  d: number;
  h: number;
  m: number;
  s: number;
}

const ComingSoonPage: React.FC = () => {
  const [releaseDate, setReleaseDate] = useState<Date>(FALLBACK_RELEASE_DATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<CountdownParts>({ d: 0, h: 0, m: 0, s: 0 });
  const [hasLaunched, setHasLaunched] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const loadReleaseDate = async () => {
      setIsLoading(true);
      try {
        const activeDate = await getActiveReleaseDate();
        const dateToUse = activeDate || FALLBACK_RELEASE_DATE;
        setReleaseDate(dateToUse);

        if (isReleaseTimePassed(dateToUse)) {
          setHasLaunched(true);
        }
      } catch (error) {
        console.error("Error fetching release date for Coming Soon page:", error);
        setReleaseDate(FALLBACK_RELEASE_DATE);
        if (isReleaseTimePassed(FALLBACK_RELEASE_DATE)) {
          setHasLaunched(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadReleaseDate();
  }, []);

  useEffect(() => {
    if (isLoading || hasLaunched) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (hasLaunched) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
      }
      return;
    }

    const updateCountdown = () => {
      const remaining = getTimeRemainingUntilRelease(releaseDate);
      if (remaining <= 0) {
        setHasLaunched(true);
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setCountdown(formatDuration(remaining));
      }
    };

    updateCountdown(); // Initial call to set countdown immediately
    intervalRef.current = window.setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [releaseDate, isLoading, hasLaunched]);

  const renderCountdownBox = (value: number, label: string) => (
    <div className="flex flex-col items-center justify-center bg-dark-700/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-md w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border border-mauve/20">
      <span className="font-numbers text-xl sm:text-2xl md:text-3xl font-bold text-purple-300 tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="font-sans text-xs sm:text-sm text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <>
      <CyberGrid /> {/* Render the background */} 
      {/* Main content container: Set z-index above background and make its background transparent */}
      <div className="relative z-10 min-h-screen flex flex-col bg-transparent text-gray-100 items-center justify-center p-4 text-center font-sans">
        
        {/* Logo (black, X-large) - Consider changing logoColor if needed against the new background */}
        <div className="my-8">
          <Logo size="xl" logoColor="white" animated enhancedGlow glowColor="#9D4EDD" /> {/* Changed to white for contrast, added glow */} 
        </div>

        {/* Coming Soon Message */}
        {/* Add a subtle background to the text content area for readability over the grid */}
        <div className="max-w-2xl w-full px-4 py-6 bg-black/30 backdrop-blur-sm rounded-lg border border-mauve/10">
          
          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-brand-400">
            <b>DegenDuel</b> is Coming.
          </h1>
          
          {!isLoading && !hasLaunched && (
            <div className="my-8">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-purple-300 mb-6">Launching In:</h2>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                {renderCountdownBox(countdown.d, "Days")}
                {renderCountdownBox(countdown.h, "Hours")}
                {renderCountdownBox(countdown.m, "Mins")}
                {renderCountdownBox(countdown.s, "Secs")}
              </div>
            </div>
          )}

          {hasLaunched && (
             <p className="font-display text-lg sm:text-xl text-green-400 mt-6 mb-4 font-semibold">
               DegenDuel has Launched!
             </p>
          )}

          {/* Description */}
          <p className="text-md sm:text-lg text-gray-300 mt-4 leading-relaxed">
            {hasLaunched 
              ? "Head over to the main site to join the action!" 
              : "We're gearing up for launch. Get ready to dive into high-stakes trading competitions on Solana."}
          </p>

          {/* Links */} 
          <div className="mt-8 text-sm space-y-3">

            {/* (Section 1) Social Media Links */}
            <div>
              <span>Follow on X:</span>
              
              {/* DegenDuel X (Twitter) */}
              <a 
                href="https://x.com/DegenDuelMe" // DegenDuel X (Twitter)
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
              >
                @DegenDuelMe
              </a>

              {/* BranchManager69 X (Twitter) */}
              <a 
                href="https://x.com/BranchManager69" // BranchManager69 X (Twitter)
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
              >
                @BranchManager69
              </a>
            </div>

            {/* (Section 2) Community Links */}
            <div> 
              <span className="mt-8 text-sm space-y-3">Join the community:</span>

              {/* Discord */}
              <a 
                href="https://discord.gg/dduel" // DegenDuel Discord server
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
              >
                Discord
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me/DegenDuel" // DegenDuel Telegram
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium ml-2"
              >
                Telegram
              </a>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoonPage; 