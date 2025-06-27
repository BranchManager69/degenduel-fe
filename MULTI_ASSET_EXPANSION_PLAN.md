# Multi-Asset Fantasy Trading Platform Expansion Plan

## Executive Summary

Transform DegenDuel from crypto-only contests into a revolutionary multi-asset fantasy trading platform combining crypto, stocks, commodities, and sports betting odds into unified portfolio competitions.

## Phase 1: Core Architecture Extension (Week 1)

### Data Model Evolution
- Expand the `Token` type to a generic `Asset` interface
- Create specialized types: `CryptoAsset`, `StockAsset`, `CommodityAsset`, `SportsBetAsset`
- Implement unified pricing model where everything has a normalized 0-1 or dollar value
- Add `assetClass` field to portfolio entries

### Backend Requirements
- New data source integrations:
  - **Sports**: Odds API providers (DraftKings, FanDuel APIs)
  - **Stocks**: Polygon.io or Alpha Vantage for real-time quotes
  - **Commodities**: Commodities futures data feeds
- Unified pricing engine that converts all assets to comparable values
- WebSocket channels per asset class: `stocks:price:AAPL`, `sports:odds:NBA_LAL_GSW`

## Phase 2: Contest System Adaptation (Weeks 2-3)

### Contest Types
- **Classic Crypto** - Current system unchanged
- **Multi-Asset Mayhem** - Mix any asset types with allocation limits
- **Sports Showdown** - Pure sports betting portfolios
- **Traditional Trader** - Stocks and commodities only
- **Degen Supreme** - No limits, any asset class

### Portfolio Rules Engine
- Implement allocation constraints (e.g., max 30% sports bets)
- Time-based restrictions (sports bets lock at game time)
- Settlement timing (instant for crypto, delayed for sports outcomes)

## Phase 3: UI/UX Enhancements (Week 4)

### Asset Selection Interface
```
Portfolio Builder:
┌─────────────────────────────┐
│ CRYPTO (40%)               │
│ ├─ SOL: 25%                │
│ └─ DUEL: 15%               │
│                             │
│ STOCKS (30%)               │
│ ├─ TSLA: 20%               │
│ └─ NVDA: 10%               │
│                             │
│ SPORTS (30%)               │
│ ├─ Lakers ML: 15%          │
│ └─ NFL Over 48.5: 15%      │
└─────────────────────────────┘
```

### Real-time Updates
- Unified portfolio value chart showing all asset contributions
- Color-coded by asset class
- Live odds movements shown as price changes
- "Event countdown" timers for sports bets

## Phase 4: Unique Features (Week 5)

### Smart Integrations
- **Parlay Tokens**: Bundle multiple sports bets as a single portfolio asset
- **Futures Contracts**: Add commodity futures with expiration dates
- **Volatility Mixing**: Algorithm to balance high-volatility crypto with steady stocks
- **Live Pivoting**: Allow portfolio adjustments until sports events begin

### Risk/Reward Mechanics
- Display implied probability for sports bets
- Show max possible portfolio value if all bets hit
- "Heat map" showing correlation between assets
- Victory conditions beyond just "highest value wins"

## Technical Implementation Strategy

### Database Schema Changes
```sql
-- New assets table
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  asset_type VARCHAR(20), -- 'crypto', 'stock', 'commodity', 'sports_bet'
  symbol VARCHAR(50),
  name VARCHAR(200),
  metadata JSONB, -- Flexible for different asset types
  current_price DECIMAL,
  last_updated TIMESTAMP
);

-- Sports-specific data
CREATE TABLE sports_events (
  id SERIAL PRIMARY KEY,
  sport VARCHAR(50),
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  event_time TIMESTAMP,
  status VARCHAR(20)
);

-- Sports bets as assets
CREATE TABLE sports_bet_assets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES sports_events(id),
  bet_type VARCHAR(50), -- 'moneyline', 'spread', 'total'
  selection VARCHAR(200), -- 'Lakers -5.5', 'Over 215.5'
  american_odds INTEGER, -- -150, +200, etc
  implied_probability DECIMAL,
  current_price DECIMAL, -- 0 to 1 based on probability
  expires_at TIMESTAMP,
  settled_at TIMESTAMP,
  final_value DECIMAL -- 0 or 1 after settlement
);
```

