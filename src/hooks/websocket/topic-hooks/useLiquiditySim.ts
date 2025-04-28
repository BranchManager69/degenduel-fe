// src/hooks/websocket/topic-hooks/useLiquiditySim.ts

/**
 * Use Liquidity Simulation Hook
 * 
 * This hook provides real-time updates from the token liquidation simulation service.
 * ADMIN ACCESS ONLY: This hook connects to a restricted topic that requires admin authentication.
 */

import { useCallback, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { MessageType, SOCKET_TYPES } from '../types';
import useWebSocketTopic from '../useWebSocketTopic';
import { admin } from '../../../services/api';

// Acquisition levels for simulation
export type AcquisitionLevel = 'low' | 'medium' | 'high';

// Scenario types
export type ScenarioType = 'baseCase' | 'bullCase' | 'bearCase';

// Token info for simulation
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  baseReserve: number;
  quoteReserve: number;
  totalSupply?: number;
}

// Simulation parameters interface
export interface SimulationParams {
  totalSupply: number;
  currentPrice: number;
  baseReserve: number;
  quoteReserve: number;
  acquisitionLevel: AcquisitionLevel;
  personalRatio: number;
  days: number;
  scenarioType: ScenarioType;
}

// Grid simulation parameters
export interface GridSimulationParams {
  totalSupply: number;
  currentPrice: number;
  baseReserve: number;
  quoteReserve: number;
  acquisitionLevels: AcquisitionLevel[];
  scenarios: ScenarioType[];
}

// Simulation data point
export interface SimulationDataPoint {
  day: number;
  price: number;
  tokensSold: number;
  priceImpact: number;
  marketCap: number;
  proceeds: number;
  avgPrice: number;
  totalSold: number;
  remainingTokens: number;
}

// Result from a simulation
export interface SimulationResult {
  summary: {
    totalProceeds: number;
    averageSellPrice: number;
    totalTokensSold: number;
    percentOfSupply: number;
    finalPrice: number;
    priceImpact: number;
  };
  timeline: SimulationDataPoint[];
}

// For grid simulations
export interface GridResult {
  [key: string]: {
    [key: string]: SimulationResult;
  };
}

// WebSocket response structure
export interface LiquiditySimResponse {
  params: SimulationParams | GridSimulationParams;
  results: SimulationResult | GridResult;
  fromCache: boolean;
  timestamp: string;
}

/**
 * Hook for interacting with the Liquidity Simulation service
 * 
 * @returns Functions and state for token liquidation simulations
 */
// Additional interfaces for saving and report generation
export interface SavedSimulation {
  id: string;
  name: string;
  description?: string;
  tokenInfo: TokenInfo;
  params: SimulationParams | GridSimulationParams;
  results: SimulationResult | GridResult;
  tags?: string[];
  createdAt: string;
  createdBy: string;
}

export interface SaveSimulationParams {
  name: string;
  description?: string;
  tags?: string[];
}

export interface SimulationReport {
  id: string;
  url: string;
  type: 'detailed' | 'summary' | 'comparative';
  title: string;
  createdAt: string;
}

export interface GenerateReportParams {
  reportType: 'detailed' | 'summary' | 'comparative';
  title?: string;
  includeCharts?: boolean;
}

