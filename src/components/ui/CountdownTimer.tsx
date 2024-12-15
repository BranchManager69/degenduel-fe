import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate,
  onComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      // If time has passed, return early with "Ended"
      if (diff <= 0) {
        onComplete?.();
        return 'Ended';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }

      return `${hours}h ${minutes}m`;
    };

    // Initial calculation
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Only set up interval if contest hasn't ended
    let timer: NodeJS.Timeout | null = null;
    if (initialTime !== 'Ended') {
      timer = setInterval(() => {
        const newTime = calculateTimeLeft();
        setTimeLeft(newTime);
        if (newTime === 'Ended') {
          timer && clearInterval(timer);
        }
      }, 60000); // 60000ms = 1 minute
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [targetDate, onComplete]);

  return <span>{timeLeft}</span>;
};
