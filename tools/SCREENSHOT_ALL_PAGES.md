# Screenshot All Pages (Including Admin/SuperAdmin)

This guide shows you how to take screenshots of ALL pages on your site, including protected admin and superadmin pages.

## 🚀 Quick Start

### Step 1: Get Your Authentication Cookie

1. **Login to degenduel.me as superadmin**
2. **Open browser dev tools** (F12)
3. **Go to Console tab**
4. **Paste this code and press Enter:**

```javascript
getDegenDuelCookies()
```

5. **Copy the cookie string** that appears (it will look like `--cookies "session=abc123; other=value"`)

### Step 2: Run the Screenshot Tool

```bash
cd tools
node screenshot-tool-with-auth.cjs -c all-pages-config.json --cookies "your_cookie_string_here"
```

## 📁 What Gets Created

The tool will create `screenshots/all-pages/` with screenshots of:

### Public Pages
- Homepage
- Login page  
- Contests listing
- Leaderboard
- Contest results demo

### Authenticated Pages
- User profile
- User dashboard

### Admin Pages
- Admin dashboard
- Admin chat dashboard
- Connection debugger
- WebSocket hub
- SkyDuel console

### SuperAdmin Pages
- SuperAdmin dashboard
- Wallet monitoring
- Control hub
- SuperAdmin chat dashboard
- Services management
- Switchboard
- Circuit breaker
- AI testing panel
- Liquidity simulator
- WebSocket monitor
- API playground
- WSS playground
- AMM simulator

## 🛠️ Tools Created

- `screenshot-tool-with-auth.cjs` - Enhanced screenshot tool with cookie support
- `all-pages-config.json` - Configuration with all your routes
- `get-cookie-helper.js` - Browser console helper to extract cookies

## 🔧 Manual Cookie Extraction (Alternative)

If the helper doesn't work:

1. Login as superadmin
2. Open dev tools → Application/Storage → Cookies
3. Copy all cookie values manually
4. Format as: `"cookie1=value1; cookie2=value2"`

## 📸 Example Output

```
🚀 Starting authenticated screenshot capture...
📋 Config: {
  baseUrl: 'https://degenduel.me',
  outputDir: '../screenshots/all-pages/',
  viewport: '1920x1080',
  routes: 25,
  authenticated: true
}
🍪 Setting authentication cookies...
✅ Set 3 authentication cookies
📸 Capturing: https://degenduel.me/
✅ Saved: homepage-2025-06-03-07-15-23.png (2.1MB)
📸 Capturing: https://degenduel.me/superadmin
✅ Saved: superadmin-dashboard-2025-06-03-07-15-28.png (1.8MB)
...
🎉 Screenshot process completed
```

## 🎯 Quick Commands

```bash
# Just public pages (no auth needed)
node screenshot-tool.cjs -u "https://degenduel.me" "/" "/login" "/contests"

# Single superadmin page
node screenshot-tool-with-auth.cjs --cookies "your_cookies" -u "https://degenduel.me" "/superadmin"

# All pages with auth
node screenshot-tool-with-auth.cjs -c all-pages-config.json --cookies "your_cookies"
``` 