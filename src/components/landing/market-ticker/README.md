# Market Ticker Grid Component

A high-density, NYSE-style grid display for token data that provides a consistent, information-rich experience across both desktop and mobile views.

## Features

- **NYSE-Style Grid Layout**: Dense, information-rich display with clear coloring
- **Real-time Price Flashing**: Visual indicators for price movements without immediate reordering
- **Interactive Billboard**: Click any token to see expanded details
- **Periodic Reordering**: Configurable interval for data sorting
- **Mobile-Friendly**: Responsive design that works well on all screen sizes
- **Sound Effects**: Optional audio feedback for price changes
- **Cyberpunk Design Language**: Follows DegenDuel's visual identity

## Usage

```tsx
import { MarketTickerGrid } from '../components/landing/market-ticker';

<MarketTickerGrid 
  maxTokens={12} 
  title="DegenDuel • Market Data"
  subtitle="Real-time NYSE-style market feed"
  reorderInterval={8000}
  showBillboard={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxTokens` | number | 10 | Maximum number of tokens to display |
| `initialLoading` | boolean | false | Show loading state initially |
| `title` | string | "DegenDuel • Market Ticker" | Component title |
| `subtitle` | string | "Live-updating market data" | Component subtitle |
| `reorderInterval` | number | 10000 | Milliseconds between reordering (10 seconds default) |
| `viewAllLink` | string | "/tokens" | URL for "View All" button |
| `showBillboard` | boolean | true | Whether to show the detail billboard feature |

## Component Structure

- **MarketTickerGrid**: Main container component that handles data fetching and state
- **TokenRow**: Individual token display row with price change animations
- **TokenBillboard**: Detailed view that appears when a token is selected

## Design Notes

This component replaces three previous separate components:
- StandardizedMarketStatsPanel
- StandardizedHotTokensList
- TokensPreviewSection

It combines their functionality into a single, cohesive display while adding the visual impact of a stock exchange ticker board.

## Sound Effects

The component includes optional sound effects for price changes:
- Up sound for positive price movements
- Down sound for negative price movements
- Can be toggled on/off with the sound button