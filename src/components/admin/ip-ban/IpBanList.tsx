// src/components/admin/ip-ban/IpBanList.tsx

import React, { useState } from 'react';
import { IpBan } from '../../../types';
import { IpBanDetailsModal } from './IpBanDetailsModal';
import { IpBanEditModal } from './IpBanEditModal';
import { admin } from '../../../services/api/admin';
import { toast } from 'react-hot-toast';

interface IpBanListProps {
  bans: IpBan[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onBanRemoved: (id: string) => void;
  onBanUpdated: () => void;
}

export const IpBanList: React.FC<IpBanListProps> = ({
  bans,
  loading,
  error,
  pagination,
  onPageChange,
  onBanRemoved,
  onBanUpdated
}) => {
  const [selectedBan, setSelectedBan] = useState<IpBan | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveBan = async (id: string) => {
    // Confirm before removing
    if (!window.confirm('Are you sure you want to remove this IP ban?')) {
      return;
    }

    try {
      setRemovingId(id);
      await admin.ipBan.remove(id);
      toast.success('IP ban removed successfully');
      onBanRemoved(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove IP ban');
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewDetails = (ban: IpBan) => {
    setSelectedBan(ban);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (ban: IpBan) => {
    setSelectedBan(ban);
    setIsEditModalOpen(true);
  };

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const renderPagination = () => {
    const { page, totalPages } = pagination;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages} ({pagination.total} total)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm bg-dark-300 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm bg-dark-300 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading && bans.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent"></div>
        <p className="mt-2 text-gray-400">Loading IP bans...</p>
      </div>
    );
  }

  if (error && bans.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => onPageChange(pagination.page)}
            className="mt-2 px-4 py-2 bg-dark-300 text-white rounded hover:bg-dark-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (bans.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">No IP bans found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-300">
          <thead className="bg-dark-300/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Troll Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark-200/30 divide-y divide-dark-300">
            {bans.map((ban) => (
              <tr key={ban.id} className="hover:bg-dark-300/20 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-white">
                  {ban.ip_address}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  {ban.reason.length > 30 ? ban.reason.substring(0, 30) + '...' : ban.reason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {ban.is_permanent ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                      Permanent
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
                      Temporary
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                  {ban.is_permanent ? 'Never' : formatDate(ban.expires_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      ban.troll_level >= 4 ? 'bg-red-500/20 text-red-400' :
                      ban.troll_level >= 3 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    Level {ban.troll_level}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleViewDetails(ban)}
                    className="text-brand-400 hover:text-brand-300"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(ban)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveBan(ban.id)}
                    disabled={removingId === ban.id}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {removingId === ban.id ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && renderPagination()}

      {/* Details Modal */}
      {selectedBan && (
        <IpBanDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          ban={selectedBan}
        />
      )}

      {/* Edit Modal */}
      {selectedBan && (
        <IpBanEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          ban={selectedBan}
          onBanUpdated={onBanUpdated}
        />
      )}
    </div>
  );
};