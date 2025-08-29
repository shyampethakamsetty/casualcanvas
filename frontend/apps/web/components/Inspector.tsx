"use client";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

type Props = { 
  selectedNode: any; 
  onUpdate: (partial: any) => void;
  onDelete?: () => void;
  workflowNodes?: any[]; // For getting inputs from previous nodes
  workflowEdges?: any[]; // For tracing connections
};

// Node configuration schemas (existing)
const nodeSchemas = {
  "ingest.pdf": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "selected_file", type: "file_select", label: "Select PDF File", description: "Choose from your uploaded files" },
      { name: "maxFileSize", type: "number", label: "Max File Size (MB)", default: 10 },
      { name: "extractImages", type: "checkbox", label: "Extract Images", default: false }
    ]
  },
  "ingest.url": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "url", type: "url", label: "URL", required: true },
      { name: "extractText", type: "checkbox", label: "Extract Text", default: true },
      { name: "chunkSize", type: "number", label: "Chunk Size", default: 1000 }
    ]
  },
  "ingest.webhook": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "webhookPath", type: "text", label: "Webhook Path", default: "/webhook" },
      { name: "authRequired", type: "checkbox", label: "Require Authentication", default: true }
    ]
  },
  "ai.rag_qa": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "query", type: "textarea", label: "Query Template", placeholder: "Enter your question..." },
      { name: "maxTokens", type: "number", label: "Max Response Tokens", default: 500 }
    ]
  },
  "ai.summarize": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "max_length", type: "number", label: "Max Summary Length (words)", default: 150 },
      { name: "type", type: "select", label: "Summary Type", options: ["brief", "detailed", "bullet_points"], default: "brief" },
      { name: "content", type: "textarea", label: "Content to Summarize (optional)", placeholder: "Paste content here or connect from another node..." }
    ]
  },
  "ai.classify": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "categories", type: "textarea", label: "Categories (one per line)", placeholder: "business\ntechnology\nhealth" },
      { name: "confidence", type: "number", label: "Min Confidence", default: 0.5, min: 0, max: 1, step: 0.1 }
    ]
  },
  "text.transform": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "operation", type: "select", label: "Transform Operation", options: ["uppercase", "lowercase", "capitalize", "custom"], default: "uppercase" },
      { name: "customPrompt", type: "textarea", label: "Custom Prompt (if custom)", placeholder: "Transform the text by..." }
    ]
  },
  "act.slack": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "channel", type: "text", label: "Slack Channel", default: "#general" },
      { name: "message", type: "textarea", label: "Message Template", placeholder: "Use {{content}} for dynamic content" }
    ]
  },
  "act.sheets": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "spreadsheetId", type: "text", label: "Spreadsheet ID", required: true },
      { name: "range", type: "text", label: "Range", default: "A:A" }
    ]
  },
  "act.email": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "to", type: "email", label: "To Email", required: true },
      { name: "subject", type: "text", label: "Subject", required: true },
      { name: "template", type: "textarea", label: "Email Template", placeholder: "Use {{content}} for dynamic content" }
    ]
  },
  "act.notion": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "pageId", type: "text", label: "Notion Page ID", required: true },
      { name: "property", type: "text", label: "Property Name", default: "Content" }
    ]
  },
  "act.twilio": {
    fields: [
      { name: "label", type: "text", label: "Node Label", required: true },
      { name: "to", type: "tel", label: "To Phone Number", required: true },
      { name: "message", type: "textarea", label: "SMS Message", placeholder: "Use {{content}} for dynamic content" }
    ]
  }
};

