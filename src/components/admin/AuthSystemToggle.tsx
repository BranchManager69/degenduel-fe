import React, { useState, useEffect } from 'react';
import { setFeatureFlag, getFeatureFlag } from '../../config/featureFlags';
// Import route guard feature flags
// Note: This is commented out because we haven't integrated this file yet
// import { enableAllRouteGuards, disableAllRouteGuards } from '../../config/featureFlags.ts.routes';

/**
 * AuthSystemToggle Component
 * 
 * A simple admin component that allows toggling between the old and new
 * authentication systems during migration.
 */
export const AuthSystemToggle: React.FC = () => {
  // State for the toggles
  const [useUnifiedAuth, setUseUnifiedAuth] = useState<boolean>(
    getFeatureFlag('useUnifiedAuth')
  );
  
  const [useUnifiedWebSocket, setUseUnifiedWebSocket] = useState<boolean>(
    getFeatureFlag('useUnifiedWebSocket')
  );
  
  const [enableDebug, setEnableDebug] = useState<boolean>(
    getFeatureFlag('enableAuthDebugLogging')
  );
  
  // Update feature flags when toggles change
  useEffect(() => {
    setFeatureFlag('useUnifiedAuth', useUnifiedAuth);
  }, [useUnifiedAuth]);
  
  useEffect(() => {
    setFeatureFlag('useUnifiedWebSocket', useUnifiedWebSocket);
  }, [useUnifiedWebSocket]);
  
  useEffect(() => {
    setFeatureFlag('enableAuthDebugLogging', enableDebug);
  }, [enableDebug]);
  
  // Force a refresh to apply changes
  const applyChanges = () => {
    window.location.reload();
  };
  
  return (
    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-3">Authentication System Migration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <h3 className="font-bold text-lg border-b border-gray-700 pb-1 mb-2">Core Systems</h3>
          
          <div className="mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useUnifiedAuth}
                onChange={(e) => setUseUnifiedAuth(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Use Unified Auth System</span>
            </label>
            <p className="text-xs text-gray-400 ml-7">
              Switches to the new centralized authentication system
            </p>
          </div>
          
          <div className="mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useUnifiedWebSocket}
                onChange={(e) => setUseUnifiedWebSocket(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Use Unified WebSocket System</span>
            </label>
            <p className="text-xs text-gray-400 ml-7">
              Switches to the new WebSocket system that integrates with the unified auth
            </p>
          </div>
          
          <div className="mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDebug}
                onChange={(e) => setEnableDebug(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Enable Auth Debug Logging</span>
            </label>
            <p className="text-xs text-gray-400 ml-7">
              Shows detailed authentication logs in the console
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-bold text-lg border-b border-gray-700 pb-1 mb-2">Route Guards</h3>
          <p className="text-sm text-gray-400 mb-2">
            Route guards will be added in a future update. They will allow you to test the new 
            React Router Outlet pattern while keeping backward compatibility.
          </p>
          
          {/* These will be enabled when we integrate featureFlags.ts.routes */}
          <div className="mb-3 opacity-50">
            <label className="flex items-center space-x-2 cursor-not-allowed">
              <input
                type="checkbox"
                disabled
                className="form-checkbox h-5 w-5 text-gray-500"
              />
              <span className="text-gray-500">Use Unified Authenticated Route</span>
            </label>
          </div>
          
          <div className="mb-3 opacity-50">
            <label className="flex items-center space-x-2 cursor-not-allowed">
              <input
                type="checkbox"
                disabled
                className="form-checkbox h-5 w-5 text-gray-500"
              />
              <span className="text-gray-500">Use Unified Admin Route</span>
            </label>
          </div>
          
          <div className="mb-3 opacity-50">
            <label className="flex items-center space-x-2 cursor-not-allowed">
              <input
                type="checkbox"
                disabled
                className="form-checkbox h-5 w-5 text-gray-500"
              />
              <span className="text-gray-500">Use Unified SuperAdmin Route</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={applyChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Apply Changes (Reloads Page)
        </button>
        
        <div className="text-xs text-gray-400 text-right">
          <p>Auth System: <span className="font-bold">{useUnifiedAuth ? 'Unified' : 'Legacy'}</span></p>
          <p>WebSocket: <span className="font-bold">{useUnifiedWebSocket ? 'Unified' : 'Legacy'}</span></p>
          <p>Debug: <span className="font-bold">{enableDebug ? 'Enabled' : 'Disabled'}</span></p>
        </div>
      </div>
    </div>
  );
};

export default AuthSystemToggle;