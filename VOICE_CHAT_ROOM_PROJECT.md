# DegenDuel Voice Chat Room with Didi - Project Plan

## 🎯 Vision
Create a revolutionary social AI voice chat experience where Didi (our AI) participates as a member of voice chat rooms alongside users. Think "Discord meets AI" but integrated into the DegenDuel terminal.

## 🏗️ Architecture Overview

### Core Concept: "Many-to-One-to-Many"
```
[Multiple Users] → [Audio Mixer] → [Single Stream] → [OpenAI Realtime API]
                                                          ↓
[All Users] ← [Broadcast] ← [Didi's Response] ←---------
```

**Key Insight**: OpenAI's Realtime API sees one conversation stream (the mixed room audio), making Didi a natural participant rather than managing multiple sessions.

## 🛠️ Technical Stack

### Infrastructure (Already Available)
- **Cloudflare**: WebSocket support, DDoS protection, global CDN
- **NGINX**: WebSocket proxy, load balancing, SSL termination
- **PM2**: Process management for media server
- **32GB RAM Server**: More than sufficient for audio processing

### Required Components

#### 1. WebRTC Media Server
**Options** (in order of recommendation):
- **MediaSoup** (Node.js) - Fits your stack perfectly
- **LiveKit** (Go-based) - Most features, including built-in audio mixing
- **Janus Gateway** (C) - Battle-tested but more complex

#### 2. Signaling Layer
- Use existing unified WebSocket (`/api/v69/ws`)
- New topic: `voice-room`
- Handles: join/leave, ICE candidates, room state

#### 3. Audio Processing Pipeline
```javascript
// Server-side audio flow
WebRTC Audio Streams → Audio Mixer → Encoder → OpenAI
                           ↓
                    Room Participants ← Broadcaster ← Didi Audio
```

## 📋 Implementation Phases

### Phase 1: Basic Infrastructure (Week 1)
- [ ] Install and configure MediaSoup
- [ ] Create voice room service in backend
- [ ] Set up STUN/TURN servers
- [ ] Integrate with unified WebSocket for signaling
- [ ] Basic room creation/joining logic

### Phase 2: Audio Pipeline (Week 2)
- [ ] Implement audio mixing for multiple streams
- [ ] Create OpenAI Realtime API integration
- [ ] Handle audio format conversion (WebRTC → OpenAI format)
- [ ] Implement broadcast system for Didi's responses
- [ ] Add push-to-talk functionality

### Phase 3: Terminal Integration (Week 3)
- [ ] Update VoiceInput component for room mode
- [ ] Create room UI in terminal (participant list, speaking indicators)
- [ ] Add visual feedback (waveforms, who's speaking)
- [ ] Implement room controls (mute, leave, etc.)
- [ ] Add connection status indicators

### Phase 4: UX Polish & Modes (Week 4)
- [ ] Implement different room modes:
  - "Pass the Mic" - Token-based speaking
  - "Open Forum" - Everyone can speak
  - "Didi's Show" - Didi leads conversation
- [ ] Add voice activity detection
- [ ] Create room persistence/reconnection
- [ ] Add text fallback in terminal
- [ ] Implement admin controls

## 🔧 Technical Implementation Details

### Backend Structure
```
/services
  /voice
    /VoiceRoomService.js       # Room management
    /AudioMixerService.js      # Mixing multiple streams
    /OpenAIVoiceService.js     # Realtime API integration
    /MediaServerAdapter.js     # MediaSoup wrapper

/websocket/topics
  /voice-room.js              # WebSocket topic handler
```

### Frontend Structure
```
/components/terminal/voice-room
  /VoiceRoomUI.tsx           # Main room interface
  /ParticipantsList.tsx      # Who's in the room
  /SpeakingIndicator.tsx     # Visual feedback
  /AudioVisualizer.tsx       # Waveforms
  /RoomControls.tsx          # Mute/leave/settings
```

### Cloudflare & NGINX Configuration

#### Cloudflare Setup
```yaml
# Already supports WebSockets
# Ensure these settings:
- WebSocket support: ON
- HTTP/2: ON
- 100MB upload limit (audio chunks)
```

#### NGINX Configuration
```nginx
# Add to existing config
location /voice/media {
    proxy_pass http://localhost:3006;  # MediaSoup port
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

### STUN/TURN Configuration
```javascript
// Use Cloudflare's TURN or host your own
const iceServers = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { 
    urls: 'turn:turn.cloudflare.com:3478',
    username: 'your-turn-username',
    credential: 'your-turn-password'
  }
];
```

## 🎮 Room Modes & Features

### 1. Contest Trading Floor
- Active during contests
- Didi provides live commentary
- Participants discuss strategies
- Integrated with portfolio data

### 2. Token Talk Show
- Scheduled events
- Didi interviews users about tokens
- Community discussions
- Recorded for playback

### 3. Degen Game Night
- Trivia with Didi as host
- Crypto/meme knowledge contests
- Voice-activated answers
- Prize integration

### 4. Tutorial Mode
- Didi teaches platform features
- Interactive Q&A
- New user onboarding
- Voice-guided tutorials

## 🚀 Unique Features

### Smart Audio Routing
```javascript
// Intelligent mixing based on context
if (userSpeaking.includes('@didi')) {
  prioritizeStreamForOpenAI(userStream);
} else if (multipleUsersSpeaking) {
  mixAllStreamsEqually();
}
```

### Conversation Memory
- Didi remembers context from earlier in conversation
- Can reference previous speakers
- Maintains room "personality"

### Visual Integration
- Terminal shows audio waveforms
- Speaking indicators in ASCII art
- Room status in terminal UI
- Text transcript alongside audio

## 📊 Performance Targets

- Support 10-20 concurrent speakers per room
- < 200ms audio latency
- Smooth handling of join/leave
- Graceful degradation on poor connections

## 🔒 Security & Moderation

- Admin/SuperAdmin can moderate rooms
- Kick/ban functionality
- Audio recording options (with consent)
- Rate limiting per user
- Profanity filtering option

## 💰 Cost Optimization

### OpenAI Costs
- Single API connection per room (not per user!)
- Implement silence detection to pause API usage
- Room timeout after inactivity
- Usage caps per room/user

### Bandwidth Optimization
- Adaptive bitrate based on participants
- Opus codec for efficiency
- Regional TURN servers via Cloudflare

## 🎯 Success Metrics

1. **Technical**: < 200ms latency, 99% uptime
2. **User Engagement**: Avg session > 10 minutes
3. **Social**: Multiple users talking together
4. **AI Quality**: Didi contributing meaningfully

## 🚧 Potential Challenges & Solutions

### Challenge: Multiple people talking at once
**Solution**: Voice activity indicators + smart mixing + "raise hand" feature

### Challenge: Echo/feedback
**Solution**: WebRTC echo cancellation + headphone detection

### Challenge: Mobile browser support
**Solution**: Progressive enhancement + fallback to text

### Challenge: Scaling beyond 20 users
**Solution**: Room sharding + multiple media servers

## 🎪 The "Wow" Factor

This isn't just voice chat - it's the first social AI voice experience where:
- The AI is a room participant, not a service
- Natural group conversations with AI
- Integrated with your trading platform
- Happens inside a terminal (!)

## 🏁 Next Steps

1. Validate OpenAI Realtime API access
2. Choose media server (recommend MediaSoup)
3. Create proof-of-concept with 2 users + Didi
4. Design terminal UI mockups
5. Set up development environment

---

**Remember**: We're not building "Discord with AI". We're creating something entirely new - a social AI experience native to DegenDuel's terminal-first design.

*"Come hang out with Didi and the degens"* 🎙️