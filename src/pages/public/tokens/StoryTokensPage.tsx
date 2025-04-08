// src/pages/public/tokens/StoryTokensPage.tsx

import React, { useState, useMemo } from "react";
import { CreativeTokensGrid } from "../../../components/tokens-list/CreativeTokensGrid";
import { OptimizedTokensHeader } from "../../../components/tokens-list/OptimizedTokensHeader";
import { TokenDetailModal } from "../../../components/tokens-list/TokenDetailModal";
import { Token, TokenResponseMetadata } from "../../../types";

/**
 * StoryTokensPage - A simplified version specifically for Storybook
 * with hardcoded mock data and no API dependencies
 */
export const StoryTokensPage: React.FC = () => {
  // Hardcoded mock data for Storybook
  const mockMetadata: TokenResponseMetadata = {
    timestamp: new Date().toISOString(),
    _cached: false,
    _stale: false,
    _cachedAt: new Date().toISOString()
  };
  
  // No longer needed as we're using the shared getTokenColor function in OptimizedTokenCard
  // const getColorForToken = (symbol: string) => {
  /*  const colors: Record<string, string> = {
      SOL: '#14F195',
      BTC: '#F7931A',
      ETH: '#627EEA',
      DOGE: '#C3A634',
      ADA: '#0033AD',
      WIF: '#9945FF',
      PEPE: '#479F53',
      BONK: '#F2A900'
    };
    return colors[symbol] || '#7F00FF'; // Default to brand purple
  }; */
  
  // Create 8 mock tokens (expanded for testing) with real images
  const mockTokens: Token[] = [
    {
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Solana',
      symbol: 'SOL',
      price: '103.45',
      marketCap: '42000000000',
      volume24h: '1500000000',
      change24h: '5.63',
      liquidity: { 
        usd: '120000000', 
        base: '1000000', 
        quote: '2000000' 
      },
      // Real images for Solana
      images: { 
        imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        headerImage: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/solana', count: null },
        telegram: { url: 'https://t.me/solana', count: null },
        discord: { url: 'https://discord.com/invite/solana', count: null }
      },
      websites: [{ url: 'https://solana.com', label: 'Website' }]
    },
    {
      contractAddress: '0x2345678901abcdef2345678901abcdef23456789',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '67245.21',
      marketCap: '1320000000000',
      volume24h: '28500000000',
      change24h: '-2.34',
      liquidity: { 
        usd: '820000000', 
        base: '12000000', 
        quote: '18000000' 
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        headerImage: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/bitcoin', count: null },
        telegram: { url: 'https://t.me/bitcoin', count: null },
        discord: { url: 'https://discord.com/invite/bitcoin', count: null }
      },
      websites: [{ url: 'https://bitcoin.org', label: 'Website' }]
    },
    {
      contractAddress: '0x3456789012abcdef3456789012abcdef34567890',
      name: 'Ethereum',
      symbol: 'ETH',
      price: '3420.89',
      marketCap: '410000000000',
      volume24h: '12500000000',
      change24h: '2.25',
      liquidity: { 
        usd: '450000000', 
        base: '8000000', 
        quote: '10000000' 
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        headerImage: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/ethereum', count: null },
        telegram: { url: 'https://t.me/ethereum', count: null },
        discord: { url: 'https://discord.com/invite/ethereum', count: null }
      },
      websites: [{ url: 'https://ethereum.org', label: 'Website' }]
    },
    {
      contractAddress: '0x4567890123abcdef4567890123abcdef45678901',
      name: 'Dogecoin',
      symbol: 'DOGE',
      price: '0.157',
      marketCap: '22000000000',
      volume24h: '1850000000',
      change24h: '8.75',
      liquidity: { 
        usd: '95000000', 
        base: '5000000', 
        quote: '7000000' 
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
        headerImage: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/dogecoin', count: null },
        telegram: { url: 'https://t.me/dogecoinchat', count: null },
        discord: { url: 'https://discord.com/invite/dogecoin', count: null }
      },
      websites: [{ url: 'https://dogecoin.com', label: 'Website' }]
    },
    {
      contractAddress: '0x5678901234abcdef5678901234abcdef56789012',
      name: 'Cardano',
      symbol: 'ADA',
      price: '0.457',
      marketCap: '16100000000',
      volume24h: '587000000',
      change24h: '-1.89',
      liquidity: { 
        usd: '78000000', 
        base: '4200000', 
        quote: '6500000' 
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        headerImage: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/cardano', count: null },
        telegram: { url: 'https://t.me/Cardano', count: null },
        discord: { url: 'https://discord.com/invite/cardano', count: null }
      },
      websites: [{ url: 'https://cardano.org', label: 'Website' }]
    },
    {
      contractAddress: '0x6789012345abcdef6789012345abcdef67890123',
      name: 'Dogwifhat',
      symbol: 'WIF',
      price: '2.35',
      marketCap: '2350000000',
      volume24h: '120000000',
      change24h: '12.4',
      liquidity: { 
        usd: '45000000', 
        base: '2200000', 
        quote: '3500000' 
      },
      images: {
        imageUrl: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24477.png',
        headerImage: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24477.png',
        openGraphImage: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24477.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/dogwifhat', count: null },
        telegram: { url: 'https://t.me/dogwifhat', count: null },
        discord: { url: 'https://discord.com/invite/dogwifhat', count: null }
      },
      websites: [{ url: 'https://dogwifcoin.org', label: 'Website' }]
    },
    {
      contractAddress: '0x7890123456abcdef7890123456abcdef78901234',
      name: 'Pepe',
      symbol: 'PEPE',
      price: '0.00001205',
      marketCap: '5000000000',
      volume24h: '1500000000',
      change24h: '15.8',
      liquidity: { 
        usd: '35000000', 
        base: '1800000', 
        quote: '2900000' 
      },
      images: {
        imageUrl: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24478.png',
        headerImage: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24478.png',
        openGraphImage: 'https://s3.coinmarketcap.com/static/img/coins/64x64/24478.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/pepecoineth', count: null },
        telegram: { url: 'https://t.me/pepecoineth', count: null },
        discord: { url: 'https://discord.com/invite/pepecoin', count: null }
      },
      websites: [{ url: 'https://www.pepe.vip', label: 'Website' }]
    },
    {
      contractAddress: '0x8901234567abcdef8901234567abcdef89012345',
      name: 'Bonk',
      symbol: 'BONK',
      price: '0.00000205',
      marketCap: '1200000000',
      volume24h: '750000000',
      change24h: '25.3',
      liquidity: { 
        usd: '25000000', 
        base: '1500000', 
        quote: '2100000' 
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/bonk-bonk-logo.png',
        headerImage: 'https://cryptologos.cc/logos/bonk-bonk-logo.png',
        openGraphImage: 'https://cryptologos.cc/logos/bonk-bonk-logo.png'
      },
      socials: {
        twitter: { url: 'https://twitter.com/bonk_inu', count: null },
        telegram: { url: 'https://t.me/bonk_inu', count: null },
        discord: { url: 'https://discord.com/invite/bonkinu', count: null }
      },
      websites: [{ url: 'https://bonktoken.com', label: 'Website' }]
    }
  ];

  // State for simplified tokens page
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Find the selected token based on symbol
  const selectedToken = useMemo(() => {
    if (!selectedTokenSymbol) return null;
    return mockTokens.find(
      token => token.symbol.toLowerCase() === selectedTokenSymbol.toLowerCase()
    ) || null;
  }, [selectedTokenSymbol]);

  // Token selection handler
  const handleTokenClick = (token: Token) => {
    setSelectedTokenSymbol(token.symbol);
    setIsDetailModalOpen(true);
  };

  // Close the detail modal 
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  // Compute filtered and sorted tokens list
  const filteredAndSortedTokens = useMemo(() => {
    return mockTokens
      .filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = Number(a[sortField]) || 0;
        const bValue = Number(b[sortField]) || 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
  }, [mockTokens, searchQuery, sortField, sortDirection]);

  // Main content UI
  return (
    <div className="flex flex-col min-h-screen">
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
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-brand-500 rounded-full opacity-30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 5 + 5}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Scanning lines */}
        <div className="absolute inset-0 overflow-hidden" style={{ opacity: 0.3 }}>
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-pulse"
            style={{ left: "20%", animationDuration: "8s" }}
          />
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-pulse"
            style={{ left: "80%", animationDuration: "8s", animationDelay: "2s" }}
          />
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
          <div className="flex justify-between items-start mb-4 sm:mb-8">
            <OptimizedTokensHeader metadata={mockMetadata} />
          </div>

          {/* Creative Controls Section */}
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
                  <span>Found {filteredAndSortedTokens.length} tokens matching "{searchQuery}"</span>
                  {filteredAndSortedTokens.length > 0 && (
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
              tokens={filteredAndSortedTokens} 
              selectedTokenSymbol={selectedTokenSymbol}
              onTokenClick={handleTokenClick}
            />
          </div>
          
          {/* Cyberpunk footer accent */}
          <div className="mt-10 mb-6 relative h-1 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-brand-500/60"></div>
            <div className="absolute left-1/2 top-0 w-px h-4 -translate-x-1/2 bg-brand-500/60 -translate-y-1/2"></div>
          </div>
          
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