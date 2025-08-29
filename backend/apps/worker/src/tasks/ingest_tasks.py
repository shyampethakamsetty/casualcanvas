import dramatiq
import time
import os
import requests
from typing import Dict, Any
from pymongo import MongoClient
from .common import node_completed

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/aiwf")
mongo_client = MongoClient(mongo_url)
db = mongo_client.aiwf

@dramatiq.actor(queue_name="ingest")
def ingest_pdf(run_id: str, node_id: str, config: Dict[str, Any]):
    """Process PDF document upload"""
    try:
        print(f"[ingest] Processing PDF for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting PDF processing"
        })
        
        # Get file path from config
        file_path = config.get("file_path")
        if not file_path:
            raise ValueError("No file_path provided in config")
        
        # Extract text content from PDF
        try:
            import PyPDF2
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                content = ""
                for page in pdf_reader.pages:
                    content += page.extract_text() + "\n"
        except ImportError:
            # Fallback if PyPDF2 is not available
            content = f"PDF file processed: {file_path}. Content extraction requires PyPDF2 library."
        except Exception as e:
            content = f"Error processing PDF: {str(e)}"
        
        # Store document in database
        doc_id = db.documents.insert_one({
            "type": "pdf",
            "content": content,
            "metadata": {
                "source": "upload",
                "node_id": node_id,
                "run_id": run_id,
                "file_path": file_path
            },
            "created_at": time.time()
        }).inserted_id
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "PDF processing completed",
            "outputs": {"document_id": str(doc_id), "content_length": len(content)}
        })
        
        # Mark node as completed and trigger dependent nodes
        node_completed(run_id, node_id, {"document_id": str(doc_id), "content": content})
        
    except Exception as e:
        print(f"[ingest] Error processing PDF: {e}")
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"PDF processing failed: {str(e)}"
        })
        raise e

@dramatiq.actor(queue_name="ingest")
def ingest_url(run_id: str, node_id: str, config: Dict[str, Any]):
    """Fetch and process content from URL"""
    try:
        print(f"[ingest] Fetching URL for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting URL fetch"
        })
        
        # Get URL from config
        url = config.get("url")
        if not url:
            raise ValueError("No URL provided in config")
        
        # Fetch content from URL
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Extract text content
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                content = soup.get_text()
                # Clean up whitespace
                lines = (line.strip() for line in content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                content = ' '.join(chunk for chunk in chunks if chunk)
            except ImportError:
                # Fallback if BeautifulSoup is not available
                content = response.text
        except Exception as e:
            content = f"Error fetching URL {url}: {str(e)}"
        
        # Store document in database
        doc_id = db.documents.insert_one({
            "type": "url",
            "content": content,
            "metadata": {
                "source": "url",
                "node_id": node_id,
                "run_id": run_id,
                "url": url,
                "status_code": response.status_code if 'response' in locals() else None
            },
            "created_at": time.time()
        }).inserted_id
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "URL fetch completed",
            "outputs": {"document_id": str(doc_id), "content_length": len(content)}
        })
        
        # Mark node as completed and trigger dependent nodes
        node_completed(run_id, node_id, {"document_id": str(doc_id), "content": content})
        
    except Exception as e:
        print(f"[ingest] Error fetching URL: {e}")
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"URL fetch failed: {str(e)}"
        })
        raise e

@dramatiq.actor(queue_name="ingest")
def ingest_webhook(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Process webhook data"""
    try:
        print(f"[ingest] Processing webhook for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting webhook processing"
        })
        
        # Get webhook data from inputs
        webhook_data = inputs.get("data", {})
        if not webhook_data:
            raise ValueError("No webhook data provided in inputs")
        
        # Process webhook data
        content = str(webhook_data)
        
        # Store document in database
        doc_id = db.documents.insert_one({
            "type": "webhook",
            "content": content,
            "metadata": {
                "source": "webhook",
                "node_id": node_id,
                "run_id": run_id,
                "webhook_data": webhook_data
            },
            "created_at": time.time()
        }).inserted_id
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Webhook processing completed",
            "outputs": {"document_id": str(doc_id), "content_length": len(content)}
        })
        
        # Mark node as completed and trigger dependent nodes
        node_completed(run_id, node_id, {"document_id": str(doc_id), "content": content})
        
    except Exception as e:
        print(f"[ingest] Error processing webhook: {e}")
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Webhook processing failed: {str(e)}"
        })
        raise e
