// src/components/dynamic/components/TransactionHistory.tsx

import React from 'react';
import { DynamicComponentProps } from '../types';

const TransactionHistory: React.FC<DynamicComponentProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-mono text-white font-semibold mb-4">Transaction History</h3>
      <div className="text-gray-400 text-center">
        Transaction history component coming soon...
      </div>
    </div>
  );
};

export default TransactionHistory;