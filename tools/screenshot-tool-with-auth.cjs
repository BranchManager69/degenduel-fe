#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Default configuration
const defaultConfig = {
  baseUrl: 'http://127.0.0.1:8080',
  outputDir: './screenshots/',
  viewport: { width: 1920, height: 1080 },
  delay: 3000,
  timeout: 30000,
  fullPage: true,
  quality: 90,
  format: 'png',
  cookies: null // New: support for cookies
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
Screenshot Tool with Authentication - Enhanced webpage screenshot utility

Usage: node screenshot-tool-with-auth.cjs [options] [routes...]

Options:
  -u, --url <url>        Base URL (default: http://127.0.0.1:8080)
  -o, --output <dir>     Output directory (default: ./screenshots/)
  -r, --route <route>    Route/path to screenshot (can be used multiple times)
  -c, --config <file>    Load configuration from JSON file
  --cookies <string>     Cookie string for authentication (format: "name1=value1; name2=value2")
  --width <pixels>       Viewport width (default: 1920)
  --height <pixels>      Viewport height (default: 1080)
  --delay <ms>           Delay before screenshot (default: 3000)
  --timeout <ms>         Page load timeout (default: 30000)
  -h, --help             Show this help

Examples:
  # Screenshot with superadmin authentication
  node screenshot-tool-with-auth.cjs --cookies "session=abc123; role=superadmin" -u "https://degenduel.me" "/superadmin"
  
  # All-pages config with auth
  node screenshot-tool-with-auth.cjs -c all-pages-config.json --cookies "session=your_session_here"

Getting your authentication cookie:
  1. Login to your site as superadmin
  2. Open browser dev tools (F12)
  3. Go to Application/Storage > Cookies
  4. Copy the session cookie value
  5. Use format: --cookies "session=your_session_value_here"
`);
}

async function takeScreenshots(config, routes) {
  // If no routes specified, just screenshot the homepage
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
    
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    for (const route of routes) {
      try {
        let routeConfig = route;
        let routePath = route;
        let routeName = route;
        
        // Handle route objects from config file
        if (typeof route === 'object') {
          routePath = route.path;
          routeName = route.name || route.path;
          // Check if this route requires authentication
          if (route.requiresAuth && !config.cookies) {
            console.log(`⚠️  Skipping ${routePath} - requires authentication but no cookies provided`);
            continue;
          }
        }
        
        // Build full URL
        const url = routePath.startsWith('http') 
          ? routePath 
          : `${config.baseUrl}${routePath}`;
        
        console.log(`📸 Capturing: ${url}`);
        
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: config.timeout 
        });
        
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, config.delay));
        
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
        console.log(`✅ Saved: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        
      } catch (error) {
        console.error(`❌ Failed to capture ${route}:`, error.message);
      }
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
  
  console.log('🚀 Starting authenticated screenshot capture...');
  console.log(`📋 Config:`, {
    baseUrl: config.baseUrl,
    outputDir: config.outputDir,
    viewport: `${config.viewport.width}x${config.viewport.height}`,
    routes: routes.length || 'homepage only',
    authenticated: !!config.cookies
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