# DegenDuel Frontend Scripts

This directory contains utility scripts for the DegenDuel frontend.

## Development Scripts

There are three ways to build the DegenDuel frontend:

**Usage:**

```bash
# Variants:
- Production  |  npm run build:prod  |  https://degenduel.me
- Development |  npm run build:dev   |  https://dev.degenduel.me
- Dev. Local  |  npm run build:local |  http://localhost:3010
-- using HMR  |  npm run dev:local   |  http://localhost:3010
```

**Features:**

#### Prod

- Generational idea meets unparalleled execution crossed with awe-inspiring design

#### Dev

- Dedicated subdomain improves testing reliability
- Supports DegenDuel's SSL, authentication, and websockets
- Minification enabled; source map not provided.

#### Local

- Builds with TypeScript checking
- Forces minification to be disabled for easier debugging
- Starts a Vite preview server on port 3010
- Connects to dev.degenduel.me API for backend services
- Preserves WebSocket connections to dev environment

#### Local Using HMR

- Pro: Instantly reflect frontend updates without rebuilds
- Con: Some occasional annoyances due to differences in treatment of things (websockets, for example)

## Inquiries

Please direct any questions about this repository to the garbage can. Thank you.
