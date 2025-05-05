import React, { useState } from 'react';
import AuthSystemToggle from '../../components/admin/AuthSystemToggle';
import { getFeatureFlag } from '../../config/featureFlags';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';

/**
 * AuthSystemTestPage
 * 
 * This page allows admin users to test and compare the old and new
 * authentication systems. It provides feature toggles and displays
 * authentication state from both systems for comparison.
 */
const AuthSystemTestPage: React.FC = () => {
  // Use the migrated auth hook
  const auth = useMigratedAuth();
  
  // Get the current feature flag state
  const isUsingUnifiedAuth = getFeatureFlag('useUnifiedAuth');
  
  // Local state for test operations
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Test function to get a token
  const testGetToken = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      // Get token (using any TokenType available)
      const token = await auth.getToken();
      
      // Display a masked version of the token
      if (token) {
        const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 10);
        setTestResult(`Successfully retrieved token: ${maskedToken}`);
      } else {
        setTestResult('No token available. Try logging in first.');
      }
    } catch (error) {
      setTestResult(`Error getting token: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to display user role
  const getUserRole = () => {
    // Handle both function and boolean property cases
    const isAuth = auth.isAuthenticated;
    if (isAuth) {
      if (auth.isSuperAdmin) return 'Super Admin';
      if (auth.isAdmin) return 'Admin';
      return 'Regular User';
    }
    return 'Not Authenticated';
  };

  // Function to display auth method
  const getAuthMethod = () => {
    // Handle both function and boolean property cases
    const isAuth = auth.isAuthenticated;
    if (!isAuth) return 'None';
    
    if (auth.isWalletAuth?.()) return 'Wallet';
    if (auth.isPrivyAuth?.()) return 'Privy';
    if (auth.isTwitterAuth?.()) return 'Twitter';
    
    return 'Unknown';
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication System Test Panel</h1>
      
      {/* Feature toggles */}
      <div className="mb-8">
        <AuthSystemToggle />
      </div>
      
      {/* Current auth system info */}
      <div className="mb-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Current Authentication State</h2>
        <p className="mb-2">
          <span className="font-bold">Using:</span> {isUsingUnifiedAuth ? 'Unified Auth System' : 'Legacy Auth System'}
        </p>
        <p className="mb-2">
          <span className="font-bold">Authenticated:</span> {auth.isAuthenticated ? 'Yes' : 'No'}
        </p>
        <p className="mb-2">
          <span className="font-bold">Loading:</span> {auth.isLoading ? 'Yes' : 'No'}
        </p>
        <p className="mb-2">
          <span className="font-bold">User:</span> {auth.user ? auth.user.username : 'Not logged in'}
        </p>
        <p className="mb-2">
          <span className="font-bold">Role:</span> {getUserRole()}
        </p>
        <p className="mb-2">
          <span className="font-bold">Auth Method:</span> {getAuthMethod()}
        </p>
        
        {/* User details if authenticated */}
        {auth.user && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <h3 className="text-xl font-bold mb-2">User Details</h3>
            <pre className="whitespace-pre-wrap overflow-auto max-h-60 bg-gray-900 p-2 rounded">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* Test actions */}
      <div className="mb-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Test Actions</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={testGetToken}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Loading...' : 'Test Get Token'}
          </button>
          
          <button
            onClick={() => auth.logout()}
            disabled={!auth.isAuthenticated || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
          >
            Logout
          </button>
        </div>
        
        {/* Test result */}
        {testResult && (
          <div className="p-4 bg-gray-700 rounded">
            <h3 className="text-lg font-bold mb-2">Test Result</h3>
            <p>{testResult}</p>
          </div>
        )}
      </div>
      
      {/* Authentication methods reference */}
      <div className="p-6 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Authentication Methods</h2>
        <p className="mb-4">
          This panel allows testing both the legacy and unified authentication systems.
          Toggle between them using the control panel at the top.
        </p>
        
        <h3 className="text-xl font-bold mb-2">Available Methods</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Auth Status: <code>isAuthenticated</code></li>
          <li>Loading State: <code>isLoading</code> (new) or <code>loading</code> (legacy)</li>
          <li>User Data: <code>user</code></li>
          <li>Login: <code>loginWithWallet()</code>, <code>loginWithPrivy()</code></li>
          <li>Logout: <code>logout()</code></li>
          <li>Role Check: <code>isAdmin()</code>, <code>isSuperAdmin()</code></li>
          <li>Auth Method: <code>isWalletAuth()</code>, <code>isPrivyAuth()</code>, <code>isTwitterAuth()</code></li>
          <li>Token Management: <code>getToken()</code></li>
        </ul>
        
        <p className="text-sm text-gray-400">
          The <code>useMigratedAuth()</code> hook automatically selects the appropriate auth system based on feature flags.
        </p>
      </div>
    </div>
  );
};

export default AuthSystemTestPage;