# Referral System API Specification

## Overview

This document outlines the API endpoints required by the frontend referral system. All endpoints should return data in the exact format specified to ensure compatibility with the frontend implementation.

## UTM Parameter Tracking

The system tracks referral sources and campaign performance through UTM parameters captured during click tracking. No additional share tracking endpoint is needed as all meaningful metrics are captured through:

- Click tracking with UTM parameters
- Conversion tracking
- Source attribution

Standard UTM Parameters tracked:

```typescript
{
  source: string;    // e.g., "twitter", "discord", "telegram"
  medium: string;    // e.g., "social", "email", "direct"
  campaign: string;  // e.g., "summer_2024", "launch"
  content?: string;  // Optional: For A/B testing different content
  term?: string;     // Optional: For keyword tracking
}
```

## Base URL

All endpoints are prefixed with `/api/referrals`

## Authentication

All endpoints except for click tracking require a valid authentication token in the header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get User's Referral Code

```http
GET /api/referrals/code
```

**Response:**

```typescript
{
  referral_code: string; // Unique referral code for the user
}
```

### 2. Get User's Referral Stats

```http
GET /api/referrals/stats
```

**Response:**

```typescript
{
  total_referrals: number;      // Total number of referrals
  qualified_referrals: number;  // Number of referrals that have qualified
  pending_referrals: number;    // Number of referrals still pending
  total_rewards: number;        // Total rewards earned
  recent_referrals: [           // Array of recent referrals
    {
      username: string;
      status: "pending" | "qualified" | "rewarded" | "expired";
      joined_at: string;        // ISO date string
    }
  ];
  recent_rewards: [             // Array of recent rewards
    {
      type: "signup_bonus" | "contest_bonus" | "special_event";
      amount: number;
      date: string;            // ISO date string
      description: string;
    }
  ];
}
```

### 3. Track Referral Click

```http
POST /api/referrals/analytics/click
```

**Request Body:**

```typescript
{
  referralCode: string;
  sessionId: string;
  clickData: {
    source: string;          // Source of the referral
    device: string;          // User's device type
    browser: string;         // User's browser
    landingPage: string;     // Page they landed on
    utmSource?: string;      // Optional UTM parameters
    utmMedium?: string;
    utmCampaign?: string;
    timestamp: string;       // ISO date string
  }
}
```

**Response:**

```typescript
{
  success: boolean;
}
```

### 4. Track Conversion

```http
POST /api/referrals/analytics/conversion
```

**Request Body:**

```typescript
{
  referralCode: string;
  sessionId: string;
  conversionData: {
    timeToConvert: number | null;     // Time in ms from click to conversion
    completedSteps: string[];         // Array of completed steps
    qualificationStatus: "pending";    // Initial status is always pending
    convertedAt: string;              // ISO date string
    originalClickData: any | null;    // Original click data if available
  }
}
```

**Response:**

```typescript
{
  success: boolean;
}
```

### 5. Get Leaderboard Stats

```http
GET /api/referrals/leaderboard/stats
```

**Response:**

```typescript
{
  total_global_referrals: number;
  current_period: {
    start_date: string; // ISO date string
    end_date: string; // ISO date string
    days_remaining: number;
  }
  next_payout_date: string; // ISO date string
}
```

### 6. Get Leaderboard Rankings

```http
GET /api/referrals/leaderboard/rankings
```

**Response:**

```typescript
[
  {
    username: string;
    referrals: number;
    lifetime_rewards: number;
    period_rewards: number;
    rank: number;
    trend: "up" | "down" | "stable";
  }
]
```

### 7. Get Analytics Data

```http
GET /api/referrals/analytics
```

**Response:**

```typescript
{
  // Total counts for high-level overview
  totals: {
    clicks: number;              // Total number of referral link clicks
    conversions: number;         // Total number of successful conversions
    rewards_distributed: number; // Total amount of rewards distributed
  },
  // Detailed click analytics
  clicks: {
    by_source: Record<string, number>;    // e.g., { "twitter": 100, "discord": 50 }
    by_device: Record<string, number>;    // e.g., { "mobile": 75, "desktop": 75 }
    by_browser: Record<string, number>;   // e.g., { "chrome": 100, "firefox": 50 }
    by_campaign: Record<string, number>;  // e.g., { "summer_2024": 150, "launch": 50 }
  },
  // Conversion analytics with status breakdown
  conversions: {
    by_source: Record<string, number>;    // e.g., { "twitter": 20, "discord": 10 }
    by_status: {                          // Using ReferralStatus enum
      pending: number,
      qualified: number,
      rewarded: number,
      expired: number
    },
    by_campaign: Record<string, number>;  // e.g., { "summer_2024": 30, "launch": 10 }
  },
  // Reward distribution analytics
  rewards: {
    by_type: {                           // Using ReferralRewardType enum
      signup_bonus: number,
      contest_bonus: number,
      special_event: number
    }
  }
}
```

**Example Response:**

```json
{
  "totals": {
    "clicks": 1000,
    "conversions": 150,
    "rewards_distributed": 25000
  },
  "clicks": {
    "by_source": {
      "twitter": 500,
      "discord": 300,
      "telegram": 200
    },
    "by_device": {
      "mobile": 600,
      "desktop": 350,
      "tablet": 50
    },
    "by_browser": {
      "chrome": 450,
      "safari": 300,
      "firefox": 250
    },
    "by_campaign": {
      "summer_2024": 600,
      "launch": 400
    }
  },
  "conversions": {
    "by_source": {
      "twitter": 80,
      "discord": 45,
      "telegram": 25
    },
    "by_status": {
      "pending": 20,
      "qualified": 100,
      "rewarded": 25,
      "expired": 5
    },
    "by_campaign": {
      "summer_2024": 90,
      "launch": 60
    }
  },
  "rewards": {
    "by_type": {
      "signup_bonus": 15000,
      "contest_bonus": 8000,
      "special_event": 2000
    }
  }
}
```

## Error Handling

All endpoints should return errors in the following format:

```typescript
{
  success: false,
  error: {
    message: string;    // Human-readable error message
    code?: string;      // Optional error code for frontend handling
  }
}
```

## Rate Limiting

- Click tracking: 100 requests per IP per 15 minutes
- Conversion tracking: 10 attempts per IP per hour
- Other endpoints: Standard API rate limiting applies

## Notes for Implementation

1. All date strings should be in ISO format
2. Referral codes should be unique and case-insensitive
3. Session IDs should be UUID v4
4. Analytics endpoints should aggregate data in real-time
5. Leaderboard data should be cached and updated every minute
6. Conversion tracking should validate the original click session

## Security Considerations

1. Implement IP-based rate limiting
2. Validate all referral codes before processing
3. Prevent self-referrals
4. Implement fraud detection for rapid conversions
5. Validate session tokens for authenticated endpoints
