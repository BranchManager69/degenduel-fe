// src/pages/public/tokens/TokensPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthDebugPanel } from "../../../components/debug";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { TokenDetailModal } from "../../../components/tokens-list/TokenDetailModal";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { MessageType, TopicType } from "../../../hooks/websocket";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata } from "../../../types";

/**
 * TokensPage - Production version based on the StoryTokensPage design
 * with real data from WebSocket and enhanced UI experience
 */
export const TokensPage: React.FC = () => {
  // State initialization
  const [metadata, setMetadata] = useState<TokenResponseMetadata>({
    timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Infinite scroll state
  const [visibleTokensCount, setVisibleTokensCount] = useState(50); // Start with 50 tokens
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const user = useStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const searchDebounceRef = useRef<number | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Token state management with address indexing
  const [tokenMap, setTokenMap] = useState<Record<string, Token>>({});
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());
  
  // Request data for a specific token by address if needed
  const requestTokenByAddress = useCallback((address: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'REQUEST',
        topic: TopicType.MARKET_DATA,
        action: 'getToken',
        data: {
          address: address
        }
      }));
    }
  }, []);

  // Token selection handler
  const handleTokenClick = useCallback((token: Token) => {
    setSelectedTokenSymbol(token.symbol); // Keep using symbol for now as UI components expect it
    setIsDetailModalOpen(true);
    
    // Update URL with address (preferred) and symbol (for compatibility)
    navigate(`${location.pathname}?address=${token.contractAddress}&symbol=${token.symbol}`, { replace: true });
  }, [location.pathname, navigate]);

  // Close the detail modal and reset URL
  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    // Remove both address and symbol from the URL without page reload
    navigate(location.pathname, { replace: true });
  }, [location.pathname, navigate]);

  // Load more tokens for infinite scroll
  const loadMoreTokens = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleTokensCount(prev => prev + 50); // Load 50 more tokens
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore]);

  // Helper function to transform REAL WebSocket token data to Token format
  const transformTokenData = useCallback((tokenData: any): Token => {
    return {
      contractAddress: tokenData.address || "", // Use 'address' field from WebSocket
      status: "active", // All WebSocket tokens are active
      name: tokenData.name || "",
      symbol: tokenData.symbol || "",
      price: tokenData.price?.toString() || "0",
      marketCap: tokenData.market_cap?.toString() || "0", // Use 'market_cap' from WebSocket
      volume24h: tokenData.volume_24h?.toString() || "0", // Use 'volume_24h' from WebSocket  
      change24h: tokenData.change_24h?.toString() || "0", // Use 'change_24h' from WebSocket
      liquidity: {
        usd: tokenData.liquidity?.toString() || "0", // WebSocket liquidity is a string
        base: "0", // Not provided in WebSocket data
        quote: "0"  // Not provided in WebSocket data
      },
      images: {
        imageUrl: tokenData.image_url || "", // Use 'image_url' from WebSocket
        headerImage: "",
        openGraphImage: ""
      },
      socials: tokenData.socials || {
        twitter: { url: "", count: null },
        telegram: { url: "", count: null },
        discord: { url: "", count: null }
      },
      websites: tokenData.websites || []
    };
  }, []);
  
  // Request all tokens from WebSocket 
  const requestAllTokens = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Requesting all tokens from WebSocket...');
      socketRef.current.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'market-data',
        action: 'getTokens',
        data: {
          limit: 1000 // Request all 1000 tokens
        }
      }));
    }
  }, []);
  
  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    setConnectionState('connecting');
    
    // Create new WebSocket connection
    const socket = new WebSocket('wss://degenduel.me/api/v69/ws');
    socketRef.current = socket;
    
    socket.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      
      // Subscribe to market data updates AND request initial tokens
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        topics: [TopicType.MARKET_DATA]
      }));
      
      // Request all tokens immediately after connection
      requestAllTokens();
      
      // Set up ping interval to keep connection alive
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
      }
      
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle direct market-data messages (your real format!)
        if (data.topic === 'market-data' && data.action === 'getTokens' && Array.isArray(data.data)) {
          console.log(`Processing ${data.data.length} tokens from WebSocket`);
          lastUpdateRef.current = new Date();
          
          // Update metadata
          setMetadata({
            timestamp: lastUpdateRef.current.toISOString(),
            _cached: false,
            _stale: false
          });
          
          // Transform and index all tokens by address
          const newTokenMap: Record<string, Token> = {};
          data.data.forEach((tokenData: any) => {
            const token = transformTokenData(tokenData);
            if (token.contractAddress) {
              newTokenMap[token.contractAddress] = token;
            }
          });
          
          setTokenMap(newTokenMap);
          setLoading(false);
        }
        
        // Handle legacy format for compatibility
        else if (data.type === MessageType.DATA && data.topic === TopicType.MARKET_DATA) {
          lastUpdateRef.current = new Date();
          
          // Update metadata
          setMetadata({
            timestamp: lastUpdateRef.current.toISOString(),
            _cached: false,
            _stale: false
          });
          
          // Handle token removals
          if (data.subtype === 'removal' && Array.isArray(data.data)) {
            setTokenMap(prev => {
              const updated = { ...prev };
              data.data.forEach((address: string) => {
                delete updated[address];
              });
              return updated;
            });
          } 
          // Handle token updates
          else if (Array.isArray(data.data)) {
            setTokenMap(prev => {
              const updated = { ...prev };
              
              data.data.forEach((tokenUpdate: any) => {
                const address = tokenUpdate.address;
                if (address) {
                  if (updated[address]) {
                    // Update existing token - merge current with updates
                    const updatedToken = {
                      ...updated[address],
                      ...transformTokenData(tokenUpdate)
                    };
                    updated[address] = updatedToken;
                  } else {
                    // Add new token if it has required fields
                    if (tokenUpdate.name && tokenUpdate.symbol) {
                      const newToken = transformTokenData(tokenUpdate);
                      updated[address] = newToken;
                    }
                  }
                }
              });
              
              return updated;
            });
          }
        }
      } catch (err) {
        console.error("Failed to process WebSocket message:", err);
      }
    };
    
    socket.onclose = () => {
      setConnectionState('disconnected');
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Implement reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * (2 ** reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        setTimeout(connectWebSocket, delay);
      } else {
        console.error("Max WebSocket reconnection attempts reached");
        setConnectionState('error');
      }
    };
    
    socket.onerror = () => {
      setConnectionState('error');
    };
    
    return socket;
  }, [transformTokenData]);

  // Find the selected token based on address or symbol
  const selectedToken = useMemo(() => {
    if (!selectedTokenSymbol) return null;
    
    // First try to find by direct address match (most reliable)
    if (tokenMap[selectedTokenSymbol]) {
      return tokenMap[selectedTokenSymbol];
    }
    
    // Then check if selectedTokenSymbol is actually an address
    const foundByAddress = Object.values(tokenMap).find(
      token => token.contractAddress?.toLowerCase() === selectedTokenSymbol.toLowerCase()
    );
    
    if (foundByAddress) {
      return foundByAddress;
    }
    
    // Fall back to symbol matching for backward compatibility
    const foundBySymbol = Object.values(tokenMap).find(
      token => token.symbol?.toLowerCase() === selectedTokenSymbol.toLowerCase()
    );
    
    if (foundBySymbol) {
      return foundBySymbol;
    }
    
    // If we still don't have a match and it looks like an address, try to request it
    if (selectedTokenSymbol.length > 30 && connectionState === 'connected') {
      // This looks like it could be an address - request it from the server
      requestTokenByAddress(selectedTokenSymbol);
    }
    
    return null;
  }, [tokenMap, selectedTokenSymbol, connectionState, requestTokenByAddress]);

  // Compute filtered and sorted tokens list (all tokens for search/filter)
  const allFilteredAndSortedTokens = useMemo(() => {
    // Get tokens array from map
    const tokensArray = Object.values(tokenMap);
    
    if (tokensArray.length === 0) return [];
    
    // Apply search filter
    const filteredTokens = tokensArray.filter(token => 
      token.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      token.symbol?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    
    // Sort tokens - handle fields consistently
    const sortedTokens = filteredTokens.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;
      
      switch(sortField) {
        case 'marketCap':
          aValue = Number(a.marketCap) || 0;
          bValue = Number(b.marketCap) || 0;
          break;
        case 'volume24h':
          aValue = Number(a.volume24h) || 0;
          bValue = Number(b.volume24h) || 0;
          break;
        case 'change24h':
          aValue = Number(a.change24h) || 0;
          bValue = Number(b.change24h) || 0;
          break;
        case 'price':
          aValue = Number(a.price) || 0;
          bValue = Number(b.price) || 0;
          break;
        default:
          aValue = Number(a[sortField as keyof Token]) || 0;
          bValue = Number(b[sortField as keyof Token]) || 0;
      }
      
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
    
    return sortedTokens;
  }, [tokenMap, debouncedSearchQuery, sortField, sortDirection]);

  // Visible tokens for infinite scroll (only show up to visibleTokensCount)
  const visibleTokens = useMemo(() => {
    return allFilteredAndSortedTokens.slice(0, visibleTokensCount);
  }, [allFilteredAndSortedTokens, visibleTokensCount]);

  // Check if there are more tokens to load
  const hasMoreTokens = allFilteredAndSortedTokens.length > visibleTokensCount;

  // Create debounce for search to improve performance
  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Parse URL parameters for token selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenAddress = params.get('address');
    const tokenSymbol = params.get('symbol'); // For backward compatibility
    
    if (tokenAddress) {
      // Prioritize address if available (more reliable)
      setSelectedTokenSymbol(tokenAddress);
      setSearchQuery(tokenAddress);
      setDebouncedSearchQuery(tokenAddress);
      setIsDetailModalOpen(true);
      
      // If we have a WebSocket connection, request specific token data
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        requestTokenByAddress(tokenAddress);
      }
    } else if (tokenSymbol) {
      // Fall back to symbol for backward compatibility
      setSelectedTokenSymbol(tokenSymbol);
      setSearchQuery(tokenSymbol);
      setDebouncedSearchQuery(tokenSymbol);
      setIsDetailModalOpen(true);
    }
  }, [location.search, requestTokenByAddress]);
  
  // WebSocket-only connection
  useEffect(() => {
    // Connect to WebSocket (it will request tokens automatically)
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [connectWebSocket]);
  
  // Check maintenance mode
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to check maintenance mode:", err);
      }
    };

    checkMaintenanceMode();
  }, []);
  
  // Handle connection state changes
  useEffect(() => {
    if (connectionState === 'error') {
      setError("Connection error. Please try again later.");
    } else if (connectionState === 'connecting') {
      // Only show loading if we're connecting for the first time and don't have data
      if (Object.keys(tokenMap).length === 0) {
        setLoading(true);
      }
    }
     }, [connectionState, tokenMap]);

  // Reset visible tokens when search/filter changes
  useEffect(() => {
    setVisibleTokensCount(50);
  }, [debouncedSearchQuery, sortField, sortDirection]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMoreTokens) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMoreTokens) {
          loadMoreTokens();
        }
      },
      {
        rootMargin: '100px', // Trigger 100px before the element comes into view
      }
    );

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [hasMoreTokens, isLoadingMore, loadMoreTokens]);

  // Pre-calculate JSX elements to avoid conditional hooks
  const floatingParticles = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => {
      // Pre-calculate random values to prevent re-renders
      const left = `${Math.random() * 100}%`;
      const top = `${Math.random() * 100}%`;
      const duration = `${Math.random() * 5 + 5}s`;
      const delay = `${Math.random() * 2}s`;
      
      return (
        <div
          key={i}
          className="absolute w-1 h-1 bg-brand-500 rounded-full opacity-30 animate-float"
          style={{
            left,
            top,
            animationDuration: duration,
            animationDelay: delay
          }}
        />
      );
    }), 
  []);

  const scanningLines = useMemo(() => (
    <>
      <div
        className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-pulse"
        style={{ left: "20%", animationDuration: "8s" }}
      />
      <div
        className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-pulse"
        style={{ left: "80%", animationDuration: "8s", animationDelay: "2s" }}
      />
    </>
  ), []);

  // Loading state UI
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-dark-200/50 backdrop-blur-sm">
                <CardContent className="p-6 h-24">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-dark-300 h-12 w-12"></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-dark-300 rounded w-3/4"></div>
                      <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Maintenance mode UI
  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <span>⚠</span>
              <span>
                DegenDuel is undergoing scheduled maintenance ⚙️ Try again
                later.
              </span>
              <span>⚠</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Main content UI
  return (
    <div className="flex flex-col min-h-screen">
      {/* Auth Debug Panel */}
      <AuthDebugPanel position="top-right" />
      
      {/* CyberGrid background */}
      <div className="fixed inset-0 z-0">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-dark-100"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#9D4EDD 1px, transparent 1px), linear-gradient(90deg, #9D4EDD 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Floating particles - Memoized to prevent re-renders */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingParticles}
        </div>
        
        {/* Scanning lines - Static to prevent reflows */}
        <div className="absolute inset-0 overflow-hidden" style={{ opacity: 0.3 }}>
          {scanningLines}
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10">
        {/* Global cyberpunk accents */}
        <div className="fixed top-24 right-8 w-24 h-24 pointer-events-none">
          <div className="absolute top-0 right-0 w-12 h-1 bg-cyan-500/30"></div>
          <div className="absolute top-0 right-0 w-1 h-12 bg-cyan-500/30"></div>
          <div className="absolute top-6 right-6 w-6 h-6 border border-cyan-500/20 rounded-full"></div>
        </div>
        <div className="fixed bottom-24 left-8 w-24 h-24 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-12 h-1 bg-brand-500/30"></div>
          <div className="absolute bottom-0 left-0 w-1 h-12 bg-brand-500/30"></div>
          <div className="absolute bottom-6 left-6 w-6 h-6 border border-brand-500/20 transform rotate-45"></div>
        </div>
      
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header with metadata and admin controls */}
          <div className="flex justify-between items-start mb-4 sm:mb-8">
            <OptimizedTokensHeader metadata={metadata} />
            {user?.is_admin && (
              <Button
                onClick={() => setIsAddTokenModalOpen(true)}
                className="ml-4 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center gap-2">
                  <span className="hidden sm:inline">Add Token</span>
                  <span className="sm:hidden">+</span>
                </span>
              </Button>
            )}
          </div>

          {/* Enhanced Controls Section */}
          <div className="mb-8 relative">
            {/* Background decorative elements */}
            <div className="absolute -z-10 inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-dark-200/40 backdrop-blur-sm"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <div className="absolute right-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/20 to-transparent"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
              
              {/* Enhanced cyberpunk corner cuts */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-500/40 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-500/40 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 rounded-br"></div>
              
              {/* Digital code segments */}
              <div className="absolute top-2 left-10 flex space-x-1">
                <div className="w-1 h-1 bg-brand-500/60"></div>
                <div className="w-3 h-1 bg-brand-500/40"></div>
                <div className="w-2 h-1 bg-brand-500/60"></div>
              </div>
              <div className="absolute bottom-2 right-10 flex space-x-1">
                <div className="w-2 h-1 bg-cyan-500/60"></div>
                <div className="w-3 h-1 bg-cyan-500/40"></div>
                <div className="w-1 h-1 bg-cyan-500/60"></div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {/* Search Bar - Spans 3 columns */}
                <div className="md:col-span-3 relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-brand-400 transition-colors duration-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Search by name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-300/50 border-2 border-dark-400 focus:border-brand-400 rounded-lg pl-12 pr-4 py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-brand-400/20 transition-all duration-300"
                  />
                  
                  {/* Animated border glow on focus */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300">
                    <div className="absolute inset-0 rounded-lg border-2 border-brand-400/0 group-focus-within:border-brand-400/20"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent transform -translate-y-1 group-focus-within:translate-y-0 opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
                  </div>
                  
                  {/* "Clear" button appears when there's text */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Sort field dropdown - Spans 2 columns */}
                <div className="md:col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-brand-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M7 15l5 5 5-5M7 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof Token)}
                    className="w-full appearance-none bg-dark-300/50 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg pl-12 pr-10 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400/20 transition-all duration-300"
                  >
                    <option value="marketCap">Market Cap</option>
                    <option value="volume24h">24h Volume</option>
                    <option value="change24h">Price Change</option>
                    <option value="price">Current Price</option>
                  </select>
                  
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-cyan-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                
                {/* Sort direction button with animation */}
                <div className="md:col-span-1">
                  <button
                    onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                    className="w-full h-full flex items-center justify-center bg-dark-300/70 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg px-4 py-3 text-white transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-cyan-500/0 group-hover:from-brand-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
                    </div>
                    
                    <div className="transition-transform duration-300 transform">
                      {sortDirection === "asc" ? (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M17 8l-5-5-5 5M17 16l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M17 16l-5-5-5 5M17 8l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
                
                {/* Quick Filter buttons - Show active/gainers/losers */}
                <div className="md:col-span-1 flex md:justify-end">
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-3 bg-dark-300/70 hover:bg-brand-500/20 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg text-white transition-colors duration-300">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <path d="M3 12h4l3-9 4 18 3-9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Search result stats */}
              {searchQuery && (
                <div className="mt-4 text-sm text-gray-400 flex items-center">
                  <span>Found {allFilteredAndSortedTokens.length} tokens matching "{searchQuery}"</span>
                  {allFilteredAndSortedTokens.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs">
                      {sortField === "marketCap" ? "By Market Cap" : 
                       sortField === "volume24h" ? "By Volume" : 
                       sortField === "change24h" ? "By Change" : "By Price"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main grid with glow effect on selected token */}
          <div className="relative">
            {/* Decorative circuit board pattern background */}
            <div className="absolute inset-0 -z-10 overflow-hidden opacity-10 pointer-events-none">
              <div className="absolute top-1/4 left-0 w-full h-px bg-brand-500/50"></div>
              <div className="absolute top-2/4 left-0 w-full h-px bg-cyan-500/50"></div>
              <div className="absolute top-3/4 left-0 w-full h-px bg-purple-500/50"></div>
              <div className="absolute left-1/4 top-0 h-full w-px bg-brand-500/50"></div>
              <div className="absolute left-2/4 top-0 h-full w-px bg-cyan-500/50"></div>
              <div className="absolute left-3/4 top-0 h-full w-px bg-purple-500/50"></div>
              
              {/* Digital pixels */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-500/80"></div>
              <div className="absolute top-1/4 left-2/4 w-2 h-2 bg-brand-500/80"></div>
              <div className="absolute top-1/4 left-3/4 w-2 h-2 bg-brand-500/80"></div>
              <div className="absolute top-2/4 left-1/4 w-2 h-2 bg-cyan-500/80"></div>
              <div className="absolute top-2/4 left-2/4 w-2 h-2 bg-cyan-500/80"></div>
              <div className="absolute top-2/4 left-3/4 w-2 h-2 bg-cyan-500/80"></div>
              <div className="absolute top-3/4 left-1/4 w-2 h-2 bg-purple-500/80"></div>
              <div className="absolute top-3/4 left-2/4 w-2 h-2 bg-purple-500/80"></div>
              <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-purple-500/80"></div>
            </div>
            
            <CreativeTokensGrid 
              tokens={visibleTokens} 
              selectedTokenSymbol={selectedTokenSymbol}
              onTokenClick={handleTokenClick}
            />
            
            {/* Infinite scroll trigger and loading indicator */}
            {hasMoreTokens && (
              <div 
                ref={loadMoreTriggerRef}
                className="flex justify-center items-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more tokens...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreTokens}
                    className="px-6 py-3 bg-dark-300/70 hover:bg-brand-500/20 border-2 border-dark-400 hover:border-brand-400/30 rounded-lg text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2"
                  >
                    <span>Load more tokens</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* End of tokens indicator */}
            {!hasMoreTokens && allFilteredAndSortedTokens.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="text-gray-500 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-500/60 rounded-full"></div>
                  <span>You've seen all {allFilteredAndSortedTokens.length} tokens</span>
                  <div className="w-2 h-2 bg-brand-500/60 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Cyberpunk footer accent */}
          <div className="mt-10 mb-6 relative h-1 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-brand-500/60"></div>
            <div className="absolute left-1/2 top-0 w-px h-4 -translate-x-1/2 bg-brand-500/60 -translate-y-1/2"></div>
          </div>
          
          {/* Modals */}
          <AddTokenModal
            isOpen={isAddTokenModalOpen}
            onClose={() => setIsAddTokenModalOpen(false)}
          />
          
          <TokenDetailModal
            isOpen={isDetailModalOpen && !!selectedToken}
            onClose={handleCloseDetailModal}
            token={selectedToken}
          />
        </div>
      </div>
    </div>
  );
};