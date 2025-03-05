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
  {
    label: string;
    colors: {
      from: string;
      to: string;
      border: string;
      text: string;
      glow: string;
    };
    icon: string;
  }
> = {
  guppy: {
    label: "Guppy",
    colors: {
      from: "from-emerald-400/20",
      to: "to-emerald-600/20",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "bg-emerald-500/30",
    },
    icon: "🐠",
  },
  tadpole: {
    label: "Tadpole",
    colors: {
      from: "from-blue-400/20",
      to: "to-blue-600/20",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glow: "bg-blue-500/30",
    },
    icon: "🐸",
  },
  squid: {
    label: "Squid",
    colors: {
      from: "from-purple-400/20",
      to: "to-purple-600/20",
      border: "border-purple-500/30",
      text: "text-purple-400",
      glow: "bg-purple-500/30",
    },
    icon: "🦑",
  },
  dolphin: {
    label: "Dolphin",
    colors: {
      from: "from-pink-400/20",
      to: "to-pink-600/20",
      border: "border-pink-500/30",
      text: "text-pink-400",
      glow: "bg-pink-500/30",
    },
    icon: "🐬",
  },
  shark: {
    label: "Shark",
    colors: {
      from: "from-orange-400/20",
      to: "to-orange-600/20",
      border: "border-orange-500/30",
      text: "text-orange-400",
      glow: "bg-orange-500/30",
    },
    icon: "🦈",
  },
  whale: {
    label: "Whale",
    colors: {
      from: "from-red-400/20",
      to: "to-red-600/20",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "bg-red-500/30",
    },
    icon: "🐋",
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
      text: "text-gray-400",
      glow: "bg-gray-500/30",
    },
    icon: "❓",
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
          inline-flex items-center gap-1.5 px-3 py-1.5
          rounded-full text-xs font-semibold font-cyber tracking-wide
          bg-gradient-to-r ${config.colors.from} ${config.colors.to}
          border ${config.colors.border}
          transition-all duration-300
          hover:scale-105
          overflow-hidden
          backdrop-blur-sm
          ${config.colors.text}
        `}
      >
        {/* Shine effect - contained within parent */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
        </div>

        {/* Icon */}
        <span className="text-sm">{config.icon}</span>

        {/* Label */}
        <span className="relative">{config.label}</span>

        {/* Pulsing dot */}
        <span className="relative w-1.5 h-1.5">
          <span
            className={`absolute inset-0 rounded-full ${config.colors.glow} animate-ping opacity-75`}
          ></span>
          <span
            className={`relative rounded-full w-1.5 h-1.5 ${config.colors.glow}`}
          ></span>
        </span>
      </div>
    </div>
  );
};
