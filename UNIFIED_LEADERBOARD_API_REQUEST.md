# Request: Unified Real-Time Leaderboard/Participants API Enhancement

## Current Problem

We have two different pages that need to display participant/leaderboard data:

1. **Contest Detail Page** (`/contests/:id`) - Shows participants before contest starts
2. **Contest Lobby Page** (`/contests/:id/live`) - Shows live leaderboard during/after contest

Currently these use different data structures and components, causing:
- Code duplication and inconsistency  
- No real-time updates during live contests
- Different user experiences between pages
- Frontend complexity managing different data formats

## Proposed Solution: Enhanced Unified Endpoint

### New Endpoint: `/api/contests/:id/participants`

**Unified Response Structure:**
```json
{
  "success": true,
  "data": {
    "contest": {
      "id": 768,
      "name": "Numero Uno", 
      "status": "pending|active|completed",
      "participant_count": 35,
      "start_time": "2025-06-08T12:00:00Z",
      "end_time": "2025-06-08T18:00:00Z"
    },
    "participants": [
      {
        "wallet_address": "E4xjxdXe9LjkWtLNQV6g6M4j9fJj3zCpXuBUTCwBXDP2",
        "nickname": "degen_E4xjxd",
        "profile_image_url": "https://...",
        
        // Contest-specific data (null/0 before contest starts)
        "rank": 1,
        "portfolio_value": "1250.50", 
        "initial_portfolio_value": "1000.00",
        "performance_percentage": "25.05",
        "prize_awarded": "100.00",
        
        // Enhanced user data
        "user_level": {
          "level_number": 5,
          "class_name": "Trader",
          "title": "DegenDuel Trader",
          "icon_url": "/images/levels/trader.png"
        },
        "experience_points": 1250,
        "total_contests_entered": 12,
        "contests_won": 2,
        "twitter_handle": "@degenuser",
        "is_current_user": false,
        "is_ai_agent": false,
        "is_banned": false,
        
        // Portfolio breakdown (for live contests)
        "portfolio": [
          {
            "token_symbol": "SOL",
            "token_name": "Solana", 
            "token_image": "https://...",
            "weight": 40.0,
            "quantity": "2.5",
            "current_value": "500.00",
            "performance_percentage": "10.5"
          }
        ]
      }
    ],
    "pagination": {
      "total": 35,
      "limit": 100,
      "offset": 0
    },
    "metadata": {
      "last_updated": "2025-06-08T15:30:00Z",
      "supports_realtime": true
    }
  }
}
```

## WebSocket Integration Request

### Real-Time Updates via WebSocket

**Topic:** `contest-participants`

**Subscribe Message:**
```json
{
  "type": "SUBSCRIBE",
  "topics": ["contest-participants"],
  "contest_id": 768,
  "authToken": "jwt-token-here"
}
```

**Real-Time Update Messages:**
```json
{
  "type": "DATA",
  "topic": "contest-participants", 
  "contest_id": 768,
  "data": {
    "type": "RANKING_UPDATE",
    "participants": [
      {
        "wallet_address": "...",
        "rank": 2,
        "portfolio_value": "1180.25",
        "performance_percentage": "18.03"
      }
    ],
    "timestamp": "2025-06-08T15:30:15Z"
  }
}
```

**Update Types:**
- `RANKING_UPDATE` - Participant rank/value changes
- `NEW_PARTICIPANT` - Someone joins the contest  
- `PORTFOLIO_UPDATE` - Portfolio composition changes
- `CONTEST_STATUS_CHANGE` - Contest starts/ends

## Benefits

### For Users
- **Real-time leaderboard** - See rankings update live during contests
- **Consistent experience** - Same beautiful UI on both pages
- **Rich participant data** - User levels, experience, contest history
- **Smooth transitions** - Seamless progression from detail → lobby → results

### For Development  
- **Code reuse** - Single `ParticipantsList` component for both pages
- **Maintainability** - One data structure, one source of truth
- **Performance** - WebSocket eliminates constant polling
- **Scalability** - Real-time updates handle high-frequency changes

## Implementation Priority

1. **Phase 1:** Enhanced unified endpoint with rich participant data
2. **Phase 2:** WebSocket integration for real-time updates  
3. **Phase 3:** Advanced features (portfolio breakdowns, trend indicators)

## Questions for Backend Team

1. **WebSocket Feasibility:** Can we add `contest-participants` to the existing WebSocket system?
2. **Performance Impact:** Any concerns with real-time ranking calculations?
3. **Data Consistency:** How do we handle race conditions during rapid portfolio value changes?
4. **Rate Limiting:** Should we throttle updates to prevent UI thrashing?
5. **Historical Data:** Can we include participant join timestamps and contest history?

## Frontend Implementation

Once this API is ready, we can:
- Use the same `ParticipantsList` component on both pages
- Add real-time animations for rank changes
- Show live portfolio performance indicators
- Display participant count and join activity in real-time

This enhancement would significantly improve the user experience and make DegenDuel feel much more dynamic and engaging during live contests!

---

**Frontend Team Contact:** Claude Code Assistant  
**Date:** June 8, 2025  
**Priority:** High - Affects core contest experience