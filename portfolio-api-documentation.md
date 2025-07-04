# Updated Portfolio API Documentation

## GET /api/portfolios/user/:wallet

Returns all portfolios for a user across all contests with enhanced data including SOL values, token quantities, and comprehensive performance metrics.

### Endpoint
```
GET /api/portfolios/user/:wallet
```

### Query Parameters
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip for pagination (default: 0)
- `include_tokens` (optional): Include detailed token information (default: "true")
- `include_performance` (optional): Include performance metrics for completed contests (default: "false")

### Example Request
```bash
curl -X GET "https://degenduel.me/api/portfolios/user/5RbsCTp7Z3ZBs6LRg8cvtZkF1FtAt4GndEtdsWQCzVy8?include_tokens=true&include_performance=true&limit=10"
```

### Response Structure

```typescript
interface PortfolioResponse {
  portfolios: Portfolio[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  sol_price_used: number | null;  // Current SOL price in USD
  timestamp: string;               // ISO timestamp of response
}

interface Portfolio {
  // Contest Information
  contest_id: number;
  contest: {
    id: number;
    name: string;
    status: "pending" | "active" | "completed" | "cancelled";
    start_time: string;  // ISO timestamp
    end_time: string;    // ISO timestamp
    entry_fee: string;
    prize_pool: string;
  };
  
  // Participation Details
  wallet_address: string;
  joined_at: string;      // ISO timestamp
  rank: number;           // Current rank (0 if not set)
  final_rank: number;     // Final rank after contest ends
  
  // Portfolio Values (NEW: Now includes SOL values)
  portfolio_value: string;         // DEPRECATED: Use portfolio_value_usd
  portfolio_value_usd: number;     // Current/final value in USD
  portfolio_value_sol: number | null;  // Current/final value in SOL
  
  // Token Holdings
  portfolio: TokenHolding[];
  has_portfolio: boolean;
  
  // Performance Metrics (when include_performance=true AND contest is completed)
  performance?: PerformanceMetrics;
}

interface TokenHolding {
  token_id: number;
  weight: number;           // Allocation percentage (0-100)
  quantity: number | null;  // NEW: Actual token amount held
  value_usd: number;        // NEW: Token value in USD
  value_sol: number | null; // NEW: Token value in SOL
  
  // Token details (when include_tokens=true)
  token?: {
    id: number;
    address: string;      // Contract address
    symbol: string;       // Token ticker
    name: string;         // Full token name
    image_url: string;    // Token logo URL
    color: string;        // Hex color code
    
    // Real-time price data
    price: string;        // Current price in USD
    change_24h: string;   // 24h change percentage
    market_cap: string;   // Market cap in USD
    volume_24h: string | null;  // 24h volume (can be null)
  };
}

interface PerformanceMetrics {
  // USD Values
  initial_balance: string;      // DEPRECATED: Use initial_balance_usd
  initial_balance_usd: number;
  final_balance: string;        // DEPRECATED: Use final_balance_usd  
  final_balance_usd: number;
  
  // SOL Values (NEW)
  initial_balance_sol: number | null;
  final_balance_sol: number | null;
  
  // Profit/Loss (NEW)
  pnl_usd: number;
  pnl_sol: number | null;
  pnl_percent: number;  // Percentage gain/loss
  
  // Other
  prize_amount: string | null;  // Prize won (if any)
  roi: string;                  // Return on investment (e.g., "8.44%")
}
```

### Example Response

```json
{
  "portfolios": [
    {
      "contest_id": 1325,
      "contest": {
        "id": 1325,
        "name": "The Beta Play",
        "status": "completed",
        "start_time": "2025-06-26T02:35:10.486Z",
        "end_time": "2025-06-26T03:05:00.000Z",
        "entry_fee": "0",
        "prize_pool": "0"
      },
      "wallet_address": "5RbsCTp7Z3ZBs6LRg8cvtZkF1FtAt4GndEtdsWQCzVy8",
      "joined_at": "2025-06-26T01:19:44.098Z",
      "rank": 0,
      "final_rank": 2,
      "portfolio_value": "15771.19746644",
      "portfolio_value_usd": 15771.19746644,
      "portfolio_value_sol": 102.79220314079075,
      "portfolio": [
        {
          "token_id": 19269,
          "weight": 20,
          "quantity": 314149.64084254,
          "value_usd": 3154.239493288,
          "value_sol": 20.558440628158152,
          "token": {
            "id": 19269,
            "address": "9RjwNo6hBPkxayWHCqQD1VjaH8igSizEseNZNbddpump",
            "symbol": "Stupid",
            "name": "StupidCoin",
            "image_url": "https://ipfs.io/ipfs/QmQnRqSSD9E3Ripqoy3b3BNfxomfSbXjBKwDihVhsDWmk5",
            "color": "#3bc2f7",
            "price": "0.00476469",
            "change_24h": "-19.84",
            "market_cap": "4739741",
            "volume_24h": "548125"
          }
        }
        // ... more tokens
      ],
      "has_portfolio": true,
      "performance": {
        "initial_balance": "14543.82465",
        "initial_balance_usd": 14543.82465,
        "final_balance": "15771.19746644",
        "final_balance_usd": 15771.19746644,
        "initial_balance_sol": 94.7925343683051,
        "final_balance_sol": 102.79220314079075,
        "pnl_usd": 1227.37281644,
        "pnl_sol": 7.999668772485649,
        "pnl_percent": 8.43913376279602,
        "prize_amount": null,
        "roi": "8.44%"
      }
    }
    // ... more portfolios
  ],
  "pagination": {
    "total": 4,
    "limit": 10,
    "offset": 0,
    "has_more": false
  },
  "sol_price_used": 153.4279545,
  "timestamp": "2025-07-01T04:22:19.056Z"
}
```

## Key Improvements

### 1. SOL Values Added
- All USD values now have corresponding SOL values
- `portfolio_value_sol`: Total portfolio value in SOL
- `value_sol`: Individual token values in SOL
- Current SOL price included in response (`sol_price_used`)

### 2. Token Quantities Added
- `quantity` field shows actual token amounts held
- Previously only showed weight percentages

### 3. Enhanced Performance Metrics
- Separate USD and SOL values for initial/final balances
- PnL (Profit & Loss) in both USD and SOL
- PnL percentage for easy performance comparison

### 4. Backward Compatibility
- Original fields maintained for compatibility
- New fields added alongside existing ones
- Deprecated fields clearly marked

## Migration Guide for Frontend

### Before (Old Response)
```javascript
// Only USD values and percentages
const portfolioValue = portfolio.portfolio_value; // string
const weight = token.weight; // percentage only
```

### After (New Response)
```javascript
// Access both USD and SOL values
const valueUSD = portfolio.portfolio_value_usd; // number
const valueSOL = portfolio.portfolio_value_sol; // number

// Get token quantities and values
const tokenQuantity = token.quantity; // actual amount
const tokenValueUSD = token.value_usd; // USD value
const tokenValueSOL = token.value_sol; // SOL value

// Enhanced performance metrics
const pnlUSD = portfolio.performance.pnl_usd;
const pnlSOL = portfolio.performance.pnl_sol;
const pnlPercent = portfolio.performance.pnl_percent;
```

## Error Handling

If SOL price cannot be fetched:
- All SOL-related fields will be `null`
- USD values will still be returned
- `sol_price_used` will be `null`

## Rate Limiting
- 20 requests per minute per IP address

## Notes
- Token prices are real-time and may change between requests
- Performance metrics only available for completed contests when `include_performance=true`
- Results ordered by `joined_at DESC` (most recent first)