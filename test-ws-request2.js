import fetch from 'node-fetch';
import WebSocket from 'ws';

console.log('Testing simplified token data approach...\n');

// First, test REST API for paginated token data
console.log('1. Testing REST API for token list...');
try {
  const response = await fetch('https://degenduel.me/api/tokens/trending?format=paginated&limit=10&offset=0');
  const data = await response.json();
  
  console.log('REST API Response:');
  console.log('- Success:', data.success);
  console.log('- Token count:', data.tokens?.length || data.data?.length);
  console.log('- Has pagination:', !!data.pagination);
  if (data.pagination) {
    console.log('- Total tokens:', data.pagination.total);
    console.log('- Has more:', data.pagination.hasMore);
  }
  if (data.tokens?.[0] || data.data?.[0]) {
    const firstToken = data.tokens?.[0] || data.data?.[0];
    console.log('\nFirst token:', {
      symbol: firstToken.symbol,
      name: firstToken.name,
      price: firstToken.price,
      change_24h: firstToken.change_24h
    });
  }
} catch (error) {
  console.error('REST API Error:', error.message);
}

// Then, test WebSocket for real-time updates
console.log('\n2. Testing WebSocket for real-time updates...');
const ws = new WebSocket('wss://degenduel.me/api/v69/ws');

ws.on('open', () => {
  console.log('WebSocket connected! Subscribing to market-data...');
  
  const subscribe = {
    type: 'SUBSCRIBE',
    topics: ['market-data']
  };
  
  console.log('Sending:', JSON.stringify(subscribe, null, 2));
  ws.send(JSON.stringify(subscribe));
  
  // Also test if the old method still works (for comparison)
  setTimeout(() => {
    console.log('\n3. Testing deprecated getDegenDuelRanked (for comparison)...');
    const request = {
      type: 'REQUEST',
      topic: 'market-data',
      action: 'getDegenDuelRanked',
      requestId: crypto.randomUUID(),
      data: {
        limit: 10,
        offset: 0,
        format: 'paginated'
      }
    };
    ws.send(JSON.stringify(request));
  }, 1000);
});

let messageCount = 0;
ws.on('message', (data) => {
  messageCount++;
  const message = JSON.parse(data);
  
  console.log(`\n=== MESSAGE ${messageCount} ===`);
  console.log('Type:', message.type);
  console.log('Topic:', message.topic);
  
  if (message.type === 'ACKNOWLEDGMENT') {
    console.log('Subscription acknowledged');
  } else if (message.type === 'DATA' && message.topic === 'market-data') {
    // Real-time broadcast
    if (message.data && Array.isArray(message.data)) {
      console.log('Broadcast update received');
      console.log('Token count:', message.data.length);
      console.log('First few tokens:', message.data.slice(0, 3).map(t => t.symbol).join(', '));
    }
  } else if (message.action === 'degenDuelRanked' || message.action === 'getDegenDuelRanked') {
    // Response to deprecated request
    console.log('Response to deprecated getDegenDuelRanked');
    console.log('Token count:', message.tokens?.length || message.data?.length);
    if (message.pagination) {
      console.log('Pagination:', message.pagination);
    }
  }
  
  // Close after receiving a few messages
  if (messageCount >= 3) {
    console.log('\nClosing connection...');
    ws.close();
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.on('close', () => {
  console.log('\nWebSocket closed');
  process.exit(0);
});

// Timeout safety
setTimeout(() => {
  console.log('\nTimeout reached, closing...');
  ws.close();
}, 15000);