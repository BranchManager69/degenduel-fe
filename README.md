<h1 align="center">
  ⚔️ DEGENDUEL ⚔️ 
</h1>
<h2 align="center">
  Client Frontend
</h2>
<p align="center"><i>Looking for the <a href="https://github.com/oyoops/degenduel">Server Backend</a> repo?</i> (auth required)</p>
</br>

<div align="center">
  <p>
    DegenDuel is a hunt for god candles, giga-alpha, and cooks in pursuit of ultimate <b>degen supremacy.</b>
    <br>
    Sharpen your trading skills while competing for big bragging rights and <b>even bigger top payouts.</b>
  </p>
</div>

</br>

<h2 align="center">
   📙 README
</h2>

</br>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![PM2](https://img.shields.io/badge/PM2-5.3-green)](https://pm2.keymetrics.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)](https://www.postgresql.org/)

## 📚 Developer Resources

### API Reference

- I am providing a public DegenDuel API. Work in progress and free of charge.
- Please refer to the [Public DegenDuel API Docs](https://degenduel.me/api-docs) (Swagger) for the complete API reference.
- Private beta testers can refer to the [Private DegenDuel API Docs](https://github.com/oyoops/degenduel/blob/main/_API_REFERENCE.md) (authorization required) for endpoints related to administration, analytics, debugging, etc.

## 🌟 Features

### Web3 Integration

- Phantom Wallet connection
- Wallet address verification
- Secure authentication flow
- Session management
- Network detection (mainnet/devnet)

### Authentication System

#### Client-Side Authentication Flow

1. **Initial Wallet Connection**

   - User connects Phantom wallet
   - Frontend retrieves wallet public key
   - Stores wallet address in Zustand store

2. **Challenge Request**

   - Frontend requests challenge nonce from `/api/auth/challenge?wallet={address}`
   - Server generates unique nonce and stores it with expiration
   - Nonce returned to client

3. **Message Signing**

   - Client constructs message:
     ```
     DegenDuel Authentication
     Wallet: {wallet_address}
     Nonce: {nonce}
     Timestamp: {timestamp}
     ```
   - Message signed using Phantom wallet
   - Signature returned as 64-byte array

4. **Wallet Verification**

   - Client sends to `/api/auth/verify-wallet`:
     ```json
     {
       "wallet": "address",
       "signature": "[64-byte array]",
       "message": "signed message"
     }
     ```
   - Server verifies:
     - Nonce exists and hasn't expired
     - Message contains correct nonce
     - Signature is valid for wallet

5. **Session Management**
   - Server creates/updates user in database
   - Generates JWT token with user data
   - Sets HTTP-only session cookie
   - Cookie configuration:
     ```javascript
     {
       httpOnly: true,
       secure: true in production,
       sameSite: 'lax',
       maxAge: 24 * 60 * 60 * 1000  // 24 hours
       domain: '.degenduel.me' in production
     }
     ```

#### Server-Side Implementation

1. **Environment Detection**

   - Development: localhost/127.0.0.1
   - Production: degenduel.me domain
   - Environment-specific cookie settings

2. **Protected Routes**

   - Middleware chain:
     - `requireAuth`: Verifies session cookie and JWT
     - `requireAdmin`: Checks admin role
     - `requireSuperAdmin`: Checks superadmin role

3. **Security Features**

   - HTTP-only cookies prevent XSS
   - JWT with role-based access control
   - Nonce expiration prevents replay attacks
   - Environment-aware security settings

4. **Error Handling**
   - Development: Detailed error messages
   - Production: Limited error information
   - Proper status codes (401, 403, etc.)

### Real-Time Trading Simulation

- Live token prices from DexScreener API
- Real-time portfolio updates
- Accurate price tracking
- Historical price charts

### Portfolio Management

- Position tracking
- Trade history
- Performance metrics
- Unrealized/realized P&L
- Win streak tracking

### Advanced Trading Features

- Hot tokens feed
- Token search
- Price alerts
- Market statistics

### User Experience

- Dark/Light mode
- Responsive design
- Real-time updates
- Trade animations
- Performance optimizations

## 🚀 Quick Installation

### Prerequisites

```bash
node -v  # Must be 20.x or higher
npm -v   # Must be 8.x or higher
```

### Development Setup

1. Clone and install:

   ```bash
   git clone https://github.com/yourusername/branchbet.git
   cd branchbet
   npm install
   ```

2. Initialize the database:

   ```bash
   npm run init-db
   ```

3. Start development servers:

   ```bash
   npm run dev  # Starts both frontend and API servers
   ```

4. Access the application:
   - Frontend: [http://localhost:3002](http://localhost:3002)
   - API: [http://localhost:3003](http://localhost:3003)

### Production Deployment

1. Build and start:

   ```bash
   npm run build  # Build frontend
   npm start      # Start PM2 processes
   ```

2. Monitor services:
   ```bash
   npm run status  # Check PM2 status
   npm run logs    # View application logs
   ```

## 🏗️ Technical Architecture

### System Overview

past:

```mermaid
graph TD
    A[Nginx Reverse Proxy] --> B[Frontend Server :3002]
    A --> C[API Server :3003]
    B --> D[DexScreener API]
    C --> E[(PostgreSQL Database)]

    subgraph "Frontend Services"
        B --> F[Static Assets]
        B --> G[React SPA]
        G --> H[Zustand Store]
    end

    subgraph "Backend Services"
        C --> I[Express API]
        I --> J[PostgreSQL Models]
        I --> K[Web3 Services]
    end
```

future:

```mermaid
graph TD
    A[Nginx Reverse Proxy] --> B[Frontend Server, Static + SPA]
    A --> C[Backend API Server]
    C --> D[(PostgreSQL Database)]
    C --> E[Web3 Services]
    C --> F[DexScreener API]

    subgraph "Frontend Services"
        B --> G[React SPA]
        G --> H[Zustand Store]
    end

    subgraph "Backend Services"
        C --> I[Express API]
        I --> J[PostgreSQL Models]
    end
```

### Key Technologies

- **Frontend Stack**

  - React 18.3 with TypeScript
  - Zustand for state management
  - Tailwind CSS for styling
  - Recharts for data visualization
  - Vite for development/building
  - Phantom Wallet SDK

- **Backend Stack**
  - Node.js with Express
  - PostgreSQL for persistence
  - Winston for logging
  - PM2 for process management

## 📁 Project Organization

### Directory Structure

```
branchbet/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/             # React hooks
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── server/                 # Backend source
│   ├── config/            # Configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Server utilities
└── scripts/               # Tooling scripts
```

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3003
VITE_WS_URL=ws://localhost:3003

# Backend (.env)
PORT=3003
NODE_ENV=development
DB_URL=postgresql://username:password@localhost:5432/dbname
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "frontend",
      script: "server/frontend.js",
      env: {
        PORT: 3002,
      },
    },
    {
      name: "api",
      script: "server/server.js",
      env: {
        PORT: 3003,
      },
    },
  ],
};
```

## 🔍 Monitoring

### Available Commands

```bash
# System Status
npm run status    # PM2 process status
npm run logs      # All application logs
npm run logs:api  # API server logs only

# Maintenance
npm run rebuild   # Rebuild application
npm run restart   # Restart services
```

## 🔒 Security

### Implemented Measures

1. **API Security**

   - Rate limiting
   - Input validation
   - CORS policies
   - Error sanitization

2. **Frontend Security**

   - XSS prevention
   - Content Security Policy
   - Secure dependencies
   - Regular updates

3. **Infrastructure**

   - HTTPS enforcement
   - Secure headers
   - Database security
   - Access controls

4. **Wallet Security**
   - Message signing
   - Network validation
   - Session management
   - Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Workflow

```bash
git checkout -b feature/your-feature
npm install
npm run dev
# Make changes
npm run test
git commit -m "feat: your feature"
git push origin feature/your-feature
```

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Twitter**: [@BranchManager69](https://twitter.com/BranchManager69)
- **Discord**: Join our server
- **Blog**: [blog.branch.bet](https://blog.branch.bet)

---

<div align="center">
  <p><b>DEGENDUEL</b> | Battle for degenerate supremacy.</p>
  <p>Sharpen your trading skills while competing to win real prizes. Ape and jeet with zero risk.</p>
  <p><b>DEGENDUEL</b> is a Branch Manager production. All rights reserved.</p>
</div>

## 💬 Contest Chat System

The Contest Chat system enables real-time communication between contest participants, enhancing the social and competitive aspects of DegenDuel.

### Key Components

#### ContestChat Component

- Real-time messaging between contest participants
- User presence indicators
- Message timestamps
- Profile pictures for participants
- Admin message highlighting
- Rate limiting protection

#### FloatingContestChat Component

- Minimizable chat interface
- Unread message notifications
- Contest status indicators
- Ability to participate in multiple contest chats simultaneously
- Visual styling based on user role (regular user, admin, superadmin)

#### ContestChatManager Component

- Manages multiple chat instances
- Provides a unified interface for accessing all active contest chats
- Animated notification badge for unread messages
- Visually appealing toggle button with hover effects

#### AdminChatManager Component

- Admin-only interface for monitoring all contest chats
- Ability to join any contest chat without being visible to participants
- Distinctive red styling for admin identification
- Real-time monitoring of multiple chats
- Filter and search contests by name and status

#### SuperAdminChatManager Component

- SuperAdmin-only interface with enhanced capabilities
- Gold-themed styling for visual distinction
- Ability to send broadcast messages to selected contests or all contests
- Advanced monitoring capabilities
- Complete contest management from a single interface

### Role-Based Chat Features

The chat system provides different capabilities based on user roles:

1. **Regular Users**

   - Can only access chats for contests they're participating in
   - Messages appear with purple styling for admins
   - Standard chat interface with brand colors

2. **Admins**

   - Can monitor any contest chat without being visible to participants
   - Red-themed interface for visual distinction
   - Messages appear with red styling in the chat
   - Can view all contest chats simultaneously

3. **SuperAdmins**
   - All admin capabilities plus:
   - Gold-themed interface for visual distinction
   - Can send broadcast messages to selected contests
   - Can send global broadcasts to all contests
   - Messages appear with gold styling in the chat

### WebSocket Implementation

The chat system uses WebSockets for real-time communication:

```typescript
// Sample WebSocket message types
interface ChatMessage {
  type: "chat";
  messageId: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
  profilePicture?: string;
}

interface RoomStateMessage {
  type: "room_state";
  participants: Participant[];
  messages: ChatMessage[];
}
```

### Usage Example

```tsx
// Basic usage of ContestChat
<ContestChat contestId="123" />

// Using the floating chat system
<FloatingContestChat
  contest={contestData}
  onClose={() => handleClose()}
  position={0}
  isActive={true}
  onActivate={() => setActiveChat(contestData.contestId)}
/>

// For administrators
<AdminChatManager />

// For super administrators
<SuperAdminChatManager />
```

### Security Features

- WebSocket authentication using JWT tokens
- Rate limiting to prevent spam
- Admin message verification
- Secure participant tracking
- Role-based access control for admin features
- Invisible monitoring for admins and superadmins

### UI/UX Considerations

- Responsive design works on all devices
- Keyboard accessibility
- Unread message indicators
- Visual differentiation between user and admin messages
- Role-specific color schemes (purple for regular admins, red for admins, gold for superadmins)
- Smooth animations and transitions
