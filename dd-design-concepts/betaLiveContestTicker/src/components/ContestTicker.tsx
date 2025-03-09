import React, { useEffect, useState, useRef } from "react";
import { SolanaSymbol } from "./SolanaSymbol";
interface Contest {
  id: string;
  status: "LIVE" | "PENDING" | "ENDED" | "CANCELLED";
  name: string;
  amount: string;
  filled: number;
  total: string;
  timeAgo: string;
}
interface ContestTickerProps {
  contests: Contest[];
}
const statusConfig = {
  LIVE: {
    color: "emerald",
    baseColor: "rgba(16, 185, 129, 0.2)",
    glowColor: "rgba(16, 185, 129, 0.6)",
    borderColor: "rgba(16, 185, 129, 0.4)"
  },
  PENDING: {
    color: "amber",
    baseColor: "rgba(245, 158, 11, 0.2)",
    glowColor: "rgba(245, 158, 11, 0.6)",
    borderColor: "rgba(245, 158, 11, 0.4)"
  },
  ENDED: {
    color: "purple",
    baseColor: "rgba(147, 51, 234, 0.2)",
    glowColor: "rgba(147, 51, 234, 0.6)",
    borderColor: "rgba(147, 51, 234, 0.4)"
  },
  CANCELLED: {
    color: "red",
    baseColor: "rgba(239, 68, 68, 0.2)",
    glowColor: "rgba(239, 68, 68, 0.6)",
    borderColor: "rgba(239, 68, 68, 0.4)"
  }
};
const statusColors = {
  LIVE: {
    from: "rgba(16, 185, 129, 0.8)",
    to: "rgba(16, 185, 129, 0.4)",
    progress: "rgba(16, 185, 129, 0.6)"
  },
  PENDING: {
    from: "rgba(245, 158, 11, 0.8)",
    to: "rgba(245, 158, 11, 0.4)",
    progress: "rgba(245, 158, 11, 0.6)"
  },
  ENDED: {
    from: "rgba(147, 51, 234, 0.8)",
    to: "rgba(147, 51, 234, 0.4)",
    progress: "rgba(147, 51, 234, 0.6)"
  },
  CANCELLED: {
    from: "rgba(239, 68, 68, 0.8)",
    to: "rgba(239, 68, 68, 0.4)",
    progress: "rgba(239, 68, 68, 0.6)"
  }
};
const ContestTicker: React.FC<ContestTickerProps> = ({
  contests
}) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    const clone = ticker.innerHTML;
    ticker.innerHTML += clone;
    const duration = contests.length * 2.5;
    ticker.style.animation = `scroll ${duration}s linear infinite`;
    const pauseAnimation = () => {
      if (ticker) ticker.style.animationPlayState = "paused";
    };
    const resumeAnimation = () => {
      if (ticker) ticker.style.animationPlayState = "running";
    };
    const handleDesktopHover = (e: MouseEvent) => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        if (e.type === "mouseenter") {
          setIsExpanded(true);
          pauseAnimation();
        } else {
          setIsExpanded(false);
          resumeAnimation();
        }
      }
    };
    ticker.addEventListener("mouseenter", handleDesktopHover);
    ticker.addEventListener("mouseleave", handleDesktopHover);
    return () => {
      ticker.removeEventListener("mouseenter", handleDesktopHover);
      ticker.removeEventListener("mouseleave", handleDesktopHover);
    };
  }, [contests]);
  const handleTickerTap = (e: React.MouseEvent) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      if ((e.target as HTMLElement).closest(".contest-item") === null) {
        setIsExpanded(!isExpanded);
      }
    }
  };
  const handleContestTap = (e: React.MouseEvent, contestId: string) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      e.preventDefault();
      if (isExpanded) {
        window.location.href = `/contests/${contestId}`;
      } else {
        setIsExpanded(true);
      }
    }
  };
  return <div className="relative w-full h-full overflow-hidden transition-all duration-300" onClick={handleTickerTap}>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes dataStream {
          0%,
          100% {
            opacity: 0;
            transform: translateY(-100%);
          }
          50% {
            opacity: 0.3;
            transform: translateY(100%);
          }
        }
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @keyframes glitch {
          0% {
            clip-path: inset(40% 0 61% 0);
          }
          20% {
            clip-path: inset(92% 0 1% 0);
          }
          40% {
            clip-path: inset(43% 0 1% 0);
          }
          60% {
            clip-path: inset(25% 0 58% 0);
          }
          80% {
            clip-path: inset(54% 0 7% 0);
          }
          100% {
            clip-path: inset(58% 0 43% 0);
          }
        }
        .matrix-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
            0deg,
            transparent 0%,
            rgba(32, 226, 215, 0.1) 50%,
            transparent 100%
          );
          background-size: 100% 3px;
          animation: scanline 2s linear infinite;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {Array.from({
        length: 10
      }).map((_, i) => <div key={i} className="absolute w-[1px] h-20 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" style={{
        left: `${i * 10}%`,
        animation: `dataStream ${2 + i * 0.5}s linear infinite`,
        animationDelay: `${i * 0.2}s`
      }} />)}
      </div>

      <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(32, 226, 215, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(32, 226, 215, 0.05) 1px, transparent 1px),
            linear-gradient(0deg, rgba(32, 226, 215, 0.05) 1px, transparent 1px)
          `,
      backgroundSize: "24px 24px, 12px 12px, 12px 12px"
    }} />

      <div ref={tickerRef} className="flex whitespace-nowrap h-full items-center">
        {contests.map(contest => {
        const config = statusConfig[contest.status];
        const colors = statusColors[contest.status];
        return <a key={contest.id} href={`/contests/${contest.id}`} onClick={e => handleContestTap(e, contest.id)} className="contest-item inline-flex items-center px-4 py-2 space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{
            backgroundColor: config.baseColor,
            color: colors.from,
            boxShadow: `0 0 10px ${config.glowColor}`,
            border: `1px solid ${config.borderColor}`
          }}>
                {contest.status}
              </span>
              <span className="text-gray-300">{contest.name}</span>
              <span className="text-gray-400 flex items-center">
                <SolanaSymbol />
                {contest.amount}
              </span>
              <span className="text-gray-500">
                ({contest.filled}/{contest.total})
              </span>
              <span className="text-gray-600">{contest.timeAgo}</span>
            </a>;
      })}
      </div>
    </div>;
};
export default ContestTicker;