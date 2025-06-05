# Token Data Flow Bible - DegenDuel Frontend

**Created:** December 6, 2024  
**Purpose:** Complete documentation of how token data flows through the DegenDuel frontend application

---

## 🎯 Direct Impact Areas

### 1. **TokensPage** (`/tokens`)
- ✅ **YES - AFFECTED** 
- Uses `useStandardizedTokenData` → calls `/api/tokens/trending`
- Currently limited to 200 tokens on main display
- **Would benefit from pagination**

### 2. **PortfolioTokenSelectionPage** (`/contests/[id]/select-tokens`)
- ✅ **YES - AFFECTED**
- Uses `useStandardizedTokenData` → calls `/api/tokens/trending`
- Currently users can only select from first 200 tokens
- **Critical need for pagination** to see all quality tokens

### 3. **UnifiedTicker** (Header ticker)
- ✅ **YES - AFFECTED** for hot tokens
- Fetches hot tokens via `/api/tokens/trending?quality_level=relaxed`
- Currently limited but scrolls through available tokens
- **Would get more variety** with limit removed

### 4. **Landing Page Components**
- ✅ **YES - AFFECTED**
  - `HotTokensList` - Shows trending tokens
  - `MarketTickerGrid` - Displays token grid
  - `MarketStatsPanel` - Shows market statistics
  - All use `useStandardizedTokenData` → trending endpoint

### 5. **DegenDuelTop30** Component
- ✅ **YES - AFFECTED**
- Directly calls `/api/tokens/trending` 
- Currently shows max 30 (within 200 limit)
- **Could show true top 30** from larger pool

## 📊 How Data Flows

```
/api/tokens/trending endpoint
    ↓
ddApi.tokens.getAll() 
    ↓
useTokenData hook (fallback)
    ↓
useStandardizedTokenData hook
    ↓
Components (TokensPage, Portfolio, Tickers, etc.)
```

## 🔧 What Each Place Needs

1. **TokensPage & PortfolioPage**
   - Need full pagination (offset, limit, hasMore)
   - Currently stuck at 200 tokens max
   - Users can't browse/select beyond that

2. **Tickers & Landing Page**
   - Just need the 200 limit removed
   - Don't need pagination (they auto-scroll)
   - Would benefit from larger token variety

3. **DegenDuelTop30**
   - Just needs more tokens to choose from
   - Still only displays 30 but from better pool

## ⚠️ Critical Finding

The **WebSocket market-data** is separate and provides real-time updates. The trending endpoint is used for:
- Initial page load
- Fallback when WebSocket disconnects
- Hot tokens fetching
- Quality token lists

## 💡 Bottom Line

**EVERY major token display** in the app would benefit from this change:
- ✅ Main tokens page - needs pagination
- ✅ Portfolio selection - needs pagination  
- ✅ All tickers - need variety
- ✅ Landing page widgets - need variety
- ✅ Top 30 display - needs larger pool

The 200 limit is artificially constraining the **ENTIRE APPLICATION** from showing users the full range of quality tokens!

---

## 🔍 Detailed Token Data Fetching Mechanisms

### 1. **REST API Endpoints**

#### Direct API Calls:
- **`/api/tokens/trending`** - Used for trending/hot tokens
  - `useStandardizedTokenData` hook fetches hot tokens from this endpoint with `quality_level=relaxed` and `min_change=5`
  - `useDegenDuelTop30` hook fetches from this endpoint (defaults to strict quality when no quality_level specified)
  - `ddApi.tokens.getAll()` in dd-api.ts actually calls `/api/tokens/trending?limit=1000`

- **`/api/tokens/search`** - Used for token search functionality
  - `TokenSearch` component uses this for search suggestions
  - `TokensPage` uses this to fetch DUEL token data specifically

- **`/api/tokens`** - General token endpoint
  - `tokens.getAll()` in api/tokens.ts uses this endpoint with optional filters

### 2. **WebSocket Subscriptions**

- **`market-data` topic** - Primary source for real-time token data
  - `useTokenData` hook subscribes to this topic for all token data
  - Falls back to REST API (`ddApi.tokens.getAll()`) for initial load
  - Server-side filtered to eliminate duplicates

### 3. **Hook Usage**

