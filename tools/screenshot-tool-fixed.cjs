#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Default configuration
const defaultConfig = {
  baseUrl: 'http://127.0.0.1:8080',
  outputDir: './screenshots/',
  viewport: { width: 1920, height: 1080 },
  delay: 1000, // Reduced from 3000
  timeout: 30000,
  fullPage: true,
  quality: 90,
  format: 'png',
  cookies: null,
  jwt: null, // New: JWT token for Authorization header
  retries: 3 // New: retry logic
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };
  const routes = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
      case '-u':
        config.baseUrl = args[++i];
        break;
      case '--output':
      case '-o':
        config.outputDir = args[++i];
        break;
      case '--cookies':
      case '--cookie':
        config.cookies = args[++i];
        break;
      case '--jwt':
      case '--token':
        config.jwt = args[++i];
        break;
      case '--width':
        config.viewport.width = parseInt(args[++i]);
        break;
      case '--height':
        config.viewport.height = parseInt(args[++i]);
        break;
      case '--delay':
        config.delay = parseInt(args[++i]);
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]);
        break;
      case '--retries':
        config.retries = parseInt(args[++i]);
        break;
      case '--mobile':
        config.viewport = { width: 375, height: 667 };
        break;
      case '--tablet':
        config.viewport = { width: 768, height: 1024 };
        break;
      case '--desktop':
        config.viewport = { width: 1920, height: 1080 };
        break;
      case '--route':
      case '-r':
        routes.push(args[++i]);
        break;
      case '--config':
      case '-c':
        const configFile = args[++i];
        if (fs.existsSync(configFile)) {
          const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          Object.assign(config, fileConfig);
          if (fileConfig.routes) routes.push(...fileConfig.routes);
        }
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('/') || arg.startsWith('#/')) {
          routes.push(arg);
        }
        break;
    }
  }
  
  return { config, routes };
}

function showHelp() {
  console.log(`
Screenshot Tool FIXED - Enhanced with proper auth and performance

Usage: node screenshot-tool-fixed.cjs [options] [routes...]

Options:
  -u, --url <url>        Base URL (default: http://127.0.0.1:8080)
  -o, --output <dir>     Output directory (default: ./screenshots/)
  -r, --route <route>    Route/path to screenshot (can be used multiple times)
  -c, --config <file>    Load configuration from JSON file
  --cookies <string>     Cookie string for authentication
  --jwt <token>          JWT token for Authorization header (better for APIs)
  --retries <num>        Number of retries per route (default: 3)
  --mobile               Use mobile viewport (375x667)
  --tablet               Use tablet viewport (768x1024)  
  --desktop              Use desktop viewport (1920x1080)
  --width <pixels>       Custom viewport width
  --height <pixels>      Custom viewport height
  --delay <ms>           Base delay before screenshot (default: 1000)
  --timeout <ms>         Page load timeout (default: 30000)
  -h, --help             Show this help

Examples:
  # SuperAdmin with JWT (recommended)
  node screenshot-tool-fixed.cjs --jwt "your_jwt_token" -u "https://degenduel.me" "/superadmin"
  
  # All pages with JWT
  node screenshot-tool-fixed.cjs -c all-pages-config.json --jwt "your_jwt_token"
  
  # Mobile screenshots
  node screenshot-tool-fixed.cjs --mobile --jwt "token" "/dashboard"
`);
}

// Smart waiting function
async function smartWait(page, config) {
  try {
    // Wait for main content indicators
    await Promise.race([
      page.waitForSelector('main', { timeout: 2000 }),
      page.waitForSelector('.container', { timeout: 2000 }),
      page.waitForSelector('[data-testid="loaded"]', { timeout: 2000 }),
      page.waitForSelector('.dashboard', { timeout: 2000 }),
      page.waitForSelector('.superadmin', { timeout: 2000 }),
      new Promise(resolve => setTimeout(resolve, 2000)) // fallback
    ]);
  } catch (e) {
    // If no selectors found, just wait the base delay
  }
  
  // Additional delay for dynamic content
  await new Promise(resolve => setTimeout(resolve, config.delay));
}

