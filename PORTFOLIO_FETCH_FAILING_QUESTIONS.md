# Portfolio Fetch Failing - Backend Questions

## Problem
The portfolio fetch is completely failing when trying to load existing portfolios for participants. The frontend shows "🔴🔴🔴 FETCHING PORTFOLIO FOR EXISTING PARTICIPANT" but then fails silently.

## Current Frontend Call
```javascript
const portfolioData = await ddApi.portfolio.get(Number(contestId));
```

This makes the request:
```
GET /api/contests/768/portfolio/BRANCHVDL53igBiYuvrEfZazXJm24qKQJhyXBUm7z7V
```

## Questions for Backend Team

### 1. Does the portfolio GET endpoint actually work?
- Can you test `GET /api/contests/768/portfolio/BRANCHVDL53igBiYuvrEfZazXJm24qKQJhyXBUm7z7V` with proper auth?
- What HTTP status code does it return?
- What is the exact response body?

### 2. What is the correct response format?
The frontend expects:
```json
{
  "tokens": [
    {
      "contractAddress": "So11111111111111111111111111111111111111112",
      "weight": 50
    }
  ]
}
```

Is this correct? Or is it something else like:
```json
{
  "selections": [...],
  "portfolio": [...],
  etc...
}
```

### 3. Authentication Issues?
- Does this endpoint require authentication?
- What headers/cookies are required?
- Is the session token we're using valid for this endpoint?

### 4. Test Request
Please provide a working curl command that successfully fetches a portfolio, including:
- Correct headers
- Valid authentication
- Expected response

### 5. Error Handling
- What status codes are returned for different scenarios?
- What error format is returned?
- How do we distinguish between "no portfolio" vs "authentication failed"?

## What We Need
A working example of fetching an existing portfolio so we can fix the frontend to match the backend's actual behavior.

**The current implementation is completely broken and we need the exact working API specification.**