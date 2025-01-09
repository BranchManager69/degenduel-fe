import React from "react";

type DifficultyLevel =
  | "guppy"
  | "tadpole"
  | "squid"
  | "dolphin"
  | "shark"
  | "whale";

interface ContestDifficultyProps {
  difficulty: DifficultyLevel;
}

const difficultyConfig: Record<
  DifficultyLevel,
  { label: string; color: string }
> = {
  guppy: { label: "Guppy", color: "text-green-400" },
  tadpole: { label: "Tadpole", color: "text-blue-400" },
  squid: { label: "Squid", color: "text-purple-400" },
  dolphin: { label: "Dolphin", color: "text-pink-400" },
  shark: { label: "Shark", color: "text-orange-400" },
  whale: { label: "Whale", color: "text-red-400" },
};

export const ContestDifficulty: React.FC<ContestDifficultyProps> = ({
  difficulty,
}) => {
  const config = difficultyConfig[difficulty] || {
    label: "Unknown",
    color: "text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};
