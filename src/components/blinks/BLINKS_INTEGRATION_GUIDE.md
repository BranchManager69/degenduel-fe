# DegenDuel Solana Blinks Integration Guide

This comprehensive guide explains how to integrate the Solana Blinks/Actions feature into frontend components.

## Overview

Solana Blinks (Actions) is DegenDuel's implementation of the Solana Actions protocol, enabling:

1. **One-Click Contest Entry**: Users can join contests with AI-selected portfolios
2. **Shareable Links**: Create and share contest links that others can use
3. **View-Only Actions**: Direct links to view live contests or results
4. **Cross-Device Support**: Works on desktop and mobile with proper wallet integration

## Core Components

### BlinkButton

For direct execution of blink actions:

```jsx
import { BlinkButton } from '../blinks/BlinkButton';

<BlinkButton
  blinkUrl="/api/blinks/join-contest"
  params={{ contestId: contest.id }}
  className="w-full py-3 bg-brand-500/20 text-brand-400"
  label="Join Contest"
  onSuccess={(signature) => {
    console.log("Transaction successful:", signature);
    navigate(`/contests/${contest.id}`);
  }}
  onError={(error) => {
    console.error("Transaction failed:", error);
    setError(error.message);
  }}
/>
```

### ShareBlinkButton

For generating shareable links:

```jsx
import { ShareBlinkButton } from '../blinks/ShareBlinkButton';

<ShareBlinkButton
  blinkUrl="/blinks/join-contest"
  params={{ 
    contestId: contest.id,
    referrer: walletAddress || ""  // Optional referrer tracking
  }}
  label="Share Contest"
  className="flex items-center gap-2 px-4 py-2 bg-dark-300/80"
/>
```

### Solana Actions Attributes

For adding Solana Actions support to regular buttons:

```jsx
<button
  onClick={handleJoinContest}
  disabled={!isWalletConnected}
  data-solana-action="true"
  data-action-title="Join Contest with AI Portfolio"
  data-action-url={`https://degenduel.me/api/blinks/join-contest?contest_id=${contest.id}`}
  data-action-message="Join this contest with an AI-selected portfolio of trending tokens"
  className="px-4 py-2 bg-brand-500/20 text-brand-400"
>
  <span>Join with AI Portfolio</span>
</button>
```

## Implementation Guide

### 1. Contest Detail Page Integration

The contest detail page should include:

#### A. Primary Action Button

```jsx
const handleJoinContest = () => {
  // Check for Solana Actions support
  const hasSolanaActions = window.solana && typeof window.solana.action === 'function';
  
  if (hasSolanaActions) {
    // Allow the native Solana Actions flow to proceed without interference
    // The data-solana-action attributes will handle the flow
    return;
  } else {
    // For browsers/wallets without Solana Actions support, provide a fallback
    navigate(`/contests/${contest.id}/select-tokens`);
  }
};

// In your JSX:
<button
  onClick={handleJoinContest}
  disabled={!isWalletConnected}
  data-solana-action="true"
  data-action-title="Join Contest with AI Portfolio"
  data-action-url={`https://degenduel.me/api/blinks/join-contest?contest_id=${contest.id}`}
  className="px-4 py-2 bg-brand-500/20 text-brand-400"
>
  Join with AI Portfolio
</button>
```

#### B. Share Contest Button

```jsx
<ShareBlinkButton 
  contest={contest}
  contestStatus={contestStatus}
  className="mt-2"
/>
```

### 2. Different Action Types

We support three main action types:

#### A. Join Contest (Transaction-Based)

```jsx
<ShareBlinkButton
  blinkUrl="/blinks/join-contest"
  params={{ contestId: contest.id }}
  label="Share Contest"
/>
```

#### B. View Live Contest (View-Only)

```jsx
<ShareBlinkButton
  blinkUrl="/blinks/view-contest"
  params={{ contestId: contest.id }}
  label="Share Live Contest"
