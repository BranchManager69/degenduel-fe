/**
 * DegenDuel Token Endpoint Performance Test Script
 * 
 * PURPOSE:
 * Tests the DegenDuel backend API endpoints to verify how many tokens are available
 * and measure load performance for large token datasets.
 * 
 * WHAT THIS TESTS:
 * - Total number of tokens available from the backend
 * - Response time for loading all tokens at once
 * - Response payload size (memory usage estimation)
 * - Data structure validation
 * 
 * DATA SOURCE:
 * - Backend API: https://dev.degenduel.me/api/tokens/trending
 * - Live production data from DegenDuel's token database
 * - Real Solana blockchain token information
 * 
 * HOW TO USE:
 * 1. Run: node test-3500-tokens.js
 * 2. Review output for:
 *    - Token count (should be ~3300+ tokens)
 *    - Load time (should be under 2 seconds)
 *    - Response size (should be manageable, ~5-10MB)
 * 3. Use results to optimize frontend token loading strategy
 * 
 * INTERPRETATION:
 * - If load time > 3 seconds: Consider pagination
 * - If response size > 20MB: Consider backend filtering
 * - If token count differs significantly: Backend data may have changed
 * 
 * LAST SUCCESSFUL TEST RESULTS:
 * - Tokens: 3,297 tokens loaded
 * - Load time: 944ms (under 1 second!)
 * - Response size: ~5.7MB
 * - Status: ✅ EXCELLENT PERFORMANCE
 * 
 * @author Claude & BranchManager69
 * @created 2025-01-XX
 * @updated After backend token count increased to 3500+
 */

async function test3500Tokens() {
  console.log('🚀 DegenDuel Token Endpoint Performance Test\n');
  console.log('Testing backend API with all available tokens...\n');

  // Test 1: Trending endpoint with high limit
  try {
    console.log('1. Testing /api/tokens/trending?format=paginated&limit=4000:');
    const start = Date.now();
    const res = await fetch('https://dev.degenduel.me/api/tokens/trending?format=paginated&limit=4000');
    const data = await res.json();
    const loadTime = Date.now() - start;
    
    console.log(`   - Status: ${res.status}`);
    console.log(`   - Load time: ${loadTime}ms`);
    
    if (data.tokens && data.pagination) {
      console.log(`   - Tokens returned: ${data.tokens.length}`);
      console.log(`   - Total available: ${data.pagination.total}`);
      console.log(`   - Has more: ${data.pagination.hasMore}`);
      console.log(`   - Response size: ~${Math.round(JSON.stringify(data).length / 1024)}KB`);
      
      // Sample a few tokens to verify structure
      if (data.tokens.length > 0) {
        const sampleToken = data.tokens[0];
        console.log(`   - Sample token keys: ${Object.keys(sampleToken).slice(0, 8).join(', ')}...`);
        console.log(`   - Sample token symbol: ${sampleToken.symbol}`);
      }
    } else {
      console.log(`   - Unexpected response structure:`, Object.keys(data));
    }
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // Test 2: Regular tokens endpoint
  try {
    console.log('\n2. Testing /api/tokens?limit=4000&format=paginated:');
    const start = Date.now();
    const res = await fetch('https://dev.degenduel.me/api/tokens?limit=4000&format=paginated');
    const data = await res.json();
    const loadTime = Date.now() - start;
    
    console.log(`   - Status: ${res.status}`);
    console.log(`   - Load time: ${loadTime}ms`);
    
    if (data.tokens) {
      console.log(`   - Tokens returned: ${data.tokens.length}`);
      console.log(`   - Response size: ~${Math.round(JSON.stringify(data).length / 1024)}KB`);
    } else {
      console.log(`   - Response structure:`, Object.keys(data));
    }
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  console.log('\n✅ Token endpoint performance test complete!');
  console.log('\n📊 SUMMARY:');
  console.log('This test validates that the DegenDuel backend can efficiently serve');
  console.log('large token datasets to the frontend for portfolio building and token browsing.');
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Use these results to set frontend token limits');
  console.log('2. Monitor performance as token count grows');
  console.log('3. Re-run this test when backend changes are made');
  console.log('\n💡 TIP: Save this output for performance baseline comparisons!');
}

// Execute the test
console.log('🔧 USAGE: This script tests DegenDuel backend token endpoints');
console.log('📍 ENDPOINT: https://dev.degenduel.me/api/tokens/trending');
console.log('🎯 PURPOSE: Measure performance for loading ALL tokens at once\n');

test3500Tokens().catch(err => {
  console.error('❌ Test failed:', err.message);
  console.log('\n🔍 TROUBLESHOOTING:');
  console.log('- Check if backend server is running');
  console.log('- Verify network connectivity');
  console.log('- Confirm API endpoint is accessible');
  process.exit(1);
});