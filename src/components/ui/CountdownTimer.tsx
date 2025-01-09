import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
  showSeconds?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onComplete,
  showSeconds = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      // If time has passed, return early with "Ended"
      if (diff <= 0) {
        onComplete?.();
        return "Ended";
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }

      let timeString = "";
      if (hours > 0) {
        timeString += `${hours}h `;
      }
      timeString += `${minutes}m`;
      if (showSeconds) {
        timeString += ` ${seconds}s`;
      }
      return timeString;
    };

    // Initial calculation
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Only set up interval if contest hasn't ended
    let timer: NodeJS.Timeout | null = null;
    if (initialTime !== "Ended") {
      timer = setInterval(
        () => {
          const newTime = calculateTimeLeft();
          setTimeLeft(newTime);
          if (newTime === "Ended") {
            timer && clearInterval(timer);
          }
        },
        showSeconds ? 1000 : 60000
      ); // Update every second if showing seconds, otherwise every minute
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [targetDate, onComplete, showSeconds]);

  return <span>{timeLeft}</span>;
};
