# Achievement & Level System Implementation Guide


# NOTE:

> **🚨 ALERT: ACTION REQUIRED!**
>
> THIS HAS BEEN PARTIALLY PARED BACK IN AN EFFORT TO LAUNCH FASTER.
>
> PLEASE REFER TO THE EXPEDITED SPEC AT `docs_important/_TODO/ACHIEVEMENT_FRONTEND_INTEGRATION.md` FOR THE MOST CURRENT INSTRUCTIONS FOR THE FRONTEND TEAM.


## Overview

This document outlines the implementation requirements for DegenDuel's achievement and leveling system frontend. The system combines XP-based progression with achievement-based tier advancement, creating an engaging user experience that rewards both consistent participation and exceptional performance.

## System Architecture

### Core Concepts

1. **Experience Points (XP)**
   - Primary progression metric
   - Earned through various activities
   - Determines base level progression

2. **Levels (1-50)**
   - Pure XP-based progression within tiers
   - 50 total levels
   - Grouped into 5 tiers of 10 levels each

3. **Tiers**
   - NOVICE (Levels 1-10)
   - CONTENDER (Levels 11-20)
   - CHALLENGER (Levels 21-30)
   - MASTER (Levels 31-40)
   - LEGEND (Levels 41-50)

4. **Achievement Tiers**
   - BRONZE (Entry level)
   - SILVER (Moderate)
   - GOLD (Difficult)
   - PLATINUM (Very difficult)
   - DIAMOND (Exceptional)
   - TRANSCENDENT (Nearly impossible)
   - SPECIAL (Event/seasonal)

### Unique Mechanic: Tier Advancement Requirements

To advance between major tiers (every 10 levels), users must:
1. Reach the XP threshold for the level
2. Collect the required number of achievements from previous tiers

## Data Structures

### User Progress Data
```typescript
interface UserProgressData {
  level: number;
  currentTier: string;
  experiencePoints: number;
  nextLevelThreshold: number;
  tierProgress: {
    achievements: {
      bronze: { required: number; earned: number; };
      silver: { required: number; earned: number; };
      gold: { required: number; earned: number; };
      platinum: { required: number; earned: number; };
      diamond: { required: number; earned: number; };
    };
    canProgress: boolean;
    missingRequirements?: string[];
  };
}
```

### Achievement Data
```typescript
interface AchievementUnlock {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'transcendent' | 'special';
  xpAwarded: number;
  icon: string;
  unlockedAt: string;
  isNewTierFirst?: boolean;
}
```

### Level Up Event
```typescript
interface LevelUpEvent {
  newLevel: number;
  oldLevel: number;
  newTier?: string;
  unlockedFeatures?: string[];
  tierRequirements?: {
    met: boolean;
    missing: Array<{
      tier: string;
      needed: number;
      has: number;
    }>;
  };
}
```

## Required UI Components

### 1. Progress Overview Panel

#### Location
- Primary user profile
- Accessible via global navigation
- Floating mini-version available during contests

#### Required Elements
- Current level display (prominent)
- XP progress bar
- Current tier badge
- Achievement collection summary
- Tier progress indicator

#### Interactions
- Clickable elements for detailed views
- Hover states for additional information
- Smooth transitions between states

### 2. Tier Progress Showcase

#### Visual Design
- Trophy room/hall aesthetic
- Clear progression path visualization
- Current position indicator
- Achievement slot grid

#### Features
- Interactive tier badges
- Achievement preview on hover
- Progress path animation
- Requirement tooltips

### 3. Achievement Notification System

#### Primary Achievement Notification
- Location: Top-right
- Duration: 5 seconds
- Hover pauses timer
- Click dismisses

#### Tier Completion Notification
- Full-screen overlay
- Celebration animation
- Trophy showcase
- Dismissible

#### Visual Hierarchy
```
TRANSCENDENT: Full-screen takeover
DIAMOND: Large center notification
PLATINUM: Enhanced corner notification
GOLD: Standard corner + effects
SILVER: Standard corner
BRONZE: Minimal corner
```

### 4. Level Up Celebration

#### Regular Level Up
- Subtle animation
- Number increment
- XP bar fill
- Sound effect (if enabled)

#### Tier Threshold Level Up
- Major celebration
- New tier emblem reveal
- Feature showcase
- Congratulatory message

### 5. Progress-Blocked Indicator

#### Display Conditions
- XP threshold met
- Achievement requirements not met
- Tier transition attempted

