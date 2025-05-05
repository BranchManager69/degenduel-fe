// src/components/blinks/BlinkResolver.tsx

/**
 * BlinkResolver component
 * 
 * This component is used to resolve the blink URL and display the blink button
 * 
 * @author @BranchManager69
 * @version 1.9.0
 * @created 2025-04-30
 * @updated 2025-04-30
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '../../hooks/data/useSolanaWallet';
import { BlinkButton } from './BlinkButton';
import { SolanaWalletConnector } from './SolanaWalletConnector';

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

  // Detect if current URL is a blink URL or if a blink path was passed through query params
  useEffect(() => {
    // Check if we have a direct blink URL
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
    // Check if we have a blink path in the query parameters (from our blinks.html redirect)
    else if (location.pathname === '/' && location.search) {
      const searchParams = new URLSearchParams(location.search);
      const blinkPath = searchParams.get('blinkPath');
      
      if (blinkPath && blinkPath.startsWith('/blinks/')) {
        // Parse the blink path
        const url = new URL(blinkPath, window.location.origin);
        setBlinkUrl(url.pathname);
        
        // Extract query parameters from the blink path
        const blinkParams = new URLSearchParams(url.search);
        const extractedParams: Record<string, string> = {};
        
        blinkParams.forEach((value, key) => {
          extractedParams[key] = value;
        });
        
        setParams(extractedParams);
        
        // Try to fetch metadata
        fetchMetadata(url.pathname, extractedParams);
      }
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
  
  // Handle successful execution or navigation
  const handleSuccess = (signature: string) => {
    console.log('Transaction successful:', signature);
    
    if (!blinkUrl) return;
    
    // Extract contestId from params
    const contestId = params.contestId;
    
    if (!contestId) {
      // If no contestId, just go to home
      navigate('/', { state: { transactionSuccess: true, signature } });
      return;
    }
    
    // Route to appropriate page based on the blink URL
    if (blinkUrl.includes('/join-contest')) {
      // If it was a join contest action, redirect to contest detail
      navigate(`/contests/${contestId}`, { state: { transactionSuccess: true, signature } });
    } else if (blinkUrl.includes('/view-contest')) {
      // If it was a view live contest action, redirect to contest lobby
      navigate(`/contests/${contestId}/lobby`, { state: { blinkRedirect: true } });
    } else if (blinkUrl.includes('/view-results')) {
      // If it was a view results action, redirect to contest results
      navigate(`/contests/${contestId}/results`, { state: { blinkRedirect: true } });
    } else {
      // Default fallback to home
      navigate('/', { state: { transactionSuccess: true, signature } });
    }
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
                  label={
                    blinkUrl?.includes('/view-contest') ? 'View Contest' :
                    blinkUrl?.includes('/view-results') ? 'View Results' :
                    blinkUrl?.includes('/join-contest') ? 'Join Contest' :
                    'Proceed'
                  }
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