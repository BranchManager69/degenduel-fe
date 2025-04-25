// This script completely disables Vite's client reconnection logic
// It needs to be loaded in the preview-head.html file

(function() {
  // Override the Vite HMR client to prevent reconnection attempts
  window.__vite_is_modern_browser = true;
  window.__vite_is_storybook = true;
  
  // Stop the polling for reconnection
  window.__vite_poll_timeout = null;
  
  // Override the Vite HMR functions
  if (window.__vite_plugin_react_preamble_installed__) {
    return;
  }
  
  // Mark as installed to prevent double initialization
  window.__vite_plugin_react_preamble_installed__ = true;
  
  // Disable socket reconnections
  if (window.__HMR_PROTOCOL__ && window.__HMR_HOSTNAME__ && window.__HMR_PORT__) {
    const originalWebSocket = window.WebSocket;
    
    // Replace WebSocket for HMR connections only
    window.WebSocket = function(url, ...args) {
      // If this is a Vite HMR WebSocket, return a fake one
      if (url.includes('__vite') || url.includes('localhost:24678')) {
        console.log('[Storybook] Intercepted Vite HMR WebSocket connection attempt');
        
        // Return a fake WebSocket that does nothing
        return {
          url,
          send: () => {},
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          readyState: 3, // CLOSED
          CONNECTING: 0,
          OPEN: 1,
          CLOSING: 2,
          CLOSED: 3
        };
      }
      
      // For all other WebSockets, use the real implementation
      return new originalWebSocket(url, ...args);
    };
    
    // Copy static properties
    for (const key in originalWebSocket) {
      window.WebSocket[key] = originalWebSocket[key];
    }
  }
  
  console.log('[Storybook] Vite HMR completely disabled to prevent refresh loops');
})(); 