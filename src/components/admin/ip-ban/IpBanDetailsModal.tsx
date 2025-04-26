// src/components/admin/ip-ban/IpBanDetailsModal.tsx

import React from "react";

import { IpBan } from "../../../types";

interface IpBanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ban: IpBan;
}

export const IpBanDetailsModal: React.FC<IpBanDetailsModalProps> = ({
  isOpen,
  onClose,
  ban,
}) => {
  if (!isOpen) return null;

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Format JSON for display
  const formatJson = (json: any) => {
    if (!json) return "None";
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-dark-200 border border-dark-300 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 p-4 border-b border-dark-300 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">IP Ban Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-dark-300 pb-2">
              Basic Information
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  IP Address
                </dt>
                <dd className="mt-1 text-white font-mono">{ban.ip_address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Ban ID</dt>
                <dd className="mt-1 text-white font-mono">{ban.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  Created By
                </dt>
                <dd className="mt-1 text-white">
                  {ban.created_by || "System"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  Created At
                </dt>
                <dd className="mt-1 text-white">
                  {formatDate(ban.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  Updated At
                </dt>
                <dd className="mt-1 text-white">
                  {formatDate(ban.updated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Type</dt>
                <dd className="mt-1">
                  {ban.is_permanent ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                      Permanent Ban
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
                      Temporary Ban
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  Expires At
                </dt>
                <dd className="mt-1 text-white">
                  {ban.is_permanent ? "Never" : formatDate(ban.expires_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">
                  Troll Level
                </dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      ban.troll_level >= 4
                        ? "bg-red-500/20 text-red-400"
                        : ban.troll_level >= 3
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    Level {ban.troll_level}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-400">Attempts</dt>
                <dd className="mt-1 text-white">{ban.num_attempts || 0}</dd>
              </div>
            </dl>
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-dark-300 pb-2">
              Ban Reason
            </h3>
            <div className="bg-dark-300/30 p-3 rounded-lg border border-dark-300">
              <p className="text-white whitespace-pre-wrap">{ban.reason}</p>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-dark-300 pb-2">
              Additional Metadata
            </h3>
            <div className="bg-dark-300/30 p-3 rounded-lg border border-dark-300">
              <pre className="text-white font-mono text-sm overflow-x-auto">
                {formatJson(ban.metadata)}
              </pre>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-dark-200 p-4 border-t border-dark-300 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-300 text-white rounded hover:bg-dark-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
