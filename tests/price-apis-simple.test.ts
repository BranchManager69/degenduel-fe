// tests/price-apis.test.ts
console.log('=== STARTING TEST ===');

async function basicTest() {
    console.log('Test function started');
    
    try {
        console.log('Attempting API call...');
        const response = await fetch('https://degenduel.me/api/tokens');
        console.log('API Response received:', response.status);
        
        const data = await response.text();
        console.log('Raw data:', data.substring(0, 100) + '...');
        
    } catch (error) {
        console.log('ERROR:', error);
    }
}

basicTest().then(() => console.log('Test completed')).catch(e => console.log('Test failed:', e));