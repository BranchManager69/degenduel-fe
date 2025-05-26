// src/components/dynamic/components/LiveActivityFeed.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const LiveActivityFeed: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">Live Activity Feed</h3>
      <div className="text-gray-400 text-center">
        Live activity feed component coming soon...
      </div>
    </div>
  );
};

export default LiveActivityFeed;