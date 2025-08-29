import dramatiq
import time
import os
from typing import Dict, List, Any
from pymongo import MongoClient
from bson import ObjectId

# Import broker configuration

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/aiwf")
mongo_client = MongoClient(mongo_url)
db = mongo_client.aiwf

@dramatiq.actor(queue_name="default")
def run_start(run_id: str):
    """Main workflow execution orchestrator"""
    try:
        print(f"[worker] Starting run {run_id}")
        
        # Get run details - convert string ID to ObjectId
        run = db.runs.find_one({"_id": ObjectId(run_id)})
        if not run:
            print(f"[worker] Run {run_id} not found")
            return
        
        # Get workflow - workflow_id should also be an ObjectId
        workflow_id = run.get("workflow_id")
        if isinstance(workflow_id, str):
            workflow_id = ObjectId(workflow_id)
        workflow = db.workflows.find_one({"_id": workflow_id})
        if not workflow:
            print(f"[worker] Workflow {workflow_id} not found")
            return
        
        # Update run status to running
        db.runs.update_one(
            {"_id": ObjectId(run_id)},
            {"$set": {"status": "running", "started_at": time.time()}}
        )
        
        # Compute execution DAG
        execution_plan = compute_execution_plan(workflow)
        
        # Enqueue initial nodes (nodes with no dependencies)
        initial_nodes = [node for node in execution_plan if not execution_plan[node]["dependencies"]]
        
        for node_id in initial_nodes:
            enqueue_node_task(run_id, workflow_id, node_id, workflow["nodes"], {})
        
        print(f"[worker] Run {run_id} started with {len(initial_nodes)} initial nodes")
        
    except Exception as e:
        print(f"[worker] Error starting run {run_id}: {e}")
        # Update run status to failed
        db.runs.update_one(
            {"_id": ObjectId(run_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )

def compute_execution_plan(workflow: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Compute execution order and dependencies for workflow nodes"""
    nodes = {node["id"]: node for node in workflow.get("nodes", [])}
    edges = workflow.get("edges", [])
    
    # Build dependency graph
    dependencies = {}
    dependents = {}
    
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        
        if target not in dependencies:
            dependencies[target] = []
        dependencies[target].append(source)
        
        if source not in dependents:
            dependents[source] = []
        dependents[source].append(target)
    
    # Create execution plan
    execution_plan = {}
    for node_id, node in nodes.items():
        execution_plan[node_id] = {
            "node": node,
            "dependencies": dependencies.get(node_id, []),
            "dependents": dependents.get(node_id, []),
            "status": "pending",
            "inputs": {},
            "outputs": {}
        }
    
    return execution_plan

def enqueue_node_task(run_id: str, workflow_id: str, node_id: str, nodes: List[Dict], inputs: Dict[str, Any]):
    """Enqueue a node task for execution"""
    try:
        # Find the node
        node = next((n for n in nodes if n["id"] == node_id), None)
        if not node:
            print(f"[worker] Node {node_id} not found")
            return
        
        node_type = node["type"]
        
        # Log task enqueuing
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": f"Enqueuing node {node_id} ({node_type})",
            "inputs": inputs
        })
        
        # Enqueue based on node type
        if node_type.startswith("ingest."):
            enqueue_ingest_task(run_id, node_id, node, inputs)
        elif node_type.startswith("ai."):
            enqueue_ai_task(run_id, node_id, node, inputs)
        elif node_type.startswith("act."):
            enqueue_action_task(run_id, node_id, node, inputs)
        else:
            print(f"[worker] Unknown node type: {node_type}")
            
    except Exception as e:
        print(f"[worker] Error enqueuing node {node_id}: {e}")

def enqueue_ingest_task(run_id: str, node_id: str, node: Dict, inputs: Dict[str, Any]):
    """Enqueue ingest node tasks"""
    node_type = node["type"]
    
    if node_type == "ingest.pdf":
        from .ingest_tasks import ingest_pdf
        ingest_pdf.send(run_id, node_id, node.get("config", {}))
    elif node_type == "ingest.url":
        from .ingest_tasks import ingest_url
        ingest_url.send(run_id, node_id, node.get("config", {}))
    elif node_type == "ingest.webhook":
        from .ingest_tasks import ingest_webhook
        ingest_webhook.send(run_id, node_id, node.get("config", {}))
    else:
        print(f"[worker] Unknown ingest type: {node_type}")

def enqueue_ai_task(run_id: str, node_id: str, node: Dict, inputs: Dict[str, Any]):
    """Enqueue AI node tasks"""
    node_type = node["type"]
    
    if node_type == "ai.rag_qa":
        from .ai_tasks import rag_query
        rag_query.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "ai.summarize":
        from .ai_tasks import summarize_text
        summarize_text.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "ai.classify":
        from .ai_tasks import classify_text
        classify_text.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "text.transform":
        from .ai_tasks import transform_text
        transform_text.send(run_id, node_id, node.get("config", {}), inputs)
    else:
        print(f"[worker] Unknown AI type: {node_type}")

def enqueue_action_task(run_id: str, node_id: str, node: Dict, inputs: Dict[str, Any]):
    """Enqueue action node tasks"""
    node_type = node["type"]
    
    if node_type == "act.slack":
        from .action_tasks import post_slack
        post_slack.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "act.sheets":
        from .action_tasks import append_sheets
        append_sheets.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "act.email":
        from .action_tasks import send_email
        send_email.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "act.notion":
        from .action_tasks import upsert_notion
        upsert_notion.send(run_id, node_id, node.get("config", {}), inputs)
    elif node_type == "act.twilio":
        from .action_tasks import send_sms
        send_sms.send(run_id, node_id, node.get("config", {}), inputs)
    else:
        print(f"[worker] Unknown action type: {node_type}")



def get_ready_nodes(run_id: str, execution_plan: Dict[str, Dict]) -> List[str]:
    """Get nodes that are ready to execute (all dependencies completed)"""
    run = db.runs.find_one({"_id": ObjectId(run_id)})
    if not run:
        return []
    
    node_status = run.get("node_status", {})
    ready_nodes = []
    
    for node_id, plan in execution_plan.items():
        if node_status.get(node_id) == "completed":
            continue
            
        # Check if all dependencies are completed
        dependencies_completed = all(
            node_status.get(dep) == "completed"
            for dep in plan["dependencies"]
        )
        
        if dependencies_completed:
            ready_nodes.append(node_id)
    
    return ready_nodes
