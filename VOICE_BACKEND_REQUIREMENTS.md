# Voice Backend WebSocket Requirements

The frontend VoiceInput component expects a WebSocket server at `wss://degenduel.me/api/voice/realtime` that handles the following message protocol:

## Frontend → Backend Messages

### Start Listening
```json
{
  "type": "start_listening"
}
```

### Stop Listening  
```json
{
  "type": "stop_listening"
}
```

### Audio Data
```json
{
  "type": "audio_data",
  "data": [1234, -567, 890, ...] // Array of PCM16 Int16 audio samples
}
```

## Backend → Frontend Messages

### Transcription Result
```json
{
  "type": "transcription",
  "text": "User's spoken text here"
}
```

### Audio Response Chunk
```json
{
  "type": "audio_chunk", 
  "data": "base64EncodedAudioData" // PCM16 audio from OpenAI
}
```

### Speaking Status
```json
{ "type": "speaking_start" }
{ "type": "speaking_end" }
```

### Error
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Backend Implementation Notes

1. **Audio Format**: Frontend sends PCM16 Int16 samples at 24kHz
2. **OpenAI Integration**: Backend should use OpenAI Real-Time API with:
   - Model: `gpt-4o-realtime-preview` 
   - Voice: `nova` (for Didi's feminine voice)
   - Input format: `pcm16`
   - Output format: `pcm16`
3. **Authentication**: Add JWT/session validation as needed
4. **Rate Limiting**: Protect against abuse
5. **Error Handling**: Always send error messages back to frontend

## Frontend Features

- ✅ Microphone button with audio level visualization
- ✅ Connection status indicators  
- ✅ Speaking/listening states
- ✅ Auto-reconnection on disconnect
- ✅ Error display
- ✅ Clean UI animations