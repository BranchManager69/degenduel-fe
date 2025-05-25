// src/components/dynamic/components/PortfolioSummary.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const PortfolioSummary: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">Portfolio Summary</h3>
      <div className="text-gray-400 text-center">
        Portfolio summary component coming soon...
      </div>
    </div>
  );
};

export default PortfolioSummary;