import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React, { useState } from 'react';
import { BlinkButton, ShareBlinkButton } from '../../../components/blinks';
import { toast } from '../../../components/toast';
import { useSolanaKitWallet } from '../../../hooks/wallet/useSolanaKitWallet';

const contestData = [
  {
    id: 'weekly-challenge-1',
    name: 'Weekly Crypto Challenge',
    description: 'Compete to earn the highest returns in our weekly trading contest!',
    entryFee: '0.05',
    prize: '2.5',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 8).toISOString()
  },
  {
    id: 'defi-showdown-2',
    name: 'DeFi Showdown',
    description: 'Test your DeFi knowledge and trading skills in this special event',
    entryFee: '0.1',
    prize: '5.0',
    startTime: new Date(Date.now() + 43200000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 5).toISOString()
  }
];

const tokenData = [
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    price: '166.42',
    change24h: '+2.5%'
  },
  {
    id: 'bonk',
    name: 'Bonk',
    symbol: 'BONK',
    price: '0.00000225',
    change24h: '-1.2%'
  }
];

export const BlinksDemo: React.FC = () => {
  const { isConnected, publicKey } = useSolanaKitWallet();
  const [joinedContests, setJoinedContests] = useState<string[]>([]);
  const [activeBets, setActiveBets] = useState<{id: string, direction: string}[]>([]);
  
  const handleJoinSuccess = (contestId: string, signature: string) => {
    toast.success(`Successfully joined contest! Signature: ${signature.substring(0, 8)}...`);
    setJoinedContests(prev => [...prev, contestId]);
  };
  
  const handleBetSuccess = (tokenId: string, direction: string, signature: string) => {
    toast.success(`Bet placed successfully! Signature: ${signature.substring(0, 8)}...`);
    setActiveBets(prev => [...prev, {id: tokenId, direction}]);
  };
  
  const handleError = (error: Error) => {
    toast.error(error.message || 'Transaction failed');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Solana Blinks Demo</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Experience the power of Solana Actions (Blinks) - one-click transactions 
          that can be shared, embedded, and executed without leaving DegenDuel.
        </p>
      </div>
      
      <div className="max-w-md mx-auto mb-8">
        <WalletMultiButton />
        {isConnected && publicKey && (
          <div className="mt-4 p-3 bg-gray-800/80 border border-gray-700 rounded-md text-center">
            <p className="text-green-400 text-sm font-semibold">Connected with Solana wallet</p>
            <p className="text-gray-400 text-xs mt-1">Ready to execute Blinks</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Join Contests</h2>
          
          <div className="space-y-6">
            {contestData.map(contest => (
              <div 
                key={contest.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <h3 className="text-xl font-bold text-white mb-2">{contest.name}</h3>
                <p className="text-gray-300 mb-4">{contest.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                  <div>Entry: {contest.entryFee} SOL</div>
                  <div>Prize: {contest.prize} SOL</div>
                </div>
                
                <div className="flex space-x-3">
                  {joinedContests.includes(contest.id) ? (
                    <button 
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md cursor-default"
                      disabled
                    >
                      Joined ✓
                    </button>
                  ) : (
                    <BlinkButton
                      blinkUrl="/api/blinks/join-contest"
                      params={{
                        contestId: contest.id,
                        contestName: contest.name,
                        entryFee: contest.entryFee
                      }}
                      className="flex-1 py-2"
                      label="Join Contest"
                      onSuccess={(signature) => handleJoinSuccess(contest.id, signature)}
                      onError={handleError}
                    />
                  )}
                  
                  <ShareBlinkButton
                    blinkUrl="/blinks/join-contest"
                    params={{
                      contestId: contest.id,
                      contestName: contest.name
                    }}
                    label="Share"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Place Token Bets</h2>
          
          <div className="space-y-6">
            {tokenData.map(token => (
              <div 
                key={token.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{token.name} ({token.symbol})</h3>
                  <div className={`text-lg font-mono ${
                    token.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${token.price}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">
                  24h Change: <span className={
                    token.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }>{token.change24h}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {activeBets.some(bet => bet.id === token.id && bet.direction === 'up') ? (
                    <button 
                      className="py-2 px-4 bg-green-600 text-white rounded-md cursor-default"
                      disabled
                    >
                      Bet UP ✓
                    </button>
                  ) : (
                    <BlinkButton
                      blinkUrl="/api/blinks/place-token-bet"
                      params={{
                        tokenId: token.id,
                        tokenSymbol: token.symbol,
                        amount: "0.1",
                        direction: "up"
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      label="Bet UP"
                      onSuccess={(signature) => handleBetSuccess(token.id, 'up', signature)}
                      onError={handleError}
                    />
                  )}
                  
                  {activeBets.some(bet => bet.id === token.id && bet.direction === 'down') ? (
                    <button 
                      className="py-2 px-4 bg-red-600 text-white rounded-md cursor-default"
                      disabled
                    >
                      Bet DOWN ✓
                    </button>
                  ) : (
                    <BlinkButton
                      blinkUrl="/api/blinks/place-token-bet"
                      params={{
                        tokenId: token.id,
                        tokenSymbol: token.symbol,
                        amount: "0.1",
                        direction: "down"
                      }}
                      className="bg-red-600 hover:bg-red-700"
                      label="Bet DOWN"
                      onSuccess={(signature) => handleBetSuccess(token.id, 'down', signature)}
                      onError={handleError}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Developer Integration</h2>
        <p className="text-gray-300 mb-4">
          Solana Blinks can be integrated into any app or website. Here's how to create
          a shareable link for joining a contest:
        </p>
        
        <div className="bg-gray-900 p-4 rounded-md font-mono text-sm text-gray-300 overflow-x-auto mb-6">
          https://degenduel.me/blinks/join-contest?contestId=weekly-challenge-1&amp;contestName=Weekly%20Crypto%20Challenge
        </div>
        
        <p className="text-gray-300">
          This link can be shared anywhere - social media, messaging apps, or embedded in buttons
          on other websites. When clicked, it will open DegenDuel and prompt the user to sign
          the transaction.
        </p>
      </div>
    </div>
  );
};