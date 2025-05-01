# Solana Blinks/Actions System

This directory contains components for integrating with the Solana Actions protocol, referred to as "Blinks" in DegenDuel. These components enable the creation and processing of shareable URLs that trigger on-chain actions.

## Core Components

- **BlinkResolver**: Detects and processes blink URLs, rendering a modal interface for wallet connection and transaction execution
- **BlinkButton**: Executes blink actions, handling wallet connection and transaction signing with comprehensive error management
- **ShareBlinkButton**: Generates and shares blink URLs with other users via clipboard or native sharing APIs
- **SolanaWalletConnector**: Provides a streamlined wallet connection UI specifically for blink actions

## How It Works

### URL Structure

Blinks use URLs in the format: `/blinks/[action-name]?param1=value1&param2=value2`

Examples:
- `/blinks/join-contest?contestId=123` - Join a contest with AI-selected portfolio
- `/blinks/view-contest?contestId=123` - View a live contest
- `/blinks/view-results?contestId=123` - View contest results

### Client-Server Flow

1. **Client Side**:
   - When a user opens a blink URL, our NGINX configuration serves `blinks.html`
   - `BlinkResolver` processes the URL parameters and displays a modal
   - User connects their wallet (if not already connected)
   - Transaction is signed and sent to the blockchain
   - User is redirected to the appropriate page based on the action type

2. **Server Side**:
   - GET requests to blink endpoints return metadata (title, description, etc.)
   - POST requests generate and return Solana transactions for signing
   - Transactions are processed on-chain after user approval

### MIME Type Solution

We've implemented a robust solution for handling blink URLs with proper MIME types:

1. **Dedicated Entry Point**: A `blinks.html` file handles all blink URL requests
2. **NGINX Configuration**: Special location blocks rewrite `/blinks/*` paths to serve `blinks.html`
3. **Parameter Preservation**: Original URL parameters are preserved during redirection
4. **Progressive Enhancement**: Fallbacks ensure functionality across different browsers and wallets

## Integration Examples

### Sharing a Contest

```jsx
<ShareBlinkButton
  blinkUrl="/blinks/join-contest"
  params={{ 
    contestId: contest.id.toString(),
    referrer: walletAddress || ""
  }}
  label="Share Contest"
  className="bg-dark-300/80 hover:bg-dark-300 text-brand-400 hover:text-brand-300"
/>
```

### Adding Solana Actions to a Button

```jsx
<button
  onClick={handleJoinContest}
  disabled={!isWalletConnected}
  data-solana-action="true"
  data-action-title="Join Contest with AI Portfolio"
  data-action-url={`https://degenduel.me/api/blinks/join-contest?contest_id=${contest.id}`}
  data-action-message="Join this contest with an AI-selected portfolio of trending tokens"
  className="px-4 py-2 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:text-brand-300 rounded-md transition-colors"
>
  <span>Join with AI Portfolio</span>
</button>
```

### Direct Execution of a Blink Action

```jsx
<BlinkButton
  blinkUrl="/api/blinks/join-contest"
  params={{ contestId: "abc123" }}
  onSuccess={(signature) => {
    console.log("Success:", signature);
    navigateToContest(contestId);
  }}
  onError={(error) => {
    console.error("Error:", error);
    showErrorNotification(error.message);
  }}
/>
```

## Important Considerations

### Transaction Types

1. **Transaction-Based Actions**: (e.g., joining contests)
   - Require wallet connection and signing
   - Return a transaction object for the wallet to process
   - Include proper error handling for transaction failures

2. **View-Only Actions**: (e.g., viewing contest results)
   - Don't require a transaction
   - Simply redirect the user to the appropriate page
   - Still provide a consistent UX through the blink modal

### Edge Cases

- **Mobile Sharing**: Uses the native Web Share API when available
- **Clipboard Fallback**: For browsers without sharing support
- **Progressive Enhancement**: Works even when Solana Actions aren't supported
- **Error States**: Proper handling of network errors, wallet connection issues, etc.

## Troubleshooting

If blink links aren't working correctly, check:

1. **NGINX Configuration**: Ensure `/blinks/*` is properly routed to `blinks.html`
2. **Console Errors**: Check the browser console for specific error messages
3. **Wallet Connection**: Verify that the wallet is properly connected
4. **Network Issues**: Check if the API endpoints are accessible
5. **Transaction Errors**: Look for specific Solana transaction errors

For detailed deployment information, see the NGINX configuration guide in the docs directory.

## Documentation References

- [BLINKS_FIX_SUMMARY.md](/docs/latest/Features/Solana%20Blinks/BLINKS_FIX_SUMMARY.md) - Details on the MIME type solution
- [NGINX_BLINKS_CONFIG_INSTRUCTIONS.md](/docs/latest/Features/Solana%20Blinks/NGINX_BLINKS_CONFIG_INSTRUCTIONS.md) - Server configuration guide