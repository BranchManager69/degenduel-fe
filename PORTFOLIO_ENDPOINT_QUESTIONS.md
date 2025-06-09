# Portfolio Endpoint Questions for Backend Team

## Context
We're trying to detect if a user has already entered a contest so we can show "UPDATE PORTFOLIO" instead of "PREVIEW PORTFOLIO" on the portfolio selection page.

## Current Endpoint
`GET /api/contests/{contestId}/portfolio/{walletAddress}`

## Questions

### 1. What does this endpoint return when a user HAS a portfolio in the contest?
- What's the exact JSON structure?
- Example response?

### 2. What does this endpoint return when a user DOES NOT have a portfolio?
- Is it a 404 status code?
- Does it return `{ tokens: [] }`?
- Or something else?

### 3. Authentication Issues
- The endpoint returns "No session token provided" even when called with:
  - Authorization Bearer header
  - Cookie with dd_session_token
- What's the correct way to authenticate for this endpoint?

### 4. Is there a better endpoint to check if a user is in a contest?
- Should we use a different endpoint?
- Is there a dedicated endpoint like `/api/contests/{contestId}/participants/{walletAddress}`?
- Or should we rely on the `is_participating` flag in the contest details?

### 5. Current Frontend Code
The frontend currently does this:
```javascript
const portfolioData = await ddApi.portfolio.get(Number(contestId));
// If it returns { tokens: [] }, we assume user is not in contest
// But this might be wrong if user IS in contest but has empty portfolio
```

Is this the correct approach?

## What We Need
A reliable way to determine if a user has already entered a contest, so we can:
- Show "UPDATE PORTFOLIO" instead of "PREVIEW PORTFOLIO"
- Handle the submission differently (update vs initial entry)

Please provide the correct approach for detecting existing contest participation.