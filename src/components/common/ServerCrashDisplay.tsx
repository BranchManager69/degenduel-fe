import React, { useEffect, useState } from 'react';

interface ServerCrashDisplayProps {
  error: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ServerCrashDisplay: React.FC<ServerCrashDisplayProps> = ({ 
  error, 
  onRetry,
  isRetrying = false
}) => {
  const [serverCrashPercent, setServerCrashPercent] = useState<number | null>(null);

  // Trigger server crash animation when error occurs
  useEffect(() => {
    if (error && serverCrashPercent === null) {
      setServerCrashPercent(69);
      
      // Start the animation after showing 69% for a moment
      const timeout = setTimeout(() => {
        let speed = 300; // Start slow
        let intervalId: NodeJS.Timeout;
        
        const animate = () => {
          setServerCrashPercent(prev => {
            if (prev === null || prev <= -100) {
              clearInterval(intervalId);
              return -100;
            }
            // Accelerating drops - bigger drops as we go lower
            const baseDrop = prev > 50 ? 2 : prev > 20 ? 5 : prev > -50 ? 10 : 15;
            const drop = baseDrop + Math.random() * 5;
            
            // Speed up the interval as we drop
            if (prev < 50 && speed > 100) speed = 100;
            if (prev < 20 && speed > 50) speed = 50;
            if (prev < -50 && speed > 30) speed = 30;
            
            clearInterval(intervalId);
            intervalId = setInterval(animate, speed);
            
            return Math.max(-100, prev - drop);
          });
        };
        
        intervalId = setInterval(animate, speed);
        
        return () => clearInterval(intervalId);
      }, 1000); // Show 69% for a full second first
      
      return () => clearTimeout(timeout);
    }
  }, [error]);

  if (!error) return null;

  const crashPercent = serverCrashPercent ?? -100;
  const isPositive = crashPercent > 0;

  const handleRetry = () => {
    onRetry();
    // Restart the animation
    setServerCrashPercent(69);
    setTimeout(() => {
      let speed = 300;
      let intervalId: NodeJS.Timeout;
      
      const animate = () => {
        setServerCrashPercent(prev => {
          if (prev === null || prev <= -100) {
            clearInterval(intervalId);
            return -100;
          }
          const baseDrop = prev > 50 ? 2 : prev > 20 ? 5 : prev > -50 ? 10 : 15;
          const drop = baseDrop + Math.random() * 5;
          
          if (prev < 50 && speed > 100) speed = 100;
          if (prev < 20 && speed > 50) speed = 50;
          if (prev < -50 && speed > 30) speed = 30;
          
          clearInterval(intervalId);
          intervalId = setInterval(animate, speed);
          
          return Math.max(-100, prev - drop);
        });
      };
      
      intervalId = setInterval(animate, speed);
    }, 1000);
  };

  return (
    <div className="flex justify-center">
      <div className="bg-gradient-to-br from-dark-400/10 via-dark-500/20 to-dark-400/10 rounded-md overflow-hidden">
        <div className="px-8 pr-2 py-2 relative flex items-center gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-600/10 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-4 relative z-10">
            <span className="text-2xl font-semibold text-gray-300 tracking-tight uppercase">SERVER</span>
            <div className={`text-3xl font-mono font-bold transition-all duration-200 ${
              isPositive ? 'text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'
            }`}>
              {isPositive ? '+' : ''}{Math.round(crashPercent)}%
            </div>
          </div>
          
          <div className="h-12 w-px bg-dark-600/30 relative z-10"></div>
          
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-10 h-10 rounded-md bg-dark-500/20 hover:bg-dark-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500/30 flex items-center justify-center group relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Retry connection"
          >
            <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-200 transition-all duration-500 ${!isRetrying ? 'group-hover:rotate-180' : 'animate-spin'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {crashPercent === -100 && (
          <div className="bg-gradient-to-r from-red-900/10 via-red-800/20 to-red-900/10 px-4 py-2">
            <p className="text-red-400 text-sm font-black tracking-wider text-center uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              WebSocket Connection Rugged
            </p>
          </div>
        )}
      </div>
    </div>
  );
};