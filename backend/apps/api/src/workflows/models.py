from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class NodeType(str, Enum):
    # Ingest nodes
    INGEST_PDF = "ingest.pdf"
    INGEST_URL = "ingest.url"
    INGEST_WEBHOOK = "ingest.webhook"
    
    # AI nodes
    AI_RAG_QA = "ai.rag_qa"
    AI_SUMMARIZE = "ai.summarize"
    AI_CLASSIFY = "ai.classify"
    TEXT_TRANSFORM = "text.transform"
    
    # Action nodes
    ACT_SLACK = "act.slack"
    ACT_SHEETS = "act.sheets"
    ACT_EMAIL = "act.email"
    ACT_NOTION = "act.notion"
    ACT_TWILIO = "act.twilio"

class NodeConfig(BaseModel):
    """Configuration for a workflow node"""
    inputs: List[str] = Field(default_factory=list, description="Input field names")
    outputs: List[str] = Field(default_factory=list, description="Output field names")
    config: Dict[str, Any] = Field(default_factory=dict, description="Node-specific configuration")

class WorkflowNode(BaseModel):
    """A node in the workflow"""
    id: str = Field(description="Unique node identifier")
    type: NodeType = Field(description="Type of the node")
    config: NodeConfig = Field(description="Node configuration")
    position: Optional[Dict[str, float]] = Field(default=None, description="Position on canvas")

class WorkflowEdge(BaseModel):
    """An edge connecting nodes in the workflow"""
    id: str = Field(description="Unique edge identifier")
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    sourceHandle: Optional[str] = Field(default=None, description="Source handle")
    targetHandle: Optional[str] = Field(default=None, description="Target handle")

class WorkflowCreate(BaseModel):
    """Request model for creating a workflow"""
    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(default=None, description="Workflow description")
    nodes: List[WorkflowNode] = Field(default_factory=list, description="Workflow nodes")
    edges: List[WorkflowEdge] = Field(default_factory=list, description="Workflow edges")

class WorkflowUpdate(BaseModel):
    """Request model for updating a workflow"""
    name: Optional[str] = Field(default=None, description="Workflow name")
    description: Optional[str] = Field(default=None, description="Workflow description")
    nodes: Optional[List[WorkflowNode]] = Field(default=None, description="Workflow nodes")
    edges: Optional[List[WorkflowEdge]] = Field(default=None, description="Workflow edges")

class Workflow(BaseModel):
    """Workflow model"""
    id: str = Field(description="Unique workflow identifier")
    name: str = Field(description="Workflow name")
    description: Optional[str] = Field(default=None, description="Workflow description")
    version: int = Field(default=1, description="Workflow version")
    nodes: List[WorkflowNode] = Field(default_factory=list, description="Workflow nodes")
    edges: List[WorkflowEdge] = Field(default_factory=list, description="Workflow edges")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    created_by: Optional[str] = Field(default=None, description="User who created the workflow")
    is_active: bool = Field(default=True, description="Whether the workflow is active")

class WorkflowList(BaseModel):
    """Response model for listing workflows"""
    workflows: List[Workflow] = Field(description="List of workflows")
    total: int = Field(description="Total number of workflows") 