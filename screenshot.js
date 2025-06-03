import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  await page.goto('https://degenduel.me/login', {waitUntil: 'networkidle2'});
  await page.screenshot({path: 'login-page-screenshot.png', fullPage: true});
  await browser.close();
  console.log('Screenshot saved as login-page-screenshot.png');
})(); 