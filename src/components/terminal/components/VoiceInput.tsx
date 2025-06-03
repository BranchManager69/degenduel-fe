/**
 * @fileoverview
 * Voice input component for terminal using OpenAI Real-Time API
 * 
 * @description
 * Enables real-time voice conversations with Didi using OpenAI's Real-Time Voice API
 * 
 * @author Claude Assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onVoiceStateChange?: (isListening: boolean) => void;
  onAudioResponse?: (audioData: ArrayBuffer) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  onVoiceStateChange,
  onAudioResponse,
  className = '' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDidiSpeaking, setIsDidiSpeaking] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Initialize WebSocket connection to backend
  useEffect(() => {
    const initializeWebSocket = () => {
      try {
        // Connect to YOUR backend WebSocket for voice
        const wsUrl = import.meta.env.VITE_VOICE_WS_URL || 'wss://degenduel.me/api/voice/realtime';
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('[VoiceInput] Connected to backend voice service');
          setIsConnected(true);
          setError(null);
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'transcription':
              console.log('[VoiceInput] Transcription:', message.text);
              if (onTranscript) {
                onTranscript(message.text);
              }
              break;
              
            case 'audio_chunk':
              if (message.data && onAudioResponse) {
                // Convert base64 to ArrayBuffer
                const binaryString = atob(message.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                onAudioResponse(bytes.buffer);
              }
              break;
              
            case 'speaking_start':
              setIsDidiSpeaking(true);
              break;
              
            case 'speaking_end':
              setIsDidiSpeaking(false);
              break;
              
            case 'error':
              console.error('[VoiceInput] Backend error:', message.message);
              setError(message.message || 'Voice service error');
              break;
              
            default:
              console.log('[VoiceInput] Unknown message type:', message.type);
          }
        };
        
        ws.onerror = (error) => {
          console.error('[VoiceInput] WebSocket error:', error);
          setError('Connection error');
          setIsConnected(false);
        };
        
        ws.onclose = () => {
          console.log('[VoiceInput] WebSocket closed');
          setIsConnected(false);
          // Auto-reconnect after 3 seconds
          setTimeout(initializeWebSocket, 3000);
        };
        
        wsRef.current = ws;
      } catch (err) {
        console.error('[VoiceInput] Failed to initialize WebSocket:', err);
        setError('Failed to connect to voice service');
      }
    };
    
    initializeWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onTranscript, onAudioResponse]);
  
  // Audio level monitoring
  const startAudioMonitoring = async () => {
    try {
      console.log('[VoiceInput] Checking for microphone availability...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('[VoiceInput] Microphone access granted');
      
      streamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Send audio to backend
      if (wsRef.current && audioContextRef.current) {
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        
        processor.onaudioprocess = (e) => {
          if (wsRef.current && isListening && wsRef.current.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32Array to Int16Array for PCM16
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }
            
            // Send audio data to backend
            wsRef.current.send(JSON.stringify({
              type: 'audio_data',
              data: Array.from(pcm16)
            }));
          }
        };
        
        processor.connect(audioContextRef.current.destination);
      }
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('[VoiceInput] Error accessing microphone:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Microphone access denied';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Microphone is being used by another application.';
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          errorMessage = 'Microphone does not support required settings.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'Browser does not support microphone access.';
        } else {
          errorMessage = `Microphone error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      throw err; // Re-throw to be caught by startListening
    }
  };
  
  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };
  
  const startListening = async () => {
    console.log('[VoiceInput] Starting listening...');
    
    // First check if we have a connection
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceInput] WebSocket not connected, attempting to connect...');
      setError('Connecting to voice service...');
      // Don't return here - try to start audio anyway for testing
    }
    
    try {
      setError(null);
      console.log('[VoiceInput] Requesting microphone access...');
      
      // Start audio monitoring first to get permissions
      await startAudioMonitoring();
      
      // Only set listening state if audio started successfully
      setIsListening(true);
      
      // Tell backend we're starting to listen (if connected)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_listening'
        }));
      }
      
      if (onVoiceStateChange) onVoiceStateChange(true);
      console.log('[VoiceInput] Successfully started listening');
    } catch (err) {
      console.error('[VoiceInput] Error starting:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start voice input';
      setError(errorMessage);
      stopListening();
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    stopAudioMonitoring();
    
    // Tell backend we're stopping
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_listening'
      }));
    }
    
    if (onVoiceStateChange) onVoiceStateChange(false);
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  return (
    <div className={`voice-input-container ${className}`}>
      {/* Voice button */}
      <motion.button
        type="button"
        className={`voice-button relative ${isListening ? 'listening' : ''} ${isDidiSpeaking ? 'didi-speaking' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[VoiceInput] Button clicked');
          toggleListening();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? 'Click to stop' : 'Click to start voice input'}
      >
        {/* Microphone icon */}
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 ${isListening ? 'text-cyan-300' : 'text-purple-400'}`}
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0
          }}
        >
          <path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            fill="currentColor"
          />
          <path
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19v4m-4 0h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
        
        {/* Audio level indicator */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(6, 182, 212, ${audioLevel * 0.5}) 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1 + audioLevel * 0.3, 1],
            }}
            transition={{
              duration: 0.1,
              ease: "linear"
            }}
          />
        )}
        
        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-400/50"
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.5, 0.3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-400/30"
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.3, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5
              }}
            />
          </>
        )}
        
        {/* Didi speaking indicator */}
        {isDidiSpeaking && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity
            }}
          />
        )}
      </motion.button>
      
      {/* Connection status - Always show status */}
      <motion.div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {isConnected ? 'Voice Ready' : 'Voice Service Offline'}
        </span>
      </motion.div>
      
      {/* Error message - Show prominently */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-red-900/90 text-white px-3 py-1 rounded text-xs font-medium shadow-lg">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;