# URGENT: Portfolio Update Endpoint Completely Broken

## Problem Summary
The portfolio update functionality is completely non-functional due to fundamental API contract mismatches between frontend and backend.

## Current Error
When trying to update an existing portfolio:
```
Error entering contest
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This occurs because the server returns an HTML 404 page instead of JSON.

## Specific Issues Found

### 1. Endpoint Does Not Exist
**Frontend is calling:** `PUT /api/contests/768/portfolio`
**Server response:** `Cannot PUT /api/contests/768/portfolio`

**Question:** Does this endpoint actually exist? What is the correct URL for updating portfolios?

### 2. Data Format Mismatch
**Backend documentation says it expects:**
```json
{
  "selections": [
    { "token_id": 45, "weight": 50 },
    { "token_id": 67, "weight": 30 }
  ]
}
```

**Frontend is currently sending:**
```json
{
  "wallet_address": "BRANCHVDL53igBiYuvrEfZazXJm24qKQJhyXBUm7z7V",
  "tokens": [
    { "contractAddress": "So11111111111111111111111111111111111111112", "weight": 50 }
  ]
}
```

**Questions:**
- Which format is correct?
- How do we convert `contractAddress` to `token_id`?
- Is there an endpoint to get token IDs from contract addresses?

### 3. Request Structure Mismatch
**Backend expects:** `selections` array with `token_id`
**Frontend sends:** `tokens` array with `contractAddress` plus `wallet_address`

**Question:** What is the exact request structure the backend requires?

## Current Frontend Code (Broken)
```javascript
// This is what's currently being called
await ddApi.contests.updatePortfolio(contestId, portfolioData);

// Which makes this request:
PUT /api/contests/${contestId}/portfolio
Body: {
  "wallet_address": "...",
  "tokens": [
    { "contractAddress": "...", "weight": ... }
  ]
}
```

## What We Need From Backend Team

### 1. Confirm Working Endpoint
- What is the exact URL for updating portfolios?
- Does it exist and is it implemented?
- What HTTP method should be used?

### 2. Provide Exact Request Format
- Complete example request body
- All required fields
- Data types expected

### 3. Explain Token ID Mapping
- How do we get `token_id` from `contractAddress`?
- Is there a lookup endpoint?
- Should we store token IDs in the frontend?

### 4. Test the Endpoint
Please test this with a real request and provide:
- Working curl command
- Expected response format
- Error response examples

## Temporary Workaround Needed
Until this is fixed, should we:
1. Disable portfolio updates entirely?
2. Always use the "enter contest" endpoint even for existing participants?
3. Use a different approach?

## Impact
- Users cannot update their portfolios
- "Update Portfolio" button is completely broken
- Contest participation flow is broken for existing participants

**This is blocking the entire portfolio update feature and needs immediate attention.**