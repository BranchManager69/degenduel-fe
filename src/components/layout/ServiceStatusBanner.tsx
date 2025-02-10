// src/components/layout/ServiceStatusBanner.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ddApi } from "../../services/dd-api";

interface ServiceStatus {
  isDegraded: boolean;
  message: string;
  lastChecked: number;
}

export const ServiceStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    isDegraded: false,
    message: "",
    lastChecked: Date.now(),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        // Use the public status endpoint
        const response = await ddApi.fetch("/api/status");

        // If we get a 503, the system is in maintenance mode
        if (response.status === 503) {
          const data = await response.json();
          setStatus({
            isDegraded: true,
            message:
              data.message ||
              "DegenDuel is currently under scheduled maintenance",
            lastChecked: Date.now(),
          });
          setIsVisible(true);
          return;
        }

        // If we get a 200, check if there are any degraded services
        const data = await response.json();
        if (data.degraded_services?.length > 0) {
          setStatus({
            isDegraded: true,
            message: `Some services are having issues: ${data.degraded_services.join(
              ", "
            )}`,
            lastChecked: Date.now(),
          });
          setIsVisible(true);
        } else {
          setStatus({
            isDegraded: false,
            message: "",
            lastChecked: Date.now(),
          });
          setIsVisible(false);
        }
      } catch (error) {
        console.error("Failed to check service status:", error);
        // Don't show banner on error - better UX to not show false positives
        setIsVisible(false);
      }
    };

    // Initial check
    checkServiceStatus();

    // Check every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-50"
        >
          <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-amber-200/90">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    {status.message ||
                      "DegenDuel is experiencing high traffic. Please be patient."}
                  </span>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-amber-200/70 hover:text-amber-200/90 transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
