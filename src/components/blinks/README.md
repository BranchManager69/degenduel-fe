# Solana Blinks Integration

This directory contains components for integrating with the Solana Actions protocol, also known as "Blinks". These components enable DegenDuel to create shareable URLs that can trigger on-chain actions when opened by users.

## Components

- **BlinkResolver**: Renders a modal interface when a blink URL is detected, showing details and allowing users to execute the action
- **BlinkButton**: Button component that executes a blink action, handling wallet connection and transaction signing
- **ShareBlinkButton**: Button for generating and sharing blink URLs with other users
- **SolanaWalletConnector**: Simple wallet connection UI for blink actions
- **ExampleUsage**: Example of how to use these components in your application

## How It Works

1. **URL Structure**:
   - Blinks use URLs in the format: `/blinks/[action-name]?param1=value1&param2=value2`
   - Example: `/blinks/join-contest?contestId=123`

2. **Server Implementation**:
   - The server exposes API endpoints at `/api/blinks/[action-name]`
   - GET requests return metadata about the action
   - POST requests generate and return Solana transactions

3. **Client Flow**:
   - When a user opens a blink URL, `BlinkResolver` detects and processes it
   - If the user's wallet is connected, they can execute the action directly
   - If not, they're prompted to connect their wallet first

## Integration with Server

The blinks API endpoints are defined in `/home/websites/degenduel-fe/src/server/routes/blinks.js` and include:

- `/api/blinks/join-contest` - For joining contests
- `/api/blinks/place-token-bet` - For placing bets on token movements

## MIME Type Handling

Blink URLs require proper MIME type handling when shared externally. We handle this through:

1. A dedicated `blinks.html` file that serves as an entry point for blink URLs
2. NGINX configuration that routes `/blinks/*` requests to this HTML file
3. Client-side code in `BlinkResolver` that processes both direct and redirected blink URLs

## Usage Example

```jsx
// Create a shareable blink
<ShareBlinkButton
  blinkUrl="/blinks/join-contest"
  params={{ contestId: "abc123" }}
  label="Share Contest"
/>

// Directly execute a blink action
<BlinkButton
  blinkUrl="/api/blinks/join-contest"
  params={{ contestId: "abc123" }}
  onSuccess={(signature) => console.log("Success:", signature)}
  onError={(error) => console.error("Error:", error)}
/>
```

## Troubleshooting

If blink links aren't working correctly, check:

1. NGINX configuration - Ensure proper routing for `/blinks/*` paths
2. MIME types - Verify the server is sending the correct content type headers
3. Wallet connection - Test with a connected wallet to eliminate connection issues
4. Console errors - Look for API or transaction-related errors in the browser console