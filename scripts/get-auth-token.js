#!/usr/bin/env node

/**
 * Helper script to extract auth token from DegenDuel
 * 
 * This script helps you get your auth token from the browser
 * by generating a bookmarklet or providing instructions
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(chalk.cyan('\n🔐 DegenDuel Auth Token Helper\n'));

console.log(chalk.white('To get your auth token from DegenDuel:\n'));

console.log(chalk.yellow('Option 1: Browser Console Method'));
console.log(chalk.gray('1. Log into https://degenduel.me'));
console.log(chalk.gray('2. Open DevTools (F12)'));
console.log(chalk.gray('3. Go to Console tab'));
console.log(chalk.gray('4. Paste this command:\n'));

const consoleCommand = `
// Get auth token from DegenDuel
(() => {
  const storage = localStorage.getItem('degenduel-storage');
  if (!storage) {
    console.error('❌ No auth data found. Are you logged in?');
    return;
  }
  
  try {
    const data = JSON.parse(storage);
    const state = data?.state || data;
    const token = state?.user?.jwt || state?.jwt;
    
    if (token) {
      console.log('✅ Found auth token!');
      console.log('\\n' + token + '\\n');
      console.log('Copy the token above and use: npm run ws');
      console.log('Then: auth save ' + token.substring(0, 20) + '...');
      
      // Also copy to clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText(token).then(() => {
          console.log('📋 Token copied to clipboard!');
        });
      }
    } else {
      console.error('❌ No JWT token found in storage');
    }
  } catch (err) {
    console.error('❌ Error parsing auth data:', err);
  }
})();
`;

console.log(chalk.green(consoleCommand));

console.log(chalk.yellow('\n\nOption 2: Bookmarklet Method'));
console.log(chalk.gray('Create a bookmark with this as the URL:\n'));

const bookmarklet = `javascript:${encodeURIComponent(consoleCommand.replace(/\n/g, ' ').replace(/\s+/g, ' '))}`;
console.log(chalk.green(`javascript:(()=>{const storage=localStorage.getItem('degenduel-storage');if(!storage){alert('No auth data found. Are you logged in?');return;}try{const data=JSON.parse(storage);const state=data?.state||data;const token=state?.user?.jwt||state?.jwt;if(token){prompt('Your auth token:',token);}else{alert('No JWT token found');}}catch(err){alert('Error: '+err.message);}})();`));

console.log(chalk.yellow('\n\nOption 3: Network Tab Method'));
console.log(chalk.gray('1. Open DevTools → Network tab'));
console.log(chalk.gray('2. Look for any API request (like /api/contests)'));
console.log(chalk.gray('3. Click on the request'));
console.log(chalk.gray('4. Go to Headers → Request Headers'));
console.log(chalk.gray('5. Find "Authorization: Bearer <token>"'));
console.log(chalk.gray('6. Copy the token (without "Bearer ")'));

console.log(chalk.cyan('\n\nOnce you have your token:'));
console.log(chalk.white('1. Run: npm run ws'));
console.log(chalk.white('2. Type: auth save <your-token-here>'));
console.log(chalk.white('3. The token will be saved and auto-loaded next time!\n'));

// Check if token file exists
const wsAuthPath = path.join(path.dirname(__dirname), '.ws-auth');
if (fs.existsSync(wsAuthPath)) {
  console.log(chalk.green('✓ .ws-auth file already exists'));
  
  const content = fs.readFileSync(wsAuthPath, 'utf8');
  const match = content.match(/^AUTH_TOKEN=(.+)$/m);
  if (match && match[1]) {
    console.log(chalk.gray('  A token is already saved. Run "npm run ws" to check if it\'s still valid.\n'));
  }
} else {
  console.log(chalk.yellow('ℹ No .ws-auth file found yet. Save your first token to create it.\n'));
}