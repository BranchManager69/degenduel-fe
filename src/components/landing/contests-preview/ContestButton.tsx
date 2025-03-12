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
}

// Contest Button Component
export const ContestButton: React.FC<ContestButtonProps> = ({ id, type }) => {
  const isLive = type === "live"; // a.k.a. "active"
  const isUpcoming = type === "upcoming"; // a.k.a. "pending"
  const isCompleted = type === "completed"; // a.k.a. "finished"
  const isCancelled = type === "cancelled";

  // Determine gradient based on contest type
  const gradientClasses = isLive
    ? "from-green-500/20 via-brand-500/20 to-green-500/20"
    : "from-blue-500/20 via-brand-500/20 to-blue-500/20";

  // Determine text color based on contest type
  const textColorClass = isLive
    ? "text-green-400"
    : isUpcoming
      ? "text-blue-400"
      : isCompleted
        ? "text-green-400"
        : "text-red-400";

  // Determine hover color based on contest type
  const hoverBgClass = isLive
    ? "hover:bg-green-500/20"
    : "hover:bg-blue-500/20";

  // Determine border color based on contest type
  const borderColorClass = isLive
    ? "border-red-500/30"
    : isUpcoming
      ? "border-blue-500/30"
      : isCompleted
        ? "border-green-500/30"
        : "border-red-500/30";

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
  } else if (isCompleted) {
    contestButtonDestination = `/contests/${id}/results`;
  } else if (isCancelled) {
    contestButtonDestination = `/contests/${id}`;
  }

  return (
    <Link to={contestButtonDestination} className="block">
      <button
        className={`
        w-full relative group overflow-hidden 
        bg-dark-200/40 backdrop-blur-sm ${hoverBgClass} 
        border ${borderColorClass}
        transition-all duration-500 rounded-lg py-3
        font-cyber tracking-wide
      `}
      >
        {/* Animated gradient background */}
        <div
          className={`
          absolute inset-0 bg-gradient-to-r ${gradientClasses}
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        `}
        ></div>

        {/* Animated border glow */}
        <div
          className={`
          absolute -inset-[1px] rounded-lg blur-sm 
          bg-gradient-to-r ${gradientClasses}
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        `}
        ></div>

        {/* Scan line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_8px] animate-scan"></div>

        {/* Button content */}
        <div className="relative flex items-center justify-center space-x-3">
          {/* Animated 'live' icon for active contests */}
          {isLive && (
            <span className="relative w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
              <span className="relative rounded-full w-2 h-2 bg-red-400"></span>
            </span>
          )}

          <span
            className={`${textColorClass} font-medium text-[15px] uppercase`}
          >
            {isLive
              ? "Spectate Live"
              : isUpcoming
                ? "Enter Arena"
                : isCompleted
                  ? "View Results"
                  : "View Details"}
          </span>

          <svg
            className={`${textColorClass} w-5 h-5`}
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

        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></div>
      </button>
    </Link>
  );
};
