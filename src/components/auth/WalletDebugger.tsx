// src/components/auth/WalletDebugger.tsx

import React, { useState, useEffect } from 'react';

interface WalletDebugState {
  phantomInstalled: boolean;
  isPhantomConnected: boolean;
  publicKey: string | null;
  lastError: string | null;
  apiUrl: string;
  walletEvents: Array<{
    type: string;
    timestamp: string;
    data?: any;
  }>;
}

const WalletDebugger: React.FC = () => {
  const [debugState, setDebugState] = useState<WalletDebugState>({
    phantomInstalled: false,
    isPhantomConnected: false,
    publicKey: null,
    lastError: null,
    apiUrl: '',
    walletEvents: []
  });
  
  const [expanded, setExpanded] = useState(true);
  
  // Add a wallet event to the log
  const logWalletEvent = (type: string, data?: any) => {
    setDebugState(prev => ({
      ...prev,
      walletEvents: [
        {
          type,
          timestamp: new Date().toISOString(),
          data
        },
        ...prev.walletEvents.slice(0, 19) // Keep only the last 20 events
      ]
    }));
  };
  
  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantom = () => {
      const { solana } = window as any;
      
      const phantomInstalled = !!solana?.isPhantom;
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      
      setDebugState(prev => ({
        ...prev,
        phantomInstalled,
        apiUrl
      }));
      
      logWalletEvent('INIT', { phantomInstalled });
      
      if (phantomInstalled) {
        // Check if already connected
        if (solana.isConnected) {
          setDebugState(prev => ({
            ...prev,
            isPhantomConnected: true,
            publicKey: solana.publicKey?.toString() || null
          }));
          
          logWalletEvent('CONNECTED', { publicKey: solana.publicKey?.toString() });
        }
        
        // Add event listeners
        solana.on('connect', () => {
          const publicKey = solana.publicKey?.toString() || null;
          setDebugState(prev => ({
            ...prev,
            isPhantomConnected: true,
            publicKey
          }));
          
          logWalletEvent('CONNECT', { publicKey });
        });
        
        solana.on('disconnect', () => {
          setDebugState(prev => ({
            ...prev,
            isPhantomConnected: false,
            publicKey: null
          }));
          
          logWalletEvent('DISCONNECT');
        });
        
        solana.on('accountChanged', (publicKey: any) => {
          setDebugState(prev => ({
            ...prev,
            publicKey: publicKey?.toString() || null
          }));
          
          logWalletEvent('ACCOUNT_CHANGED', { publicKey: publicKey?.toString() });
        });
      }
    };
    
    checkPhantom();
    
    return () => {
      // Clean up event listeners
      const { solana } = window as any;
      if (solana?.isPhantom) {
        solana.removeAllListeners('connect');
        solana.removeAllListeners('disconnect');
        solana.removeAllListeners('accountChanged');
      }
    };
  }, []);
  
  // Manual connect function
  const handleManualConnect = async () => {
    try {
      const { solana } = window as any;
      
      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not installed');
      }
      
      logWalletEvent('MANUAL_CONNECT_ATTEMPT');
      
      const response = await solana.connect();
      const publicKey = response.publicKey.toString();
      
      setDebugState(prev => ({
        ...prev,
        isPhantomConnected: true,
        publicKey,
        lastError: null
      }));
      
      logWalletEvent('MANUAL_CONNECT_SUCCESS', { publicKey });
    } catch (error: any) {
      setDebugState(prev => ({
        ...prev,
        lastError: error.message
      }));
      
      logWalletEvent('MANUAL_CONNECT_ERROR', { error: error.message });
    }
  };
  
  // Test nonce function
  const testNonce = async () => {
    if (!debugState.publicKey) {
      setDebugState(prev => ({
        ...prev,
        lastError: 'Wallet not connected'
      }));
      return;
    }
    
    try {
      logWalletEvent('NONCE_REQUEST_ATTEMPT', { wallet: debugState.publicKey });
      
      const response = await fetch(`${debugState.apiUrl}/auth/challenge?wallet=${debugState.publicKey}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const status = response.status;
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(`Server returned ${status}: ${JSON.stringify(responseData)}`);
      }
      
      logWalletEvent('NONCE_REQUEST_SUCCESS', { 
        status, 
        response: responseData 
      });
      
      setDebugState(prev => ({
        ...prev,
        lastError: null
      }));
    } catch (error: any) {
      logWalletEvent('NONCE_REQUEST_ERROR', { error: error.message });
      
      setDebugState(prev => ({
        ...prev,
        lastError: error.message
      }));
    }
  };
  
  // Test signature function
  const testSignature = async () => {
    if (!debugState.publicKey) {
      setDebugState(prev => ({
        ...prev,
        lastError: 'Wallet not connected'
      }));
      return;
    }
    
    try {
      const { solana } = window as any;
      
      // Create test message
      const message = `DegenDuel Test Signature\nWallet: ${debugState.publicKey}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      logWalletEvent('SIGN_MESSAGE_ATTEMPT', { message });
      
      // Request signature
      const signedMessage = await solana.signMessage(encodedMessage, 'utf8');
      
      logWalletEvent('SIGN_MESSAGE_SUCCESS', { 
        signature: Array.from(signedMessage.signature).slice(0, 10) + '...',
        message 
      });
      
      setDebugState(prev => ({
        ...prev,
        lastError: null
      }));
    } catch (error: any) {
      logWalletEvent('SIGN_MESSAGE_ERROR', { error: error.message });
      
      setDebugState(prev => ({
        ...prev,
        lastError: error.message
      }));
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="mt-8 max-w-2xl mx-auto rounded-lg border border-brand-500/30 bg-dark-200/80 backdrop-blur-md overflow-hidden">
      <div 
        className="p-3 bg-dark-300/50 flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h3 className="text-brand-300 font-cyber">Wallet Debug Panel</h3>
        <span className="text-gray-400">
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && (
        <div className="p-4">
          {/* Status Section */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="bg-dark-300/30 p-3 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Phantom Status</h4>
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugState.phantomInstalled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">{debugState.phantomInstalled ? 'Installed' : 'Not Installed'}</span>
              </div>
              <div className="flex items-center mt-1">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugState.isPhantomConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-sm">{debugState.isPhantomConnected ? 'Connected' : 'Not Connected'}</span>
              </div>
            </div>
            
            <div className="bg-dark-300/30 p-3 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Connection Info</h4>
              <div className="flex items-center">
                <span className="text-sm text-gray-300">Public Key:</span>
                <span className="text-xs ml-2 font-mono text-brand-300 truncate">
                  {debugState.publicKey ? 
                    `${debugState.publicKey.slice(0, 6)}...${debugState.publicKey.slice(-4)}` : 
                    'None'
                  }
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-300">API URL:</span>
                <span className="text-xs ml-2 font-mono text-brand-300 truncate">{debugState.apiUrl}</span>
              </div>
            </div>
          </div>
          
          {/* Manual Test Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={handleManualConnect}
              className="px-3 py-1.5 bg-brand-500 text-white text-sm rounded hover:bg-brand-600"
            >
              Manual Connect
            </button>
            <button 
              onClick={testNonce}
              disabled={!debugState.publicKey}
              className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Nonce
            </button>
            <button 
              onClick={testSignature}
              disabled={!debugState.publicKey}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Signature
            </button>
          </div>
          
          {/* Last Error */}
          {debugState.lastError && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded mb-4">
              <h4 className="text-sm text-red-400 mb-1">Last Error</h4>
              <p className="text-xs font-mono text-red-300">{debugState.lastError}</p>
            </div>
          )}
          
          {/* Event Log */}
          <div>
            <h4 className="text-sm text-gray-400 mb-1">Event Log</h4>
            <div className="bg-dark-300/50 rounded p-2 max-h-40 overflow-y-auto">
              {debugState.walletEvents.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-1">No events yet</p>
              ) : (
                debugState.walletEvents.map((event, index) => (
                  <div key={index} className="text-xs border-b border-dark-400/30 p-1 last:border-0">
                    <span className="inline-block w-24 font-mono text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span className={`inline-block w-28 font-medium ${
                      event.type.includes('ERROR') ? 'text-red-400' : 
                      event.type.includes('SUCCESS') ? 'text-green-400' : 
                      'text-brand-300'
                    }`}>{event.type}</span>
                    {event.data && (
                      <span className="font-mono text-gray-400">{
                        JSON.stringify(event.data).substring(0, 60) + 
                        (JSON.stringify(event.data).length > 60 ? '...' : '')
                      }</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDebugger;