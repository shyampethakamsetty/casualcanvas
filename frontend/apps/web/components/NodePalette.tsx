"use client";
import { useState } from "react";

const nodeGroups = {
  Ingest: [
    { id: "ingest.pdf", label: "PDF Upload", icon: "📄", description: "Upload and parse PDF documents" },
    { id: "ingest.url", label: "URL Fetch", icon: "🌐", description: "Fetch content from web URLs" },
    { id: "ingest.webhook", label: "Webhook", icon: "🔗", description: "Receive data via webhooks" }
  ],
  AI: [
    { id: "ai.rag_qa", label: "RAG Q&A", icon: "❓", description: "Question answering with RAG" },
    { id: "ai.summarize", label: "Summarize", icon: "📝", description: "Summarize text content" },
    { id: "ai.classify", label: "Classify", icon: "🏷️", description: "Classify text into categories" },
    { id: "text.transform", label: "Transform", icon: "🔄", description: "Transform text content" }
  ],
  Actions: [
    { id: "act.slack", label: "Slack", icon: "💬", description: "Send Slack messages" },
    { id: "act.sheets", label: "Sheets", icon: "📊", description: "Update Google Sheets" },
    { id: "act.email", label: "Email", icon: "📧", description: "Send emails" },
    { id: "act.notion", label: "Notion", icon: "📋", description: "Update Notion pages" },
    { id: "act.twilio", label: "SMS", icon: "📱", description: "Send SMS messages" }
  ]
};

interface NodePaletteProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export function NodePalette({ onCollapseChange }: NodePaletteProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Ingest", "AI", "Actions"]));
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/node-type", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "ingest.pdf":
        return { icon: "📄", bg: "bg-blue-100" };
      case "ingest.url":
        return { icon: "🌐", bg: "bg-green-100" };
      case "ingest.webhook":
        return { icon: "🔗", bg: "bg-purple-100" };
      case "ai.rag_qa":
        return { icon: "❓", bg: "bg-red-100" };
      case "ai.summarize":
        return { icon: "📝", bg: "bg-orange-100" };
      case "ai.classify":
        return { icon: "🏷️", bg: "bg-yellow-100" };
      case "text.transform":
        return { icon: "🔄", bg: "bg-indigo-100" };
      case "act.slack":
        return { icon: "💬", bg: "bg-blue-100" };
      case "act.sheets":
        return { icon: "📊", bg: "bg-green-100" };
      case "act.email":
        return { icon: "📧", bg: "bg-purple-100" };
      case "act.notion":
        return { icon: "📋", bg: "bg-red-100" };
      case "act.twilio":
        return { icon: "📱", bg: "bg-orange-100" };
      default:
        return { icon: "⚙️", bg: "bg-gray-100" };
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-secondary-200/50">
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary-800">Node Palette</h3>
                <p className="text-xs text-subtle">Drag to canvas</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              const newCollapsed = !isCollapsed;
              setIsCollapsed(newCollapsed);
              onCollapseChange?.(newCollapsed);
            }}
            className="btn-icon ml-auto"
            title={isCollapsed ? "Expand palette" : "Collapse palette"}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {Object.entries(nodeGroups).map(([groupName, nodes]) => (
            <div key={groupName} className="space-y-3">
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex items-center justify-between w-full text-left group"
              >
                <span className="text-sm font-medium text-secondary-700 group-hover:text-secondary-900 transition-colors">
                  {groupName}
                </span>
                <svg 
                  className={`w-4 h-4 text-secondary-500 transition-transform duration-200 ${
                    expandedGroups.has(groupName) ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedGroups.has(groupName) && (
                <div className="space-y-2 animate-fade-in">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.id)}
                      className="p-3 bg-white border border-secondary-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-medium hover:border-primary-300 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNodeIcon(node.id).bg}`}>
                          <span className="text-sm">{getNodeIcon(node.id).icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-secondary-800 group-hover:text-secondary-900 truncate">
                            {node.label}
                          </h4>
                          <p className="text-xs text-subtle truncate">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