/>
```

#### C. View Results (View-Only)

```jsx
<ShareBlinkButton
  blinkUrl="/blinks/view-results"
  params={{ contestId: contest.id }}
  label="Share Results"
/>
```

### 3. MIME Type Handling

All blink URLs are processed through our MIME type solution:

1. When a user accesses a blink URL (e.g., `/blinks/join-contest?contestId=123`):
   - NGINX routes the request to `blinks.html`
   - This file has the correct MIME type and sets up the environment
   - It preserves the original URL parameters and loads the app

2. Once the app loads, `BlinkResolver` automatically:
   - Detects the blink URL parameters
   - Shows the appropriate modal interface
   - Handles wallet connection if needed
   - Processes the action

3. No special handling is needed in your components - the system works seamlessly for both internal and shared links.

## Portfolio Selection Logic

Our AI portfolio selection works as follows:

1. **For Returning Users**:
   - The system analyzes their previous contest entries
   - Creates a portfolio based on their historical preferences
   - Normalizes weights based on past selection frequency

2. **For New Users**:
   - Analyzes current trending tokens
   - Allocates 40% to the top trending token
   - Splits remaining 60% among other promising tokens
   - Creates a balanced portfolio suitable for the contest type

This provides a seamless experience while maintaining the "one-click" nature of Solana Actions.

## Testing Your Integration

### 1. Basic Integration Testing

1. Add the Blinks components to your page
2. Connect a Solana wallet
3. Test the direct action button (should trigger wallet transaction)
4. Test the share button (should copy or share a link)
5. Paste the shared link into a new browser tab (should show the blink modal)

### 2. Edge Case Testing

Test these scenarios:

1. **Wallet Not Connected**: Verify proper handling of non-connected states
2. **Mobile Browser**: Test with mobile browsers using responsive mode
3. **Different Wallets**: Test with Phantom, Solflare, and other wallets
4. **Error States**: Test with network errors and transaction failures
5. **Deep Linking**: Test opening blink URLs from external applications

### 3. NGINX Configuration Testing

After deploying NGINX changes:

1. Access a direct blink URL (e.g., `https://degenduel.me/blinks/join-contest?contestId=123`)
2. Verify no MIME type errors occur in the console
3. Confirm the blink modal displays properly
4. Complete the action to verify the full flow works

## Troubleshooting

### Common Issues

1. **MIME Type Errors**:
   - Check NGINX configuration is properly routing `/blinks/*` to `blinks.html`
   - Verify `blinks.html` is being served with the correct content type

2. **Transaction Failures**:
   - Check wallet connection status
   - Verify transaction parameters in the API response
   - Look for specific Solana transaction errors in the console

3. **Sharing Problems**:
   - For Web Share API issues, test in a supported browser
   - For clipboard issues, verify the site has necessary permissions

### Debug Tools

Use these tools to diagnose issues:

1. `console.log(window.location)` - Check current URL parsing
2. Browser developer tools - Network tab to verify API responses
3. React DevTools - Check component props and state
4. Wallet browser extension - Check transaction requests

## Best Practices

1. **Progressive Enhancement**: Always provide a fallback for users without Solana Actions support
2. **Clear Messaging**: Use descriptive labels and confirm success/failure clearly
3. **Error Handling**: Provide user-friendly error messages when things go wrong
4. **Transaction Preview**: Use the message parameter to explain what the transaction will do
5. **Loading States**: Show appropriate loading indicators during transactions

## Resources

- [Complete Blinks Documentation](/docs/latest/Features/Solana%20Blinks/BLINKS_FIX_SUMMARY.md)
- [NGINX Configuration Guide](/docs/latest/Features/Solana%20Blinks/NGINX_BLINKS_CONFIG_INSTRUCTIONS.md)
- [Solana Actions Official Documentation](https://solana.com/developers/guides/advanced/actions)