import React from "react";
import { motion } from "framer-motion";
import { Contest } from "../../types/index";
import { ContestCard } from "./ContestCard";
import { CompactContestCard } from "./CompactContestCard";
import { ProminentContestCard } from "./ProminentContestCard";
import { cn } from "../../lib/utils";

export type ContestCardSize = "mini" | "compact" | "standard" | "wide" | "tall" | "featured";

interface FlexibleContestCardProps {
  contest: Contest;
  size?: ContestCardSize;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// Size configurations for different card variants
const sizeConfigs = {
  mini: {
    gridSpan: "col-span-1",
    minHeight: "min-h-[180px]",
  },
  compact: {
    gridSpan: "col-span-1",
    minHeight: "min-h-[250px]",
  },
  standard: {
    gridSpan: "col-span-1",
    minHeight: "min-h-[400px]",
  },
  wide: {
    gridSpan: "col-span-2",
    minHeight: "min-h-[200px]",
  },
  tall: {
    gridSpan: "col-span-1 row-span-2",
    minHeight: "min-h-[600px]",
  },
  featured: {
    gridSpan: "col-span-2 row-span-2",
    minHeight: "min-h-[600px]",
  },
};

export const FlexibleContestCard: React.FC<FlexibleContestCardProps> = ({
  contest,
  size = "standard",
  onClick,
  className,
  style,
}) => {
  const config = sizeConfigs[size];

  // Choose the appropriate card component based on size
  const renderCard = () => {
    switch(size) {
      case "mini":
        return <CompactContestCard contest={contest} onClick={onClick} variant="minimal" />;
      case "compact":
        return <CompactContestCard contest={contest} onClick={onClick} variant="compact" />;
      case "wide":
        return <CompactContestCard contest={contest} onClick={onClick} variant="wide" />;
      case "tall":
      case "standard":
        return <ContestCard contest={contest} onClick={onClick} />;
      case "featured":
        return <ProminentContestCard contest={contest} onClick={onClick} />;
      default:
        return <ContestCard contest={contest} onClick={onClick} />;
    }
  };

  return (
    <motion.div
      className={cn(
        config.gridSpan,
        config.minHeight,
        "relative",
        className
      )}
      style={style}
    >
      <div className="h-full">
        {renderCard()}
      </div>
    </motion.div>
  );
};

// Helper component for creating dynamic grid layouts
export const ContestGrid: React.FC<{
  contests: Contest[];
  layout?: Array<{ contestId: string; size: ContestCardSize }>;
  onContestClick?: (contest: Contest) => void;
  className?: string;
}> = ({ contests, layout, onContestClick, className }) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[300px]",
      className
    )}>
      {contests.map((contest) => {
        // Find layout config for this contest if provided
        const layoutConfig = layout?.find(l => l.contestId === contest.id.toString());
        const size = layoutConfig?.size || "standard";

        return (
          <FlexibleContestCard
            key={contest.id}
            contest={contest}
            size={size}
            onClick={() => onContestClick?.(contest)}
          />
        );
      })}
    </div>
  );
};