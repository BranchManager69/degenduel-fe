// src/components/layout/Footer.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useScrollFooter } from "../../hooks/useScrollFooter";
import {
    ServerStatus,
    useServerStatusWebSocket,
} from "../../hooks/useServerStatusWebSocket";

export const Footer: React.FC = () => {
  // Use our new WebSocket hook for server status
  const { status, message, isWebSocketConnected } = useServerStatusWebSocket();
  // Use our new scroll hook for footer
  const { isCompact } = useScrollFooter(50);

  // Get color scheme and animation based on status
  const getStatusStyles = (
    status: ServerStatus,
    isWebSocketConnected: boolean
  ) => {
    // Base styles depending on status
    const baseStyles = {
      online: {
        bgColor: "bg-green-500/10",
        dotColor: "bg-green-500",
        shadow: "shadow-[0_0_10px_rgba(34,197,94,0.5)]",
        textColor: "text-green-400",
        animate: "animate-pulse",
      },
      maintenance: {
        bgColor: "bg-yellow-500/10",
        dotColor: "bg-yellow-500",
        shadow: "shadow-[0_0_10px_rgba(234,179,8,0.5)]",
        textColor: "text-yellow-400",
        animate: "",
      },
      error: {
        bgColor: "bg-orange-500/10",
        dotColor: "bg-orange-500",
        shadow: "shadow-[0_0_10px_rgba(249,115,22,0.5)]",
        textColor: "text-orange-400",
        animate: "",
      },
      offline: {
        bgColor: "bg-red-500/10",
        dotColor: "bg-red-500",
        shadow: "shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        textColor: "text-red-400",
        animate: "",
      },
    };

    // Get base styles for current status
    const currentStyles = baseStyles[status] || baseStyles.offline;

    // Add WebSocket-specific enhancements when connected
    if (isWebSocketConnected) {
      return {
        ...currentStyles,
        // Enhanced styles for WebSocket connection
        wsBorder: "border border-brand-500/30",
        wsEffect: "animate-shine-websocket",
        wsIndicator: true,
      };
    }

    // Regular style without WebSocket enhancements
    return {
      ...currentStyles,
      wsBorder: "",
      wsEffect: "",
      wsIndicator: false,
    };
  };

  const styles = getStatusStyles(status, isWebSocketConnected);

  return (
    <footer 
      className={`backdrop-blur-sm border-t border-dark-300/30 sticky bottom-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCompact ? "py-1.5" : "py-3"}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div 
          className={`flex items-center justify-between min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCompact ? "h-10" : "h-12"}`}
        >
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
          <div className="flex items-center gap-2 pl-4 shrink-0 group">
            <div
              className={`
                flex items-center gap-2 px-3 py-1 rounded-full 
                transition-all duration-300 ${styles.bgColor} ${styles.wsBorder}
                ${styles.wsEffect} relative overflow-hidden
              `}
              title={message} // Show the detailed message on hover
            >
              {/* WebSocket-specific shine effect */}
              {styles.wsIndicator && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-shine" />
              )}

              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 z-10
                  ${styles.dotColor} ${styles.shadow} ${styles.animate}
                `}
              />
              <span
                className={`
                text-xs font-cyber tracking-wide ${styles.textColor} z-10
                ${styles.wsIndicator ? "text-shadow-sm" : ""}
              `}
              >
                {status.toUpperCase()}
                {styles.wsIndicator && (
                  <span className="ml-0.5 text-cyan-400 text-opacity-70 text-[8px] align-top">
                    ⚡
                  </span>
                )}
              </span>
            </div>

            {/* Enhanced tooltip showing detailed status message and WebSocket info on hover */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block pointer-events-none z-50">
              <div
                className={`${styles.bgColor} p-3 rounded shadow-lg text-xs ${styles.textColor} whitespace-nowrap ${styles.wsBorder} min-w-[280px]`}
              >
                <div className="font-semibold mb-1">Server Status: {status.toUpperCase()}</div>
                <div className="mb-2">{message}</div>
                
                <div className="border-t border-gray-700 my-2 pt-2">
                  <div className="font-semibold mb-1">WebSocket Connections:</div>
                  <div className={`flex items-center ${isWebSocketConnected ? "text-green-400" : "text-red-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${isWebSocketConnected ? "bg-green-500" : "bg-red-500"}`} />
                    Server Status WS: {isWebSocketConnected ? "Connected" : "Disconnected"}
                  </div>
                  
                  {/* Add connection status for TokenData WebSocket */}
                  <div className="text-gray-400 mt-1 text-[10px]">
                    Endpoint: /api/v69/ws/monitor
                  </div>
                  
                  <div className="mt-2 text-gray-400 text-[10px]">
                    WebSocket migration to v69 is in progress.
                    Some services may be temporarily unavailable.
                  </div>
                </div>
                
                <div className="text-right mt-2 text-[8px] text-gray-500">
                  Last checked: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
