#!/usr/bin/env node

// Test individual token WebSocket subscriptions
import WebSocket from 'ws';

const ws = new WebSocket('wss://degenduel.me/api/v69/ws');

// Test tokens
const DUEL_ADDRESS = 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX';
const BULLY_ADDRESS = '79yTpy8uwmAkrdgZdq6ZSBTvxKsgPrNqTLvYQBh1pump';

ws.on('open', () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to individual tokens
  const subscribeMessage = {
    type: 'SUBSCRIBE',
    topics: [
      `token:price:${DUEL_ADDRESS}`,
      `token:price:${BULLY_ADDRESS}`
    ]
  };
  
  console.log('Subscribing to:', subscribeMessage.topics);
  ws.send(JSON.stringify(subscribeMessage));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'ACKNOWLEDGMENT') {
    console.log('Subscription acknowledged:', message);
  }
  
  // Check for individual token updates
  if (message.topic && message.topic.startsWith('token:price:')) {
    const tokenAddress = message.topic.split(':')[2];
    const tokenData = message.data?.token;
    
    if (tokenData) {
      console.log(`\n=== UPDATE for ${tokenData.symbol} (${tokenAddress.slice(0, 8)}...) ===`);
      console.log(`Price: $${tokenData.price}`);
      console.log(`Change 24h: ${tokenData.change_24h}%`);
      console.log(`Market Cap: $${tokenData.market_cap}`);
      console.log(`Timestamp: ${tokenData.timestamp}`);
    }
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  ws.close();
  process.exit(0);
});

console.log('Watching for individual token updates... Press Ctrl+C to exit.');