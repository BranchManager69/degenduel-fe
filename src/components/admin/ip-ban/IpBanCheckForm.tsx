// src/components/admin/ip-ban/IpBanCheckForm.tsx

import React, { useState } from 'react';
import { admin } from '../../../services/api/admin';
import { IpBan } from '../../../types';
import { IpBanDetailsModal } from './IpBanDetailsModal';

export const IpBanCheckForm: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banResult, setBanResult] = useState<{
    isBanned: boolean;
    banDetails: IpBan | null;
  } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Validate IP address format
  const isValidIpAddress = (ip: string) => {
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipv4Pattern.test(ip)) return false;
    
    const octets = ip.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBanResult(null);

    // Validate IP address
    if (!isValidIpAddress(ipAddress)) {
      setError('Please enter a valid IPv4 address');
      return;
    }

    try {
      setLoading(true);
      const response = await admin.ipBan.check(ipAddress);
      
      setBanResult({
        isBanned: response.is_banned,
        banDetails: response.ban_details || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check IP status');
    } finally {
      setLoading(false);
    }
  };

  const viewBanDetails = () => {
    if (banResult?.banDetails) {
      setIsDetailsModalOpen(true);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* IP Address Input */}
        <div>
          <label htmlFor="checkIpAddress" className="block text-sm font-medium text-gray-400 mb-1">
            IP Address
          </label>
          <div className="flex">
            <input
              type="text"
              id="checkIpAddress"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Enter IP address to check"
              className="flex-1 px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-l-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-r-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </div>
      </form>

      {/* Results display */}
      {banResult && (
        <div className={`mt-4 p-3 rounded ${
          banResult.isBanned 
            ? 'bg-red-500/10 border border-red-500/20' 
            : 'bg-green-500/10 border border-green-500/20'
        }`}>
          {banResult.isBanned ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-red-400">
                  <span className="font-semibold">{ipAddress}</span> is banned
                </p>
                <button
                  onClick={viewBanDetails}
                  className="text-xs px-2 py-1 bg-dark-300/50 text-brand-400 rounded hover:bg-dark-300 transition-colors"
                >
                  View Details
                </button>
              </div>
              {banResult.banDetails && (
                <div className="mt-2 text-xs text-gray-400">
                  <p><span className="text-gray-500">Reason:</span> {banResult.banDetails.reason.substring(0, 50)}...</p>
                  <p><span className="text-gray-500">Type:</span> {banResult.banDetails.is_permanent ? 'Permanent' : 'Temporary'}</p>
                  {!banResult.banDetails.is_permanent && banResult.banDetails.expires_at && (
                    <p><span className="text-gray-500">Expires:</span> {new Date(banResult.banDetails.expires_at).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-green-400">
              <span className="font-semibold">{ipAddress}</span> is not banned
            </p>
          )}
        </div>
      )}

      {/* Ban Details Modal */}
      {banResult?.banDetails && (
        <IpBanDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          ban={banResult.banDetails}
        />
      )}
    </div>
  );
};