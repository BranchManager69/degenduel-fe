import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BlinkButton } from './BlinkButton';
import { SolanaWalletConnector } from './SolanaWalletConnector';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';

interface BlinkMetadata {
  title: string;
  description: string;
  icon?: string;
}

export const BlinkResolver: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useSolanaWallet();
  const [blinkUrl, setBlinkUrl] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<BlinkMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect if current URL is a blink URL
  useEffect(() => {
    if (location.pathname.startsWith('/blinks/')) {
      setBlinkUrl(location.pathname);
      
      // Extract query parameters
      const searchParams = new URLSearchParams(location.search);
      const extractedParams: Record<string, string> = {};
      
      searchParams.forEach((value, key) => {
        extractedParams[key] = value;
      });
      
      setParams(extractedParams);
      
      // Try to fetch metadata
      fetchMetadata(location.pathname, extractedParams);
    }
  }, [location]);
  
  // Fetch metadata for the blink
  const fetchMetadata = async (url: string, params: Record<string, string>) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${url}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load action details: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      console.error('Error fetching blink metadata:', err);
      setError('Failed to load action details');
    }
  };
  
  // Handle successful execution
  const handleSuccess = (signature: string) => {
    console.log('Transaction successful:', signature);
    // Redirect to a success page or back to home
    navigate('/', { state: { transactionSuccess: true, signature } });
  };
  
  // Handle errors
  const handleError = (error: Error) => {
    console.error('Transaction error:', error);
    setError(error.message || 'Transaction failed');
  };
  
  // If not a blink URL, don't render anything
  if (!blinkUrl) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white shadow-xl">
        {metadata ? (
          <>
            <div className="text-center mb-6">
              {metadata.icon && (
                <img 
                  src={metadata.icon} 
                  alt="Action Icon" 
                  className="w-16 h-16 mx-auto mb-2"
                />
              )}
              <h2 className="text-xl font-bold">{metadata.title}</h2>
              <p className="text-gray-400 mt-1">{metadata.description}</p>
            </div>
            
            {connected ? (
              <div className="space-y-4">
                <BlinkButton 
                  blinkUrl={blinkUrl}
                  params={params}
                  className="w-full py-3"
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
                
                <button
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-md text-red-200 text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <SolanaWalletConnector className="mb-4" />
                
                <button
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>{error || 'Loading action details...'}</p>
            
            {error && (
              <button
                className="mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                onClick={() => navigate('/')}
              >
                Go Back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};