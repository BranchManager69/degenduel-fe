import React from "react";
import { Link } from "react-router-dom";
import { Contest } from "../../types";
import { ShareContestButton } from "./ShareContestButton";

interface ContestDetailHeaderProps {
  contest: Contest;
  isParticipating: boolean;
  isWalletConnected: boolean;
  onJoinContest: () => void;
  onCountdownComplete: () => void;
  isContestCurrentlyUnderway: (contest: Contest) => boolean;
}

// Clean countdown component - no ugly borders
const CleanCountdown: React.FC<{ 
  targetDate: string | Date; 
  label: string;
  onComplete?: () => void;
}> = ({ targetDate, label, onComplete }) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0 });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);
      if (Object.values(time).every(v => v === 0)) {
        clearInterval(timer);
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-baseline gap-1 text-2xl font-bold text-gray-100">
        {timeLeft.days > 0 && (
          <>
            <span>{timeLeft.days}</span>
            <span className="text-sm text-gray-400 mr-1">d</span>
          </>
        )}
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-gray-500">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export const ContestDetailHeader: React.FC<ContestDetailHeaderProps> = ({
  contest,
  isParticipating,
  isWalletConnected,
  onJoinContest,
  onCountdownComplete,
}) => {
  // Determine contest status
  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);
  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;
  const contestStatus = hasEnded ? "ended" : hasStarted ? "live" : "upcoming";

  // Button configuration
  const getButtonConfig = () => {
    if (!isWalletConnected) {
      return {
        label: "Connect Wallet",
        style: "bg-brand-500 hover:bg-brand-600 text-white",
        disabled: false
      };
    }

    if (isParticipating) {
      if (contestStatus === "ended") {
        return {
          label: "View Results",
          style: "bg-dark-300 hover:bg-dark-200 text-gray-300",
          disabled: false
        };
      } else if (contestStatus === "live") {
        return {
          label: "View Portfolio",
          style: "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30",
          disabled: false
        };
      } else {
        return {
          label: "Modify Portfolio",
          style: "bg-dark-300 hover:bg-dark-200 text-brand-400",
          disabled: false
        };
      }
    }

    // Not participating
    if (contestStatus === "ended") {
      return {
        label: "Contest Ended",
        style: "bg-dark-400 text-gray-500 cursor-not-allowed",
        disabled: true
      };
    } else if (contestStatus === "live") {
      return {
        label: "Contest in Progress",
        style: "bg-dark-400 text-gray-500 cursor-not-allowed", 
        disabled: true
      };
    } else {
      return {
        label: "Enter Contest",
        style: "bg-brand-500 hover:bg-brand-600 text-white",
        disabled: false
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="mb-8">
      {/* Clean breadcrumbs */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <Link to="/contests" className="hover:text-gray-300 transition-colors">
          Contests
        </Link>
        <span className="mx-2 text-gray-600">→</span>
        <span className="text-gray-400">{contest.name}</span>
      </div>

      {/* Main header - clean and minimal */}
      <div className="space-y-6">
        {/* Title and status in one line */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-100">
                {contest.name}
              </h1>
              {contestStatus === "live" && (
                <span className="px-2 py-0.5 text-xs font-medium text-green-400 bg-green-400/10 rounded">
                  LIVE
                </span>
              )}
            </div>
            
            {/* Clean description */}
            {contest.description && (
              <p className="text-gray-400 max-w-2xl">
                {contest.description}
              </p>
            )}
          </div>

          {/* Desktop share button */}
          <div className="hidden md:block">
            <ShareContestButton 
              contest={contest}
              contestStatus={contestStatus}
              className="text-sm"
            />
          </div>
        </div>

        {/* Action area - timer and button in one clean row */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-dark-300">
          {/* Timer section */}
          <div className="flex-1">
            {contestStatus === "upcoming" && (
              <CleanCountdown 
                targetDate={contest.start_time} 
                label="Starts in"
                onComplete={onCountdownComplete}
              />
            )}
            {contestStatus === "live" && (
              <CleanCountdown 
                targetDate={contest.end_time} 
                label="Ends in"
                onComplete={onCountdownComplete}
              />
            )}
            {contestStatus === "ended" && (
              <div className="text-sm text-gray-500">
                Ended {new Date(contest.end_time).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Clean action button */}
          <button
            onClick={onJoinContest}
            disabled={buttonConfig.disabled}
            className={`px-6 py-3 font-medium rounded-lg transition-all ${buttonConfig.style}`}
          >
            {buttonConfig.label}
          </button>
        </div>

        {/* Mobile share button */}
        <div className="md:hidden">
          <ShareContestButton 
            contest={contest}
            contestStatus={contestStatus}
            className="w-full text-sm"
          />
        </div>
      </div>
    </div>
  );
};