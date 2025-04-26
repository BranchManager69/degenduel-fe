import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";

/**
 * Visual Tester component for triggering test animations and layout changes
 * without affecting backend data
 */
export const VisualTester: React.FC = () => {
  // Test states
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testEvents, setTestEvents] = useState<Array<{id: string, name: string, timestamp: string}>>([]);
  
  // Track global event handler
  const [testEventListener, setTestEventListener] = useState<CustomEvent | null>(null);
  
  // Test actions
  const triggerTest = (testName: string) => {
    // Log test event
    const newEvent = {
      id: Math.random().toString(36).substring(2),
      name: testName,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestEvents(prev => [newEvent, ...prev].slice(0, 5));
    
    // Set active test to show visual indicator
    setActiveTest(testName);
    
    // Clear active test after a delay
    setTimeout(() => {
      setActiveTest(null);
    }, 3000);
    
    // Create and dispatch a custom event that components can listen for
    const testEvent = new CustomEvent('degen-visual-test', { 
      detail: { 
        testName,
        timestamp: new Date().toISOString()
      }
    });
    
    // Save the event for reference
    setTestEventListener(testEvent);
    
    // Dispatch the event
    window.dispatchEvent(testEvent);
  };
  
  // Test cases
  const testCases = [
    { name: 'leaderboardShift', label: 'Test Leaderboard Position Shifts' },
    { name: 'priceChange', label: 'Test Price Change Animation' },
    { name: 'flashCelebration', label: 'Flash Celebration Effect' },
    { name: 'aiMessage', label: 'Trigger AI Message' },
    { name: 'walletBalanceUpdate', label: 'Wallet Balance Update' },
    { name: 'portfolioJump', label: 'Portfolio Value Jump' },
    { name: 'networkLag', label: 'Simulate Network Lag' },
  ];
  
  return (
    <div className="fixed bottom-6 left-6 z-50">
      {!showTestPanel ? (
        <motion.button
          onClick={() => setShowTestPanel(true)}
          className="bg-gray-800/80 backdrop-blur-sm border border-brand-500/30 text-brand-400 p-3 rounded-full shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-80"
        >
          <Card className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <h3 className="text-sm font-semibold text-brand-300">Visual Test Panel</h3>
              <button
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              <div className="text-xs text-gray-400 mb-2">
                Trigger visual tests without affecting backend data
              </div>
              
              <div className="space-y-2">
                {testCases.map((test) => (
                  <Button 
                    key={test.name}
                    onClick={() => triggerTest(test.name)}
                    className={`w-full justify-start text-sm ${
                      activeTest === test.name
                        ? 'bg-brand-500 text-white'
                        : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
                    }`}
                  >
                    {test.label}
                    {activeTest === test.name && (
                      <span className="ml-2 text-xs bg-white/20 px-1 rounded">
                        Running...
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              
              {testEvents.length > 0 && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Tests</h4>
                  <div className="space-y-1">
                    {testEvents.map((event) => (
                      <div key={event.id} className="text-xs flex justify-between">
                        <span className="text-gray-300">{event.name}</span>
                        <span className="text-gray-500">{event.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                <p>Event listeners: {testEventListener ? 'Active' : 'None'}</p>
                <p className="text-red-400">
                  Tests only affect UI and don't modify data
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

// Custom hook for components to listen to test events
export const useVisualTester = (testName: string, callback: () => void) => {
  React.useEffect(() => {
    const handleTestEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.testName === testName) {
        callback();
      }
    };
    
    window.addEventListener('degen-visual-test', handleTestEvent as EventListener);
    
    return () => {
      window.removeEventListener('degen-visual-test', handleTestEvent as EventListener);
    };
  }, [testName, callback]);
};