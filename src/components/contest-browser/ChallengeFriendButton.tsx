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
import { toast } from "react-hot-toast";
import { Button } from "../ui/Button";
import { ChallengeCreationModal } from "./ChallengeCreationModal";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

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
  const { isAdministrator } = useMigratedAuth();

  const handleOpenModal = () => {
    if (!isAdministrator) {
      toast.error("🚧 Coming Soon! Friend challenges are under development.", {
        duration: 3000,
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
          border: '1px solid #374151'
        }
      });
      return;
    }
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
        disabled={!isAdministrator}
        className={`flex items-center gap-2 ${className} ${!isAdministrator ? 'opacity-60 cursor-not-allowed' : ''}`}
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