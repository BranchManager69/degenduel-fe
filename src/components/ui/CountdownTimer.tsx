import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string | Date;
  onComplete?: () => void;
  showSeconds?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onComplete,
  showSeconds = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calculate initial time
    setTimeLeft(calculateTimeLeft());

    // Set up interval
    let timer: ReturnType<typeof setTimeout> | null = null;
    timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setTimeLeft(timeLeft);

      if (Object.values(timeLeft).every((v) => v === 0)) {
        if (timer) clearInterval(timer);
      }
    }, 1000);

    // Cleanup
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [targetDate, onComplete]);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  if (timeLeft.days > 0) {
    return (
      <span>
        {timeLeft.days}d {timeLeft.hours}h{" "}
        {formatNumber(timeLeft.minutes)}m
      </span>
    );
  }

  if (timeLeft.hours > 0) {
    return (
      <span>
        {timeLeft.hours}h {formatNumber(timeLeft.minutes)}m
        {showSeconds && ` ${formatNumber(timeLeft.seconds)}s`}
      </span>
    );
  }

  if (timeLeft.minutes > 0) {
    return (
      <span>
        {formatNumber(timeLeft.minutes)}m
        {showSeconds && ` ${formatNumber(timeLeft.seconds)}s`}
      </span>
    );
  }

  return <span>{formatNumber(timeLeft.seconds)}s</span>;
};
