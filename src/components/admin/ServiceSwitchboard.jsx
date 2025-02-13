// src/components/admin/ServiceSwitchboard.jsx

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import ServiceSwitch from './ServiceSwitch';
import { useServiceWebSocket } from '../../hooks/useServiceWebSocket';
import { useStore } from '../../store/useStore';

// Define service groups
const SERVICE_GROUPS = {
    CORE: {
        title: 'Core Services',
        description: 'Essential system services',
        services: ['token_sync_service', 'contest_evaluation_service']
    },
    WALLET: {
        title: 'Wallet Services',
        description: 'Wallet and transaction management',
        services: ['wallet_rake_service', 'admin_wallet_service']
    },
    MONITORING: {
        title: 'Monitoring Services',
        description: 'System monitoring and analytics',
        services: ['analytics_service', 'performance_monitor_service']
    }
};

const SwitchboardContainer = styled.div`
    background: #1a202c;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.08);
    max-width: 800px;
    margin: 20px auto;
`;

const Title = styled.h2`
    color: #e2e8f0;
    text-align: center;
    margin-bottom: 30px;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
`;

const SwitchGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 20px;
    justify-items: center;
    align-items: start;
    padding: 20px;
    background: #2d3748;
    border-radius: 10px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const LoadingOverlay = styled(motion.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 15px;
`;

const ServiceGroup = styled.div`
    background: #2d3748;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    transition: all 0.3s ease;

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

const StatusDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => 
        props.$status === 'healthy' ? '#48BB78' :
        props.$status === 'warning' ? '#ECC94B' :
        '#F56565'};
    box-shadow: 0 0 8px ${props => 
        props.$status === 'healthy' ? 'rgba(72, 187, 120, 0.5)' :
        props.$status === 'warning' ? 'rgba(236, 201, 75, 0.5)' :
        'rgba(245, 101, 101, 0.5)'};
`;

const ServiceSwitchboard = () => {
    const { services, setServices } = useStore();
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState('');
    useServiceWebSocket(); // Initialize WebSocket connection

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/superadmin/services/states');
            const data = await response.json();
            if (data.success) {
                setServices(data.services);
            } else {
                toast.error('Failed to fetch service states');
            }
        } catch (error) {
            toast.error('Error fetching service states');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (serviceName) => {
        setToggleLoading(serviceName);
        try {
            const response = await fetch(`/api/superadmin/services/${serviceName}/toggle`, {
                method: 'POST'
            });
            const data = await response.json();
            if (!data.success) {
                toast.error('Failed to toggle service');
            }
        } catch (error) {
            toast.error('Error toggling service');
            console.error('Error:', error);
        } finally {
            setToggleLoading('');
        }
    };

    const getGroupStatus = (groupServices) => {
        const statuses = groupServices.map(serviceName => {
            const service = services[serviceName];
            if (!service) return 'unknown';
            if (service.status === 'error') return 'error';
            if (service.stats?.circuitBreaker?.isOpen) return 'warning';
            return 'healthy';
        });

        if (statuses.includes('error')) return 'error';
        if (statuses.includes('warning')) return 'warning';
        if (statuses.includes('unknown')) return 'warning';
        return 'healthy';
    };

    useEffect(() => {
        fetchServices();
    }, []);

    return (
        <SwitchboardContainer>
            <Title>Service Control Panel</Title>
            
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
                            {group.services.map(serviceName => (
                                <ServiceSwitch
                                    key={serviceName}
                                    name={serviceName}
                                    enabled={services[serviceName]?.enabled}
                                    state={services[serviceName]}
                                    onToggle={() => handleToggle(serviceName)}
                                    loading={toggleLoading === serviceName}
                                />
                            ))}
                        </SwitchGrid>
                    </ServiceGroup>
                );
            })}

            {loading && (
                <LoadingOverlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <span>Loading...</span>
                </LoadingOverlay>
            )}
        </SwitchboardContainer>
    );
};

export default ServiceSwitchboard;