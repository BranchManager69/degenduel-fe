# DegenDuel frontend

DegenDuel is a Solana trading competition platform. Players connect a wallet, enter a contest and build a token portfolio, then follow its performance against other participants.

This repository contains the React and TypeScript frontend, including contest entry and results, wallet connections, token research, player profiles and administration screens. The last product-code update was August 20, 2025.

## Explore the implementation

- [Application routes and providers](src/App.tsx) connect the public, authenticated and administrator experiences.
- Browse the [contest screens](src/pages/public/contests/) for portfolio selection, lobbies and results.
- [WebSocket hooks](src/hooks/websocket/) handle subscriptions and updates across the application.
- Authentication is organized in [UnifiedAuthContext](src/contexts/UnifiedAuthContext.tsx), alongside Solana wallet providers in the application root.
- The [contest-flow tests](src/tests/contest-flow/) cover the free-contest journey.

## Development

The project uses React 19, Vite 6 and TypeScript 5.8. [package.json](package.json) specifies Node.js 18 or newer and includes development, type-checking, build, Jest and Storybook commands.

Running the complete application requires DegenDuel's API, WebSocket and Solana RPC services. Start with [.env.example](.env.example) and the [configuration](src/config/config.ts) when adapting the frontend to an environment.

