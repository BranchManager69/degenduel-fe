import React from 'react';
import { UnifiedWebSocketStatus } from './index';

/**
 * Test component for the UnifiedWebSocketStatus component
 * Demonstrates different configurations of the status component
 */
export const WebSocketStatusTest: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-dark-300 rounded-lg border border-dark-400">
      <h2 className="text-2xl font-cyber text-brand-400 mb-4">WebSocket Status Tests</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-dark-200 rounded border border-dark-500">
          <h3 className="text-lg font-semibold text-brand-300 mb-2">Default Status</h3>
          <UnifiedWebSocketStatus />
        </div>
        
        <div className="p-4 bg-dark-200 rounded border border-dark-500">
          <h3 className="text-lg font-semibold text-brand-300 mb-2">Token Data Topic</h3>
          <UnifiedWebSocketStatus topic="token-data" />
        </div>
        
        <div className="p-4 bg-dark-200 rounded border border-dark-500">
          <h3 className="text-lg font-semibold text-brand-300 mb-2">Compact Version</h3>
          <div className="flex items-center gap-2">
            <UnifiedWebSocketStatus topic="system" compact={true} />
            <span className="text-gray-400">System Status</span>
          </div>
        </div>
        
        <div className="p-4 bg-dark-200 rounded border border-dark-500">
          <h3 className="text-lg font-semibold text-brand-300 mb-2">No Reconnect Info</h3>
          <UnifiedWebSocketStatus topic="market-data" showReconnectInfo={false} />
        </div>
        
        <div className="p-4 bg-dark-200 rounded border border-dark-500">
          <h3 className="text-lg font-semibold text-brand-300 mb-2">No Last Update Time</h3>
          <UnifiedWebSocketStatus topic="wallet" showLastUpdate={false} />
        </div>
      </div>
    </div>
  );
};

export default WebSocketStatusTest;