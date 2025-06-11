// src/components/debug/websocket/AuthStateDebugger.tsx

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { useMigratedAuth } from '../../../hooks/auth/useMigratedAuth';

/**
 * Non-invasive debug component to help identify ghost authentication states
 * Shows when frontend auth and WebSocket auth are out of sync
 */
export const AuthStateDebugger: React.FC<{ enabled?: boolean }> = ({ enabled = false }) => {
  const ws = useWebSocket();
  const { isAuthenticated: frontendAuth, user } = useMigratedAuth();
  const [ghostAuthDetected, setGhostAuthDetected] = useState(false);
  const [lastGhostAuthTime, setLastGhostAuthTime] = useState<Date | null>(null);

  // Check for ghost auth states
  useEffect(() => {
    if (!enabled) return;

    const hasGhostAuth = frontendAuth && ws.isConnected && !ws.isReadyForSecureInteraction;
    
    if (hasGhostAuth && !ghostAuthDetected) {
      setGhostAuthDetected(true);
      setLastGhostAuthTime(new Date());
      console.error('🚨 GHOST AUTH DETECTED at', new Date().toISOString());
    } else if (!hasGhostAuth && ghostAuthDetected) {
      setGhostAuthDetected(false);
      console.log('✅ Ghost auth resolved at', new Date().toISOString());
    }
  }, [enabled, frontendAuth, ws.isConnected, ws.isReadyForSecureInteraction, ghostAuthDetected]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono border border-gray-600 max-w-sm">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      
      <div className="space-y-1">
        <div className={`${frontendAuth ? 'text-green-400' : 'text-red-400'}`}>
          Frontend: {frontendAuth ? '✅ Auth' : '❌ Not Auth'}
        </div>
        <div className={`${ws.isConnected ? 'text-green-400' : 'text-red-400'}`}>
          WS Connected: {ws.isConnected ? '✅' : '❌'}
        </div>
        <div className={`${ws.isReadyForSecureInteraction ? 'text-green-400' : 'text-red-400'}`}>
          WS Secure: {ws.isReadyForSecureInteraction ? '✅' : '❌'}
        </div>
        
        {ghostAuthDetected && (
          <div className="bg-red-600 px-2 py-1 rounded mt-2">
            🚨 GHOST AUTH ACTIVE
          </div>
        )}
        
        {lastGhostAuthTime && (
          <div className="text-gray-400 mt-2">
            Last detected: {lastGhostAuthTime.toLocaleTimeString()}
          </div>
        )}
        
        {user && (
          <div className="text-gray-400 mt-2">
            User: {user.wallet_address?.slice(0, 8)}...
          </div>
        )}
      </div>
    </div>
  );
}; 