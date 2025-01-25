// tests/dexscreener.test.ts
import { DexScreenerService } from '../services/dexscreener.ts';

function formatTokenData(data: any, indent = ''): string {
  if (!data) return 'No data available';
  
  let output = '';
  
  // Basic Info
  output += `${indent}Basic Info:\n`;
  output += `${indent}  Address: ${data.address || 'N/A'}\n`;
  output += `${indent}  Name: ${data.name || 'N/A'}\n`;
  output += `${indent}  Symbol: ${data.symbol || 'N/A'}\n`;
  output += `${indent}  Current Price: $${data.currentPrice?.toFixed(8) || 'N/A'}\n`;

  // Market Data
  output += `${indent}Market Data:\n`;
  output += `${indent}  24h Price Change: ${data.priceChange24h ? data.priceChange24h.toFixed(2) + '%' : 'N/A'}\n`;
  output += `${indent}  24h Volume: ${data.volume24h ? '$' + data.volume24h.toLocaleString() : 'N/A'}\n`;
  output += `${indent}  Market Cap: ${data.marketCap ? '$' + data.marketCap.toLocaleString() : 'N/A'}\n`;
  output += `${indent}  FDV: ${data.fdv ? '$' + data.fdv.toLocaleString() : 'N/A'}\n`;
  output += `${indent}  Liquidity: ${data.liquidity ? '$' + data.liquidity.toLocaleString() : 'N/A'}\n`;

  // Websites
  if (data.websites && data.websites.length > 0) {
    output += `${indent}Websites:\n`;
    data.websites.forEach((site: any) => {
      output += `${indent}  ${site.url}\n`;
    });
  }

  // Social Media
  if (data.socials && data.socials.length > 0) {
    output += `${indent}Social Media:\n`;
    data.socials.forEach((social: any) => {
      output += `${indent}  ${social.platform}: ${social.url || social.handle || 'N/A'}\n`;
    });
  }

  // Trading Info
  output += `${indent}Trading Info:\n`;
  output += `${indent}  DEX URL: ${data.dexUrl || 'N/A'}\n`;
  output += `${indent}  Pair Address: ${data.pairAddress || 'N/A'}\n`;
  output += `${indent}  DEX ID: ${data.dexId || 'N/A'}\n`;

  // Metadata
  output += `${indent}Metadata:\n`;
  output += `${indent}  Last Updated: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}\n`;
  output += `${indent}  Price Source: ${data.priceSource || 'N/A'}\n`;

  return output;
}

async function testDexScreener() {
  console.log('Testing DexScreener Service...\n');

  // Test 1: Fetch SOL token info
  try {
    console.log('Test 1: Fetching SOL token info...');
    const solData = await DexScreenerService.getMarketData('So11111111111111111111111111111111111111111');
    console.log(formatTokenData(solData));
  } catch (error) {
    console.error('Test 1 failed:', error);
  }

  // Test 2: Search for a token
  try {
    console.log('\nTest 2: Searching for "BONK"...');
    const searchResults = await DexScreenerService.searchTokens('BONK');
    if (searchResults.length > 0) {
      console.log(formatTokenData(searchResults[0]));
    } else {
      console.log('No results found');
    }
  } catch (error) {
    console.error('Test 2 failed:', error);
  }

  // Test 3: Fetch hot tokens
  try {
    console.log('\nTest 3: Fetching hot tokens...');
    const hotTokens = await DexScreenerService.fetchHotTokens();
    console.log(`Found ${hotTokens.length} hot tokens`);
    if (hotTokens.length > 0) {
      console.log('\nFirst hot token:');
      console.log(formatTokenData(hotTokens[0]));
    }
  } catch (error) {
    console.error('Test 3 failed:', error);
  }

  // Test 4: Bulk fetch multiple tokens
  try {
    console.log('\nTest 4: Bulk fetching token data...');
    const addresses = [
      'So11111111111111111111111111111111111111111', // SOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    ];
    const bulkData = await DexScreenerService.getContestTokensData(addresses);
    
    console.log('Bulk Token Data:');
    bulkData.forEach((data, address) => {
      console.log(`\nToken: ${address}`);
      console.log(formatTokenData(data, '  '));
    });
  } catch (error) {
    console.error('Test 4 failed:', error);
  }
}

// Run the tests
testDexScreener().then(() => {
  console.log('\nAll tests completed');
}).catch(error => {
  console.error('Test suite failed:', error);
});