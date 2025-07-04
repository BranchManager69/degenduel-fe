const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;

async function captureLogoAnimation(options = {}) {
  const {
    logoType = 'dd-clean',  // 'full', 'dd', 'dd-clean', 'full-clean'
    mode = 'epic',          // 'standard', 'epic', 'extreme'
    outputSize = 500,       // Output size in pixels (square)
    outputPath = 'logo_auto.gif'
  } = options;
  
  console.log('🎬 Starting automated logo capture...');
  console.log(`   Logo: ${logoType}, Mode: ${mode}, Size: ${outputSize}px`);
  
  const browser = await puppeteer.launch({
    headless: false, // Need false for video capture
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport to capture size
    await page.setViewport({ width: 1080, height: 1080 });
    
    // Go to logo showcase
    await page.goto('http://localhost:3010/logo-showcase', {
      waitUntil: 'networkidle2'
    });
    
    // Wait for controls to load
    await page.waitForSelector('button:has-text("DD Clean")', { timeout: 5000 });
    
    // Select logo type
    const logoButtonText = {
      'full': 'Full Logo',
      'dd': 'DD Only',
      'dd-clean': 'DD Clean',
      'full-clean': 'Full Clean'
    }[logoType];
    
    await page.click(`button:has-text("${logoButtonText}")`);
    await page.waitForTimeout(200);
    
    // Select animation mode
    const modeButton = mode.charAt(0).toUpperCase() + mode.slice(1);
    await page.click(`button:has-text("${modeButton}")`);
    await page.waitForTimeout(200);
    
    // Set green background
    await page.click('button:has-text("Green")');
    await page.waitForTimeout(200);
    
    // Hide controls
    await page.click('button:has-text("Hide Controls")');
    await page.waitForTimeout(500);
    
    // Create temporary video file path
    const tempVideo = `/tmp/logo_capture_${Date.now()}.mp4`;
    
    console.log('📹 Starting screen recording...');
    
    // Get the page's position for recording
    const { x, y } = await page.evaluate(() => {
      const rect = document.querySelector('.min-h-screen').getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    
    // Start FFmpeg screen recording of the browser window
    const recordCmd = `ffmpeg -y -video_size 1080x1080 -framerate 60 -f x11grab -i :0.0+${x},${y} -t 4 -c:v libx264 -preset ultrafast -crf 0 ${tempVideo}`;
    exec(recordCmd);
    
    // Wait a moment for recording to start
    await page.waitForTimeout(500);
    
    // Trigger animation restart
    await page.keyboard.press('r');
    
    // Wait for animation to complete
    await page.waitForTimeout(3700); // 3.2s animation + buffer
    
    // Recording will auto-stop after 4 seconds due to -t 4 flag
    
    console.log('🎨 Processing video with chromakey...');
    
    // Process with FFmpeg - chromakey and resize
    const ffmpegCmd = `ffmpeg -i ${tempVideo} -vf "chromakey=0x60C26B:0.05:0.005,format=rgba,scale=${outputSize}:${outputSize}:flags=lanczos,fps=30,split[s0][s1];[s0]palettegen=reserve_transparent=1:max_colors=256[p];[s1][p]paletteuse=alpha_threshold=128" -loop 0 ${outputPath}`;
    
    await execAsync(ffmpegCmd);
    
    // Clean up temp file
    await fs.unlink(tempVideo);
    
    // Get file size
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Success! Created ${outputPath} (${sizeMB}MB)`);
    
    // If file is too large for platform (>4.5MB), suggest smaller size
    if (stats.size > 4.5 * 1024 * 1024) {
      console.log(`⚠️  File exceeds 4.5MB limit. Try with smaller size:`);
      console.log(`   node capture-logo-animation.js --size 400`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Simple CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse simple command line args
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'size') {
      options.outputSize = parseInt(value);
    } else if (key === 'logo') {
      options.logoType = value;
    } else if (key === 'mode') {
      options.mode = value;
    } else if (key === 'output') {
      options.outputPath = value;
    }
  }
  
  console.log('🚀 DD Logo Capture Tool');
  console.log('Usage: node capture-logo-animation.js [options]');
  console.log('Options:');
  console.log('  --logo [dd-clean|dd|full|full-clean]');
  console.log('  --mode [standard|epic|extreme]');
  console.log('  --size [pixels] (output size, e.g. 500)');
  console.log('  --output [filename.gif]');
  console.log('');
  
  captureLogoAnimation(options).catch(console.error);
}

module.exports = { captureLogoAnimation };