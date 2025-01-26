# DegenDuel V2 API Documentation

## Token Endpoints

The V2 token endpoints use contract addresses as primary keys instead of database IDs, making them more reliable and easier to use with external data.

### Get All Token Addresses

```http
GET /api/v2/tokens/addresses
```

Returns an array of all token contract addresses.

**Parameters:**

- `active` (query, optional): Set to 'true' to get only active tokens

**Response:**

```json
[
  "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "..."
]
```

### Get Token by Address

```http
GET /api/v2/tokens/by-address/{contractAddress}
```

Returns basic information about a specific token.

**Parameters:**

- `contractAddress` (path): The contract address of the token

**Response:**

```json
{
  "contractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
  "name": "ai16z",
  "symbol": "AI16Z",
  "price": "0.8425",
  "marketCap": "926821882",
  "volume24h": "18207777.26"
}
```

### Search Tokens

```http
GET /api/v2/tokens/search?q={query}&limit={limit}
```

Search for tokens by name or symbol.

**Parameters:**

- `q` (query): Search term to match against token names and symbols
- `limit` (query, optional): Maximum number of results to return (default: 10)

**Response:**

```json
[
  {
    "contractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    "name": "ai16z",
    "symbol": "AI16Z",
    "price": "0.8425",
    "marketCap": "926821882",
    "volume24h": "18207777.26"
  }
]
```

### Get Token Market Data

```http
GET /api/v2/tokens/market-data/{contractAddress}
```

Returns detailed market data for a specific token.

**Parameters:**

- `contractAddress` (path): The contract address of the token

**Response:**

```json
{
  "price": "0.8425",
  "marketCap": "926821882",
  "volume24h": "18207777.26",
  "change24h": "0.0346",
  "liquidity": {
    "usd": "6142815.41",
    "base": "5645981",
    "quote": "5365.7457"
  },
  "transactions24h": {
    "buys": 3928,
    "sells": 3928
  }
}
```

### Get Token Images

```http
POST /api/v2/tokens/images
```

Returns image URLs for multiple tokens.

**Request Body:**

```json
{
  "addresses": ["contractAddress1", "contractAddress2"]
}
```

**Response:**

```json
{
  "contractAddress1": {
    "imageUrl": "https://example.com/token.png",
    "headerImage": "https://example.com/header.png",
    "openGraphImage": "https://example.com/og.png"
  }
}
```

### Get Token Liquidity

```http
POST /api/v2/tokens/liquidity
```

Returns liquidity information for multiple tokens.

**Request Body:**

```json
{
  "addresses": ["contractAddress1", "contractAddress2"]
}
```

**Response:**

```json
{
  "contractAddress1": {
    "usd": "6142815.41",
    "base": "5645981",
    "quote": "5365.7457"
  }
}
```

### Get Token Websites

```http
POST /api/v2/tokens/websites
```

Returns website information for multiple tokens.

**Request Body:**

```json
{
  "addresses": ["contractAddress1", "contractAddress2"]
}
```

**Response:**

```json
{
  "contractAddress1": [
    {
      "url": "https://elizaos.ai",
      "label": "Website"
    },
    {
      "url": "https://www.daos.fun/token1",
      "label": "Daos.fun"
    }
  ]
}
```

### Get Token Social Media

```http
POST /api/v2/tokens/socials
```

Returns social media links grouped by platform for multiple tokens.

**Request Body:**

```json
{
  "addresses": ["contractAddress1", "contractAddress2"]
}
```

**Response:**

```json
{
  "contractAddress1": {
    "twitter": {
      "url": "https://x.com/ai16zdao",
      "count": null
    },
    "telegram": {
      "url": "https://t.me/ai16zcommunity",
      "count": null
    },
    "discord": {
      "url": "https://discord.gg/ai16z",
      "count": null
    }
  }
}
```

### Get Batch Token Prices

```http
POST /api/v2/tokens/prices/batch
```

Returns current prices and 24h changes for multiple tokens.

**Request Body:**

```json
{
  "addresses": ["contractAddress1", "contractAddress2"]
}
```

**Response:**

```json
{
  "contractAddress1": {
    "price": "0.8425",
    "change24h": "0.0346"
  }
}
```

## Common Response Formats

### Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found
- `500`: Server Error

## Rate Limiting

- Batch endpoints limited to 50 addresses per request
- Standard rate limiting applies to all endpoints

## Notes

- All endpoints use data from the DegenDuel Data Server as the source of truth
- Price and monetary values are returned as strings to preserve precision
- Percentage changes (like `change24h`) are returned as decimals (e.g., 0.0346 = 3.46%)
- Missing numerical values default to "0" or 0 depending on the field type
- All endpoints are documented with Swagger at `/api-docs`
