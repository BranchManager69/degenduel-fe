// src/pages/admin/TokenSyncTest.tsx

/**
 * DADDIOS Test Page
 * 
 * @description Test page for the new DADDIOS (Advanced Token Tracking Monitor) component
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-26
 */

import React, { useRef } from 'react';
import DynamicUIManager, { triggerUIAction } from '../../components/dynamic/DynamicUIManager';
import { Button } from '../../components/ui/Button';

const TokenSyncTest: React.FC = () => {
  const dynamicUIRef = useRef<any>(null);

  const testDaddiosWidget = () => {
    // Test the widget in different placements
    triggerUIAction({
      type: 'create_component',
      component: 'token_tracking_monitor',
      id: 'token-sync-test',
      placement: 'below_terminal',
      title: 'DADDIOS - Advanced Token Tracking Monitor',
      closeable: true,
      data: {
        // Mock data for testing - the component will show this if no WebSocket data
        tokens: [
          { id: '1', address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', failures: 0, status: 'healthy', lastUpdated: new Date(), queuedForInactive: false },
          { id: '2', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'BONK', failures: 2, status: 'warning', lastUpdated: new Date(), queuedForInactive: false },
          { id: '3', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', failures: 4, status: 'critical', lastUpdated: new Date(), queuedForInactive: true },
          { id: '4', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', failures: 6, status: 'inactive', lastUpdated: new Date(), queuedForInactive: false },
        ]
      }
    });
  };

  const testModal = () => {
    triggerUIAction({
      type: 'create_component',
      component: 'token_tracking_monitor',
      id: 'daddios-modal',
      placement: 'modal',
      title: 'DADDIOS (Modal)',
      closeable: true
    });
  };

  const testSidebar = () => {
    triggerUIAction({
      type: 'create_component',
      component: 'token_tracking_monitor',
      id: 'daddios-sidebar',
      placement: 'sidebar_right',
      title: 'DADDIOS (Sidebar)',
      closeable: true
    });
  };

  const testFloating = () => {
    triggerUIAction({
      type: 'create_component',
      component: 'token_tracking_monitor',
      id: 'daddios-floating',
      placement: 'floating',
      title: 'DADDIOS (Floating)',
      closeable: true
    });
  };

  const clearAll = () => {
    if (dynamicUIRef.current) {
      dynamicUIRef.current.clearAllComponents();
    }
  };

  return (
    <div className="min-h-screen bg-darkGrey-dark p-6">
      {/* Dynamic UI Manager */}
      <DynamicUIManager ref={dynamicUIRef} />
      
      {/* Test Controls */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-darkGrey-dark/50 border border-mauve/30 rounded-lg p-6">
          <h1 className="text-2xl font-mono font-bold text-white mb-6">
            DADDIOS Test Page
          </h1>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Button onClick={testDaddiosWidget} className="w-full">
              Test Below Terminal
            </Button>
            <Button onClick={testModal} variant="secondary" className="w-full">
              Test Modal
            </Button>
            <Button onClick={testSidebar} variant="secondary" className="w-full">
              Test Sidebar
            </Button>
            <Button onClick={testFloating} variant="secondary" className="w-full">
              Test Floating
            </Button>
            <Button onClick={clearAll} variant="danger" className="w-full">
              Clear All
            </Button>
          </div>

          <div className="bg-darkGrey/30 p-4 rounded border border-mauve/20">
            <h3 className="font-mono font-semibold text-white mb-2">DADDIOS Test Instructions:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Below Terminal</strong>: Creates DADDIOS widget below this area</li>
              <li>• <strong>Modal</strong>: Opens DADDIOS in overlay modal</li>
              <li>• <strong>Sidebar</strong>: Opens DADDIOS in right sidebar</li>
              <li>• <strong>Floating</strong>: Creates floating DADDIOS widget in top-right</li>
              <li>• <strong>Clear All</strong>: Removes all active widgets</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-400/30 rounded">
              <p className="text-sm text-blue-300">
                <strong>DADDIOS Status:</strong> If connected to backend, you'll see real token tracking data. 
                Otherwise, you'll see mock data to test the UI functionality.
              </p>
            </div>
            
            <div className="mt-2 p-3 bg-green-900/20 border border-green-400/30 rounded">
              <p className="text-sm text-green-300">
                <strong>AI Integration:</strong> You can also say "open DADDIOS" or "show token tracking system" in the AI terminal!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSyncTest;