import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceModeCardProps {
  isEnabled: boolean;
  isLoading: boolean;
  onToggle: (duration?: number) => Promise<void>;
  error?: string | null;
}

const MaintenanceModeCard: React.FC<MaintenanceModeCardProps> = ({
  isEnabled,
  isLoading,
  onToggle,
  error = null
}) => {
  const [duration, setDuration] = useState<number>(15); // default 15 minutes

  const handleToggle = () => {
    if (!isLoading) {
      onToggle(isEnabled ? undefined : duration);
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/20 relative overflow-hidden">
      {/* Background effects for cyberpunk feel */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Horizontal scan line */}
        <div className="absolute inset-0 h-px w-full bg-cyber-500/30 animate-scan-fast"></div>
        {/* Vertical scan line */}
        <div className="absolute inset-0 w-px h-full bg-cyber-500/20 animate-cyber-scan delay-1000"></div>
        {/* Background pulse */}
        <div className={`absolute inset-0 ${isEnabled ? 'bg-red-900/5' : 'bg-green-900/5'} animate-pulse-slow`}></div>
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-cyber tracking-wider text-2xl bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent animate-gradientX">
              MAINTENANCE MODE
            </h2>
            <p className="text-sm text-gray-400 font-mono mt-1">
              SYSTEM_MAINTENANCE_CONTROL_INTERFACE
            </p>
          </div>
          <div className={`h-3 w-3 rounded-full ${isEnabled ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30' : 'bg-green-500 shadow-lg shadow-green-500/30'}`} />
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duration Setting when system is live */}
        <AnimatePresence>
          {!isEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <label className="text-sm text-gray-400 block mb-2 font-mono">
                ESTIMATED DURATION (MIN)
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-dark-300/80 border border-brand-500/20 rounded px-3 py-2 text-gray-300 font-mono text-center"
              />
              <div className="text-xs text-gray-500 mt-1 font-mono">
                ({Math.floor(duration / 60)}h {duration % 60}m)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="w-full group relative"
        >
          <motion.div
            className={`
              relative overflow-hidden rounded-lg border-2 
              ${
                isEnabled
                  ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                  : "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
              }
              ${isLoading ? "opacity-75" : ""}
              transition-all duration-300
            `}
          >
            {/* Key Lock Effect */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div
                className={`
                w-6 h-6 rounded-full border-2 
                ${isEnabled ? "border-red-500" : "border-green-500"}
                transition-colors duration-300
              `}
              >
                <div
                  className={`
                  w-1 h-3 
                  ${isEnabled ? "bg-red-500" : "bg-green-500"}
                  transition-colors duration-300
                  absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
                  group-hover:rotate-90 transition-transform
                `}
                />
              </div>
            </div>

            {/* Button Content */}
            <div className="px-6 py-4 pl-12">
              <div className="font-cyber tracking-wider text-lg">
                {isLoading ? (
                  <span className="text-brand-400 animate-pulse">
                    {isEnabled ? "DEACTIVATING..." : "INITIATING..."}
                  </span>
                ) : isEnabled ? (
                  <span className="text-red-400 group-hover:text-red-300">
                    DEACTIVATE MAINTENANCE
                  </span>
                ) : (
                  <span className="text-green-400 group-hover:text-green-300">
                    INITIATE MAINTENANCE
                  </span>
                )}
              </div>
            </div>

            {/* Scan Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.div>

          {/* Power Indicator */}
          <div className="absolute -right-3 top-1/2 -translate-y-1/2">
            <div
              className={`
              w-6 h-6 rounded-full 
              ${
                isEnabled
                  ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-green-500 shadow-lg shadow-green-500/50"
              }
              transition-colors duration-300
            `}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default MaintenanceModeCard;