// src/pages/admin/TokenDataControlCenter.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { ddApi } from "../../services/dd-api";
import { TokenQualityMonitorPanel } from "../../components/admin/TokenQualityMonitorPanel";
import { TokenQualityMonitorTestPanel } from "../../components/admin/TokenQualityMonitorTestPanel";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

// Types for Token Quality Levels
interface TokenQualityLevel {
  id: number;
  level_name: string;
  min_liquidity: number;
  min_volume_24h: number;
  min_market_cap: number;
  require_image: boolean;
  max_age_days: number;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

// Types for Live Metrics
interface QualityLevelMetrics {
  level_name: string;
  token_count: number;
  total_market_cap: number;
  total_volume_24h: number;
  average_liquidity: number;
  top_tokens: Array<{
    symbol: string;
    name: string;
    market_cap: number;
    volume_24h: number;
    liquidity: number;
    change_24h: number;
  }>;
  last_updated: string;
}

interface QualityLevelFormData {
  min_liquidity: number;
  min_volume_24h: number;
  min_market_cap: number;
  require_image: boolean;
  max_age_days: number;
  is_active: boolean;
  description: string;
}

// Token Quality Service
class TokenQualityService {
  static async getAll(): Promise<{ success: boolean; data: TokenQualityLevel[] }> {
    const response = await ddApi.fetch("/admin/token-quality-levels", {
      credentials: "include"
    });
    return await response.json();
  }

  static async getOne(levelName: string): Promise<{ success: boolean; data: TokenQualityLevel }> {
    const response = await ddApi.fetch(`/admin/token-quality-levels/${levelName}`, {
      credentials: "include"
    });
    return await response.json();
  }

