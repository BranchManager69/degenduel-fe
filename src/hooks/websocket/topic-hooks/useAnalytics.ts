/**
 * useAnalytics Hook
 * 
 * V69 Standardized WebSocket Hook for Admin Analytics
 * This hook provides real-time updates for admin analytics and metrics
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDExtendedMessageType } from '../types';
import { TopicType } from '../index';

// Analytics interfaces based on backend API documentation
export interface UserMetrics {
  total: number;
  active: number;
  online: number;
  newToday: number;
  newThisWeek: number;
  conversion: {
    visitors: number;
    signups: number;
    rate: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  distribution: {
    byRegion: Record<string, number>;
    byPlatform: Record<string, number>;
    byReferrer: Record<string, number>;
  };
}

export interface ContestMetrics {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  averageParticipants: number;
  totalPrizePool: number;
  mostPopular: {
    contestId: string;
    contestName: string;
    participants: number;
  };
  participationRate: number;
  creationRate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface TokenMetrics {
  total: number;
  marketCap: number;
  volume24h: number;
  mostTraded: {
    symbol: string;
    name: string;
    volume24h: number;
  };
  priceChanges: {
    positive: number;
    negative: number;
    neutral: number;
  };
  distribution: {
    byCategory: Record<string, number>;
    byVolume: Record<string, number>;
  };
}

export interface SystemMetrics {
  performance: {
    apiResponseTime: number;
    websocketLatency: number;
    serverLoad: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  requestVolume: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
  };
  websocket: {
    connections: number;
    messageRate: number;
    byTopic: Record<string, number>;
  };
}

export interface RevenueMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byProduct: Record<string, number>;
  conversion: {
    visitors: number;
    paying: number;
    rate: number;
  };
  averageRevenue: {
    perUser: number;
    perPayingUser: number;
  };
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface AnalyticsData {
  timestamp: string;
  timeframe: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  users: UserMetrics;
  contests: ContestMetrics;
  tokens: TokenMetrics;
  system: SystemMetrics;
  revenue: RevenueMetrics;
}

// Default analytics data
const DEFAULT_ANALYTICS: AnalyticsData = {
  timestamp: new Date().toISOString(),
  timeframe: 'realtime',
  users: {
    total: 0,
    active: 0,
    online: 0,
    newToday: 0,
    newThisWeek: 0,
    conversion: {
      visitors: 0,
      signups: 0,
      rate: 0
    },
    retention: {
      day1: 0,
      day7: 0,
      day30: 0
    },
    distribution: {
      byRegion: {},
      byPlatform: {},
      byReferrer: {}
    }
  },
  contests: {
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    averageParticipants: 0,
    totalPrizePool: 0,
    mostPopular: {
      contestId: '',
      contestName: '',
      participants: 0
    },
    participationRate: 0,
    creationRate: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  },
  tokens: {
    total: 0,
    marketCap: 0,
    volume24h: 0,
    mostTraded: {
      symbol: '',
      name: '',
      volume24h: 0
    },
    priceChanges: {
      positive: 0,
      negative: 0,
      neutral: 0
    },
    distribution: {
      byCategory: {},
      byVolume: {}
    }
  },
  system: {
    performance: {
      apiResponseTime: 0,
      websocketLatency: 0,
      serverLoad: 0,
      memoryUsage: 0,
      cpuUsage: 0
    },
    errors: {
      total: 0,
      byType: {},
      byEndpoint: {}
    },
    requestVolume: {
      total: 0,
      byEndpoint: {},
      byMethod: {}
    },
    websocket: {
      connections: 0,
      messageRate: 0,
      byTopic: {}
    }
  },
  revenue: {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byProduct: {},
    conversion: {
      visitors: 0,
      paying: 0,
      rate: 0
    },
    averageRevenue: {
      perUser: 0,
      perPayingUser: 0
    },
    growth: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  }
};

// Define the standard structure for analytics updates from the server
// Following the exact format from the backend team
interface WebSocketAnalyticsMessage {
  type: string; // 'DATA'
  topic: string; // 'admin'
  subtype?: string; // 'analytics', 'metrics', 'alerts'
  action?: string; // 'update'
  data: {
    analytics?: Partial<AnalyticsData>;
    section?: 'users' | 'contests' | 'tokens' | 'system' | 'revenue';
    sectionData?: any;
    metrics?: Record<string, any>;
    timeframe?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
  timestamp: string;
}

/**
 * Hook for accessing admin analytics data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param timeframe Optional timeframe filter ('realtime', 'hourly', 'daily', 'weekly', 'monthly')
 */
