// src/components/layout/Footer.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

import { useScrollFooter } from "../../hooks/useScrollFooter";
import { MessageType, TopicType, useUnifiedWebSocket } from "../../hooks/websocket";
import { useAuth } from "../../hooks/useAuth";
import RPCBenchmarkFooter from "../admin/RPCBenchmarkFooter";

export const Footer: React.FC = () => {
  // Get user authentication status to check if user is admin and authentication status
  const { isAdmin, isAuthenticated } = useAuth();
  // Use unified WebSocket for server status and system settings
  // Check for storybook mock status
  const initialStatus = typeof window !== 'undefined' && (window as any).serverStatusState
    ? (window as any).serverStatusState
    : {
        status: 'online' as 'online' | 'maintenance' | 'offline' | 'error',
        message: 'Server is operating normally',
        timestamp: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        loading: false
      };
  
  const [serverStatus, setServerStatus] = useState(initialStatus);
  
  const [systemSettings, setSystemSettings] = useState({
    loading: false,
    error: null as string | null,
    lastUpdated: null as Date | null,
    showDiagnostics: false,
    diagOptions: [] as string[],
  });
  
  // Subscribe to unified WebSocket messages with the new format
  const unifiedWs = useUnifiedWebSocket(
    'footer-status', 
    [MessageType.DATA, MessageType.SYSTEM], 
    (message) => {
      // Handle different message types and topics
      if (message.type === MessageType.DATA && message.topic === TopicType.SYSTEM) {
        // System data (status updates)
        if (message.data?.status) {
          setServerStatus({
            status: message.data.status,
            message: message.data.message || 'Server status update received',
            timestamp: message.timestamp || new Date().toISOString(),
            lastChecked: new Date().toISOString(),
            loading: false
          });
        }
      } else if (message.type === MessageType.SYSTEM) {
        // System messages might contain settings updates
        setSystemSettings({
          loading: false,
          error: null,
          lastUpdated: new Date(),
          showDiagnostics: message.data?.showDiagnostics || false,
          diagOptions: message.data?.diagOptions || []
        });
      }
    },
    [TopicType.SYSTEM] // Filter by system topic
  );
  
  // Subscribe to system topic on component mount
  useEffect(() => {
    if (unifiedWs.isConnected) {
      unifiedWs.subscribe([TopicType.SYSTEM]);
    }
  }, [unifiedWs.isConnected]);
  
  // Track combined WebSocket connection status
  const [combinedWsStatus, setCombinedWsStatus] = useState({
    isConnected: false,
    connectedSockets: 0
  });
  
  // Use our scroll hook for footer
  const { isCompact } = useScrollFooter(50);
  
  // Update connection status based on unified WebSocket
  useEffect(() => {
    const isConnected = unifiedWs.isConnected;
    
    setCombinedWsStatus({
      isConnected,
      connectedSockets: isConnected ? 1 : 0 // We now have only 1 socket
    });
    
    console.log("Unified WebSocket Connection Status:", {
      connected: isConnected ? "Connected" : "Disconnected",
      authenticated: unifiedWs.isAuthenticated ? "Yes" : "No",
      connectionState: unifiedWs.connectionState,
      error: unifiedWs.error,
      showLightningBolt: isConnected
    });
  }, [unifiedWs.isConnected, unifiedWs.isAuthenticated, unifiedWs.connectionState]);

  // State to manage modal visibility
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // We don't need the click outside handler anymore as we're handling it in the portal overlay
  // The modal now closes when clicking the overlay directly

  // Get color scheme and animation based on status
  // Get styles based on server status and unified WebSocket connection
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
    const currentStyles = baseStyles[serverStatus.status as keyof typeof baseStyles] || baseStyles.offline;

    // Add WebSocket-specific enhancements when unified WebSocket is connected
    if (combinedWsStatus.isConnected) {
      return {
        ...currentStyles,
        // Enhanced styles for WebSocket connection
        wsBorder: "border border-brand-500/30",
        wsEffect: "animate-shine-websocket",
        wsIndicator: true,
        // With unified WebSocket, we only have one connection
        connectedSockets: 1
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
      className="backdrop-blur-sm border-t border-dark-300/30 sticky bottom-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden relative"
    >
      {/* Full footer-width status background */}
      {serverStatus.status === 'maintenance' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-gray-900/20" />
          
          {/* Top caution tape - full width with no left/right boundaries */}
          <div className="absolute top-0 w-screen left-1/2 -translate-x-1/2 h-[8px] overflow-visible">
            <div 
              className="absolute top-0 left-[-100%] right-[-100%] h-full animate-caution-tape-scroll"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  #000000,
                  #000000 8px,
                  #ffc107 8px,
                  #ffc107 16px
                )`
              }}
            />
          </div>
          
          {/* Bottom caution tape - full width with no left/right boundaries */}
          <div className="absolute bottom-0 w-screen left-1/2 -translate-x-1/2 h-[8px] overflow-visible">
            <div 
              className="absolute bottom-0 left-[-100%] right-[-100%] h-full animate-caution-tape-scroll-reverse"
              style={{
                background: `repeating-linear-gradient(
                  -45deg,
                  #000000,
                  #000000 8px,
                  #ffc107 8px,
                  #ffc107 16px
                )`
              }}
            />
          </div>
          
          {/* Subtle yellow glow in the middle */}
          <div className="absolute inset-0 bg-yellow-500/10" />
        </div>
      )}
      
      {serverStatus.status === 'error' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {/* Soft orange gradient background */}
          <div className="absolute inset-0 bg-gradient-to-l from-orange-500/15 via-orange-500/5 to-transparent" />
          
          {/* Subtle glow on the right side */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-32 animate-pulse"
            style={{
              background: 'radial-gradient(circle at right, rgba(249,115,22,0.2) 0%, transparent 70%)'
            }}
          />
        </div>
      )}
      
      {serverStatus.status === 'offline' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {/* Soft red gradient background */}
          <div className="absolute inset-0 bg-gradient-to-l from-red-500/15 via-red-500/5 to-transparent" />
          
          {/* Subtle blinking effect for offline state */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-32 animate-pulse"
            style={{
              background: 'radial-gradient(circle at right, rgba(239,68,68,0.2) 0%, transparent 70%)',
              animationDuration: '2s'
            }}
          />
        </div>
      )}
      
      {serverStatus.status === 'online' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {/* Soft green gradient background */}
          <div className="absolute inset-0 bg-gradient-to-l from-green-500/15 via-green-500/5 to-transparent" />
          
          {/* Subtle glow on the right side */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-32 animate-gradient-pulse"
            style={{
              background: 'radial-gradient(circle at right, rgba(34,197,94,0.2) 0%, transparent 70%)'
            }}
          />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-0 relative z-10">
        <div
          className={`flex items-center min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCompact ? "h-[40px]" : "h-[56px]"}`}
        >
          {/* Left side - Links with horizontal scroll if needed */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar min-w-0 pl-4">
            {/* Check if user is authenticated or if we're past the release date */}
            {(isAuthenticated() || new Date() >= new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00')) ? (
              <>
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
                    Invite & Earn
                  </Link>
                  <Link
                    to="/support"
                    className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
                  >
                    Support
                  </Link>
                  
                  {/* RPC Benchmark Dashboard - Only visible to admin users */}
                  {isAdmin() && systemSettings.showDiagnostics && systemSettings.diagOptions.includes('rpc_benchmarks') && (
                    <div className="ml-2 pl-2 border-l border-gray-700">
                      <RPCBenchmarkFooter compactMode={isCompact} />
                    </div>
                  )}
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
              </>
            ) : (
              /* Minimal footer for non-authenticated users before release */
              <div className="flex items-center space-x-4 shrink-0">
                <a href="https://branch.bet" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-400 opacity-70 hover:opacity-100 transition-opacity">by Branch • <span className="text-[10px]">2025</span></a>
                <div className="h-4 w-px bg-gray-700"></div>
                <a
                  href="https://status.degenduel.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-brand-400 whitespace-nowrap"
                >
                  Status
                </a>
              </div>
            )}
          </div>

          {/* Right side - Enhanced Status Indicator */}
          <div className="flex items-stretch h-full shrink-0 group ml-auto pr-0">
            <div
              id="status-indicator"
              className={`
                flex items-center gap-2 h-full px-4
                transition-all duration-300 relative cursor-pointer
                hover:brightness-110 active:brightness-90
              `}
              onClick={() => setShowStatusModal(!showStatusModal)}
              title="Click to view WebSocket details and test connection"
            >
              {/* Status indicator glow effect */}
              <div 
                className={`absolute right-0 top-0 bottom-0 w-1 h-full z-0 ${
                  serverStatus.status === 'online' ? 'bg-green-500/60' :
                  serverStatus.status === 'maintenance' ? 'bg-yellow-500/60' :
                  serverStatus.status === 'error' ? 'bg-orange-500/60' :
                  'bg-red-500/60'
                }`}
              />
              
              {/* WebSocket-specific shine effect */}
              {styles.wsIndicator && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-shine z-0" />
              )}

              <div className="flex items-center justify-center gap-2 relative z-10 h-full">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300
                    ${styles.dotColor} ${styles.shadow} ${styles.animate}
                  `}
                />
                <span
                  className={`
                  text-xs font-cyber tracking-wide ${styles.textColor}
                  ${styles.wsIndicator ? "text-shadow-sm font-semibold" : ""}
                  cursor-pointer
                `}
                >
                  {serverStatus.status.toUpperCase()}
                  {styles.wsIndicator && (
                    <span className="ml-1 text-cyan-400 text-opacity-90 text-[10px] align-middle font-bold">
                      ⚡{styles.connectedSockets > 1 ? styles.connectedSockets : ''}
                    </span>
                  )}
                  
                  {/* Small dropdown indicator */}
                  <span className="ml-1 inline-block group-hover:translate-y-0.5 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block opacity-70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </span>
              </div>
            </div>

            {/* Status Modal - Using React Portal to render outside of footer */}
            {showStatusModal && createPortal(
              <div 
                id="status-modal"
                className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => {
                  // If clicking the backdrop (not the modal itself), close the modal
                  if (e.currentTarget === e.target) {
                    setShowStatusModal(false);
                  }
                }}
              >
                <div
                  className={`bg-gray-900 p-4 rounded-lg shadow-xl text-xs ${styles.textColor} border border-gray-700 w-full max-w-[400px] max-h-[90vh] overflow-auto relative`}
                  style={{
                    boxShadow: `0 10px 25px -5px ${
                      serverStatus.status === 'online' ? 'rgba(34,197,94,0.2)' :
                      serverStatus.status === 'maintenance' ? 'rgba(234,179,8,0.2)' :
                      serverStatus.status === 'error' ? 'rgba(249,115,22,0.2)' :
                      'rgba(239,68,68,0.2)'
                    }, 0 8px 10px -6px rgba(0,0,0,0.3)`
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
                >
                  {/* Close button - top right */}
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-white p-1"
                    onClick={() => setShowStatusModal(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Header with status and copy button */}
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
                    <div className="font-bold text-sm">
                      Status: <span className={serverStatus.status === 'online' ? 'text-green-400' : serverStatus.status === 'maintenance' ? 'text-yellow-400' : 'text-red-400'}>
                        {serverStatus.status.toUpperCase()}
                      </span>
                    </div>
                    <button 
                      className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-1 rounded text-cyan-400 transition-colors"
                      onClick={() => {
                        // Copy technical info to clipboard
                        const technicalInfo = `
Status: ${serverStatus.status.toUpperCase()}
Connected Sockets: ${combinedWsStatus.connectedSockets}/1
Monitor: ${unifiedWs.isConnected ? "✅" : "❌"}
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

                  {/* Unified WebSocket Status */}
                  <div className="bg-gray-800/60 p-3 rounded-md mb-3 shadow-inner">
                    <div className="text-sm mb-2 font-semibold text-white/90">Unified WebSocket Status:</div>
                    
                    <div className="flex items-center justify-between mb-3 bg-black/30 p-2 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${unifiedWs.isConnected ? "bg-green-500 animate-pulse shadow-sm shadow-green-500/50" : "bg-red-500"}`}></div>
                        <div>WebSocket Connection</div>
                      </div>
                      <div className="flex items-center">
                        <div className={unifiedWs.isConnected ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                          {unifiedWs.isConnected ? "CONNECTED" : "DISCONNECTED"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${unifiedWs.isAuthenticated ? "bg-green-500 animate-pulse shadow-sm shadow-green-500/50" : (unifiedWs.isConnected ? "bg-yellow-500" : "bg-red-500")}`}></div>
                        <div>WebSocket Authentication</div>
                      </div>
                      <div className="flex items-center">
                        <div className={unifiedWs.isAuthenticated ? "text-green-400 font-medium" : (unifiedWs.isConnected ? "text-yellow-400 font-medium" : "text-red-400 font-medium")}>
                          {unifiedWs.isAuthenticated ? "AUTHENTICATED" : (unifiedWs.isConnected ? "UNAUTHENTICATED" : "N/A")}
                        </div>
                      </div>
                    </div>
                    
                    {/* Connection state and error info */}
                    <div className="mt-2 text-xs text-gray-300">
                      <div className="flex justify-between">
                        <div>Connection State:</div>
                        <div className="font-mono">{unifiedWs.connectionState}</div>
                      </div>
                      {unifiedWs.error && (
                        <div className="flex justify-between mt-1 text-red-400">
                          <div>Error:</div>
                          <div className="font-mono truncate max-w-[200px]">{unifiedWs.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection Details - Visual Metrics */}
                  <div className="flex justify-between items-center mb-4 bg-gray-800/30 p-2 rounded">
                    <div className="text-sm font-medium">Connection Status:</div>
                    <div className="flex items-center">
                      <div 
                        className={`w-6 h-6 mx-0.5 rounded-sm flex items-center justify-center ${unifiedWs.isConnected ? "bg-green-500/80 shadow-sm shadow-green-500/30" : "bg-gray-700"}`}
                      >
                        {unifiedWs.isConnected && 
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        }
                      </div>
                      <div className="ml-2 text-sm font-medium">
                        {unifiedWs.isConnected ? (
                          <span className="text-green-400">UNIFIED ACTIVE</span>
                        ) : (
                          <span className="text-red-400">DISCONNECTED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Unified WebSocket Tester */}
                  <div className="border border-cyan-800/50 bg-cyan-900/20 rounded-md p-3 shadow-inner mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm font-bold text-cyan-300">Connection Test</div>
                      <button 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1.5 rounded transition-colors shadow-sm flex items-center gap-1"
                        onClick={() => {
                          // Create temporary test connection to the unified WebSocket
                          try {
                            const wsUrl = `${import.meta.env.VITE_WS_URL || "wss://" + window.location.hostname}/api/v69/ws`;
                            
                            // Update UI to show test in progress
                            const unifiedResult = document.getElementById('unified-ws-result');
                            if (unifiedResult) {
                              unifiedResult.textContent = "Testing...";
                              unifiedResult.className = "text-yellow-400 animate-pulse font-medium";
                            }
                            
                            console.log(`Testing unified WebSocket connection to: ${wsUrl}`);
                            const ws = new WebSocket(wsUrl);
                            
                            // Set timeout for connection
                            const timeout = setTimeout(() => {
                              try {
                                ws.close();
                                if (unifiedResult) {
                                  unifiedResult.textContent = "Timeout";
                                  unifiedResult.className = "text-red-400 font-medium";
                                }
                              } catch (e) {}
                            }, 5000);
                            
                            // Handle connection success
                            ws.onopen = () => {
                              clearTimeout(timeout);
                              if (unifiedResult) {
                                unifiedResult.textContent = "Connected!";
                                unifiedResult.className = "text-green-400 font-medium";
                              }
                              
                              // Send a test ping using the correct format
                              try {
                                ws.send(JSON.stringify({
                                  type: MessageType.SYSTEM,
                                  action: 'ping',
                                  timestamp: new Date().toISOString()
                                }));
                              } catch (err) {
                                console.error("Error sending ping:", err);
                              }
                              
                              // Close after a short delay
                              setTimeout(() => ws.close(), 2000);
                            };
                            
                            // Handle message
                            ws.onmessage = (event) => {
                              try {
                                const message = JSON.parse(event.data);
                                console.log("Test connection received message:", message);
                                
                                // If we got a pong back (either as PONG or SYSTEM with action='pong'), that's a good sign
                                if (message.type === MessageType.PONG || 
                                   (message.type === MessageType.SYSTEM && message.action === 'pong')) {
                                  if (unifiedResult) {
                                    unifiedResult.textContent = "Connected & Responding! ✓";
                                    unifiedResult.className = "text-green-400 font-bold";
                                  }
                                }
                              } catch (err) {
                                console.error("Error parsing message:", err);
                              }
                            };
                            
                            // Handle errors
                            ws.onerror = (error) => {
                              clearTimeout(timeout);
                              console.error("WebSocket test error:", error);
                              if (unifiedResult) {
                                unifiedResult.textContent = "Connection Failed";
                                unifiedResult.className = "text-red-400 font-medium";
                              }
                            };
                            
                            // Handle close
                            ws.onclose = (event) => {
                              console.log(`WebSocket test connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
                            };
                            
                          } catch (e) {
                            console.error("WebSocket test failed:", e);
                            const unifiedResult = document.getElementById('unified-ws-result');
                            if (unifiedResult) {
                              unifiedResult.textContent = "Test failed: " + (e instanceof Error ? e.message : String(e));
                              unifiedResult.className = "text-red-400 font-medium";
                            }
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        Test Unified WebSocket
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-[11px] bg-black/40 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Unified WebSocket:</div>
                        <div id="unified-ws-result" className="text-white/70 font-medium">Not tested</div>
                      </div>
                      <div className="text-xs text-cyan-300/70 mt-1">
                        Testing connection to: <span className="font-mono">/api/v69/ws</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reset Connections Button - More Prominent */}
                  <div className="flex justify-between items-center mt-2 border-t border-gray-700 pt-3">
                    <div className="text-[10px] text-gray-400">
                      Last checked: <span className="text-cyan-400/80">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <button 
                      className="bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                      onClick={() => {
                        // Send a quick message to the console for logging
                        console.log("Refreshing page to reset unified WebSocket connection...");
                        
                        // Close the modal
                        setShowStatusModal(false);
                        
                        // Force page refresh to reset the connection
                        window.location.reload();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Reset Connection
                    </button>
                  </div>
                </div>
              </div>
            , document.body)}
          </div>
        </div>
      </div>
    </footer>
  );
};