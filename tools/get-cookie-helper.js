// Get Cookie Helper
// Run this in your browser console when logged in as superadmin

console.log(`
🍪 DEGENDUEL COOKIE EXTRACTOR 🍪

Copy and paste this into your browser console while logged in as superadmin:
`);

// Function to extract session cookies
function getDegenDuelCookies() {
  const cookies = document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.length > 0)
    .map(cookie => {
      const [name, value] = cookie.split('=');
      return { name: name.trim(), value: value ? value.trim() : '' };
    });
  
  console.log('🔍 All cookies found:', cookies);
  
  // Look for session-related cookies
  const sessionCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes('session') ||
    cookie.name.toLowerCase().includes('auth') ||
    cookie.name.toLowerCase().includes('token') ||
    cookie.name === 'connect.sid' // common express session cookie name
  );
  
  console.log('🎯 Session cookies found:', sessionCookies);
  
  // Format for screenshot tool
  const cookieString = cookies
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  
  console.log('📋 Cookie string for screenshot tool:');
  console.log(`--cookies "${cookieString}"`);
  
  console.log('\n🚀 Full command example:');
  console.log(`cd tools && node screenshot-tool-with-auth.cjs -c all-pages-config.json --cookies "${cookieString}"`);
  
  return cookieString;
}

// Browser console instructions
console.log(`
📖 INSTRUCTIONS:

1. Login to degenduel.me as superadmin
2. Open browser dev tools (F12)
3. Go to Console tab
4. Paste this code and press Enter:

getDegenDuelCookies()

5. Copy the cookie string that appears
6. Use it with the screenshot tool like this:

cd tools
node screenshot-tool-with-auth.cjs -c all-pages-config.json --cookies "your_cookie_string_here"

`);

// Export the function
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDegenDuelCookies };
} 