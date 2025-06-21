#!/usr/bin/env node

/**
 * Test script for portfolio endpoints
 * 
 * Usage:
 * 1. First, get your auth token from the browser:
 *    - Open DevTools (F12)
 *    - Go to Application > Storage > Local Storage
 *    - Copy the value of 'authToken' or 'dd_token'
 * 
 * 2. Run this script:
 *    node test-portfolio-endpoints.js <contestId> <walletAddress> <authToken>
 * 
 * Example:
 *    node test-portfolio-endpoints.js 123 0x1234...abcd eyJhbGc...
 */

const https = require('https');

// Get command line arguments
const [,, contestId, walletAddress, authToken] = process.argv;

if (!contestId || !walletAddress || !authToken) {
  console.log(`
❌ Missing required arguments!

Usage: node test-portfolio-endpoints.js <contestId> <walletAddress> <authToken>

To get these values:
1. Contest ID: Look at the URL when viewing a contest (e.g., /contests/123)
2. Wallet Address: Your connected wallet address
3. Auth Token: From browser DevTools > Application > Local Storage > authToken or dd_token
`);
  process.exit(1);
}

// Test configuration
const HOST = 'degenduel.me';
const endpoints = [
  {
    name: 'Contest Live Data',
    path: `/api/contests/${contestId}/live`,
    description: 'Gets contest details with leaderboard'
  },
  {
    name: 'User Portfolio',
    path: `/api/contests/${contestId}/portfolio/${walletAddress}`,
    description: 'Gets user portfolio holdings for the contest'
  },
  {
    name: 'Contest Details',
    path: `/api/contests/${contestId}`,
    description: 'Gets basic contest information'
  }
];

// Function to make HTTPS request
function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: 443,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    };

    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: https://${HOST}${endpoint.path}`);
    console.log(`   Description: ${endpoint.description}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('   ✅ Success! Response preview:');
            
            // Show relevant data based on endpoint
            if (endpoint.name === 'Contest Live Data') {
              console.log(`   - Contest: ${json.contest?.name || 'N/A'}`);
              console.log(`   - Status: ${json.contest?.status || 'N/A'}`);
              console.log(`   - Participants: ${json.leaderboard?.length || 0}`);
              if (json.currentUserPerformance) {
                console.log(`   - Your Rank: #${json.currentUserPerformance.rank || 'N/A'}`);
                console.log(`   - Your Performance: ${json.currentUserPerformance.performance_percentage || '0'}%`);
              }
            } else if (endpoint.name === 'User Portfolio') {
              console.log(`   - Portfolio Value: ${json.portfolioValue || json.portfolio_value || 'N/A'}`);
              console.log(`   - Holdings: ${json.holdings?.length || json.positions?.length || 0} positions`);
              if (json.holdings?.[0] || json.positions?.[0]) {
                const holding = json.holdings?.[0] || json.positions?.[0];
                console.log(`   - Example: ${holding.symbol || holding.token_symbol} (${holding.weight || holding.percentage || 0}%)`);
              }
            } else {
              console.log(`   - Name: ${json.name || 'N/A'}`);
              console.log(`   - Prize Pool: ${json.prizePool || json.prize_pool || 'N/A'}`);
            }
            
            // Optionally show full response
            if (process.env.SHOW_FULL === 'true') {
              console.log('\n   Full response:', JSON.stringify(json, null, 2));
            }
          } catch (e) {
            console.log('   ⚠️  Response is not valid JSON:', data.substring(0, 200));
          }
        } else {
          console.log(`   ❌ Error: ${data.substring(0, 200)}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`   ❌ Request failed: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing DegenDuel Portfolio Endpoints');
  console.log('=====================================');
  console.log(`Contest ID: ${contestId}`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Auth Token: ${authToken.substring(0, 20)}...`);

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\n✨ All tests completed!');
  console.log('\nTip: Set SHOW_FULL=true to see complete responses:');
  console.log('SHOW_FULL=true node test-portfolio-endpoints.js ...\n');
}

runTests();