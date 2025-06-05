// src/components/landing/contests-preview/ContestButton.tsx

/**
 * This is the button that appears on the contest card.
 * It is used to navigate to the contest page.
 * It is also used to display the contest status.
 */

import React from "react";
import { Link } from "react-router-dom";

interface ContestButtonProps {
  id: number;
  type: "live" | "upcoming" | "completed" | "cancelled";
  isParticipating?: boolean;
}

// Contest Button Component
export const ContestButton: React.FC<ContestButtonProps> = ({ id, type, isParticipating = false }) => {
  const isLive = type === "live"; // a.k.a. "active"
  const isUpcoming = type === "upcoming"; // a.k.a. "pending"
  const isComplete = type === "completed"; // a.k.a. "finished"
  const isCancelled = type === "cancelled";

  // Special treatment for participating contests
  // const isEntered = isParticipating && !isComplete && !isCancelled;

  // These variables are no longer used with the new styling approach
  // Keeping the logic here for reference if needed later

  // Determine icon color based on contest type
  //const iconColorClass = isLive
  //  ? "text-red-400"
  //  : isUpcoming
  //  ? "text-blue-400"
  //  : isCompleted
  //  ? "text-green-400"
  //  : "text-red-400";

  let contestButtonDestination = "";
  if (isLive) {
    contestButtonDestination = `/contests/${id}/live`;
  } else if (isUpcoming) {
    contestButtonDestination = `/contests/${id}`;
  } else if (isComplete) {
    contestButtonDestination = `/contests/${id}/results`;
  } else if (isCancelled) {
    contestButtonDestination = `/contests/${id}`;
  }
  
  // Determine which cases need dual buttons
  const isUpcomingNotEntered = isUpcoming && !isParticipating;
  // We already have isComplete defined above
  const showDualButtons = isUpcomingNotEntered || isComplete;
  
  // URLs for different buttons
  const detailsUrl = `/contests/${id}`; // Always goes to contest details
  const directEntryUrl = `/contests/${id}/select-tokens`; // For upcoming contests - direct entry
  const resultsUrl = `/contests/${id}/results`; // For completed contests
  
  // For active contests, we simply use the contestButtonDestination which is already set to /live

  return showDualButtons ? (
    // Dual button layout for upcoming not entered and completed contests
    <div className="grid grid-cols-2 gap-2">
      {/* Details Button - now with better styling */}
      <Link to={detailsUrl} className="block">
        <button
          className={`
          w-full relative group overflow-hidden 
          bg-dark-200/40 backdrop-blur-sm hover:bg-dark-200/60
          border border-dark-300/80 hover:border-gray-400/40
          transition-all duration-300 rounded-lg py-2
          font-cyber tracking-wide
        `}
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-500/5 to-gray-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Very subtle border glow */}
          <div className="absolute -inset-[1px] rounded-lg blur-sm bg-gradient-to-r from-gray-500/0 via-gray-500/20 to-gray-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badge content */}
          <div className="relative flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300 uppercase transition-colors duration-300">Details</span>
          </div>
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        </button>
      </Link>
      
      {/* Second Button - Either Enter or Results based on contest state */}
      <Link to={isComplete ? resultsUrl : directEntryUrl} className="block">
        <button
          className={`
          w-full relative group overflow-hidden 
          bg-dark-200/40 backdrop-blur-sm hover:bg-dark-200/60
          border ${isComplete ? 'border-dark-300/80 hover:border-green-500/40' : 'border-dark-300/80 hover:border-brand-500/40'}
          transition-all duration-300 rounded-lg py-2
          font-cyber tracking-wide
        `}
        >
          {/* Subtle gradient background */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r 
              ${isComplete 
                ? 'from-green-500/0 via-green-500/10 to-green-500/0' 
                : 'from-brand-500/0 via-brand-500/10 to-brand-500/0'} 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          ></div>
          
          {/* Very subtle border glow */}
          <div 
            className={`absolute -inset-[1px] rounded-lg blur-sm bg-gradient-to-r 
              ${isComplete 
                ? 'from-green-500/0 via-green-500/30 to-green-500/0' 
                : 'from-brand-500/0 via-brand-500/30 to-brand-500/0'} 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          ></div>
          
          {/* Badge content */}
          <div className="relative flex items-center justify-center gap-1.5">
            {isComplete ? (
              // Results icon
              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ) : (
              // Enter icon
              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            )}
            <span 
              className={`text-xs font-bold text-gray-400 ${isComplete ? 'group-hover:text-green-400' : 'group-hover:text-brand-400'} uppercase transition-colors duration-300`}
            >
              {isComplete 
                ? (isParticipating ? "My Results" : "Results") 
                : "Enter"}
            </span>
          </div>
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        </button>
      </Link>
    </div>
  ) : (
    // Standard single button for all other cases
    <Link to={contestButtonDestination} className="block">
      <button
        className={`
        w-full relative group overflow-hidden 
        bg-dark-200/40 backdrop-blur-sm hover:bg-dark-200/60
        border ${isCancelled ? 'border-dark-300/80 hover:border-red-500/40' : isLive ? 'border-dark-300/80 hover:border-green-500/40' : isUpcoming ? 'border-dark-300/80 hover:border-blue-500/40' : 'border-dark-300/80 hover:border-gray-400/40'}
        transition-all duration-300 rounded-lg py-2
        font-cyber tracking-wide
      `}
      >
        {/* Subtle gradient background */}
        <div
          className={`
          absolute inset-0 bg-gradient-to-r 
          ${isCancelled 
            ? 'from-red-500/0 via-red-500/10 to-red-500/0' 
            : isLive 
              ? 'from-green-500/0 via-green-500/10 to-green-500/0'
              : isUpcoming
                ? 'from-blue-500/0 via-blue-500/10 to-blue-500/0'
                : 'from-gray-500/0 via-gray-500/10 to-gray-500/0'}
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        `}
        ></div>

        {/* Very subtle border glow */}
        <div
          className={`
          absolute -inset-[1px] rounded-lg blur-sm 
          bg-gradient-to-r 
          ${isCancelled 
            ? 'from-red-500/0 via-red-500/30 to-red-500/0' 
            : isLive 
              ? 'from-green-500/0 via-green-500/30 to-green-500/0'
              : isUpcoming
                ? 'from-blue-500/0 via-blue-500/30 to-blue-500/0'
                : 'from-gray-500/0 via-gray-500/30 to-gray-500/0'}
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        `}
        ></div>

        {/* No scan line effect - removed for consistency */}

        {/* Button content */}
        <div className="relative flex items-center justify-center space-x-3">
          {/* Animated 'live' icon for active contests */}
          {isLive && !isParticipating && (
            <span className="relative w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-gray-400 group-hover:bg-green-400 animate-ping opacity-75 transition-colors duration-300"></span>
              <span className="relative rounded-full w-2 h-2 bg-gray-400 group-hover:bg-green-400 transition-colors duration-300"></span>
            </span>
          )}
          
          {/* Participating check icon */}
          {isParticipating && (
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-brand-400 transition-colors duration-300" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}

          <span
            className={`text-gray-400 ${isLive ? 'group-hover:text-green-400' : isUpcoming ? 'group-hover:text-blue-400' : isCancelled ? 'group-hover:text-red-400' : 'group-hover:text-gray-300'} font-medium text-[15px] uppercase transition-colors duration-300`}
          >
            {/* For active contests, we only have single button with clear text */}
            {isLive
              ? (isParticipating ? "ENTER DUEL LOBBY" : "SPECTATE LIVE")
              : isUpcoming
                ? (isParticipating ? "ALREADY ENTERED" : "VIEW CONTEST")
                : isCancelled
                  ? "VIEW DETAILS"
                  : isComplete
                    ? (isParticipating ? "MY RESULTS" : "VIEW RESULTS")
                    : "VIEW DETAILS" /* Fallback */
            }
          </span>

          <svg
            className={`text-gray-400 ${isLive ? 'group-hover:text-green-400' : isUpcoming ? 'group-hover:text-blue-400' : isCancelled ? 'group-hover:text-red-400' : 'group-hover:text-gray-300'} w-5 h-5 transition-colors duration-300`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      </button>
    </Link>
  );
};
