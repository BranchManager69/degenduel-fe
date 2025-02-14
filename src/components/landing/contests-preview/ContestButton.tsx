import React from "react";
import { Link } from "react-router-dom";

interface ContestButtonProps {
  id: number;
  type: "live" | "upcoming";
}

export const ContestButton: React.FC<ContestButtonProps> = ({ id, type }) => {
  const isLive = type === "live";

  return (
    <Link to={`/contests/${id}`} className="block mt-4">
      <button className="w-full relative group overflow-hidden bg-brand-400/10 hover:bg-brand-400/20 transition-all duration-300 rounded-lg py-2.5">
        {/* Glowing edges on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-[1px] rounded-lg bg-brand-400/5" />
        </div>

        {/* Button content */}
        <div className="relative flex items-center justify-center space-x-2">
          <span className="text-brand-400 font-medium text-[15px] tracking-wide uppercase">
            {isLive ? "Spectate Live" : "Enter Arena"}
          </span>
          <svg
            className="w-5 h-5 text-brand-400 transform group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      </button>
    </Link>
  );
};