#### Primary Hooks:
- **`useStandardizedTokenData`** - Main hook for UI components
  - Uses `useTokenData` internally for WebSocket data
  - Fetches hot tokens separately via REST API
  - Provides filtering, sorting, and utility functions
  - Used by: TokensPage, PortfolioTokenSelectionPage, UnifiedTicker, MarketTickerGrid, HotTokensList, etc.

- **`useTokenData`** - WebSocket-based hook
  - Subscribes to `market-data` topic
  - Falls back to REST API for initial data
  - Used directly by some components and indirectly through `useStandardizedTokenData`

- **`useDegenDuelTop30`** - Specialized hook for top trending tokens
  - Fetches from `/api/tokens/trending` REST endpoint
  - Auto-refreshes every 30 seconds by default
  - Used by: DegenDuelTop30 component

### 4. **Affected Components**

Components that would be affected by trending endpoint changes:

1. **Pages:**
   - `TokensPage` - Uses `useStandardizedTokenData` and displays DegenDuelTop30
   - `PortfolioTokenSelectionPage` - Uses `useStandardizedTokenData`
   - `LandingPage` - Uses `ddApi.tokens.getAll()` for token data

2. **Components:**
   - `UnifiedTicker` - Uses `useStandardizedTokenData` for hot tokens
   - `DegenDuelTop30` - Uses `useDegenDuelTop30` hook
   - `HotTokensList` / `StandardizedHotTokensList` - Uses `useStandardizedTokenData`
   - `MarketTickerGrid` - Uses `useStandardizedTokenData`
   - `MarketStatsPanel` / `StandardizedMarketStatsPanel` - Uses `useStandardizedTokenData`
   - `TokensPreviewSection` - Uses `useStandardizedTokenData`

3. **Debug/Admin Components:**
   - `TokenDataDebug` - Uses `useStandardizedTokenData`
   - Various admin panels that display token data

### 5. **Key Findings**

1. **The main `/api/tokens/trending` endpoint is used in two ways:**
   - With `quality_level=relaxed` for hot tokens (5%+ movers)
   - Without quality_level (defaults to strict) for DegenDuel Top 30

2. **Most components don't directly fetch token data** - they use the standardized hooks which handle both WebSocket and REST API data

3. **The WebSocket `market-data` topic is the primary source** for real-time token updates, with REST API as fallback

4. **Token search uses a separate endpoint** (`/api/tokens/search`) which is independent of the trending endpoint

## 📈 Data Flow Architecture

```
                            ┌─────────────────────┐
                            │   Component Layer   │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │useStandardizedTokenData│
                            └──────────┬──────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                              │
     ┌──────────▼──────────┐                       ┌──────────▼──────────┐
     │    useTokenData     │                       │  REST API Calls     │
     │  (WebSocket-based)  │                       │ (Hot tokens, etc)   │
     └──────────┬──────────┘                       └──────────┬──────────┘
                │                                              │
     ┌──────────▼──────────┐                       ┌──────────▼──────────┐
     │ WebSocket Connection│                       │ /api/tokens/trending│
     │   market-data topic │                       │ (200 token limit!)  │
     └─────────────────────┘                       └─────────────────────┘
```

This architecture means that changes to the trending endpoint would primarily affect:
- Hot tokens display in various components
- DegenDuel Top 30 display
- The initial token list loaded by `ddApi.tokens.getAll()`
- Portfolio selection available tokens
- Main tokens page browsing capability

## 🚨 The 200 Token Limit Problem

The artificial 200 token limit in `/api/tokens/trending` is constraining:
1. **Users can only see/select from 200 tokens** out of ~5-10K quality tokens
2. **Infinity scroll breaks** at 200 tokens
3. **Portfolio selection is limited** to first 200 tokens
4. **Tickers show less variety** than they could
5. **Top 30 might not be the true top 30** from the full quality set

## 🔮 Future State with Pagination

Once the trending endpoint supports pagination:
1. **TokensPage** - Full infinity scroll through all quality tokens
2. **PortfolioTokenSelectionPage** - Access to all ~5-10K quality tokens for selection
3. **Tickers** - More variety in hot tokens display
4. **DegenDuelTop30** - True top 30 from full quality token set
5. **Better UX** - Users see the full range of quality tokens, not arbitrary subset