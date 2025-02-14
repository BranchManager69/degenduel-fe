import React from "react";
import { Button } from "../ui/Button";

export interface CreateContestButtonProps {
  onCreateClick: () => void;
}

export const CreateContestButton: React.FC<CreateContestButtonProps> = ({
  onCreateClick,
}) => {
  return (
    <Button
      onClick={onCreateClick}
      className="relative group px-6 py-2.5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
      <span className="relative flex items-center gap-2">
        <span>Create New Duel</span>
        <svg
          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </span>
    </Button>
  );
};
