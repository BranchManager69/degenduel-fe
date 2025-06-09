# Didi AI Assistant - Complete Capabilities Documentation

## Overview
Didi is DegenDuel's advanced AI assistant with extensive tool access and dynamic UI generation capabilities. She operates through both streaming and REST APIs with comprehensive backend integration.

## Core AI Capabilities

### **Model & Intelligence**
- **Model Selection**: Backend-determined (frontend agnostic)
- **Temperature**: 0.6 (balanced creativity/precision)
- **Max Tokens**: 400 per response
- **Streaming Support**: Real-time response streaming with chunked delivery
- **Conversation Memory**: Client-side caching with conversation history tracking
- **Context Awareness**: Full page context and user state awareness

### **Authentication & Access**
- **Session-based**: Cookie authentication (no API keys required)
- **User Context**: Knows user's wallet, portfolio, and permission level
- **Admin Features**: Enhanced capabilities for admin/superadmin users
- **Cross-platform**: Works across all DegenDuel pages and features

## Tool Access & Integrations

### **1. Web Search Tool**
```javascript
{
  type: "web_search",
  enabled: true,
  description: "Search the web for current information"
}
```
**Capabilities:**
- Real-time web searches for current market data
- News and events lookup
- Price verification from external sources
- Regulatory and compliance information
- Protocol updates and announcements

### **2. Dynamic UI Generation**
```javascript
{
  type: "dynamic_ui", 
  enabled: true,
  available_components: 16 different component types
}
```
**Capabilities:**
- Generate interactive charts and visualizations
- Create real-time monitoring dashboards
- Build custom analysis panels
- Deploy temporary widgets and tools

### **3. System Context Integration**
**Real-time Data Access:**
```javascript
system_context: {
  current_date: new Date().toISOString(),
  current_year: new Date().getFullYear(),
  current_month: new Date().getMonth() + 1,
  current_day: new Date().getDate(),
  platform: 'DegenDuel',
  capabilities: ['web_search', 'dynamic_ui', 'market_data', 'token_analysis']
}
```

## Dynamic Components (16 Available)

### **Portfolio & Trading Components**

#### **1. Portfolio Chart** (`portfolio_chart`)
- **Purpose**: Visual portfolio allocation and performance tracking
- **Use Cases**: Portfolio overview, asset allocation, performance analysis
- **Data Required**: Token holdings, weights, current values
- **Example Prompts**: "show my portfolio", "chart my holdings", "portfolio breakdown"

#### **2. Portfolio Summary** (`portfolio_summary`) 
- **Purpose**: Comprehensive portfolio analytics and metrics
- **Use Cases**: Performance review, portfolio health check, investment summary
- **Data Required**: Portfolio data, historical performance, ROI metrics
- **Example Prompts**: "portfolio summary", "how am I doing", "investment review"

#### **3. Performance Metrics** (`performance_metrics`)
- **Purpose**: Advanced trading and portfolio performance analytics
- **Use Cases**: Performance analysis, trading metrics, ROI tracking, Sharpe ratios
- **Data Required**: Trading history, portfolio performance, benchmark data
- **Example Prompts**: "show performance", "trading stats", "how profitable am I"

#### **4. Transaction History** (`transaction_history`)
- **Purpose**: Detailed transaction history and analysis
- **Use Cases**: Transaction review, trading history, tax reporting, audit trails
- **Data Required**: Transaction data, trade history, fees, timestamps
- **Example Prompts**: "transaction history", "my trades", "show transactions"

### **Market Analysis Components**

#### **5. Token Watchlist** (`token_watchlist`)
- **Purpose**: Live updating list of token prices and metrics
- **Use Cases**: Price monitoring, market tracking, alert setup
- **Data Required**: Token addresses, current prices, volume data
- **Example Prompts**: "watch these tokens", "track SOL and ETH", "price monitor"

#### **6. Price Comparison** (`price_comparison`)
- **Purpose**: Compare price movements between multiple tokens
- **Use Cases**: Token analysis, performance comparison, trend analysis
- **Data Required**: Token addresses, price history, volume data
- **Example Prompts**: "compare SOL vs ETH", "show token performance", "price battle"

#### **7. Market Heatmap** (`market_heatmap`)
- **Purpose**: Visual market overview showing performance across tokens
- **Use Cases**: Market overview, sector analysis, trend identification
- **Data Required**: Token list, market caps, price changes, volume
- **Example Prompts**: "market overview", "show me the market", "heatmap view"

