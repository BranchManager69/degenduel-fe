// Debug frontend WebSocket - run this in browser console on dev.degenduel.me

console.log('=== Frontend WebSocket Debug ===');

// Check if WebSocket context exists
const wsContext = window.React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current;
console.log('React internals available:', !!wsContext);

// Listen to WebSocket messages directly
const originalWebSocket = window.WebSocket;
const wsMessages = [];

window.WebSocket = function(url, protocols) {
  console.log('🔌 New WebSocket connection:', url);
  const ws = new originalWebSocket(url, protocols);
  
  const originalSend = ws.send;
  ws.send = function(data) {
    console.log('📤 Sending:', JSON.parse(data));
    return originalSend.call(this, data);
  };
  
  ws.addEventListener('message', function(event) {
    const message = JSON.parse(event.data);
    wsMessages.push(message);
    console.log('📥 Received:', message);
    
    // Specifically track token updates
    if (message.topic && message.topic.startsWith('token:price:')) {
      console.log('🎯 TOKEN UPDATE:', {
        token: message.data?.token?.symbol,
        price: message.data?.token?.price,
        change: message.data?.token?.change_24h
      });
    }
  });
  
  ws.addEventListener('open', function() {
    console.log('✅ WebSocket connected');
  });
  
  ws.addEventListener('close', function() {
    console.log('❌ WebSocket disconnected');
  });
  
  return ws;
};

// Helper function to check messages
window.debugWS = {
  getMessages: () => wsMessages,
  getTokenUpdates: () => wsMessages.filter(m => m.topic && m.topic.startsWith('token:price:')),
  clear: () => wsMessages.length = 0
};

console.log('WebSocket debugging enabled. Use debugWS.getMessages() to see all messages.');
console.log('Use debugWS.getTokenUpdates() to see only token updates.');