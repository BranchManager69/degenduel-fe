/**
 * ChallengeFriendButton.tsx
 * 
 * @description Button component to trigger challenge creation modal
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-01-29
 */

import React from "react";
import { Button } from "../ui/Button";
import { ChallengeCreationModal } from "./ChallengeCreationModal";

interface ChallengeFriendButtonProps {
  onChallengeCreated?: () => void;
  className?: string;
  variant?: "outline" | "gradient" | "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const ChallengeFriendButton: React.FC<ChallengeFriendButtonProps> = ({
  onChallengeCreated,
  className = "",
  variant = "outline",
  size = "md",
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChallengeSuccess = () => {
    setIsModalOpen(false);
    onChallengeCreated?.();
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <span>⚔️</span>
        <span>Challenge Friend</span>
      </Button>

      <ChallengeCreationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleChallengeSuccess}
      />
    </>
  );
}; 