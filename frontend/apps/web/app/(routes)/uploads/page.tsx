"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth";
import { api } from "../../../lib/api";
import { useRouter } from "next/navigation";

interface UploadedFile {
  file_id: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
  status: string;
}

export default function UploadsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load uploaded files
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      const response = await api.get("/ingest/files");
      setFiles(response.files || []);
    } catch (error) {
      console.error("Failed to load files:", error);
      setMessage("Failed to load files. Please try again.");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setMessage("");

      const formData = new FormData();
      formData.append('file', file);

      // Upload file using fetch with progress tracking
      const token = localStorage.getItem("token");
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

      const response = await fetch(`${base}/api/v1/ingest/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setMessage(`Successfully uploaded: ${file.name}`);
      
      // Reload files list
      await loadFiles();
      
      return result;
    } catch (error) {
      console.error("File upload failed:", error);
      setMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      await api.delete(`/ingest/files/${fileId}`);
      setMessage("File deleted successfully");
      await loadFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      setMessage("Failed to delete file. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">File Uploads</h1>
        <p className="text-gray-600">Manage your uploaded files for use in workflows</p>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400"
          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Files
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop files here, or click to select
              </p>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
              >
                Choose Files
              </label>
            </div>
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${uploadProgress}%`}}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes("Failed") || message.includes("failed") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message}
        </div>
      )}

      {/* Files List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Uploaded Files ({files.length})
          </h2>
        </div>
        
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div key={file.file_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {file.original_filename.endsWith('.pdf') ? '📄' : '📋'}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {file.original_filename}
                      </h3>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          file.status === 'uploaded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteFile(file.file_id)}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 