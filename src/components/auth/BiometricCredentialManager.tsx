// src/components/auth/BiometricCredentialManager.tsx

/**
 * BiometricCredentialManager.tsx
 * 
 * Component for managing biometric credentials. Allows users to view,
 * add, and delete their biometric authentication methods.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-07
 */

import React, { useEffect, useState } from 'react';
import { API_URL, authDebug } from '../../config/config';
import { useStore } from '../../store/useStore';
import BiometricAuthButton from './BiometricAuthButton';

interface Credential {
  id: string;
  name: string;
  created_at: string;
  last_used: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
}

interface BiometricCredentialManagerProps {
  className?: string;
}

const BiometricCredentialManager: React.FC<BiometricCredentialManagerProps> = ({
  className = ''
}) => {
  const user = useStore(state => state.user);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  // Fetch user's credentials when component mounts
  useEffect(() => {
    fetchCredentials();
  }, [user?.wallet_address]);

  // Function to fetch user's registered biometric credentials
  const fetchCredentials = async () => {
    if (!user?.wallet_address) {
      setCredentials([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`${API_URL}/auth/biometric/credentials`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch credentials');
      }

      const data = await response.json();
      setCredentials(data.credentials || []);
      authDebug('BiometricAuth', 'Fetched credentials:', data);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a credential
  const deleteCredential = async (credentialId: string) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch(`${API_URL}/auth/biometric/credentials/${credentialId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete credential');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove the credential from the list
        setCredentials(prevCredentials => 
          prevCredentials.filter(cred => cred.id !== credentialId)
        );
        setSuccess('Credential deleted successfully');
        authDebug('BiometricAuth', 'Deleted credential:', credentialId);
      } else {
        throw new Error(data.message || 'Failed to delete credential');
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    setSuccess('Biometric credential registered successfully');
    fetchCredentials(); // Refresh the credentials list
  };

  // Handle registration error
  const handleRegistrationError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(undefined);
  };

  // Format date strings for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Get icon for device type
  const DeviceIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'mobile':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 16.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM5 5h10a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"></path>
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 1a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1H6z"></path>
          </svg>
        );
      case 'desktop':
      default:
        return (
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7H7v6h6V7z"></path>
            <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.5v2H10v-2H5a2 2 0 01-2-2V5zm2 0v8h10V5H5z"></path>
          </svg>
        );
    }
  };

  // If the user is not logged in, show a message
  if (!user?.wallet_address) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <h2 className="text-lg font-semibold mb-2">Biometric Authentication</h2>
        <p>Please log in to manage your biometric credentials.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg p-5 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Biometric Authentication</h2>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Registration section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Add a New Device</h3>
        <p className="text-gray-600 mb-3">Register this device for Face ID, Touch ID, or Windows Hello login</p>
        
        <BiometricAuthButton 
          mode="register"
          walletAddress={user.wallet_address}
          nickname={user.nickname || undefined}
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
          onAvailabilityChange={setIsAvailable}
          showAvailabilityIndicator={true}
        />
      </div>
      
      {/* Credentials list */}
      <div>
        <h3 className="text-lg font-medium mb-2">Your Registered Devices</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <svg className="animate-spin h-6 w-6 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading your devices...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No devices registered yet.</p>
            {!isAvailable && (
              <p className="text-sm text-red-500 mt-2">
                Your current device doesn't support biometric authentication.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {credentials.map(cred => (
              <li key={cred.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <DeviceIcon type={cred.device_type} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{cred.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-2">Last used: {formatDate(cred.last_used)}</span>
                      <span>Registered: {formatDate(cred.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteCredential(cred.id)}
                  disabled={isLoading}
                  className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Security notes and information */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-blue-800 mb-2">About Biometric Authentication</h3>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Your biometric data (fingerprint, face) never leaves your device</li>
          <li>Each device you register creates a separate secure credential</li>
          <li>You can remove any device at any time</li>
          <li>Biometric authentication provides an extra layer of security for your account</li>
        </ul>
      </div>
    </div>
  );
};

export default BiometricCredentialManager;