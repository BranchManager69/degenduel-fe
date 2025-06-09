# Participation Detection Questions for Backend Team

## Current Problem
The frontend has NO reliable way to detect if a user is already participating in a contest. This causes:
- Contest detail page shows "Enter Contest" for existing participants
- Portfolio page shows "Preview Portfolio" instead of "Update Portfolio"
- Wrong endpoints are called (enter vs update)
- Confusing success messages

## Critical Questions

### 1. Contest Details Endpoint
When calling `GET /api/contests/{contestId}`, does the response include an `is_participating` flag?
- What's the exact field name?
- When is it `true` vs `false`?
- Is this flag reliable?

### 2. Portfolio Endpoint Behavior
For `GET /api/contests/{contestId}/portfolio/{walletAddress}`:

**When user IS in contest:**
- What HTTP status code? (200?)
- What's the response body structure?
- Example response?

**When user IS NOT in contest:**
- What HTTP status code? (404?)
- What's the response body?

**When user IS in contest but has EMPTY portfolio:**
- What's returned? `{ tokens: [] }` or something else?

### 3. Entry vs Update Endpoints

**For NEW participants:**
- Endpoint: `POST /api/contests/{contestId}/enter`
- What does it do?

**For EXISTING participants updating portfolio:**
- Endpoint: `PUT /api/contests/{contestId}/portfolio`
- What does it do?
- Or is it a different endpoint?

### 4. Error Handling
When calling `POST /api/contests/{contestId}/enter` for someone already in the contest:
- What error message is returned?
- What HTTP status code?
- Does it update their portfolio anyway, or reject completely?

### 5. Recommended Flow
What's the correct frontend flow?
1. Check participation status how?
2. If participating, use which endpoint to update portfolio?
3. If not participating, use which endpoint to enter?

## What We Need
A clear, reliable way to:
1. Detect if user is already in contest
2. Show appropriate UI ("Enter" vs "Update")
3. Call correct endpoints
4. Show correct success messages

## Current Broken Code
```javascript
// This returns { tokens: [] } for non-participants AND empty portfolios
const portfolioData = await ddApi.portfolio.get(Number(contestId));

// This tries to enter even for existing participants
await ddApi.contests.enterContestWithPortfolio(contestId, portfolioData);
```

Please provide the correct approach!