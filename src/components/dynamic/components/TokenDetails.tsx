// src/components/dynamic/components/TokenDetails.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const TokenDetails: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">Token Details</h3>
      <div className="text-gray-400 text-center">
        Token details component coming soon...
      </div>
    </div>
  );
};

export default TokenDetails;