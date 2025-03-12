// src/pages/admin/ip-ban/IpBanManagementPage.tsx

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { IpBanCheckForm } from "../../../components/admin/ip-ban/IpBanCheckForm";
import { IpBanFilter } from "../../../components/admin/ip-ban/IpBanFilter";
import { IpBanList } from "../../../components/admin/ip-ban/IpBanList";
import { NewIpBanForm } from "../../../components/admin/ip-ban/NewIpBanForm";
import { admin } from "../../../services/api/admin";
import { IpBan, IpBanParams } from "../../../types";

const IpBanManagementPage: React.FC = () => {
  const [bans, setBans] = useState<IpBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<IpBanParams>({
    page: 1,
    limit: 20,
    sort: "created_at",
    order: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchBans = async (queryParams: IpBanParams = params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await admin.ipBan.list(queryParams);

      setBans(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load IP bans");
      toast.error("Failed to load IP bans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBans();
  }, []);

  const handlePageChange = (page: number) => {
    const newParams = { ...params, page };
    setParams(newParams);
    fetchBans(newParams);
  };

  const handleFilterChange = (filterParams: Partial<IpBanParams>) => {
    const newParams = { ...params, ...filterParams, page: 1 }; // Reset to first page when filters change
    setParams(newParams);
    fetchBans(newParams);
  };

  const handleBanRemoved = (id: string) => {
    // Update the UI by removing the ban from the list
    setBans((prev) => prev.filter((ban) => ban.id !== id));

    // Refetch if the list might be empty after removal (for pagination purposes)
    if (bans.length <= 1 && pagination.page > 1) {
      handlePageChange(pagination.page - 1);
    } else {
      fetchBans();
    }
  };

  const handleBanAdded = () => {
    // Refresh the list when a new ban is added
    fetchBans();
    toast.success("IP ban added successfully");
  };

  const handleBanUpdated = () => {
    // Refresh the list when a ban is updated
    fetchBans();
    toast.success("IP ban updated successfully");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">IP Ban Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - ban list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Banned IPs</h2>

            {/* Filters */}
            <IpBanFilter onFilterChange={handleFilterChange} />

            {/* Ban List */}
            <IpBanList
              bans={bans}
              loading={loading}
              error={error}
              pagination={pagination}
              onPageChange={handlePageChange}
              onBanRemoved={handleBanRemoved}
              onBanUpdated={handleBanUpdated}
            />
          </div>
        </div>

        {/* Sidebar - actions */}
        <div className="space-y-6">
          {/* Check IP Ban Status */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-4">
              Check IP Status
            </h2>
            <IpBanCheckForm />
          </div>

          {/* Add New IP Ban */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-4">Ban New IP</h2>
            <NewIpBanForm onBanAdded={handleBanAdded} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpBanManagementPage;
