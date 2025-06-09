#!/usr/bin/env node

import https from 'https';

// Function to make HTTPS GET request
function fetchTokens(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log('Fetching token data from DegenDuel API...\n');
  
  try {
    // Try production endpoint
    const prodUrl = 'https://degenduel.me/api/tokens/trending?limit=10&offset=0&format=paginated';
    console.log(`Fetching from: ${prodUrl}`);
    
    const data = await fetchTokens(prodUrl);
    
    console.log('\n=== API Response ===');
    console.log(`Total tokens available: ${data.pagination?.total || 'unknown'}`);
    console.log(`Tokens returned: ${data.tokens?.length || 0}`);
    console.log('\n=== First 10 Tokens (sorted by degenduel_score) ===\n');
    
    if (data.tokens && data.tokens.length > 0) {
      data.tokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol} (${token.name})`);
        console.log(`   Address: ${token.address}`);
        console.log(`   Price: $${token.price || 0}`);
        console.log(`   Market Cap: $${token.market_cap?.toLocaleString() || 0}`);
        console.log(`   24h Volume: $${token.volume_24h?.toLocaleString() || 0}`);
        console.log(`   24h Change: ${token.change_24h || 0}%`);
        console.log(`   DegenDuel Score: ${token.degenduel_score || 'N/A'}`);
        console.log(`   Liquidity: $${token.liquidity?.toLocaleString() || 0}`);
        console.log('');
      });
    } else {
      console.log('No tokens returned');
    }
    
    // Show raw response structure for first token
    if (data.tokens && data.tokens.length > 0) {
      console.log('\n=== Raw Response Structure (First Token) ===');
      console.log(JSON.stringify(data.tokens[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error fetching tokens:', error.message);
    
    // Try dev endpoint as fallback
    console.log('\nTrying dev endpoint...');
    try {
      const devUrl = 'https://dev.degenduel.me/api/tokens/trending?limit=10&offset=0&format=paginated';
      console.log(`Fetching from: ${devUrl}`);
      
      const data = await fetchTokens(devUrl);
      console.log('\n=== Dev API Response ===');
      console.log(`Tokens returned: ${data.tokens?.length || 0}`);
      
      if (data.tokens && data.tokens.length > 0) {
        console.log('\nFirst 3 tokens:');
        data.tokens.slice(0, 3).forEach((token, index) => {
          console.log(`${index + 1}. ${token.symbol} - $${token.price || 0}`);
        });
      }
    } catch (devError) {
      console.error('Dev endpoint also failed:', devError.message);
    }
  }
}

main();