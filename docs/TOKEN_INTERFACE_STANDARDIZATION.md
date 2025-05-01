# Token Interface Standardization Guide

## Current Status

The DegenDuel frontend uses multiple token-related interfaces:

1. **Token Interface**: Full, comprehensive interface with all token properties
   - Used by most components
   - Contains nested objects for liquidity, images, socials, etc.
   - Has `contractAddress` as a required field (primary identifier)

2. **TokenData Interface**: Legacy interface primarily for old WebSocket implementation
   - Simplified flat structure
   - `liquidity` defined as a number (not an object)
   - `contractAddress` is optional

## Standardization Approach

We have standardized on the `Token` interface as the primary interface for all token data in the application. This provides a more robust and type-safe representation that includes all necessary token information.

### Key Changes Made

1. **Animation Components**:
   - Updated `TokenVerseScene.ts` and `MarketVerseScene.ts` to use `Token` interface
   - Added type safety in usage

2. **Context Provider**:
   - Updated `TokenDataContext.tsx` to use `Token` interface
   - Updated FALLBACK_TOKENS to include required fields

3. **Token Utilities**:
   - Added proper type conversions where numbers are expected but strings are provided
   - Fixed token status checking

### Remaining Work

1. **Story Files**:
   - Several Storybook story files still need updates to include `status` in token objects

2. **Legacy Components**:
   - Some older components (`HotTokensList.tsx`, `TokensPreviewSection.tsx`, etc.) are using filters and sorts that expect `Token` interface but don't always include all required fields

## Migration Strategy for Components

When migrating components to use the standardized Token interface:

1. Always include `status` field (required for the `Token` interface)
2. Use `contractAddress` as the primary identifier
3. Use the `liquidity` property as an object with `usd`, `base`, and `quote` fields
4. Use the standardized data hooks:
   - `useStandardizedTokenData` - Main hook for token data
   - `useSolanaTokenData` - For Solana blockchain token data

## Utility Functions

For compatibility with components expecting either format, use the adapter functions in `useStandardizedTokenData.ts`:

```typescript
// Convert Token to TokenData format (if needed for legacy components)
function tokenToTokenData(token: Token): TokenData {
  return {
    symbol: token.symbol,
    name: token.name,
    price: token.price,
    marketCap: token.marketCap,
    volume24h: token.volume24h,
    change24h: token.change24h,
    liquidity: token.liquidity ? Number(token.liquidity.usd) : undefined,
    status: token.status as "active" | "inactive",
    contractAddress: token.contractAddress,
    imageUrl: token.images?.imageUrl
  };
}

// Convert TokenData to Token format
function tokenDataToToken(tokenData: TokenData): Token {
  return {
    symbol: tokenData.symbol,
    name: tokenData.name,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    change24h: tokenData.change24h,
    liquidity: {
      usd: tokenData.liquidity ? String(tokenData.liquidity) : "0",
      base: "0",
      quote: "0"
    },
    status: tokenData.status || "active",
    contractAddress: tokenData.contractAddress || `synthetic-${tokenData.symbol}`,
  };
}
```

## Best Practices

1. **Use Standard Hooks**: Always use the standard hooks for token data (`useStandardizedTokenData`)
2. **Prefer Token Interface**: Use the `Token` interface for all new components
3. **Type Check**: Validate types with `npm run type-check` after making changes
4. **Required Fields**: Always include the required fields from the `Token` interface, especially `status`
5. **Default Values**: When converting from `TokenData` to `Token`, provide reasonable defaults for required fields

## References

- `src/types/index.ts` - Contains the interface definitions
- `src/hooks/useStandardizedTokenData.ts` - Standard hook for token data
- `docs/TOKEN_INTERFACE_ADAPTATION_STRATEGY.md` - Related strategy document