import { DexScreenerService } from '../src/services/dexscreener.ts';

async function testDexScreener() {
  console.log('Testing DexScreener Service...');

  // Test 1: Fetch SOL token info
  try {
    console.log('\nTest 1: Fetching SOL token info...');
    const solData = await DexScreenerService.getMarketData('So11111111111111111111111111111111111111111');
    console.log('SOL Market Data:', solData);
  } catch (error) {
    console.error('Test 1 failed:', error);
  }

  // Test 2: Search for a token
  try {
    console.log('\nTest 2: Searching for "BONK"...');
    const searchResults = await DexScreenerService.searchTokens('BONK');
    console.log('Search Results:', searchResults);
  } catch (error) {
    console.error('Test 2 failed:', error);
  }

  // Test 3: Fetch hot tokens
  try {
    console.log('\nTest 3: Fetching hot tokens...');
    const hotTokens = await DexScreenerService.fetchHotTokens();
    console.log('Hot Tokens:', hotTokens.length, 'tokens found');
    console.log('First hot token:', hotTokens[0]);
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
    console.log('Bulk Token Data:', bulkData);
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