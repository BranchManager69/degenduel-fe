import React from 'react';
import WebSocketAPIGuide from '../../../components/_WEBSOCKET_API_GUIDE';

/**
 * WebSocket API Documentation & Testing Page
 * 
 * This page displays the interactive WebSocket API guide and demo
 */
const WebSocketAPITestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">WebSocket API Documentation & Testing</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <WebSocketAPIGuide />
      </div>
    </div>
  );
};

export default WebSocketAPITestPage; 