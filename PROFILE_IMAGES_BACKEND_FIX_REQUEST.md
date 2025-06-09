# Profile Images Not Showing - Backend API Issue

## Problem Summary
Profile images are not displaying in the ParticipantsList component on contest pages. Investigation shows this is a backend API issue, not a frontend issue.

## Current API Behavior (BROKEN)

### Contest Participants Endpoint
**Request:** `GET /api/contests/768/participants`

**Current Response:**
```json
{
  "id": 768,
  "contest_code": "NU-1061",
  "participant_count": 35,
  "contest_participants": [],  // ❌ EMPTY - should contain 35 participants
  "contest_portfolios": []
}
```

### Legacy Contest Endpoint  
**Request:** `GET /api/contests/768`

**Current Response (partial participant data):**
```json
{
  "contest_participants": [
    {
      "id": 645,
      "wallet_address": "FkL7xR7JHMVzs5X3qfaaEp78AqhiCLAWxmNzRuX41YpQ",
      "users": {
        "nickname": "lopseGg",
        "wallet_address": "FkL7xR7JHMVzs5X3qfaaEp78AqhiCLAWxmNzRuX41YpQ"
        // ❌ MISSING: profile_image_url field
      }
    }
  ]
}
```

## Required Fix

### 1. Fix Empty Participants Array
The `/api/contests/{id}/participants` endpoint should return all participants, not an empty array.

**Expected Response:**
```json
{
  "id": 768,
  "contest_code": "NU-1061", 
  "participant_count": 35,
  "contest_participants": [
    {
      "wallet_address": "FkL7xR7JHMVzs5X3qfaaEp78AqhiCLAWxmNzRuX41YpQ",
      "nickname": "lopseGg",
      "profile_image_url": "http://localhost:3010/api/users/FkL7xR7JHMVzs5X3qfaaEp78AqhiCLAWxmNzRuX41YpQ/profile-image",
      "user_level": {
        "level_number": 5,
        "class_name": "Trader", 
        "title": "Skilled Trader",
        "icon_url": "/images/levels/trader.png"
      },
      "experience_points": 1250,
      "total_contests_entered": 12,
      "contests_won": 3,
      "twitter_handle": null,
      "is_current_user": false,
      "is_ai_agent": false,
      "is_banned": false,
      "rank": 1,
      "portfolio_value": "1500.00",
      "initial_portfolio_value": "1000.00", 
      "performance_percentage": "50.00",
      "prize_awarded": null
    }
    // ... 34 more participants
  ]
}
```

### 2. Include Profile Image URLs
Each participant object **MUST** include:
- `profile_image_url`: Full URL to the user's profile image or `null` if none uploaded
- Example: `"http://localhost:3010/api/users/{wallet_address}/profile-image"`

### 3. Database Query Fix
The backend query should:
1. JOIN the contest_participants table with users table 
2. LEFT JOIN with user profile images (if separate table)
3. Include profile image URL construction in the SELECT

## Frontend Integration
The frontend expects participant objects with this structure:
```typescript
interface Participant {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string | null;  // ⭐ THIS IS REQUIRED
  
  // Contest performance data
  rank?: number;
  portfolio_value?: string;
  initial_portfolio_value?: string;
  performance_percentage?: string;
  prize_awarded?: string | null;
  
  // Enhanced user profile data
  user_level?: {
    level_number: number;
    class_name: string;
    title: string;
    icon_url?: string;
  };
  experience_points?: number;
  total_contests_entered?: number;
  contests_won?: number;
  twitter_handle?: string | null;
  is_current_user?: boolean;
  is_ai_agent?: boolean;
  is_banned?: boolean;
}
```

## Timeline
**This worked yesterday** - something changed in the backend API between yesterday and today.

## Test Cases
After fixing, verify:
1. `GET /api/contests/768/participants` returns 35 participants with profile_image_url fields
2. Users with uploaded profile images have valid URLs
3. Users without profile images have `profile_image_url: null`
4. Profile image URLs are accessible: `GET /api/users/{wallet}/profile-image`

## Priority
**HIGH** - Profile images are a key visual feature for the participant list and contest experience.