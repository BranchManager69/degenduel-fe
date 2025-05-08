import { useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import {
  DDWebSocketActions,
  DDWebSocketLaunchAddressRevealedPayload,
  DDWebSocketLaunchDataMessage,
  DDWebSocketTopic
} from '../../../websocket-types-implementation'; // Adjust path if needed
import { DDExtendedMessageType } from '../types';

/**
 * Hook to subscribe to launch events, specifically contract address reveal.
 */
export const useLaunchEvent = () => {
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [revealTime, setRevealTime] = useState<string | null>(null);
  const ws = useWebSocket();

  useEffect(() => {
    // Define the message handler
    const handleMessage = (message: DDWebSocketLaunchDataMessage | any) => {
      // Check if it's the correct topic, type, and potentially action
      if (
        message.topic === DDWebSocketTopic.LAUNCH_EVENTS &&
        message.type === DDExtendedMessageType.DATA && 
        message.action === DDWebSocketActions.ADDRESS_REVEALED &&
        message.data
      ) {
        const payload = message.data as DDWebSocketLaunchAddressRevealedPayload;
        console.log('[useLaunchEvent] Received ADDRESS_REVEALED:', payload);
        setContractAddress(payload.contractAddress);
        setRevealTime(payload.revealTime);
      }
    };

    let unregister: (() => void) | null = null;
    let isSubscribed = false;

    // Subscribe when connected
    if (ws.isConnected) {
      console.log('[useLaunchEvent] Subscribing to:', DDWebSocketTopic.LAUNCH_EVENTS);
      // Register listener first
      unregister = ws.registerListener(
        'launch-event-listener', 
        [DDExtendedMessageType.DATA], // Use extended type here
        handleMessage,
        [DDWebSocketTopic.LAUNCH_EVENTS] // Filter by topic
      );
      // Attempt subscription
      isSubscribed = ws.subscribe([DDWebSocketTopic.LAUNCH_EVENTS]);
      if (!isSubscribed) {
          console.error('[useLaunchEvent] Failed to send subscribe request.');
          // Unregister listener if subscribe call failed immediately
          unregister?.();
          unregister = null;
      }
    }

    // Cleanup function
    return () => {
      // Unregister listener
      unregister?.();
      // Unsubscribe only if we successfully subscribed
      if (isSubscribed && ws.isConnected) { // Check connection again on cleanup
        console.log('[useLaunchEvent] Unsubscribing from:', DDWebSocketTopic.LAUNCH_EVENTS);
        ws.unsubscribe([DDWebSocketTopic.LAUNCH_EVENTS]);
      }
    };

  // Re-run effect if WebSocket connection status changes or context object changes
  }, [ws.isConnected, ws.registerListener, ws.subscribe, ws.unsubscribe]); 

  return { contractAddress, revealTime };
}; 