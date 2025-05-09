// src/components/auth/QRCodeAuth.tsx

/**
 * QRCodeAuth.tsx
 * 
 * Component for QR code-based authentication, allowing users to scan a QR code
 * on their mobile device to authenticate on desktop.
 * 
 * @author Claude
 * @created 2025-05-09
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL, authDebug } from '../../config/config';
import { useStore } from '../../store/useStore';

interface QRCodeAuthProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const QRCodeAuth: React.FC<QRCodeAuthProps> = ({
  className = '',
  onSuccess,
  onError
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'completed' | 'cancelled' | 'expired'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const setUser = useStore(state => state.setUser);

  // Generate a new QR code for authentication
  const generateQRCode = async () => {
    setIsLoading(true);
    setError(null);
    setStatus('pending');
    
    try {
      const response = await axios.post(`${API_URL}/auth/qr/generate`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      authDebug('QRCodeAuth', 'QR code generated:', response.data);
      
      setQrCodeUrl(response.data.qrCode);
      setSessionToken(response.data.sessionToken);
      setExpiresAt(response.data.expiresAt);
      
      // Start polling for status
      pollStatus(response.data.sessionToken);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
      if (onError) onError('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Poll for status updates
  const pollStatus = useCallback(async (token: string) => {
    if (!token) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/qr/poll/${token}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        const statusData = response.data;
        
        authDebug('QRCodeAuth', 'Poll status:', statusData);
        
        // Update status
        setStatus(statusData.status);
        
        // If status is approved, complete the authentication
        if (statusData.status === 'approved') {
          completeAuthentication(token);
          clearInterval(interval);
        }
        
        // If status is completed or cancelled, stop polling
        if (statusData.status === 'completed' || statusData.status === 'cancelled') {
          clearInterval(interval);
        }
        
        // Check if expired
        if (statusData.expiresAt) {
          const expiration = new Date(statusData.expiresAt);
          if (expiration < new Date()) {
            setStatus('expired');
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Complete the authentication process
  const completeAuthentication = async (token: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/qr/complete/${token}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      authDebug('QRCodeAuth', 'Authentication completed:', response.data);
      
      if (response.data.verified && response.data.user) {
        // Update user in store
        setUser({
          ...response.data.user,
          jwt: response.data.token
        });
        
        setStatus('completed');
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Error completing authentication:', error);
      setError('Authentication failed. Please try again.');
      if (onError) onError('Authentication failed');
    }
  };
  
  // Cancel the authentication process
  const cancelAuthentication = async () => {
    if (!sessionToken) return;
    
    try {
      await axios.post(`${API_URL}/auth/qr/cancel/${sessionToken}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setStatus('cancelled');
      setQrCodeUrl(null);
      setSessionToken(null);
    } catch (error) {
      console.error('Error cancelling authentication:', error);
    }
  };
  
  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
    
    // Clean up on unmount
    return () => {
      if (sessionToken && ['pending', 'approved'].includes(status)) {
        cancelAuthentication();
      }
    };
  }, []);
  
  // Format the remaining time
  const getRemainingTime = (): string => {
    if (!expiresAt) return '';
    
    const expiration = new Date(expiresAt);
    const now = new Date();
    
    // If expired, return empty string
    if (expiration < now) return '';
    
    const diffMs = expiration.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec}s`;
    } else {
      const min = Math.floor(diffSec / 60);
      const sec = diffSec % 60;
      return `${min}m ${sec}s`;
    }
  };
  
  return (
    <div className={`${className} p-4 bg-gray-50 rounded-lg`}>
      <h3 className="text-lg font-medium mb-2">Scan QR Code to Login</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-56">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {status === 'pending' && qrCodeUrl && (
            <div className="text-center">
              <div className="max-w-xs mx-auto mb-4 border-4 border-white rounded-lg overflow-hidden shadow-md">
                <img src={qrCodeUrl} alt="QR Code for authentication" className="w-full" />
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                Scan this QR code with the DegenDuel app on your mobile device.
              </p>
              
              {expiresAt && (
                <p className="text-xs text-gray-500">
                  Expires in {getRemainingTime()}
                </p>
              )}
              
              <button
                onClick={generateQRCode}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Generate New Code
              </button>
              
              <button
                onClick={cancelAuthentication}
                className="mt-2 px-4 py-2 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
          
          {status === 'approved' && (
            <div className="text-center py-4">
              <div className="animate-pulse flex justify-center">
                <div className="h-16 w-16 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-medium mt-4">Authentication Approved!</h4>
              <p className="text-gray-600">Completing login...</p>
            </div>
          )}
          
          {status === 'completed' && (
            <div className="text-center py-4">
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-medium mt-4">Successfully Authenticated!</h4>
              <p className="text-gray-600">You are now logged in.</p>
            </div>
          )}
          
          {status === 'cancelled' && (
            <div className="text-center py-4">
              <p className="text-gray-600">Authentication cancelled.</p>
              <button
                onClick={generateQRCode}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="text-center py-4">
              <p className="text-gray-600">QR code expired.</p>
              <button
                onClick={generateQRCode}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Generate New Code
              </button>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How it works</h4>
        <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
          <li>Scan this QR code with the DegenDuel app on your mobile device</li>
          <li>Approve the login on your mobile device</li>
          <li>You'll be automatically logged in on this device</li>
        </ol>
      </div>
    </div>
  );
};

export default QRCodeAuth;