#### Features
- Clear blocking indication
- Missing achievement list
- Progress tracking
- Achievement suggestions

## Technical Implementation

### WebSocket Integration

1. Connection Setup
```typescript
// Initialize socket connection
socket.subscribe('user:achievements');
socket.subscribe('user:progress');
socket.subscribe('user:levelup');

// Event handlers
socket.on('achievement:unlock', handleAchievementUnlock);
socket.on('user:levelup', handleLevelUp);
socket.on('user:progress', updateProgressDisplay);
```

2. Fallback Mechanism
```typescript
// REST API fallback
const fetchProgress = async () => {
  if (!socket.connected) {
    const response = await fetch('/api/user/progress');
    return response.json();
  }
};
```

### State Management

#### Required Stores
1. User Progress Store
2. Achievement Store
3. Notification Store
4. Celebration Queue Store

#### Example Store Structure
```typescript
interface ProgressStore {
  current: UserProgressData;
  history: Array<ProgressSnapshot>;
  pending: Array<Achievement>;
  celebrations: CelebrationQueue;
}
```

### Animation Guidelines

#### Color Scheme
```css
:root {
  --bronze: #CD7F32;
  --silver: #C0C0C0;
  --gold: #FFD700;
  --platinum: #E5E4E2;
  --diamond: #B9F2FF;
  --transcendent: #FF00FF;
  --special: #FF4500;
}
```

#### Animation Hierarchy
1. Micro-animations (hover states, small updates)
2. Achievement notifications
3. Level up celebrations
4. Tier transitions
5. Special events

## Performance Requirements

### Asset Management
- Preload tier transition assets
- Cache achievement icons
- Lazy load achievement history
- Optimize animation assets

### State Updates
- Throttle progress updates (max 1/sec)
- Batch achievement notifications
- Queue celebrations
- Debounce user interactions

### Error Handling
1. Socket disconnect recovery
2. Failed notification retry
3. Progress sync verification
4. Achievement validation

## Testing Requirements

### Unit Tests
- Achievement unlock logic
- XP calculation
- Tier requirement validation
- Notification queuing

### Integration Tests
- WebSocket reconnection
- State synchronization
- Animation sequencing
- Error recovery

### Visual Regression Tests
- Notification rendering
- Celebration sequences
- Progress bar states
- Tier transition effects

## Documentation Requirements

### User Documentation
- Achievement list
- Tier requirements
- XP earning guide
- UI element guide

### Technical Documentation
- Component API
- State management
- WebSocket events
- Error codes

## Implementation Timeline

### Phase 1: Core Systems
- Basic XP tracking
- Level progression
- Achievement storage
- WebSocket integration

### Phase 2: UI Components
- Progress display
- Achievement notifications
- Level up celebrations
- Tier showcase

### Phase 3: Enhanced Features
- Animation system
- Sound effects
- Social sharing
- Achievement suggestions

### Phase 4: Polish
- Performance optimization
- Error handling
- Edge cases
- Visual polish

## Success Metrics

### Technical Metrics
- Sub-100ms state updates
- 99.9% WebSocket uptime
- < 1% error rate
- 60fps animations

### User Experience Metrics
- Notification acknowledgment rate
- Achievement view time
- Celebration completion rate
- Social share rate

## Support Requirements

### Monitoring
- WebSocket connection status
- State sync verification
- Error tracking
- Performance metrics

### Troubleshooting
- Achievement verification
- Progress reconciliation
- Animation debugging
- State recovery

## Future Considerations

### Planned Extensions
- Achievement sharing
- Custom celebrations
- Achievement challenges
- Seasonal events

### Scale Considerations
- Achievement batching
- Celebration queuing
- Asset preloading
- State persistence

---

## Implementation Checklist

### Setup Phase
- [ ] Initialize WebSocket connections
- [ ] Set up state management
- [ ] Create base components
- [ ] Implement error handling

### Core Features
- [ ] XP tracking
- [ ] Level progression
- [ ] Achievement system
- [ ] Tier management

### UI Components
- [ ] Progress display
- [ ] Achievement notifications
- [ ] Celebration system
- [ ] Tier showcase

### Polish Phase
- [ ] Animations
- [ ] Sound effects
- [ ] Performance optimization
- [ ] Error recovery

## Contact

For technical clarifications or backend integration questions, contact the backend team lead.

---

*Last updated: February 2025* 