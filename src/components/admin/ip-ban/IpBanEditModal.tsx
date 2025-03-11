// src/components/admin/ip-ban/IpBanEditModal.tsx

import React, { useState } from 'react';
import { IpBan, IpBanUpdateParams } from '../../../types';
import { admin } from '../../../services/api/admin';
import { toast } from 'react-hot-toast';

interface IpBanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ban: IpBan;
  onBanUpdated: () => void;
}

export const IpBanEditModal: React.FC<IpBanEditModalProps> = ({
  isOpen,
  onClose,
  ban,
  onBanUpdated
}) => {
  const [reason, setReason] = useState(ban.reason);
  const [isPermanent, setIsPermanent] = useState(ban.is_permanent);
  const [expiresAt, setExpiresAt] = useState<string>(
    ban.expires_at ? new Date(ban.expires_at).toISOString().substring(0, 16) : ''
  );
  const [trollLevel, setTrollLevel] = useState(ban.troll_level);
  const [metadataJson, setMetadataJson] = useState(
    ban.metadata ? JSON.stringify(ban.metadata, null, 2) : '{}'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    if (!isPermanent && !expiresAt) {
      setError('Expiration date is required for temporary bans');
      return;
    }

    // Parse metadata JSON
    let metadata;
    try {
      metadata = metadataJson ? JSON.parse(metadataJson) : {};
    } catch (err) {
      setError('Invalid JSON in metadata field');
      return;
    }

    // Prepare update data
    const updateData: IpBanUpdateParams = {
      reason,
      is_permanent: isPermanent,
      troll_level: trollLevel,
      metadata
    };

    // Only include expires_at if not permanent
    if (!isPermanent) {
      updateData.expires_at = new Date(expiresAt).toISOString();
    }

    try {
      setLoading(true);
      await admin.ipBan.update(ban.id, updateData);
      toast.success('IP ban updated successfully');
      onBanUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update IP ban');
      toast.error('Failed to update IP ban');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-dark-200 border border-dark-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 p-4 border-b border-dark-300 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit IP Ban</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* IP Address (non-editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              IP Address
            </label>
            <input
              type="text"
              value={ban.ip_address}
              disabled
              className="w-full px-3 py-2 bg-dark-300/50 border border-dark-300 rounded-md text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">IP addresses cannot be edited. Create a new ban instead.</p>
          </div>

          {/* Ban Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-400 mb-1">
              Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Ban Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Ban Type
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="permanent"
                  checked={isPermanent}
                  onChange={() => setIsPermanent(true)}
                  className="mr-2"
                />
                <label htmlFor="permanent" className="text-white">
                  Permanent Ban
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="temporary"
                  checked={!isPermanent}
                  onChange={() => setIsPermanent(false)}
                  className="mr-2"
                />
                <label htmlFor="temporary" className="text-white">
                  Temporary Ban
                </label>
              </div>
            </div>
          </div>

          {/* Expiration Date (only for temporary bans) */}
          {!isPermanent && (
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-400 mb-1">
                Expires At *
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
                className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <p className="mt-1 text-xs text-gray-500">Set when this ban should automatically expire.</p>
            </div>
          )}

          {/* Troll Level */}
          <div>
            <label htmlFor="trollLevel" className="block text-sm font-medium text-gray-400 mb-1">
              Troll Level
            </label>
            <select
              id="trollLevel"
              value={trollLevel}
              onChange={(e) => setTrollLevel(Number(e.target.value))}
              className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              <option value={1}>Level 1 - Basic</option>
              <option value={2}>Level 2 - Moderate</option>
              <option value={3}>Level 3 - High</option>
              <option value={4}>Level 4 - Severe</option>
              <option value={5}>Level 5 - Maximum</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Determines how the ban is presented to the user.</p>
          </div>

          {/* Metadata (JSON) */}
          <div>
            <label htmlFor="metadata" className="block text-sm font-medium text-gray-400 mb-1">
              Metadata (JSON)
            </label>
            <textarea
              id="metadata"
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="{}"
            />
            <p className="mt-1 text-xs text-gray-500">Additional JSON metadata for this ban. Must be valid JSON.</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-dark-300 text-white rounded hover:bg-dark-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Updating...' : 'Update Ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};