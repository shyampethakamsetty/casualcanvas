from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from bson import ObjectId
from datetime import datetime
from ..database import get_runs_collection
from ..auth.router import get_current_user
from ..auth.models import User
from .models import Run, RunList, RunLogsResponse, RunLog, RunStatus

router = APIRouter()

@router.get("", response_model=RunList)
async def list_runs(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    status: Optional[RunStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user)
):
    """List runs for the current user"""
    collection = get_runs_collection()
    
    # Build filter query
    filter_query = {"created_by": current_user.id}
    if workflow_id:
        filter_query["workflow_id"] = workflow_id
    if status:
        filter_query["status"] = status.value
    
    # Count total runs
    total = await collection.count_documents(filter_query)
    
    # Get runs with pagination
    cursor = collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    
    runs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        runs.append(Run(**doc))
    
    return RunList(runs=runs, total=total)

@router.get("/{run_id}", response_model=Run)
async def get_run(
    run_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get run status by ID"""
    collection = get_runs_collection()
    
    try:
        doc = await collection.find_one({"_id": ObjectId(run_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Check if user owns this run
        if doc.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        doc["id"] = str(doc["_id"])
        return Run(**doc)
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid run ID")
        raise e

@router.get("/{run_id}/logs", response_model=RunLogsResponse)
async def get_run_logs(
    run_id: str, 
    after: Optional[str] = Query(None, description="Cursor for pagination"),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user)
):
    """Get run logs by ID"""
    collection = get_runs_collection()
    
    try:
        # Verify run exists and user has access
        run_doc = await collection.find_one({"_id": ObjectId(run_id)})
        if not run_doc:
            raise HTTPException(status_code=404, detail="Run not found")
        
        if run_doc.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # For now, return placeholder logs
        # TODO: Implement proper log storage and retrieval
        logs = [
            RunLog(
                timestamp=datetime.utcnow(),
                level="info",
                message=f"Run {run_id} started",
                node_id=None,
                data={"status": "queued"}
            )
        ]
        
        return RunLogsResponse(
            run_id=run_id,
            logs=logs,
            next_cursor=None
        )
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid run ID")
        raise e

@router.post("/{run_id}/cancel")
async def cancel_run(
    run_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a running workflow"""
    collection = get_runs_collection()
    
    try:
        # Get existing run
        run_doc = await collection.find_one({"_id": ObjectId(run_id)})
        if not run_doc:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Check if user owns this run
        if run_doc.get("created_by") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if run can be cancelled
        current_status = run_doc.get("status")
        if current_status in ["succeeded", "failed", "cancelled"]:
            raise HTTPException(status_code=400, detail=f"Cannot cancel run with status: {current_status}")
        
        # Update run status
        result = await collection.update_one(
            {"_id": ObjectId(run_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "completed_at": datetime.utcnow(),
                    "error": "Cancelled by user"
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {"message": "Run cancelled successfully"}
        
    except Exception as e:
        if "invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid run ID")
        raise e
