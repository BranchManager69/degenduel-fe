import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '../components/ui/Button';
import { TokenGrid } from '../components/tokens/TokenGrid';
import { TokenFilters } from '../components/tokens/TokenFilters';
import { PortfolioSummary } from '../components/tokens/PortfolioSummary';
import { Token, Contest } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useStore } from '../store/useStore';

// New interface for portfolio data
interface PortfolioToken {
  symbol: string;
  weight: number;
}

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="text-center p-4">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  )
}

export const TokenSelection: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(new Map());
  const [marketCapFilter, setMarketCapFilter] = useState('');
  const [contest, setContest] = useState<Contest | null>(null);
  const user = useStore(state => state.user);
  const [tokenListLoading, setTokenListLoading] = useState(true);
  const [loadingEntryStatus, setLoadingEntryStatus] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setTokenListLoading(true);
        const data = await api.tokens.getAll();
        console.log('Raw token data:', data);
        
        // Validate and transform the data
        const validatedTokens = data.map((token: Token) => ({
          ...token,
          change_24h: typeof token.change_24h === 'number' 
            ? token.change_24h 
            : parseFloat(token.change_24h) || 0
        }));
        
        setTokens(validatedTokens);
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        setError('Failed to load tokens');
      } finally {
        setTokenListLoading(false);
      }
    };

    fetchTokens();
  }, []);

  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) return;
      try {
        const data = await api.contests.getById(contestId);
        console.log('Contest data from API:', {
          data,
          isParticipating: data.is_participating,
          id: data.id
        });
        setContest(data);
      } catch (err) {
        console.error('Error fetching contest:', err);
        toast({
          title: 'Error',
          description: 'Failed to load contest details',
          variant: 'error'
        });
      }
    };

    fetchContest();
  }, [contestId]);

  useEffect(() => {
    const fetchExistingPortfolio = async () => {
      if (!contestId || !user?.wallet_address) return;
      
      try {
        setLoadingEntryStatus(true);
        const portfolioData = await api.portfolio.get(Number(contestId));
        
        // Explicitly type the portfolio data and add type checking
        const existingPortfolio = new Map<string, number>(
          (portfolioData.tokens as PortfolioToken[])?.map(
            (token: PortfolioToken) => [token.symbol, token.weight]
          ) || []
        );
        
        setSelectedTokens(existingPortfolio);
      } catch (error) {
        console.error('Failed to fetch existing portfolio:', error);
        // Don't show error toast as this might be a new entry
      } finally {
        setLoadingEntryStatus(false);
      }
    };

    fetchExistingPortfolio();
  }, [contestId, user?.wallet_address]);

  useEffect(() => {
    console.log('Current contest state:', {
      contestId,
      contest,
      isParticipating: contest?.is_participating
    });
  }, [contestId, contest]);

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
    if (!user || !user.wallet_address) {
      toast({
        title: 'Connect Wallet',
        description: 'Connect your Phantom wallet to enter a contest',
        variant: 'error'
      });
      return;
    }

    console.log('Submitting portfolio for wallet:', user.wallet_address);
    console.log('Submit button clicked');
    console.log('Current total portfolio weight:', totalWeight);

    if (totalWeight !== 100) {
      console.log('Weight validation failed');
      toast({
        title: 'Invalid Portfolio',
        description: 'Total weight must equal 100%',
        variant: 'error'
      });
      return;
    }

    // Convert selected tokens to the required format
    const portfolio = Array.from(selectedTokens.entries()).map(([symbol, weight]) => ({
      symbol,
      weight
    }));
    console.log('Portfolio to submit:', portfolio);
    console.log('Contest ID:', contestId);
    console.log('Is participating?:', contest?.is_participating);

    // Validate portfolio requirements
    if (portfolio.length > 5) {
      toast({
        title: 'Too Many Tokens',
        description: 'Maximum 5 tokens allowed per portfolio',
        variant: 'error'
      });
      return;
    }

    if (portfolio.some(entry => entry.weight < 0 || entry.weight > 100)) {
      toast({
        title: 'Invalid Weights',
        description: 'Individual weights must be between 0% and 100%',
        variant: 'error'
      });
      return;
    }

    try {
      if (contest?.is_participating) {
        console.log('Attempting to update portfolio...');
        await api.contests.updatePortfolio(contestId!, portfolio);
      } else {
        console.log('Attempting to enter contest...');
        await api.contests.enterContest(contestId!, portfolio);
      }
      
      console.log('API call successful');
      
      toast({
        title: 'Success!',
        description: contest?.is_participating 
          ? 'Your portfolio has been updated'
          : 'Your portfolio has been submitted',
        variant: 'success'
      });

      console.log('Attempting navigation to:', `/contests/${contestId}/live`);
      navigate(`/contests/${contestId}/live`);
    } catch (error: any) {
      console.error('Failed to submit portfolio:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please try again',
        variant: 'error'
      });
    }
  };

  const getButtonProps = () => {
    if (totalWeight !== 100) {
      return {
        text: `Total Weight: ${totalWeight}%`,
        variant: 'default',
        disabled: true
      };
    }
    
    return contest?.is_participating 
      ? {
          text: 'Submit Changes',
          variant: 'warning' as const,
          disabled: false
        }
      : {
          text: 'Submit Portfolio',
          variant: 'gradient' as const,
          disabled: false
        };
  };

  if (tokenListLoading) {
    return <div>Loading tokens...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  console.log('Render state:', {
    totalWeight,
    isButtonDisabled: totalWeight !== 100,
    selectedTokensCount: selectedTokens.size
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              {contest?.is_participating ? 'Update Your Portfolio' : 'Select Your Tokens'}
            </h1>
            <p className="text-gray-400 mt-2">
              {contest?.is_participating 
                ? 'Modify your allocations before the contest starts'
                : 'Choose tokens and allocate your budget to build the best portfolio'}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={getButtonProps().disabled || loadingEntryStatus}
            variant={getButtonProps().variant as 'gradient' | 'primary' | 'secondary' | 'outline' | undefined }
            className="relative group"
          >
            {loadingEntryStatus ? (
              <span className="flex items-center">
                <span className="mr-2">Loading...</span>
                {/* Add your loadingEntryStatus spinner component here if you have one */}
              </span>
            ) : (
              getButtonProps().text
            )}
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
    </ErrorBoundary>
  );
};