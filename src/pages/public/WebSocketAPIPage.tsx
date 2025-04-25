import React from 'react';
import WebSocketAPIGuide from '../../components/_WEBSOCKET_API_GUIDE';

/**
 * WebSocket API Documentation & Testing Page
 * 
 * This page displays the interactive WebSocket API guide and demo
 */
const WebSocketAPIPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-cyber-200 font-display tracking-wide text-center">
        WebSocket API Documentation & Testing
      </h1>
      <WebSocketAPIGuide />
    </div>
  );
};

export default WebSocketAPIPage; 