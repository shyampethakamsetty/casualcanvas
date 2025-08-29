"use client";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import ReactFlow, {
  applyNodeChanges,
  applyEdgeChanges, 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  Edge, 
  Node,
  NodeChange,
  EdgeChange,
  NodeTypes,
  Handle,
  Position,
  BackgroundVariant,
  useReactFlow
} from "reactflow";
import 'reactflow/dist/style.css';

// Define the node data interface
interface NodeData {
  label: string;
  type: string;
  config?: Record<string, any>;
}

// Canvas props interface
interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeSelect?: (node: Node | null) => void;
}

// Custom Node Components with Clickable Delete Button
const IngestNode = ({ data, selected, id }: { data: NodeData; selected: boolean; id: string }) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Remove the node
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    
    // Remove connected edges
    setEdges((edges) => edges.filter((edge) => 
      edge.source !== id && edge.target !== id
    ));
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 ${selected ? 'border-blue-500' : 'border-blue-200'} relative group`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div className="text-blue-600">📄</div>
        <div>
          <div className="font-bold text-blue-900">{data.label}</div>
          <div className="text-xs text-blue-600">{data.type}</div>
        </div>
      </div>
      {selected && (
        <button
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 opacity-90 hover:opacity-100 transition-all nodrag"
          onClick={handleDelete}
          title="Delete this node"
        >
          ×
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const AINode = ({ data, selected, id }: { data: NodeData; selected: boolean; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Remove the node
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    
    // Remove connected edges
    setEdges((edges) => edges.filter((edge) => 
      edge.source !== id && edge.target !== id
    ));
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 ${selected ? 'border-purple-500' : 'border-purple-200'} relative group`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div className="text-purple-600">🤖</div>
        <div>
          <div className="font-bold text-purple-900">{data.label}</div>
          <div className="text-xs text-purple-600">{data.type}</div>
        </div>
      </div>
      {selected && (
        <button
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 opacity-90 hover:opacity-100 transition-all nodrag"
          onClick={handleDelete}
          title="Delete this node"
        >
          ×
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const ActionNode = ({ data, selected, id }: { data: NodeData; selected: boolean; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Remove the node
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    
    // Remove connected edges
    setEdges((edges) => edges.filter((edge) => 
      edge.source !== id && edge.target !== id
    ));
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-green-50 border-2 ${selected ? 'border-green-500' : 'border-green-200'} relative group`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div className="text-green-600">⚡</div>
        <div>
          <div className="font-bold text-green-900">{data.label}</div>
          <div className="text-xs text-green-600">{data.type}</div>
        </div>
      </div>
      {selected && (
        <button
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 opacity-90 hover:opacity-100 transition-all nodrag"
          onClick={handleDelete}
          title="Delete this node"
        >
          ×
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Custom Edge Component with Delete Button
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, selected }: any) => {
  const { setEdges } = useReactFlow();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const edgePath = `M${sourceX},${sourceY} C${sourceX},${sourceY + 50} ${targetX},${targetY - 50} ${targetX},${targetY}`;
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${selected ? 'stroke-red-500' : 'stroke-gray-400'} stroke-2 fill-none`}
        d={edgePath}
      />
      {selected && (
        <foreignObject
          width={20}
          height={20}
          x={centerX - 10}
          y={centerY - 10}
          className="overflow-visible"
        >
          <button
            className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 transition-all border border-white shadow-md"
            onClick={handleDelete}
            title="Delete this connection"
          >
            ×
          </button>
        </foreignObject>
      )}
    </>
  );
};

// Node types configuration
const nodeTypes: NodeTypes = {
  ingest: IngestNode,
  ai: AINode,
  action: ActionNode,
};

// Edge types configuration
const edgeTypes = {
  default: CustomEdge,
};

// Inner component that has access to useReactFlow hook
function CanvasInner({ 
  nodes, 
  edges, 
  setNodes, 
  setEdges, 
  onNodeSelect 
}: CanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds: any) => addEdge(params, eds)), 
    [setEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle node selection
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(selectedNodes.map(node => node.id));
    setSelectedEdges(selectedEdges.map(edge => edge.id));
    
    // Notify parent component of node selection
    if (onNodeSelect) {
      onNodeSelect(selectedNodes.length > 0 ? selectedNodes[0] : null);
    }
  }, [onNodeSelect]);

  // Delete selected nodes and edges (keyboard only now, since UI has click handlers)
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
      // Also remove edges connected to deleted nodes
      setEdges((eds) => eds.filter((edge) => 
        !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
      ));
      setSelectedNodes([]);
    }
    
    if (selectedEdges.length > 0) {
      setEdges((eds) => eds.filter((edge) => !selectedEdges.includes(edge.id)));
      setSelectedEdges([]);
    }
  }, [selectedNodes, selectedEdges, setNodes, setEdges]);

  // Handle keyboard events for deletion (backup method)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelected]);

  // Handle drag and drop for adding new nodes
  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    
    const type = ev.dataTransfer.getData("application/node-type");
    if (!type) return;

    // Get the position relative to the ReactFlow canvas
    const position = screenToFlowPosition({
      x: ev.clientX,
      y: ev.clientY,
    });

    const id = `n_${Date.now()}`;
    
    // Determine node category and type
    let nodeType = "default";
    let nodeData: NodeData = { label: type, type: type };
    
    if (type.startsWith("ingest.")) {
      nodeType = "ingest";
      nodeData = { 
        label: type.replace("ingest.", "").toUpperCase(), 
        type: type,
        config: {}
      };
    } else if (type.startsWith("ai.") || type.startsWith("text.")) {
      nodeType = "ai";
      nodeData = { 
        label: type.replace("ai.", "").replace("text.", "").toUpperCase(), 
        type: type,
        config: {}
      };
    } else if (type.startsWith("act.")) {
      nodeType = "action";
      nodeData = { 
        label: type.replace("act.", "").toUpperCase(), 
        type: type,
        config: {}
      };
    }

    const newNode: Node = {
      id,
      type: nodeType,
      position,
      data: nodeData,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div 
      className="h-full w-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={null} // We handle deletion manually
        multiSelectionKeyCode={['Meta', 'Shift']}
        fitView
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      {/* Floating Selection Toolbar */}
      {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-2 flex items-center gap-3 z-10">
          <div className="text-sm text-gray-600">
            {selectedNodes.length > 0 && (
              <span>{selectedNodes.length} node{selectedNodes.length > 1 ? 's' : ''}</span>
            )}
            {selectedNodes.length > 0 && selectedEdges.length > 0 && <span>, </span>}
            {selectedEdges.length > 0 && (
              <span>{selectedEdges.length} connection{selectedEdges.length > 1 ? 's' : ''}</span>
            )}
            <span> selected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={deleteSelected}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
              title="Delete selected items"
            >
              🗑️ Delete
            </button>
            
            <button
              onClick={() => {
                setSelectedNodes([]);
                setSelectedEdges([]);
                if (onNodeSelect) onNodeSelect(null);
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Deletion Instructions */}
      {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <span>Click ❌ on items, use toolbar above, or press</span>
            <kbd className="bg-gray-600 px-1 rounded">Delete</kbd>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Canvas component with ReactFlow provider wrapper
export default function Canvas(props: CanvasProps) {
  return (
    <div className="h-full w-full">
      <CanvasInner {...props} />
    </div>
  );
}
