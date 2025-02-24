import React, { useEffect, useState } from "react";
import { FaExclamationTriangle, FaServer } from "react-icons/fa";

interface ServerDownState {
  isDown: boolean;
  since: number | null;
  checks: number;
}

export const ServerDownBanner: React.FC = () => {
  const [serverState, setServerState] = useState<ServerDownState>({
    isDown: false,
    since: null,
    checks: 0,
  });

  useEffect(() => {
    const handleServerDown = (event: CustomEvent) => {
      // Only show the banner for complete server outages (502 errors)
      if (event.detail.status === 502) {
        setServerState({
          isDown: true,
          since: event.detail.since,
          checks: event.detail.checks,
        });
      }
    };

    const handleServerUp = () => {
      setServerState({
        isDown: false,
        since: null,
        checks: 0,
      });
    };

    // Add event listeners
    window.addEventListener("server-down", handleServerDown as EventListener);
    window.addEventListener("server-up", handleServerUp);

    return () => {
      window.removeEventListener(
        "server-down",
        handleServerDown as EventListener
      );
      window.removeEventListener("server-up", handleServerUp);
    };
  }, []);

  // Don't show the banner if the server isn't completely down
  if (!serverState.isDown) return null;

  const downDuration = serverState.since
    ? Math.floor((Date.now() - serverState.since) / 1000)
    : 0;

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-b-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaServer className="text-red-400 animate-pulse" />
              <div>
                <h3 className="text-red-400 font-semibold">
                  Server Unavailable
                </h3>
                <p className="text-sm text-red-300/80">
                  Our servers are currently experiencing issues. We are working
                  to restore service.
                  {downDuration > 0 && (
                    <span className="ml-2">
                      Down for {Math.floor(downDuration / 60)}m{" "}
                      {downDuration % 60}s
                    </span>
                  )}
                </p>
              </div>
            </div>
            <FaExclamationTriangle className="text-red-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
