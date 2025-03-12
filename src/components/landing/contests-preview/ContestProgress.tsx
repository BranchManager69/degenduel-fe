import React from "react";

interface ContestProgressProps {
  current: number;
  max: number;
}

export const ContestProgress: React.FC<ContestProgressProps> = ({
  current,
  max,
}) => {
  const progress = (current / max) * 100;

  return (
    <div className="flex items-center space-x-2">
      <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-300">
        {current}/{max}
      </span>
    </div>
  );
};
