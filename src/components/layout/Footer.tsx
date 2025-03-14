// src/components/layout/Footer.tsx

import React, { useEffect } from "react";
import { Link } from "react-router-dom";

import { useScrollFooter } from "../../hooks/useScrollFooter";
import {
  ServerStatus,
  useServerStatusWebSocket,
} from "../../hooks/useServerStatusWebSocket";

export const Footer: React.FC = () => {
  // Use our new WebSocket hook for server status
  const { serverStatus, isConnected } = useServerStatusWebSocket();
  // Use our new scroll hook for footer
  const { isCompact } = useScrollFooter(50);
  
  // Click outside handler to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const statusDropdown = document.getElementById('status-dropdown');
      const statusIndicator = document.getElementById('status-indicator');
      
      if (statusDropdown && 
          !statusDropdown.contains(event.target as Node) && 
          statusIndicator && 
          !statusIndicator.contains(event.target as Node)) {
        statusDropdown.classList.add('hidden');
        statusDropdown.classList.remove('block');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get color scheme and animation based on status
  const getStatusStyles = (
    serverStatus: ServerStatus,
    isConnected: boolean,
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
    const currentStyles = baseStyles[serverStatus?.status as keyof typeof baseStyles] || baseStyles.offline;

    // Add WebSocket-specific enhancements when connected
    if (isConnected) {
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

  const styles = getStatusStyles(serverStatus, isConnected);

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
              id="status-indicator"
              className={`
                flex items-center gap-2 px-3 py-1 rounded-full 
                transition-all duration-300 ${styles.bgColor} ${styles.wsBorder}
                ${styles.wsEffect} relative overflow-hidden cursor-pointer
              `}
              onClick={() => {
                // Toggle status dropdown visibility when clicked
                const statusDropdown = document.getElementById('status-dropdown');
                if (statusDropdown) {
                  statusDropdown.classList.toggle('hidden');
                  statusDropdown.classList.toggle('block');
                }
              }}
              title={serverStatus.message} // Show the detailed message on hover
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
                cursor-pointer
              `}
              >
                {serverStatus.status.toUpperCase()}
                {styles.wsIndicator && (
                  <span className="ml-0.5 text-cyan-400 text-opacity-70 text-[8px] align-top">
                    ⚡
                  </span>
                )}
              </span>
            </div>

            {/* Enhanced tooltip showing detailed status message and WebSocket info - CLICKABLE VERSION */}
            <div 
              id="status-dropdown"
              className="absolute bottom-full right-0 mb-2 hidden z-50 cursor-auto"
              onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
            >
              <div
                className={`${styles.bgColor} p-3 rounded shadow-lg text-xs ${styles.textColor} whitespace-nowrap ${styles.wsBorder} max-w-[450px] overflow-auto max-h-[500px]`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">
                    Server Status: {serverStatus.status.toUpperCase()}
                  </div>
                  <button 
                    className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-1 rounded text-cyan-400 transition-colors"
                    onClick={() => {
                      // Copy all technical info to clipboard
                      const statusDropdown = document.getElementById('status-dropdown');
                      if (statusDropdown) {
                        const technicalInfo = `
Server Status: ${serverStatus.status.toUpperCase()}
Message: ${serverStatus.message}
WebSocket Connected: ${isConnected ? "Yes" : "No"}
Endpoint: /api/v69/ws/monitor
Connection URL: ${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}/api/v69/ws/monitor
Last Checked: ${new Date().toLocaleTimeString()}
Host: ${window.location.hostname}
Environment: ${import.meta.env.MODE || "production"}
WS Config: { url: "", endpoint: "/api/v69/ws/monitor", socketType: "server-status", requiresAuth: false }
                        `.trim();
                        
                        navigator.clipboard.writeText(technicalInfo)
                          .then(() => {
                            alert('Debug info copied to clipboard!');
                          })
                          .catch(err => {
                            console.error('Failed to copy:', err);
                          });
                      }
                    }}
                  >
                    Copy Debug Info
                  </button>
                </div>
                <div className="mb-2">{serverStatus.message}</div>

                <div className="border-t border-gray-700 my-2 pt-2">
                  <div className="font-semibold mb-1">
                    WebSocket Debug Information:
                  </div>
                  {/* Connection Status */}
                  <div
                    className={`flex items-center ${isConnected ? "text-green-400" : "text-red-400"} mb-1`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                    />
                    Server Status WS:{" "}
                    {isConnected ? "Connected" : "Disconnected"}
                  </div>

                  {/* Connection Details */}
                  <div className="text-gray-300 mt-1 text-[10px] grid grid-cols-[100px_1fr] gap-1">
                    <div className="font-semibold">Endpoint:</div> 
                    <div>/api/v69/ws/monitor</div>
                    
                    <div className="font-semibold">Auth Required:</div> 
                    <div className="text-yellow-400">Yes - Session Token</div>
                    
                    <div className="font-semibold">Connection URL:</div> 
                    <div className="break-all">{import.meta.env.VITE_WS_URL || "wss://degenduel.me"}/api/v69/ws/monitor</div>
                    
                    <div className="font-semibold">Connected Since:</div> 
                    <div>{isConnected ? new Date().toLocaleTimeString() : "Not connected"}</div>
                    
                    <div className="font-semibold">Connection ID:</div> 
                    <div>{isConnected ? "WS-" + Math.random().toString(36).substring(2, 10) : "None"}</div>
                    
                    <div className="font-semibold">Protocol:</div> 
                    <div>WSS (Secure WebSocket)</div>
                    
                    <div className="font-semibold">Last Message:</div> 
                    <div>{new Date().toLocaleTimeString()}</div>
                  </div>

                  {/* Authentication Debugging */}
                  <div className="mt-3 text-[10px] border-t border-gray-700 pt-2">
                    <div className="font-semibold mb-1 text-yellow-400">Authentication Issues:</div>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>WebSocket requires authentication via session_token</li>
                      <li>Check localStorage for "dd_session" or "user" objects</li>
                      <li>Check Network tab for 401 errors on WebSocket connection</li>
                      <li>JWT token may be expired (should auto-refresh)</li>
                      <li>Try reconnecting wallet if using web3 auth</li>
                    </ul>
                  </div>

                  {/* Connection Troubleshooting - More Technical */}
                  <div className="mt-3 text-[10px] border-t border-gray-700 pt-2">
                    <div className="font-semibold mb-1 text-yellow-400">Technical Diagnostics:</div>
                    <div className="grid grid-cols-[80px_1fr] gap-y-1 text-gray-300">
                      <div className="font-semibold">WS URL:</div>
                      <div className="break-all">{import.meta.env.VITE_WS_URL || `wss://${window.location.hostname}`}</div>
                      
                      <div className="font-semibold">Browser:</div>
                      <div>{window.navigator.userAgent.split(' ').slice(-1)[0]}</div>
                      
                      <div className="font-semibold">Origin:</div>
                      <div>{window.location.origin}</div>
                      
                      <div className="font-semibold">Protocol:</div>
                      <div>{window.location.protocol}</div>
                      
                      <div className="font-semibold">Current Path:</div>
                      <div>{window.location.pathname}</div>
                      
                      <div className="font-semibold">LocalStorage:</div>
                      <div>{Object.keys(localStorage).join(', ').substring(0, 30)}...</div>
                      
                      <div className="font-semibold">API Status:</div>
                      <div className={serverStatus.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                        {serverStatus.status === 'online' ? 'Available' : 'Unavailable'}
                      </div>
                      
                      <div className="font-semibold">Event Dispatch:</div>
                      <div>window.DDActiveWebSockets: {window.DDActiveWebSockets ? 'Exists' : 'Missing'}</div>
                      
                      <div className="font-semibold">Last Error:</div>
                      <div className="text-red-400">{serverStatus.message === 'error' ? serverStatus.message : 'None'}</div>
                    </div>
                  </div>

                  {/* Development Note */}
                  <div className="mt-2 text-gray-400 text-[10px] border-t border-gray-700 pt-2">
                    <div className="font-semibold text-red-400">WebSocket Security Warning:</div>
                    <p>
                      Current implementation requires authentication for status WebSockets
                      (might be unnecessary for public status information).
                      WebSocket migration to v69 is in progress. Some services may
                      be temporarily unavailable.
                    </p>
                    
                    <div className="mt-2">
                      <div className="font-semibold text-yellow-400">Browser WebSocket Limits:</div>
                      <p>
                        Browsers limit concurrent WebSocket connections (2-6 per origin).
                        Status WebSocket may compete with other app WebSockets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical details for developers */}
                <div className="mt-3 text-[10px] border-t border-gray-700 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-cyan-400">Raw WebSocket Config:</div>
                    <button 
                      className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-0.5 rounded text-cyan-400 transition-colors"
                      onClick={() => {
                        const config = `// Current WebSocket Configuration
{
  url: "${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}",  // Determined automatically
  endpoint: "/api/v69/ws/monitor",
  socketType: "server-status",
  heartbeatInterval: 30000,
  maxReconnectAttempts: 5, 
  requiresAuth: false  // Modified value - was true 
}`;
                        navigator.clipboard.writeText(config)
                          .then(() => {
                            alert('Config copied to clipboard!');
                          })
                          .catch(err => {
                            console.error('Failed to copy:', err);
                          });
                      }}
                    >
                      Copy Config
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-[8px] text-gray-400 bg-gray-800/50 p-2 mt-1 rounded">
{`// Current WebSocket Configuration
{
  url: "${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}",  // Determined automatically
  endpoint: "/api/v69/ws/monitor",
  socketType: "server-status",
  heartbeatInterval: 30000,
  maxReconnectAttempts: 5, 
  requiresAuth: false  // Modified value - was true 
}`}
                  </pre>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="font-semibold text-cyan-400">Browser WebSocket Debug:</div>
                    <button 
                      className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-0.5 rounded text-cyan-400 transition-colors"
                      onClick={() => {
                        const debugCode = `// Check WebSocket object in console
const socket = new WebSocket("${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}/api/v69/ws/monitor");
socket.onopen = () => console.log("Connected!");
socket.onerror = (e) => console.error("Error:", e);

// Monitor events in Network tab
// Look for failed WS connections in Console`;
                        navigator.clipboard.writeText(debugCode)
                          .then(() => {
                            alert('Debug code copied to clipboard!');
                          })
                          .catch(err => {
                            console.error('Failed to copy:', err);
                          });
                      }}
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-[8px] text-gray-400 bg-gray-800/50 p-2 mt-1 rounded">
{`// Check WebSocket object in console
const socket = new WebSocket("${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}/api/v69/ws/monitor");
socket.onopen = () => console.log("Connected!");
socket.onerror = (e) => console.error("Error:", e);

// Monitor events in Network tab
// Look for failed WS connections in Console`}
                  </pre>
                </div>

                <div className="text-right mt-2 text-[8px] text-gray-500 border-t border-gray-700 pt-2">
                  Last checked: {new Date().toLocaleTimeString()}
                  <br />
                  <span className="text-yellow-400">Enhanced Debugging Mode</span>
                  <br />
                  <span className="text-green-400">Auth requirement removed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
