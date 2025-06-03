const puppeteer = require('puppeteer');

async function testPerformanceMode() {
  console.log('🔥 Testing Performance Mode...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📸 Test 1: Normal Mode (Full animations)');
    
    // Clear any existing performance mode setting
    await page.evaluateOnNewDocument(() => {
      localStorage.removeItem('performance-mode');
    });
    
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: 'screenshots/performance-test-normal-mode.png', 
      fullPage: false 
    });
    
    console.log('✅ Captured normal mode screenshot');
    
    console.log('📸 Test 2: Performance Mode (Optimized)');
    
    // Enable performance mode by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('performance-mode', 'true');
      document.body.classList.add('performance-mode');
    });
    
    // Reload to see the effect
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: 'screenshots/performance-test-performance-mode.png', 
      fullPage: false 
    });
    
    console.log('✅ Captured performance mode screenshot');
    
    console.log('📸 Test 3: Toggle Test (Click the button)');
    
    // Start in normal mode
    await page.evaluate(() => {
      localStorage.removeItem('performance-mode');
      document.body.classList.remove('performance-mode');
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find and click the performance toggle button
    try {
      const button = await page.$('button[title*="Enable Performance Mode"]');
      if (button) {
        console.log('🎯 Found performance toggle button, clicking...');
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({ 
          path: 'screenshots/performance-test-toggled-on.png', 
          fullPage: false 
        });
        
        console.log('✅ Captured toggled performance mode screenshot');
      } else {
        console.log('⚠️  Performance toggle button not found');
      }
    } catch (err) {
      console.log('⚠️  Could not interact with performance toggle:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error during performance mode test:', error);
  } finally {
    await browser.close();
  }
  
  console.log('🎉 Performance mode testing complete!');
  console.log('📁 Check screenshots/ folder for results:');
  console.log('   - performance-test-normal-mode.png');
  console.log('   - performance-test-performance-mode.png');
  console.log('   - performance-test-toggled-on.png');
}

testPerformanceMode(); 