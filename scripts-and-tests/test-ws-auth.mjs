#!/usr/bin/env node

import WebSocket from 'ws';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load token from .ws-auth
const authFile = fs.readFileSync(path.join(__dirname, '.ws-auth'), 'utf8');
const token = authFile.match(/AUTH_TOKEN=(.+)/)?.[1];

if (!token) {
  console.error('No token found in .ws-auth');
  process.exit(1);
}

console.log(chalk.green('✓ Testing authenticated WebSocket connection'));

const ws = new WebSocket('wss://degenduel.me/api/v69/ws');

ws.on('open', () => {
  console.log(chalk.green('✓ Connected'));
  
  // Test portfolio subscription
  console.log(chalk.cyan('\nTesting portfolio subscription with auth...'));
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    topics: ['portfolio'],
    authToken: token
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.type === 'ACKNOWLEDGMENT') {
    console.log(chalk.green(`✓ ${msg.message}`));
    
    if (msg.topics?.includes('portfolio')) {
      // Request portfolio data
      console.log(chalk.cyan('\nRequesting portfolio data...'));
      ws.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'portfolio',
        action: 'getPortfolio',
        authToken: token
      }));
    }
  } else if (msg.type === 'ERROR') {
    console.log(chalk.red(`✗ Error: ${msg.error}`));
    ws.close();
  } else {
    console.log(chalk.white('\nReceived data:'));
    console.log(JSON.stringify(msg, null, 2));
    
    // Close after receiving data
    setTimeout(() => ws.close(), 1000);
  }
});

ws.on('close', () => {
  console.log(chalk.yellow('\nConnection closed'));
});

ws.on('error', (err) => {
  console.error(chalk.red('Error:'), err);
});