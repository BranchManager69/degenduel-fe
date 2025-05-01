# Token Interface Adaptation Strategy

## Current Situation

We're facing discrepancies between our current token interfaces and the new backend WebSocket interface. This presents both challenges and opportunities for improved data handling.

## Interface Comparison

### Current Frontend Interfaces

We currently have two main interfaces:

1. **Token** (comprehensive API interface):
   ```typescript
   interface Token {
     contractAddress: string;
     name: string;
     symbol: string;
     price: string;
     marketCap: string;
     volume24h: string;
     change24h: string;
     // Nested structures
     liquidity?: {
       usd: string;
       base: string;
       quote: string;
     };
     images?: {
       imageUrl: string;
       headerImage: string;
       openGraphImage: string;
     };
     socials?: {
       twitter?: { url: string; count: number | null };
       // Other socials...
     };
     // Additional fields...
   }
   ```

2. **TokenData** (simplified WebSocket interface):
   ```typescript
   interface TokenData {
     symbol: string;
     name: string;
     price: string;
     marketCap: string;
     volume24h: string;
     volume5m?: string;
     change24h: string;
     change5m?: string;
     change1h?: string;
     imageUrl?: string;
     liquidity?: number;
     status?: "active" | "inactive";
   }
   ```

### New Backend WebSocket Interface

```typescript
interface TokenDataMessage {
  type: 'token_data';
  action: 'update' | 'snapshot' | 'price_change' | 'metadata_update';
  data: {
    tokens: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      price?: string;
      price_change_24h?: number;
      volume_24h?: string;
      market_cap?: string;
      liquidity?: string;
      last_updated?: string;
      image_url?: string;
      tags?: string[];
      socials?: Record<string, string>;
      metadata_status: 'pending' | 'complete' | 'failed';
    }[];
    timestamp: string;
    batch_id?: string;
  };
}
```

## Key Discrepancies

1. **Field Naming Convention**:
   - Current: camelCase (marketCap, volume24h)
   - New: snake_case (market_cap, volume_24h)

2. **Field Structure**:
   - Current: Deep nested objects for liquidity, socials
   - New: Flatter structure with simpler types

3. **Message Format**:
   - Current: Direct data objects
   - New: Wrapped messages with type, action, and data fields

4. **Required vs. Optional Fields**:
   - Different sets of required/optional fields
   - New interface introduces fields we don't currently handle (decimals, metadata_status)

5. **Data Types**:
   - Some type differences (e.g., liquidity as object vs. string)

## Recommended Adaptation Strategy

I recommend a multi-layered approach that maintains backward compatibility while embracing the new structure:

### 1. Create New Interface Definitions

Create new TypeScript interfaces that match the backend exactly:

```typescript
// Backend message structure
export interface TokenDataMessage {
  type: 'token_data';
  action: 'update' | 'snapshot' | 'price_change' | 'metadata_update';
  data: {
    tokens: BackendTokenData[];
    timestamp: string;
    batch_id?: string;
  };
}

// Backend token structure
export interface BackendTokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price?: string;
  price_change_24h?: number;
  volume_24h?: string;
  market_cap?: string;
  liquidity?: string;
  last_updated?: string;
  image_url?: string;
  tags?: string[];
  socials?: Record<string, string>;
  metadata_status: 'pending' | 'complete' | 'failed';
}
```

### 2. Create Adapter Functions

Implement adapter functions to convert between the formats:

```typescript
// Convert backend token to our Token format
export function adaptBackendToken(backendToken: BackendTokenData): Token {
  return {
    contractAddress: backendToken.address,
    name: backendToken.name,
    symbol: backendToken.symbol,
    price: backendToken.price || "0",
    marketCap: backendToken.market_cap || "0",
    volume24h: backendToken.volume_24h || "0",
    change24h: backendToken.price_change_24h?.toString() || "0",
    liquidity: backendToken.liquidity 
      ? { usd: backendToken.liquidity, base: "0", quote: "0" }
      : undefined,
    images: {
      imageUrl: backendToken.image_url || "",
      headerImage: "",
      openGraphImage: "",
    },
    socials: adaptBackendSocials(backendToken.socials),
    // Additional mappings...
  };
}

// Helper for adapting socials
function adaptBackendSocials(socials?: Record<string, string>) {
  if (!socials) return undefined;
  
  return {
    twitter: socials.twitter ? { url: socials.twitter, count: null } : undefined,
    telegram: socials.telegram ? { url: socials.telegram, count: null } : undefined,
    discord: socials.discord ? { url: socials.discord, count: null } : undefined,
  };
}
```

### 3. Enhanced WebSocket Handling

Modify our WebSocket handler to work with the new message format:

```typescript
export function handleTokenWebSocketMessage(message: TokenDataMessage): Token[] {
  // Process based on action type
  switch (message.action) {
    case 'snapshot':
    case 'update':
      return message.data.tokens.map(adaptBackendToken);
    
    case 'price_change':
      // Handle price-only updates
      return message.data.tokens.map(token => ({
        ...getExistingToken(token.address),
        price: token.price || "0",
        change24h: token.price_change_24h?.toString() || "0",
      }));
      
    case 'metadata_update':
      // Handle metadata updates
      // ...
  }
}
```

### 4. Gradual Component Updates

Update components to handle both formats during transition:

```typescript
// Example component that can handle both formats
function TokenDisplay({ token }) {
  // Works with both contractAddress and address
  const tokenId = token.contractAddress || token.address;
  
  // Works with both formats of price
  const price = token.price || "0";
  
  // Works with both formats of market cap
  const marketCap = token.marketCap || token.market_cap || "0";
  
  // ...
}
```

## Implementation Plan

1. **Phase 1**: Create interface definitions and adapters
   - Add new interfaces
   - Implement adapter functions
   - Unit test conversions

2. **Phase 2**: Update WebSocket handlers
   - Modify connection logic to support new message format
   - Implement action-specific handlers
   - Add fallbacks for backward compatibility

3. **Phase 3**: Update components
   - Audit all token-consuming components
   - Update to use consistent field access patterns
   - Add support for new fields where valuable

4. **Phase 4**: Cleanup
   - Deprecate old interfaces (with @deprecated tags)
   - Remove compatibility code when backend migration is complete

## Benefits of This Approach

1. **Backward Compatibility**: Continues to work with existing APIs during transition
2. **Clear Type Safety**: Explicit typing for both formats
3. **Centralized Conversion**: Logic in one place instead of scattered conversions
4. **Progressive Enhancement**: Can start using new fields immediately
5. **Documentation**: Self-documenting approach to the migration

## Next Steps

1. Confirm if backend will support a transition period with both formats
2. Determine timeline for complete migration
3. Implement the new interfaces and adapters
4. Begin progressive component updates