#### **8. Token Details** (`token_details`)
- **Purpose**: Detailed information about a specific token
- **Use Cases**: Token research, fundamental analysis, token overview
- **Data Required**: Token address, metadata, price data, social links
- **Example Prompts**: "tell me about SOL", "token info", "research this token"

#### **9. Token Analysis** (`token_analysis`)
- **Purpose**: Deep dive technical and fundamental token analysis
- **Use Cases**: Investment research, token evaluation, market analysis
- **Data Required**: Token metrics, technical indicators, fundamental data
- **Example Prompts**: "analyze token", "token research", "deep dive analysis"

#### **10. Trading Signals** (`trading_signals`)
- **Purpose**: AI-generated trading recommendations and signals
- **Use Cases**: Trading advice, entry/exit points, market analysis
- **Data Required**: Market data, technical indicators, sentiment analysis
- **Example Prompts**: "trading signals", "should I buy", "market recommendations"

### **DeFi & Advanced Features**

#### **11. Liquidity Pools** (`liquidity_pools`)
- **Purpose**: DeFi liquidity pool information and opportunities
- **Use Cases**: Yield farming, liquidity provision, DeFi opportunities
- **Data Required**: Pool data, APY rates, token pairs, TVL
- **Example Prompts**: "liquidity pools", "yield farming", "DeFi opportunities"

#### **12. Token Tracking Monitor (DADDIOS)** (`token_tracking_monitor`)
- **Purpose**: Advanced market intelligence and token data aggregation
- **Alias**: "DADDIOS"
- **Use Cases**: Token tracking, market monitoring, data aggregation, performance analysis
- **Data Required**: Token data streams, market events, aggregator status
- **Example Prompts**: "show DADDIOS", "token monitoring status", "open tracking system"

### **Contest & Social Features**

#### **13. Contest Leaderboard** (`contest_leaderboard`)
- **Purpose**: Live contest rankings and participant performance
- **Use Cases**: Contest tracking, competitive analysis, rank monitoring
- **Data Required**: Contest data, participant rankings, performance metrics
- **Example Prompts**: "contest leaderboard", "show rankings", "who's winning"

#### **14. User Comparison** (`user_comparison`)
- **Purpose**: Compare user performance and statistics
- **Use Cases**: Performance comparison, competitive analysis, benchmarking
- **Data Required**: User profiles, performance metrics, statistics
- **Example Prompts**: "compare users", "vs other traders", "performance comparison"

#### **15. Live Activity Feed** (`live_activity_feed`)
- **Purpose**: Real-time platform activity and events
- **Use Cases**: Activity monitoring, event tracking, platform pulse
- **Data Required**: Activity events, user actions, system events
- **Example Prompts**: "live activity", "what's happening", "recent activity"

### **Utility Components**

#### **16. Alert Panel** (`alert_panel`)
- **Purpose**: Price alerts and notification management
- **Use Cases**: Price alerts, notification setup, alert management
- **Data Required**: Alert rules, current prices, trigger conditions
- **Example Prompts**: "set alerts", "notify me when", "price alerts"

## Context Awareness System

### **Page-Specific Intelligence**

#### **Landing Page** (`/`)
- **Available Tools**: market_overview, trending_tokens
- **Context**: Market stats display, hot tokens showcase
- **Capabilities**: Explain market data, analyze trending tokens, create market visualizations

#### **Tokens Page** (`/tokens`)
- **Available Tools**: token_lookup, price_analysis
- **Context**: Token search and filtering capabilities
- **Capabilities**: Token research, price analysis, watchlist creation, loading status awareness

#### **Contest Pages** (`/contest/*`)
- **Contest Detail** (`/detail`):
  - **Available Tools**: portfolio_lookup, contest_data
  - **Capabilities**: Portfolio optimization advice, rule explanations, strategy recommendations
- **Contest Lobby** (`/lobby`):
  - **Capabilities**: Scoring system explanation, leaderboard analysis, live performance tracking
- **Contest Results** (`/results`):
  - **Capabilities**: Performance analysis, winner analysis, strategy evaluation

#### **Profile Pages** (`/profile/*`)
- **Private Profile** (`/private`):
  - **Available Tools**: user_stats, achievement_lookup
  - **Capabilities**: Stats analysis, achievement tracking, profile optimization
- **Public Profile**:
  - **Capabilities**: Public stats explanation, comparison features

#### **Admin Dashboard** (`/admin`)
- **Available Tools**: admin_tools, system_monitoring
- **Capabilities**: System diagnostics, user management insights, platform analytics

## Proactive Messaging System

