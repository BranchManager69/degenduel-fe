import React from "react";

export interface CreateContestButtonProps {
  onCreateClick: () => void;
}

export const CreateContestButton: React.FC<CreateContestButtonProps> = ({
  onCreateClick,
}) => {
  return (
    <button
      onClick={onCreateClick}
      className="group relative px-6 py-2.5 overflow-hidden rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 transition-all duration-300 shadow-lg hover:shadow-brand-500/25"
    >
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      
      {/* Content */}
      <div className="relative flex items-center gap-2.5">
        <svg 
          className="w-5 h-5 text-white" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="font-semibold text-white">
          Create Contest
        </span>
      </div>
    </button>
  );
};