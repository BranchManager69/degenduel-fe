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
        handleServerDown as EventListener,
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
    <div className="w-full bg-gradient-to-r from-red-950/60 via-red-900/50 to-red-950/60 border-b border-red-500/40">
      <div className="relative overflow-hidden w-full backdrop-blur-lg px-0">
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shine-slow"></div>

        {/* Pulsing border effect */}
        <div className="absolute inset-0 border-b-2 border-red-500/0 animate-pulse-border"></div>

        <div className="relative flex items-center justify-between py-2 px-3 sm:py-3 sm:px-4 md:px-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FaServer className="text-red-400 animate-pulse text-sm sm:text-base" />
            <div>
              <h3 className="text-red-400 font-semibold text-xs sm:text-sm md:text-base">
                Server Unavailable
              </h3>
              <p className="text-xs md:text-sm text-red-300/80 line-clamp-1 sm:line-clamp-none">
                <span className="hidden sm:inline">
                  Branch Manager is making significant changes to the system.
                </span>
                <span className="sm:hidden">
                  Branch Manager is making significant changes to the system.
                </span>
                {downDuration > 0 && (
                  <span className="ml-1 sm:ml-2">
                    Down for {Math.floor(downDuration / 60)}m{" "}
                    {downDuration % 60}s
                  </span>
                )}
              </p>
            </div>
          </div>
          <FaExclamationTriangle className="text-red-400 animate-pulse text-sm sm:text-base" />
        </div>
      </div>
    </div>
  );
};
