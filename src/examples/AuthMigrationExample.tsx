/**
 * Auth Migration Example Component
 * 
 * This component demonstrates how to migrate from the old authentication system
 * to the new unified authentication system.
 * 
 * It shows both implementations side by side for comparison.
 */

import React from 'react';

// OLD AUTH SYSTEM
const OldAuthExample: React.FC = () => {
  // Import from the old location
  const { useAuth: useOldAuth } = require('../hooks/useAuth');
  
  // Use the old auth hook
  const { 
    user, 
    loading, 
    isAuthenticated, 
    loginWithWallet, 
    logout,
    isAdmin,
    getToken 
  } = useOldAuth();
  
  // Render with old properties
  return (
    <div className="bg-zinc-800 p-4 rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Old Auth System</h2>
      <div className="mb-2">
        <strong>Status:</strong> {loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div className="mb-2">
          <strong>User:</strong> {user.username}
        </div>
      )}
      <div className="mb-2">
        <strong>Admin:</strong> {isAdmin() ? 'Yes' : 'No'}
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => loginWithWallet('example-wallet', async () => new Uint8Array([]))}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Login with Wallet
        </button>
        <button 
          onClick={() => logout()}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
        <button 
          onClick={async () => {
            const token = await getToken();
            console.log('Token:', token);
          }}
          className="bg-green-500 px-4 py-2 rounded"
        >
          Get Token
        </button>
      </div>
    </div>
  );
};

// NEW UNIFIED AUTH SYSTEM
const NewAuthExample: React.FC = () => {
  // Import from the new location
  const { useAuth: useNewAuth } = require('../contexts/UnifiedAuthContext');
  const { TokenType } = require('../services');
  
  // Use the new auth hook
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    loginWithWallet, 
    logout,
    isAdmin,
    getToken 
  } = useNewAuth();
  
  // Render with new properties
  return (
    <div className="bg-zinc-900 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-2">New Unified Auth System</h2>
      <div className="mb-2">
        <strong>Status:</strong> {isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div className="mb-2">
          <strong>User:</strong> {user.username}
        </div>
      )}
      <div className="mb-2">
        <strong>Admin:</strong> {isAdmin() ? 'Yes' : 'No'}
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => loginWithWallet('example-wallet', async () => new Uint8Array([]))}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Login with Wallet
        </button>
        <button 
          onClick={() => logout()}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
        <button 
          onClick={async () => {
            const token = await getToken(TokenType.JWT);
            console.log('JWT Token:', token);
            
            const wsToken = await getToken(TokenType.WS_TOKEN);
            console.log('WebSocket Token:', wsToken);
          }}
          className="bg-green-500 px-4 py-2 rounded"
        >
          Get Tokens
        </button>
      </div>
    </div>
  );
};

// Main component showing both implementations
const AuthMigrationExample: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication System Migration Example</h1>
      <p className="mb-4">
        This example demonstrates the differences between the old and new authentication systems.
        The functionality is the same, but the new system has a more consistent API and better organization.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OldAuthExample />
        <NewAuthExample />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Migration Steps</h2>
        <ol className="list-decimal pl-6">
          <li className="mb-2">
            Update imports: <code>import {'{'} useAuth {'}'} from '../contexts/UnifiedAuthContext'</code>
          </li>
          <li className="mb-2">
            Rename <code>loading</code> to <code>isLoading</code> (though the old property is still available)
          </li>
          <li className="mb-2">
            Import <code>TokenType</code> when using specific token types:
            <code>import {'{'} TokenType {'}'} from '../services'</code>
          </li>
          <li className="mb-2">
            Update route components to use new pattern with React Router's Outlet
          </li>
          <li className="mb-2">
            No changes needed for auth method calls - they have the same API
          </li>
        </ol>
      </div>
    </div>
  );
};

export default AuthMigrationExample;