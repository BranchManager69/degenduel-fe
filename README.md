<div align="center">
  <img src="https://degenduel.me/assets/media/logos/transparent_WHITE.png" alt="DegenDuel Logo (White)" width="300">
  
  [![CI/CD](https://github.com/BranchManager69/degenduel-fe/actions/workflows/test.yml/badge.svg)](https://github.com/BranchManager69/degenduel-fe/actions/workflows/test.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-violet)](https://vitejs.dev/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)](https://tailwindcss.com/)
  [![Solana](https://img.shields.io/badge/Solana-SDK-green)](https://solana.com/)
</div>

> **Trade. Compete. Conquer.**

## 📋 Overview

DegenDuel is a cutting-edge DeFi trading competition platform where users test their trading skills in timed contests using virtual portfolios with real-time market data. Compete in high-stakes duels, build optimal portfolios, and climb the leaderboards to win prizes – all without risking your actual crypto assets.

**Core value proposition:**
- 🎮 Gamified trading experience with real market data
- 🏆 Compete for prizes in time-limited contests
- 📊 Track performance with detailed analytics
- 🔒 Risk-free environment for honing trading strategies
- 🌟 Earn achievements and rewards

## 🚀 Quick Start

### Prerequisites
- Node.js v20.x or higher
- npm v8.x or higher

### Development Setup
```bash
# Clone repository (with correct URL)
git clone https://github.com/branchmanager69/degenduel-fe.git
cd degenduel-fe

# Install dependencies
npm install

# Run development server
npm run dev

# OR build and serve (recommended)
npm run build:local
```

### Production Builds
```bash
# Development build (unminified)
npm run build:dev &  # Outputs to dist-dev/

# Production build (minified)
npm run build:prod &  # Outputs to dist/
```

## 🏗️ Project Architecture

### Frontend Stack
- **Framework**: React 18.3 with TypeScript 5.7
- **Build Tool**: Vite 5.0
- **State Management**: Zustand 4.5
- **Styling**: Tailwind CSS 3.4
- **UI Libraries**: Headless UI, Radix UI components
- **Visualization**: Recharts, Three.js for 3D elements
- **Animations**: Framer Motion, GSAP
- **Wallet Integration**: Phantom, Solana Wallet Adapter

### Key Features
- **Real-Time Trading**: Live WebSocket connections to token price feeds
- **Contest System**: Multi-tiered contests with different entry requirements
- **Portfolio Management**: Virtual portfolio selection and tracking
- **Achievement System**: Rewards for completing various challenges
- **Real-Time Chat**: Contest-specific chat rooms for participants
- **Referral System**: Earn rewards by referring new users
- **Animated Background**: Dynamic 3D visualization of market data
- **Toast Notifications**: Real-time alerts and notifications

### Deployment Architecture
- **Production**: https://degenduel.me (static files served from `/dist`)
- **Development**: https://dev.degenduel.me (static files served from `/dist-dev`)
- **Local**: Development server on port 3010

## 🛠️ Development Guide

### Project Structure
```
degenduel-fe/
├── app/               # Application components
├── dd-design-concepts/ # Design concepts and prototypes
├── docs_*/            # Documentation organized by type
├── hooks/             # React hooks
├── public/            # Static assets
├── scripts/           # Build and utility scripts
├── src/               # Source code
│   ├── components/    # UI components
│   ├── config/        # Application configuration
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # State management
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── utils/             # Shared utilities
└── various config files
```

### Available Commands

#### Build Commands
```bash
npm run build          # Alias for build:prod
npm run build:dev      # Build for development (unminified)
npm run build:prod     # Build for production (minified)
npm run build:local    # Build and serve locally
npm run build:analyze  # Analyze bundle size
```

#### Development Commands
```bash
npm run dev            # Start development server
npm run dev:local      # Start development server with local API
npm run preview        # Preview production build
```

#### Testing & Type Checking
```bash
npm run test           # Run all tests
npm test -- -t "test name"  # Run specific test
npm test -- --coverage # Run tests with coverage report
npm run type-check     # Run TypeScript type checking
```

See [TESTING.md](./TESTING.md) for comprehensive testing guidelines and CI/CD information.

## 🔌 WebSocket System

DegenDuel uses a comprehensive WebSocket system for real-time data:

- **Token Data**: Real-time price updates
- **Contest Data**: Live contest updates and leaderboards
- **Portfolio Updates**: Real-time portfolio performance
- **Chat System**: Real-time messaging between participants
- **Notifications**: System alerts and achievement notifications
- **Server Status**: Service health monitoring

## 🧩 Main Components

### Contest System
- **Contest Browser**: Discover and join available contests
- **Contest Lobby**: Pre-contest waiting area with rules and participants
- **Contest Detail**: Live contest with real-time leaderboard and performance tracking
- **Contest Results**: Final standings and prize distribution

### User Experience
- **Achievements**: Unlock achievements for various accomplishments
- **Profile**: View contest history and performance statistics
- **Referrals**: Track referral statistics and rewards
- **Wallet Management**: Connect and manage Solana wallet

### Admin Features
- **Contest Management**: Create, edit, and monitor contests
- **User Management**: Search and manage user accounts
- **Ban System**: Ban users and IP addresses with "ban on sight" capability
- **System Monitoring**: WebSocket and service monitoring
- **Analytics Dashboard**: User activity and platform statistics
- **IP Ban Management**: Control access by IP address

## 📦 Integration Points

### Solana Blockchain
- Wallet authentication using Phantom wallet
- Transaction verification
- NFT integration (future)

### External APIs
- DexScreener for token price data
- Virtual Protocol AI integration
- OpenAI API integration for advanced features

## 🔍 Environment Configuration

DegenDuel supports multiple environments through environment variables:

```
# Core Config
VITE_WS_URL=wss://api.degenduel.me
VITE_TREASURY_WALLET=your_wallet_address

# Feature Flags
VITE_ENABLE_ACHIEVEMENTS=true
VITE_ENABLE_REFERRALS=true

# Third-party Integration
VITE_VIRTUALS_GAME_SDK_API_KEY=your_api_key
VITE_OPENAI_API_KEY=your_api_key

# Build Options
VITE_FORCE_DISABLE_MINIFY=false
```

## 🤝 Contributing

1. Check out the [Issues](https://github.com/yourusername/degenduel-fe/issues) tab for open tasks
2. Fork the repository and create your feature branch
3. Make your changes and ensure tests pass
4. Submit a pull request with a comprehensive description of changes

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Additional Resources

- [API Documentation](https://degenduel.me/api-docs)
- [Contest System Specification](/docs_important/Contest_Chat_System/README.md)
- [WebSocket System Guide](/docs_important/WebSockets_and_Services/WEBSOCKET_SYSTEM_GUIDE.md)

## 🛡️ Ban on Sight Feature

The "Ban on Sight" feature allows administrators to quickly ban users directly from user profiles, activity logs, and monitoring panels without navigating to a separate ban management interface.

### Components

- **BanOnSightButton**: A versatile button component with button and icon variants that can be placed on any user-related interface
- **BanIPButton**: Similar component for banning IP addresses directly

### Integration Points

Ban buttons have been integrated in:
1. **Public User Profiles**: For immediately banning suspicious users
2. **Activity Monitor & Logs**: For banning users based on suspicious activity
3. **User Activity Map**: For monitoring and taking action on live user activity
4. **Admin panels**: Throughout the admin interface

### Benefits

- Reduced moderation time by eliminating navigation to dedicated ban interface
- Contextual banning where suspicious activity is first observed
- Consolidated user experience with consistent ban UI across the platform

---

<div align="center">
  <p><b>DegenDuel</b> | Trade. Compete. Conquer.</p>
  <p>Sharpen your trading skills while competing for prizes, with zero risk.</p>
</div>