# WebSocket Contest Data Synchronization Issue

**Date:** June 4, 2025  
**From:** Frontend Development Team  
**To:** Backend WebSocket Team  
**Subject:** Newly Created Contest Not Appearing in WebSocket Data Feed

## Executive Summary

A newly created contest (ID: 768, "Numero Uno") is not appearing in the contest browser page despite being successfully stored in the database. The WebSocket system is not returning this contest in the `GET_ALL_CONTESTS` response, while older scheduled contests are displaying correctly.

## Issue Details

### Current Behavior
- Contest ID 768 was created at 2025-06-04 16:47:49 UTC
- The contest exists in the database with status "pending"
- The contest does NOT appear in the contest browser UI
- Four other pending contests (IDs: 764, 765, 766, 767) created earlier DO appear correctly

### Database State (Verified)
```sql
-- All 5 pending contests exist in the database:
id  | name               | status  | created_at                  | created_by_user
768 | Numero Uno         | pending | 2025-06-04 16:47:49.24+00  | 5RbsCTp7Z3ZBs6LRg8cvtZkF1FtAt4GndEtdsWQCzVy8
767 | GM Pump            | pending | 2025-06-04 12:21:23.114+00 | NULL
766 | Jeet Hours         | pending | 2025-06-03 23:27:15.375+00 | NULL
765 | Weekend Happy Hour | pending | 2025-06-03 12:35:53.685+00 | NULL
764 | Saturday Showdown  | pending | 2025-06-03 12:35:53.606+00 | NULL
```

### Key Differences in Missing Contest
Contest 768 differs from the others in two ways:
1. Has a `created_by_user` value (wallet address)
2. Has a non-zero `prize_pool` (5 SOL vs 0 for others)
3. Was created most recently (~40 minutes before investigation)

## Frontend Implementation Details

### WebSocket Hook Usage
The frontend uses the `useContests` hook which:
1. Connects to WebSocket endpoint `/api/v69/ws`
2. Subscribes to topic: `contest`
3. Sends request: `GET_ALL_CONTESTS` on connection
4. Expects contests with required fields: `status` AND `name`

### Contest Filtering Logic
```typescript
// From useContests.ts lines 109-111
} else if (contestData.status && contestData.name) {
  // Add new contest if it has required fields
  contests.push(contestData as Contest);
}
```

**Important:** Contests missing either `status` or `name` fields are silently dropped.

## Suspected Root Causes

### 1. WebSocket Backend Caching
The `GET_ALL_CONTESTS` response might be cached and not include contests created after cache initialization.

### 2. Database Query Timing
- Possible read replica lag if using database replication
- The WebSocket service might be querying before replication completes

### 3. Missing Real-time Event Broadcast
When contest 768 was created:
- No WebSocket `contest.update` message was broadcast to connected clients
- Frontend relies on these broadcasts for real-time updates without manual refresh

### 4. Data Query Filters
The backend query for `GET_ALL_CONTESTS` might have additional filters that exclude:
- Contests with non-null `created_by_user`
- Contests with non-zero `prize_pool`
- Contests created within a certain time window

## Recommended Actions

### Immediate Fixes
1. **Clear any WebSocket response caches** for the `GET_ALL_CONTESTS` request
2. **Verify database query** used in `GET_ALL_CONTESTS` handler includes ALL pending contests
3. **Check for query filters** that might exclude contests based on `created_by_user` or `prize_pool`

### Long-term Improvements
1. **Implement contest creation broadcast**:
   ```javascript
   // When a contest is created, broadcast to all connected clients:
   broadcast({
     type: 'DATA',
     topic: 'contest',
     subtype: 'update',
     data: {
       contest_id: newContest.id,
       name: newContest.name,
       status: newContest.status,
       // ... other fields
     }
   });
   ```

2. **Add cache invalidation** when new contests are created

3. **Include diagnostic data** in WebSocket responses:
   ```javascript
   {
     type: 'DATA',
     topic: 'contest',
     data: contests,
     metadata: {
       query_time: new Date().toISOString(),
       total_count: contests.length,
       cache_status: 'hit' | 'miss',
       database_source: 'primary' | 'replica'
     }
   }
   ```

## Testing Recommendations

1. Create a new contest and immediately check if it appears in `GET_ALL_CONTESTS`
2. Monitor WebSocket messages for contest creation broadcasts
3. Compare database contest count with WebSocket response count
4. Test with contests having various `created_by_user` and `prize_pool` values

## Additional Context

- Frontend build: Development environment (https://dev.degenduel.me)
- WebSocket connection status: Connected and receiving data
- Other WebSocket topics (market data, etc.) functioning normally
- Manual page refresh does not resolve the issue (indicating it's not a frontend state problem)

## Questions for Backend Team

1. Is there a cache layer for `GET_ALL_CONTESTS` responses?
2. Are there any filters in the contest query that might exclude certain contests?
3. Is the WebSocket service querying the primary database or a read replica?
4. Are contest creation events supposed to trigger WebSocket broadcasts?
5. Can you provide the exact SQL query used for `GET_ALL_CONTESTS`?

---

Please investigate this issue as it's preventing newly created contests from appearing in the UI, requiring a backend service restart to resolve. This significantly impacts the user experience for contest creators.

Contact me if you need any additional frontend logs or debugging assistance.