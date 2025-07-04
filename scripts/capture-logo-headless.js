import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function captureLogoHeadless(options = {}) {
  const {
    logoType = 'dd-clean',
    mode = 'epic',
    outputSize = 500,
    outputPath = 'logo_headless.gif'
  } = options;
  
  console.log('🎬 Starting headless logo capture...');
  console.log(`   Logo: ${logoType}, Mode: ${mode}, Size: ${outputSize}px`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to logo showcase
    console.log('📍 Navigating to logo showcase...');
    await page.goto('http://localhost:3010/logo-showcase', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for page to fully load
    await new Promise(r => setTimeout(r, 3000));
    
    // Configure animation settings by clicking buttons
    console.log('🎯 Configuring logo settings...');
    
    // Click the appropriate logo button
    const logoButtons = {
      'full': 'Full Logo',
      'dd': 'DD Only', 
      'dd-clean': 'DD Clean',
      'full-clean': 'Full Clean'
    };
    
    await page.evaluate((buttonText) => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === buttonText) {
          btn.click();
        }
      });
    }, logoButtons[logoType]);
    
    await new Promise(r => setTimeout(r, 500));
    
    // Set mode
    await page.evaluate((modeText) => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === modeText) {
          btn.click();
        }
      });
    }, mode.charAt(0).toUpperCase() + mode.slice(1));
    
    await new Promise(r => setTimeout(r, 500));
    
    // Use transparent background instead of green for cleaner result
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === 'Transparent') {
          btn.click();
        }
      });
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Hide controls
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === 'Hide Controls') {
          btn.click();
        }
      });
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('📸 Capturing animation frames...');
    
    // Create frames directory
    const framesDir = `/tmp/logo_frames_${Date.now()}`;
    await fs.mkdir(framesDir, { recursive: true });
    
    // Restart animation by pressing 'r'
    await page.keyboard.press('r');
    await new Promise(r => setTimeout(r, 100));
    
    // Get logo bounds - find the actual logo container
    const logoBounds = await page.evaluate(() => {
      const logoContainer = document.querySelector('.logo-container');
      
      if (!logoContainer) {
        console.error('Could not find logo container!');
        return {
          x: window.innerWidth / 2 - 200,
          y: window.innerHeight / 2 - 200,
          width: 400,
          height: 400
        };
      }
      
      const rect = logoContainer.getBoundingClientRect();
      const padding = 50;
      return {
        x: Math.max(0, rect.x - padding),
        y: Math.max(0, rect.y - padding),
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      };
    });
    
    console.log(`📐 Logo bounds: ${JSON.stringify(logoBounds)}`);
    
    // Make clip area square
    const size = Math.max(logoBounds.width, logoBounds.height);
    const clip = {
      x: logoBounds.x + (logoBounds.width - size) / 2,
      y: logoBounds.y + (logoBounds.height - size) / 2,
      width: size,
      height: size
    };
    
    // Calculate frame count based on animation duration
    const animationDuration = mode === 'extreme' ? 5.2 : (mode === 'epic' ? 3.9 : 2.8);
    const fps = 30;
    const frameCount = Math.ceil(animationDuration * fps);
    const frameDelay = 1000 / fps;
    
    console.log(`🎬 Capturing ${frameCount} frames at ${fps}fps for ${animationDuration}s animation...`);
    
    // Capture frames with transparent background
    for (let i = 0; i < frameCount; i++) {
      await page.screenshot({
        path: path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`),
        clip: clip,
        omitBackground: true // Creates transparent background
      });
      
      if (i % 20 === 0) {
        console.log(`   Frame ${i}/${frameCount}...`);
      }
      
      await new Promise(r => setTimeout(r, frameDelay));
    }
    
    console.log('🎨 Creating transparent GIF...');
    
    // Create GIF directly from transparent PNGs - no chromakey needed!
    const gifCmd = `ffmpeg -y -framerate ${fps} -pattern_type glob -i '${framesDir}/frame_*.png' \
      -vf "scale=${outputSize}:${outputSize}:flags=lanczos,split[s0][s1];[s0]palettegen=reserve_transparent=1:stats_mode=single:max_colors=256[p];[s1][p]paletteuse=alpha_threshold=128:dither=none" \
      -loop 0 ${outputPath}`;
    
    await execAsync(gifCmd);
    
    // Clean up frames
    await execAsync(`rm -rf ${framesDir}`);
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Success! Created ${outputPath} (${sizeMB}MB)`);
    
    if (stats.size > 4.5 * 1024 * 1024) {
      console.log(`⚠️  File exceeds 4.5MB limit. Try smaller size or shorter animation.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Run it
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'size') options.outputSize = parseInt(value);
  else if (key === 'logo') options.logoType = value;
  else if (key === 'mode') options.mode = value;
  else if (key === 'output') options.outputPath = value;
}

captureLogoHeadless(options).catch(console.error);

export { captureLogoHeadless };