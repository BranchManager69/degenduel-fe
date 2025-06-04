// src/components/admin/TokenQualityMonitorTestPanel.tsx

import React, { useState } from 'react';
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { ddApi } from "../../services/dd-api";

export const TokenQualityMonitorTestPanel: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  const simulateAlert = async (type: 'alert' | 'recovery') => {
    setIsSimulating(type);
    
    try {
      const response = await ddApi.fetch(`/admin/test-quality-alert/simulate-${type}`, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        // Show success notification
        console.log(`Test ${type} alert sent to Discord!`);
      }
    } catch (error) {
      console.error(`Failed to send test ${type}:`, error);
    } finally {
      setIsSimulating(null);
    }
  };

  return (
    <Card className="bg-dark-200/30 backdrop-blur-lg border-orange-500/30">
      <CardContent className="p-4">
        <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center">
          🧪 Test Discord Alerts
          <span className="ml-2 text-xs text-gray-500">(SuperAdmin Only)</span>
        </h4>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => simulateAlert('alert')}
            disabled={isSimulating !== null}
            className="bg-orange-500 hover:bg-orange-600"
            size="sm"
          >
            {isSimulating === 'alert' ? '⟳' : '🚨'} Test Critical Alert
          </Button>
          
          <Button
            onClick={() => simulateAlert('recovery')}
            disabled={isSimulating !== null}
            className="bg-green-500 hover:bg-green-600"
            size="sm"
          >
            {isSimulating === 'recovery' ? '⟳' : '✅'} Test Recovery Alert
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          Sends test alerts to Discord to verify webhook integration
        </p>
      </CardContent>
    </Card>
  );
};