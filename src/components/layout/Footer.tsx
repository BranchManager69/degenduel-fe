// src/components/layout/Footer.tsx

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ConnectionState, useWebSocket } from "../../contexts/UnifiedWebSocketContext";
import { useScrollFooter } from "../../hooks/ui/useScrollFooter";
import { DDExtendedMessageType, DDExtendedMessageType as MessageType } from '../../hooks/websocket/types';
import { useStore } from "../../store/useStore";


export const Footer: React.FC = () => {
  const unifiedWs = useWebSocket();
  
  // Get errors from hooks
  ////const { settings: systemSettingsDataFromHook, error: systemSettingsErrorFromHook } = useSystemSettings();
  
  // Use our scroll hook for footer
  const { isCompact } = useScrollFooter(50);

  // State to manage modal visibility and mode
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalMode, setModalMode] = useState<'basic' | 'passcode' | 'advanced'>('basic');
  const [passcodeInput, setPasscodeInput] = useState('');
  
  // Get maintenance mode from store (safely)
  const maintenanceMode = useStore((state) => state.maintenanceMode);
  const setMaintenanceMode = useStore((state) => state.setMaintenanceMode);

  // Grace period state for connection issues
  const [disconnectTime, setDisconnectTime] = useState<number | null>(null);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const [isInServerUpdatePeriod, setIsInServerUpdatePeriod] = useState(false);

  // Handle passcode entry
  const handlePasscodeInput = (digit: string) => {
    const newInput = passcodeInput + digit;
    setPasscodeInput(newInput);
    
    if (newInput === '6969') {
      setModalMode('advanced');
      setPasscodeInput('');
    } else if (newInput.length >= 4) {
      // Wrong passcode, clear after brief delay
      setTimeout(() => setPasscodeInput(''), 300);
    }
  };

  const clearPasscode = () => setPasscodeInput('');

  // Handle two-tier grace period for disconnections
  useEffect(() => {
    const GRACE_PERIOD_MS = 8000; // 8 seconds - brief user issues
    const SERVER_UPDATE_PERIOD_MS = 60000; // 60 seconds - server restarts

    if (!unifiedWs.isConnected && unifiedWs.connectionState === ConnectionState.DISCONNECTED) {
      // Just disconnected
      if (disconnectTime === null) {
        const now = Date.now();
        setDisconnectTime(now);
        setIsInGracePeriod(true);
        setIsInServerUpdatePeriod(false);

        // First timeout: end grace period, start server update period
        const graceTimeout = setTimeout(() => {
          setIsInGracePeriod(false);
          setIsInServerUpdatePeriod(true);
        }, GRACE_PERIOD_MS);

        // Second timeout: end server update period
        const serverUpdateTimeout = setTimeout(() => {
          setIsInServerUpdatePeriod(false);
        }, SERVER_UPDATE_PERIOD_MS);

        return () => {
          clearTimeout(graceTimeout);
          clearTimeout(serverUpdateTimeout);
        };
      }
    } else if (unifiedWs.isConnected) {
      // Reconnected - clear all grace periods
      setDisconnectTime(null);
      setIsInGracePeriod(false);
      setIsInServerUpdatePeriod(false);
    }
  }, [unifiedWs.isConnected, unifiedWs.connectionState, disconnectTime]);

  // Listen for maintenance mode updates via WebSocket
  useEffect(() => {
    if (!unifiedWs.registerListener) return;

    const unregisterListener = unifiedWs.registerListener(
      'footer-maintenance-listener',
      [DDExtendedMessageType.SYSTEM],
      (message) => {
        // Handle maintenance status updates
        if (message.type === 'SYSTEM' && message.action === 'maintenance_status') {
          const isMaintenanceActive = Boolean(message.data?.enabled || message.data?.mode);
          console.log('[Footer] Maintenance mode update received:', {
            enabled: isMaintenanceActive,
            message: message.data?.message,
            rawData: message.data
          });
          setMaintenanceMode(isMaintenanceActive);
        }
        // Also handle legacy format for backward compatibility
        else if (message.type === 'maintenance_status') {
          const isMaintenanceActive = Boolean(message.data?.mode);
          console.log('[Footer] Legacy maintenance mode update received:', {
            mode: isMaintenanceActive,
            rawData: message.data
          });
          setMaintenanceMode(isMaintenanceActive);
        }
      }
    );

    return unregisterListener;
  }, [unifiedWs.registerListener, setMaintenanceMode]);

  // Get styles based on server status and unified WebSocket connection
  const getStatusStyles = () => {
    let status: 'online' | 'gigaonline' | 'maintenance' | 'offline' | 'error' | 'serverupdating' = 'online';
    let message = 'Server is operating normally';
    
    // Base styles depending on server status
    const baseStyles = {
      online: {
        bgColor: "bg-purple-500/10",
        dotColor: "bg-purple-500",
        shadow: "shadow-[0_0_10px_rgba(147,51,234,0.5)]",
        textColor: "text-purple-400",
        animate: "animate-pulse",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5", // Larger dot for connected only
      },
      gigaonline: {
        bgColor: "bg-emerald-500/15",
        dotColor: "bg-emerald-400",
        shadow: "shadow-[0_0_20px_rgba(16,185,129,1.0)]",
        textColor: "text-emerald-300",
        animate: "animate-pulse",
        dotSize: "w-5 h-5 sm:w-6 sm:h-6", // Even larger dot for authenticated
      },
      maintenance: {
        bgColor: "bg-yellow-500/10",
        dotColor: "bg-yellow-500",
        shadow: "shadow-[0_0_10px_rgba(234,179,8,0.5)]",
        textColor: "text-yellow-400",
        animate: "",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5",
      },
      error: {
        bgColor: "bg-orange-500/10",
        dotColor: "bg-orange-500",
        shadow: "shadow-[0_0_10px_rgba(249,115,22,0.5)]",
        textColor: "text-orange-400",
        animate: "",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5",
      },
      offline: {
        bgColor: "bg-red-500/10",
        dotColor: "bg-red-500",
        shadow: "shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        textColor: "text-red-400",
        animate: "",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5",
      },
      serverupdating: {
        bgColor: "bg-cyan-500/10",
        dotColor: "bg-cyan-500",
        shadow: "shadow-[0_0_10px_rgba(6,182,212,0.5)]",
        textColor: "text-cyan-400",
        animate: "animate-pulse",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5",
      },
      unknown: {
        bgColor: "bg-gray-500/10",
        dotColor: "bg-gray-500",
        shadow: "shadow-[0_0_10px_rgba(128,128,128,0.5)]",
        textColor: "text-gray-400",
        animate: "",
        dotSize: "w-4 h-4 sm:w-5 sm:h-5",
      },
    };

    // Determine status based on WebSocket connection state with grace period
    // Check maintenance mode first (highest priority)
    if (maintenanceMode) {
      status = 'maintenance';
      message = 'System is currently under maintenance. Please check back shortly.';
    } else if (unifiedWs.isServerDown) {
      status = 'offline';
      message = unifiedWs.connectionError || 'Server unavailable. Connection closed.';
    } else if (unifiedWs.connectionState === ConnectionState.DISCONNECTED) {
      // Apply two-tier grace period for disconnections
      if (isInGracePeriod) {
        status = 'error'; // Show as "CONNECTING" during first 8 seconds
        message = 'Connecting...';
      } else if (isInServerUpdatePeriod) {
        status = 'serverupdating'; // Show as "SYNCING" during 8-60 seconds
        message = 'Syncing data...';
      } else {
        status = 'offline';
        message = unifiedWs.connectionError || 'Disconnected. Check your internet connection.';
      }
    } else if (unifiedWs.connectionState === ConnectionState.RECONNECTING) {
      status = 'error'; // Show as "CONNECTING" instead of offline
      message = 'Connecting...';
    } else if (unifiedWs.connectionState === ConnectionState.ERROR) {
      status = 'error';
      message = unifiedWs.connectionError || 'A connection error occurred.';
    } else if (unifiedWs.connectionError && !unifiedWs.isConnected) {
      status = 'error';
      message = unifiedWs.connectionError;
    } else if (unifiedWs.connectionState === ConnectionState.CONNECTING) {
      status = 'error'; // Show as "CONNECTING"
      message = 'Connecting...';
    } else if (unifiedWs.connectionState === ConnectionState.AUTHENTICATING) {
      status = 'error'; // Show as "CONNECTING" while authenticating
      message = 'Connecting...';
    } else if (unifiedWs.isConnected && unifiedWs.isAuthenticated) {
      status = 'gigaonline'; // GIGA GREEN for connected + authenticated
      message = 'Connected and authenticated';
    } else if (unifiedWs.isConnected) {
      status = 'online'; // GREEN for just connected (your requested change)
      message = 'Connected to data service';
    } else {
      // Apply two-tier grace period for general disconnection
      if (isInGracePeriod) {
        status = 'error';
        message = 'Connecting...';
      } else if (isInServerUpdatePeriod) {
        status = 'serverupdating';
        message = 'Server updating, please wait...';
      } else {
        status = 'offline';
        message = 'Not connected';
      }
    }

    const currentBaseStyle = baseStyles[status] || baseStyles.unknown;
    const isWsActuallyConnected = unifiedWs.isConnected;

    // Override status text for grace period and connecting states
    let displayText = status.toUpperCase();
    if (status === 'error' && (message === 'Connecting...' || isInGracePeriod)) {
      displayText = 'CONNECTING';
    }
    // Handle gigaonline status text
    if (status === 'gigaonline') {
      displayText = 'ONLINE';
    }
    // Handle server updating status text
    if (status === 'serverupdating') {
      displayText = 'SYNCING';
    }

    return {
      ...currentBaseStyle,
      statusText: displayText,
      message: message,
      // wsIndicator related styles depend on actual WS connection, not just derived server status
      wsBorder: isWsActuallyConnected ? "border border-brand-500/30" : "",
      wsEffect: isWsActuallyConnected ? "animate-shine-websocket" : "",
      wsIndicator: isWsActuallyConnected,
      connectedSockets: isWsActuallyConnected ? 1 : 0,
    };
  };

  // Get the styles for the current status
  const styles = getStatusStyles();

  // Add console log to check error states
  ////console.log("[Footer] Error States: SystemSettings:", systemSettingsErrorFromHook);

  return (
    <>
      {/* Error Banners Container - REMOVE ENTIRE BLOCK (AnimatePresence and its children) */}
      {/*
      <AnimatePresence>
        {((notificationsError && showNotificationErrorBanner) || (systemSettingsErrorFromHook && showSystemSettingsErrorBanner)) && (
          <motion.div ... >
            {notificationsError && showNotificationErrorBanner && (
              <motion.div ... </motion.div>
            )}
            {systemSettingsErrorFromHook && showSystemSettingsErrorBanner && (
              <motion.div ... </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      */}

      <footer
        className="backdrop-blur-sm border-t border-dark-300/30 fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-visible"
        style={{ paddingTop: '4px' }} 
      >
        {/* Full footer-width status background based on derived styles.statusText */}
        {styles.statusText === 'MAINTENANCE' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
       
            {/* Enhanced dark overlay with subtle texture */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-gray-800/20 to-gray-900/30" />
            
            {/* Top caution tape - Fixed seamless animation */}
            <div className="absolute top-0 w-screen left-1/2 -translate-x-1/2 h-[10px] overflow-hidden">
              {/* Tape shadow for depth */}
              <div className="absolute inset-0 bg-black/20 transform translate-y-[1px]" />
              
              {/* Seamless infinite caution tape */}
              <div 
                className="absolute top-0 h-full animate-caution-tape-scroll"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    #1a1a1a 0px,
                    #000000 8px,
                    #ffcd3c 8px,
                    #ffc107 16px
                  )`,
                  width: '300%',
                  left: '-200%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              />
              
              {/* Subtle glow effect on top tape */}
              <div className="absolute top-0 w-full h-full bg-gradient-to-b from-yellow-400/20 to-transparent" />
            </div>
            
            {/* Bottom caution tape - Fixed seamless animation */}
            <div className="absolute bottom-0 w-screen left-1/2 -translate-x-1/2 h-[10px] overflow-hidden">
              {/* Tape shadow for depth */}
              <div className="absolute inset-0 bg-black/20 transform -translate-y-[1px]" />
              
              {/* Seamless infinite caution tape moving opposite direction */}
              <div 
                className="absolute bottom-0 h-full animate-caution-tape-scroll-reverse"
                style={{
                  background: `repeating-linear-gradient(
                    -45deg,
                    #1a1a1a 0px,
                    #000000 8px,
                    #ffcd3c 8px,
                    #ffc107 16px
                  )`,
                  width: '300%',
                  left: '-200%',
                  boxShadow: '0 -2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)'
                }}
              />
              
              {/* Subtle glow effect on bottom tape */}
              <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-yellow-400/20 to-transparent" />
            </div>
            
            {/* Enhanced center glow with pulsing effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/15 to-transparent animate-pulse" 
                 style={{ animationDuration: '3s' }} />
            
            {/* Subtle animated particles for extra polish */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse" 
                   style={{ animationDelay: '0s', animationDuration: '2s' }} />
              <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse" 
                   style={{ animationDelay: '1s', animationDuration: '2s' }} />
              <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-yellow-300/80 rounded-full animate-pulse" 
                   style={{ animationDelay: '0.5s', animationDuration: '1.5s' }} />
            </div>

          </div>
        )}
        
        {/* Error/Connecting state background */}
        {(styles.statusText === 'ERROR' || styles.statusText === 'CONNECTING') && (
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
        
        {/* Offline state background */}
        {styles.statusText === 'OFFLINE' && (
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
        
        {/* Server updating state background */}
        {styles.statusText === 'SERVER UPDATING' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
            {/* Soft cyan gradient background */}
            <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/15 via-cyan-500/5 to-transparent" />
            
            {/* Pulsing effect for server updating state */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-32 animate-pulse"
              style={{
                background: 'radial-gradient(circle at right, rgba(6,182,212,0.3) 0%, transparent 70%)',
                animationDuration: '1.5s'
              }}
            />
          </div>
        )}
        
        {/* Online state background */}
        {styles.statusText === 'ONLINE' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
            {/* Enhanced background for authenticated (gigaonline) vs regular online */}
            {status === 'gigaonline' ? (
              <>
                {/* Enhanced emerald gradient for authenticated */}
                <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/20 via-emerald-500/8 to-transparent" />
                
                {/* Brighter glow for authenticated */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-32 animate-gradient-pulse"
                  style={{
                    background: 'radial-gradient(circle at right, rgba(16,185,129,0.3) 0%, transparent 70%)'
                  }}
                />
              </>
            ) : (
              <>
                {/* Standard purple gradient for connected only */}
                <div className="absolute inset-0 bg-gradient-to-l from-purple-500/15 via-purple-500/5 to-transparent" />
                
                {/* Standard glow for connected only */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-32 animate-gradient-pulse"
                  style={{
                    background: 'radial-gradient(circle at right, rgba(147,51,234,0.2) 0%, transparent 70%)'
                  }}
                />
              </>
            )}
          </div>
        )}
        
        {/* Footer container for purpose of horizontal scroll */}
        <div className="max-w-7xl mx-auto px-0 relative z-10">
          
          {/* Footer parent - is compact/expanded based on scroll state */}
          <div
            className={`flex items-center min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${isCompact ? "h-[40px]" : "h-[56px]"}`}
          >
            
            {/* Left side - Links with horizontal scroll if needed */}
            <div className="flex items-center gap-6 min-w-0 pl-4 flex-wrap">
              
              {/* Unified footer for all users - clean symbols approach */}
              <div className="flex items-center space-x-4 shrink-0">
                {/* Status link with activity/pulse icon */}
                <a
                  href="https://status.degenduel.me/"
                  className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out p-2 -m-2 rounded-md hover:bg-gray-800/20 shadow-sm hover:shadow-md"
                  title="System Status"
                >
                  <svg className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </a>
                
                {/* Divider */}
                <div className="h-4 w-px bg-gray-700"></div>
                
                {/* Social links with enhanced grouping */}
                <div className="flex items-center space-x-3 px-2 py-1 rounded-md bg-gray-800/20 hover:bg-gray-800/40 transition-colors shadow-sm">
                  {/* Twitter */}
                  <a
                    href="https://x.com/DegenDuelMe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out delay-[0ms] hover:delay-[0ms] p-1 -m-1 rounded hover:bg-gray-700/30"
                    title="Follow us on X"
                  >
                    <svg className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>

                  {/* Discord */}
                  <a
                    href="https://discord.gg/dduel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out delay-[50ms] hover:delay-[0ms] p-1 -m-1 rounded hover:bg-gray-700/30"
                    title="Join our Discord"
                  >
                    <svg className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                    </svg>
                  </a>

                  {/* Telegram */}
                  <a
                    href="https://t.me/DegenDuel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out delay-[100ms] hover:delay-[0ms] p-1 -m-1 rounded hover:bg-gray-700/30"
                    title="Join our Telegram"
                  >
                    <svg className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </a>

                  {/* GitHub */}
                  <a
                    href="https://github.com/BranchManager69/degenduel-fe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out delay-[150ms] hover:delay-[0ms] p-1 -m-1 rounded hover:bg-gray-700/30"
                    title="View on GitHub"
                  >
                    <svg className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>

                  {/* Branch attribution */}
                  <a 
                    href="https://branch.bet" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-400 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 ease-out delay-[200ms] hover:delay-[0ms] p-1 -m-1 rounded hover:bg-gray-700/30"
                    title="by Branch"
                  >
                    {/* Branch emoji */}
                    <span className="text-lg sm:text-xl text-gray-500 hover:text-brand-400 transition-colors">🌿</span>
                  </a>
                </div>
                
              </div>
            </div>

            {/* Right side - Enhanced Status Indicator */}
            <div className="flex items-stretch h-full shrink-0 group ml-auto pr-0">
              <div
                id="status-indicator"
                className={`flex items-center gap-2 h-full px-4 sm:px-6 transition-all duration-300 relative cursor-pointer hover:brightness-110 active:brightness-90 hover:scale-105 hover:shadow-lg rounded-md hover:bg-gray-800/20`}
                onClick={() => {
                  setShowStatusModal(!showStatusModal);
                  setModalMode('basic');
                  setPasscodeInput('');
                }}
                title="Click to view WebSocket details and test connection"
              >
                {/* WebSocket-specific shine effect */}
                {styles.wsIndicator && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-shine z-0 rounded-md" />
                )}

                <div className="flex items-center justify-center gap-2 relative z-10 h-full">
                  <span
                    className={`text-xs font-fira-code tracking-wider ${styles.textColor} ${styles.wsIndicator ? "text-shadow-sm font-semibold" : ""} cursor-pointer`}
                  >
                    {styles.statusText}
                  </span>
                  <div className="relative">
                    <div
                      className={`${styles.dotSize || 'w-4 h-4 sm:w-5 sm:h-5'} rounded-full transition-all duration-300 ${styles.dotColor} ${styles.shadow} ${styles.animate} ${styles.statusText === 'ONLINE' ? 'animate-pulse shadow-lg' : ''}`}
                    />
                    {styles.wsIndicator && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-cyan-400 text-[12px] sm:text-[14px] font-bold leading-none">
                          ⚡
                        </span>
                      </div>
                    )}
                  </div>
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
                      // Close the modal
                      setShowStatusModal(false);
                    }
                  }}
                >
                  {/* WebSocket status modal */}
                  <div
                    className={`bg-gray-900 p-4 rounded-lg shadow-xl text-xs ${styles.textColor} border border-gray-700 w-full max-w-[400px] max-h-[90vh] overflow-auto relative`}
                    style={{
                      boxShadow: `0 10px 25px -5px ${
                        styles.statusText === 'ONLINE' && status === 'gigaonline' ? 'rgba(16,185,129,0.3)' :
                        styles.statusText === 'ONLINE' ? 'rgba(147,51,234,0.2)' :
                        styles.statusText === 'MAINTENANCE' ? 'rgba(234,179,8,0.2)' :
                        styles.statusText === 'ERROR' ? 'rgba(249,115,22,0.2)' :
                        styles.statusText === 'OFFLINE' ? 'rgba(239,68,68,0.2)' :
                        styles.statusText === 'SERVER UPDATING' ? 'rgba(6,182,212,0.2)' : // Cyan for server updating
                        'rgba(128,128,128,0.2)' // Fallback for unknown, though derived status should cover known states
                      }, 0 8px 10px -6px rgba(0,0,0,0.3)`
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
                  >
                    {/* Close button - top right */}
                    <button 
                      className="absolute top-2 right-2 text-gray-400 hover:text-white p-1"
                      onClick={() => {
                        setShowStatusModal(false);
                        setModalMode('basic');
                        setPasscodeInput('');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Modal Content Based on Mode */}
                    {modalMode === 'basic' && (
                      <div className="text-center">
                        <div className="mb-4">
                          <div className="flex items-center justify-center mb-2">
                            <div className={`w-4 h-4 rounded-full mr-3 ${unifiedWs.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-lg font-semibold">
                              {styles.statusText}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{styles.message}</p>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-4">
                          <button 
                            onClick={() => setModalMode('passcode')}
                            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                          >
                            Advanced Options
                          </button>
                        </div>
                      </div>
                    )}

                    {modalMode === 'passcode' && (
                      <div className="text-center">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Enter Passcode</h3>
                          <div className="flex justify-center space-x-2 mb-4">
                            {[0,1,2,3].map(i => (
                              <div key={i} className={`w-3 h-3 rounded-full border-2 transition-colors ${
                                i < passcodeInput.length ? 'bg-cyan-400 border-cyan-400' : 'border-gray-600'
                              }`} />
                            ))}
                          </div>
                        </div>
                        
                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto">
                          {[1,2,3,4,5,6,7,8,9].map(num => (
                            <button
                              key={num}
                              onClick={() => handlePasscodeInput(num.toString())}
                              className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            onClick={clearPasscode}
                            className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => handlePasscodeInput('0')}
                            className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
                          >
                            0
                          </button>
                          <button
                            onClick={() => setModalMode('basic')}
                            className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    )}

                    {modalMode === 'advanced' && (
                      <>
                        {/* Existing Advanced Modal Content */}

                    {/* Header with status and copy button */}
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
                      <div className="font-bold text-sm">
                        Status: <span className={
                          styles.statusText === 'ONLINE' && status === 'gigaonline' ? 'text-emerald-300' :
                          styles.statusText === 'ONLINE' ? 'text-purple-400' : 
                          styles.statusText === 'MAINTENANCE' ? 'text-yellow-400' : 
                          styles.statusText === 'ERROR' ? 'text-orange-400' : // Consistent error color
                          styles.statusText === 'OFFLINE' ? 'text-red-400' : // Consistent offline color
                          styles.statusText === 'SERVER UPDATING' ? 'text-cyan-400' : // Cyan for server updating
                          'text-gray-400' // Fallback
                        }>
                          {styles.statusText}
                        </span>
                      </div>
                      <button 
                        className="bg-gray-800 hover:bg-gray-700 text-[10px] px-2 py-1 rounded text-cyan-400 transition-colors"
                        onClick={() => {
                          // Copy technical info to clipboard
                          const technicalInfo = `
Status: ${styles.statusText}
Message: ${styles.message}
UnifiedWS Connected: ${unifiedWs.isConnected ? "✅" : "❌"}
UnifiedWS Authenticated: ${unifiedWs.isAuthenticated ? "✅" : "❌"}
UnifiedWS State: ${unifiedWs.connectionState}
UnifiedWS Connection Error: ${unifiedWs.connectionError || "None"}
UnifiedWS Server Down: ${unifiedWs.isServerDown ? "✅" : "❌"}
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
                            {unifiedWs.isConnected ? "CONNECTED" : unifiedWs.connectionState === ConnectionState.RECONNECTING ? "RECONNECTING" : "DISCONNECTED"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-black/30 p-2 rounded">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${unifiedWs.isAuthenticated ? "bg-green-500 animate-pulse shadow-sm shadow-green-500/50" : (unifiedWs.isConnected ? "bg-yellow-500" : "bg-red-500")}`}></div>
                          <div>WebSocket Authentication</div>
                        </div>
                        <div className="flex items-center">
                          <div className={unifiedWs.isAuthenticated ? "text-green-400 font-medium" : (unifiedWs.isConnected ? (unifiedWs.connectionState === ConnectionState.AUTHENTICATING ? "AUTHENTICATING" : "UNAUTHENTICATED") : "N/A")}>
                            {unifiedWs.isAuthenticated ? "AUTHENTICATED" : (unifiedWs.isConnected ? (unifiedWs.connectionState === ConnectionState.AUTHENTICATING ? "AUTHENTICATING" : "UNAUTHENTICATED") : "N/A")}
                          </div>
                        </div>
                      </div>
                      
                      {/* Connection state and error info */}
                      <div className="mt-2 text-xs text-gray-300">
                        <div className="flex justify-between">
                          <div>Connection State:</div>
                          <div className="font-mono">{unifiedWs.connectionState}</div>
                        </div>
                        {unifiedWs.connectionError && (
                          <div className="flex justify-between mt-1 text-red-400">
                            <div>Error:</div>
                            <div className="font-mono truncate max-w-[200px]">{unifiedWs.connectionError}</div>
                          </div>
                        )}

                        {/* Potentially down server status */}
                        {unifiedWs.isServerDown && (
                           <div className="flex justify-between mt-1 text-red-400">
                             <div>Server Status:</div>
                             <div className="font-mono">Potentially Down</div>
                           </div>
                        )}

                        {/*
                         {systemSettingsDataFromHook?.maintenanceMode && (
                           <div className="flex justify-between mt-1 text-yellow-400">
                             <div>Platform Status:</div>
                             <div className="font-mono">Maintenance Mode</div>
                           </div>
                        )}
                        */}

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
                      </>
                    )}

                  </div>
                </div>
              , document.body)}

            </div>


          </div>
        </div>
      </footer>
    </>
  );
};