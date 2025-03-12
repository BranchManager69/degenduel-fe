import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { toast } from "../../components/toast";

import { ServiceDebugPanel } from "../../components/admin/ServiceDebugPanel";
import { ServiceSwitch } from "../../components/admin/ServiceSwitch";
import { useServiceWebSocket } from "../../hooks/useServiceWebSocket";
import { useStore } from "../../store/useStore";

// Types
interface ServiceState {
  enabled: boolean;
  status: string;
  last_started: string | null;
  last_check?: string;
  stats?: {
    operations: {
      total: number;
      successful: number;
      failed: number;
    };
    performance: {
      averageOperationTimeMs: number;
    };
    circuitBreaker?: {
      failures: number;
      isOpen: boolean;
      lastFailure: string | null;
    };
  };
}

interface ServiceGroup {
  title: string;
  description: string;
  services: string[];
}

interface ServiceGroups {
  [key: string]: ServiceGroup;
}

// Service Groups Configuration
const SERVICE_GROUPS: ServiceGroups = {
  CORE: {
    title: "Core Services",
    description: "Essential system services",
    services: ["token_sync_service", "contest_evaluation_service"],
  },
  WALLET: {
    title: "Wallet Services",
    description: "Wallet and transaction management",
    services: ["wallet_rake_service", "admin_wallet_service"],
  },
  MONITORING: {
    title: "Monitoring Services",
    description: "System monitoring and analytics",
    services: ["analytics_service", "performance_monitor_service"],
  },
};

// Styled Components
const SwitchboardContainer = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
`;

const ServiceGroup = styled.div`
  background: #1a202c;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border: 1px solid rgba(49, 130, 206, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const GroupTitle = styled.h3`
  color: #e2e8f0;
  font-size: 1.2rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GroupDescription = styled.p`
  color: #a0aec0;
  font-size: 0.9rem;
  margin-bottom: 15px;
`;

const GroupStatus = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
  font-size: 0.8rem;
`;

const StatusDot = styled.div<{ $status: "healthy" | "warning" | "error" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) =>
    props.$status === "healthy"
      ? "#48BB78"
      : props.$status === "warning"
        ? "#ECC94B"
        : "#F56565"};
  box-shadow: 0 0 8px
    ${(props) =>
      props.$status === "healthy"
        ? "rgba(72, 187, 120, 0.5)"
        : props.$status === "warning"
          ? "rgba(236, 201, 75, 0.5)"
          : "rgba(245, 101, 101, 0.5)"};
`;

const SwitchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  justify-items: center;
  align-items: start;
  padding: 20px;
  background: rgba(45, 55, 72, 0.5);
  border-radius: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ServiceDetailsPanel = styled.div`
  background: #1a202c;
  border-radius: 15px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid rgba(49, 130, 206, 0.2);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(45, 55, 72, 0.5);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(49, 130, 206, 0.2);
`;