export function useAnalytics(timeframe: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' = 'realtime') {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketAnalyticsMessage>) => {
    try {
      // Check if this is a valid analytics message
      if (message.type === 'DATA' && message.topic === 'admin' && message.data) {
        const data = message.data;
        
        // Handle complete analytics update
        if (data.analytics) {
          // Update analytics data with new values
          setAnalyticsData(prevData => ({
            ...prevData,
            ...data.analytics as AnalyticsData,
            timestamp: message.timestamp || new Date().toISOString()
          }));
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('analytics_update', {
            socketType: TopicType.ADMIN,
            message: 'Full analytics data updated',
            timestamp: new Date().toISOString(),
            timeframe: data.analytics.timeframe
          });
        }
        // Handle section update
        else if (data.section && data.sectionData) {
          setAnalyticsData(prevData => {
            const section = data.section as keyof AnalyticsData;
            if (section === 'users' || section === 'contests' || section === 'tokens' || 
                section === 'system' || section === 'revenue') {
              return {
                ...prevData,
                [section]: {
                  ...prevData[section],
                  ...data.sectionData
                },
                timestamp: message.timestamp || new Date().toISOString()
              };
            }
            return prevData;
          });
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('analytics_section_update', {
            socketType: TopicType.ADMIN,
            message: `Analytics section ${data.section} updated`,
            timestamp: new Date().toISOString()
          });
        }
        // Handle individual metrics update
        else if (data.metrics) {
          // Process metrics updates to the appropriate sections
          setAnalyticsData(prevData => {
            const newData = { ...prevData };
            
            // The backend might send flattened metrics, so we need to map them
            // to the appropriate nested structure in our state
            if (data.metrics) {
              Object.entries(data.metrics).forEach(([key, value]) => {
                // Example: "users.total" => { users: { total: value } }
                const parts = key.split('.');
                if (parts.length === 2) {
                  const [section, metric] = parts;
                  if (section in newData) {
                    const sectionKey = section as keyof AnalyticsData;
                    if (typeof newData[sectionKey] === 'object' && newData[sectionKey] !== null) {
                      // @ts-ignore - This is safe because we check that the section exists
                      newData[sectionKey][metric] = value;
                    }
                  }
                }
                
                // Handle deeper nested metrics
                if (parts.length === 3) {
                  const [section, subsection, metric] = parts;
                  if (section in newData) {
                    const sectionKey = section as keyof AnalyticsData;
                    if (typeof newData[sectionKey] === 'object' && 
                        newData[sectionKey] !== null && 
                        subsection in (newData[sectionKey] as any)) {
                      // @ts-ignore - This is safe because we check that the section and subsection exist
                      newData[sectionKey][subsection][metric] = value;
                    }
                  }
                }
              });
            }
            
            return {
              ...newData,
              timestamp: message.timestamp || new Date().toISOString()
            };
          });
          
          setIsLoading(false);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('analytics_metrics_update', {
            socketType: TopicType.ADMIN,
            message: 'Analytics metrics updated',
            timestamp: new Date().toISOString(),
            metricsCount: Object.keys(data.metrics).length
          });
        }
      }
    } catch (err) {
      console.error('[Analytics WebSocket] Error processing message:', err);
      
      dispatchWebSocketEvent('error', {
        socketType: TopicType.ADMIN,
        message: 'Error processing analytics data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Connect to the unified WebSocket system
  const ws = useWebSocket();

  // Register message listener
  useEffect(() => {
    if (ws.registerListener) {
      const unregister = ws.registerListener('admin-analytics-hook', [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR], handleMessage);
      return unregister;
    }
  }, [ws, handleMessage]);

  // Subscribe to admin topic when connected
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    if (ws.isConnected && !isSubscribedRef.current) {
      // Subscribe to admin topic
      ws.subscribe([TopicType.ADMIN]);
      
      // Request initial analytics data
      ws.request(TopicType.ADMIN, 'GET_ANALYTICS', { timeframe });
      isSubscribedRef.current = true;
      
      dispatchWebSocketEvent('analytics_subscribe', {
        socketType: TopicType.ADMIN,
        message: 'Subscribing to admin analytics',
        timestamp: new Date().toISOString(),
        timeframe
      });
      
      // Set a timeout to reset loading state if we don't get data
      timeoutId = setTimeout(() => {
        console.warn('[Analytics WebSocket] Timed out waiting for data');
        setIsLoading(false);
      }, 10000);
    } else if (!ws.isConnected) {
      isSubscribedRef.current = false;
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [ws.isConnected, ws.subscribe, ws.request, timeframe]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        ws.unsubscribe([TopicType.ADMIN]);
        isSubscribedRef.current = false;
      }
    };
  }, [ws.unsubscribe]);

  // Effect to update data when timeframe changes
  useEffect(() => {
    if (ws.isConnected && !isLoading && analyticsData.timeframe !== timeframe) {
      setIsLoading(true);
      
      // Request analytics data for the new timeframe
      ws.request(TopicType.ADMIN, 'GET_ANALYTICS', { timeframe });
      
      dispatchWebSocketEvent('analytics_timeframe_change', {
        socketType: TopicType.ADMIN,
        message: `Changing analytics timeframe to ${timeframe}`,
        timestamp: new Date().toISOString(),
        previousTimeframe: analyticsData.timeframe,
        newTimeframe: timeframe
      });
    }
  }, [ws.isConnected, isLoading, ws.request, timeframe, analyticsData.timeframe]);

  // Force refresh analytics data
  const refreshAnalytics = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Analytics WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setIsLoading(true);
    
    // Request fresh data
    ws.request(TopicType.ADMIN, 'GET_ANALYTICS', { timeframe });
    
    dispatchWebSocketEvent('analytics_refresh', {
      socketType: TopicType.ADMIN,
      message: 'Refreshing admin analytics data',
      timestamp: new Date().toISOString(),
      timeframe
    });
    
    // Set a timeout to reset loading state if we don't get data
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);
  }, [ws.isConnected, ws.request, timeframe, isLoading]);

  // Calculate growth percentages compared to previous periods
  const getGrowthRates = useCallback(() => {
    const { users, contests, revenue } = analyticsData;
    
    return {
      users: {
        daily: users.newToday > 0 ? (users.newToday / (users.total - users.newToday)) * 100 : 0,
        weekly: users.newThisWeek > 0 ? (users.newThisWeek / (users.total - users.newThisWeek)) * 100 : 0
      },
      contests: {
        daily: contests.creationRate.daily,
        weekly: contests.creationRate.weekly,
        monthly: contests.creationRate.monthly
      },
      revenue: {
        daily: revenue.growth.daily,
        weekly: revenue.growth.weekly,
        monthly: revenue.growth.monthly
      }
    };
  }, [analyticsData]);

  // Return analytics data and helper functions
  return {
    data: analyticsData,
    users: analyticsData.users,
    contests: analyticsData.contests,
    tokens: analyticsData.tokens,
    system: analyticsData.system,
    revenue: analyticsData.revenue,
    timeframe,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.connectionError,
    lastUpdate,
    refreshAnalytics,
    getGrowthRates,
    
    // Helper functions
    getUserMetric: useCallback((metricPath: string): number => {
      const parts = metricPath.split('.');
      let result: any = analyticsData.users;
      
      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return 0;
        }
      }
      
      return typeof result === 'number' ? result : 0;
    }, [analyticsData.users]),
    
    getSystemMetric: useCallback((metricPath: string): number => {
      const parts = metricPath.split('.');
      let result: any = analyticsData.system;
      
      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return 0;
        }
      }
      
      return typeof result === 'number' ? result : 0;
    }, [analyticsData.system])
  };
}