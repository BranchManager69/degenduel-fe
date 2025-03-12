import React, { useEffect, useState } from "react";

import { BanIPButton } from "./BanIPButton";
import { BanOnSightButton } from "./BanOnSightButton";
import { adminService } from "../../services/adminService";
import { AdminActivity, AdminActivityFilters } from "../../types/admin";

interface ActivityMonitorProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ActivityMonitor: React.FC<ActivityMonitorProps> = ({
  limit = 10,
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    try {
      setError(null);
      const filters: AdminActivityFilters = { limit, offset };
      const response = await adminService.getActivities(filters);
      setActivities(response.activities);
      setTotal(response.pagination.total);
    } catch (err) {
      setError("Failed to fetch admin activities");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit, offset]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, limit, offset]);

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset - limit >= 0) {
      setOffset(offset - limit);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-dark-300/20 rounded">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-200 border border-dark-300 rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-dark-300">
        <h3 className="text-lg font-medium text-gray-100">Recent Activities</h3>
        <button
          onClick={fetchActivities}
          className="px-3 py-1 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="w-full">
        <table className="w-full">
          <thead className="bg-dark-300/50">
            <tr>
              <th className="w-44 px-4 py-2 text-left text-sm font-medium text-gray-400 whitespace-nowrap">
                Time
              </th>
              <th className="w-36 px-4 py-2 text-left text-sm font-medium text-gray-400 whitespace-nowrap">
                Admin
              </th>
              <th className="w-32 px-4 py-2 text-left text-sm font-medium text-gray-400 whitespace-nowrap">
                Action
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 whitespace-nowrap">
                Details
              </th>
              <th className="w-32 px-4 py-2 text-left text-sm font-medium text-gray-400 whitespace-nowrap">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="border-t border-dark-300 hover:bg-dark-300/50"
              >
                <td className="px-4 py-2 text-gray-300 text-sm whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleString()}
                </td>
                <td
                  className="px-4 py-2 text-gray-300 text-sm font-mono whitespace-nowrap"
                  title={activity.admin_address || "System"}
                >
                  {activity.admin_address
                    ? `${activity.admin_address.slice(
                        0,
                        6,
                      )}...${activity.admin_address.slice(-4)}`
                    : "System"}
                </td>
                <td
                  className="px-4 py-2 text-gray-300 text-sm whitespace-nowrap"
                  title={activity.action}
                >
                  <div className="flex items-center gap-2">
                    <span>{activity.action}</span>
                    {/* If this is a user-related action, extract wallet and add ban button */}
                    {(activity.action === "user.login" ||
                      activity.action === "user.register" ||
                      activity.action === "user.update") &&
                      activity.details &&
                      typeof activity.details === "object" &&
                      "wallet_address" in activity.details && (
                        <BanOnSightButton
                          user={{
                            wallet_address: activity.details
                              .wallet_address as string,
                            nickname:
                              "nickname" in activity.details
                                ? (activity.details.nickname as string)
                                : undefined,
                          }}
                          size="sm"
                          variant="icon"
                          onSuccess={fetchActivities}
                        />
                      )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300 text-sm">
                  <div
                    className="truncate"
                    title={
                      typeof activity.details === "string"
                        ? activity.details
                        : JSON.stringify(activity.details)
                    }
                  >
                    {typeof activity.details === "string"
                      ? activity.details
                      : JSON.stringify(activity.details)}
                  </div>
                </td>
                <td
                  className="px-4 py-2 text-gray-300 text-sm font-mono whitespace-nowrap"
                  title={activity.ip_address}
                >
                  <div className="flex items-center gap-2">
                    <span>{activity.ip_address}</span>
                    {activity.ip_address && (
                      <BanIPButton
                        ipAddress={activity.ip_address}
                        size="sm"
                        variant="icon"
                        onSuccess={fetchActivities}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="p-4 border-t border-dark-300 flex justify-between items-center">
          <button
            onClick={handlePrevPage}
            disabled={offset === 0}
            className="px-3 py-1 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400">
            {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={handleNextPage}
            disabled={offset + limit >= total}
            className="px-3 py-1 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
