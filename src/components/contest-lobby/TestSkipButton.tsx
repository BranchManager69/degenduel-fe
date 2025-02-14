import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface TestSkipButtonProps {
  contestId: string;
}

export const TestSkipButton: React.FC<TestSkipButtonProps> = ({ contestId }) => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(`/contests/${contestId}/results`)}
      variant="outline"
      className="bg-dark-300/50 border-yellow-500/50 text-yellow-400 hover:bg-dark-400/50"
    >
      <span className="flex items-center">
        🧪 Skip to Results (Testing)
      </span>
    </Button>
  );
};