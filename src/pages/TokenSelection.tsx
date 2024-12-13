import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TokenGrid } from '../components/tokens/TokenGrid';
import { TokenFilters } from '../components/tokens/TokenFilters';
import { PortfolioSummary } from '../components/tokens/PortfolioSummary';

export const TokenSelection: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(new Map());
  const [marketCapFilter, setMarketCapFilter] = useState('');

  // Placeholder token data
  const tokens = [
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 100.50,
      marketCap: 40_000_000_000,
      change24h: 5.2,
      volume24h: 1_500_000_000,
    },
    {
      symbol: 'RAY',
      name: 'Raydium',
      price: 2.75,
      marketCap: 500_000_000,
      change24h: -2.1,
      volume24h: 50_000_000,
    },
    {
      symbol: 'BONK',
      name: 'Bonk',
      price: 0.000001,
      marketCap: 100_000_000,
      change24h: 15.7,
      volume24h: 20_000_000,
    },
  ];

  const totalWeight = useMemo(() => {
    return Array.from(selectedTokens.values()).reduce((sum, weight) => sum + weight, 0);
  }, [selectedTokens]);

  const handleTokenSelect = (symbol: string, weight: number) => {
    const newSelectedTokens = new Map(selectedTokens);
    
    if (weight === 0) {
      newSelectedTokens.delete(symbol);
    } else {
      newSelectedTokens.set(symbol, weight);
    }
    
    setSelectedTokens(newSelectedTokens);
  };

  const handleSubmit = () => {
    if (totalWeight === 100) {
      navigate(`/contests/${contestId}/live`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Select Your Tokens</h1>
          <p className="text-gray-400 mt-2">Choose tokens and set their weights to build your portfolio</p>
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={totalWeight !== 100}
          variant="gradient"
          className="relative group"
        >
          {totalWeight === 100 ? 'Submit Portfolio' : `Total Weight: ${totalWeight}%`}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="mb-6">
            <TokenFilters
              marketCapFilter={marketCapFilter}
              onMarketCapFilterChange={setMarketCapFilter}
            />
          </div>
          <TokenGrid
            tokens={tokens}
            selectedTokens={selectedTokens}
            onTokenSelect={handleTokenSelect}
            marketCapFilter={marketCapFilter}
          />
        </div>
        <div>
          <PortfolioSummary
            selectedTokens={selectedTokens}
            tokens={tokens}
          />
        </div>
      </div>
    </div>
  );
};