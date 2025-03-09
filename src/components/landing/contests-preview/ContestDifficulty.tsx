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
  const [isExpanded, setIsExpanded] = React.useState(false);
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

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Expandable drawer */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-36' : 'max-h-0'}
        `}
      >
        <div className={`
          bg-gradient-to-b ${config.colors.from} to-black/90
          p-4 backdrop-blur-md border-t ${config.colors.border}
          transform transition-all duration-300
          ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h4 className={`text-sm font-bold ${config.colors.text}`}>{config.label} Mode</h4>
              <p className="text-xs text-gray-300">For {config.label === "Unknown" ? "players of all levels" : `${config.label} level players`}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {config.label === "Unknown" 
              ? "Standard contest with no special rules or restrictions."
              : `A ${config.label.toLowerCase()}-tier contest with special mechanics for experienced players.`}
          </p>
        </div>
      </div>
      
      {/* Colored bar indicator */}
      <div 
        onClick={toggleExpand}
        className={`
          cursor-pointer h-4 w-full
          bg-gradient-to-r ${config.colors.from} ${config.colors.to}
          transition-all duration-300 ease-in-out
          group border-t ${config.colors.border}
          ${isExpanded ? 'h-1.5' : 'hover:h-5'}
        `}
      >
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <span className={`
            transform transition-transform duration-300
            ${isExpanded ? 'rotate-180 translate-y-1' : 'translate-y-0'}
            ${config.colors.text} opacity-70 text-xs
          `}>
            ▲
          </span>
        </div>
      </div>
    </div>
  );
};
