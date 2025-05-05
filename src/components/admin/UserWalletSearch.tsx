// src/components/admin/UserWalletSearch.tsx

/**
 * User Wallet Search Component
 * 
 * This component provides a search interface for finding users by nickname or wallet address.
 * It displays a dropdown of search results and allows users to select a user to view their balance history.
 * 
 * @author BranchManager69
 * @version 0.6.9
 */

import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/utilities/useDebounce';
import { AdminWalletBalanceChart } from '../AdminWalletBalanceChart';

interface UserResult {
  wallet_address: string;
  nickname: string;
  role?: string;
  last_login?: string;
}

interface UserWalletSearchProps {
  title?: string;
  description?: string;
  className?: string;
}

// Search by partial nickname or wallet address
/**
 * User Wallet Search Component
 * 
 * This component provides a search interface for finding users by nickname or wallet address.
 * It displays a dropdown of search results and allows users to select a user to view their balance history.
 * 
 * @param param0 
 * @returns 
 * 
 * @author BranchManager69
 * @version 0.6.9
 */
export const UserWalletSearch: React.FC<UserWalletSearchProps> = ({
  title = 'User Wallet Balance Search',
  description = 'Search for users by nickname or wallet address to view their balance history',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to prevent too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        searchContainerRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsResultsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Search for users when query changes
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    // Make a real API call to search for users
    axios.get(`/api/users/search?search=${encodeURIComponent(debouncedSearchQuery)}&limit=5`)
      .then(response => {
        if (response.data && response.data.users) {
          setSearchResults(response.data.users);
          setIsResultsOpen(response.data.users.length > 0);
        } else {
          setSearchResults([]);
        }
      })
      .catch(err => {
        console.error('Error searching for users:', err);
        setError('Failed to search for users. Please try again.');
        setSearchResults([]);
      })
      .finally(() => {
        setIsSearching(false);
      });
    
  }, [debouncedSearchQuery]);
  
  // Handle selecting a user
  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearchQuery(''); // Clear search
    setIsResultsOpen(false);
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
        <h2 className="text-xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent mb-4">
          {title}
        </h2>
        
        {description && (
          <p className="text-gray-400 text-sm mb-4">{description}</p>
        )}
        
        {/* Search input */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setIsResultsOpen(true);
                  } else {
                    setIsResultsOpen(false);
                  }
                }}
                placeholder="Search by nickname or wallet address..."
                className="w-full bg-dark-300/50 border border-dark-400/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30 pl-9"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {isSearching && (
                <div className="absolute right-3 top-2.5 text-brand-400">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 bg-dark-400/60 text-gray-400 rounded-lg hover:bg-dark-400/90 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
          
          {/* Search results dropdown */}
          {isResultsOpen && searchResults.length > 0 && (
            <div 
              ref={resultsRef}
              className="absolute mt-1 w-full bg-dark-300/95 backdrop-blur-sm border border-dark-400/70 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10"
            >
              <div className="p-2">
                {searchResults.map((user) => (
                  <div
                    key={user.wallet_address}
                    onClick={() => handleSelectUser(user)}
                    className="px-3 py-2 hover:bg-dark-400/50 rounded-md cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-brand-300 font-medium">{user.nickname}</span>
                        <span className="text-gray-500 text-xs">{user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-4)}</span>
                      </div>
                      <div className="flex items-center">
                        {user.role === 'admin' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 mr-2">Admin</span>
                        )}
                        {user.role === 'superadmin' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 mr-2">Super</span>
                        )}
                        <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isResultsOpen && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <div className="absolute mt-1 w-full bg-dark-300/95 backdrop-blur-sm border border-dark-400/70 rounded-lg shadow-lg z-10">
              <div className="p-4 text-center text-gray-400">
                No users found matching "{searchQuery}"
              </div>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-2 text-red-400 text-sm">{error}</div>
        )}
        
        {/* Selected user info */}
        {selectedUser && (
          <div className="mt-4 bg-dark-300/40 border border-dark-400/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium text-gray-200">{selectedUser.nickname}</div>
                <div className="text-sm text-gray-400">{selectedUser.wallet_address}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Wallet balance chart */}
      {selectedUser && (
        <AdminWalletBalanceChart
          walletAddress={selectedUser.wallet_address}
          title={`Balance History: ${selectedUser.nickname}`}
          description={`Historical SOL balance for wallet ${selectedUser.wallet_address.slice(0, 8)}...${selectedUser.wallet_address.slice(-4)}`}
          height={350}
          showControls={true}
        />
      )}
      
      {/* Placeholder when no user is selected */}
      {!selectedUser && (
        <div className="bg-dark-300/30 border border-dark-400/30 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-gray-400 text-lg mb-1">No User Selected</h3>
          <p className="text-gray-500 text-sm">Search for a user to view their wallet balance history</p>
        </div>
      )}
    </div>
  );
};

export default UserWalletSearch;