### API Endpoint Structure
```typescript
// Asset discovery
GET /api/assets/search?type=all&query=lakers
GET /api/assets/crypto/trending
GET /api/assets/sports/upcoming
GET /api/assets/stocks/movers

// Portfolio management
POST /api/assets/portfolio/validate
GET /api/assets/portfolio/:contestId/value
WS /api/assets/subscribe/:portfolioId

// Real-time feeds
WS crypto:price:*
WS stocks:price:*
WS sports:odds:*
WS commodities:futures:*
```

### Asset Type Interfaces
```typescript
interface BaseAsset {
  id: string;
  type: 'crypto' | 'stock' | 'commodity' | 'sports_bet';
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  lastUpdate: Date;
}

interface SportsBetAsset extends BaseAsset {
  type: 'sports_bet';
  eventId: string;
  sport: string;
  betType: 'moneyline' | 'spread' | 'total' | 'prop';
  selection: string;
  americanOdds: number;
  impliedProbability: number;
  eventTime: Date;
  isLive: boolean;
  settlesAt: Date;
  possiblePayout: number; // Multiplier if bet wins
}

interface PortfolioAsset {
  asset: BaseAsset;
  allocation: number; // Percentage
  quantity: number;
  initialValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}
```

## Monetization Opportunities

### Tier 1: Free Features
- Basic crypto contests
- Limited sports bet selections
- Standard 10-asset portfolios

### Tier 2: Premium ($9.99/month)
- All asset classes unlocked
- 25-asset portfolios
- Advanced analytics dashboard
- Historical performance data

### Tier 3: Pro Trader ($29.99/month)
- Unlimited portfolio size
- Custom contest creation
- API access for automated strategies
- Priority data feeds
- Advanced correlation analysis

### Additional Revenue Streams
1. **Contest Creation Fees** - $1-5 for custom rule sets
2. **Data Feed Licensing** - Sell aggregated sentiment data
3. **Sponsored Assets** - Feature new tokens/stocks for a fee
4. **Tournament Entry Fees** - Major events with prize pools

## Risk Mitigation

### Legal Compliance
- Clear disclaimers about sports betting regulations
- Geolocation compliance for restricted regions
- Separate "play money" mode for restricted jurisdictions
- Partner with licensed operators where required

### Technical Safeguards
- Circuit breakers for extreme price movements
- Delayed settlement for disputed sports outcomes
- Maximum exposure limits per asset class
- Automated portfolio rebalancing options

## Success Metrics

### Week 1-2 KPIs
- Technical integration completion rate
- API response times under load
- Asset data accuracy validation

### Week 3-4 KPIs
- Beta user onboarding (target: 100 users)
- Multi-asset portfolio creation rate
- Cross-asset contest participation

### Week 5+ KPIs
- Daily active users creating diverse portfolios
- Revenue per user from premium features
- Average assets per portfolio
- Contest completion rates by type

## Competitive Advantages

1. **First Mover** - No platform combines all these asset types
2. **Unified Experience** - Single portfolio for all speculation
3. **Real Money Feel** - Sports bets add immediate gratification
4. **Network Effects** - More asset types attract diverse users
5. **Data Moat** - Unique cross-asset correlation insights

## Implementation Priorities

### Must Have (Week 1)
- [ ] Asset type architecture
- [ ] Sports odds data feed
- [ ] Unified pricing engine
- [ ] Basic portfolio validator

### Should Have (Week 2-3)
- [ ] Multi-asset UI
- [ ] Contest type templates
- [ ] Real-time portfolio updates
- [ ] Settlement system

### Nice to Have (Week 4-5)
- [ ] Advanced analytics
- [ ] Mobile optimization
- [ ] Social features
- [ ] Automated strategies

## Next Steps

1. **Technical Spike** - Validate sports odds API integration
2. **Legal Review** - Confirm compliance requirements by jurisdiction
3. **Design Sprint** - Create UI mockups for multi-asset portfolio builder
4. **Partner Outreach** - Contact data providers for pricing
5. **Beta Program** - Recruit 100 power users for early access

---

*This plan positions DegenDuel as the world's first unified speculation platform, where users can build portfolios combining any asset class into competitive fantasy trading contests.*