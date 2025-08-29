"use client";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Run {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface RunLog {
  id: string;
  run_id: string;
  node_id: string;
  level: "info" | "warning" | "error";
  message: string;
  timestamp: string;
}

export function RunPanel({ workflowId, height = 320 }: { workflowId: string; height?: number }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (workflowId && workflowId !== "new") {
      fetchRuns();
    }
  }, [workflowId]);

  useEffect(() => {
    if (selectedRun) {
      fetchLogs(selectedRun.id);
    }
  }, [selectedRun]);

  const fetchRuns = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/runs?workflow_id=${workflowId}`);
      setRuns(response.runs || []);
    } catch (error) {
      console.error("Failed to fetch runs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (runId: string) => {
    try {
      const response = await api.get(`/runs/${runId}/logs`);
      setLogs(response.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const startRun = async () => {
    if (workflowId === "new") {
      alert("Please save the workflow first");
      return;
    }

    try {
      setIsRunning(true);
      const response = await api.post(`/workflows/${workflowId}/run`, {
        inputs: {} // Backend expects RunCreate model with inputs field
      });
      await fetchRuns();
      setSelectedRun(response);
    } catch (error) {
      console.error("Failed to start run:", error);
      alert("Failed to start workflow run");
    } finally {
      setIsRunning(false);
    }
  };

  const cancelRun = async (runId: string) => {
    try {
      await api.post(`/runs/${runId}/cancel`);
      await fetchRuns();
    } catch (error) {
      console.error("Failed to cancel run:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued": return "status-queued";
      case "running": return "status-running";
      case "succeeded": return "status-succeeded";
      case "failed": return "status-failed";
      default: return "status-badge bg-secondary-100 text-secondary-800 border border-secondary-200";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error": return "bg-accent-100 text-accent-800 border border-accent-200";
      case "warning": return "bg-warning-100 text-warning-800 border border-warning-200";
      case "info": return "bg-primary-100 text-primary-800 border border-primary-200";
      default: return "bg-secondary-100 text-secondary-800 border border-secondary-200";
    }
  };

  return (
    <div className="flex flex-col bg-white/95">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn-icon"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-success-400 to-success-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
            <h3 className="heading-sm">Workflow Execution</h3>
          </div>
        </div>
        <button
          onClick={startRun}
          disabled={isRunning || workflowId === "new"}
          className="btn-success"
        >
          {isRunning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              Run Workflow
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isCollapsed ? 'max-h-0' : 'max-h-full'
      }`}>
        <div className="overflow-auto p-6" style={{ height: `${height - 64}px` }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin mx-auto h-8 w-8 text-primary-600 mb-3">
                  <svg fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-muted">Loading runs...</p>
              </div>
            </div>
          ) : runs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-muted">No runs yet</p>
                <p className="text-subtle text-sm mt-1">Click "Run Workflow" to execute your first workflow</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-full">
              {/* Runs List */}
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className={`card-compact cursor-pointer transition-all duration-200 ${
                      selectedRun?.id === run.id 
                        ? "border-primary-300 bg-primary-50/50 shadow-medium" 
                        : "hover:border-secondary-300 hover:shadow-medium"
                    }`}
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={getStatusColor(run.status)}>
                            {run.status}
                          </span>
                          <span className="text-sm text-muted">
                            {new Date(run.created_at).toLocaleDateString()} at {new Date(run.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {run.error && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-accent-50 border border-accent-200 rounded-lg">
                            <svg className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-accent-700">{run.error}</p>
                          </div>
                        )}
                      </div>
                      {run.status === "running" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRun(run.id);
                          }}
                          className="btn-danger ml-4 text-xs px-2 py-1"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logs Section */}
              {selectedRun && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="heading-sm">Run Logs</h4>
                  </div>
                  <div className="flex-1 bg-secondary-50 border border-secondary-200 rounded-lg p-4 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-secondary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-subtle">No logs available</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 rounded bg-white/50">
                            <span className="text-xs text-subtle font-normal whitespace-nowrap mt-0.5">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getLogLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-sm text-secondary-800 flex-1">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
