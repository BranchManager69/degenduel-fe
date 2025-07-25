import React, { useState } from 'react';
import { createConfig } from '../../components/terminal/index';
import { Terminal } from '../../components/terminal/Terminal';
import { ChatRoomConfig, TerminalMode } from '../../components/terminal/types';

const TerminalAlterEgoExample: React.FC = () => {
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('ai');
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoomConfig>({
    roomId: 'general-chat',
    roomName: 'General Chat',
    roomType: 'general'
  });

  // Available chat rooms
  const chatRooms: ChatRoomConfig[] = [
    { roomId: 'general-chat', roomName: 'General Chat', roomType: 'general' },
    { roomId: 'trading-chat', roomName: 'Trading Discussion', roomType: 'trading' },
    { roomId: 'contest-768', roomName: 'Contest #768 Chat', roomType: 'contest' },
    { roomId: 'vip-lounge', roomName: 'VIP Lounge', roomType: 'private' },
  ];

  // Terminal configuration
  const terminalConfig = createConfig({
    RELEASE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    CONTRACT_ADDRESS: 'So11111111111111111111111111111111111111112',
  });

  const handleModeChange = (newMode: TerminalMode) => {
    setTerminalMode(newMode);
    console.log(`[TerminalAlterEgoExample] Mode changed to: ${newMode}`);
  };

  const handleChatRoomChange = (roomConfig: ChatRoomConfig) => {
    setCurrentChatRoom(roomConfig);
    console.log(`[TerminalAlterEgoExample] Switched to chat room: ${roomConfig.roomName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-800 p-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Terminal Alter Ego Demo
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            The same Terminal component, two personalities: AI Assistant & Multi-User Chat Room
          </p>
          
          {/* Mode Status */}
          <div className="inline-flex items-center space-x-4 bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-purple-500/30">
            <span className="text-gray-400">Current Mode:</span>
            <span className={`px-3 py-1 rounded-full font-semibold ${
              terminalMode === 'ai' 
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' 
                : 'bg-green-500/20 border border-green-500/50 text-green-300'
            }`}>
              {terminalMode === 'ai' ? '🤖 AI Assistant' : '💬 Chat Room'}
            </span>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mode Control */}
            <div>
              <h3 className="text-lg font-medium text-purple-300 mb-3">Terminal Mode</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTerminalMode('ai')}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    terminalMode === 'ai'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-blue-500/50'
                  }`}
                >
                  🤖 AI Assistant Mode
                  <div className="text-sm text-gray-400 mt-1">
                    Chat with Didi AI about DegenDuel
                  </div>
                </button>
                
                <button
                  onClick={() => setTerminalMode('chat-room')}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    terminalMode === 'chat-room'
                      ? 'bg-green-500/20 border-green-500 text-green-300'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-green-500/50'
                  }`}
                >
                  💬 Chat Room Mode
                  <div className="text-sm text-gray-400 mt-1">
                    Real-time chat with other users
                  </div>
                </button>
              </div>
            </div>

            {/* Chat Room Selection */}
            <div>
              <h3 className="text-lg font-medium text-purple-300 mb-3">
                Chat Room Selection
                {terminalMode === 'ai' && (
                  <span className="text-sm text-gray-500 ml-2">(AI mode active)</span>
                )}
              </h3>
              <div className="space-y-2">
                {chatRooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => handleChatRoomChange(room)}
                    disabled={terminalMode === 'ai'}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      terminalMode === 'ai'
                        ? 'bg-gray-900/50 border-gray-700 text-gray-500 cursor-not-allowed'
                        : currentChatRoom.roomId === room.roomId
                        ? 'bg-green-500/20 border-green-500 text-green-300'
                        : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-green-500/50'
                    }`}
                  >
                    <div className="font-medium">{room.roomName}</div>
                    <div className="text-sm text-gray-400">
                      Type: {room.roomType} • ID: {room.roomId}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Explanation */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-300 mb-3">🤖 AI Mode</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Chat with Didi AI assistant</li>
                <li>• Get help with DegenDuel features</li>
                <li>• Ask questions about tokens, contests, etc.</li>
                <li>• Generate dynamic UI components</li>
                <li>• Easter eggs and special commands</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-green-300 mb-3">💬 Chat Room Mode</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Real-time multi-user chat via WebSocket</li>
                <li>• See online participant count</li>
                <li>• Join/leave different chat rooms</li>
                <li>• Contest-specific chat rooms</li>
                <li>• System messages for user activity</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <h4 className="text-purple-300 font-medium mb-2">✨ The Alter Ego</h4>
            <p className="text-gray-300 text-sm">
              The exact same Terminal component transforms its personality based on the mode. 
              Same UI, same controls, same minimized Didi avatar - but completely different behavior and data sources.
              The blue/green mode toggle button in the terminal header lets users switch between personalities instantly.
            </p>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Try It Out</h2>
          
          <div className="space-y-3 text-gray-300">
            <p>1. <strong>Switch modes</strong> using the controls above or the mode toggle button in the terminal header</p>
            <p>2. <strong>In AI mode:</strong> Ask Didi questions like "What is DegenDuel?" or "How do contests work?"</p>
            <p>3. <strong>In Chat mode:</strong> Send messages that other users in the same room will see in real-time</p>
            <p>4. <strong>Try different chat rooms</strong> to see how the same component adapts to different contexts</p>
            <p>5. <strong>Notice the UI changes:</strong> Mode indicators, participant counts, and avatar styling</p>
          </div>
        </div>

      </div>

      {/* The Terminal Component with Alter Ego */}
      <Terminal
        config={terminalConfig}
        mode={terminalMode}
        onModeChange={handleModeChange}
        onCommandExecuted={(command, response) => {
          console.log(`[TerminalAlterEgo] Command executed: ${command} -> ${response}`);
        }}
        size="large"
        isInitiallyMinimized={false}
      />
    </div>
  );
};

export default TerminalAlterEgoExample; 