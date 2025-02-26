# Token Data WebSocket Integration Guide

## Overview

This document provides comprehensive guidance on integrating our new real-time token data system into your components. We've implemented a centralized WebSocket connection that broadcasts token data across the entire application, replacing multiple independent API calls with a single, efficient data stream.

## Table of Contents

1. [Benefits](#benefits)
2. [Architecture](#architecture)
3. [Integration Guide](#integration-guide)
4. [API Reference](#api-reference)
5. [Example Implementations](#example-implementations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Benefits

Our new shared token data system provides significant advantages:

- **Single Source of Truth**: All components access the same token data
- **Real-time Updates**: Instant price/market updates across all components
- **Reduced API Load**: 90%+ reduction in API calls for token data
- **Improved Performance**: Less network traffic and faster UI updates
- **Consistent User Experience**: All visualizations update simultaneously
- **Battery/Resource Efficient**: Especially important for mobile users
- **Simplified Development**: No need to manage data fetching in each component

## Architecture

The architecture consists of three primary components:

1. **WebSocket Hook** (`useTokenDataWebSocket`): Manages the WebSocket connection, authentication, reconnection, and data processing
2. **Context Provider** (`TokenDataContext`): Makes token data available throughout the application via React Context
3. **Consumer Components**: Any component that needs token data

```
┌─────────────────────────────────────────┐
│              Browser                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           App                   │    │
│  │     ┌─────────────────┐         │    │
│  │     │TokenDataProvider│         │    │
│  │     └────────┬────────┘         │    │
│  │              │                  │    │
│  │     ┌────────▼────────┐         │    │
│  │     │useTokenDataWS   │◄────────┼────┼──► WebSocket Server
│  │     └────────┬────────┘         │    │        │
│  │              │                  │    │        │
│  │  ┌───────────▼─────────────┐    │    │        │
│  │  │    Components using     │    │    │        │
│  │  │     useTokenData()      │    │    │        │
│  │  └─────────────────────────┘    │    │        │
│  └─────────────────────────────────┘    │        │
└─────────────────────────────────────────┘        ▼
                                             ┌──────────────┐
                                             │ Token Market │
                                             │ Microservice │
                                             └──────────────┘
```

The WebSocket connection authenticates using the same credentials as your regular API, ensuring secure access to market data.

## Integration Guide

### Step 1: Ensure Token Data Provider is Available

The `TokenDataProvider` is already included in `App.tsx`, so token data is available throughout the application.

### Step 2: Import and Use the Hook in Your Component

```typescript
import { useTokenData } from "../contexts/TokenDataContext";

function YourComponent() {
  const { tokens, isConnected, error, lastUpdate } = useTokenData();

  // Rest of your component logic

  return <div>{/* Your component rendering */}</div>;
}
```

### Step 3: Update Your Component Logic

Replace API fetching code with context data usage:

**Before:**

```typescript
const [tokens, setTokens] = useState([]);

useEffect(() => {
  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/tokens");
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    }
  };

  fetchTokens();
  const interval = setInterval(fetchTokens, 30000);
  return () => clearInterval(interval);
}, []);
```

**After:**

```typescript
const { tokens, isConnected } = useTokenData();

// No need for manual fetching, polling, or cleanup!
```

## API Reference

### `useTokenData()` Hook

The main hook you'll use in your components:

```typescript
const {
  tokens, // Array of token data objects
  isConnected, // Boolean indicating WebSocket connection status
  error, // Error message if connection fails (or null)
  lastUpdate, // Date object of last data update (or null)
} = useTokenData();
```

### Token Data Structure

Each token in the `tokens` array has this structure:

```typescript
interface TokenData {
  symbol: string; // Token symbol (e.g., "BTC")
  name: string; // Full name (e.g., "Bitcoin")
  price: string; // Current price as string
  marketCap: string; // Market capitalization as string
  volume24h: string; // 24-hour volume as string
  change24h: string; // 24-hour price change percentage as string
  imageUrl?: string; // URL to token image (optional)
  liquidity?: number; // Liquidity data if available
  status?: "active" | "inactive"; // Token status
}
```

## Example Implementations

### Basic Token List

```tsx
import React from "react";
import { useTokenData } from "../contexts/TokenDataContext";

export const TokenList: React.FC = () => {
  const { tokens, isConnected } = useTokenData();

  if (!isConnected) {
    return <div>Connecting to market data...</div>;
  }

  return (
    <div className="token-list">
      <h2>Market Data</h2>
      <div className="token-table">
        {tokens.map((token) => (
          <div key={token.symbol} className="token-row">
            <img
              src={
                token.imageUrl ||
                `/assets/tokens/${token.symbol.toLowerCase()}.png`
              }
              alt={token.symbol}
              className="token-icon"
            />
            <div className="token-name">{token.name}</div>
            <div className="token-price">
              ${parseFloat(token.price).toFixed(2)}
            </div>
            <div
              className={`token-change ${
                parseFloat(token.change24h) >= 0 ? "positive" : "negative"
              }`}
            >
              {parseFloat(token.change24h).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Price Chart with Real-time Updates

```tsx
import React, { useEffect, useState } from "react";
import { useTokenData } from "../contexts/TokenDataContext";
import { LineChart } from "your-chart-library";

export const TokenPriceChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { tokens, lastUpdate } = useTokenData();
  const [priceHistory, setPriceHistory] = useState<
    { time: Date; price: number }[]
  >([]);

  const token = tokens.find((t) => t.symbol === symbol);

  useEffect(() => {
    if (token && lastUpdate) {
      // Add new price point when data updates
      setPriceHistory((prev) =>
        [
          ...prev,
          {
            time: lastUpdate,
            price: parseFloat(token.price),
          },
        ].slice(-100)
      ); // Keep last 100 points
    }
  }, [token, lastUpdate]);

  if (!token) return <div>Loading token data...</div>;

  return (
    <div className="token-chart">
      <h3>{token.name} Price</h3>
      <LineChart
        data={priceHistory}
        xKey="time"
        yKey="price"
        color={parseFloat(token.change24h) >= 0 ? "#10B981" : "#EF4444"}
      />
    </div>
  );
};
```

### Token Visualization Component

```tsx
import React, { useEffect, useRef } from "react";
import { useTokenData } from "../contexts/TokenDataContext";
import * as d3 from "d3";

export const TokenBubbleChart: React.FC = () => {
  const { tokens, isConnected } = useTokenData();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!tokens.length || !isConnected || !svgRef.current) return;

    // D3 visualization setup
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Create bubble chart based on market cap
    const bubble = d3.pack().size([width, height]).padding(1.5);

    const root = d3
      .hierarchy({ children: tokens })
      .sum((d) => parseFloat(d.marketCap || "0"));

    const nodes = bubble(root)
      .descendants()
      .filter((d) => !d.children);

    // Create or update bubbles
    const bubbles = svg
      .selectAll(".bubble")
      .data(nodes, (d) => d.data.symbol)
      .join("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) =>
        parseFloat(d.data.change24h) >= 0 ? "#10B981" : "#EF4444"
      )
      .attr("opacity", 0.7);

    // Add labels
    svg
      .selectAll(".label")
      .data(nodes, (d) => d.data.symbol)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .text((d) => d.data.symbol)
      .attr("font-size", (d) => d.r / 3)
      .attr("fill", "white");
  }, [tokens, isConnected]);

  return (
    <div className="bubble-chart-container">
      <svg ref={svgRef} width="800" height="600" />
    </div>
  );
};
```

## Best Practices

1. **Subscribe Efficiently**: The context automatically subscribes to all tokens. If you only need a subset, you can filter in your component.

2. **Handle Loading States**: Always check `isConnected` before rendering data-dependent UI.

3. **Parse Numeric Values**: Token data properties are strings to preserve precision. Parse them when performing calculations:

   ```javascript
   const price = parseFloat(token.price);
   const marketCap = parseFloat(token.marketCap);
   ```

4. **Avoid Redundant State**: Don't duplicate token data in component state unless you need to transform it.

5. **Memorize Derived Data**: Use `useMemo` for expensive calculations:

   ```javascript
   const sortedTokens = useMemo(() => {
     return [...tokens].sort(
       (a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap)
     );
   }, [tokens]);
   ```

6. **Add Fallback Images**: Always provide fallbacks for token images:
   ```jsx
   <img
     src={token.imageUrl || `/assets/tokens/${token.symbol.toLowerCase()}.png`}
     onError={(e) => {
       e.currentTarget.src = "/assets/default-token.png";
     }}
     alt={token.symbol}
   />
   ```

## Troubleshooting

### WebSocket Not Connecting

If `isConnected` remains `false` for an extended period:

1. Check if the user is authenticated (WebSocket requires auth)
2. Verify the WebSocket endpoint is available
3. Check browser console for connection errors
4. Ensure `TokenDataProvider` is in the component tree

### Data Not Updating

If token data appears stale:

1. Check if `lastUpdate` is changing
2. Verify `isConnected` is `true`
3. Check if your component is re-rendering on token updates

### Component Performance Issues

If your component re-renders too frequently:

1. Implement `React.memo` for your component
2. Use `useMemo` for derived data
3. Consider using `useCallback` for functions passed to child components

### TypeScript Errors

If you encounter type errors:

1. Import the `TokenData` type from `useTokenDataWebSocket.ts`
2. Use proper type annotations for token data
3. Remember that token data properties are strings requiring parsing

## Conclusion

By following this guide, you can efficiently integrate real-time token data into your components. The shared WebSocket connection provides consistent, up-to-date information with minimal network overhead, creating a more responsive and unified user experience.

For additional support or questions, please contact the core team.
