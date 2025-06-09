/** @type { import('@storybook/react').Preview } */
import React from 'react';
import '../src/index.css';
import { MockAuthProvider, mockedHooks, withAuthMock } from './mockComponents.tsx';

// Force React into development mode if it isn't already
if (process.env.NODE_ENV !== 'development') {
  console.warn('⚠️ React may be running in production mode. Setting NODE_ENV to development.');
  process.env.NODE_ENV = 'development';
}

// Check if React is in production mode and warn
const checkReactMode = () => {
  setTimeout(() => {
    // Use setTimeout to run this after the app has started
    const reactDevModeCheck = typeof React !== 'undefined' && React.version;
    if (reactDevModeCheck) {
      console.log('✅ React version:', React.version);
      console.log('✅ React environment:', process.env.NODE_ENV);
    } else {
      console.warn('⚠️ Could not determine React version or mode');
    }
  }, 1000);
};
checkReactMode();

// No TypeScript declarations in JS files

// Create a decorator for mocking hooks
const withMockedHooks = (Story) => {
  // Mock the TokenDataContext with rich crypto data
  const tokenDataContextValue = {
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
        imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
        imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
        imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.15',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
        imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
      },
      {
        symbol: 'PEPE',
        name: 'Pepe',
        price: '0.00001205',
        marketCap: '5000000000',
        volume24h: '1500000',
        change24h: '15.8',
        imageUrl: 'https://cryptologos.cc/logos/pepe-pepe-logo.png'
      },
      {
        symbol: 'BONK',
        name: 'Bonk',
        price: '0.00000205',
        marketCap: '1200000000',
        volume24h: '750000',
        change24h: '25.3',
        imageUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png'
      },
      {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        price: '0.00001850',
        marketCap: '10900000000',
        volume24h: '480000000',
        change24h: '-3.7',
        imageUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png'
      },
      {
        symbol: 'WIF',
        name: 'Dogwifhat',
        price: '2.35',
        marketCap: '2350000000',
        volume24h: '120000000',
        change24h: '12.4',
        imageUrl: 'https://cryptologos.cc/logos/dogwifhat-wif-logo.png'
      }
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  };

  // Override the useTokenData function
  window.useTokenDataMock = () => tokenDataContextValue;
  window.useStoreMock = () => ({ maintenanceMode: false });
  
  // Mock the context hooks
  // This is a global override that will make all instances of useAuthContext in the app
  // return the mock data instead of trying to access the real context
  window.useAuthContext = () => ({
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isConnecting: false,
    connectWallet: () => console.log('Mock connectWallet called'),
    disconnectWallet: () => console.log('Mock disconnectWallet called'),
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isFullyConnected: () => false,
    checkAuth: () => console.log('Mock checkAuth called'),
    getAccessToken: async () => null
  });
  
  // Mock the Privy Auth hooks
  window.usePrivyAuth = () => ({
    isAuthenticated: false,
    isLoading: false,
    isPrivyLinked: false,
    user: null,
    login: () => console.log('Mock Privy login called'),
    logout: () => console.log('Mock Privy logout called'),
    getAuthToken: async () => null,
    linkPrivyToWallet: async () => {
      console.log('Mock linkPrivyToWallet called');
      return true;
    },
    checkAuthStatus: async () => {}
  });

  // Mock Solana wallet for Blinks stories
  // Using Object.defineProperty instead of direct assignment to avoid read-only errors
  if (!window.solana) {
    Object.defineProperty(window, 'solana', {
      value: {
        isConnected: false,
        publicKey: null,
        connect: async function() {
          console.log('Mock Solana wallet connect called');
          this.isConnected = true;
          this.publicKey = { toString: () => '5Zzguz4NsSRNYJBpPpxNQy8kJrt1JDKEzw' };
          return { publicKey: this.publicKey };
        },
        disconnect: async function() {
          console.log('Mock Solana wallet disconnect called');
          this.isConnected = false;
          this.publicKey = null;
        },
        signAndSendTransaction: async function(transaction) {
          console.log('Mock Solana signAndSendTransaction:', transaction);
          return { signature: 'mock_signature_' + Math.random().toString(36).substring(2, 10) };
        }
      },
      writable: true,
      configurable: true
    });
  }

  // Add global styles for animations needed by components
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ticker animation keyframes */
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          /* Ticker scanning effects */
          @keyframes scan-fast {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          /* Cyber scanning effect animation */
          @keyframes cyber-scan {
            0% { transform: translateY(-100%); }
            50% { transform: translateY(100%); }
            100% { transform: translateY(-100%); }
          }
          
          /* Data stream animation for items */
          @keyframes data-stream {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          
          /* Shine effect for progress bars */
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          /* Add brand and cyber colors */
          :root {
            --color-brand-50: #f3e6ff;
            --color-brand-100: #e5ccff;
            --color-brand-200: #cc99ff;
            --color-brand-300: #b266ff;
            --color-brand-400: #9933ff;
            --color-brand-500: #7f00ff;
            --color-brand-600: #6600cc;
            --color-brand-700: #4c0099;
            --color-brand-800: #330066;
            --color-brand-900: #190033;
            --brand-rgb: 127, 0, 255;
            
            --color-cyber-500: #00e1ff;
            --cyber-rgb: 0, 225, 255;
          }
          
          /* Common animation classes */
          .ticker-animation {
            display: flex !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            width: 100% !important;
          }
          
          /* Shadow effects */
          .shadow-brand {
            box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
          }
          
          .shadow-cyber {
            box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
          }
          
          .animate-shine {
            animation: shine 2s linear infinite;
          }
          
          .animate-cyber-scan {
            animation: cyber-scan 3s linear infinite;
          }
          
          .animate-scan-fast {
            animation: scan-fast 2s linear infinite;
          }
          
          .animate-data-stream {
            animation: data-stream 3s linear infinite;
          }
          
          .bg-dark-200 { background-color: #1e1b2e; }
          .bg-dark-300 { background-color: #2d2a3e; }
          
          .text-brand-400 { color: #9933ff; }
          .text-cyber-400 { color: #00e1ff; }
          .text-yellow-400 { color: #facc15; }
          .text-green-400 { color: #4ade80; }
          .text-red-400 { color: #f87171; }
          
          .border-brand-400 { border-color: #9933ff; }
          .border-brand-500 { border-color: #7f00ff; }
          .border-brand-600 { border-color: #6600cc; }
          
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow-x: auto;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
          }
        `
      }} />
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    </>
  );
};

// Enhanced WebSocket mock for Storybook that provides more intelligence
const setupWebSocketMock = () => {
  if (typeof window !== 'undefined') {
    // Store the original WebSocket constructor
    const originalWebSocket = window.WebSocket;
    
    // Create a more intelligent mock WebSocket constructor
    function MockWebSocket(url) {
      console.log(`[Storybook] WebSocket connection to ${url} mocked`);
      
      // Track the URL to determine which socket this is
      const isSystemSocket = url.includes('/system') || url.includes('/v69');
      const mockSocketType = isSystemSocket ? 'system' : 'unknown';
      
      // These properties are on WebSocket instances
      this.url = url;
      this.readyState = 0; // CONNECTING 
      this.protocol = '';
      this.extensions = '';
      this.binaryType = 'blob';
      this.bufferedAmount = 0;
      
      // Track callbacks for later reference
      if (!window.__webSocketCallbacks) {
        window.__webSocketCallbacks = [];
      }
      
      // Event handlers
      this.onopen = null;
      this.onclose = null;
      this.onerror = null;
      this.onmessage = null;
      
      // Simulate open after a brief delay, like a fast network connection
      setTimeout(() => {
        if (this.onopen) {
          this.readyState = 1; // OPEN
          const openEvent = new Event('open');
          this.onopen(openEvent);
          
          // If this is a system socket, send mock data after connection
          if (isSystemSocket) {
            setTimeout(() => {
              if (this.onmessage) {
                const mockData = {
                  type: "SYSTEM_SETTINGS_UPDATE",
                  data: {
                    background_scene: {
                      enabled: true,
                      scenes: [
                        { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
                        { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
                      ]
                    },
                    maintenance_mode: false,
                    feature_flags: {
                      enable_animations: true,
                      enable_achievements: true
                    }
                  }
                };
                
                const messageEvent = new MessageEvent('message', {
                  data: JSON.stringify(mockData)
                });
                this.onmessage(messageEvent);
              }
            }, 100);
          }
        }
      }, 50);
      
      // Methods
      this.close = () => {
        if (this.readyState === 1 && this.onclose) {
          this.readyState = 3; // CLOSED
          const closeEvent = new CloseEvent('close', { 
            wasClean: true,
            code: 1000,
            reason: 'Storybook mock closed'
          });
          this.onclose(closeEvent);
        }
      };
      
      this.send = (data) => {
        console.log(`[Storybook] Mock WebSocket send:`, { url, data });
        
        // If this is a subscription or settings request, send a mock acknowledgment
        if (data && typeof data === 'string') {
          try {
            const message = JSON.parse(data);
            
            if ((message.type === 'SUBSCRIBE' || message.type === 'GET_SYSTEM_SETTINGS') && this.onmessage) {
              setTimeout(() => {
                // Send acknowledgment
                const ackMessageEvent = new MessageEvent('message', {
                  data: JSON.stringify({
                    type: 'ACKNOWLEDGMENT',
                    message: 'Subscription successful',
                    topics: message.topics || ['system']
                  })
                });
                
                if (this.onmessage) this.onmessage(ackMessageEvent);
                
                // If this is a system request, also send settings data
                if (isSystemSocket || (message.topics && message.topics.includes('system'))) {
                  setTimeout(() => {
                    const dataMessageEvent = new MessageEvent('message', {
                      data: JSON.stringify({
                        type: "SYSTEM_SETTINGS_UPDATE",
                        data: {
                          background_scene: {
                            enabled: true,
                            scenes: [
                              { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
                              { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
                            ]
                          },
                          maintenance_mode: false,
                          feature_flags: {
                            enable_animations: true,
                            enable_achievements: true
                          }
                        }
                      })
                    });
                    
                    if (this.onmessage) this.onmessage(dataMessageEvent);
                  }, 100);
                }
              }, 50);
            }
          } catch (e) {
            console.warn('[Storybook] Error parsing WebSocket message:', e);
          }
        }
      };
      
      // Static properties from the WebSocket class
      Object.defineProperties(this.constructor, {
        CONNECTING: { value: 0 },
        OPEN: { value: 1 },
        CLOSING: { value: 2 },
        CLOSED: { value: 3 }
      });
      
      // Store a reference to the onmessage handler for direct calls
      if (this.onmessage) {
        window.__webSocketCallbacks.push(this.onmessage);
      }
    }
    
    // Replace the WebSocket constructor
    window.WebSocket = MockWebSocket;
    
    // Store reference to restore on cleanup
    window._originalWebSocket = originalWebSocket;
    
    // Create a mock WebSocketContext
    window.useWebSocketContext = () => ({
      isConnected: true,
      isAuthenticated: true,
      connectionState: 'AUTHENTICATED',
      connectionError: null,
      sendMessage: (message) => {
        console.log('[Storybook] WebSocketContext sendMessage:', message);
        return true;
      },
      subscribe: (topics) => {
        console.log('[Storybook] WebSocketContext subscribe:', topics);
        return true;
      },
      unsubscribe: (topics) => {
        console.log('[Storybook] WebSocketContext unsubscribe:', topics);
        return true;
      },
      request: (topic, action, params) => {
        console.log('[Storybook] WebSocketContext request:', { topic, action, params });
        return true;
      },
      registerListener: (id, types, callback, topics) => {
        console.log('[Storybook] WebSocketContext registerListener:', { id, types, topics });
        
        // Store callback for direct calls
        if (!window.__webSocketCallbacks) {
          window.__webSocketCallbacks = [];
        }
        window.__webSocketCallbacks.push(callback);
        
        // If this is a system listener, send mock data after a short delay
        if (id.includes('system') || (topics && topics.includes('system'))) {
          setTimeout(() => {
            callback({
              type: "SYSTEM_SETTINGS_UPDATE",
              data: {
                background_scene: {
                  enabled: true,
                  scenes: [
                    { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
                    { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
                  ]
                },
                maintenance_mode: false,
                feature_flags: {
                  enable_animations: true,
                  enable_achievements: true
                }
              }
            });
          }, 100);
        }
        
        // Return unregister function
        return () => {
          console.log('[Storybook] WebSocketContext unregisterListener:', id);
          if (window.__webSocketCallbacks) {
            window.__webSocketCallbacks = window.__webSocketCallbacks.filter(cb => cb !== callback);
          }
        };
      }
    });
    
    // Log that we've mocked WebSockets
    console.log('[Storybook] WebSocket connections mocked globally');
  }
};

// Initial setup of global mocks (ensures they're available during Story initialization)
if (typeof window !== 'undefined') {
  // Set up enhanced WebSocket mocks for Storybook
  setupWebSocketMock();
  
  // Set up base path handling for Storybook when served from a subpath
  window.STORYBOOK_ENV = true;
  
  // Support for Storybook being served from a subpath
  if (window.location.pathname.includes('/live/')) {
    window.STORYBOOK_BASE_PATH = '/live/';
    
    // If fetch is used in components, we need to fix the URL
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/live/')) {
        return originalFetch('/live' + url, options);
      }
      return originalFetch(url, options);
    };
  }
  
  // Mock specific API calls but allow token API through
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    console.log(`[Storybook] Intercepted fetch to: ${url}`);
    
    // Allow token API calls to go through to real backend
    if (url.includes('/api/tokens') || url.includes('/tokens')) {
      console.log('[Storybook] Allowing token API call through to real backend');
      return originalFetch(url, options);
    }
    
    // Mock system status API
    if (url.includes('/api/admin/system-status') || url.includes('/api/v69/system-status')) {
      console.log('[Storybook] Mocking system status response');
      return Promise.resolve(new Response(
        JSON.stringify({
          status: 'operational',
          maintenance: false,
          services: {
            websocket: 'operational',
            database: 'operational',
            auth: 'operational',
            api: 'operational'
          },
          last_updated: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }
    
    // Mock system settings API (for the admin.getSystemSettings() fallback)
    if (url.includes('/admin/system-settings')) {
      console.log('[Storybook] Mocking system settings response');
      return Promise.resolve(new Response(
        JSON.stringify({
          background_scene: {
            enabled: true,
            scenes: [
              {
                name: 'CyberGrid',
                enabled: true,
                zIndex: 0,
                blendMode: 'normal'
              },
              {
                name: 'MarketBrain',
                enabled: true,
                zIndex: 1,
                blendMode: 'screen'
              }
            ]
          },
          maintenance_mode: false,
          feature_flags: {
            enable_animations: true,
            enable_achievements: true
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }
    
    // Default mock response for unknown endpoints
    return Promise.resolve(new Response(
      JSON.stringify({ mock: true, message: 'Storybook mock response' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  };
  
  // Auth context mock
  window.useAuthContext = () => ({
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isConnecting: false,
    connectWallet: () => console.log('Mock connectWallet called'),
    disconnectWallet: () => console.log('Mock disconnectWallet called'),
    isSuperAdmin: () => false,
    isAdmin: () => false,
    isFullyConnected: () => false,
    checkAuth: () => console.log('Mock checkAuth called'),
    getAccessToken: async () => null
  });

  // Privy auth context mock
  window.usePrivyAuth = () => ({
    isAuthenticated: false,
    isLoading: false,
    isPrivyLinked: false,
    user: null,
    login: () => console.log('Mock Privy login called'),
    logout: () => console.log('Mock Privy logout called'),
    getAuthToken: async () => null,
    linkPrivyToWallet: async () => {
      console.log('Mock linkPrivyToWallet called');
      return true;
    },
    checkAuthStatus: async () => {}
  });
  
  // Import mock hooks and assign them to window for global access
  window.useSystemSettingsWebSocket = mockedHooks.useSystemSettingsWebSocket;
  
  // Mock the WebSocket interface properly with auto-response for system settings
  window.useWebSocket = (config) => {
    console.log(`[Storybook] Mock WebSocket created for ${config.socketType}`);
    
    // Prevent excessive WebSocket reconnection attempts
    const connectionAttemptKey = `ws_last_attempt_${config.socketType}`;
    const now = Date.now();
    const lastAttempt = parseInt(sessionStorage.getItem(connectionAttemptKey) || '0');
    const THROTTLE_MS = 5000; // 5 seconds between connection attempts
    
    if (now - lastAttempt < THROTTLE_MS) {
      console.log(`[Storybook] Throttling WebSocket connection for ${config.socketType}`);
      // Return a stable mock without triggering additional connections
      return {
        status: 'throttled',
        data: null,
        error: null,
        send: (message) => console.log(`[Storybook] Mock WebSocket send (throttled): ${JSON.stringify(message)}`),
        connect: () => console.log(`[Storybook] Mock WebSocket connect (throttled)`),
        close: () => console.log(`[Storybook] Mock WebSocket close (throttled)`)
      };
    }
    
    // Update last attempt timestamp
    sessionStorage.setItem(connectionAttemptKey, now.toString());
    
    // Special handling for system settings socket
    if (config.socketType === 'system') {
      setTimeout(() => {
        if (typeof window.__webSocketCallbacks !== 'undefined') {
          // Find any system socket callbacks and send mock data
          window.__webSocketCallbacks.forEach(cb => cb({
            type: "SYSTEM_SETTINGS_UPDATE",
            data: {
              background_scene: {
                enabled: true,
                scenes: [
                  { name: 'CyberGrid', enabled: true, zIndex: 0, blendMode: 'normal' },
                  { name: 'MarketBrain', enabled: true, zIndex: 1, blendMode: 'screen' }
                ]
              },
              maintenance_mode: false
            }
          }));
        }
      }, 100);
    }
    
    return {
      status: 'online',
      data: null,
      error: null,
      send: (message) => console.log(`[Storybook] Mock WebSocket send: ${JSON.stringify(message)}`),
      connect: () => console.log(`[Storybook] Mock WebSocket connect`),
      close: () => console.log(`[Storybook] Mock WebSocket close`)
    };
  };
  
  // Mock Solana wallet for Blinks stories
  if (!window.solana) {
    Object.defineProperty(window, 'solana', {
      value: {
        isConnected: false,
        publicKey: null,
        connect: async function() {
          console.log('Mock Solana wallet connect called');
          this.isConnected = true;
          this.publicKey = { toString: () => '5Zzguz4NsSRNYJBpPpxNQy8kJrt1JDKEzw' };
          return { publicKey: this.publicKey };
        },
        disconnect: async function() {
          console.log('Mock Solana wallet disconnect called');
          this.isConnected = false;
          this.publicKey = null;
        },
        signAndSendTransaction: async function(transaction) {
          console.log('Mock Solana signAndSendTransaction:', transaction);
          return { signature: 'mock_signature_' + Math.random().toString(36).substring(2, 10) };
        }
      },
      writable: true,
      configurable: true
    });
  }
}

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#13111c',
        },
        {
          name: 'light',
          value: '#f8f8f8',
        },
      ],
    },
  },
  decorators: [
    withMockedHooks,
    withAuthMock,
  ],
};

export default preview;