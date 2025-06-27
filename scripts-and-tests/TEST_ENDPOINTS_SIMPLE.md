# Super Simple Portfolio Endpoint Testing

## 1. Get Your Auth Token
1. Open browser DevTools (F12)
2. Go to Application > Storage > Local Storage
3. Copy value of `authToken` or `dd_token`

## 2. Quick Test Commands

Replace `YOUR_TOKEN`, `CONTEST_ID`, and `WALLET_ADDRESS` with your actual values:

```bash
# Test Contest Live Data (includes leaderboard)
curl -H "Authorization: Bearer YOUR_TOKEN" https://degenduel.me/api/contests/CONTEST_ID/live | jq

# Test User Portfolio
curl -H "Authorization: Bearer YOUR_TOKEN" https://degenduel.me/api/contests/CONTEST_ID/portfolio/WALLET_ADDRESS | jq

# Test Contest Details
curl -H "Authorization: Bearer YOUR_TOKEN" https://degenduel.me/api/contests/CONTEST_ID | jq
```

## 3. Example with Real Values

```bash
# Example: Contest 123, wallet 0x1234...abcd, token eyJhbG...
curl -H "Authorization: Bearer eyJhbG..." https://degenduel.me/api/contests/123/live | jq

# Check what fields are returned
curl -s -H "Authorization: Bearer eyJhbG..." https://degenduel.me/api/contests/123/live | jq 'keys'
```

## 4. Test from Browser Console

You can also test directly in browser console:

```javascript
// Get auth token
const token = localStorage.getItem('authToken') || localStorage.getItem('dd_token');

// Test contest live data
fetch('/api/contests/123/live', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test portfolio
fetch('/api/contests/123/portfolio/YOUR_WALLET_ADDRESS', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

## Common Issues

- **401 Unauthorized**: Token is invalid or expired
- **404 Not Found**: Contest ID or wallet address is wrong
- **500 Server Error**: Backend issue

## What to Look For

**Contest Live Data** should return:
- `contest`: Contest details (name, status, times)
- `leaderboard`: Array of participants with performance
- `currentUserPerformance`: Your stats if participating

**Portfolio** should return:
- `tokens`: Array of holdings with weights
- `total_value`: Total portfolio value
- Performance metrics