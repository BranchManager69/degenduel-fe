import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  
  // Listen for console logs and errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => 
    console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText)
  );
  
  await page.setViewport({width: 1920, height: 1080});
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3006/login', {waitUntil: 'networkidle0', timeout: 30000});
  
  // Wait extra time for any slow-loading content
  console.log('Waiting for content to load...');
  await page.waitForTimeout(5000);
  
  await page.screenshot({path: 'debug-login-screenshot.png', fullPage: true});
  await browser.close();
  console.log('Debug screenshot saved as debug-login-screenshot.png');
})(); 