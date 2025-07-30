// src/hooks/websocket/topic-hooks/useIndividualToken.ts

/**
 * useIndividualToken Hook - Single token real-time subscription
 * 
 * This hook subscribes to a specific token by address for real-time updates.
 * Perfect for cases where you need guaranteed data for specific tokens
 * like DUEL and SOL on the landing page.
 * 
 * @author Claude
 * @created 2025-01-15
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Token } from '../../../types';
//import { ddApi } from '../../../services/dd-api';

interface UseIndividualTokenReturn {
  token: Token | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
  lastRawMessage: any; // For debugging
  messageHistory: any[]; // Last 10 messages
  lastUpdateType: 'minimal' | 'full' | null; // Track last update type
  initialRestResponse: any; // Initial REST API response
}

export function useIndividualToken(tokenAddress: string): UseIndividualTokenReturn {
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastRawMessage, setLastRawMessage] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [lastUpdateType, setLastUpdateType] = useState<'minimal' | 'full' | null>(null);
  const [initialRestResponse, setInitialRestResponse] = useState<any>(null);

  const ws = useWebSocket();
  const isSubscribed = useRef(false);
  const topic = `token:price:${tokenAddress}`;

  // Transform backend token to frontend Token type - FOR FULL REPLACE (initial load)
  const transformToken = useCallback((data: any): Token => {
    return {
      id: data.id || 0,
      address: data.address || tokenAddress,
      contractAddress: data.address || tokenAddress,
      symbol: data.symbol || "",
      name: data.name || "",
      price: data.price || 0,
      market_cap: data.market_cap || 0,
      marketCap: String(data.market_cap || 0),
      volume_24h: data.volume_24h || 0,
      volume24h: String(data.volume_24h || 0),
      change_24h: data.change_24h || 0,
      change24h: String(data.change_24h || 0),
      liquidity: data.liquidity || 0,
      fdv: data.fdv || 0,
      decimals: data.decimals || 9,
      image_url: data.image_url || "",
      header_image_url: data.header_image_url || "",
      socials: data.socials || {},
      status: "active" as const,
      websites: data.websites || [],
      // Additional fields for the detail page
      price_changes: data.price_changes || data.priceChanges,
      priceChanges: data.priceChanges || data.price_changes,
      volumes: data.volumes,
      transactions: data.transactions,
      total_supply: data.total_supply,
      totalSupply: data.totalSupply || String(data.total_supply || 0),
      description: data.description,
      color: data.color,
      tags: data.tags || [],
      pairCreatedAt: data.pairCreatedAt,
      first_seen_on_jupiter_at: data.first_seen_on_jupiter_at,
      priority_score: data.priority_score,
      priorityScore: data.priorityScore || data.priority_score,
      // Add ALL fields from REST response for future-proofing
      launchpad: data.launchpad,
      discovery_count: data.discovery_count,
      momentum_indicator: data.momentum_indicator,
      price_calculation_method: data.price_calculation_method,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      coingeckoId: data.coingeckoId,
      last_price_change: data.last_price_change,
      last_refresh_attempt: data.last_refresh_attempt,
      last_refresh_success: data.last_refresh_success,
      refresh_interval_seconds: data.refresh_interval_seconds,
      refresh_metadata: data.refresh_metadata,
      raw_supply: data.raw_supply,
      metadata_status: data.metadata_status,
      last_priority_calculation: data.last_priority_calculation,
      open_graph_image_url: data.open_graph_image_url,
      last_is_active_evaluation_at: data.last_is_active_evaluation_at,
      last_jupiter_sync_at: data.last_jupiter_sync_at,
      last_processed_at: data.last_processed_at,
      manually_activated: data.manually_activated,
      metadata_last_updated_at: data.metadata_last_updated_at,
      degenduel_score: data.degenduel_score,
      score_calculated_at: data.score_calculated_at,
      trend_category: data.trend_category,
      source: data.source,
      pool_derived_price: data.pool_derived_price,
      pool_derived_volume_24h: data.pool_derived_volume_24h,
      pool_derived_liquidity: data.pool_derived_liquidity,
      pool_derived_market_cap: data.pool_derived_market_cap,
      pool_price_calculated_at: data.pool_price_calculated_at,
      token_prices: data.token_prices,
      token_bucket_memberships: data.token_bucket_memberships
    };
  }, [tokenAddress]);

  // Transform partial updates - ONLY includes fields that were sent
  // 
  // ⚠️  CRITICAL WARNING: This is a manual allowlist of WebSocket fields!
  // ⚠️  If backend adds new fields to WebSocket messages, they must be added here
  // ⚠️  or they will be SILENTLY IGNORED (like last_jupiter_sync_at was)
  // 
  // TODO: Replace this manual field mapping with automatic field detection
  // or use a more robust merging strategy that doesn't require maintenance
  //
  const transformPartialToken = useCallback((data: any): Partial<Token> => {
    const partial: Partial<Token> = {};
    
    // Only add fields that exist in the data
    if (data.id !== undefined) partial.id = data.id;
    if (data.address !== undefined) {
      partial.address = data.address;
      partial.contractAddress = data.address;
    }
    if (data.symbol !== undefined) partial.symbol = data.symbol;
    if (data.name !== undefined) partial.name = data.name;
    if (data.price !== undefined) partial.price = data.price;
    if (data.market_cap !== undefined) {
      partial.market_cap = data.market_cap;
      partial.marketCap = String(data.market_cap);
    }
    if (data.volume_24h !== undefined) {
      partial.volume_24h = data.volume_24h;
      partial.volume24h = String(data.volume_24h);
    }
    if (data.change_24h !== undefined) {
      partial.change_24h = data.change_24h;
      partial.change24h = String(data.change_24h);
    }
    if (data.liquidity !== undefined) partial.liquidity = data.liquidity;
    if (data.fdv !== undefined) partial.fdv = data.fdv;
    if (data.decimals !== undefined) partial.decimals = data.decimals;
    if (data.image_url !== undefined) partial.image_url = data.image_url;
    if (data.header_image_url !== undefined) partial.header_image_url = data.header_image_url;
    if (data.socials !== undefined) partial.socials = data.socials;
    if (data.websites !== undefined) partial.websites = data.websites;
    if (data.price_changes !== undefined) partial.price_changes = data.price_changes;
    if (data.priceChanges !== undefined) partial.priceChanges = data.priceChanges;
    if (data.volumes !== undefined) partial.volumes = data.volumes;
    if (data.transactions !== undefined) partial.transactions = data.transactions;
    if (data.total_supply !== undefined) {
      partial.total_supply = data.total_supply;
      partial.totalSupply = String(data.total_supply);
    }
    if (data.description !== undefined) partial.description = data.description;
    if (data.color !== undefined) partial.color = data.color;
    if (data.tags !== undefined) partial.tags = data.tags;
    if (data.pairCreatedAt !== undefined) partial.pairCreatedAt = data.pairCreatedAt;
    if (data.first_seen_on_jupiter_at !== undefined) partial.first_seen_on_jupiter_at = data.first_seen_on_jupiter_at;
    if (data.priority_score !== undefined) {
      partial.priority_score = data.priority_score;
      partial.priorityScore = data.priority_score;
    }
    if (data.launchpad !== undefined) partial.launchpad = data.launchpad;
    if (data.discovery_count !== undefined) partial.discovery_count = data.discovery_count;
    if (data.momentum_indicator !== undefined) partial.momentum_indicator = data.momentum_indicator;
    if (data.price_calculation_method !== undefined) partial.price_calculation_method = data.price_calculation_method;
    if (data.is_active !== undefined) partial.is_active = data.is_active;
    if (data.created_at !== undefined) partial.created_at = data.created_at;
    if (data.updated_at !== undefined) partial.updated_at = data.updated_at;
    if (data.coingeckoId !== undefined) partial.coingeckoId = data.coingeckoId;
    if (data.last_price_change !== undefined) partial.last_price_change = data.last_price_change;
    if (data.last_refresh_attempt !== undefined) partial.last_refresh_attempt = data.last_refresh_attempt;
    if (data.last_refresh_success !== undefined) partial.last_refresh_success = data.last_refresh_success;
    if (data.refresh_interval_seconds !== undefined) partial.refresh_interval_seconds = data.refresh_interval_seconds;
    if (data.refresh_metadata !== undefined) partial.refresh_metadata = data.refresh_metadata;
    if (data.raw_supply !== undefined) partial.raw_supply = data.raw_supply;
    if (data.metadata_status !== undefined) partial.metadata_status = data.metadata_status;
    if (data.last_priority_calculation !== undefined) partial.last_priority_calculation = data.last_priority_calculation;
    if (data.open_graph_image_url !== undefined) partial.open_graph_image_url = data.open_graph_image_url;
    if (data.last_is_active_evaluation_at !== undefined) partial.last_is_active_evaluation_at = data.last_is_active_evaluation_at;
    if (data.last_jupiter_sync_at !== undefined) partial.last_jupiter_sync_at = data.last_jupiter_sync_at;
    if (data.last_processed_at !== undefined) partial.last_processed_at = data.last_processed_at;
    if (data.manually_activated !== undefined) partial.manually_activated = data.manually_activated;
    if (data.metadata_last_updated_at !== undefined) partial.metadata_last_updated_at = data.metadata_last_updated_at;
    if (data.degenduel_score !== undefined) partial.degenduel_score = data.degenduel_score;
    if (data.score_calculated_at !== undefined) partial.score_calculated_at = data.score_calculated_at;
    if (data.trend_category !== undefined) partial.trend_category = data.trend_category;
    if (data.source !== undefined) partial.source = data.source;
    if (data.pool_derived_price !== undefined) partial.pool_derived_price = data.pool_derived_price;
    if (data.pool_derived_volume_24h !== undefined) partial.pool_derived_volume_24h = data.pool_derived_volume_24h;
    if (data.pool_derived_liquidity !== undefined) partial.pool_derived_liquidity = data.pool_derived_liquidity;
    if (data.pool_derived_market_cap !== undefined) partial.pool_derived_market_cap = data.pool_derived_market_cap;
    if (data.pool_price_calculated_at !== undefined) partial.pool_price_calculated_at = data.pool_price_calculated_at;
    if (data.token_prices !== undefined) partial.token_prices = data.token_prices;
    if (data.token_bucket_memberships !== undefined) partial.token_bucket_memberships = data.token_bucket_memberships;
    
    return partial;
  }, []);

  // Fetch initial token data via REST
  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`[useIndividualToken] Fetching initial data for ${tokenAddress}`);

      // Use the direct token endpoint!
      const response = await fetch(`/api/tokens/${tokenAddress}`);
      if (!response.ok) {
        // Handle server downtime with user-friendly message
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error('Server temporarily unavailable.');
        }
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const tokenData = await response.json();

      if (tokenData) {
        // Store the initial REST response for debugging
        setInitialRestResponse(tokenData);
        setToken(transformToken(tokenData));
        setLastUpdate(new Date());
        console.log(`[useIndividualToken] Found token:`, tokenData.symbol);
      } else {
        setError(`Token ${tokenAddress} not found`);
        console.warn(`[useIndividualToken] Token not found: ${tokenAddress}`);
      }
    } catch (err: any) {
      console.error(`[useIndividualToken] Failed to fetch token:`, err);
      setError(err.message || 'Failed to fetch token');
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, transformToken]);

  // Handle incoming token updates
  const handleTokenUpdate = useCallback((message: any) => {
    if (message.type === 'DATA' && message.topic === topic && message.data) {
      console.log(`[useIndividualToken] Received update for ${tokenAddress}:`, message.data);

      // Store raw message for debugging
      setLastRawMessage(message.data);
      setMessageHistory(prev => [...prev.slice(-9), {
        timestamp: new Date().toISOString(),
        data: message.data,
        fields: Object.keys(message.data || {})
      }]);

      // Check if this is a WebSocket update vs full REST response
      const updateFields = Object.keys(message.data);
      
      // WebSocket updates have these specific field counts and patterns
      // 4 fields: id, address, symbol, price (minimal price update)
      // 11 fields: adds name, change_24h, market_cap, volume_24h, liquidity, image_url, header_image_url
      // Both should be treated as partial updates since they don't include static metadata
      const isWebSocketUpdate = updateFields.length <= 11 && !updateFields.includes('created_at');
      
      // Only treat as full update if it has REST API metadata fields
      const isMinimalUpdate = isWebSocketUpdate;
      
      if (isMinimalUpdate) {
        // Merge partial update with existing token data
        const partialUpdate = transformPartialToken(message.data);
        setToken(prevToken => prevToken ? { ...prevToken, ...partialUpdate } : transformToken(message.data));
        setLastUpdateType('minimal');
        console.log(`[useIndividualToken] Applied WebSocket partial update (${updateFields.length} fields) - preserving REST metadata`);
      } else {
        // Full update - replace entire token (likely from REST API or full refresh)
        const updatedToken = transformToken(message.data);
        setToken(updatedToken);
        setLastUpdateType('full');
        console.log(`[useIndividualToken] Applied full update (${updateFields.length} fields) - replacing all data`);
      }
      
      setLastUpdate(new Date());
      setError(null);
    }
  }, [topic, tokenAddress, transformToken, transformPartialToken]);

  // Initial fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // WebSocket subscription
  useEffect(() => {
    if (!ws.isConnected) {
      return;
    }

    console.log(`[useIndividualToken] Subscribing to ${topic}`);

    // Subscribe to specific token using traditional topics array
    ws.sendMessage({
      type: "SUBSCRIBE",
      topics: [topic]
    });
    isSubscribed.current = true;

    // Register listener
    const unregister = ws.registerListener(
      `individual-token-${tokenAddress}`,
      ['DATA'] as any[],
      handleTokenUpdate
    );

    return () => {
      unregister();
      if (isSubscribed.current && ws.isConnected) {
        ws.sendMessage({
          type: "UNSUBSCRIBE",
          topics: [topic]
        });
        isSubscribed.current = false;
      }
    };
  }, [ws, topic, tokenAddress, handleTokenUpdate]);

  return {
    token,
    isLoading,
    isConnected: ws.isConnected,
    error,
    lastUpdate,
    refresh: fetchToken,
    lastRawMessage,
    messageHistory,
    lastUpdateType,
    initialRestResponse
  };
}