// Retry wrapper
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`⚠️  Retry ${i + 1}/${retries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function screenshotRoute(page, route, config) {
  return withRetry(async () => {
    let routePath = route;
    let routeName = route;
    
    // Handle route objects from config file
    if (typeof route === 'object') {
      routePath = route.path;
      routeName = route.name || route.path;
      
      if (route.requiresAuth && !config.cookies && !config.jwt) {
        console.log(`⚠️  Skipping ${routePath} - requires authentication`);
        return null;
      }
    }
    
    // Build full URL
    const url = routePath.startsWith('http') 
      ? routePath 
      : `${config.baseUrl}${routePath}`;
    
    console.log(`📸 Capturing: ${url}`);
    
    // Set JWT token in Authorization header if provided
    if (config.jwt) {
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${config.jwt}`
      });
    }
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: config.timeout 
    });
    
    // Smart waiting instead of fixed delay
    await smartWait(page, config);
    
    // Generate filename
    const sanitizedName = routeName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'page';
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `${sanitizedName}-${timestamp}.${config.format}`;
    const filepath = path.join(config.outputDir, filename);
    
    // Take screenshot
    const screenshotOptions = {
      path: filepath,
      fullPage: config.fullPage
    };
    
    if (config.format === 'jpeg' || config.format === 'jpg') {
      screenshotOptions.quality = config.quality;
    }
    
    await page.screenshot(screenshotOptions);
    
    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Saved: ${filename} (${sizeMB}MB)`);
    
    // Flag suspiciously small files
    if (stats.size < 50000) {
      console.log(`⚠️  Warning: File is very small (${sizeMB}MB) - might be blank/error page`);
    }
    
    return { filename, size: stats.size };
  }, config.retries);
}

async function takeScreenshots(config, routes) {
  if (routes.length === 0) {
    routes.push('/');
  }
  
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
    await page.setViewport(config.viewport);
    
    // Set cookies if provided
    if (config.cookies) {
      console.log('🍪 Setting authentication cookies...');
      const cookiePairs = config.cookies.split(';').map(c => c.trim());
      const cookieObjects = cookiePairs.map(pair => {
        const [name, value] = pair.split('=').map(p => p.trim());
        return {
          name,
          value,
          domain: new URL(config.baseUrl).hostname,
          path: '/'
        };
      });
      
      await page.setCookie(...cookieObjects);
      console.log(`✅ Set ${cookieObjects.length} authentication cookies`);
    }
    
    // JWT auth notice
    if (config.jwt) {
      console.log('🔑 Using JWT Authorization header authentication');
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    const results = [];
    
    // Process routes sequentially (could be made parallel later)
    for (const route of routes) {
      try {
        const result = await screenshotRoute(page, route, config);
        if (result) results.push(result);
      } catch (error) {
        console.error(`❌ Failed to capture ${route}:`, error.message);
      }
    }
    
    // Summary
    const totalSize = results.reduce((sum, r) => sum + r.size, 0);
    const avgSize = (totalSize / results.length / 1024 / 1024).toFixed(2);
    console.log(`\n📊 Summary: ${results.length} screenshots, avg size: ${avgSize}MB`);
    
    const smallFiles = results.filter(r => r.size < 50000);
    if (smallFiles.length > 0) {
      console.log(`⚠️  ${smallFiles.length} suspiciously small files detected (possible auth issues)`);
    }
    
  } catch (error) {
    console.error('❌ Screenshot process failed:', error);
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  const { config, routes } = parseArgs();
  
  console.log('🚀 Starting FIXED screenshot capture...');
  console.log(`📋 Config:`, {
    baseUrl: config.baseUrl,
    outputDir: config.outputDir,
    viewport: `${config.viewport.width}x${config.viewport.height}`,
    routes: routes.length || 'homepage only',
    auth: config.jwt ? 'JWT' : config.cookies ? 'Cookies' : 'None',
    retries: config.retries
  });
  
  await takeScreenshots(config, routes);
  console.log('🎉 Screenshot process completed');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { takeScreenshots, parseArgs, defaultConfig }; 