/**
 * useTerminalData Hook
 * 
 * V69 Standardized WebSocket Hook for Terminal Data
 * This hook provides real-time updates for terminal data, including contract address
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';
import { TerminalData } from '../../../services/terminalDataService';

// Define the standard structure for terminal data updates from the server
// Based on backend team's specification
// This interface describes the message format from the backend
interface WebSocketTerminalMessage {
  type: string; // 'DATA'
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
 * Hook for accessing and managing terminal data with real-time updates
 * Uses the unified WebSocket system
 */
export function useTerminalData() {
  // State for terminal data
  const [terminalData, setTerminalData] = useState<TerminalData>(DEFAULT_TERMINAL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketTerminalMessage>) => {
    try {
      console.log('[TerminalData WebSocket] Received message:', message);
      
      // Check if this is a valid terminal data message based on backend team's format
      if (message.type === 'DATA' && 
          message.topic === 'terminal' && 
          message.subtype === 'terminal' && 
          message.action === 'update' && 
          message.data) {
        
        // Handle data from the server
        const terminalDataFromServer = message.data;
        
        // Use the data directly without trying to maintain compatibility with old fields
        // The backend sends token.address for the contract address - this is the only source of truth
        const processedData: Partial<TerminalData> = {
          ...terminalDataFromServer
        };
        
        // Update terminal data state
        setTerminalData(prevData => ({
          ...prevData,
          ...processedData
        }));
        
        // Update status and timestamp
        setIsLoading(false);
        setLastUpdate(new Date());
        
        // Log event for monitoring
        dispatchWebSocketEvent('terminal_data_update', {
          socketType: TopicType.TERMINAL,
          message: 'Received terminal data from WebSocket',
          timestamp: new Date().toISOString(),
          hasContractAddress: !!processedData.token?.address,
          contractRevealed: !!processedData.token?.address,
          updatedFields: Object.keys(processedData)
        });
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[TerminalData WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.TERMINAL,
        message: 'Error processing terminal data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to the unified WebSocket system
  const ws = useUnifiedWebSocket(
    'terminal-data-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.TERMINAL, TopicType.SYSTEM] // System messages are always included for all hooks
  );

  // Subscribe to terminal data when the WebSocket is connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to terminal data topic
      ws.subscribe([TopicType.TERMINAL]);
      
      // Request initial terminal data
      ws.request(TopicType.TERMINAL, 'GET_TERMINAL_DATA');
      
      dispatchWebSocketEvent('terminal_data_subscribe', {
        socketType: TopicType.TERMINAL,
        message: 'Subscribing to terminal data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[TerminalData WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Force refresh function for terminal data
  const refreshTerminalData = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh terminal data
      ws.request(TopicType.TERMINAL, 'GET_TERMINAL_DATA');
      
      dispatchWebSocketEvent('terminal_data_refresh', {
        socketType: TopicType.TERMINAL,
        message: 'Refreshing terminal data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[TerminalData WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);

  // Return the terminal data and helper functions
  return {
    terminalData,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshTerminalData,
    // Contract address specific helpers - now from token.address
    contractAddress: terminalData.token?.address,
    contractAddressRevealed: !!terminalData.token?.address
  };
}

