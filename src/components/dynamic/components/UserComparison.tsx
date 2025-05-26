// src/components/dynamic/components/UserComparison.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const UserComparison: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">User Comparison</h3>
      <div className="text-gray-400 text-center">
        User comparison component coming soon...
      </div>
    </div>
  );
};

export default UserComparison;