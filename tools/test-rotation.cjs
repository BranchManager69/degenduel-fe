const puppeteer = require('puppeteer');

async function testRotationBehavior() {
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
    
    console.log('🔄 Testing rotation behavior...');
    
    // Test 1: Load in portrait, then rotate to landscape
    console.log('\n📱 Test 1: Portrait → Landscape');
    await page.setViewport({ width: 375, height: 667 }); // iPhone portrait
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Let page load
    
    console.log('  ✓ Loaded in portrait (375×667)');
    await page.screenshot({ path: 'screenshots/rotation-test-1-portrait.png' });
    
    // Simulate rotation to landscape
    await page.setViewport({ width: 667, height: 375 }); // Rotate to landscape
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow layout to adjust
    
    console.log('  🔄 Rotated to landscape (667×375)');
    await page.screenshot({ path: 'screenshots/rotation-test-1-landscape-after-rotation.png' });
    
    // Test 2: Load in landscape, then rotate to portrait
    console.log('\n📱 Test 2: Landscape → Portrait');
    await page.setViewport({ width: 667, height: 375 }); // iPhone landscape
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Let page load
    
    console.log('  ✓ Loaded in landscape (667×375)');
    await page.screenshot({ path: 'screenshots/rotation-test-2-landscape.png' });
    
    // Simulate rotation to portrait
    await page.setViewport({ width: 375, height: 667 }); // Rotate to portrait
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow layout to adjust
    
    console.log('  🔄 Rotated to portrait (375×667)');
    await page.screenshot({ path: 'screenshots/rotation-test-2-portrait-after-rotation.png' });
    
    // Test 3: Larger tablet rotation
    console.log('\n📱 Test 3: Tablet Rotation');
    await page.setViewport({ width: 768, height: 1024 }); // iPad portrait
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Let page load
    
    console.log('  ✓ Loaded in tablet portrait (768×1024)');
    await page.screenshot({ path: 'screenshots/rotation-test-3-tablet-portrait.png' });
    
    // Rotate tablet to landscape
    await page.setViewport({ width: 1024, height: 768 }); // iPad landscape
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow layout to adjust
    
    console.log('  🔄 Rotated to tablet landscape (1024×768)');
    await page.screenshot({ path: 'screenshots/rotation-test-3-tablet-landscape.png' });
    
    console.log('\n✅ Rotation tests complete! Check screenshots/ folder for results.');
    
  } catch (error) {
    console.error('❌ Error during rotation testing:', error.message);
  } finally {
    await browser.close();
  }
}

testRotationBehavior(); 