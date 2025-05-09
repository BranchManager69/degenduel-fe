// src/pages/public/general/BiometricAuthDemo.tsx

import React, { useState, useEffect } from 'react';
import { BackgroundEffects } from '../../../components/animated-background/BackgroundEffects';
import BiometricAuthButton from '../../../components/auth/BiometricAuthButton';
import BiometricCredentialManager from '../../../components/auth/BiometricCredentialManager';
import QRCodeAuth from '../../../components/auth/QRCodeAuth';
import { useStore } from '../../../store/useStore';

/**
 * BiometricAuthDemo - A page demonstrating the biometric authentication features
 */
const BiometricAuthDemo: React.FC = () => {
  const { user } = useStore();
  const [authMode, setAuthMode] = useState<'register' | 'authenticate'>('register');
  const [authType, setAuthType] = useState<'platform' | 'cross-platform'>('platform');
  const [buttonStyle, setButtonStyle] = useState<'default' | 'minimal' | 'icon-only'>('default');
  const [showIndicator, setShowIndicator] = useState(true);
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [statusMessage, setStatusMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'button' | 'credentials' | 'qrcode'>('button');

  // Check if platform authenticator is available
  useEffect(() => {
    async function checkAvailability() {
      if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
      } else {
        setIsAvailable(false);
      }
    }
    
    checkAvailability();
  }, []);

  const handleSuccess = () => {
    setStatusMessage(`${authMode === 'register' ? 'Registration' : 'Authentication'} successful!`);
  };

  const handleError = (error: string) => {
    setStatusMessage(`Error: ${error}`);
  };

  const handleAvailabilityChange = (available: boolean) => {
    setIsAvailable(available);
  };

  return (
    <>
      <BackgroundEffects />
      <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Passkeys & QR Code Authentication Demo
          </h1>
          <p className="text-gray-300 mb-8">
            This page demonstrates the passkey and QR code authentication features available in DegenDuel.
          </p>

          {/* Card with demo content */}
          <div className="bg-dark-300/60 backdrop-blur-md rounded-xl p-6 border border-brand-500/20 shadow-xl">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-700 mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'button' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('button')}
              >
                Button Demo
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'credentials' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('credentials')}
              >
                Credentials Manager
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'qrcode' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('qrcode')}
              >
                QR Code Auth
              </button>
            </div>
          
            {/* Status display */}
            {activeTab === 'button' && isAvailable === false && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-amber-300 font-bold mb-2">Biometric Authentication Not Available</h3>
                <p className="text-amber-100">
                  Your device or browser doesn't support biometric authentication. 
                  Try using a device with Face ID, Touch ID, or Windows Hello.
                </p>
              </div>
            )}
            
            {activeTab === 'button' && statusMessage && (
              <div className={`border rounded-lg p-4 mb-6 ${
                statusMessage.includes('Error') 
                  ? 'bg-red-500/20 border-red-500/30 text-red-300' 
                  : 'bg-green-500/20 border-green-500/30 text-green-300'
              }`}>
                <p>{statusMessage}</p>
              </div>
            )}

            {activeTab === 'button' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Configuration panel */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Configuration</h3>
                
                <div className="space-y-4">
                  {/* Authentication mode */}
                  <div>
                    <label className="block text-gray-300 mb-2">Authentication Mode</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="authMode"
                          value="register"
                          checked={authMode === 'register'}
                          onChange={() => setAuthMode('register')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Register</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="authMode"
                          value="authenticate"
                          checked={authMode === 'authenticate'}
                          onChange={() => setAuthMode('authenticate')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Authenticate</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Authenticator type */}
                  <div>
                    <label className="block text-gray-300 mb-2">Authenticator Type</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="authType"
                          value="platform"
                          checked={authType === 'platform'}
                          onChange={() => setAuthType('platform')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Platform (Face ID, Touch ID, Windows Hello)</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="authType"
                          value="cross-platform"
                          checked={authType === 'cross-platform'}
                          onChange={() => setAuthType('cross-platform')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Cross-Platform (Security Keys)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Button style */}
                  <div>
                    <label className="block text-gray-300 mb-2">Button Style</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="buttonStyle"
                          value="default"
                          checked={buttonStyle === 'default'}
                          onChange={() => setButtonStyle('default')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Default</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="buttonStyle"
                          value="minimal"
                          checked={buttonStyle === 'minimal'}
                          onChange={() => setButtonStyle('minimal')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Minimal</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="buttonStyle"
                          value="icon-only"
                          checked={buttonStyle === 'icon-only'}
                          onChange={() => setButtonStyle('icon-only')}
                          className="mr-2"
                        />
                        <span className="text-gray-200">Icon Only</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Show availability indicator */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showIndicator}
                        onChange={(e) => setShowIndicator(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-gray-200">Show Availability Indicator</span>
                    </label>
                  </div>
                  
                  {/* User information */}
                  <div>
                    <label className="block text-gray-300 mb-2">Wallet Address</label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address"
                      className="w-full bg-dark-400 border border-gray-700 rounded px-3 py-2 text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-2">Nickname (optional)</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter nickname"
                      className="w-full bg-dark-400 border border-gray-700 rounded px-3 py-2 text-gray-300"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview panel */}
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4">Preview</h3>
                
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-dark-400/30 rounded-lg border border-gray-700">
                  <div className={buttonStyle === 'default' ? 'w-64' : buttonStyle === 'minimal' ? 'w-40' : 'w-auto'}>
                    <BiometricAuthButton
                      mode={authMode}
                      buttonStyle={buttonStyle}
                      authenticatorType={authType}
                      walletAddress={walletAddress}
                      nickname={nickname}
                      showAvailabilityIndicator={showIndicator}
                      onSuccess={handleSuccess}
                      onError={handleError}
                      onAvailabilityChange={handleAvailabilityChange}
                    />
                  </div>
                </div>
                
                {/* Device compatibility information */}
                <div className="mt-6 bg-dark-400/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-bold text-gray-200 mb-2">Device Compatibility</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="text-gray-300">
                      <span className="text-green-400">✓</span> iOS/Safari: Face ID, Touch ID (iOS 14+)
                    </li>
                    <li className="text-gray-300">
                      <span className="text-green-400">✓</span> Android/Chrome: Fingerprint sensors (Android 7+)
                    </li>
                    <li className="text-gray-300">
                      <span className="text-green-400">✓</span> Windows/Edge: Windows Hello
                    </li>
                    <li className="text-gray-300">
                      <span className="text-green-400">✓</span> macOS/Safari: Touch ID on supported MacBooks
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'credentials' && (
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Passkey Credentials Manager</h2>
                <BiometricCredentialManager className="bg-opacity-20" />
              </div>
            )}

            {activeTab === 'qrcode' && (
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">QR Code Authentication</h2>
                <div className="max-w-md mx-auto">
                  <QRCodeAuth
                    onSuccess={() => setStatusMessage('QR code authentication successful!')} 
                    onError={(error) => setStatusMessage(`Error: ${error}`)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BiometricAuthDemo;