// src/components/layout/Footer.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

export const Footer: React.FC = () => {
  const { maintenanceMode } = useStore();
  const [serverStatus, setServerStatus] = useState<
    "online" | "maintenance" | "offline"
  >(maintenanceMode ? "maintenance" : "online");

  useEffect(() => {
    // Update status when maintenance mode changes
    if (maintenanceMode) {
      setServerStatus("maintenance");
    }
  }, [maintenanceMode]);

  useEffect(() => {
    // Only check server status if not in maintenance mode
    if (maintenanceMode) return;

    const checkServerStatus = async () => {
      try {
        const response = await ddApi.fetch("/status");
        if (response.status === 503) {
          setServerStatus("maintenance");
        } else {
          setServerStatus("online");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("503")) {
          setServerStatus("maintenance");
        } else {
          setServerStatus("offline");
        }
        // Log all errors as this endpoint shouldn't be failing
        console.error("Failed to check server status:", err);
      }
    };

    // Initial check
    checkServerStatus();

    // Check every 5 seconds when offline, every 30 seconds when online
    const interval = setInterval(
      () => {
        checkServerStatus();
      },
      serverStatus === "offline" ? 5000 : 30000
    );

    return () => clearInterval(interval);
  }, [serverStatus, maintenanceMode]);

  return (
    <footer className="backdrop-blur-sm border-t border-dark-300/30 relative mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between min-w-0">
          {/* Left side - Links with horizontal scroll if needed */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar min-w-0">
            <div className="flex items-center space-x-4 shrink-0">
              <Link
                to="/platform"
                className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
              >
                Platform
              </Link>
              <Link
                to="/referrals"
                className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
              >
                Refer
              </Link>
              <Link
                to="/support"
                className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
              >
                Support
              </Link>
            </div>
            <div className="flex items-center space-x-4 shrink-0">
              <a
                href="https://x.com/DegenDuelMe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-400"
              >
                <span className="sr-only">X</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://discord.gg/DegenDuelMe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-400"
              >
                <span className="sr-only">Discord</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right side - Status Indicator */}
          <div className="flex items-center gap-2 pl-4 shrink-0">
            <div
              className={`
                flex items-center gap-2 px-3 py-1 rounded-full 
                transition-all duration-300
                ${
                  serverStatus === "online"
                    ? "bg-green-500/10"
                    : serverStatus === "maintenance"
                    ? "bg-yellow-500/10"
                    : "bg-red-500/10"
                }
              `}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300
                  ${
                    serverStatus === "online"
                      ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      : serverStatus === "maintenance"
                      ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                      : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  }
                  ${serverStatus === "online" ? "animate-pulse" : ""}
                `}
              />
              <span
                className={`
                text-xs font-cyber tracking-wide
                ${
                  serverStatus === "online"
                    ? "text-green-400"
                    : serverStatus === "maintenance"
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              `}
              >
                {serverStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
