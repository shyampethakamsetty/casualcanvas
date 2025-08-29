from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from bson import ObjectId
from datetime import datetime
from .models import (
    Workflow, WorkflowCreate, WorkflowUpdate, WorkflowList,
    WorkflowNode, WorkflowEdge
)
from ..auth.router import get_current_user
from ..auth.models import User
from ..database import get_workflows_collection
from ..runs.models import RunCreate

router = APIRouter()

@router.post("", response_model=Workflow)
async def create_workflow(
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    print(f"DEBUG: Creating workflow with data: {workflow}")
    collection = get_workflows_collection()
    
    # Create workflow document
    workflow_doc = {
        "name": workflow.name,
        "description": workflow.description,
        "version": 1,
        "nodes": [node.dict() for node in workflow.nodes],
        "edges": [edge.dict() for edge in workflow.edges],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user.id,
        "is_active": True
    }
    
    result = await collection.insert_one(workflow_doc)
    workflow_doc["id"] = str(result.inserted_id)
    
    return Workflow(**workflow_doc)

@router.get("", response_model=WorkflowList)
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user)
):
    """List workflows for the current user"""
    collection = get_workflows_collection()
    
    # Count total workflows
    total = await collection.count_documents({"created_by": current_user.id, "is_active": True})
    
    # Get workflows with pagination
    cursor = collection.find(
        {"created_by": current_user.id, "is_active": True}
    ).skip(skip).limit(limit).sort("updated_at", -1)
    
    workflows = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        workflows.append(Workflow(**doc))
    
    return WorkflowList(workflows=workflows, total=total)

@router.get("/{wf_id}", response_model=Workflow)
async def get_workflow(
    wf_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific workflow"""
    collection = get_workflows_collection()
    
    try:
        doc = await collection.find_one({"_id": ObjectId(wf_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Check if user owns this workflow
        if doc.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        doc["id"] = str(doc["_id"])
        return Workflow(**doc)
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid workflow ID")
        raise e

@router.put("/{wf_id}", response_model=Workflow)
async def update_workflow(
    wf_id: str,
    workflow_update: WorkflowUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a workflow"""
    print(f"DEBUG: Updating workflow {wf_id} with data: {workflow_update}")
    collection = get_workflows_collection()
    
    try:
        # Get existing workflow
        existing = await collection.find_one({"_id": ObjectId(wf_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Check if user owns this workflow
        if existing.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow()}
        if workflow_update.name is not None:
            update_data["name"] = workflow_update.name
        if workflow_update.description is not None:
            update_data["description"] = workflow_update.description
        if workflow_update.nodes is not None:
            update_data["nodes"] = [node.dict() for node in workflow_update.nodes]
            update_data["version"] = existing.get("version", 1) + 1
        if workflow_update.edges is not None:
            update_data["edges"] = [edge.dict() for edge in workflow_update.edges]
        
        # Update workflow
        result = await collection.update_one(
            {"_id": ObjectId(wf_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Return updated workflow
        updated = await collection.find_one({"_id": ObjectId(wf_id)})
        updated["id"] = str(updated["_id"])
        return Workflow(**updated)
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid workflow ID")
        raise e

@router.delete("/{wf_id}")
async def delete_workflow(
    wf_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow (soft delete)"""
    collection = get_workflows_collection()
    
    try:
        # Get existing workflow
        existing = await collection.find_one({"_id": ObjectId(wf_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Check if user owns this workflow
        if existing.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Soft delete
        result = await collection.update_one(
            {"_id": ObjectId(wf_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Workflow deleted successfully"}
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid workflow ID")
        raise e

@router.post("/{wf_id}/run")
async def run_workflow(
    wf_id: str,
    run_data: RunCreate,
    current_user: User = Depends(get_current_user)
):
    """Start a workflow run"""
    from ..database import get_runs_collection
    import dramatiq
    import json
    
    # Get workflow
    collection = get_workflows_collection()
    try:
        workflow = await collection.find_one({"_id": ObjectId(wf_id)})
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Check if user owns this workflow
        if workflow.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid workflow ID")
        raise e
    
    # Create run record
    runs_collection = get_runs_collection()
    run_doc = {
        "workflow_id": wf_id,
        "status": "queued",
        "created_by": current_user.id,
        "created_at": datetime.utcnow(),
        "started_at": None,
        "completed_at": None,
        "error": None,
        "node_status": {},
        "inputs": run_data.inputs,
        "outputs": {}
    }
    
    result = await runs_collection.insert_one(run_doc)
    run_id = str(result.inserted_id)
    
    # Enqueue workflow execution using Dramatiq
    try:
        import dramatiq
        from dramatiq import get_broker
        
        # Create a message for the run_start actor and send it to the broker
        broker = get_broker()
        message = dramatiq.Message(
            queue_name="default",
            actor_name="run_start",
            args=[run_id],
            kwargs={},
            options={}
        )
        broker.enqueue(message)
        
        return {
            "run_id": run_id,
            "status": "queued",
            "message": "Workflow execution started"
        }
        
    except Exception as e:
        # If enqueuing fails, mark run as failed
        await runs_collection.update_one(
            {"_id": ObjectId(run_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=f"Failed to start workflow: {str(e)}")
