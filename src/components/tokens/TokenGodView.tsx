import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { ddApi } from '../../services/dd-api';
import { Scatter, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  BarElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Unified dot classification used by both coloring and bounding box
// Types kept broad here so this helper is available to the chart plugin as well.
const classifyTokenForDot = (token: any): 'red' | 'amber' | 'green' => {
  const volume = token?.volume_24h || 0;
  const marketCap = token?.market_cap || 0;
  if (volume < 100000 || marketCap < 100000) return 'red';
  if (volume > 500000 && marketCap > 500000) return 'green';
  return 'amber';
};

const activeBoundsPlugin = {
  id: 'activeBounds',
  afterDatasetsDraw(chart: any, _args: any, opts: any) {
    if (!opts || !opts.enabled) return;
    const ds = chart?.data?.datasets?.[0];
    if (!ds || !Array.isArray(ds.data) || ds.data.length === 0) return;
    const xScale = chart.scales?.x;
    const yScale = chart.scales?.y;
    const area = chart.chartArea;
    if (!xScale || !yScale || !area) return;

    // Collect green points with pixel positions, tokens, and axis data values
    type GP = { px: number; py: number; token: any; xv: number; yv: number };
    const greens: GP[] = [];
    const xIsLog = xScale.type === 'logarithmic';
    const yIsLog = yScale.type === 'logarithmic';

    for (let i = 0; i < ds.data.length; i++) {
      const p = ds.data[i];
      const token = p?.token || p?.parsed?.token;
      if (!token) continue;
      const cls = classifyTokenForDot(token);
      if (cls !== 'green') continue;
      const xv = p.x ?? p?.parsed?.x;
      const yv = p.y ?? p?.parsed?.y;
      if (typeof xv !== 'number' || typeof yv !== 'number') continue;
      if ((xIsLog && xv <= 0) || (yIsLog && yv <= 0)) continue;
      const px = xScale.getPixelForValue(xv);
      const py = yScale.getPixelForValue(yv);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      greens.push({ px, py, token, xv, yv });
    }

    if (greens.length === 0) return;

    // Find extremes
    let left = greens[0], right = greens[0], top = greens[0], bottom = greens[0];
    for (const g of greens) {
      if (g.px < left.px) left = g;
      if (g.px > right.px) right = g;
      if (g.py < top.py) top = g;      // smaller y is higher
      if (g.py > bottom.py) bottom = g; // larger y is lower
    }

    // Rectangle bounds in pixels
    let minX = left.px, maxX = right.px, minY = top.py, maxY = bottom.py;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const pad = 2;
    minX = clamp(minX, area.left + pad, area.right - pad);
    maxX = clamp(maxX, area.left + pad, area.right - pad);
    minY = clamp(minY, area.top + pad, area.bottom - pad);
    maxY = clamp(maxY, area.top + pad, area.bottom - pad);

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = opts.color || 'rgba(34, 197, 94, 0.9)';
    ctx.lineWidth = opts.lineWidth || 1;
    ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);

    // Labels: on edges (deduplicated). X-edges show X extreme, Y-edges show Y extreme.
    const fmt = (n: number) => {
      if (!n || !isFinite(n)) return '0';
      if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
      if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
      if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
      return n.toFixed(0);
    };
    // Compute axis extremes directly from green points' data values
    const axisX = opts.axisX;
    const axisY = opts.axisY;
    const xMinVal = Math.min(...greens.map(g => g.xv));
    const xMaxVal = Math.max(...greens.map(g => g.xv));
    const yMinVal = Math.min(...greens.map(g => g.yv));
    const yMaxVal = Math.max(...greens.map(g => g.yv));
    // Map labels (prefer MC/Vol naming when applicable)
    const xLabel = axisX === 'volume_24h' ? 'Vol $' : axisX === 'market_cap' ? 'MC $' : `${axisX}: `;
    const yLabel = axisY === 'volume_24h' ? 'Vol $' : axisY === 'market_cap' ? 'MC $' : `${axisY}: `;
    ctx.fillStyle = opts.color || 'rgba(34, 197, 94, 0.9)';
    ctx.font = '8px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

    // Top edge label (Y max)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${yLabel}${fmt(yMaxVal)}`, (minX + maxX) / 2, minY - 3);
    // Bottom edge label (Y min)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${yLabel}${fmt(yMinVal)}`, (minX + maxX) / 2, maxY + 3);
    // Left edge label (X min) - vertical
    ctx.save();
    ctx.translate(minX - 3, (minY + maxY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${xLabel}${fmt(xMinVal)}`, 0, 0);
    ctx.restore();
    // Right edge label (X max) - vertical
    ctx.save();
    ctx.translate(maxX + 3, (minY + maxY) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${xLabel}${fmt(xMaxVal)}`, 0, 0);
    ctx.restore();

    // Per-green-dot symbol label above each green point
    ctx.fillStyle = 'rgba(229, 231, 235, 0.9)'; // light gray for visibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (const g of greens) {
      const sym = g.token?.symbol || '';
      if (!sym) continue;
      ctx.fillText(String(sym), g.px, g.py - 4);
    }

    ctx.restore();
  }
};

ChartJS.register(activeBoundsPlugin as any);

