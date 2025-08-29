import dramatiq
import time
import os
from typing import Dict, Any
from pymongo import MongoClient

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/aiwf")
mongo_client = MongoClient(mongo_url)
db = mongo_client.aiwf

def node_completed(run_id: str, node_id: str, outputs: Dict[str, Any]):
    """Handle node completion and enqueue dependent nodes"""
    try:
        print(f"[worker] Node {node_id} completed in run {run_id}")
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": f"Node {node_id} completed",
            "outputs": outputs
        })
        
        # Get run and workflow
        run = db.runs.find_one({"_id": run_id})
        if not run:
            return
        
        workflow_id = run["workflow_id"]
        workflow = db.workflows.find_one({"_id": workflow_id})
        if not workflow:
            return
        
        # Update node status
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "completed"}}
        )
        
        # Check if all nodes are completed
        from .run_start import compute_execution_plan, get_ready_nodes, enqueue_node_task
        execution_plan = compute_execution_plan(workflow)
        all_completed = all(
            db.runs.find_one({"_id": run_id}).get("node_status", {}).get(nid) == "completed"
            for nid in execution_plan.keys()
        )
        
        if all_completed:
            # Mark run as completed
            db.runs.update_one(
                {"_id": run_id},
                {"$set": {"status": "succeeded", "completed_at": time.time()}}
            )
            print(f"[worker] Run {run_id} completed successfully")
        else:
            # Enqueue dependent nodes that are ready
            ready_nodes = get_ready_nodes(run_id, execution_plan)
            for ready_node_id in ready_nodes:
                enqueue_node_task(run_id, workflow_id, ready_node_id, workflow["nodes"], outputs)
                
    except Exception as e:
        print(f"[worker] Error handling node completion: {e}") 