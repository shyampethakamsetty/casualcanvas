"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Node, Edge, Connection, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowProvider } from "reactflow";
import { NodePalette } from "../../../../components/NodePalette";
import { Inspector } from "../../../../components/Inspector";
import Canvas from "../../../../components/Canvas";
import { api } from "../../../../lib/api";
import { RunPanel } from "../../../../components/RunPanel";
import { useAuth } from "../../../../lib/auth";

export default function WorkflowEditorPage(){
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{id: string}>();
  const wfId = params?.id || "new";
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<Node | null>(null);
  const [name, setName] = useState("Untitled Workflow");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [executionPanelHeight, setExecutionPanelHeight] = useState(320); // Default height in pixels
  const [isDragging, setIsDragging] = useState(false);

  // All hooks must be called before any conditional returns
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load workflow data
  useEffect(()=>{
    (async ()=>{
      if (wfId !== "new" && user) {
        const wf = await api.get(`/workflows/${wfId}`);
        if (!wf.error){
          setName(wf.name || "Untitled Workflow");
          setNodes((wf.nodes||[]).map((n:any)=>{
            // Determine the correct ReactFlow node type based on the data type
            let reactFlowType = "default";
            const dataType = n.type || n.config?.config?.type || "default";
            
            if (dataType.startsWith("ingest.")) {
              reactFlowType = "ingest";
            } else if (dataType.startsWith("ai.") || dataType.startsWith("text.")) {
              reactFlowType = "ai";
            } else if (dataType.startsWith("act.")) {
              reactFlowType = "action";
            }
            
            return {
              id: n.id, 
              type: reactFlowType,
              data: { 
                label: n.config?.config?.label || dataType.split('.').pop()?.toUpperCase() || "Node", 
                type: dataType,
                config: n.config?.config || {}
              }, 
              position: n.position || {x:50,y:50} 
            };
          }));
          setEdges((wf.edges||[]));
        }
      }
    })();
  }, [wfId, user]);

  // Auto-save when nodes or edges change (but not immediately to avoid spam)
  useEffect(() => {
    if (wfId !== "new" && nodes.length > 0) {
      setHasUnsavedChanges(true);
      const autoSaveTimer = setTimeout(() => {
        handleSave(false); // Auto-save without showing message
      }, 3000); // Auto-save after 3 seconds of no changes

      return () => clearTimeout(autoSaveTimer);
    }
  }, [nodes, edges, name]);

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNodeUpdate = (nodeId: string, partial: any) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              ...partial,
              data: {
                ...node.data,
                ...(partial.data || {}),
                // Ensure label updates are reflected properly
                label: partial.data?.label || node.data?.label
              }
            }
          : node
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleNodeDelete = () => {
    if (selected) {
      // Remove the node
      setNodes(nodes => nodes.filter(node => node.id !== selected.id));
      
      // Remove any edges connected to this node
      setEdges(edges => edges.filter(edge => 
        edge.source !== selected.id && edge.target !== selected.id
      ));
      
      // Clear selection
      setSelected(null);
    }
  };

  const handleSave = async (showMessage = true)=>{
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const wf = {
        name,
        nodes: nodes.map(n=>({ 
          id: n.id, 
          type: n.data?.type || n.type || "default", 
          position: n.position,
          config: {
            inputs: n.data?.inputs || [],
            outputs: n.data?.outputs || [],
            config: {
              ...(n.data?.config || {}),
              label: n.data?.label
            }
          }
        })),
        edges
      };
      
      console.log("DEBUG: Saving workflow data:", wf);
      
      if (wfId === "new"){
        const r = await api.post("/workflows", wf);
        window.location.href = `/workflows/${r.id}`;
      } else {
        await api.put(`/workflows/${wfId}`, wf);
        setHasUnsavedChanges(false);
        if (showMessage) {
          setSaveMessage("✅ Saved successfully");
          setTimeout(() => setSaveMessage(""), 3000);
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaveMessage("❌ Save failed");
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Draggable execution panel handlers
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const initialHeight = useRef<number>(320);
  const animationFrameRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    initialHeight.current = executionPanelHeight;
  }, [executionPanelHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Cancel previous animation frame to prevent stacking
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = initialHeight.current + deltaY;
      
      const minHeight = 60; // Minimum height (just header)
      const maxHeight = Math.min(600, window.innerHeight * 0.6); // Maximum height
      
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setExecutionPanelHeight(clampedHeight);
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
      document.body.classList.add('no-select');
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('no-select');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('no-select');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Now handle conditional rendering after all hooks
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      {/* Professional Workflow Editor - Takes remaining space after header */}
      <div className="h-full flex bg-secondary-50">
        
        {/* Left Sidebar - Node Palette */}
        <div className={`transition-all duration-300 border-r border-secondary-200/50 bg-white/80 backdrop-blur-sm ${
          isPaletteCollapsed ? 'w-12' : 'w-80'
        }`}>
          <NodePalette onCollapseChange={setIsPaletteCollapsed} />
        </div>

        {/* Center - Canvas Area with Header */}
        <div className="flex-1 flex flex-col min-w-0" ref={containerRef}>
          
          {/* Workflow Header Bar - Only above canvas */}
          <header className="bg-white/95 backdrop-blur-sm border-b border-secondary-200/50 shadow-soft flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-3">
              {/* Left: Breadcrumb & Workflow Name */}
              <div className="flex items-center gap-4">
                <Link href="/workflows" className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back to Workflows</span>
                </Link>
                
                <div className="w-px h-6 bg-secondary-200"></div>
                
                <div className="flex items-center gap-3">
                  <input 
                    className="bg-transparent text-lg font-semibold text-secondary-900 placeholder-secondary-400 border-none outline-none min-w-[200px]" 
                    value={name}
                onChange={(e)=>{
                  setName(e.target.value);
                  setHasUnsavedChanges(true);
                    }} 
                    placeholder="Untitled Workflow"
                  />
                  {hasUnsavedChanges && !isSaving && (
                    <div className="w-2 h-2 bg-warning-500 rounded-full" title="Unsaved changes"></div>
                  )}
                </div>
              </div>
              
              {/* Right: Actions & Status */}
              <div className="flex items-center gap-4">
                {/* Status Indicators */}
                <div className="flex items-center gap-3 text-sm">
                  {saveMessage && (
                    <span className="text-success-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {saveMessage}
                    </span>
                  )}
                  {wfId !== "new" && (
                    <span className="text-secondary-500">Auto-save • Ctrl+S</span>
                  )}
                </div>
                
                <div className="w-px h-6 bg-secondary-200"></div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
              <button 
                className={`btn-primary ${isSaving ? 'opacity-75' : ''}`} 
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save
                      </>
                    )}
              </button>
                </div>
              </div>
            </div>
          </header>

          {/* Canvas */}
          <div 
            className="flex-1 bg-gradient-to-br from-white to-secondary-50/30 relative"
            data-canvas-container
          >
              <Canvas 
                nodes={nodes} 
                edges={edges} 
                setNodes={setNodes} 
                setEdges={setEdges}
                onNodeSelect={setSelected}
              />
            </div>
          
          {/* Draggable Splitter */}
          <div
            className={`h-2 bg-gradient-to-r from-secondary-100 via-secondary-200 to-secondary-100 hover:from-primary-200 hover:via-primary-300 hover:to-primary-200 cursor-ns-resize transition-all duration-200 relative group border-t border-b border-secondary-200/30 flex-shrink-0 ${
              isDragging ? 'from-primary-300 via-primary-400 to-primary-300 shadow-lg' : ''
            }`}
            onMouseDown={handleMouseDown}
            title="Drag to resize execution panel"
          >
            {/* Grip Dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full transition-all duration-200 ${
                      isDragging 
                        ? 'bg-primary-600 scale-125' 
                        : 'bg-secondary-400 group-hover:bg-primary-500 group-hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Drag Handle Bar */}
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
              <div className={`h-0.5 rounded-full transition-all duration-200 ${
                isDragging 
                  ? 'bg-primary-500 w-16 shadow-md' 
                  : 'bg-secondary-400 w-12 group-hover:bg-primary-400 group-hover:w-14'
              }`} />
            </div>
          </div>
          
          {/* Bottom Panel - Run Workflow (Draggable Height) */}
          <div 
            className="border-t border-secondary-200/50 bg-white/90 backdrop-blur-sm overflow-hidden flex-shrink-0"
            style={{ height: `${executionPanelHeight}px` }}
          >
            <RunPanel 
              workflowId={String(wfId)} 
              height={executionPanelHeight}
            />
          </div>
        </div>

        {/* Right Sidebar - Inspector */}
          {selected && (
          <div className="w-96 border-l border-secondary-200/50 bg-white/80 backdrop-blur-sm">
            <Inspector 
              selectedNode={selected} 
              onUpdate={(partial) => selected && handleNodeUpdate(selected.id, partial)}
              onDelete={handleNodeDelete}
              workflowNodes={nodes}
              workflowEdges={edges}
            />
          </div>
          )}
      </div>
    </ReactFlowProvider>
  );
}