  static async update(levelName: string, data: QualityLevelFormData): Promise<{ success: boolean; data: TokenQualityLevel; message: string }> {
    const response = await ddApi.fetch(`/admin/token-quality-levels/${levelName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  static async create(data: QualityLevelFormData & { level_name: string }): Promise<{ success: boolean; data: TokenQualityLevel; message: string }> {
    const response = await ddApi.fetch("/admin/token-quality-levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  // Get live metrics for each quality level
  static async getMetrics(): Promise<{ success: boolean; data: QualityLevelMetrics[] }> {
    try {
      // Use the trending endpoint to get actual data for each quality level
      const [strictResponse, relaxedResponse, minimalResponse] = await Promise.all([
        ddApi.fetch("/tokens/trending?quality_level=strict&limit=1000", { credentials: "include" }),
        ddApi.fetch("/tokens/trending?quality_level=relaxed&limit=1000", { credentials: "include" }),
        ddApi.fetch("/tokens/trending?quality_level=minimal&limit=1000", { credentials: "include" })
      ]);

      const [strictData, relaxedData, minimalData] = await Promise.all([
        strictResponse.json(),
        relaxedResponse.json(),
        minimalResponse.json()
      ]);

      const calculateMetrics = (tokens: any[], levelName: string): QualityLevelMetrics => {
        if (!tokens || tokens.length === 0) {
          return {
            level_name: levelName,
            token_count: 0,
            total_market_cap: 0,
            total_volume_24h: 0,
            average_liquidity: 0,
            top_tokens: [],
            last_updated: new Date().toISOString()
          };
        }

        const totalMarketCap = tokens.reduce((sum, token) => sum + (token.market_cap || 0), 0);
        const totalVolume = tokens.reduce((sum, token) => sum + (token.volume_24h || 0), 0);
        const totalLiquidity = tokens.reduce((sum, token) => sum + (token.liquidity || 0), 0);

        return {
          level_name: levelName,
          token_count: tokens.length,
          total_market_cap: totalMarketCap,
          total_volume_24h: totalVolume,
          average_liquidity: totalLiquidity / tokens.length,
          top_tokens: tokens.slice(0, 5).map(token => ({
            symbol: token.symbol,
            name: token.name,
            market_cap: token.market_cap || 0,
            volume_24h: token.volume_24h || 0,
            liquidity: token.liquidity || 0,
            change_24h: token.change_24h || 0
          })),
          last_updated: new Date().toISOString()
        };
      };

      const metrics = [
        calculateMetrics(strictData.success ? strictData.data : [], 'strict'),
        calculateMetrics(relaxedData.success ? relaxedData.data : [], 'relaxed'),
        calculateMetrics(minimalData.success ? minimalData.data : [], 'minimal')
      ];

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Failed to fetch quality level metrics:', error);
      return { success: false, data: [] };
    }
  }
}

// Quality Level Card Component
const QualityLevelCard: React.FC<{
  level: TokenQualityLevel;
  metrics?: QualityLevelMetrics;
  onEdit: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ level, metrics, onEdit, isExpanded, onToggleExpand }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
  };

  const getLevelColor = (levelName: string) => {
    switch (levelName.toLowerCase()) {
      case 'strict': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'relaxed': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'minimal': return 'bg-gradient-to-r from-green-500 to-green-600';
      default: return 'bg-gradient-to-r from-brand-500 to-brand-600';
    }
  };

  const getLevelIcon = (levelName: string) => {
    switch (levelName.toLowerCase()) {
      case 'strict': return '🏆';
      case 'relaxed': return '⚡';
      case 'minimal': return '🔰';
      default: return '🎯';
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-dark-200/50 backdrop-blur-lg border-dark-300 hover:border-brand-400/50 transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getLevelIcon(level.level_name)}</div>
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-white capitalize">
                    {level.level_name}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(level.level_name)}`}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">{level.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onToggleExpand}
                variant="outline"
                size="sm"
                className="text-brand-400 border-brand-400/30 hover:bg-brand-400/10"
              >
                {isExpanded ? '▲' : '▼'}
              </Button>
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="text-cyber-400 border-cyber-400/30 hover:bg-cyber-400/10"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Min Liquidity</div>
              <div className="text-sm font-bold text-white">{formatCurrency(level.min_liquidity)}</div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Min Volume 24h</div>
              <div className="text-sm font-bold text-white">{formatCurrency(level.min_volume_24h)}</div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Min Market Cap</div>
              <div className="text-sm font-bold text-white">{formatCurrency(level.min_market_cap)}</div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Max Age</div>
              <div className="text-sm font-bold text-white">{level.max_age_days} days</div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-dark-300/50 pt-4 space-y-4"
              >
                {/* Configuration Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">Require Image:</span>
                      <span className={`text-sm ${level.require_image ? 'text-green-400' : 'text-red-400'}`}>
                        {level.require_image ? '✓ Required' : '✗ Optional'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className={`text-sm ${level.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {level.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Last Updated:</span>
                      <div className="text-sm text-white">{new Date(level.updated_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Updated By:</span>
                      <div className="text-sm text-white">{level.updated_by}</div>
                    </div>
                  </div>
                </div>

                {/* Live Metrics Section */}
                {metrics && (
                  <div className="border-t border-dark-300/30 pt-4">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                      📊 Live Metrics
                      <span className="ml-2 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                        LIVE DATA
                      </span>
                    </h4>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-dark-300/40 rounded-lg p-3 border border-brand-500/20">
                        <div className="text-xs text-gray-400 mb-1">Total Tokens</div>
                        <div className="text-xl font-bold text-brand-400">{metrics.token_count.toLocaleString()}</div>
                      </div>
                      <div className="bg-dark-300/40 rounded-lg p-3 border border-green-500/20">
                        <div className="text-xs text-gray-400 mb-1">Total Market Cap</div>
                        <div className="text-xl font-bold text-green-400">{formatCurrency(metrics.total_market_cap)}</div>
                      </div>
                      <div className="bg-dark-300/40 rounded-lg p-3 border border-cyan-500/20">
                        <div className="text-xs text-gray-400 mb-1">Avg Liquidity</div>
                        <div className="text-xl font-bold text-cyan-400">{formatCurrency(metrics.average_liquidity)}</div>
                      </div>
                    </div>

                    {/* Top Tokens */}
                    {metrics.top_tokens.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-gray-300 mb-2">🏆 Top 5 Tokens by DegenDuel Algorithm</h5>
                        <div className="space-y-2">
                          {metrics.top_tokens.map((token, index) => (
                            <div key={token.symbol} className="flex items-center justify-between bg-dark-300/20 rounded-lg p-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">{token.symbol}</div>
                                  <div className="text-xs text-gray-400 truncate">{token.name}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="text-center">
                                  <div className="text-gray-400">MCap</div>
                                  <div className="text-white font-medium">{formatCurrency(token.market_cap)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">24h Vol</div>
                                  <div className="text-white font-medium">{formatCurrency(token.volume_24h)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">24h %</div>
                                  <div className={`font-medium ${token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="text-xs text-gray-500 mt-3">
                      📡 Last updated: {new Date(metrics.last_updated).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Edit Modal Component
const QualityLevelEditModal: React.FC<{
  level: TokenQualityLevel;
  onSave: (levelName: string, data: QualityLevelFormData) => Promise<void>;
  onCancel: () => void;
}> = ({ level, onSave, onCancel }) => {
  const [formData, setFormData] = useState<QualityLevelFormData>({
    min_liquidity: level.min_liquidity,
    min_volume_24h: level.min_volume_24h,
    min_market_cap: level.min_market_cap,
    require_image: level.require_image,
    max_age_days: level.max_age_days,
    is_active: level.is_active,
    description: level.description || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(level.level_name, formData);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-200 border border-dark-300 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-white mb-6 capitalize">
          Edit {level.level_name} Quality Level
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Financial Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Liquidity (USD)
              </label>
              <input
                type="number"
                value={formData.min_liquidity}
                onChange={(e) => setFormData({...formData, min_liquidity: parseInt(e.target.value)})}
                min="0"
                required
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-brand-400"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {formatCurrency(formData.min_liquidity)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum 24h Volume (USD)
              </label>
              <input
                type="number"
                value={formData.min_volume_24h}
                onChange={(e) => setFormData({...formData, min_volume_24h: parseInt(e.target.value)})}
                min="0"
                required
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-brand-400"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {formatCurrency(formData.min_volume_24h)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Market Cap (USD)
              </label>
              <input
                type="number"
                value={formData.min_market_cap}
                onChange={(e) => setFormData({...formData, min_market_cap: parseInt(e.target.value)})}
                min="0"
                required
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-brand-400"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {formatCurrency(formData.min_market_cap)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Age (Days)
              </label>
              <input
                type="number"
                value={formData.max_age_days}
                onChange={(e) => setFormData({...formData, max_age_days: parseInt(e.target.value)})}
                min="1"
                required
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-brand-400"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {formData.max_age_days} days
              </div>
            </div>
          </div>

          {/* Boolean Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_image"
                checked={formData.require_image}
                onChange={(e) => setFormData({...formData, require_image: e.target.checked})}
                className="w-4 h-4 text-brand-600 bg-dark-300 border-dark-400 rounded focus:ring-brand-500"
              />
              <label htmlFor="require_image" className="text-sm font-medium text-gray-300">
                Require Token Image
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4 text-brand-600 bg-dark-300 border-dark-400 rounded focus:ring-brand-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                Active
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-brand-400"
              placeholder="Brief description of this quality level..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-300">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main Component
export const TokenDataControlCenter: React.FC = () => {
  const { isSuperAdmin } = useMigratedAuth();
  const [qualityLevels, setQualityLevels] = useState<TokenQualityLevel[]>([]);
  const [metrics, setMetrics] = useState<QualityLevelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<TokenQualityLevel | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  const loadQualityLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await TokenQualityService.getAll();
      if (result.success) {
        setQualityLevels(result.data);
      } else {
        setError('Failed to load quality levels');
      }
    } catch (error) {
      console.error('Failed to load quality levels:', error);
      setError('Failed to load quality levels');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      const result = await TokenQualityService.getMetrics();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const handleUpdate = async (levelName: string, formData: QualityLevelFormData) => {
    try {
      const result = await TokenQualityService.update(levelName, formData);
      if (result.success) {
        await loadQualityLevels(); // Reload data
        await loadMetrics(); // Reload metrics after update
        setEditingLevel(null);
        // Show success notification
        console.log('Quality level updated successfully:', result.message);
      } else {
        setError('Failed to update quality level');
      }
    } catch (error) {
      console.error('Failed to update quality level:', error);
      setError('Failed to update quality level');
    }
  };

  const toggleExpanded = (levelName: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(levelName)) {
      newExpanded.delete(levelName);
    } else {
      newExpanded.add(levelName);
    }
    setExpandedLevels(newExpanded);
  };

  useEffect(() => {
    loadQualityLevels();
    loadMetrics();
  }, [loadQualityLevels, loadMetrics]);

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !loadingMetrics) {
        loadMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, loadingMetrics, loadMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto">
            <div className="w-full h-full border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Loading Token Quality Levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display text-gray-100 relative">
            <span className="bg-gradient-to-r from-brand-400 via-cyber-400 to-brand-500 bg-clip-text text-transparent">
              Token Data Control Center
            </span>
          </h1>
          <p className="text-gray-400 mt-2 font-mono text-sm">
            THE BRAIN OF THE TOKEN SYSTEM • Configure which tokens appear in your game
            <span className="inline-block ml-1 w-2 h-4 bg-cyber-500 opacity-80 animate-pulse"></span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadMetrics}
            disabled={loadingMetrics}
            variant="outline"
            size="sm"
            className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
          >
            {loadingMetrics ? '⟳' : '📊'} {loadingMetrics ? 'Loading...' : 'Refresh Metrics'}
          </Button>
          {metrics.length > 0 && (
            <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
              📡 Auto-refresh: 30s
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
        >
          <p className="text-red-400">{error}</p>
          <Button
            onClick={loadQualityLevels}
            variant="outline"
            size="sm"
            className="mt-2 text-red-400 border-red-400/30"
          >
            Retry
          </Button>
        </motion.div>
      )}

      {/* Quality Levels Grid */}
      <div className="space-y-6">
        {qualityLevels.map((level) => {
          const levelMetrics = metrics.find(m => m.level_name === level.level_name);
          return (
            <QualityLevelCard
              key={level.id}
              level={level}
              metrics={levelMetrics}
              onEdit={() => setEditingLevel(level)}
              isExpanded={expandedLevels.has(level.level_name)}
              onToggleExpand={() => toggleExpanded(level.level_name)}
            />
          );
        })}
      </div>

      {/* Token Quality Monitor Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-display text-gray-100 relative">
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            Discord Alert System
          </span>
        </h2>
        
        {/* Token Quality Monitor Panel */}
        <TokenQualityMonitorPanel />
        
        {/* SuperAdmin Test Panel */}
        {isSuperAdmin && (
          <TokenQualityMonitorTestPanel />
        )}
      </div>

      {/* Info Panel */}
      <Card className="bg-dark-200/30 backdrop-blur-lg border-dark-300">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-3">ℹ️ How It Works</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>Quality Levels:</strong> Strict = Contest-ready tokens, Relaxed = General trading, Minimal = Basic protection</p>
            <p>• <strong>Real-time Impact:</strong> Changes take effect within 1 minute due to caching</p>
            <p>• <strong>Live Metrics:</strong> Click ▼ to expand any card and see current token counts, market caps, and top performers</p>
            <p>• <strong>Auto-refresh:</strong> Metrics update every 30 seconds to show live data from your trending endpoints</p>
            <p>• <strong>Backend Integration:</strong> Each level filters tokens based on liquidity, volume, market cap, and age requirements</p>
            <p>• <strong>Discord Alerts:</strong> Monitor automatically sends Discord notifications when token counts drop below safe thresholds</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingLevel && (
          <QualityLevelEditModal
            level={editingLevel}
            onSave={handleUpdate}
            onCancel={() => setEditingLevel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};