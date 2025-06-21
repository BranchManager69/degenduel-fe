# Testing Portfolio Endpoints with Session Cookie

## Get Your Session Cookie

1. Open browser DevTools (F12)
2. Go to **Application > Storage > Cookies**
3. Look for cookies like:
   - `connect.sid` 
   - `session`
   - `dd_session`
   - Or any cookie that looks like a session ID

## Test Commands with Cookie

Replace `YOUR_COOKIE_VALUE` and other placeholders:

```bash
# Test Contest Live Data
curl -H "Cookie: connect.sid=YOUR_COOKIE_VALUE" https://degenduel.me/api/contests/CONTEST_ID/live | jq

# Test User Portfolio  
curl -H "Cookie: connect.sid=YOUR_COOKIE_VALUE" https://degenduel.me/api/contests/CONTEST_ID/portfolio/WALLET_ADDRESS | jq

# Test Contest Details
curl -H "Cookie: connect.sid=YOUR_COOKIE_VALUE" https://degenduel.me/api/contests/CONTEST_ID | jq
```

## Example with Multiple Cookies

If you have multiple cookies, include them all:

```bash
curl -H "Cookie: connect.sid=s%3A123abc...; dd_session=xyz789..." \
  https://degenduel.me/api/contests/123/live | jq
```

## Copy Full Cookie Header from Browser

Easiest way:
1. Open Network tab in DevTools
2. Find any request to degenduel.me
3. Right-click > Copy > Copy as cURL
4. Extract the `-H "Cookie: ..."` part

## Test from Browser Console

Since you're already logged in:

```javascript
// This automatically uses your session cookies
fetch('/api/contests/123/live')
  .then(r => r.json())
  .then(console.log);

// Test portfolio
fetch('/api/contests/123/portfolio/YOUR_WALLET')
  .then(r => r.json())
  .then(console.log);
```

## Quick Copy-Paste Test

1. Get contest ID from URL (e.g., `/contests/123` → `123`)
2. Get your wallet from the UI
3. Run in browser console:

```javascript
// Get current contest ID from URL
const contestId = window.location.pathname.match(/contests\/(\d+)/)?.[1];
const wallet = 'YOUR_WALLET_HERE'; // Copy from UI

// Test endpoints
Promise.all([
  fetch(`/api/contests/${contestId}/live`).then(r => r.json()),
  fetch(`/api/contests/${contestId}/portfolio/${wallet}`).then(r => r.json())
]).then(([live, portfolio]) => {
  console.log('Live Data:', live);
  console.log('Portfolio:', portfolio);
});
```

## Common Cookie Names

- `connect.sid` - Express session
- `dd_session` - DegenDuel session
- `session` - Generic session
- `auth` - Auth cookie
- `token` - Token cookie

The actual name depends on the backend setup!