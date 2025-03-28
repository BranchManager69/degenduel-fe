// src/components/layout/Footer.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useScrollFooter } from "../../hooks/useScrollFooter";
import { useServerStatusWebSocket } from "../../hooks/websocket/useServerStatusWebSocket";
import { useSystemSettingsWebSocket } from "../../hooks/websocket/useSystemSettingsWebSocket";

export const Footer: React.FC = () => {
  // Use our WebSocket hooks for server status and system settings
  const status = useServerStatusWebSocket();
  const systemSettings = useSystemSettingsWebSocket();
  
  // Track combined WebSocket connection status
  const [combinedWsStatus, setCombinedWsStatus] = useState({
    isConnected: false,
    connectedSockets: 0
  });
  
  // Use our scroll hook for footer
  const { isCompact } = useScrollFooter(50);
  
  // Update combined WebSocket status when individual statuses change
  useEffect(() => {
    const serverConnected = status.isWebSocketConnected;
    const systemConnected = systemSettings.loading === false && !systemSettings.error;
    
    const connectedCount = (serverConnected ? 1 : 0) + (systemConnected ? 1 : 0);
    
    setCombinedWsStatus({
      isConnected: connectedCount > 0,
      connectedSockets: connectedCount
    });
    
    console.log("WebSocket Connection Status:", {
      server: serverConnected ? "Connected" : "Disconnected",
      systemSettings: systemConnected ? "Connected" : "Disconnected",
      combined: connectedCount > 0 ? "At least one connected" : "All disconnected"
    });
  }, [status.isWebSocketConnected, systemSettings.loading, systemSettings.error]);

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
  // Get styles based directly on the status hook values
  const getStatusStyles = () => {
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
    const currentStyles = baseStyles[status.status as keyof typeof baseStyles] || baseStyles.offline;

    // Add WebSocket-specific enhancements when any WebSocket is connected
    if (combinedWsStatus.isConnected) {
      return {
        ...currentStyles,
        // Enhanced styles for WebSocket connection
        wsBorder: "border border-brand-500/30",
        wsEffect: "animate-shine-websocket",
        wsIndicator: true,
        // Add the number of connected sockets
        connectedSockets: combinedWsStatus.connectedSockets
      };
    }

    // Regular style without WebSocket enhancements
    return {
      ...currentStyles,
      wsBorder: "",
      wsEffect: "",
      wsIndicator: false,
      connectedSockets: 0
    };
  };

  const styles = getStatusStyles();

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
              <a
                href="https://status.degenduel.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
              >
                Status
              </a>
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
              title={status.message} // Show the detailed message on hover
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
                {status.status.toUpperCase()}
                {styles.wsIndicator && (
                  <span className="ml-0.5 text-cyan-400 text-opacity-70 text-[8px] align-top">
                    ⚡{styles.connectedSockets > 1 ? styles.connectedSockets : ''}
                  </span>
                )}
              </span>
            </div>

            {/* Simplified diagnostic popup with live status and ping test */}
            <div 
              id="status-dropdown"
              className="absolute bottom-full right-0 mb-2 hidden z-50 cursor-auto"
              onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
            >
              <div
                className={`${styles.bgColor} p-3 rounded shadow-lg text-xs ${styles.textColor} whitespace-nowrap ${styles.wsBorder} max-w-[300px]`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">
                    Status: {status.status.toUpperCase()}
                  </div>
                  <button 
                    className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-1 rounded text-cyan-400 transition-colors"
                    onClick={() => {
                      // Copy technical info to clipboard
                      const technicalInfo = `
Status: ${status.status.toUpperCase()}
Connected Sockets: ${combinedWsStatus.connectedSockets}/2
Monitor: ${status.isWebSocketConnected ? "✅" : "❌"}
Settings: ${!systemSettings.loading && !systemSettings.error ? "✅" : "❌"}
URL: ${import.meta.env.VITE_WS_URL || "wss://degenduel.me"}
Last Check: ${new Date().toLocaleTimeString()}
                      `.trim();
                      
                      navigator.clipboard.writeText(technicalInfo)
                        .then(() => {
                          alert('Connection status copied!');
                        })
                        .catch(err => {
                          console.error('Failed to copy:', err);
                        });
                    }}
                  >
                    Copy Status
                  </button>
                </div>

                {/* Live Connection Status with Visual Indicators */}
                <div className="bg-gray-800/50 p-2 rounded mb-2">
                  <div className="text-sm mb-2 font-semibold">Live WebSocket Status:</div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${status.isWebSocketConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                      <div>Monitor Socket</div>
                    </div>
                    <div className={status.isWebSocketConnected ? "text-green-400" : "text-red-400"}>
                      {status.isWebSocketConnected ? "LIVE" : "OFFLINE"}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${!systemSettings.loading && !systemSettings.error ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                      <div>Settings Socket</div>
                    </div>
                    <div className={!systemSettings.loading && !systemSettings.error ? "text-green-400" : "text-red-400"}>
                      {!systemSettings.loading && !systemSettings.error ? "LIVE" : "OFFLINE"}
                    </div>
                  </div>
                </div>
                
                {/* Connection Details - Visual Metrics */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm">Connected Sockets:</div>
                  <div className="flex items-center">
                    {Array(2).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 mx-0.5 rounded-sm flex items-center justify-center ${i < combinedWsStatus.connectedSockets ? "bg-green-500/80" : "bg-gray-700"}`}
                      >
                        {i < combinedWsStatus.connectedSockets && 
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        }
                      </div>
                    ))}
                    <div className="ml-2 text-sm">{combinedWsStatus.connectedSockets}/2</div>
                  </div>
                </div>
                
                {/* Live Connection Tester */}
                <div className="border-t border-gray-700 pt-2 pb-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold">Connection Test:</div>
                    <button 
                      className="bg-brand-500 hover:bg-brand-600 text-white text-[10px] px-2 py-1 rounded transition-colors"
                      onClick={() => {
                        // Create temporary ping tests to both websockets
                        const testMonitor = () => {
                          try {
                            const monitorUrl = `${import.meta.env.VITE_WS_URL || "wss://" + window.location.hostname}/api/v69/ws/monitor`;
                            const ws = new WebSocket(monitorUrl);
                            
                            // Update UI to show test in progress
                            const monitorResult = document.getElementById('monitor-ping-result');
                            if (monitorResult) {
                              monitorResult.textContent = "Testing...";
                              monitorResult.className = "text-yellow-400 animate-pulse";
                            }
                            
                            // Set timeout for connection
                            const timeout = setTimeout(() => {
                              try {
                                ws.close();
                                if (monitorResult) {
                                  monitorResult.textContent = "Timeout";
                                  monitorResult.className = "text-red-400";
                                }
                              } catch (e) {}
                            }, 3000);
                            
                            // Handle connection success
                            ws.onopen = () => {
                              clearTimeout(timeout);
                              if (monitorResult) {
                                monitorResult.textContent = "Connected!";
                                monitorResult.className = "text-green-400";
                              }
                              setTimeout(() => ws.close(), 1000);
                            };
                            
                            // Handle errors
                            ws.onerror = () => {
                              clearTimeout(timeout);
                              if (monitorResult) {
                                monitorResult.textContent = "Failed";
                                monitorResult.className = "text-red-400";
                              }
                            };
                          } catch (e) {
                            console.error("Monitor test failed:", e);
                          }
                        };
                        
                        const testSettings = () => {
                          try {
                            const settingsUrl = `${import.meta.env.VITE_WS_URL || "wss://" + window.location.hostname}/api/v69/ws/system-settings`;
                            const ws = new WebSocket(settingsUrl);
                            
                            // Update UI to show test in progress
                            const settingsResult = document.getElementById('settings-ping-result');
                            if (settingsResult) {
                              settingsResult.textContent = "Testing...";
                              settingsResult.className = "text-yellow-400 animate-pulse";
                            }
                            
                            // Set timeout for connection
                            const timeout = setTimeout(() => {
                              try {
                                ws.close();
                                if (settingsResult) {
                                  settingsResult.textContent = "Timeout";
                                  settingsResult.className = "text-red-400";
                                }
                              } catch (e) {}
                            }, 3000);
                            
                            // Handle connection success
                            ws.onopen = () => {
                              clearTimeout(timeout);
                              if (settingsResult) {
                                settingsResult.textContent = "Connected!";
                                settingsResult.className = "text-green-400";
                              }
                              setTimeout(() => ws.close(), 1000);
                            };
                            
                            // Handle errors
                            ws.onerror = () => {
                              clearTimeout(timeout);
                              if (settingsResult) {
                                settingsResult.textContent = "Failed";
                                settingsResult.className = "text-red-400";
                              }
                            };
                          } catch (e) {
                            console.error("Settings test failed:", e);
                          }
                        };
                        
                        // Run both tests
                        testMonitor();
                        testSettings();
                      }}
                    >
                      Test Now
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-[10px] bg-black/30 p-2 rounded">
                    <div className="flex justify-between items-center">
                      <div>Monitor Socket:</div>
                      <div id="monitor-ping-result" className="text-gray-400">Not tested</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>Settings Socket:</div>
                      <div id="settings-ping-result" className="text-gray-400">Not tested</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 mt-2 pt-2 text-right text-[9px] text-gray-400">
                  Last checked: {new Date().toLocaleTimeString()}
                  <br />
                  <button 
                    className="text-cyan-400 hover:text-cyan-300 mt-1 text-[9px] underline"
                    onClick={() => {
                      // Force reload both websockets
                      if (systemSettings.close && typeof systemSettings.close === 'function') {
                        try {
                          systemSettings.close();
                          setTimeout(() => {
                            if (systemSettings.connect && typeof systemSettings.connect === 'function') {
                              systemSettings.connect();
                            }
                          }, 500);
                        } catch (e) {
                          console.error("Failed to reset settings socket:", e);
                        }
                      }
                      // Clear status dropdown
                      const statusDropdown = document.getElementById('status-dropdown');
                      if (statusDropdown) {
                        statusDropdown.classList.add('hidden');
                      }
                      // Force page refresh to reset all connections
                      window.location.reload();
                    }}
                  >
                    Reset Connections
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
