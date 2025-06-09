# 📱 Final Frontend Implementation Guide for Contest Participants

## REST API Endpoints

### Get Contest Participants
```javascript
GET /api/contests/:id/participants

Response:
{
  "contest_participants": [
    {
      "wallet_address": "B1CV41TBQykwXHfc3gnohrHf5C5B99GMzFL5PhfuiNku",
      "nickname": "CoffeeBerry99",
      "profile_image_url": "https://pbs.twimg.com/profile_images/1234567890.jpg",
      "rank": 1,
      "portfolio_value": "1250.50",
      "performance_percentage": "25.05",
      "user_level": { ... },
      "portfolio": [ ... ]
    }
  ]
}
```

### Get Contest Leaderboard
```javascript
GET /api/contests/:id/leaderboard

Response:
{
  "leaderboard": [
    {
      "wallet_address": "B1CV41TBQykwXHfc3gnohrHf5C5B99GMzFL5PhfuiNku",
      "nickname": "CoffeeBerry99",
      "profile_image_url": "https://pbs.twimg.com/profile_images/1234567890.jpg",
      "rank": 1,
      "portfolio_value": "1250.50",
      "portfolio": [ ... ]
    }
  ]
}
```

## WebSocket Events

### Subscribe to Contest Updates
```javascript
// Subscribe to contest participant updates
ws.send({
  type: "SUBSCRIBE",
  topic: "contest-participants",
  contest_id: 123
});
```

### Event: New Participant Joined
```javascript
{
  "type": "DATA",
  "topic": "contest-participants",
  "contest_id": 123,
  "data": {
    "type": "NEW_PARTICIPANT",
    "participant": {
      "wallet_address": "8Xk9siJqRdC4f3gRaQJVGPeq3RMPS6Gkjz2a72kwtvZH",
      "nickname": "BranchManager",
      "profile_image_url": "https://pbs.twimg.com/profile_images/987654321.jpg",
      "joined_at": "2025-06-09T12:35:00.000Z"
    }
  }
}
```

### Event: Ranking Update
```javascript
{
  "type": "DATA",
  "topic": "contest-participants",
  "contest_id": 123,
  "data": {
    "type": "RANKING_UPDATE",
    "participants": [
      {
        "wallet_address": "B1CV41TBQykwXHfc3gnohrHf5C5B99GMzFL5PhfuiNku",
        "rank": 1,
        "portfolio_value": "1250.50",
        "performance_percentage": "25.05",
        "profile_image_url": "https://pbs.twimg.com/profile_images/1234567890.jpg",
        "nickname": "CoffeeBerry99"
      }
    ]
  }
}
```

### Event: Individual Portfolio Update
```javascript
{
  "type": "DATA",
  "topic": "contest-participants",
  "contest_id": 123,
  "data": {
    "type": "PORTFOLIO_UPDATE",
    "participants": [{
      "wallet_address": "B1CV41TBQykwXHfc3gnohrHf5C5B99GMzFL5PhfuiNku",
      "nickname": "CoffeeBerry99",
      "profile_image_url": "https://pbs.twimg.com/profile_images/1234567890.jpg",
      "portfolio_value": "1275.00",
      "performance_percentage": "27.50",
      "chart_preview": [
        { "t": "2025-06-09T12:00:00Z", "v": 1000, "p": 0 },
        { "t": "2025-06-09T12:15:00Z", "v": 1050, "p": 5 }
      ]
    }]
  }
}
```

## Frontend Implementation Example

```javascript
// React component example
function ContestParticipants({ contestId }) {
  const [participants, setParticipants] = useState([]);
  const ws = useWebSocket();

  // Initial load via REST
  useEffect(() => {
    fetch(`/api/contests/${contestId}/participants`)
      .then(res => res.json())
      .then(data => setParticipants(data.contest_participants));
  }, [contestId]);

  // Real-time updates via WebSocket
  useEffect(() => {
    ws.subscribe('contest-participants', contestId);
    
    ws.on('message', (msg) => {
      if (msg.topic === 'contest-participants' && msg.contest_id === contestId) {
        switch (msg.data.type) {
          case 'NEW_PARTICIPANT':
            setParticipants(prev => [...prev, msg.data.participant]);
            break;
            
          case 'RANKING_UPDATE':
            setParticipants(msg.data.participants);
            break;
            
          case 'PORTFOLIO_UPDATE':
            setParticipants(prev => prev.map(p => {
              const update = msg.data.participants.find(u => 
                u.wallet_address === p.wallet_address
              );
              return update ? { ...p, ...update } : p;
            }));
            break;
        }
      }
    });
  }, [ws, contestId]);

  return (
    <div>
      {participants.map(p => (
        <ParticipantCard
          key={p.wallet_address}
          nickname={p.nickname}
          profileImage={p.profile_image_url || '/default-avatar.png'}
          rank={p.rank}
          portfolioValue={p.portfolio_value}
          performance={p.performance_percentage}
        />
      ))}
    </div>
  );
}
```

## Key Points

1. **All fields use snake_case** - No more camelCase confusion
2. **Profile images included everywhere** - REST and all WebSocket events
3. **Consistent data structure** - Same fields in REST and WebSocket
4. **Default handling** - Frontend should show default avatar when `profile_image_url` is null
5. **Real-time updates complete** - New joins, ranking changes, and portfolio updates all include profile data

## What Was Fixed

### Before (Broken):
- REST endpoints constructed fake URLs: `/api/users/${wallet}/profile-image` (didn't exist)
- WebSocket events missing profile images entirely
- Inconsistent naming: `profilePictureUrl` vs `profile_image_url`
- PORTFOLIO_UPDATE events had no user info

### After (Fixed):
- REST endpoints return actual `profile_image_url` from database
- All WebSocket events include `profile_image_url` and `nickname`
- Consistent snake_case naming throughout
- Complete user data in all real-time updates

The system is now clean, consistent, and maintainable! 🚀