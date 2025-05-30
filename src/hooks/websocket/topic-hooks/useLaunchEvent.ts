import { useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import {
  DDWebSocketActions,
  DDWebSocketLaunchAddressRevealedPayload,
  DDWebSocketLaunchDataMessage,
  DDWebSocketTopic
} from '../../../websocket-types-implementation'; // Adjust path if needed
import { DDExtendedMessageType } from '../types';

// Countdown data interfaces matching the API response
interface TokenInfo {
  id: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  raw_supply: number;
  price: string | null;
  market_cap: number | null;
  volume_24h: number | null;
  fdv: number | null;
  liquidity: number | null;
  change_24h: number | null;
}

interface TokenConfig {
  symbol: string;
  address: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total_seconds: number;
}

interface CountdownData {
  enabled: boolean;
  end_time: string | null;
  title: string;
  message: string;
  redirect_url: string | null;
  token_address: string | null;
  token_info: TokenInfo | null;
  token_config: TokenConfig | null;
  countdown: CountdownTime | null;
}

/**
 * Hook to subscribe to launch events, including contract address reveal and countdown data.
 */
export const useLaunchEvent = () => {
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [revealTime, setRevealTime] = useState<string | null>(null);
  const [countdownData, setCountdownData] = useState<CountdownData | null>(null);
  const ws = useWebSocket();

  useEffect(() => {
    // Define the message handler
    const handleMessage = (message: DDWebSocketLaunchDataMessage | any) => {
      // Handle launch events (contract address reveal)
      if (message.topic === DDWebSocketTopic.LAUNCH_EVENTS && message.type === DDExtendedMessageType.DATA && message.data) {
        if (message.action === DDWebSocketActions.ADDRESS_REVEALED) {
          const payload = message.data as DDWebSocketLaunchAddressRevealedPayload;
          console.log('[useLaunchEvent] Received ADDRESS_REVEALED:', payload);
          setContractAddress(payload.contractAddress);
          setRevealTime(payload.revealTime);
        }
      }
      
      // Handle countdown data from SYSTEM topic
      if (message.topic === DDWebSocketTopic.SYSTEM && message.type === DDExtendedMessageType.DATA && message.data) {
        if (message.action === 'COUNTDOWN_UPDATE' || message.action === 'COUNTDOWN_DATA') {
          const payload = message.data as CountdownData;
          console.log('[useLaunchEvent] Received countdown data from SYSTEM topic:', payload);
          setCountdownData(payload);
        }
      }
    };

    let unregister: (() => void) | null = null;

    // Subscribe when WebSocket is connected
    if (ws.isConnected && ws.registerListener && ws.subscribe) {
      console.log('[useLaunchEvent] WebSocket connected. Subscribing to LAUNCH_EVENTS and SYSTEM topics');
      unregister = ws.registerListener(
        'launch-event-listener', 
        [DDExtendedMessageType.DATA],
        handleMessage,
        [DDWebSocketTopic.LAUNCH_EVENTS, DDWebSocketTopic.SYSTEM]
      );
      
      // Subscribe to both topics
      const launchEventsSubscribed = ws.subscribe([DDWebSocketTopic.LAUNCH_EVENTS]);
      const systemSubscribed = ws.subscribe([DDWebSocketTopic.SYSTEM]);
      
      if (!launchEventsSubscribed || !systemSubscribed) {
          console.error('[useLaunchEvent] Failed to send subscribe request.');
          unregister?.(); // Important: cleanup listener if subscribe fails
          unregister = null;
      } else {
        // Request initial countdown data from SYSTEM topic
        if (ws.request) {
          console.log('[useLaunchEvent] Requesting initial countdown data from SYSTEM topic');
          ws.request(DDWebSocketTopic.SYSTEM, 'GET_COUNTDOWN_DATA', {});
        }
      }
    } else if (!ws.isConnected) {
      console.log('[useLaunchEvent] WebSocket not connected, deferring subscription.');
    }

    // Cleanup function
    return () => {
      // Unregister listener
      unregister?.();
      // Unsubscribe from both topics
      if (ws.isConnected && ws.unsubscribe) {
        console.log('[useLaunchEvent] Unsubscribing from LAUNCH_EVENTS and SYSTEM topics');
        ws.unsubscribe([DDWebSocketTopic.LAUNCH_EVENTS, DDWebSocketTopic.SYSTEM]);
      }
    };

  // Re-run effect only when connection status changes (stable function refs now)
  }, [ws.isConnected]); 

  return { 
    contractAddress, 
    revealTime, 
    countdownData,
    isConnected: ws.isConnected 
  };
}; 