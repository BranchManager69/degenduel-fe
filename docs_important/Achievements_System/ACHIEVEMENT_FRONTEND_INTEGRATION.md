# Achievement System Frontend Integration

## Direct Responses to Your Questions

1. **WebSocket Events**: Yes, they're ready. See implementation details below. Use both WebSocket and REST - we've provided both.

2. **Assets**: Use whatever you can find or create NOW:
   - Icons: Use FontAwesome/Material icons
   - Badges: Basic colored shapes
   - Animations: Basic CSS transitions
   - Sound: Grab free effects from mixkit.co

3. **Implementation Priority**: Just build it. Start with XP display and achievements list. Add polish if there's time.

4. **State Management**: Use your existing store. Add the data structures we've defined below. No need for review.

5. **UI/UX**: 
   - Progress-Blocked: Inline message
   - Multiple Achievements: Stack them, max 3 visible
   
6. **Testing**: Add a new tab to the admin panel. We will test it when complete.

7. **Performance**: Just make it work. We'll optimize later.

Get it done this now. Full implementation details below.

---

## WebSocket Events

Subscribe to these channels:
```typescript
socket.subscribe('user:achievements');
socket.subscribe('user:progress');
socket.subscribe('user:levelup');
```

## Data Structures

### Achievement Unlock
```typescript
interface AchievementUnlock {
  id: string;              // achievement ID
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'TRANSCENDENT';
  xp_awarded: number;      // XP gained
  achieved_at: string;     // ISO timestamp
  context: any;            // achievement context
}
```

### User Progress
```typescript
interface UserProgress {
  level: number;
  experience_points: number;
  next_level_threshold: number;
  tier_progress: {
    achievements: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
      diamond: number;
    }
  }
}
```

### Level Up Event
```typescript
interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  newTier?: string;       // only if tier changed
}
```

## REST Endpoints

### Get User Progress
```typescript
GET /api/users/{wallet}/progress
Response: UserProgress
```

### Get Achievements
```typescript
GET /api/users/{wallet}/achievements
Response: AchievementUnlock[]
```

### Get Level Info
```typescript
GET /api/users/{wallet}/level
Response: {
  current_level: number;
  experience_points: number;
  next_level: number;
  next_level_xp: number;
}
```

## Required UI Elements

1. XP Bar
   - Shows current XP/next level XP
   - Updates real-time via WebSocket

2. Level Display
   - Current level number
   - Current tier name
   - Updates on level up

3. Achievement Popup
   - Shows on achievement unlock
   - Displays tier color
   - Shows XP awarded

4. Level Up Display
   - Shows new level
   - Shows tier change if applicable

5. Achievement List
   - Grid/list view
   - Filter by tier
   - Sort by date

6. Tier Progress
   - Shows current tier
   - Lists requirements for next tier
   - Updates real-time

## Achievement Tiers

```typescript
const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF',
  TRANSCENDENT: '#FF00FF'
};
```

## Testing Flow

Use admin panel: `https://admin.degenduel.me/achievements`

Test these sequences:
1. Contest Join → XP Gain → XP Bar Update
2. Achievement Unlock → Popup → Achievement List Update
3. Level Up → Celebration → New Level Display
4. Tier Change → Requirements Check → Tier Update

## Error Handling

1. WebSocket Disconnection
   - Fall back to REST endpoints
   - Reconnect automatically
   - Sync state on reconnect

2. Failed Requests
   - Show error state
   - Retry automatically
   - Keep UI responsive

## Example WebSocket Usage

```typescript
// Initialize
const socket = new WebSocket('wss://api.degenduel.me/ws');

// Achievement unlock handler
socket.on('achievement:unlock', (achievement: AchievementUnlock) => {
  showAchievementPopup(achievement);
  updateAchievementList();
  updateXPBar(achievement.xp_awarded);
});

// Progress update handler
socket.on('user:progress', (progress: UserProgress) => {
  updateXPBar(progress.experience_points);
  updateTierProgress(progress.tier_progress);
});

// Level up handler
socket.on('user:levelup', (event: LevelUpEvent) => {
  showLevelUpCelebration(event);
  updateLevelDisplay(event.newLevel);
  if (event.newTier) {
    updateTierDisplay(event.newTier);
  }
});
``` 