// Token interface based on the API response
interface Token {
  id: number;
  address: string;
  symbol: string;
  name: string;
  image_url?: string;
  header_image_url?: string;
  color?: string;
  decimals: number;
  description?: string;
  priority_score?: number;
  degenduel_score?: string;
  is_active?: boolean;
  manually_activated?: boolean;
  metadata_status?: string;
  price?: number;
  change_24h?: number;
  market_cap?: number;
  volume_24h?: number;
  // Real liquidity from API (total pool liquidity across relevant pools)
  liquidity?: number;
  priceChanges?: {
    h1?: number;
    h6?: number;
    m5?: number;
    h24?: number;
  };
  socials?: {
    twitter?: string;
    telegram?: string;
  };
  websites?: Array<{
    label?: string;
    url: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Helper function to get default dates
const getDefaultDates = () => {
  const today = new Date();
  const todayPlus2 = new Date(today);
  todayPlus2.setDate(today.getDate() + 2);
  
  return {
    fromDate: '2025-01-01',
    toDate: todayPlus2.toISOString().split('T')[0]
  };
};

export const TokenGodView: React.FC = () => {
  // Token management state
  const [activeTab, setActiveTab] = useState<'managed' | 'search' | 'candidates'>('candidates');
  const [managedTokens, setManagedTokens] = useState<Token[]>([]);
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [candidateTokens, setCandidateTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingManaged, setIsLoadingManaged] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'first_seen'>('first_seen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [candidateSortBy, setCandidateSortBy] = useState<'market_cap' | 'volume_24h' | 'first_seen' | 'pair_created_at'>('first_seen');
  const [candidateSortOrder, setCandidateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [managedTokensTotal, setManagedTokensTotal] = useState(0);
  const [candidatesTotal, setCandidatesTotal] = useState(0);
  const [candidatesPage, setCandidatesPage] = useState(0);
  const [candidatesPerPage] = useState(50); // Increased from 20 to 50 for more data
  const [managedPage, setManagedPage] = useState(0);
  const [managedPerPage] = useState(50);
  
  // Managed tokens filter states
  const [managedFilters, setManagedFilters] = useState(() => {
    const defaultDates = getDefaultDates();
    return {
      minMarketCap: '50,000',
      maxMarketCap: '100,000,000',
      minVolume: '100,000',
      maxVolume: '1,000,000,000',
      minLiquidity: '10,000',
      maxLiquidity: '10,000,000',
      dateFrom: defaultDates.fromDate,
      dateTo: defaultDates.toDate,
      useFilters: true
    };
  });
  const [managedFiltersExpanded, setManagedFiltersExpanded] = useState(true);

  // Candidates filter states
  const [filters, setFilters] = useState(() => {
    const defaultDates = getDefaultDates();
    return {
      minMarketCap: '50,000',
      maxMarketCap: '100,000,000',
      minVolume: '100,000',
      maxVolume: '1,000,000,000',
      minLiquidity: '10,000',
      maxLiquidity: '10,000,000',
      dateFrom: defaultDates.fromDate,
      dateTo: defaultDates.toDate,
      useFilters: true
    };
  });
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  
  // Client-side sorting for filtered results
  const [clientSortBy, setClientSortBy] = useState<'volume' | 'market_cap' | 'newest'>('volume');
  const [managedClientSortBy, setManagedClientSortBy] = useState<'volume' | 'market_cap' | 'newest'>('volume');
  
  // Chart state
  const [chartXAxis, setChartXAxis] = useState<'market_cap' | 'volume_24h' | 'liquidity' | 'recency'>('market_cap');
  const [chartYAxis, setChartYAxis] = useState<'market_cap' | 'volume_24h' | 'liquidity' | 'recency'>('volume_24h');
  const [chartExpanded, setChartExpanded] = useState(true);
  const [xAxisScale, setXAxisScale] = useState<'linear' | 'logarithmic'>('linear');
  const [yAxisScale, setYAxisScale] = useState<'linear' | 'logarithmic'>('linear');
  const [showActiveBounds, setShowActiveBounds] = useState(true);
  
  // Distribution visualization state
  const [distributionExpanded, setDistributionExpanded] = useState<{
    [key: string]: boolean;
  }>({});
  const [percentileData, setPercentileData] = useState<{
    candidates: any;
    managed: any;
  }>({ candidates: null, managed: null });
  
  // Smart slider bounds
  const [sliderBounds, setSliderBounds] = useState({
    candidates: {
      marketCap: { min: 50000, max: 100000000 },
      volume: { min: 100000, max: 10000000 },
      liquidity: { min: 10000, max: 10000000 },
      dates: { min: '2025-01-01', max: new Date().toISOString().split('T')[0] }
    },
    managed: {
      marketCap: { min: 50000, max: 100000000 },
      volume: { min: 100000, max: 10000000 },
      liquidity: { min: 10000, max: 10000000 },
      dates: { min: '2025-01-01', max: new Date().toISOString().split('T')[0] }
    }
  });

  // Helper function to sort tokens client-side
  const sortTokensClientSide = (tokens: Token[], useFilters: boolean, sortBy: string) => {
    if (!useFilters) return tokens; // Only sort when filters are active
    
    return [...tokens].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return (b.volume_24h || 0) - (a.volume_24h || 0);
        case 'market_cap':
          return (b.market_cap || 0) - (a.market_cap || 0);
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });
  };

  // Helper function to format number with commas
  const formatNumberInput = (value: string): string => {
    // Remove all non-digits
    const numericValue = value.replace(/[^\d]/g, '');
    // Add commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to get numeric value (remove commas for API)
  const getNumericValue = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Fetch smart bounds for sliders
  const fetchSmartBounds = useCallback(async () => {
    try {
      // Get percentile data for better bounds
      const [candidatesResponse, managedResponse] = await Promise.all([
        ddApi.fetch('/admin/token-activation/candidates?limit=1'),
        ddApi.fetch('/admin/token-activation/active-tokens?limit=1')
      ]);

      if (candidatesResponse.ok && managedResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        const managedData = await managedResponse.json();
        
        const candidatesPercentiles = candidatesData.data.percentiles;
        const managedPercentiles = managedData.data.percentiles;
        
        // Use percentiles to set sensible bounds (5th to 95th percentile)
        const calculateBoundsFromPercentiles = (percentiles: any) => {
          return {
            marketCap: {
              min: percentiles.market_cap?.[5] || 50000,
              max: percentiles.market_cap?.[95] || 100000000
            },
            volume: {
              min: percentiles.volume_24h?.[5] || 100,
              max: percentiles.volume_24h?.[99] || 10000000
            },
            liquidity: {
              min: percentiles.liquidity?.[5] || 10000,
              max: percentiles.liquidity?.[95] || 10000000
            },
            dates: {
              min: '2025-01-01',
              max: new Date().toISOString().split('T')[0]
            }
          };
        };

        setSliderBounds({
          candidates: calculateBoundsFromPercentiles(candidatesPercentiles),
          managed: calculateBoundsFromPercentiles(managedPercentiles)
        });

        // Store percentile data for distribution visualization
        setPercentileData({
          candidates: candidatesPercentiles,
          managed: managedPercentiles
        });

        // Also update filter defaults based on percentiles (10th to 90th percentile)
        // Update default filter values to reasonable ranges
        setFilters(prev => ({
          ...prev,
          minMarketCap: formatNumberInput((candidatesPercentiles.market_cap?.[10] || 50000).toString()),
          maxMarketCap: formatNumberInput((candidatesPercentiles.market_cap?.[85] || 50000000).toString()),
          minVolume: formatNumberInput((candidatesPercentiles.volume_24h?.[10] || 100).toString()),
          maxVolume: formatNumberInput((candidatesPercentiles.volume_24h?.[99] || 5000000).toString()),
          minLiquidity: formatNumberInput((candidatesPercentiles.liquidity?.[10] || 10000).toString()),
          maxLiquidity: formatNumberInput((candidatesPercentiles.liquidity?.[90] || 5000000).toString()),
        }));
        
        setManagedFilters(prev => ({
          ...prev,
          minMarketCap: formatNumberInput((managedPercentiles.market_cap?.[10] || 50000).toString()),
          maxMarketCap: formatNumberInput((managedPercentiles.market_cap?.[85] || 50000000).toString()),
          minVolume: formatNumberInput((managedPercentiles.volume_24h?.[10] || 100).toString()),
          maxVolume: formatNumberInput((managedPercentiles.volume_24h?.[99] || 5000000).toString()),
          minLiquidity: formatNumberInput((managedPercentiles.liquidity?.[10] || 10000).toString()),
          maxLiquidity: formatNumberInput((managedPercentiles.liquidity?.[90] || 5000000).toString()),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch smart bounds:', error);
    }
  }, []);

  // Helper functions for logarithmic scaling
  const toLogScale = (value: number, min: number, max: number): number => {
    const logMin = Math.log10(Math.max(min, 1));
    const logMax = Math.log10(max);
    const logValue = Math.log10(Math.max(value, 1));
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  };

  const fromLogScale = (percent: number, min: number, max: number): number => {
    const logMin = Math.log10(Math.max(min, 1));
    const logMax = Math.log10(max);
    const logValue = logMin + (percent / 100) * (logMax - logMin);
    return Math.round(Math.pow(10, logValue));
  };

  // Chart metric options
  const chartMetricOptions = [
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'volume_24h', label: '24h Volume' },
    { value: 'liquidity', label: 'Liquidity' },
    { value: 'recency', label: 'Recency (Hours)' }
  ] as const;

  // classification moved to module scope for plugin access

  // Helper function to get metric value from token
  const getMetricValue = (token: Token, metric: 'market_cap' | 'volume_24h' | 'liquidity' | 'recency'): number => {
    switch (metric) {
      case 'market_cap':
        return token.market_cap || 0;
      case 'volume_24h':
        return token.volume_24h || 0;
      case 'liquidity':
        // Use real liquidity from API only
        return token.liquidity || 0;
      case 'recency':
        if (!token.created_at) return 0;
        const hoursSinceCreation = Math.floor((Date.now() - new Date(token.created_at).getTime()) / (1000 * 60 * 60));
        return Math.max(1, hoursSinceCreation); // Minimum 1 hour
      default:
        return 0;
    }
  };

  // Helper function to format metric labels
  const formatMetricLabel = (value: number, metric: 'market_cap' | 'volume_24h' | 'liquidity' | 'recency'): string => {
    switch (metric) {
      case 'recency':
        return `${value}h`;
      case 'market_cap':
      case 'volume_24h':
      case 'liquidity':
        return `$${formatNumber(value)}`;
      default:
        return formatNumber(value);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    const currentTokens = activeTab === 'candidates' ? candidateTokens : managedTokens;
    const filteredTokens = activeTab === 'candidates' 
      ? sortTokensClientSide(currentTokens, filters.useFilters, clientSortBy)
      : sortTokensClientSide(currentTokens, managedFilters.useFilters, managedClientSortBy);

    const chartData = filteredTokens
      .filter(token => {
        const xValue = getMetricValue(token, chartXAxis);
        const yValue = getMetricValue(token, chartYAxis);
        return xValue > 0 && yValue > 0; // Only include tokens with valid data for both axes
      })
      .map(token => ({
        x: getMetricValue(token, chartXAxis),
        y: getMetricValue(token, chartYAxis),
        token
      }));

    return {
      datasets: [
        {
          label: activeTab === 'candidates' ? 'Discovery Zone Tokens' : 'Active Tokens',
          data: chartData,
          backgroundColor: (context: any) => {
            const token = context.parsed?.token || chartData[context.dataIndex]?.token;
            if (!token) return 'rgba(99, 102, 241, 0.6)';
            const cls = classifyTokenForDot(token);
            if (cls === 'red') return 'rgba(239, 68, 68, 0.8)';
            if (cls === 'green') return 'rgba(16, 255, 0, 0.8)';
            return 'rgba(255, 193, 7, 0.8)';
          },
          borderColor: (context: any) => {
            const token = context.parsed?.token || chartData[context.dataIndex]?.token;
            if (!token) return 'rgba(99, 102, 241, 1)';
            const cls = classifyTokenForDot(token);
            if (cls === 'red') return 'rgba(239, 68, 68, 1)';
            if (cls === 'green') return 'rgba(16, 255, 0, 1)';
            return 'rgba(255, 193, 7, 1)';
          },
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  // Chart options
  const getChartOptions = () => {
    const xAxisIsRecency = chartXAxis === 'recency';
    const yAxisIsRecency = chartYAxis === 'recency';
    
    // Get current filter values
    const currentFilters = activeTab === 'candidates' ? filters : managedFilters;
    
    // Calculate axis bounds based on filter settings and metric type
    const getAxisBounds = (metric: string) => {
      if (!currentFilters.useFilters) return {};
      
      switch (metric) {
        case 'market_cap':
          return {
            min: parseFloat(getNumericValue(currentFilters.minMarketCap)),
            max: parseFloat(getNumericValue(currentFilters.maxMarketCap))
          };
        case 'volume_24h':
          return {
            min: parseFloat(getNumericValue(currentFilters.minVolume)),
            max: parseFloat(getNumericValue(currentFilters.maxVolume))
          };
        case 'liquidity':
          return {
            min: parseFloat(getNumericValue(currentFilters.minLiquidity)),
            max: parseFloat(getNumericValue(currentFilters.maxLiquidity))
          };
        case 'recency':
          // For recency, use a reasonable range based on data (0 to ~2000 hours ago)
          return {
            min: 0,
            max: 2000
          };
        default:
          return {};
      }
    };
    
    const xAxisBounds = getAxisBounds(chartXAxis);
    const yAxisBounds = getAxisBounds(chartYAxis);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        activeBounds: {
          enabled: showActiveBounds,
          color: 'rgba(34, 197, 94, 0.9)',
          lineWidth: 1,
          axisX: chartXAxis,
          axisY: chartYAxis,
        },
        legend: {
          display: true,
          labels: {
            color: '#D1D5DB',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#D1D5DB',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            title: (context: any) => {
              const point = context[0];
              const token = point.raw.token;
              return `${token.symbol} (${token.name})`;
            },
            label: (context: any) => {
              const point = context;
              const token = point.raw.token;
              const xLabel = chartMetricOptions.find(m => m.value === chartXAxis)?.label || chartXAxis;
              const yLabel = chartMetricOptions.find(m => m.value === chartYAxis)?.label || chartYAxis;
              
              return [
                `${xLabel}: ${formatMetricLabel(point.parsed.x, chartXAxis)}`,
                `${yLabel}: ${formatMetricLabel(point.parsed.y, chartYAxis)}`,
                `Price: $${token.price?.toFixed(6) || 'N/A'}`,
                `Status: ${token.is_active ? 'Active' : 'Candidate'}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: xAxisIsRecency ? 'linear' : xAxisScale,
          reverse: xAxisIsRecency, // Reverse X-axis when showing recency (newer on left)
          display: true,
          title: {
            display: true,
            text: xAxisIsRecency 
              ? 'Recency (Hours Ago - Newer ← → Older)'
              : (chartMetricOptions.find(m => m.value === chartXAxis)?.label || chartXAxis),
            color: '#D1D5DB',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value: any) {
              return formatMetricLabel(value, chartXAxis);
            }
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.3)'
          },
          ...xAxisBounds
        },
        y: {
          type: yAxisIsRecency ? 'linear' : yAxisScale,
          reverse: yAxisIsRecency, // Reverse Y-axis when showing recency (newer on top)
          display: true,
          title: {
            display: true,
            text: yAxisIsRecency 
              ? 'Recency (Hours Ago - Newer ↑ ↓ Older)'
              : (chartMetricOptions.find(m => m.value === chartYAxis)?.label || chartYAxis),
            color: '#D1D5DB',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value: any) {
              return formatMetricLabel(value, chartYAxis);
            }
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.3)'
          },
          ...yAxisBounds
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    };
  };

  // Distribution chart data preparation
  const getDistributionChartData = (metric: 'market_cap' | 'volume_24h' | 'liquidity' | 'recency', dataSource: 'candidates' | 'managed') => {
    // For recency, we need to calculate from actual token data since it's not in percentiles
    if (metric === 'recency') {
      const tokens = dataSource === 'candidates' ? candidateTokens : managedTokens;
      if (!tokens.length) return null;

      // Calculate recency for all tokens and create percentile-like distribution
      const recencyValues = tokens
        .map(token => getMetricValue(token, 'recency'))
        .filter(value => value > 0)
        .sort((a, b) => a - b);

      if (recencyValues.length === 0) return null;

      // Create 100 bins for distribution
      const labels = Array.from({ length: 100 }, (_, i) => `${i + 1}%`);
      const binSize = Math.ceil(recencyValues.length / 100);
      
      const frequencies = Array.from({ length: 100 }, (_, i) => {
        const startIdx = i * binSize;
        const endIdx = Math.min(startIdx + binSize, recencyValues.length);
        const binValues = recencyValues.slice(startIdx, endIdx);
        return binValues.length > 0 ? binValues[Math.floor(binValues.length / 2)] : 1;
      });

      return {
        labels,
        datasets: [
          {
            label: `${dataSource === 'candidates' ? 'Discovery Zone' : 'Active Tokens'} - Recency`,
            data: frequencies,
            backgroundColor: dataSource === 'candidates' 
              ? 'rgba(99, 102, 241, 0.6)' 
              : 'rgba(34, 197, 94, 0.6)',
            borderColor: dataSource === 'candidates' 
              ? 'rgba(99, 102, 241, 1)' 
              : 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          }
        ]
      };
    }

    const percentiles = percentileData[dataSource];
    if (!percentiles || !percentiles[metric]) return null;

    const metricPercentiles = percentiles[metric];
    const labels = Array.from({ length: 100 }, (_, i) => `${i + 1}%`);
    const values = Array.from({ length: 100 }, (_, i) => {
      const idx1 = String(i + 1);
      const idx0 = String(i);
      let v: any = undefined;
      if (Array.isArray(metricPercentiles)) v = metricPercentiles[i];
      else if (metricPercentiles && typeof metricPercentiles === 'object') v = metricPercentiles[idx1] ?? metricPercentiles[i] ?? metricPercentiles[idx0];
      return typeof v === 'number' ? v : 0;
    });

    // Use actual percentile values directly
    return {
      labels,
      datasets: [
        {
          label: `${dataSource === 'candidates' ? 'Discovery Zone' : 'Active Tokens'} - ${chartMetricOptions.find(m => m.value === metric)?.label}`,
          data: values,
          backgroundColor: dataSource === 'candidates' 
            ? 'rgba(99, 102, 241, 0.6)' 
            : 'rgba(34, 197, 94, 0.6)',
          borderColor: dataSource === 'candidates' 
            ? 'rgba(99, 102, 241, 1)' 
            : 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  // Distribution chart options
  const getDistributionChartOptions = (metric: 'market_cap' | 'volume_24h' | 'liquidity' | 'recency') => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#D1D5DB',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            title: (context: any) => `${context[0].label} Percentile`,
            label: (context: any) => {
              const value = context.raw;
              return `Value: ${formatMetricLabel(value, metric)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Percentile (1% → 100%)',
            color: '#D1D5DB',
            font: { size: 11 }
          },
          ticks: {
            color: '#9CA3AF',
            maxTicksLimit: 10
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.2)'
          }
        },
        y: {
          type: metric === 'recency' ? 'linear' : 'logarithmic',
          display: true,
          title: {
            display: true,
            text: 'Value',
            color: '#D1D5DB',
            font: { size: 11 }
          },
          ticks: {
            color: '#9CA3AF',
            callback: function(value: any) {
              return formatMetricLabel(value, metric);
            }
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.2)'
          }
        }
      }
    };
  };

  // Render individual metric distribution section
  const renderMetricDistribution = (metric: 'market_cap' | 'volume_24h' | 'liquidity' | 'recency', dataSource: 'candidates' | 'managed') => {
    const metricLabel = chartMetricOptions.find(m => m.value === metric)?.label || metric;
    const chartData = getDistributionChartData(metric, dataSource);
    const toggleKey = `${metric}_${dataSource}`;
    const isExpanded = distributionExpanded[toggleKey] !== false; // Default to true (expanded)
    
    if (!chartData) return null;

    const toggleDistribution = () => {
      setDistributionExpanded(prev => ({
        ...prev,
        [toggleKey]: !prev[toggleKey]
      }));
    };

    return (
      <div className="bg-gradient-to-r from-dark-300/20 to-dark-200/20 rounded-lg border border-dark-300/30 overflow-hidden">
        <button
          onClick={toggleDistribution}
          className="w-full p-2 flex items-center justify-between hover:bg-dark-300/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white">{metricLabel}</h4>
            <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
              Dist
            </div>
          </div>
          <div className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ↓
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-3 border-t border-dark-300/30">
            <div className="h-48">
              <Bar data={chartData} options={getDistributionChartOptions(metric) as any} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fetch active/managed tokens
  const fetchManagedTokens = useCallback(async () => {
    setIsLoadingManaged(true);
    try {
      const offset = managedPage * managedPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: managedFilters.useFilters ? '100' : managedPerPage.toString(), // Limit to 100 when filtering
        offset: managedFilters.useFilters ? '0' : offset.toString(), // Start from beginning when filtering
        sort: sortBy,
        order: sortOrder
      });
      
      // Add filter parameters if enabled
      if (managedFilters.useFilters) {
        if (managedFilters.minMarketCap) params.append('min_market_cap', getNumericValue(managedFilters.minMarketCap));
        if (managedFilters.maxMarketCap) params.append('max_market_cap', getNumericValue(managedFilters.maxMarketCap));
        if (managedFilters.minVolume) params.append('min_volume_24h', getNumericValue(managedFilters.minVolume));
        if (managedFilters.maxVolume) params.append('max_volume_24h', getNumericValue(managedFilters.maxVolume));
        if (managedFilters.minLiquidity) params.append('min_liquidity', getNumericValue(managedFilters.minLiquidity));
        if (managedFilters.maxLiquidity) params.append('max_liquidity', getNumericValue(managedFilters.maxLiquidity));
        if (managedFilters.dateFrom) params.append('date_from', managedFilters.dateFrom);
        if (managedFilters.dateTo) params.append('date_to', managedFilters.dateTo);
      }
      
      const response = await ddApi.fetch(`/admin/token-activation/active-tokens?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setManagedTokens(data.data.tokens || []);
        setManagedTokensTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch managed tokens:', error);
    } finally {
      setIsLoadingManaged(false);
    }
  }, [sortBy, sortOrder, managedPage, managedPerPage, managedFilters]);

  // Fetch candidate tokens
  const fetchCandidateTokens = useCallback(async () => {
    setIsLoadingCandidates(true);
    try {
      const offset = candidatesPage * candidatesPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: filters.useFilters ? '100' : candidatesPerPage.toString(), // Limit to 100 when filtering
        offset: filters.useFilters ? '0' : offset.toString(), // Start from beginning when filtering
        sort: candidateSortBy,
        order: candidateSortOrder
      });
      
      // Add filter parameters if enabled
      if (filters.useFilters) {
        if (filters.minMarketCap) params.append('min_market_cap', getNumericValue(filters.minMarketCap));
        if (filters.maxMarketCap) params.append('max_market_cap', getNumericValue(filters.maxMarketCap));
        if (filters.minVolume) params.append('min_volume_24h', getNumericValue(filters.minVolume));
        if (filters.maxVolume) params.append('max_volume_24h', getNumericValue(filters.maxVolume));
        if (filters.minLiquidity) params.append('min_liquidity', getNumericValue(filters.minLiquidity));
        if (filters.maxLiquidity) params.append('max_liquidity', getNumericValue(filters.maxLiquidity));
        if (filters.dateFrom) params.append('date_from', filters.dateFrom);
        if (filters.dateTo) params.append('date_to', filters.dateTo);
      }
      
      const response = await ddApi.fetch(`/admin/token-activation/candidates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCandidateTokens(data.data.tokens || []);
        setCandidatesTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch candidate tokens:', error);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [candidateSortBy, candidateSortOrder, candidatesPage, candidatesPerPage, filters]);

  // Search tokens
  const searchTokens = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await ddApi.fetch(`/tokens/search?search=${encodeURIComponent(query)}&limit=50&include_inactive=true`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tokens || []);
      }
    } catch (error) {
      console.error('Failed to search tokens:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    // Load candidates count for the tab badge
    const loadCounts = async () => {
      try {
        // Get managed tokens count
        const managedResponse = await ddApi.fetch(`/admin/token-activation/active-tokens?limit=1`);
        if (managedResponse.ok) {
          const managedData = await managedResponse.json();
          setManagedTokensTotal(managedData.data.pagination.total || 0);
        }

        // Get candidates count
        const candidatesResponse = await ddApi.fetch(`/admin/token-activation/candidates?limit=1`);
        if (candidatesResponse.ok) {
          const candidatesData = await candidatesResponse.json();
          setCandidatesTotal(candidatesData.data.pagination.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    };
    
    loadCounts();
    // Fetch smart bounds for sliders
    fetchSmartBounds();
    // Load candidates by default since that's the default tab
    fetchCandidateTokens();
  }, [fetchSmartBounds]);

  // Load data when tabs change
  useEffect(() => {
    if (activeTab === 'managed') {
      fetchManagedTokens();
    } else if (activeTab === 'candidates') {
      fetchCandidateTokens();
    }
  }, [activeTab, fetchManagedTokens, fetchCandidateTokens]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        searchTokens(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, searchTokens]);

  // Helper function to format numbers
  const formatNumber = (num: number | undefined): string => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  // Helper function to format percentage
  const formatPercentage = (num: number | undefined): string => {
    if (!num) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    
    const parts = [];
    
    if (weeks > 0) {
      parts.push(`${weeks}w`);
    }
    if (days > 0 && weeks < 4) { // Only show days if less than 4 weeks
      parts.push(`${days % 7}d`);
    }
    if (hours > 0 && days < 7) { // Only show hours if less than 7 days
      parts.push(`${hours % 24}h`);
    }
    if (minutes > 0 && hours < 24) { // Only show minutes if less than 24 hours
      parts.push(`${minutes % 60}m`);
    }
    
    if (parts.length === 0) {
      return 'just now';
    }
    
    return parts.join(', ') + ' ago';
  };

  // State for copy feedback
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Render token card component - simplified without selection
  const TokenCard: React.FC<{ token: Token }> = ({ token }) => {
    const isActive = token.is_active ?? false;
    const isCopied = copiedAddress === token.address;
    
    const handleCopyAddress = async () => {
      try {
        await navigator.clipboard.writeText(token.address);
        setCopiedAddress(token.address);
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    };
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-dark-300/50 border border-dark-300/50 hover:border-dark-300/70 rounded-lg p-3 transition-all duration-300 overflow-hidden"
      >
        {/* Header image background */}
        {token.header_image_url && (
          <div className="absolute inset-0 opacity-25">
            <img 
              src={token.header_image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/70 via-dark-300/40 to-dark-300/70" />
          </div>
        )}
        
        {/* Content overlay */}
        <div className="relative z-10 flex items-start gap-3">
          {/* Token image */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-400/50 flex-shrink-0">
            {token.image_url ? (
              <img 
                src={token.image_url} 
                alt={token.symbol} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiM0Qjc2ODgiLz4KPGI+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNHB4Ij4/PC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                {token.symbol?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Token info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-bold text-white truncate">{token.symbol}</h3>
                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {isActive ? '✓' : '✗'}
                  </div>
                  {token.manually_activated && (
                    <div className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                      M
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{token.name}</p>
              </div>
              {token.price && (
                <div className="text-right ml-2">
                  <div className="text-xs font-mono text-white">${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(6)}</div>
                  {token.change_24h !== undefined && (
                    <div className={`text-xs font-mono ${
                      token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercentage(token.change_24h)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact stats row */}
            <div className="flex items-center gap-3 text-xs mb-1">
              <div>
                <span className="text-gray-500">MC: </span>
                <span className="text-gray-300">${formatNumber(token.market_cap)}</span>
              </div>
              <div>
                <span className="text-gray-500">Vol: </span>
                <span className="text-gray-300">${formatNumber(token.volume_24h)}</span>
              </div>
              <div>
                <span className="text-gray-500">Liq: </span>
                <span className="text-gray-300">${formatNumber(token.liquidity || 0)}</span>
              </div>
              {token.created_at && (
                <div>
                  <span className="text-gray-500">Seen: </span>
                  <span className="text-gray-300">
                    {formatTimeAgo(token.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Address and Social Links */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleCopyAddress}
                className={`text-xs font-mono truncate flex-1 mr-2 text-left transition-all duration-300 cursor-pointer relative ${
                  isCopied 
                    ? 'text-green-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={isCopied ? "Copied!" : "Click to copy address"}
              >
                {isCopied && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -left-5 top-0 text-green-400"
                  >
                    ✓
                  </motion.span>
                )}
                {token.address}
              </button>
              
              {/* Social Media Icons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {token.socials?.twitter && (
                  <a
                    href={token.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Twitter/X"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {token.socials?.telegram && (
                  <a
                    href={token.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-blue-500 hover:text-blue-400 transition-colors"
                    title="Telegram"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                )}
                {token.websites && token.websites.length > 0 && (
                  <a
                    href={token.websites[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors"
                    title={token.websites[0].label || "Website"}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render tab navigation
  const renderTabs = () => (
    <div className="flex gap-2 mb-6">
      {[
        { id: 'candidates', label: 'Discovery Zone', icon: '🚀', count: candidatesTotal },
        { id: 'managed', label: 'Active Tokens', icon: '💎', count: managedTokensTotal },
        { id: 'search', label: 'Search', icon: '🔍' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-brand-500/20 to-cyber-500/20 text-brand-300'
              : 'bg-dark-300/30 border border-dark-300/30 text-gray-400 hover:border-brand-500/30'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-brand-500/30' : 'bg-dark-400/50'
            }`}>
              {tab.count.toLocaleString()}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Render managed tokens tab
  const renderManagedTokens = () => (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Active Tokens</h3>
          <p className="text-sm text-gray-400">
            {managedFilters.useFilters 
              ? `Showing top 100 filtered results from ${managedTokensTotal.toLocaleString()} active tokens`
              : `${managedTokensTotal.toLocaleString()} tokens currently on the platform`
            }
          </p>
        </div>
      </div>

      {/* Side-by-side layout: Filters on left, Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Smart Filters - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-dark-300/20 to-dark-200/20 rounded-lg border border-dark-300/30 overflow-hidden h-fit">
            <button
              onClick={() => setManagedFiltersExpanded(!managedFiltersExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-dark-300/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-white">Smart Filters</h4>
                <div className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  managedFilters.useFilters 
                    ? 'bg-brand-500/20 text-brand-300' 
                    : 'bg-dark-400/50 text-gray-400'
                }`}>
                  {managedFilters.useFilters ? 'Active' : 'Disabled'}
                </div>
              </div>
              <div className={`text-gray-400 transform transition-transform ${managedFiltersExpanded ? 'rotate-180' : ''}`}>
                ↓
              </div>
            </button>
            
            {managedFiltersExpanded && (
              <div className="p-4 border-t border-dark-300/30">
                {/* Filter content goes here - this should be the filter controls not chart */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">Configure filter parameters</span>
                  <button
                    onClick={() => {
                      setManagedFilters(prev => ({ ...prev, useFilters: !prev.useFilters }));
                      setManagedPage(0);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      managedFilters.useFilters 
                        ? 'bg-brand-500/20 text-brand-300' 
                        : 'bg-dark-400/50 text-gray-400 hover:bg-dark-400/70'
                    }`}
                  >
                    {managedFilters.useFilters ? 'Disable Filtering' : 'Enable Filtering'}
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  {/* Market Cap Range */}
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">Market Cap Range ($)</label>
                    <div className="px-3 py-2 bg-dark-400/30 rounded">
                      <Slider.Root
                        value={[
                          toLogScale(parseInt(getNumericValue(managedFilters.minMarketCap)), sliderBounds.managed.marketCap.min, sliderBounds.managed.marketCap.max),
                          toLogScale(parseInt(getNumericValue(managedFilters.maxMarketCap)), sliderBounds.managed.marketCap.min, sliderBounds.managed.marketCap.max)
                        ]}
                        onValueChange={(values) => {
                          const [minVal, maxVal] = values;
                          const minMarketCap = fromLogScale(minVal, sliderBounds.managed.marketCap.min, sliderBounds.managed.marketCap.max);
                          const maxMarketCap = fromLogScale(maxVal, sliderBounds.managed.marketCap.min, sliderBounds.managed.marketCap.max);
                          setManagedFilters(prev => ({
                            ...prev,
                            minMarketCap: formatNumberInput(minMarketCap.toString()),
                            maxMarketCap: formatNumberInput(maxMarketCap.toString())
                          }));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="relative flex items-center select-none touch-none w-full h-5"
                      >
                        <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                          <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                      </Slider.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Market Cap ($)</label>
                        <input
                          type="text"
                          value={managedFilters.minMarketCap}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, minMarketCap: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Market Cap ($)</label>
                        <input
                          type="text"
                          value={managedFilters.maxMarketCap}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, maxMarketCap: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Volume Range */}
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">Volume Range ($)</label>
                    <div className="px-3 py-2 bg-dark-400/30 rounded">
                      <Slider.Root
                        value={[
                          toLogScale(parseInt(getNumericValue(managedFilters.minVolume)), sliderBounds.managed.volume.min, sliderBounds.managed.volume.max),
                          toLogScale(parseInt(getNumericValue(managedFilters.maxVolume)), sliderBounds.managed.volume.min, sliderBounds.managed.volume.max)
                        ]}
                        onValueChange={(values) => {
                          const [minVal, maxVal] = values;
                          const minVolume = fromLogScale(minVal, sliderBounds.managed.volume.min, sliderBounds.managed.volume.max);
                          const maxVolume = fromLogScale(maxVal, sliderBounds.managed.volume.min, sliderBounds.managed.volume.max);
                          setManagedFilters(prev => ({
                            ...prev,
                            minVolume: formatNumberInput(minVolume.toString()),
                            maxVolume: formatNumberInput(maxVolume.toString())
                          }));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="relative flex items-center select-none touch-none w-full h-5"
                      >
                        <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                          <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                      </Slider.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Volume ($)</label>
                        <input
                          type="text"
                          value={managedFilters.minVolume}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, minVolume: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Volume ($)</label>
                        <input
                          type="text"
                          value={managedFilters.maxVolume}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, maxVolume: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Liquidity Range */}
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">Liquidity Range ($)</label>
                    <div className="px-3 py-2 bg-dark-400/30 rounded">
                      <Slider.Root
                        value={[
                          toLogScale(parseInt(getNumericValue(managedFilters.minLiquidity)), sliderBounds.managed.liquidity.min, sliderBounds.managed.liquidity.max),
                          toLogScale(parseInt(getNumericValue(managedFilters.maxLiquidity)), sliderBounds.managed.liquidity.min, sliderBounds.managed.liquidity.max)
                        ]}
                        onValueChange={(values) => {
                          const [minVal, maxVal] = values;
                          const currentBounds = sliderBounds.managed.liquidity;
                          const minLiquidity = fromLogScale(minVal, currentBounds.min, currentBounds.max);
                          const maxLiquidity = fromLogScale(maxVal, currentBounds.min, currentBounds.max);
                          setManagedFilters(prev => ({
                            ...prev,
                            minLiquidity: formatNumberInput(minLiquidity.toString()),
                            maxLiquidity: formatNumberInput(maxLiquidity.toString())
                          }));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="relative flex items-center select-none touch-none w-full h-5"
                      >
                        <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                          <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                      </Slider.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Liquidity ($)</label>
                        <input
                          type="text"
                          value={managedFilters.minLiquidity}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, minLiquidity: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Liquidity ($)</label>
                        <input
                          type="text"
                          value={managedFilters.maxLiquidity}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, maxLiquidity: formatNumberInput(e.target.value) }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">Date Range (First Seen)</label>
                    <div className="px-3 py-2 bg-dark-400/30 rounded">
                      <Slider.Root
                        value={[
                          Math.max(0, (new Date(managedFilters.dateFrom).getTime() - new Date(sliderBounds.managed.dates.min).getTime()) / (new Date(sliderBounds.managed.dates.max).getTime() - new Date(sliderBounds.managed.dates.min).getTime()) * 100),
                          Math.min(100, (new Date(managedFilters.dateTo).getTime() - new Date(sliderBounds.managed.dates.min).getTime()) / (new Date(sliderBounds.managed.dates.max).getTime() - new Date(sliderBounds.managed.dates.min).getTime()) * 100)
                        ]}
                        onValueChange={(values) => {
                          const [minVal, maxVal] = values;
                          const minTime = new Date(sliderBounds.managed.dates.min).getTime();
                          const maxTime = new Date(sliderBounds.managed.dates.max).getTime();
                          const timeRange = maxTime - minTime;
                          
                          const fromDate = new Date(minTime + (minVal / 100) * timeRange).toISOString().split('T')[0];
                          const toDate = new Date(minTime + (maxVal / 100) * timeRange).toISOString().split('T')[0];
                          
                          setManagedFilters(prev => ({
                            ...prev,
                            dateFrom: fromDate,
                            dateTo: toDate
                          }));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="relative flex items-center select-none touch-none w-full h-5"
                      >
                        <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                          <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                      </Slider.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">From Date (First Seen)</label>
                        <input
                          type="date"
                          value={managedFilters.dateFrom}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">To Date (First Seen)</label>
                        <input
                          type="date"
                          value={managedFilters.dateTo}
                          onChange={(e) => setManagedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                            managedFilters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                          } focus:ring-1 focus:ring-brand-500/70`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetchManagedTokens();
                    }}
                    disabled={!managedFilters.useFilters}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      managedFilters.useFilters
                        ? 'bg-brand-500/20 text-brand-300 hover:bg-brand-500/30'
                        : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      const defaultDates = getDefaultDates();
                      setManagedFilters({
                        minMarketCap: '50,000',
                        maxMarketCap: '100,000,000',
                        minVolume: '100,000',
                        maxVolume: '1,000,000,000',
                        minLiquidity: '10,000',
                        maxLiquidity: '10,000,000',
                        dateFrom: defaultDates.fromDate,
                        dateTo: defaultDates.toDate,
                        useFilters: true
                      });
                      setManagedPage(0);
                    }}
                    className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded text-sm font-medium hover:bg-gray-500/30 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Chart - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-dark-300/20 to-dark-200/20 rounded-lg border border-dark-300/30 overflow-hidden">
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-dark-300/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-white">Token Analytics Chart</h4>
                <div className="px-2 py-1 rounded text-xs font-medium bg-brand-500/20 text-brand-300">
                  Interactive
                </div>
              </div>
              <div className={`text-gray-400 transform transition-transform ${chartExpanded ? 'rotate-180' : ''}`}>
                ↓
              </div>
            </button>
            
            {chartExpanded && (
              <div className="p-4 border-t border-dark-300/30">
                {/* Chart Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">X-Axis:</label>
                    <select
                      value={chartXAxis}
                      onChange={(e) => setChartXAxis(e.target.value as any)}
                      className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                    >
                      {chartMetricOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Y-Axis:</label>
                    <select
                      value={chartYAxis}
                      onChange={(e) => setChartYAxis(e.target.value as any)}
                      className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                    >
                      {chartMetricOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">X-Scale:</label>
                    <select
                      value={xAxisScale}
                      onChange={(e) => setXAxisScale(e.target.value as any)}
                      className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                      disabled={chartXAxis === 'recency'}
                    >
                      <option value="linear">Linear</option>
                      <option value="logarithmic">Log</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Y-Scale:</label>
                    <select
                      value={yAxisScale}
                      onChange={(e) => setYAxisScale(e.target.value as any)}
                      className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                      disabled={chartYAxis === 'recency'}
                    >
                      <option value="linear">Linear</option>
                      <option value="logarithmic">Log</option>
                    </select>
                  </div>
              <label className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                <input
                  type="checkbox"
                  checked={showActiveBounds}
                  onChange={(e) => setShowActiveBounds(e.target.checked)}
                />
                Green cluster bounds
              </label>
                  <div className="text-xs text-gray-400 ml-auto">
                    {activeTab === 'candidates' ? candidateTokens.length : managedTokens.length} tokens plotted
                  </div>
                </div>
                
                {/* Chart */}
                <div className="h-[600px]">
                  {((activeTab === 'candidates' && candidateTokens.length > 0) || 
                    (activeTab === 'managed' && managedTokens.length > 0)) ? (
                    <Scatter data={getChartData()} options={getChartOptions() as any} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No data to display</p>
                        <p className="text-xs text-gray-500">Load tokens to see the chart</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution Analysis for Active Tokens */}
      {percentileData.managed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {renderMetricDistribution('market_cap', 'managed')}
          {renderMetricDistribution('volume_24h', 'managed')}
          {renderMetricDistribution('liquidity', 'managed')}
          {renderMetricDistribution('recency', 'managed')}
        </div>
      )}

      {/* DUPLICATE FILTER SECTION REMOVED - Filters are now in the side-by-side layout above */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400">Active Tokens</h3>
        <div className="flex items-center gap-2">
          {managedFilters.useFilters && (
            <select
              value={managedClientSortBy}
              onChange={(e) => setManagedClientSortBy(e.target.value as any)}
              className="px-3 py-1 bg-brand-500/20 border-0 rounded text-sm text-brand-300"
            >
              <option value="volume">Highest Volume</option>
              <option value="market_cap">Highest Market Cap</option>
              <option value="newest">Newest First</option>
            </select>
          )}
          {!managedFilters.useFilters && (
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
                setManagedPage(0);
              }}
              className="px-3 py-1 bg-dark-300/50 border border-dark-300/50 rounded text-sm text-white"
            >
              <option value="first_seen-desc">Newest First</option>
              <option value="first_seen-asc">Oldest First</option>
              <option value="symbol-asc">Symbol A-Z</option>
              <option value="symbol-desc">Symbol Z-A</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          )}
          <button
            onClick={fetchManagedTokens}
            disabled={isLoadingManaged}
            className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            {isLoadingManaged ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Tokens grid */}
      {isLoadingManaged ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-dark-300/30 border border-dark-300/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-400/50 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-dark-400/50 rounded w-20 mb-2" />
                  <div className="h-3 bg-dark-400/30 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : managedTokens.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {sortTokensClientSide(managedTokens, managedFilters.useFilters, managedClientSortBy).map(token => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>
          
          {/* Pagination - hidden when filters are active */}
          {!managedFilters.useFilters && managedTokensTotal > managedPerPage && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-300/50">
              <div className="text-sm text-gray-400">
                Showing {managedPage * managedPerPage + 1}-{Math.min((managedPage + 1) * managedPerPage, managedTokensTotal)} of {managedTokensTotal.toLocaleString()} tokens
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManagedPage(0)}
                  disabled={managedPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setManagedPage(managedPage - 1)}
                  disabled={managedPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  ← Previous
                </button>
                <div className="px-3 py-1 text-sm bg-dark-400/50 text-white rounded">
                  Page {managedPage + 1} of {Math.ceil(managedTokensTotal / managedPerPage)}
                </div>
                <button
                  onClick={() => setManagedPage(managedPage + 1)}
                  disabled={(managedPage + 1) * managedPerPage >= managedTokensTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  Next →
                </button>
                <button
                  onClick={() => setManagedPage(Math.ceil(managedTokensTotal / managedPerPage) - 1)}
                  disabled={(managedPage + 1) * managedPerPage >= managedTokensTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
          
          {/* Filter results summary */}
          {managedFilters.useFilters && (
            <div className="pt-4 mt-4 border-t border-dark-300/50">
              <div className="text-sm text-gray-400">
                Showing top {managedTokens.length} filtered results
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">🔍</div>
          <p>No active tokens found</p>
        </div>
      )}
    </div>
  );

  // Render candidate tokens tab
  const renderCandidateTokens = () => (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Token Discovery Zone</h3>
          <p className="text-sm text-gray-400">
            {filters.useFilters 
              ? `Showing top 100 filtered results from ${candidatesTotal.toLocaleString()} candidates`
              : `${candidatesTotal.toLocaleString()} tokens with ≥$50K market cap ready to explore`
            }
          </p>
        </div>
      </div>

      {/* Side-by-side layout: Filters on left, Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Smart Filters - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-dark-300/20 to-dark-200/20 rounded-lg border border-dark-300/30 overflow-hidden h-fit">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-dark-300/10 transition-colors"
            >
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-white">Smart Filters</h4>
            <div className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              filters.useFilters 
                ? 'bg-brand-500/20 text-brand-300' 
                : 'bg-dark-400/50 text-gray-400'
            }`}>
              {filters.useFilters ? 'Active (Top 100)' : 'Disabled'}
            </div>
          </div>
          <div className={`text-gray-400 transform transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}>
            ↓
          </div>
        </button>
        
        {filtersExpanded && (
          <div className="p-4 border-t border-dark-300/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400">Configure filter parameters</span>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, useFilters: !prev.useFilters }));
                  setCandidatesPage(0);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  filters.useFilters 
                    ? 'bg-brand-500/20 text-brand-300' 
                    : 'bg-dark-400/50 text-gray-400 hover:bg-dark-400/70'
                }`}
              >
                {filters.useFilters ? 'Disable Filtering' : 'Enable Filtering'}
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {/* Market Cap Range */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Market Cap Range ($)</label>
                <div className="px-3 py-2 bg-dark-400/30 rounded">
                  <Slider.Root
                    value={[
                      toLogScale(parseInt(getNumericValue(filters.minMarketCap)), sliderBounds.candidates.marketCap.min, sliderBounds.candidates.marketCap.max),
                      toLogScale(parseInt(getNumericValue(filters.maxMarketCap)), sliderBounds.candidates.marketCap.min, sliderBounds.candidates.marketCap.max)
                    ]}
                    onValueChange={(values) => {
                      const [minVal, maxVal] = values;
                      const minMarketCap = fromLogScale(minVal, sliderBounds.candidates.marketCap.min, sliderBounds.candidates.marketCap.max);
                      const maxMarketCap = fromLogScale(maxVal, sliderBounds.candidates.marketCap.min, sliderBounds.candidates.marketCap.max);
                      setFilters(prev => ({
                        ...prev,
                        minMarketCap: formatNumberInput(minMarketCap.toString()),
                        maxMarketCap: formatNumberInput(maxMarketCap.toString())
                      }));
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="relative flex items-center select-none touch-none w-full h-5"
                  >
                    <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                  </Slider.Root>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Market Cap ($)</label>
                    <input
                      type="text"
                      value={filters.minMarketCap}
                      onChange={(e) => setFilters(prev => ({ ...prev, minMarketCap: formatNumberInput(e.target.value) }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Market Cap ($)</label>
                    <input
                      type="text"
                      value={filters.maxMarketCap}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxMarketCap: formatNumberInput(e.target.value) }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                </div>
              </div>

              {/* Volume Range */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Volume Range ($)</label>
                <div className="px-3 py-2 bg-dark-400/30 rounded">
                  <Slider.Root
                    value={[
                      toLogScale(parseInt(getNumericValue(filters.minVolume)), sliderBounds.candidates.volume.min, sliderBounds.candidates.volume.max),
                      toLogScale(parseInt(getNumericValue(filters.maxVolume)), sliderBounds.candidates.volume.min, sliderBounds.candidates.volume.max)
                    ]}
                    onValueChange={(values) => {
                      const [minVal, maxVal] = values;
                      const minVolume = fromLogScale(minVal, sliderBounds.candidates.volume.min, sliderBounds.candidates.volume.max);
                      const maxVolume = fromLogScale(maxVal, sliderBounds.candidates.volume.min, sliderBounds.candidates.volume.max);
                      setFilters(prev => ({
                        ...prev,
                        minVolume: formatNumberInput(minVolume.toString()),
                        maxVolume: formatNumberInput(maxVolume.toString())
                      }));
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="relative flex items-center select-none touch-none w-full h-5"
                  >
                    <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                  </Slider.Root>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Volume ($)</label>
                    <input
                      type="text"
                      value={filters.minVolume}
                      onChange={(e) => setFilters(prev => ({ ...prev, minVolume: formatNumberInput(e.target.value) }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Volume ($)</label>
                    <input
                      type="text"
                      value={filters.maxVolume}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxVolume: formatNumberInput(e.target.value) }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Liquidity Range */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Liquidity Range ($)</label>
                <div className="px-3 py-2 bg-dark-400/30 rounded">
                  <Slider.Root
                    value={[
                      toLogScale(parseInt(getNumericValue(activeTab === 'candidates' ? filters.minLiquidity : managedFilters.minLiquidity)), sliderBounds[activeTab === 'candidates' ? 'candidates' : 'managed'].liquidity.min, sliderBounds[activeTab === 'candidates' ? 'candidates' : 'managed'].liquidity.max),
                      toLogScale(parseInt(getNumericValue(activeTab === 'candidates' ? filters.maxLiquidity : managedFilters.maxLiquidity)), sliderBounds[activeTab === 'candidates' ? 'candidates' : 'managed'].liquidity.min, sliderBounds[activeTab === 'candidates' ? 'candidates' : 'managed'].liquidity.max)
                    ]}
                    onValueChange={(values) => {
                      const [minVal, maxVal] = values;
                      const currentBounds = sliderBounds[activeTab === 'candidates' ? 'candidates' : 'managed'].liquidity;
                      const minLiquidity = fromLogScale(minVal, currentBounds.min, currentBounds.max);
                      const maxLiquidity = fromLogScale(maxVal, currentBounds.min, currentBounds.max);
                      if (activeTab === 'candidates') {
                        setFilters(prev => ({
                          ...prev,
                          minLiquidity: formatNumberInput(minLiquidity.toString()),
                          maxLiquidity: formatNumberInput(maxLiquidity.toString())
                        }));
                      } else {
                        setManagedFilters(prev => ({
                          ...prev,
                          minLiquidity: formatNumberInput(minLiquidity.toString()),
                          maxLiquidity: formatNumberInput(maxLiquidity.toString())
                        }));
                      }
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="relative flex items-center select-none touch-none w-full h-5"
                  >
                    <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                  </Slider.Root>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Liquidity ($)</label>
                    <input
                      type="text"
                      value={activeTab === 'candidates' ? filters.minLiquidity : managedFilters.minLiquidity}
                      onChange={(e) => {
                        if (activeTab === 'candidates') {
                          setFilters(prev => ({ ...prev, minLiquidity: formatNumberInput(e.target.value) }));
                        } else {
                          setManagedFilters(prev => ({ ...prev, minLiquidity: formatNumberInput(e.target.value) }));
                        }
                      }}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        (activeTab === 'candidates' ? filters.useFilters : managedFilters.useFilters) ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Liquidity ($)</label>
                    <input
                      type="text"
                      value={activeTab === 'candidates' ? filters.maxLiquidity : managedFilters.maxLiquidity}
                      onChange={(e) => {
                        if (activeTab === 'candidates') {
                          setFilters(prev => ({ ...prev, maxLiquidity: formatNumberInput(e.target.value) }));
                        } else {
                          setManagedFilters(prev => ({ ...prev, maxLiquidity: formatNumberInput(e.target.value) }));
                        }
                      }}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        (activeTab === 'candidates' ? filters.useFilters : managedFilters.useFilters) ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Date Range */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Date Range (First Seen)</label>
                <div className="px-3 py-2 bg-dark-400/30 rounded">
                  <Slider.Root
                    value={[
                      Math.max(0, (new Date(filters.dateFrom).getTime() - new Date(sliderBounds.candidates.dates.min).getTime()) / (new Date(sliderBounds.candidates.dates.max).getTime() - new Date(sliderBounds.candidates.dates.min).getTime()) * 100),
                      Math.min(100, (new Date(filters.dateTo).getTime() - new Date(sliderBounds.candidates.dates.min).getTime()) / (new Date(sliderBounds.candidates.dates.max).getTime() - new Date(sliderBounds.candidates.dates.min).getTime()) * 100)
                    ]}
                    onValueChange={(values) => {
                      const [minVal, maxVal] = values;
                      const minTime = new Date(sliderBounds.candidates.dates.min).getTime();
                      const maxTime = new Date(sliderBounds.candidates.dates.max).getTime();
                      const timeRange = maxTime - minTime;
                      
                      const fromDate = new Date(minTime + (minVal / 100) * timeRange).toISOString().split('T')[0];
                      const toDate = new Date(minTime + (maxVal / 100) * timeRange).toISOString().split('T')[0];
                      
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: fromDate,
                        dateTo: toDate
                      }));
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="relative flex items-center select-none touch-none w-full h-5"
                  >
                    <Slider.Track className="bg-dark-500/50 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-gradient-to-r from-brand-400 to-cyber-400 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                    <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/50 cursor-pointer" />
                  </Slider.Root>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">From Date (First Seen)</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">To Date (First Seen)</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className={`w-full px-2 py-1 bg-dark-400/50 rounded text-sm text-white transition-all border-0 outline-none ${
                        filters.useFilters ? 'ring-1 ring-brand-500/50' : ''
                      } focus:ring-1 focus:ring-brand-500/70`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchCandidateTokens();
                }}
                disabled={!filters.useFilters}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  filters.useFilters
                    ? 'bg-brand-500/20 text-brand-300 hover:bg-brand-500/30'
                    : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  const defaultDates = getDefaultDates();
                  setFilters({
                    minMarketCap: '50,000',
                    maxMarketCap: '100,000,000',
                    minVolume: '100,000',
                    maxVolume: '1,000,000,000',
                    minLiquidity: '10,000',
                    maxLiquidity: '10,000,000',
                    dateFrom: defaultDates.fromDate,
                    dateTo: defaultDates.toDate,
                    useFilters: true
                  });
                  setCandidatesPage(0);
                }}
                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded text-sm font-medium hover:bg-gray-500/30 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
        
        {/* Chart - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-dark-300/20 to-dark-200/20 rounded-lg border border-dark-300/30 overflow-hidden">
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-dark-300/10 transition-colors"
            >
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-white">Token Analytics Chart</h4>
            <div className="px-2 py-1 rounded text-xs font-medium bg-brand-500/20 text-brand-300">
              Interactive
            </div>
          </div>
          <div className={`text-gray-400 transform transition-transform ${chartExpanded ? 'rotate-180' : ''}`}>
            ↓
          </div>
        </button>
        
        {chartExpanded && (
          <div className="p-4 border-t border-dark-300/30">
            {/* Chart Controls */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">X-Axis:</label>
                <select
                  value={chartXAxis}
                  onChange={(e) => setChartXAxis(e.target.value as any)}
                  className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                >
                  {chartMetricOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Y-Axis:</label>
                <select
                  value={chartYAxis}
                  onChange={(e) => setChartYAxis(e.target.value as any)}
                  className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                >
                  {chartMetricOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">X-Scale:</label>
                <select
                  value={xAxisScale}
                  onChange={(e) => setXAxisScale(e.target.value as any)}
                  className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                  disabled={chartXAxis === 'recency'}
                >
                  <option value="linear">Linear</option>
                  <option value="logarithmic">Log</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Y-Scale:</label>
                <select
                  value={yAxisScale}
                  onChange={(e) => setYAxisScale(e.target.value as any)}
                  className="px-2 py-1 bg-dark-400/50 border-0 rounded text-sm text-white"
                  disabled={chartYAxis === 'recency'}
                >
                  <option value="linear">Linear</option>
                  <option value="logarithmic">Log</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                <input
                  type="checkbox"
                  checked={showActiveBounds}
                  onChange={(e) => setShowActiveBounds(e.target.checked)}
                />
                Green cluster bounds
              </label>
              <div className="text-xs text-gray-400 ml-auto">
                {activeTab === 'candidates' ? candidateTokens.length : managedTokens.length} tokens plotted
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-[600px] bg-dark-400/20 rounded-lg p-4">
              {((activeTab === 'candidates' && candidateTokens.length > 0) || 
                (activeTab === 'managed' && managedTokens.length > 0)) ? (
                <Scatter data={getChartData()} options={getChartOptions() as any} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No data to display</p>
                    <p className="text-xs text-gray-500">Load tokens to see the chart</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Distribution Analysis for Discovery Zone */}
      {percentileData.candidates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {renderMetricDistribution('market_cap', 'candidates')}
          {renderMetricDistribution('volume_24h', 'candidates')}
          {renderMetricDistribution('liquidity', 'candidates')}
          {renderMetricDistribution('recency', 'candidates')}
        </div>
      )}


      {/* Tokens Section with Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400">Discovery Zone Tokens</h3>
        <div className="flex items-center gap-2">
          {filters.useFilters && (
            <select
              value={clientSortBy}
              onChange={(e) => setClientSortBy(e.target.value as any)}
              className="px-3 py-1 bg-brand-500/20 border-0 rounded text-sm text-brand-300"
            >
              <option value="volume">Highest Volume</option>
              <option value="market_cap">Highest Market Cap</option>
              <option value="newest">Newest First</option>
            </select>
          )}
          {!filters.useFilters && (
            <select
              value={`${candidateSortBy}-${candidateSortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setCandidateSortBy(field as any);
                setCandidateSortOrder(order as any);
                setCandidatesPage(0);
              }}
              className="px-3 py-1 bg-dark-300/50 border border-dark-300/50 rounded text-sm text-white"
            >
              <option value="first_seen-desc">Newest Tokens First</option>
              <option value="first_seen-asc">Oldest Tokens First</option>
              <option value="pair_created_at-desc">Newest Pairs First</option>
              <option value="pair_created_at-asc">Oldest Pairs First</option>
              <option value="market_cap-desc">Highest Market Cap</option>
              <option value="market_cap-asc">Lowest Market Cap</option>
              <option value="volume_24h-desc">Highest Volume</option>
              <option value="volume_24h-asc">Lowest Volume</option>
            </select>
          )}
          <button
            onClick={fetchCandidateTokens}
            disabled={isLoadingCandidates}
            className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            {isLoadingCandidates ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Tokens grid */}
      {isLoadingCandidates ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-dark-300/30 border border-dark-300/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-400/50 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-dark-400/50 rounded w-20 mb-2" />
                  <div className="h-3 bg-dark-400/30 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : candidateTokens.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {sortTokensClientSide(candidateTokens, filters.useFilters, clientSortBy).map(token => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>
          
          {/* Pagination - hidden when filters are active */}
          {!filters.useFilters && candidatesTotal > candidatesPerPage && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-300/50">
              <div className="text-sm text-gray-400">
                Showing {candidatesPage * candidatesPerPage + 1}-{Math.min((candidatesPage + 1) * candidatesPerPage, candidatesTotal)} of {candidatesTotal.toLocaleString()} candidates
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCandidatesPage(0)}
                  disabled={candidatesPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCandidatesPage(candidatesPage - 1)}
                  disabled={candidatesPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  ← Previous
                </button>
                <div className="px-3 py-1 text-sm bg-dark-400/50 text-white rounded">
                  Page {candidatesPage + 1} of {Math.ceil(candidatesTotal / candidatesPerPage)}
                </div>
                <button
                  onClick={() => setCandidatesPage(candidatesPage + 1)}
                  disabled={(candidatesPage + 1) * candidatesPerPage >= candidatesTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCandidatesPage(Math.ceil(candidatesTotal / candidatesPerPage) - 1)}
                  disabled={(candidatesPage + 1) * candidatesPerPage >= candidatesTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
          
          {/* Filter results summary */}
          {filters.useFilters && (
            <div className="pt-4 mt-4 border-t border-dark-300/50">
              <div className="text-sm text-gray-400">
                Showing top {candidateTokens.length} filtered results
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">💎</div>
          <p>No candidate tokens found</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for new opportunities</p>
        </div>
      )}
    </div>
  );

  // Render search tokens tab
  const renderSearchTokens = () => (
    <div className="space-y-4">
      {/* Search input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search All Tokens
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol, name, or address..."
            className="w-full px-4 py-2 pl-10 bg-dark-300/50 border border-dark-300/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-brand-500/50 focus:outline-none transition-colors"
            autoFocus
          />
          <div className="absolute left-3 top-2.5 text-gray-500">
            {isSearching ? <span className="animate-spin">⏳</span> : '🔍'}
          </div>
        </div>
      </div>

      {/* Search results */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      )}

      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-4">❌</div>
          <p>No tokens found for "{searchQuery}"</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Found {searchResults.length} token{searchResults.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {searchResults.map(token => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-cyber-400 to-brand-500 bg-clip-text text-transparent">
            Token God View
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Comprehensive token analytics and discovery platform
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      {renderTabs()}

      {/* Tab Content */}
      <div>
        {activeTab === 'managed' && renderManagedTokens()}
        {activeTab === 'candidates' && renderCandidateTokens()}
        {activeTab === 'search' && renderSearchTokens()}
      </div>
    </div>
  );
};