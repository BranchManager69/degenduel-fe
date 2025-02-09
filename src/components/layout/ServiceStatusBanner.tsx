import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ddApi } from "../../services/dd-api";

interface ServiceStatus {
  isDegraded: boolean;
  affectedServices: string[];
  lastChecked: number;
}

interface ServiceInfo {
  name: string;
  status: "healthy" | "degraded" | "failed";
  lastCheck: number;
  failureRate: number;
}

export const ServiceStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    isDegraded: false,
    affectedServices: [],
    lastChecked: Date.now(),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const analytics = await ddApi.admin.getServiceAnalytics();
        const degradedServices = analytics.services.filter(
          (service: ServiceInfo) =>
            service.status === "degraded" || service.status === "failed"
        );

        // Only update if it's been at least 30 seconds since last change
        const shouldUpdate =
          Date.now() - status.lastChecked > 30000 &&
          ((degradedServices.length > 0 && !status.isDegraded) ||
            (degradedServices.length === 0 && status.isDegraded));

        if (shouldUpdate) {
          setStatus({
            isDegraded: degradedServices.length > 0,
            affectedServices: degradedServices.map((s: ServiceInfo) => s.name),
            lastChecked: Date.now(),
          });
          setIsVisible(degradedServices.length > 0);
        }
      } catch (error) {
        console.error("Failed to check service status:", error);
      }
    };

    // Initial check
    checkServiceStatus();

    // Check every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, [status.isDegraded, status.lastChecked]);

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
                    Some services are experiencing degraded performance
                    {status.affectedServices.length > 0 && (
                      <>
                        :{" "}
                        <span className="font-mono">
                          {status.affectedServices.join(", ")}
                        </span>
                      </>
                    )}
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
