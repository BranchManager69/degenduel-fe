// src/components/admin/TokenQualityMonitorPanel.tsx

import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { ddApi } from "../../services/dd-api";

interface MonitorStatus {
  isRunning: boolean;
  checkIntervalMinutes: number;
  nextCheckIn: number;
  lastCounts: {
    strict: number;
    relaxed: number;
    minimal: number;
  };
  thresholds: {
    criticalLow: number;
    warningLow: number;
    significantDrop: number;
  };
}

export const TokenQualityMonitorPanel: React.FC = () => {
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [editedThresholds, setEditedThresholds] = useState({
    criticalLow: 10,
    warningLow: 25,
    significantDrop: 0.5
  });

  const loadMonitorStatus = async () => {
    try {
      const response = await ddApi.fetch('/admin/token-quality-monitor/status', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setMonitorStatus(result.data);
        // Set edited thresholds from the loaded data
        setEditedThresholds(result.data.thresholds);
      }
    } catch (error) {
      console.error('Failed to load monitor status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitorStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadMonitorStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleMonitor = async () => {
    if (!monitorStatus) return;
    
    const action = monitorStatus.isRunning ? 'stop' : 'start';
    setIsToggling(true);
    
    try {
      const response = await ddApi.fetch(`/admin/token-quality-monitor/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        await loadMonitorStatus(); // Refresh status
      }
    } catch (error) {
      console.error(`Failed to ${action} monitor:`, error);
    } finally {
      setIsToggling(false);
    }
  };

  const triggerManualCheck = async () => {
    setIsChecking(true);
    
    try {
      const response = await ddApi.fetch('/admin/token-quality-monitor/check', {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        // Show success notification
        console.log('Manual check completed successfully');
        await loadMonitorStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const updateThresholds = async () => {
    try {
      const response = await ddApi.fetch('/admin/token-quality-monitor/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedThresholds)
      });
      const result = await response.json();
      if (result.success) {
        setEditingThresholds(false);
        await loadMonitorStatus(); // Refresh to get updated thresholds
        console.log('Thresholds updated successfully');
      }
    } catch (error) {
      console.error('Failed to update thresholds:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200/50 backdrop-blur-lg border-dark-300">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-300/50 rounded mb-4"></div>
            <div className="h-24 bg-dark-300/30 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monitorStatus) {
    return (
      <Card className="bg-dark-200/50 backdrop-blur-lg border-dark-300">
        <CardContent className="p-6">
          <p className="text-red-400">Failed to load monitor status</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-lg border-dark-300 hover:border-red-400/50 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center">
              🚨 Token Quality Monitor
              <span className="ml-3 text-xs text-gray-400 font-normal">
                Discord alerts when quality drops
              </span>
            </h3>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${monitorStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${monitorStatus.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                {monitorStatus.isRunning ? 'Active' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* Monitor Info */}
        {monitorStatus.isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-dark-300/30 rounded-lg p-4 mb-6 border border-dark-300/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400">Check Interval</span>
                <div className="text-white font-medium">{monitorStatus.checkIntervalMinutes} minutes</div>
              </div>
              <div>
                <span className="text-xs text-gray-400">Next Check In</span>
                <div className="text-white font-medium">{formatTime(monitorStatus.nextCheckIn)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center space-x-3 mb-6">
          <Button
            onClick={toggleMonitor}
            disabled={isToggling}
            className={monitorStatus.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {isToggling ? '⟳' : monitorStatus.isRunning ? '⏹' : '▶'} 
            {' '}
            {isToggling ? 'Processing...' : monitorStatus.isRunning ? 'Stop Monitor' : 'Start Monitor'}
          </Button>

          <Button
            onClick={triggerManualCheck}
            disabled={!monitorStatus.isRunning || isChecking}
            variant="outline"
            className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
          >
            {isChecking ? '⟳' : '🔍'} {isChecking ? 'Checking...' : 'Run Check Now'}
          </Button>
        </div>

        {/* Current Counts */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center">
            📊 Last Known Token Counts
            {monitorStatus.lastCounts && (
              <span className="ml-2 text-xs text-gray-500">
                (from last check)
              </span>
            )}
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(monitorStatus.lastCounts || {}).map(([level, count]) => (
              <div key={level} className="bg-dark-300/40 rounded-lg p-3 border border-dark-300/50">
                <div className="text-xs text-gray-400 capitalize mb-1">{level}</div>
                <div className="text-lg font-bold text-white">{count} tokens</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-dark-300/20 rounded-lg p-4 border border-dark-300/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-300">⚡ Alert Thresholds</h4>
            <Button
              onClick={() => {
                if (editingThresholds) {
                  // Cancel editing - reset to current values
                  setEditedThresholds(monitorStatus.thresholds);
                }
                setEditingThresholds(!editingThresholds);
              }}
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-400/30 hover:bg-gray-400/10"
            >
              {editingThresholds ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {editingThresholds ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Critical Low (any level)</label>
                <input
                  type="number"
                  value={editedThresholds.criticalLow}
                  onChange={(e) => setEditedThresholds({
                    ...editedThresholds,
                    criticalLow: parseInt(e.target.value) || 0
                  })}
                  min="1"
                  className="w-full px-3 py-1.5 bg-dark-200/50 border border-dark-400 rounded text-white text-sm focus:outline-none focus:border-red-400"
                />
                <span className="text-xs text-gray-500">Alert if any level drops below this</span>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Warning Low (strict only)</label>
                <input
                  type="number"
                  value={editedThresholds.warningLow}
                  onChange={(e) => setEditedThresholds({
                    ...editedThresholds,
                    warningLow: parseInt(e.target.value) || 0
                  })}
                  min="1"
                  className="w-full px-3 py-1.5 bg-dark-200/50 border border-dark-400 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
                />
                <span className="text-xs text-gray-500">Warn if strict tokens drop below this</span>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Significant Drop %</label>
                <input
                  type="number"
                  value={editedThresholds.significantDrop * 100}
                  onChange={(e) => setEditedThresholds({
                    ...editedThresholds,
                    significantDrop: (parseFloat(e.target.value) || 0) / 100
                  })}
                  min="10"
                  max="100"
                  step="5"
                  className="w-full px-3 py-1.5 bg-dark-200/50 border border-dark-400 rounded text-white text-sm focus:outline-none focus:border-orange-400"
                />
                <span className="text-xs text-gray-500">Alert if tokens drop by this percentage</span>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  onClick={updateThresholds}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save Thresholds
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center">
                  🚨 <span className="ml-2">Critical Alert</span>
                </span>
                <span className="text-red-400 font-medium">
                  &lt; {monitorStatus.thresholds?.criticalLow} tokens (any level)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center">
                  ⚠️ <span className="ml-2">Warning Alert</span>
                </span>
                <span className="text-yellow-400 font-medium">
                  &lt; {monitorStatus.thresholds?.warningLow} tokens (strict only)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center">
                  📉 <span className="ml-2">Drop Alert</span>
                </span>
                <span className="text-orange-400 font-medium">
                  {(monitorStatus.thresholds?.significantDrop * 100)}%+ decrease
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Discord Info */}
        <div className="mt-4 text-xs text-gray-500 flex items-center">
          <span className="mr-2">💬</span>
          <span>Alerts are sent to your configured Discord webhook with 30-minute cooldowns</span>
        </div>
      </CardContent>
    </Card>
  );
};