### **Smart Timing Logic**
- **Page Load Delay**: 30 seconds minimum
- **Interaction Buffer**: 10 seconds since last user activity
- **Frequency Limit**: One message per page visit
- **Context Checking**: Verifies page state before messaging

### **Contextual Messages**

#### **Tokens Page**
- **If tokens loading**: "Sometimes tokens can take a while to load if they haven't appeared yet."
- **If tokens loaded**: "I can explain any token metrics you see here - just ask about price changes, volume, or what any of the data means."

#### **Contest Pages**
- **Detail Page**: "Want tips for building a winning portfolio for this contest? I can help you understand the rules and strategy."
- **Lobby Page**: "I can explain how the contest scoring works or help you understand what you're seeing in the leaderboard."

#### **General Pages**
- **Landing**: "I can explain any of the market data, hot tokens, or features you see on DegenDuel."
- **Profile**: "I can help you understand your stats, achievements, or explain how the ranking system works."

### **Anti-Spam Features**
- **Session tracking**: Won't repeat messages in same session
- **Interaction-aware**: Resets timer on user activity
- **Page-specific**: Different messages for different contexts
- **Visual indicators**: Glows/pulses when she has something to say

## API Integration

### **Backend Endpoints**
- **Primary**: `/api/ai/didi` (streaming and REST)
- **Token Data**: `/api/ai/data/{tokenAddress}` (direct token lookup)
- **Profile Images**: `/api/profile-image/*` (image generation)

### **Request Format**
```javascript
{
  messages: AIMessage[],
  context: 'ui_terminal' | 'trading' | 'default',
  streaming: boolean,
  structured_output: boolean,
  ui_context: {
    page: string,
    pageType: string,
    pathname: string,
    available_components: string[],
    current_view: string,
    platform: 'DegenDuel'
  },
  tools: [...],
  system_context: {...}
}
```

### **Response Format**
```javascript
{
  content: string,
  tool_calls?: ToolCall[],
  ui_actions?: UIAction[],
  conversationId: string
}
```

## Error Handling & Reliability

### **Error Types**
- **Network Errors**: Automatic retry with fallback
- **Authentication Errors**: Graceful degradation
- **Rate Limiting**: Built-in backoff strategies
- **Server Errors**: Fallback to non-streaming mode

### **Fallback Mechanisms**
- **Streaming Failure**: Automatic fallback to REST API
- **Empty Responses**: Session tracking to prevent future streaming issues
- **Component Errors**: Error boundaries with helpful messages
- **Context Loss**: Conversation history recovery

## Performance Optimizations

### **Lazy Loading**
- All dynamic components are lazy-loaded
- Suspense boundaries with skeleton fallbacks
- Optimized bundle splitting

### **Caching Strategy**
- **Conversation History**: Client-side caching with Map storage
- **Component State**: Persistent component data across sessions
- **API Responses**: Intelligent caching for repeated requests

### **Resource Management**
- **Memory Cleanup**: Automatic conversation cache management
- **Component Lifecycle**: Proper cleanup on component unmount
- **WebSocket Efficiency**: Unified WebSocket system integration

## Usage Examples

### **Basic Interactions**
```javascript
// Simple question
"What's the price of SOL?"

// Component generation
"Show me a portfolio chart"
"Create a watchlist for SOL, ETH, and BTC"
"Compare SOL vs ETH performance"

// Analysis requests
"Analyze this token: [address]"
"What are the best DeFi opportunities?"
"Show me trading signals for SOL"
```

### **Advanced Use Cases**
```javascript
// Multi-component dashboards
"Create a trading dashboard with price charts, signals, and my portfolio"

// Cross-platform analysis
"Compare my performance to other contest participants"

// Real-time monitoring
"Set up live monitoring for these tokens with alerts"

// Research assistance
"Research this new token and create a comprehensive analysis"
```

## Integration Points

### **WebSocket System**
- **Unified Connection**: Uses main WebSocket for real-time data
- **Topic Subscriptions**: Automatic data flow to generated components
- **Live Updates**: Real-time price and market data integration

### **User Context**
- **Authentication State**: Knows user login status and permissions
- **Portfolio Access**: Can access user's actual portfolio data
- **Contest Participation**: Aware of active contests and user positions

### **Platform Integration**
- **Navigation Aware**: Understands current page and available features
- **Feature Detection**: Knows which platform features are accessible
- **State Synchronization**: Maintains state across page navigation

---

This documentation represents Didi's current capabilities as of the latest implementation. Her abilities continue to expand with new components and backend integrations.