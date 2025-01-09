import React, { useState } from "react";
import { Button } from "../ui/Button";
import { CreateContestModal } from "./CreateContestModal";

interface CreateContestButtonProps {
  onContestCreated?: () => void;
}

export const CreateContestButton: React.FC<CreateContestButtonProps> = ({
  onContestCreated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
        Create Contest
      </Button>

      <CreateContestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onContestCreated?.();
          setIsModalOpen(false);
        }}
      />
    </>
  );
};
