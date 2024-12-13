import React, { useState } from 'react';
import { Button } from '../ui/Button';

export const CreateContestButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      variant="gradient"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden transition-colors duration-300 ${
        isHovered ? 'bg-gray-700 hover:bg-gray-700' : ''
      }`}
    >
      <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        Coming Soon!
      </span>
      <span className={`transition-opacity duration-300 ${
        isHovered ? 'opacity-0' : 'opacity-100'
      }`}>
        Create Contest
      </span>
    </Button>
  );
};