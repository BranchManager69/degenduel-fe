import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const { user, connectWallet, connectAsAdmin, disconnectWallet } = useStore();

  return (
    <header className="bg-dark-200 border-b border-dark-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                DegenDuel
              </span>
            </Link>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/contests"
                className="inline-flex items-center px-1 pt-1 text-lg font-medium text-gray-100 border-b-2 border-transparent hover:border-brand-400"
              >
                Contests
              </Link>
              <Link
                to="/tokens"
                className="inline-flex items-center px-1 pt-1 text-lg font-medium text-gray-400 hover:text-gray-100 border-b-2 border-transparent hover:border-brand-400"
              >
                Tokens
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center px-1 pt-1 text-lg font-medium text-gray-400 hover:text-gray-100 border-b-2 border-transparent hover:border-brand-400"
              >
                Profile
              </Link>
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center px-1 pt-1 text-lg font-medium text-brand-400 hover:text-brand-300 border-b-2 border-transparent hover:border-brand-400"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-gray-400">{user.username}</span>
                <Button 
                  onClick={disconnectWallet} 
                  variant="gradient"
                  size="sm"
                  className="relative group"
                >
                  <span className="relative z-10">Disconnect</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={connectWallet} 
                  variant="gradient"
                  size="sm"
                  className="relative group"
                >
                  <span className="relative z-10">Connect Wallet</span>
                </Button>
                <Button 
                  onClick={connectAsAdmin} 
                  variant="gradient"
                  size="sm"
                  className="relative group bg-opacity-50"
                >
                  <span className="relative z-10">Admin Login</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};