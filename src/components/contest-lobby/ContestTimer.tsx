import React, { useEffect, useState } from 'react';

interface ContestTimerProps {
  endTime: Date;
  showDate?: boolean;
}

export const ContestTimer: React.FC<ContestTimerProps> = ({ endTime, showDate = false }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsEnded(true);
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      setIsEnded(false);
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    // Calculate initially
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Format date for ended contests
  const formatEndDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return endTime.toLocaleDateString(undefined, options);
  };

  // If contest has ended and we want to show the date
  if (isEnded && showDate) {
    return (
      <div className="flex items-center justify-center bg-dark-200/50 rounded-lg p-4 border border-dark-300">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-300">{formatEndDate()}</div>
          <div className="text-sm text-gray-400">Contest Ended</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Hours */}
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-dark-300"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={36 * 2 * Math.PI}
            strokeDashoffset={36 * 2 * Math.PI * (1 - timeLeft.hours / 24)}
            className="text-brand-500 transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-100">{timeLeft.hours}</span>
            <span className="block text-xs text-gray-400">HRS</span>
          </div>
        </div>
      </div>

      {/* Minutes */}
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-dark-300"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={36 * 2 * Math.PI}
            strokeDashoffset={36 * 2 * Math.PI * (1 - timeLeft.minutes / 60)}
            className="text-brand-400 transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-100">{timeLeft.minutes}</span>
            <span className="block text-xs text-gray-400">MIN</span>
          </div>
        </div>
      </div>

      {/* Seconds */}
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-dark-300"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={36 * 2 * Math.PI}
            strokeDashoffset={36 * 2 * Math.PI * (1 - timeLeft.seconds / 60)}
            className="text-brand-300 transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-100">{timeLeft.seconds}</span>
            <span className="block text-xs text-gray-400">SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
};