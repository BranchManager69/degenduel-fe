/**
 * useTokenProfiles Hook
 * 
 * V69 Standardized WebSocket Hook for DexScreener Token Profiles
 * This hook provides real-time updates for newly discovered tokens from DexScreener
 * 
 * @author Branch Manager
 * @created 2025-05-29
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';

// Define token profile interface based on backend API documentation
export interface TokenProfile {
  tokenAddress: string;
  chainId: string;
  url: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: {
    type: string;
    label: string;
    url: string;
  }[];
  timestamp: string;
  discoveredAt: Date;
}

// Define the WebSocket message structure for token profiles
interface WebSocketTokenProfileMessage {
  type: DDExtendedMessageType;
  topic: string; // 'token-profiles'
  action: string; // 'NEW_PROFILE'
  data: Omit<TokenProfile, 'discoveredAt'>;
  timestamp: string;
}

/**
 * Hook for accessing real-time token profile discoveries from DexScreener
 * Uses the unified WebSocket system
 */
export function useTokenProfiles() {
  // State
  const [profiles, setProfiles] = useState<TokenProfile[]>([]);
  const [latestProfile, setLatestProfile] = useState<TokenProfile | null>(null);
  const [totalDiscovered, setTotalDiscovered] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Message handler
  const handleMessage = useCallback((message: Partial<WebSocketTokenProfileMessage>) => {
    try {
      // Check if this is a valid token profile message
      if (message.type === DDExtendedMessageType.DATA && 
          message.topic === 'token-profiles' && 
          message.action === 'NEW_PROFILE' && 
          message.data) {
        
        // Transform backend data to frontend format
        const newProfile: TokenProfile = {
          ...message.data,
          discoveredAt: new Date(message.timestamp || new Date().toISOString())
        };
        
        // Update profiles state (keep last 100 for memory efficiency)
        setProfiles(prevProfiles => {
          const updated = [newProfile, ...prevProfiles];
          return updated.slice(0, 100); // Keep only latest 100
        });
        
        // Update latest profile
        setLatestProfile(newProfile);
        
        // Update total count
        setTotalDiscovered(prev => prev + 1);
        
        // Log event for monitoring
        dispatchWebSocketEvent('token_profile_discovered', {
          socketType: 'token-profiles',
          message: `New token profile discovered: ${newProfile.tokenAddress}`,
          timestamp: new Date().toISOString(),
          data: newProfile
        });

        console.log('[TokenProfiles] New token discovered:', {
          address: newProfile.tokenAddress,
          chain: newProfile.chainId,
          description: newProfile.description,
          url: newProfile.url
        });
      }

      // Handle subscription acknowledgments
      if (message.type === DDExtendedMessageType.ACKNOWLEDGMENT &&
          message.topic === 'token-profiles') {
        setIsSubscribed(true);
        console.log('[TokenProfiles] Successfully subscribed to token profiles');
      }
      
    } catch (err) {
      console.error('[TokenProfiles WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: 'token-profiles',
        message: 'Error processing token profile data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'token-profiles-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.ACKNOWLEDGMENT],
    handleMessage,
    ['token-profiles']
  );

  // Subscribe to token profiles when connected
  useEffect(() => {
    if (ws.isConnected && !isSubscribed) {
      // Subscribe to token profiles topic
      const success = ws.sendMessage({
        type: DDExtendedMessageType.SUBSCRIBE,
        topic: 'token-profiles',
        action: 'subscribe'
      });

      if (success) {
        dispatchWebSocketEvent('token_profiles_subscribe', {
          socketType: 'token-profiles',
          message: 'Subscribing to token profiles',
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [ws.isConnected, isSubscribed, ws.sendMessage]);

  // Unsubscribe when component unmounts or connection lost
  useEffect(() => {
    return () => {
      if (ws.isConnected && isSubscribed) {
        ws.sendMessage({
          type: DDExtendedMessageType.UNSUBSCRIBE,
          topic: 'token-profiles',
          action: 'unsubscribe'
        });
      }
    };
  }, [ws.isConnected, isSubscribed, ws.sendMessage]);

  // Clear profiles function
  const clearProfiles = useCallback(() => {
    setProfiles([]);
    setLatestProfile(null);
    setTotalDiscovered(0);
  }, []);

  // Get profiles by chain
  const getProfilesByChain = useCallback((chainId: string) => {
    return profiles.filter(profile => profile.chainId === chainId);
  }, [profiles]);

  // Get recent profiles (last N)
  const getRecentProfiles = useCallback((count: number = 10) => {
    return profiles.slice(0, count);
  }, [profiles]);

  // Return data and helper functions
  return {
    profiles,
    latestProfile,
    totalDiscovered,
    isSubscribed,
    isConnected: ws.isConnected,
    error: ws.error,
    clearProfiles,
    getProfilesByChain,
    getRecentProfiles,
    
    // Stats
    stats: {
      totalDiscovered,
      profilesInMemory: profiles.length,
      chainsDiscovered: [...new Set(profiles.map(p => p.chainId))].length,
      lastDiscoveredAt: latestProfile?.discoveredAt || null
    }
  };
}