export const ServiceSwitchboard: React.FC = () => {
  const { services, setServices } = useStore();
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  useServiceWebSocket();

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/superadmin/services/states");
      const data = await response.json();
      if (data.success) {
        setServices(data.services as Record<string, ServiceState>);
      } else {
        toast.error("Failed to fetch service states");
      }
    } catch (error) {
      toast.error("Error fetching service states");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (serviceName: string) => {
    setToggleLoading(serviceName);
    try {
      const response = await fetch(
        `/api/superadmin/services/${serviceName}/toggle`,
        {
          method: "POST",
        },
      );
      const data = await response.json();
      if (!data.success) {
        toast.error("Failed to toggle service");
      }
    } catch (error) {
      toast.error("Error toggling service");
      console.error("Error:", error);
    } finally {
      setToggleLoading("");
    }
  };

  const getGroupStatus = (
    groupServices: string[],
  ): "healthy" | "warning" | "error" => {
    const statuses = groupServices.map((serviceName) => {
      const service = services[serviceName] as ServiceState | undefined;
      if (!service) return "unknown";
      if (service.status === "error") return "error";
      if (service.stats?.circuitBreaker?.isOpen) return "warning";
      return "healthy";
    });

    if (statuses.includes("error")) return "error";
    if (statuses.includes("warning")) return "warning";
    if (statuses.includes("unknown")) return "warning";
    return "healthy";
  };

  const getTotalStats = () => {
    const stats = {
      total: Object.keys(services).length,
      active: Object.values(services).filter((s) => s.enabled).length,
      errors: Object.values(services).filter((s) => s.status === "error")
        .length,
      warnings: Object.values(services).filter(
        (s) => s.stats?.circuitBreaker?.isOpen,
      ).length,
    };
    return stats;
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = getTotalStats();

  return (
    <SwitchboardContainer>
      {/* Stats Overview */}
      <StatsGrid>
        <StatCard>
          <div className="text-sm text-gray-400">Total Services</div>
          <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
        </StatCard>
        <StatCard>
          <div className="text-sm text-gray-400">Active Services</div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.active}
          </div>
        </StatCard>
        <StatCard>
          <div className="text-sm text-gray-400">Service Errors</div>
          <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
        </StatCard>
        <StatCard>
          <div className="text-sm text-gray-400">Circuit Breakers</div>
          <div className="text-2xl font-bold text-amber-400">
            {stats.warnings}
          </div>
        </StatCard>
      </StatsGrid>

      {/* Service Groups */}
      {Object.entries(SERVICE_GROUPS).map(([groupKey, group]) => {
        const groupStatus = getGroupStatus(group.services);

        return (
          <ServiceGroup key={groupKey}>
            <GroupTitle>
              {group.title}
              <GroupStatus>
                <StatusDot $status={groupStatus} />
                {groupStatus.toUpperCase()}
              </GroupStatus>
            </GroupTitle>
            <GroupDescription>{group.description}</GroupDescription>
            <SwitchGrid>
              {group.services.map((serviceName) => (
                <ServiceSwitch
                  key={serviceName}
                  name={serviceName}
                  enabled={services[serviceName]?.enabled}
                  onToggle={async () => {
                    try {
                      await handleToggle(serviceName);
                      toast.success(
                        `${serviceName} ${
                          services[serviceName]?.enabled
                            ? "disabled"
                            : "enabled"
                        } successfully`,
                      );
                    } catch (error) {
                      toast.error(`Failed to toggle ${serviceName}`);
                    }
                  }}
                  loading={toggleLoading === serviceName}
                />
              ))}
            </SwitchGrid>
          </ServiceGroup>
        );
      })}

      {/* Service Details Panel */}
      <ServiceDetailsPanel>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Service Details
        </h2>
        <div className="space-y-2">
          {Object.entries(services).map(([name, state]) => (
            <div
              key={name}
              className="bg-dark-300/30 rounded-lg p-4 hover:bg-dark-300/50 transition-colors cursor-pointer"
              onClick={() => setSelectedService(name)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">{name}</span>
                <span
                  className={`text-sm ${
                    state?.enabled ? "text-brand-400" : "text-red-400"
                  }`}
                >
                  {state?.status}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Last Started:{" "}
                {state?.last_started
                  ? new Date(state.last_started).toLocaleString()
                  : "Never"}
              </div>
              {state?.last_check && (
                <div className="text-sm text-gray-400">
                  Last Check: {new Date(state.last_check).toLocaleString()}
                </div>
              )}
              {state?.stats && (
                <div className="mt-2 text-sm">
                  <div className="text-brand-400">
                    Success Rate:{" "}
                    {(
                      (state.stats.operations.successful /
                        state.stats.operations.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-gray-400">
                    Avg Response:{" "}
                    {state.stats.performance.averageOperationTimeMs}ms
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ServiceDetailsPanel>

      {loading && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </motion.div>
      )}

      {/* Service Details Modal */}
      {selectedService && services[selectedService] && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            className="bg-dark-200 rounded-lg p-6 max-w-2xl w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              {selectedService}
            </h2>
            <pre className="bg-dark-300/50 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(services[selectedService], null, 2)}
            </pre>
          </motion.div>
        </motion.div>
      )}

      <ServiceDebugPanel />
    </SwitchboardContainer>
  );
};
