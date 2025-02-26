import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../../../store/useStore';
import { ServiceNode } from '../../../hooks/useSkyDuelWebSocket';

// Custom node component
const ServiceNodeComponent: React.FC<{ data: any }> = ({ data }) => {
  const getStatusColor = (status: ServiceNode['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-red-500';
      case 'restarting':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-xl shadow-lg border ${data.selected ? 'border-brand-400' : 'border-dark-600'} bg-dark-700/90 min-w-[180px]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)}`}></div>
          <div className="font-semibold text-brand-100 truncate max-w-[120px]">{data.label}</div>
        </div>
        <div className="text-xs px-1.5 py-0.5 rounded bg-dark-600 text-gray-300">{data.type}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-3">
        <div className="text-gray-400">Health:</div>
        <div className="text-right text-brand-300">{data.health}%</div>
        
        <div className="text-gray-400">CPU:</div>
        <div className="text-right text-brand-300">{data.metrics.cpu}%</div>
        
        <div className="text-gray-400">Memory:</div>
        <div className="text-right text-brand-300">{data.metrics.memory}%</div>
        
        <div className="text-gray-400">Errors:</div>
        <div className="text-right text-brand-300">{data.metrics.errorRate}%</div>
      </div>
    </div>
  );
};

// Node types mapping
const nodeTypes: NodeTypes = {
  serviceNode: ServiceNodeComponent,
};

// Main ServiceGraph component
export const ServiceGraph: React.FC = () => {
  const { skyDuel, setSkyDuelSelectedNode } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Convert SkyDuel nodes and connections to ReactFlow format
  useEffect(() => {
    if (!skyDuel.nodes.length) return;
    
    // Create nodes
    const graphNodes: Node[] = skyDuel.nodes.map((node) => ({
      id: node.id,
      type: 'serviceNode',
      position: { 
        // Generate deterministic positions based on node id
        x: (node.id.charCodeAt(0) * 10) % 800 + 50,
        y: (node.id.charCodeAt(1) * 15) % 400 + 50
      },
      data: {
        ...node,
        label: node.name,
        selected: node.id === skyDuel.selectedNode,
      },
    }));
    
    // Create edges
    const graphEdges: Edge[] = skyDuel.connections.map((conn) => {
      let edgeStyle: any = {};
      let markerType = MarkerType.Arrow;
      let lineStyle = 'default';
      
      switch (conn.status) {
        case 'active':
          edgeStyle = { stroke: '#22c55e' }; // Emerald-500
          break;
        case 'degraded':
          edgeStyle = { stroke: '#f59e0b' }; // Amber-500
          lineStyle = 'step';
          break;
        case 'failed':
          edgeStyle = { stroke: '#ef4444' }; // Red-500
          lineStyle = 'straight';
          break;
        default:
          edgeStyle = { stroke: '#94a3b8' }; // Slate-400
      }
      
      return {
        id: `${conn.source}-${conn.target}`,
        source: conn.source,
        target: conn.target,
        markerEnd: { type: markerType },
        type: lineStyle,
        animated: conn.status === 'active',
        style: edgeStyle,
        data: { 
          latency: conn.latency,
          throughput: conn.throughput,
          status: conn.status,
        },
      };
    });
    
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [skyDuel.nodes, skyDuel.connections, skyDuel.selectedNode, setNodes, setEdges]);
  
  // Handle node click to show details
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSkyDuelSelectedNode(node.id);
  }, [setSkyDuelSelectedNode]);

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
      >
        <Background color="#4a5568" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};