export function useLiquiditySim() {
  // State for simulation results
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<LiquiditySimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for saved simulations and reports
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingSimulation, setSavingSimulation] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Get user auth from store
  const { user } = useStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Fetch saved simulations implementation
  const fetchSavedSimulations = useCallback(async (filters?: {
    tokenAddress?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    try {
      setLoadingSaved(true);
      
      const result = await admin.tokenLiquidation.getSavedSimulations(filters);
      
      if (result && result.simulations) {
        setSavedSimulations(result.simulations);
      }
      
      setLoadingSaved(false);
      return result;
    } catch (err) {
      setLoadingSaved(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch saved simulations');
    }
  }, [isAdmin]);
  
  // Create a message handler for WebSocket responses
  const handleMessage = useCallback((data: any) => {
    if (data.action === 'update' && data.data) {
      setSimulationResults(data.data);
      setSimulating(false);
      setError(null);
    } else if (data.action === 'error') {
      setError(data.error || 'An error occurred with the simulation');
      setSimulating(false);
    } else if (data.action === 'saved') {
      // Handle saved simulation confirmation
      setSavingSimulation(false);
      // Refresh saved simulations list
      fetchSavedSimulations();
    } else if (data.action === 'report' && data.url) {
      // Handle report generation completion
      setGeneratingReport(false);
      setReportUrl(data.url);
    }
  }, [fetchSavedSimulations]);

  // Connect to the WebSocket topic - requires admin authentication
  const ws = useWebSocketTopic(
    SOCKET_TYPES.LIQUIDITY_SIM,
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    { 
      autoSubscribe: isAdmin
      // Note: Authentication is handled by the WebSocket context
      // and applied automatically when required
    }
  );

  // Run a simulation with the given parameters
  const runSimulation = useCallback((params: SimulationParams) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    if (!ws.isConnected) {
      setError('WebSocket connection not available');
      return;
    }

    setSimulating(true);
    setError(null);
    ws.request('simulate', params);
  }, [ws, isAdmin]);

  // Run a grid simulation with multiple parameters
  const runGridSimulation = useCallback((params: GridSimulationParams) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    if (!ws.isConnected) {
      setError('WebSocket connection not available');
      return;
    }

    setSimulating(true);
    setError(null);
    ws.request('simulateGrid', params);
  }, [ws, isAdmin]);

  // Get token info 
  const getTokenInfo = useCallback((tokenAddress: string) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    if (!ws.isConnected) {
      setError('WebSocket connection not available');
      return;
    }

    setSimulating(true); // Show loading state
    setError(null);
    ws.request('getTokenInfo', { tokenAddress });
  }, [ws, isAdmin]);
  
  // Save simulation to database
  const saveSimulation = useCallback(async (params: SaveSimulationParams) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    if (!simulationResults) {
      setError('No simulation results to save');
      return;
    }
    
    try {
      setSavingSimulation(true);
      
      // Use REST API instead of WebSocket for saving to get proper error handling
      const result = await admin.tokenLiquidation.saveSimulation({
        ...params,
        tokenInfo: 'tokenInfo' in simulationResults ? simulationResults.tokenInfo : null,
        params: simulationResults.params,
        results: simulationResults.results
      });
      
      setSavingSimulation(false);
      // Refresh saved simulations list
      fetchSavedSimulations();
      
      return result;
    } catch (err) {
      setSavingSimulation(false);
      setError(err instanceof Error ? err.message : 'Failed to save simulation');
    }
  }, [isAdmin, simulationResults, fetchSavedSimulations]);
  
  // Load a specific saved simulation
  const loadSavedSimulation = useCallback(async (id: string) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    try {
      setSimulating(true);
      
      const result = await admin.tokenLiquidation.getSavedSimulation(id);
      
      if (result && result.success) {
        setSimulationResults(result.data);
      }
      
      setSimulating(false);
      return result;
    } catch (err) {
      setSimulating(false);
      setError(err instanceof Error ? err.message : 'Failed to load saved simulation');
    }
  }, [isAdmin]);
  
  // Delete a saved simulation
  const deleteSavedSimulation = useCallback(async (id: string) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    try {
      const result = await admin.tokenLiquidation.deleteSavedSimulation(id);
      
      // Refresh saved simulations list
      fetchSavedSimulations();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete saved simulation');
    }
  }, [isAdmin, fetchSavedSimulations]);
  
  // Generate a report from the current simulation
  const generateReport = useCallback(async (params: GenerateReportParams) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    if (!simulationResults) {
      setError('No simulation results for report generation');
      return;
    }
    
    try {
      setGeneratingReport(true);
      setReportUrl(null);
      
      const result = await admin.tokenLiquidation.generateReport({
        ...params,
        simulationData: simulationResults
      });
      
      if (result && result.success && result.url) {
        setReportUrl(result.url);
      }
      
      setGeneratingReport(false);
      return result;
    } catch (err) {
      setGeneratingReport(false);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  }, [isAdmin, simulationResults]);
  
  // Generate a report from a saved simulation by ID
  const generateReportFromSaved = useCallback(async (id: string, params: GenerateReportParams) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    
    try {
      setGeneratingReport(true);
      setReportUrl(null);
      
      const result = await admin.tokenLiquidation.generateReport({
        ...params,
        simulationId: id
      });
      
      if (result && result.success && result.url) {
        setReportUrl(result.url);
      }
      
      setGeneratingReport(false);
      return result;
    } catch (err) {
      setGeneratingReport(false);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  }, [isAdmin]);

  return {
    // State
    simulating,
    simulationResults,
    error,
    isConnected: ws.isConnected,
    connectionState: ws.connectionState,
    isAdmin, // Expose admin status
    savedSimulations,
    loadingSaved,
    savingSimulation,
    generatingReport,
    reportUrl,
    
    // Simulation actions
    runSimulation,
    runGridSimulation,
    getTokenInfo,
    
    // Persistence actions
    saveSimulation,
    fetchSavedSimulations,
    loadSavedSimulation,
    deleteSavedSimulation,
    
    // Report actions  
    generateReport,
    generateReportFromSaved
  };
}

export default useLiquiditySim;