// src/components/dynamic/components/PriceComparison.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const PriceComparison: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">Price Comparison</h3>
      <div className="text-gray-400 text-center">
        Price comparison component coming soon...
      </div>
    </div>
  );
};

export default PriceComparison;