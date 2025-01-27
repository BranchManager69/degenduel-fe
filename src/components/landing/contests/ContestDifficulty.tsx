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
  { label: string; colors: { from: string; to: string; border: string } }
> = {
  guppy: {
    label: "Guppy",
    colors: {
      from: "from-emerald-400/20",
      to: "to-emerald-600/20",
      border: "border-emerald-500/30",
    },
  },
  tadpole: {
    label: "Tadpole",
    colors: {
      from: "from-blue-400/20",
      to: "to-blue-600/20",
      border: "border-blue-500/30",
    },
  },
  squid: {
    label: "Squid",
    colors: {
      from: "from-purple-400/20",
      to: "to-purple-600/20",
      border: "border-purple-500/30",
    },
  },
  dolphin: {
    label: "Dolphin",
    colors: {
      from: "from-pink-400/20",
      to: "to-pink-600/20",
      border: "border-pink-500/30",
    },
  },
  shark: {
    label: "Shark",
    colors: {
      from: "from-orange-400/20",
      to: "to-orange-600/20",
      border: "border-orange-500/30",
    },
  },
  whale: {
    label: "Whale",
    colors: {
      from: "from-red-400/20",
      to: "to-red-600/20",
      border: "border-red-500/30",
    },
  },
};

export const ContestDifficulty: React.FC<ContestDifficultyProps> = ({
  difficulty,
}) => {
  const config = difficultyConfig[difficulty] || {
    label: "Unknown",
    colors: {
      from: "from-gray-400/20",
      to: "to-gray-600/20",
      border: "border-gray-500/30",
    },
  };

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div
        className={`absolute -inset-[1px] bg-gradient-to-r ${config.colors.from} ${config.colors.to} rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div
        className={`
          relative
          inline-flex items-center px-3 py-1
          rounded-full text-xs font-semibold
          bg-gradient-to-r ${config.colors.from} ${config.colors.to}
          border ${config.colors.border}
          transition-all duration-300
          hover:scale-105
          overflow-hidden
        `}
      >
        {/* Shine effect - contained within parent */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
        </div>

        {/* Label */}
        <span className="relative">{config.label}</span>
      </div>
    </div>
  );
};
