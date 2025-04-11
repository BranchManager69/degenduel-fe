// Vite plugin that allows HMR but prevents excessive refreshes

module.exports = function controlHmrPlugin() {
  return {
    name: 'control-hmr',
    
    // Modify HMR behavior at the server level
    configureServer(server) {
      console.log('🔥 ControlHmrPlugin: Enabling controlled HMR');
      
      // Allow normal HMR operation, but control refresh behavior
      if (server.ws) {
        const originalSend = server.ws.send;
        // Track full-reload messages to prevent spam
        let lastFullReload = 0;
        
        // Replace the send method to control message frequency
        server.ws.send = function(payload) {
          // Allow all messages except excessive full-reloads
          if (payload.type === 'full-reload') {
            const now = Date.now();
            // Limit full reloads to once every 10 seconds max
            if (now - lastFullReload < 10000) {
              console.log('🔥 ControlHmrPlugin: Throttling full-reload');
              return; // Skip this reload
            }
            lastFullReload = now;
          }
          
          // Allow the message through
          return originalSend.apply(this, arguments);
        };
      }
    },
    
    // Don't transform any code to allow HMR to work normally
    transform(code, id) {
      return null;
    }
  };
} 