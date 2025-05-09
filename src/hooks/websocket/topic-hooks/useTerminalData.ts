// src/hooks/websocket/topic-hooks/useTerminalData.ts

/**
 * useTerminalData Hook
 * @description This hook provides real-time updates for terminal data, including contract address
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-04-14
 * @updated 2025-05-03
 */

import { DDWebSocketActions } from '@branchmanager69/degenduel-shared/dist/types/websocket';
import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { TerminalData } from '../../../services/terminalDataService';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { TopicType } from '../index';
import { DDExtendedMessageType } from '../types';

// Define the standard structure for terminal data updates from the server
// Based on backend team's specification, this interface describes the message format from the backend
interface WebSocketTerminalMessage {
  type: DDExtendedMessageType; // DDExtendedMessageType.DATA
  topic: string; // 'terminal'
  subtype: string; // 'terminal'
  action: string; // 'update'
  data: Partial<TerminalData>;
  timestamp: string;
}

// Default terminal data for initial state
const DEFAULT_TERMINAL_DATA: TerminalData = {
  platformName: "DegenDuel",
  platformDescription: "Loading platform information...",
  platformStatus: "Connecting to server...",
  _legacyContractAddress: undefined,
  _legacyContractAddressRevealed: false,
  features: [],
  systemStatus: {},
  stats: {
    currentUsers: null,
    upcomingContests: null,
    totalPrizePool: "Loading...",
    platformTraffic: "Loading...",
    socialGrowth: "Loading...",
    waitlistUsers: null
  },
  token: {
    symbol: "DEGEN",
    totalSupply: null,
    initialCirculating: null,
    communityAllocation: "Loading...",
    teamAllocation: "Loading...",
    treasuryAllocation: "Loading...",
    initialPrice: "Loading...",
    marketCap: "Loading...",
    liquidityLockPeriod: "Loading...",
    networkType: "Loading...",
    tokenType: "Loading...",
    decimals: null,
    address: undefined // Added to match backend structure
  },
  launch: {
    method: "Loading...",
    platforms: [],
    privateSaleStatus: "Loading...",
    publicSaleStatus: "Loading...",
    kycRequired: false,
    minPurchase: "Loading...",
    maxPurchase: "Loading..."
  },
  roadmap: [],
  commands: {}
};

/**
 * Uses the unified WebSocket system
 * Hook for accessing and managing terminal data with real-time updates
 */
export function useTerminalData() {
  const [terminalData, setTerminalData] = useState<TerminalData>(DEFAULT_TERMINAL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const ws = useWebSocket(); // Use the context hook

  const handleMessage = useCallback((message: Partial<WebSocketTerminalMessage>) => {
    try {
      // console.log('[TerminalData WebSocket] Received message:', message); // Keep for debugging if needed
      if (message.type === DDExtendedMessageType.DATA && 
          message.topic === TopicType.TERMINAL && 
          message.subtype === 'terminal' && 
          message.action === DDWebSocketActions.TERMINAL_UPDATE && 
          message.data) {
        const terminalDataFromServer = message.data;
        const processedData: Partial<TerminalData> = { ...terminalDataFromServer };
        setTerminalData(prevData => ({ ...prevData, ...processedData }));
        if (isLoading) setIsLoading(false);
        setLastUpdate(new Date());
        dispatchWebSocketEvent('terminal_data_update', {
          socketType: TopicType.TERMINAL,
          message: 'Received terminal data from WebSocket',
          timestamp: new Date().toISOString(),
          hasContractAddress: !!processedData.token?.address,
          contractRevealed: !!processedData.token?.address,
          updatedFields: Object.keys(processedData)
        });
      }
      if (isLoading && message.type === DDExtendedMessageType.DATA) setIsLoading(false); // Also set loading false on any DATA message for this hook if still loading
    } catch (err) {
      console.error('[TerminalData WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.TERMINAL,
        message: 'Error processing terminal data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Effect for WebSocket listener registration
  useEffect(() => {
    if (ws && ws.registerListener) {
      const unregister = ws.registerListener(
        'terminal-data-hook',
        [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
        handleMessage,
        [TopicType.TERMINAL, TopicType.SYSTEM]
      );
      return unregister;
    }
  }, [ws, handleMessage]);

  // Subscribe and request initial terminal data when WebSocket is connected
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    // Terminal data is often public, so using ws.isConnected. Change to ws.isReadyForSecureInteraction if auth is required.
    if (ws.isConnected && isLoading) {
      console.log('[useTerminalData] WebSocket connected. Subscribing and requesting terminal data.');
      ws.subscribe([TopicType.TERMINAL]);
      ws.request(TopicType.TERMINAL, DDWebSocketActions.GET_DATA);
      dispatchWebSocketEvent('terminal_data_subscribe', {
        socketType: TopicType.TERMINAL,
        message: 'Subscribing to terminal data',
        timestamp: new Date().toISOString()
      });
      
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[TerminalData WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
    } else if (!ws.isConnected && isLoading) {
      console.log('[useTerminalData] WebSocket not connected, deferring setup.');
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [ws.isConnected, ws.subscribe, ws.request, isLoading]);

  const refreshTerminalData = useCallback(() => {
    // Use ws.isConnected for refresh as well, assuming public data.
    if (!ws.isConnected) {
      console.warn('[TerminalData WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false); // Ensure loading is set to false if we can't refresh
      return;
    }
    setIsLoading(true);
    ws.request(TopicType.TERMINAL, DDWebSocketActions.GET_DATA);
    dispatchWebSocketEvent('terminal_data_refresh', {
      socketType: TopicType.TERMINAL,
      message: 'Refreshing terminal data',
      timestamp: new Date().toISOString()
    });
    
    const timeoutId = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 10000);
    return () => clearTimeout(timeoutId); // Return cleanup for this timeout

  }, [ws.isConnected, ws.request, isLoading]); // isLoading is a dependency

  return {
    terminalData,
    isLoading,
    isConnected: ws.isConnected,
    isReadyForSecureInteraction: ws.isReadyForSecureInteraction, // Expose for potential conditional actions by consumer
    error: ws.connectionError, // Use connectionError
    lastUpdate,
    refreshTerminalData,
    contractAddress: terminalData.token?.address,
    contractAddressRevealed: !!terminalData.token?.address
  };
}

