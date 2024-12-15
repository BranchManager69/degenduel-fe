import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TokenGrid } from '../components/tokens/TokenGrid';
import { TokenFilters } from '../components/tokens/TokenFilters';
import { PortfolioSummary } from '../components/tokens/PortfolioSummary';
import { Token } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const TokenSelection: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(new Map());
  const [marketCapFilter, setMarketCapFilter] = useState('');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const data = await api.tokens.getAll();
        console.log('Fetched tokens:', data);
        setTokens(data);
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const handleTokenSelect = (symbol: string, weight: number) => {
    const newSelectedTokens = new Map(selectedTokens);
    
    if (weight === 0) {
      newSelectedTokens.delete(symbol);
    } else {
      newSelectedTokens.set(symbol, weight);
    }
    
    setSelectedTokens(newSelectedTokens);
  };

  const totalWeight = Array.from(selectedTokens.values()).reduce((sum, weight) => sum + weight, 0);

  const handleSubmit = async () => {
    if (totalWeight !== 100) {
      toast({
        title: 'Invalid Portfolio',
        description: 'Total weight must equal 100%',
        variant: 'error'
      });
      return;
    }

    try {
      const portfolio = Array.from(selectedTokens.entries()).map(([symbol, weight]) => ({
        symbol,
        weight
      }));

      await api.contests.submitPortfolio(contestId!, portfolio);
      
      toast({
        title: 'Success!',
        description: 'Your portfolio has been submitted',
        variant: 'success'
      });

      navigate(`/contests/${contestId}/live`);
    } catch (error) {
      console.error('Failed to submit portfolio:', error);
      toast({
        title: 'Submission Failed',
        description: 'Please try again',
        variant: 'error'
      });
    }
  };

  if (loading) {
    return <div>Loading tokens...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
            tokens={tokens}
            selectedTokens={selectedTokens}
          />
        </div>
      </div>
    </div>
  );
};