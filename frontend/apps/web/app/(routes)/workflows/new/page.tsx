"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth";
import { api } from "../../../../lib/api";

export default function NewWorkflowPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please log in to create workflows.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Workflow name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/workflows", {
        name: name.trim(),
        description: description.trim() || undefined,
        nodes: [],
        edges: []
      });

      // Redirect to the workflow editor
      router.push(`/workflows/${response.id}`);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      setError("Failed to create workflow. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Workflow</h1>
        <p className="text-gray-600 mt-2">Start building your AI automation pipeline</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., PDF Document Processor"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what this workflow does..."
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Workflow"}
          </button>
          
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 