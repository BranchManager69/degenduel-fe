import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedTicker } from '../components/layout/UnifiedTicker';
import { Contest } from '../types';

// Create mock contest data
const mockContests: Contest[] = [
  {
    id: 1,
    name: 'Moon Shot Masters',
    description: 'Race to the moon with the hottest tokens',
    entry_fee: '1.50',
    prize_pool: '300.00',
    current_prize_pool: '200.00',
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 120,
    status: 'active',
    settings: {
      difficulty: 'dolphin',
      min_trades: 1,
      token_types: ['all'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    min_participants: 10,
    max_participants: 200,
    contest_code: 'MSM001'
  },
  {
    id: 2,
    name: 'Diamond Hands Showdown',
    description: 'Hold tight and show your diamond hands',
    entry_fee: '0.50',
    prize_pool: '100.00',
    current_prize_pool: '50.00',
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    participant_count: 75,
    status: 'pending',
    settings: {
      difficulty: 'squid',
      min_trades: 2,
      token_types: ['defi', 'gaming'],
      rules: [{ id: '1', title: 'Rule 1', description: 'Description 1' }]
    },
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    min_participants: 5,
    max_participants: 100,
    contest_code: 'DHS002'
  }
];

// A simple wrapper component that renders the ticker in a full-width layout
const EdgeToEdgeTicker: React.FC = () => {
  // Setup enhanced mock data with many tokens for a more impressive display
  window.useTokenDataMock = () => ({
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3500.00',
        marketCap: '423000000000',
        volume24h: '15000000',
        change24h: '4.2',
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '42000.00',
        marketCap: '850000000000',
        volume24h: '25000000',
        change24h: '-2.5',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: '120.00',
        marketCap: '58000000000',
        volume24h: '5000000',
        change24h: '8.1',
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: '0.15',
        marketCap: '20000000000',
        volume24h: '2500000',
        change24h: '12.3',
      },
      {
        symbol: 'PEPE',
        name: 'Pepe',
        price: '0.00001205',
        marketCap: '5000000000',
        volume24h: '1500000',
        change24h: '15.8',
      },
      {
        symbol: 'BONK',
        name: 'Bonk',
        price: '0.00000205',
        marketCap: '1200000000',
        volume24h: '750000',
        change24h: '25.3',
      },
      {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        price: '0.00001850',
        marketCap: '10900000000',
        volume24h: '480000000',
        change24h: '-3.7',
      },
      {
        symbol: 'WIF',
        name: 'Dogwifhat',
        price: '2.35',
        marketCap: '2350000000',
        volume24h: '120000000',
        change24h: '12.4',
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: '35.25',
        marketCap: '12000000000',
        volume24h: '950000',
        change24h: '3.8',
      },
      {
        symbol: 'MATIC',
        name: 'Polygon',
        price: '0.75',
        marketCap: '7500000000',
        volume24h: '850000',
        change24h: '5.2',
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        price: '14.50',
        marketCap: '7800000000',
        volume24h: '750000',
        change24h: '2.1',
      },
      {
        symbol: 'NEAR',
        name: 'NEAR Protocol',
        price: '6.30',
        marketCap: '6900000000',
        volume24h: '580000',
        change24h: '7.8',
      },
    ],
    isConnected: true,
    error: null,
    _refresh: () => console.log('TokenData refresh called')
  });

  window.useStoreMock = () => ({
    maintenanceMode: false, 
    setMaintenanceMode: () => {}, // Add missing required function
    user: {
      is_admin: true, // Allow admin buttons to show
    }
  });

  return (
    <BrowserRouter>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Essential animations */
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scan-fast {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes cyber-scan {
            0% { transform: translateY(-100%); }
            50% { transform: translateY(100%); }
            100% { transform: translateY(-100%); }
          }
          @keyframes data-stream {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulse-glow {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(153, 51, 255, 0.5)); }
            50% { filter: brightness(1.2) drop-shadow(0 0 5px rgba(153, 51, 255, 0.8)); }
          }
          @keyframes cyber-pulse {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(0, 225, 255, 0.5)); }
            50% { filter: brightness(1.2) drop-shadow(0 0 5px rgba(0, 225, 255, 0.8)); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes gradientBg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          /* Component styles */
          .ticker-animation {
            display: flex !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            width: 100% !important;
          }
          .shadow-brand { box-shadow: 0 0 5px rgba(153, 51, 255, 0.3); }
          .shadow-cyber { box-shadow: 0 0 5px rgba(0, 225, 255, 0.3); }
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow-x: auto;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
          }
          
          /* Animation utility classes */
          .animate-shine { animation: shine 2s linear infinite; }
          .animate-cyber-scan { animation: cyber-scan 3s linear infinite; }
          .animate-scan-fast { animation: scan-fast 2s linear infinite; }
          .animate-data-stream { animation: data-stream 3s linear infinite; }
          .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .animate-cyber-pulse { animation: cyber-pulse 2s ease-in-out infinite; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          
          /* Color utility classes */
          .text-brand-400 { color: #9933ff; }
          .text-cyber-400 { color: #00e1ff; }
          .text-yellow-400 { color: #facc15; }
          .text-green-400 { color: #4ade80; }
          .text-red-400 { color: #f87171; }
          
          /* Custom background */
          .cyber-gradient-bg {
            background: linear-gradient(to right, #13111C, #1A172D, #13111C);
            background-size: 200% 200%;
            animation: gradientBg 15s ease infinite;
          }
        `
      }} />
      
      {/* Full width layout with enhanced header and background */}
      <div style={{ 
        background: 'linear-gradient(180deg, #13111C 0%, #0F0E1A 100%)', 
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background grid overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(rgba(153, 51, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(153, 51, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>
        
        {/* Animated background glow spots */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(153, 51, 255, 0.15) 0%, rgba(153, 51, 255, 0) 70%)',
          filter: 'blur(40px)',
          opacity: 0.5,
          animation: 'pulse-glow 10s infinite alternate'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 225, 255, 0.15) 0%, rgba(0, 225, 255, 0) 70%)',
          filter: 'blur(40px)',
          opacity: 0.5,
          animation: 'cyber-pulse 15s infinite alternate'
        }}></div>
        
        {/* Enhanced mock header */}
        <div style={{ 
          height: '72px', 
          backgroundColor: 'rgba(25, 22, 36, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(153, 51, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '20px',
            letterSpacing: '0.5px',
            textShadow: '0 0 5px rgba(153, 51, 255, 0.5)'
          }} className="animate-pulse-glow">DEGEN DUEL</div>
          
          <div style={{ 
            display: 'flex',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div style={{ 
              color: 'rgba(0, 225, 255, 0.8)', 
              fontFamily: 'monospace', 
              fontSize: '14px',
              textShadow: '0 0 4px rgba(0, 225, 255, 0.5)'
            }} className="animate-cyber-pulse">LIVE</div>
            
            <div style={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              backgroundColor: 'rgba(153, 51, 255, 0.1)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(153, 51, 255, 0.2)'
            }}>WALLET CONNECTED</div>
          </div>
        </div>
        
        {/* Ticker in full width mode with enhanced styling */}
        <div style={{ 
          width: '100%',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(0, 225, 255, 0.05)',
          borderBottom: '1px solid rgba(0, 225, 255, 0.05)'
        }} className="cyber-gradient-bg">
          <UnifiedTicker 
            contests={mockContests}
            loading={false}
            isCompact={false}
            maxTokens={15}
          />
        </div>
        
        {/* Enhanced page content area */}
        <div style={{ 
          width: '100%',
          minHeight: 'calc(100vh - 112px)',
          padding: '32px',
          position: 'relative',
          zIndex: 5
        }}>
          {/* Content container */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'rgba(15, 14, 26, 0.5)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(153, 51, 255, 0.1)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}>
            <h1 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '24px',
              marginBottom: '16px',
              textShadow: '0 0 5px rgba(153, 51, 255, 0.3)'
            }}>Active Contests</h1>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
              marginTop: '24px'
            }}>
              {/* Sample contest cards */}
              {[1, 2, 3].map(idx => (
                <div key={idx} style={{
                  background: 'rgba(25, 22, 36, 0.8)',
                  borderRadius: '8px',
                  border: '1px solid rgba(153, 51, 255, 0.2)',
                  padding: '16px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'linear-gradient(to right, #9933ff, #00e1ff)',
                    backgroundSize: '200% 200%',
                    animation: 'gradientBg 3s ease infinite'
                  }}></div>
                  
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '18px'
                  }}>
                    Contest #{idx}
                  </h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}>
                    {idx === 1 ? 'Active contest with 15 participants' : 
                     idx === 2 ? 'Pending contest starting soon' : 
                     'Completed contest with 35 participants'}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      backgroundColor: idx === 1 ? 'rgba(0, 225, 255, 0.1)' : 
                                      idx === 2 ? 'rgba(250, 204, 21, 0.1)' : 
                                      'rgba(74, 222, 128, 0.1)',
                      color: idx === 1 ? '#00e1ff' : 
                            idx === 2 ? '#facc15' : 
                            '#4ade80',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {idx === 1 ? 'LIVE' : idx === 2 ? 'PENDING' : 'COMPLETED'}
                    </span>
                    
                    <span style={{
                      color: 'rgba(153, 51, 255, 0.8)',
                      fontWeight: 'bold'
                    }}>
                      {(idx * 0.5 + 1).toFixed(1)} SOL
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

// Story configuration
const meta: Meta<typeof EdgeToEdgeTicker> = {
  title: 'Layouts/EdgeToEdgeTicker',
  component: EdgeToEdgeTicker,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EdgeToEdgeTicker>;

// Default story
export const Default: Story = {};