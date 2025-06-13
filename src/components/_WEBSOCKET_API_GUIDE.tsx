// _WEBSOCKET_API_GUIDE.tsx
// This is a React component that serves as both documentation and a demo for the WebSocket API
// Import this component into your React application to test and understand the WebSocket API
// (MIGHT BE OUTDATED)

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
type MessageDirection = 'incoming' | 'outgoing';
type MessageType = 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'REQUEST' | 'COMMAND' | 'DATA' | 'ERROR' | 'SYSTEM' | 'ACKNOWLEDGMENT' | 'Unknown';

interface Message {
  id: number;
  content: string;
  direction: MessageDirection;
  className: string;
  timestamp: string;
  messageType: MessageType;
  topicName: string | null;
}

// Extremely outdated token data interface
interface TokenData {
  symbol: string;
  price: number;
  change24h: number;
  [key: string]: any;
}

// Topic subscriptions (looks outdated)
interface TopicSubscriptions {
  'market_data': boolean;
  'portfolio': boolean;
  'system': boolean;
  'contest': boolean;
  'user': boolean;
  'admin': boolean;
  'wallet': boolean;
  'wallet-balance': boolean;
  'skyduel': boolean;
  [key: string]: boolean;
}

// We can replace this with your actual authentication token handling
const useAuthToken = (): string => {
  // This is just a placeholder - replace with our actual auth token management
  return localStorage.getItem('auth_token') || '';
};

