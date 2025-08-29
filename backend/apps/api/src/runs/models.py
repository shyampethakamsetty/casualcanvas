from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

class RunStatus(str, Enum):
    """Run status enumeration"""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RunLog(BaseModel):
    """Individual log entry for a run"""
    timestamp: datetime = Field(description="Log timestamp")
    level: str = Field(description="Log level (info, warn, error)")
    message: str = Field(description="Log message")
    node_id: Optional[str] = Field(default=None, description="Node ID if applicable")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Additional log data")

class Run(BaseModel):
    """Run model"""
    id: str = Field(description="Unique run identifier")
    workflow_id: str = Field(description="Workflow ID this run belongs to")
    status: RunStatus = Field(description="Current run status")
    created_by: str = Field(description="User who created the run")
    created_at: datetime = Field(description="Run creation timestamp")
    started_at: Optional[datetime] = Field(default=None, description="Run start timestamp")
    completed_at: Optional[datetime] = Field(default=None, description="Run completion timestamp")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    node_status: Dict[str, str] = Field(default_factory=dict, description="Status of individual nodes")
    inputs: Dict[str, Any] = Field(default_factory=dict, description="Run inputs")
    outputs: Dict[str, Any] = Field(default_factory=dict, description="Run outputs")

class RunList(BaseModel):
    """Response model for listing runs"""
    runs: List[Run] = Field(description="List of runs")
    total: int = Field(description="Total number of runs")

class RunLogsResponse(BaseModel):
    """Response model for run logs"""
    run_id: str = Field(description="Run ID")
    logs: List[RunLog] = Field(description="List of log entries")
    next_cursor: Optional[str] = Field(default=None, description="Cursor for pagination")

class RunCreate(BaseModel):
    """Request model for creating a run"""
    inputs: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Run inputs")