export function Inspector({ selectedNode, onUpdate, onDelete, workflowNodes = [], workflowEdges = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testOutputs, setTestOutputs] = useState<Record<string, any> | null>(null);
  const [testLogs, setTestLogs] = useState<any[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "test">("config");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    if (selectedNode) {
      // Initialize form data with node's current data and config
      const initialData = {
        label: selectedNode.data?.label || "",
        ...selectedNode.data?.config || {}
      };
      setFormData(initialData);
      
      // Load sample inputs for testing
      loadSampleInputs(selectedNode.data?.type);
      
      // Load uploaded files for file selection
      if (selectedNode.data?.type === "ingest.pdf") {
        loadUploadedFiles();
      }
      
      // Get inputs from previous nodes
      getPreviousNodeOutputs(selectedNode.id).then(previousNodeInputs => {
      if (Object.keys(previousNodeInputs).length > 0) {
          setTestInputs(prev => ({ ...prev, ...previousNodeInputs }));
      }
      }).catch(error => {
        console.warn('Failed to get previous node outputs:', error);
      });
    } else {
      setFormData({});
      setTestInputs({});
      setTestOutputs(null);
      setTestLogs([]);
      setUploadedFiles([]);
    }
  }, [selectedNode]);

  const loadSampleInputs = async (nodeType: string) => {
    try {
      const response = await api.get(`/nodes/sample-inputs/${nodeType}`);
      if (response.inputs) {
        setTestInputs(prev => ({ ...response.inputs, ...prev })); // Previous node outputs take precedence
      }
    } catch (error) {
      console.error("Failed to load sample inputs:", error);
    }
  };

  const getPreviousNodeOutputs = async (nodeId: string) => {
    // Find edges that connect to this node
    const incomingEdges = workflowEdges.filter(edge => edge.target === nodeId);
    
    // Get outputs from source nodes by actually testing them
    const previousOutputs: Record<string, any> = {};
    
    for (const edge of incomingEdges) {
      const sourceNode = workflowNodes.find(node => node.id === edge.source);
      if (sourceNode) {
        try {
          // Actually test the source node to get real outputs
          const testResponse = await api.post('/nodes/test', {
            node_type: sourceNode.data?.type,
            config: sourceNode.data?.config || {},
            inputs: {}
          });
          
          if (testResponse.outputs) {
            // Merge the outputs from the source node
            Object.assign(previousOutputs, testResponse.outputs);
          }
        } catch (error) {
          console.warn(`Failed to get outputs from source node ${sourceNode.id}:`, error);
          // Fallback to mock data if real test fails
        if (sourceNode.data?.type?.startsWith("ingest.")) {
          previousOutputs.content = "Sample content from previous ingest node";
          previousOutputs.document_id = "doc_12345";
        } else if (sourceNode.data?.type?.startsWith("ai.")) {
          previousOutputs.content = "Processed content from previous AI node";
          previousOutputs.summary = "Previous summary";
        }
      }
      }
    }
    
    return previousOutputs;
  };

  const loadUploadedFiles = async () => {
    try {
      // Fetch uploaded files from the backend
      const response = await api.get('/ingest/files');
      setUploadedFiles(response.files || []);
    } catch (error) {
      console.error("Failed to load uploaded files:", error);
      // Set empty array on error
      setUploadedFiles([]);
    }
  };

  const runNodeTest = async () => {
    if (!selectedNode) return;
    
    setIsTestRunning(true);
    setTestError(null);
    setTestOutputs(null);
    setTestLogs([]);
    
    try {
      const { label, ...config } = formData;
      
      console.log("DEBUG: Sending test config:", config);
      console.log("DEBUG: Node type:", selectedNode.data?.type);
      
      const response = await api.post("/nodes/test", {
        node_type: selectedNode.data?.type,
        config: config,
        inputs: testInputs
      });
      
      setTestOutputs(response.outputs);
      setTestLogs(response.logs || []);
      
      if (response.error) {
        setTestError(response.error);
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "Test failed");
      console.error("Node test failed:", error);
    } finally {
      setIsTestRunning(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-2">📝</div>
        <p>Select a node to configure and test</p>
      </div>
    );
  }

  const nodeType = selectedNode.data?.type;
  const schema = nodeSchemas[nodeType as keyof typeof nodeSchemas];

  if (!schema) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Node Configuration</h3>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              title="Delete this node"
            >
              🗑️ Delete
            </button>
          )}
        </div>
        <p className="text-gray-500">No configuration available for node type: {nodeType}</p>
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);

    // Update the node immediately
    const { label, ...config } = newFormData;
    onUpdate({
      data: {
        ...selectedNode.data,
        label,
        config
      }
    });
  };

  const handleTestInputChange = (fieldName: string, value: any) => {
    setTestInputs(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: any) => {
    const value = formData[field.name] ?? field.default ?? "";

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "url":
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="input"
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case "file_select":
        return (
          <div className="space-y-2">
            {uploadedFiles.length === 0 ? (
              <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="text-2xl mb-2">📁</div>
                <p className="text-sm text-gray-600 mb-2">No files uploaded yet</p>
                <a 
                  href="/uploads" 
                  target="_blank"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Go to Uploads page to upload files →
                </a>
              </div>
            ) : (
              <select
                value={value}
                onChange={(e) => {
                  const selectedFile = uploadedFiles.find(f => f.file_id === e.target.value);
                  if (selectedFile) {
                    handleFieldChange('file_path', selectedFile.file_path);
                    handleFieldChange('uploaded_file_id', selectedFile.file_id);
                    handleFieldChange('selected_file', selectedFile.file_id);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a file...</option>
                {uploadedFiles.map((file) => (
                  <option key={file.file_id} value={file.file_id}>
                    {file.original_filename} ({(file.file_size / 1024 / 1024).toFixed(2)} MB)
                  </option>
                ))}
              </select>
            )}
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            {uploadedFiles.length > 0 && (
              <div className="text-xs text-gray-500">
                <a 
                  href="/uploads" 
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Manage files
                </a>
              </div>
            )}
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
            className="input"
            min={field.min}
            max={field.max}
            step={field.step}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="input"
            rows={3}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="input"
            required={field.required}
          >
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="input"
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="panel h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="heading-sm">
          {selectedNode.data?.label || nodeType}
        </h3>
            <p className="text-xs text-subtle">{nodeType}</p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn-danger"
            title="Delete this node"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Tabs */}
        <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg">
        <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "config"
                ? "bg-white text-primary-700 shadow-soft"
                : "text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50"
          }`}
        >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          Configuration
        </button>
        <button
            onClick={() => setActiveTab("test")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "test"
                ? "bg-white text-primary-700 shadow-soft"
                : "text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50"
          }`}
        >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          Test Node
        </button>
      </div>

        {/* Tab Content */}
      {activeTab === "config" && (
          <div className="space-y-6 animate-fade-in">
          {schema.fields.map((field) => (
              <div key={field.name} className="input-group">
                <label className="label">
                {field.label}
                  {field.required && <span className="text-accent-500 ml-1">*</span>}
              </label>
              {renderField(field)}
                {field.description && (
                  <p className="text-xs text-subtle mt-1">{field.description}</p>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Test Tab */}
      {activeTab === "test" && (
        <div className="space-y-4">
          {/* Test Inputs */}
          <div>
            <h4 className="text-md font-medium mb-2">Test Inputs</h4>
            <div className="space-y-2">
              {Object.entries(testInputs).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key}
                  </label>
                  <textarea
                    value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                      try {
                        // Try to parse as JSON first
                        const parsed = JSON.parse(e.target.value);
                        handleTestInputChange(key, parsed);
                      } catch {
                        // If not valid JSON, store as string
                        handleTestInputChange(key, e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={3}
                    placeholder={`Enter ${key} value...`}
                  />
                </div>
              ))}
              
              {/* Add Custom Input */}
              <button
                onClick={() => handleTestInputChange("custom_input", "")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add custom input
              </button>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={runNodeTest}
            disabled={isTestRunning}
            className={`w-full px-4 py-2 rounded-md text-white font-medium ${
              isTestRunning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isTestRunning ? "🔄 Testing..." : "▶️ Test Node"}
          </button>

          {/* Test Results */}
          {testError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h5 className="text-sm font-medium text-red-800 mb-1">Error</h5>
              <p className="text-sm text-red-700">{testError}</p>
            </div>
          )}

          {testOutputs && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h5 className="text-sm font-medium text-green-800 mb-2">Outputs</h5>
              <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-auto max-h-40">
                {JSON.stringify(testOutputs, null, 2)}
              </pre>
            </div>
          )}

          {testLogs.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h5 className="text-sm font-medium text-gray-800 mb-2">Logs</h5>
              <div className="space-y-1 max-h-40 overflow-auto">
                {testLogs.map((log, index) => (
                  <div key={index} className="text-xs">
                    <span className={`font-medium ${
                      log.level === "ERROR" ? "text-red-600" : 
                      log.level === "WARNING" ? "text-yellow-600" : "text-blue-600"
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-gray-600 ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}