// WebSocket API Guide component
const WebSocketAPIGuide: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const [topicSubscriptions, setTopicSubscriptions] = useState<TopicSubscriptions>({
    'market_data': true,
    'portfolio': false,
    'system': true,
    'contest': false,
    'user': false,
    'admin': false,
    'wallet': false,
    'wallet-balance': false,
    'skyduel': false
  });
  const [manualMessage, setManualMessage] = useState<string>(
`{
  "type": "REQUEST",
  "topic": "market_data",
  "action": "getToken",
  "symbol": "SOL"
}`);
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const authToken = useAuthToken();
  
  // Connection URL
  const socketUrl = process.env.NODE_ENV === 'production' 
    ? 'wss://degenduel.me/api/v69/ws'
    : `ws://${window.location.hostname}:${window.location.port}/api/v69/ws`;
  
  // Message types constants
  const MESSAGE_TYPES = {
    SUBSCRIBE: 'SUBSCRIBE',
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    REQUEST: 'REQUEST',
    COMMAND: 'COMMAND',
    DATA: 'DATA',
    ERROR: 'ERROR',
    SYSTEM: 'SYSTEM',
    ACKNOWLEDGMENT: 'ACKNOWLEDGMENT'
  } as const;
  
  // Scroll to bottom of message list on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Connect to WebSocket
  const connect = (): void => {
    if (socketRef.current) {
      addMessage('Already connected', 'outgoing', 'error');
      return;
    }
    
    try {
      setConnectionStatus('connecting');
      addMessage(`Connecting to ${socketUrl}...`, 'outgoing');
      
      socketRef.current = new WebSocket(socketUrl);
      
      socketRef.current.onopen = handleOpen;
      socketRef.current.onmessage = handleMessage;
      socketRef.current.onclose = handleClose;
      socketRef.current.onerror = handleError;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Connection error: ${errorMessage}`, 'outgoing', 'error');
      setConnectionStatus('error');
    }
  };
  
  // Disconnect from WebSocket
  const disconnect = (): void => {
    if (!socketRef.current) {
      addMessage('Not connected', 'outgoing', 'error');
      return;
    }
    
    try {
      socketRef.current.close(1000, 'User disconnected');
      addMessage('Disconnecting...', 'outgoing');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Disconnect error: ${errorMessage}`, 'outgoing', 'error');
    }
  };
  
  // Handle WebSocket open event
  const handleOpen = (): void => {
    setConnectionStatus('connected');
    setConnected(true);
    addMessage('Connected to server', 'incoming');
  };
  
  // Handle WebSocket message event
  const handleMessage = (event: MessageEvent): void => {
    try {
      const message = JSON.parse(event.data);
      
      // Format the message for display
      const formattedMessage = JSON.stringify(message, null, 2);
      
      // Add the message to the list
      const topicClass = message.topic ? `topic-${message.topic}` : '';
      addMessage(formattedMessage, 'incoming', topicClass);
      
      // Process token data if present
      if (message.type === MESSAGE_TYPES.DATA && message.topic === 'market_data') {
        processTokenData(message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Parse error: ${errorMessage}. Raw data: ${event.data}`, 'incoming', 'error');
    }
  };
  
  // Handle WebSocket close event
  const handleClose = (event: CloseEvent): void => {
    setConnectionStatus('disconnected');
    setConnected(false);
    addMessage(`Disconnected from server: ${event.code} ${event.reason}`, 'incoming');
    socketRef.current = null;
  };
  
  // Handle WebSocket error event
  const handleError = (error: Event): void => {
    setConnectionStatus('error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addMessage(`WebSocket error: ${errorMessage}`, 'incoming', 'error');
  };
  
  // Add message to message list
  const addMessage = (content: string, direction: MessageDirection, className: string = ''): void => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    
    // Try to identify message type
    let messageType: MessageType = 'Unknown';
    let topicName: string | null = null;
    
    // If the content is a string and includes '"type":', try to parse it
    if (typeof content === 'string' && content.includes('"type":')) {
      try {
        const parsed = JSON.parse(content);
        messageType = (parsed.type as MessageType) || 'Unknown';
        topicName = parsed.topic || null;
      } catch (e) {
        // Just a fallback
        messageType = content.includes('"type":"') 
          ? (content.split('"type":"')[1].split('"')[0] as MessageType)
          : 'Unknown';
      }
    }
    
    // Create a new message
    const newMessage: Message = {
      id: Date.now(),
      content,
      direction,
      className,
      timestamp,
      messageType,
      topicName
    };
    
    // Add the new message to the messages list
    setMessages(prev => [...prev, newMessage]);
  };
  
  // Process token data message
  const processTokenData = (message: any): void => {
    try {
      if (Array.isArray(message.data)) {
        // Bulk update (initial data)
        const newTokens = { ...tokens };
        message.data.forEach((token: TokenData) => {
          newTokens[token.symbol] = token;
        });
        setTokens(newTokens);
      } else if (message.data && message.data.symbol) {
        // Single token update
        setTokens(prev => ({
          ...prev,
          [message.data.symbol]: message.data
        }));
      }
    } catch (error) {
      console.error('Error processing token data:', error);
    }
  };
  
  // Send message to WebSocket server
  const sendMessage = (message: any): void => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addMessage('Not connected to server', 'outgoing', 'error');
      return;
    }
    
    try {
      const messageString = JSON.stringify(message);
      socketRef.current.send(messageString);
      addMessage(messageString, 'outgoing');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Send error: ${errorMessage}`, 'outgoing', 'error');
    }
  };
  
  // Subscribe to selected topics
  const subscribeToTopics = (): void => {
    const selectedTopics = Object.entries(topicSubscriptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([topic]) => topic);
      
    if (selectedTopics.length === 0) {
      addMessage('No topics selected', 'outgoing', 'error');
      return;
    }
    
    const message: {
      type: string;
      topics: string[];
      authToken?: string;
    } = {
      type: MESSAGE_TYPES.SUBSCRIBE,
      topics: selectedTopics,
    };
    
    // Add auth token if provided and needed
    const restrictedTopics = ['portfolio', 'user', 'admin', 'wallet', 'wallet-balance'];
    const hasRestrictedTopic = selectedTopics.some(topic => restrictedTopics.includes(topic));
    
    if (hasRestrictedTopic && authToken) {
      message.authToken = authToken;
    }
    
    sendMessage(message);
  };
  
  // Unsubscribe from selected topics
  const unsubscribeFromTopics = (): void => {
    const selectedTopics = Object.entries(topicSubscriptions)
      .filter(([_, isSelected]) => isSelected)
      .map(([topic]) => topic);
      
    if (selectedTopics.length === 0) {
      addMessage('No topics selected', 'outgoing', 'error');
      return;
    }
    
    sendMessage({
      type: MESSAGE_TYPES.UNSUBSCRIBE,
      topics: selectedTopics
    });
  };
  
  // Send manual message
  const sendManualMessage = (): void => {
    try {
      const message = JSON.parse(manualMessage);
      sendMessage(message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(`Error parsing JSON: ${errorMessage}`, 'outgoing', 'error');
    }
  };
  
  // Clear messages
  const clearMessages = (): void => {
    setMessages([]);
  };
  
  // Handle topic checkbox change
  const handleTopicChange = (topic: string): void => {
    setTopicSubscriptions(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };
  
  // Render sorted token list
  const renderTokenList = (): React.JSX.Element => {
    
    // Sort tokens by symbol
    const sortedTokens = Object.values(tokens).sort((a, b) => 
      a.symbol.localeCompare(b.symbol)
    );
    
    // Return the JSX
    return (
      <div className="max-h-96 overflow-y-auto mt-2">
        {/* Sorted tokens list */}
        {sortedTokens.map(token => (
          <div key={token.symbol} className="flex items-center p-2 border-b border-gray-700/50 hover:bg-dark-300/30">

            {/* Symbol */}
            <div className="font-bold w-20 font-mono">
              {token.symbol}
            </div>

            {/* Price */}
            <div className="text-right w-24 font-mono">
              {/* if price is a number, format it to 2 decimal places, otherwise show N/A */}
              ${typeof token.price === 'number' 
                ? token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : 'N/A'}
            </div>

            {/* 24h Change */}
            <div className={`text-right w-20 px-1 ml-2 font-mono ${(token.change24h || 0) >= 0 
              ? 'text-green-400' 
              : 'text-red-400'}`}>
              {/* if change24h is a number, format it to 2 decimal places, otherwise show N/A */}
              {token.change24h 
                ? `${token.change24h >= 0 
                  ? '+' 
                  : ''}${token.change24h.toFixed(2)}%` 
                : 'N/A'}
            </div>

          </div>
        ))}
      </div>
    );

  };

  // Get websocket connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected': 
        return <span className="text-green-400 font-bold">Connected</span>;
      case 'connecting': 
        return <span className="text-yellow-400 font-bold">Connecting...</span>;
      case 'disconnecting': 
        return <span className="text-orange-400 font-bold">Disconnecting...</span>;
      case 'error':
        return <span className="text-red-400 font-bold">Error</span>;
      default:
        return <span className="text-gray-400 font-bold">Disconnected</span>;
    }
  };

  // Get websocket message class based on type
  const getMessageClass = (message: Message) => {
    const baseClasses = "p-3 mb-2 rounded relative border-l-4";
    
    if (message.className === 'error') {
      return `${baseClasses} bg-red-900/20 border-red-500`;
    }
    
    if (message.direction === 'incoming') {
      return `${baseClasses} bg-blue-900/20 border-blue-500`;
    }
    
    return `${baseClasses} bg-green-900/20 border-green-500`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-8 text-center text-cyber-200 font-display tracking-wide">DegenDuel WebSocket API Guide</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Control Panel */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-dark-300/70 backdrop-blur-lg rounded-xl border-2 border-cyber-500/30 hover:border-cyber-500/50 p-6 transition-all duration-300 shadow-lg shadow-cyber-500/10"
        >
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyber-500/40 transition-colors"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyber-500/40 transition-colors"></div>
          
          <h2 className="text-xl font-bold text-cyber-300 mb-4 font-display tracking-wide">Connection Controls</h2>
          <div className="mb-4">
            <div className="mb-2">Status: {getConnectionStatusDisplay()}</div>
            
            <div className="flex gap-2 mt-4">
              <button 
                className={`px-4 py-2 text-sm font-bold rounded ${
                  !connected 
                    ? 'bg-cyber-600 text-black hover:bg-cyber-500 transition-colors duration-300' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                onClick={connect}
                disabled={connected}
              >
                Connect
              </button>
              <button 
                className={`px-4 py-2 text-sm font-bold rounded ${
                  connected 
                    ? 'bg-red-600 text-white hover:bg-red-500 transition-colors duration-300' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                onClick={disconnect}
                disabled={!connected}
              >
                Disconnect
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-bold text-cyber-200 mb-2 font-display tracking-wide">Topic Subscriptions</h3>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto pr-2">
              {Object.entries(topicSubscriptions).map(([topic, isChecked]) => (
                <div key={topic} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`topic-${topic}`}
                    checked={isChecked}
                    onChange={() => handleTopicChange(topic)}
                    className="mr-2 accent-cyber-500 cursor-pointer"
                  />
                  <label htmlFor={`topic-${topic}`} className="text-sm cursor-pointer">
                    {topic}
                    {topic === 'portfolio' || topic === 'user' || topic === 'admin' || topic === 'wallet' || topic === 'wallet-balance' ? (
                      <span className="ml-1 text-xs bg-yellow-900/30 text-yellow-300 px-1 py-0.5 rounded">
                        Auth
                      </span>
                    ) : null}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 text-sm font-bold rounded ${
                  connected 
                    ? 'bg-green-600 text-white hover:bg-green-500 transition-colors duration-300' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                onClick={subscribeToTopics}
                disabled={!connected}
              >
                Subscribe
              </button>
              <button 
                className={`px-4 py-2 text-sm font-bold rounded ${
                  connected 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-500 transition-colors duration-300' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                onClick={unsubscribeFromTopics}
                disabled={!connected}
              >
                Unsubscribe
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-cyber-200 mb-2 font-display tracking-wide">Manual Commands</h3>
            <div className="mb-2">
              <label className="block mb-1 text-sm font-bold">Custom Message JSON:</label>
              <textarea
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                rows={6}
                className="w-full p-2 rounded bg-dark-300 font-mono text-xs border border-cyber-400/20 focus:border-cyber-400/50 outline-none"
              />
            </div>
            <button 
              className={`px-4 py-2 text-sm font-bold rounded ${
                connected 
                  ? 'bg-cyber-600 text-black hover:bg-cyber-500 transition-colors duration-300' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={sendManualMessage}
              disabled={!connected}
            >
              Send Message
            </button>
          </div>
        </motion.div>
        
        {/* Message Panel */}
        <motion.div className="bg-dark-300/70 backdrop-blur-lg rounded-xl border-2 border-blue-500/30 hover:border-blue-500/50 p-6 transition-all duration-300 shadow-lg shadow-blue-500/10 relative lg:col-span-2">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-blue-500/40 transition-colors"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-blue-500/40 transition-colors"></div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-300 font-display tracking-wide">WebSocket Messages</h2>
            <button 
              className="px-3 py-1 text-xs font-bold rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-300"
              onClick={clearMessages}
            >
              Clear Messages
            </button>
          </div>
          
          <div className="h-96 overflow-y-auto bg-dark-300/50 border border-gray-700 rounded p-2">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center p-4">No messages yet. Connect to get started.</div>
            ) : (
              <AnimatePresence>
                {messages.map(message => (
                  <motion.div 
                    key={message.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={getMessageClass(message)}
                  >
                    <div className="text-xs opacity-70 absolute top-1 right-2 font-mono">
                      {message.timestamp}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      {message.topicName && (
                        <span className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-dark-300 text-blue-400 ">
                          {message.topicName}
                        </span>
                      )}
                      
                      <span className="font-bold text-xs">{message.messageType}</span>
                    </div>
                    
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto mt-2">{message.content}</pre>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>
        
        {/* Token Data Panel */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-dark-300/70 backdrop-blur-lg rounded-xl border-2 border-green-500/30 hover:border-green-500/50 p-6 transition-all duration-300 shadow-lg shadow-green-500/10 lg:col-span-3"
        >
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-green-500/40 transition-colors"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-green-500/40 transition-colors"></div>
          
          <h2 className="text-xl font-bold text-green-300 font-display tracking-wide mb-4">Token Data</h2>
          
          <div className="text-sm text-gray-400 italic mb-2">
            {Object.keys(tokens).length > 0 
              ? `${Object.keys(tokens).length} tokens received` 
              : 'No tokens received'}
          </div>
          
          {Object.keys(tokens).length > 0 && (
            <div className="bg-dark-300/50 border border-gray-700 rounded overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-2 border-b border-gray-700 font-bold text-xs uppercase text-gray-400">
                <div>Symbol</div>
                <div className="text-right">Price</div>
                <div className="text-right">24h Change</div>
              </div>
              {renderTokenList()}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Documentation Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-300/70 backdrop-blur-lg rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 p-6 transition-all duration-300 shadow-lg shadow-purple-500/10 relative"
      >
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-purple-500/40 transition-colors"></div>
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-500/40 transition-colors"></div>
        
        <h2 className="text-2xl font-bold text-purple-300 mb-6 font-display tracking-wide">WebSocket API Documentation</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-purple-200 mb-3 font-display tracking-wide">Connection Information</h3>
            <p className="mb-1"><strong className="text-purple-300">Endpoint:</strong> <span className="font-mono">/api/v69/ws</span></p>
            <p className="text-gray-300 mb-6">This WebSocket API provides real-time data from the DegenDuel platform through a unified WebSocket implementation with topic-based subscriptions.</p>
            
            <h3 className="text-xl font-bold text-purple-200 mb-3 font-display tracking-wide">Message Types</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-bold text-purple-300 mb-2">Client → Server:</h4>
              <div className="mb-4">
                <h5 className="font-bold text-sm text-purple-200 mb-1">SUBSCRIBE</h5>
                <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "SUBSCRIBE",
  "topics": ["market_data", "system"]
}`}</pre>
              </div>
              
              <div className="mb-4">
                <h5 className="font-bold text-sm text-purple-200 mb-1">UNSUBSCRIBE</h5>
                <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "UNSUBSCRIBE",
  "topics": ["portfolio"]
}`}</pre>
              </div>
              
              <div className="mb-4">
                <h5 className="font-bold text-sm text-purple-200 mb-1">REQUEST</h5>
                <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "REQUEST",
  "topic": "market_data",
  "action": "getToken",
  "symbol": "btc",
  "requestId": "123"
}`}</pre>
              </div>
              
              <div>
                <h5 className="font-bold text-sm text-purple-200 mb-1">COMMAND</h5>
                <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "COMMAND",
  "topic": "portfolio",
  "action": "refreshBalance"
}`}</pre>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-purple-200 mb-3 font-display tracking-wide">Available Topics</h3>
            <div className="bg-dark-300/50 rounded border border-gray-700 overflow-hidden mb-6">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-dark-300/80">
                    <th className="py-2 px-4 text-left text-xs font-bold uppercase text-purple-300 border-b border-gray-700">Topic</th>
                    <th className="py-2 px-4 text-left text-xs font-bold uppercase text-purple-300 border-b border-gray-700">Auth Required</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">market_data</td>
                    <td className="py-2 px-4">No</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">portfolio</td>
                    <td className="py-2 px-4">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">system</td>
                    <td className="py-2 px-4">No</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">contest</td>
                    <td className="py-2 px-4">Public: No, Personal: Yes</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">user</td>
                    <td className="py-2 px-4">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">admin</td>
                    <td className="py-2 px-4">Yes (admin role)</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">wallet</td>
                    <td className="py-2 px-4">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 px-4 font-mono">wallet-balance</td>
                    <td className="py-2 px-4">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-mono">skyduel</td>
                    <td className="py-2 px-4">Public: No, Personal: Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <h4 className="text-lg font-bold text-purple-300 mb-2">Server → Client:</h4>
            <div className="mb-4">
              <h5 className="font-bold text-sm text-purple-200 mb-1">DATA</h5>
              <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "DATA",
  "topic": "market_data",
  "action": "getToken",
  "requestId": "123",
  "data": { /* token data */ },
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
            </div>
            
            <div className="mb-4">
              <h5 className="font-bold text-sm text-purple-200 mb-1">ERROR</h5>
              <pre className="bg-dark-300/50 p-3 rounded border-l-4 border-purple-500/50 text-xs font-mono overflow-x-auto">{`{
  "type": "ERROR",
  "code": 4010,
  "message": "Authentication required for restricted topics",
  "timestamp": "2025-04-07T15:30:00Z"
}`}</pre>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-bold text-purple-200 mb-3 font-display tracking-wide">Error Codes</h3>
          <div className="bg-dark-300/50 rounded border border-gray-700 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-dark-300/80">
                  <th className="py-2 px-4 text-left text-xs font-bold uppercase text-purple-300 border-b border-gray-700">Code</th>
                  <th className="py-2 px-4 text-left text-xs font-bold uppercase text-purple-300 border-b border-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4000</td>
                  <td className="py-2 px-4">Invalid message format</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4001</td>
                  <td className="py-2 px-4">Missing message type</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4003</td>
                  <td className="py-2 px-4">Subscription requires at least one topic</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4010</td>
                  <td className="py-2 px-4">Authentication required for restricted topics</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4011</td>
                  <td className="py-2 px-4">Invalid authentication token</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4012</td>
                  <td className="py-2 px-4">Admin role required for admin topics</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4040</td>
                  <td className="py-2 px-4">Resource not found</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-4 font-mono">4401</td>
                  <td className="py-2 px-4">Token expired</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-mono">5000</td>
                  <td className="py-2 px-4">Internal server error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WebSocketAPIGuide; 