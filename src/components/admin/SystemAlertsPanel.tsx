import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

interface SystemAlertsPanelProps {
  alerts: SystemAlert[];
  onClearAll: () => void;
  onDismiss: (id: string) => void;
}

const SystemAlertsPanel: React.FC<SystemAlertsPanelProps> = ({
  alerts,
  onClearAll,
  onDismiss
}) => {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20 relative overflow-hidden">
        {/* Animated scanner line */}
        <div className="absolute inset-0 w-full h-px bg-brand-400/30 animate-scan-fast"></div>
        
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-xl font-bold text-gray-100 font-display">
            System Alerts
            <span className="ml-2 inline-block w-2 h-2 bg-red-500 animate-pulse"></span>
          </h2>
          <button 
            onClick={onClearAll}
            className="text-gray-400 hover:text-gray-300 relative group"
          >
            Clear All
            <span className="absolute -bottom-px left-0 right-0 h-px bg-gray-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </button>
        </div>
        
        <div className="space-y-4">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  p-4 rounded-lg border-2 relative overflow-hidden group
                  ${alert.type === "error" ? "bg-red-500/10 border-red-500/30" : ""}
                  ${alert.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30" : ""}
                  ${alert.type === "info" ? "bg-blue-500/10 border-blue-500/30" : ""}
                  hover:bg-dark-200/60 transition-colors duration-300
                `}
              >
                {/* Animated scanner effect */}
                <div className={`
                  absolute inset-0 w-full h-16 bg-gradient-to-r 
                  ${alert.type === "error" ? "from-transparent via-red-500/5 to-transparent" : ""}
                  ${alert.type === "warning" ? "from-transparent via-yellow-500/5 to-transparent" : ""}
                  ${alert.type === "info" ? "from-transparent via-blue-500/5 to-transparent" : ""}
                  -translate-x-full group-hover:translate-x-full duration-1500 ease-in-out transition-transform
                `}></div>
                
                {/* Corner markers */}
                <div className={`
                  absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 
                  ${alert.type === "error" ? "border-red-500/70" : ""}
                  ${alert.type === "warning" ? "border-yellow-500/70" : ""}
                  ${alert.type === "info" ? "border-blue-500/70" : ""}
                `}></div>
                <div className={`
                  absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 
                  ${alert.type === "error" ? "border-red-500/70" : ""}
                  ${alert.type === "warning" ? "border-yellow-500/70" : ""}
                  ${alert.type === "info" ? "border-blue-500/70" : ""}
                `}></div>
                
                <div className="flex items-start gap-3">
                  <div className={`
                    mt-1 text-xl
                    ${alert.type === "error" ? "text-red-400" : ""}
                    ${alert.type === "warning" ? "text-yellow-400" : ""}
                    ${alert.type === "info" ? "text-blue-400" : ""}
                  `}>
                    {alert.type === "error" ? "⚠" : alert.type === "warning" ? "⚡" : "ℹ"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`
                        font-medium font-mono
                        ${alert.type === "error" ? "text-red-400" : ""}
                        ${alert.type === "warning" ? "text-yellow-400" : ""}
                        ${alert.type === "info" ? "text-blue-400" : ""}
                      `}>
                        {alert.title}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-1 text-sm">{alert.message}</p>
                    {alert.details && (
                      <div className="mt-2 text-sm font-mono bg-dark-300/50 rounded p-2 max-h-32 overflow-auto">
                        <pre className="whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-500 hover:text-gray-400 text-xl"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemAlertsPanel;