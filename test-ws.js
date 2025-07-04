const WebSocket = require('ws');

console.log('Connecting to WebSocket...');
const ws = new WebSocket('wss://degenduel.me/api/v69/ws');

let authToken = null;

ws.on('open', () => {
  console.log('Connected! Sending SUBSCRIBE...');
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    topics: ['contest']
  }));
  
  // Wait a bit then request contests
  setTimeout(() => {
    console.log('Sending REQUEST for contests...');
    ws.send(JSON.stringify({
      type: 'REQUEST',
      topic: 'contest',
      action: 'getContests',
      data: { limit: 2 }
    }));
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    if (msg.type === 'SYSTEM' && msg.subtype === 'welcome') {
      console.log('Got welcome message');
      return;
    }
    
    if (msg.type === 'DATA' && msg.topic === 'contest' && msg.action === 'getContests') {
      console.log('\n=== WEBSOCKET CONTEST DATA RECEIVED ===');
      if (msg.data && msg.data.length > 0) {
        console.log('First contest fields:', Object.keys(msg.data[0]).sort());
        console.log('\nimage_url field:', msg.data[0].image_url || 'NOT FOUND');
        console.log('\nFull first contest:', JSON.stringify(msg.data[0], null, 2));
      }
      ws.close();
      process.exit(0);
    }
    
    console.log('Message type:', msg.type, 'topic:', msg.topic, 'action:', msg.action);
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Timeout - no contest data received');
  ws.close();
  process.exit(1);
}, 10000);