// src/hooks/websocket/topic-hooks/useTerminalData.ts

/**
 * useTerminalData Hook - AI Chat Terminal Only
 * @description This hook provides real-time updates for AI chat terminal data ONLY.
 * Contract address reveals and countdown functionality are handled by separate services:
 * - releaseDateService.ts for countdown API
 * - useLaunchEvent.ts for contract reveal WebSocket events
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-14
 * @updated 2025-05-23
 */

import { DDWebSocketActions } from '@branchmanager69/degenduel-shared/dist/types/websocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { ChatTerminalData } from '../../../services/terminalDataService';
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
  data: Partial<ChatTerminalData>;
  timestamp: string;
}

// Default terminal data for AI chat only
const DEFAULT_TERMINAL_DATA: ChatTerminalData = {
  platformName: "DegenDuel",
  platformDescription: "AI Chat Terminal",
  platformStatus: "Connecting to AI chat system...",
  commands: {},
  systemStatus: {}
};

/**
 * Uses the unified WebSocket system
 * Hook for accessing and managing terminal data with real-time updates
 */
export function useTerminalData() {
  const [terminalData, setTerminalData] = useState<ChatTerminalData>(DEFAULT_TERMINAL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const ws = useWebSocket(); // Use the context hook

  const handleMessage = useCallback((message: Partial<WebSocketTerminalMessage>) => {
    try {
      // console.log('[TerminalData WebSocket] Received AI chat message:', message); // Keep for debugging if needed
      if (message.type === DDExtendedMessageType.DATA && 
          message.topic === TopicType.TERMINAL && 
          message.subtype === 'terminal' && 
          message.action === DDWebSocketActions.TERMINAL_UPDATE && 
          message.data) {
        
        // Only process AI chat related fields, ignore token/launch data
        const chatDataFromServer = message.data;
        const processedChatData: Partial<ChatTerminalData> = {
          platformName: chatDataFromServer.platformName || terminalData.platformName,
          platformDescription: chatDataFromServer.platformDescription || terminalData.platformDescription,
          platformStatus: chatDataFromServer.platformStatus || terminalData.platformStatus,
          commands: chatDataFromServer.commands || terminalData.commands,
          systemStatus: chatDataFromServer.systemStatus || terminalData.systemStatus
        };
        
        setTerminalData(prevData => ({ ...prevData, ...processedChatData }));
        if (isLoading) setIsLoading(false);
        setLastUpdate(new Date());
        
        dispatchWebSocketEvent('terminal_data_update', {
          socketType: TopicType.TERMINAL,
          message: 'Received AI chat terminal data from WebSocket',
          timestamp: new Date().toISOString(),
          updatedFields: Object.keys(processedChatData)
        });
      }
      if (isLoading && message.type === DDExtendedMessageType.DATA) setIsLoading(false);
    } catch (err) {
      console.error('[TerminalData WebSocket] Error processing AI chat message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.TERMINAL,
        message: 'Error processing AI chat terminal data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading, terminalData]);

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
    if (ws.isConnected && !isSubscribedRef.current) {
      console.log('[useTerminalData] WebSocket connected. Subscribing to AI chat terminal data.');
      ws.subscribe([TopicType.TERMINAL]);
      ws.request(TopicType.TERMINAL, DDWebSocketActions.GET_DATA);
      isSubscribedRef.current = true;
      
      dispatchWebSocketEvent('terminal_data_subscribe', {
        socketType: TopicType.TERMINAL,
        message: 'Subscribing to AI chat terminal data',
        timestamp: new Date().toISOString()
      });
      
      timeoutId = setTimeout(() => {
        console.warn('[TerminalData WebSocket] Timed out waiting for data');
        setIsLoading(false);
      }, 10000);
    } else if (!ws.isConnected) {
      console.log('[useTerminalData] WebSocket not connected, deferring setup.');
      isSubscribedRef.current = false;
    }
    
    return () => { 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [ws.isConnected, ws.subscribe, ws.request]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        ws.unsubscribe([TopicType.TERMINAL]);
        isSubscribedRef.current = false;
      }
    };
  }, [ws.unsubscribe]);

  const refreshTerminalData = useCallback(() => {
    // Use ws.isConnected for refresh as well, assuming public data.
    if (!ws.isConnected) {
      console.warn('[TerminalData WebSocket] Cannot refresh AI chat - WebSocket not connected');
      setIsLoading(false); // Ensure loading is set to false if we can't refresh
      return;
    }
    setIsLoading(true);
    ws.request(TopicType.TERMINAL, DDWebSocketActions.GET_DATA);
    dispatchWebSocketEvent('terminal_data_refresh', {
      socketType: TopicType.TERMINAL,
      message: 'Refreshing AI chat terminal data',
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
    isReadyForSecureInteraction: ws.isReadyForSecureInteraction,
    error: ws.connectionError,
    lastUpdate,
    refreshTerminalData
  };
}

