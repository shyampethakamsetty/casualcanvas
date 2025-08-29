"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { api } from "../../../lib/api";
import Link from "next/link";

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export default function WorkflowsPage() {
  const { user, token } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      fetchWorkflows();
    }
  }, [token]);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/workflows");
      setWorkflows(response.workflows || []);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      setError("Failed to load workflows");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view your workflows.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchWorkflows}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-xl">My Workflows</h1>
          <p className="text-muted mt-2">Manage and organize your AI workflow automations</p>
        </div>
        <Link 
          href="/workflows/new" 
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="heading-md mb-2">No workflows yet</h3>
          <p className="text-muted mb-8 max-w-md mx-auto">Create your first workflow to start automating tasks with AI-powered nodes and actions.</p>
          <Link 
            href="/workflows/new"
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <div 
              key={workflow.id}
              className="card cursor-pointer group hover:shadow-medium transition-all duration-200"
              onClick={() => window.location.href = `/workflows/${workflow.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                <div>
                    <h3 className="heading-sm group-hover:text-primary-700 transition-colors">
                      {workflow.name}
                    </h3>
                    <p className="text-xs text-subtle">Version {workflow.version}</p>
                  </div>
                </div>
                <span className="text-xs text-subtle">
                      {new Date(workflow.updated_at).toLocaleDateString()}
                    </span>
                  </div>
              
              <div className="text-sm text-muted mb-4">
                {workflow.description || "No description provided"}
              </div>
              
              <div className="flex items-center justify-between text-xs text-subtle pt-4 border-t border-secondary-200/50">
                <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 