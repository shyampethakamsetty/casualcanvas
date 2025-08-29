from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel
from ..auth.router import get_current_user
from ..auth.models import User
import uuid
import asyncio
from datetime import datetime
import os

# OpenAI integration
try:
    import openai
    OPENAI_AVAILABLE = True
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except ImportError:
    OPENAI_AVAILABLE = False
    openai_client = None

router = APIRouter()

class NodeTestRequest(BaseModel):
    node_type: str
    config: Dict[str, Any]
    inputs: Dict[str, Any] = {}

class NodeTestResponse(BaseModel):
    test_id: str
    status: str
    outputs: Dict[str, Any] = {}
    error: Optional[str] = None
    logs: list = []

@router.post("/test", response_model=NodeTestResponse)
async def test_node(
    request: NodeTestRequest,
    current_user: User = Depends(get_current_user)
):
    """Test an individual node with given inputs and configuration"""
    try:
        from ..database import Database
        import dramatiq
        
        db = Database.get_sync_db()
        test_id = f"test_{uuid.uuid4().hex[:8]}"
        
        # Create a temporary run record for testing
        test_run = {
            "_id": test_id,
            "workflow_id": "test",
            "status": "running",
            "created_by": current_user.id,
            "created_at": datetime.utcnow(),
            "node_status": {},
            "inputs": request.inputs,
            "outputs": {},
            "is_test": True
        }
        
        db.runs.insert_one(test_run)
        
        # Execute the node directly based on type
        node_outputs = {}
        error_msg = None
        
        try:
            if request.node_type.startswith("ingest."):
                node_outputs = await execute_ingest_node(test_id, "test_node", request.node_type, request.config, request.inputs)
            elif request.node_type.startswith("ai.") or request.node_type.startswith("text."):
                node_outputs = await execute_ai_node(test_id, "test_node", request.node_type, request.config, request.inputs)
            elif request.node_type.startswith("act."):
                node_outputs = await execute_action_node(test_id, "test_node", request.node_type, request.config, request.inputs)
            else:
                raise ValueError(f"Unknown node type: {request.node_type}")
                
        except Exception as e:
            error_msg = str(e)
            
        # Get logs from the test run
        logs = list(db.run_logs.find({"run_id": test_id}, {"_id": 0}).sort("timestamp", 1))
        
        # Clean up test run
        db.runs.delete_one({"_id": test_id})
        db.run_logs.delete_many({"run_id": test_id})
        
        return NodeTestResponse(
            test_id=test_id,
            status="completed" if not error_msg else "failed",
            outputs=node_outputs or {},
            error=error_msg,
            logs=logs
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Node test failed: {str(e)}")

async def execute_ingest_node(run_id: str, node_id: str, node_type: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Execute ingest node synchronously for testing"""
    if node_type == "ingest.pdf":
        # Debug logging
        print(f"DEBUG: PDF test config received: {config}")
        
        # Get file path and uploaded file ID from config
        file_path = config.get("file_path", "")
        uploaded_file_id = config.get("uploaded_file_id", "")
        selected_file = config.get("selected_file", "")
        
        # If no uploaded_file_id but we have selected_file, use that
        if not uploaded_file_id and selected_file:
            uploaded_file_id = selected_file
            print(f"DEBUG: Using selected_file as uploaded_file_id: {uploaded_file_id}")
        
        print(f"DEBUG: file_path = '{file_path}', uploaded_file_id = '{uploaded_file_id}'")
        
        # If we have an uploaded_file_id but no file_path or file doesn't exist, try to look it up from database
        if uploaded_file_id and (not file_path or not os.path.exists(file_path)):
            try:
                from ..database import Database
                db = Database.get_sync_db()
                
                # Look up the file in the database
                file_doc = db.uploaded_files.find_one({"file_id": uploaded_file_id})
                if file_doc:
                    stored_file_path = file_doc.get("file_path")
                    print(f"DEBUG: Found file in database with path: {stored_file_path}")
                    
                    if stored_file_path and os.path.exists(stored_file_path):
                        file_path = stored_file_path
                        print(f"DEBUG: Using database file path: {file_path}")
                    else:
                        print(f"DEBUG: File in database but doesn't exist at path: {stored_file_path}")
                else:
                    print(f"DEBUG: No file found in database for uploaded_file_id: {uploaded_file_id}")
            except Exception as e:
                print(f"DEBUG: Error looking up file in database: {str(e)}")
        
        if file_path and os.path.exists(file_path):
            try:
                # Actually process the PDF file
                import PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    content = ""
                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        content += f"[Page {page_num + 1}]\n{page_text}\n\n"
                
                if not content.strip():
                    content = "PDF processed successfully, but no extractable text was found. The PDF might contain images or scanned content."
                
                return {
                    "content": content.strip(),
                    "document_id": uploaded_file_id or f"doc_{uuid.uuid4().hex[:8]}",
                    "type": "text",
                    "pages_processed": len(pdf_reader.pages),
                    "file_path": file_path
                }
                
            except ImportError:
                return {
                    "content": f"PDF file found at {file_path} but PyPDF2 library is not available for text extraction.",
                    "document_id": uploaded_file_id or f"doc_{uuid.uuid4().hex[:8]}",
                    "type": "text",
                    "error": "PyPDF2 not available"
                }
            except Exception as e:
                return {
                    "content": f"Error processing PDF file {file_path}: {str(e)}",
                    "document_id": uploaded_file_id or f"doc_{uuid.uuid4().hex[:8]}",
                    "type": "text",
                    "error": str(e)
                }
        else:
            # Provide more detailed error message
            if uploaded_file_id:
                error_msg = f"File with ID {uploaded_file_id} not found. The file may have been deleted or the path {file_path} no longer exists."
            else:
                error_msg = "No valid PDF file path provided. Please upload a PDF file first and select it in the node configuration."
            
            return {
                "content": error_msg,
                "document_id": f"doc_{uuid.uuid4().hex[:8]}",
                "type": "text",
                "error": "No file selected"
            }
    elif node_type == "ingest.url":
        url = config.get("url", "https://example.com")
        return {
            "content": f"Content fetched from {url}. This is sample web content for testing.",
            "document_id": f"doc_{uuid.uuid4().hex[:8]}",
            "url": url,
            "type": "text"
        }
    elif node_type == "ingest.webhook":
        return {
            "content": str(inputs.get("data", "Sample webhook data")),
            "document_id": f"doc_{uuid.uuid4().hex[:8]}",
            "type": "webhook"
        }
    
    return {"error": "Unknown ingest node type"}

async def execute_ai_node(run_id: str, node_id: str, node_type: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Execute AI node synchronously for testing"""
    content = inputs.get("content", "Sample text content for testing")
    
    if node_type == "ai.rag_qa":
        query = config.get("query", "What is this about?")
        return {
            "answer": f"Based on the content, here's the answer to '{query}': This appears to be sample content used for testing the RAG functionality.",
            "citations": ["Test document"],
            "query": query,
            "type": "text"
        }
    elif node_type == "ai.summarize":
        # Get content from inputs first, then config, then default
        content = inputs.get("content", config.get("content", "Sample text content for testing"))
        max_length = config.get("max_length", 150)
        summary_type = config.get("type", "brief")  # brief, detailed, bullet_points
        
        # If no content provided, use a more helpful default
        if not content or content == "Sample text content for testing":
            content = "This is a longer piece of text that needs to be summarized. It contains multiple sentences and ideas that should be condensed into a shorter format. The content could come from a PDF document, web page, or any other text source. When connected to other nodes like PDF ingestion, this node will receive the actual extracted text content and provide an intelligent summary based on the specified parameters."
        
        # Try to use OpenAI for real summarization
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            try:
                # Create appropriate prompt based on summary type
                if summary_type == "bullet_points":
                    instruction = "Summarize the following text in clear bullet points. Each point should be concise and capture key information:"
                elif summary_type == "detailed":
                    instruction = "Provide a comprehensive and detailed summary of the following text, covering all major points and important details:"
                else:  # brief
                    instruction = "Provide a brief, clear summary of the following text, capturing the main points concisely:"
                
                # Limit content to avoid token limits
                content_to_summarize = content[:4000] if len(content) > 4000 else content
                
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": f"You are a helpful assistant that creates {summary_type.replace('_', ' ')} summaries. Aim for approximately {max_length} words."
                        },
                        {
                            "role": "user", 
                            "content": f"{instruction}\n\nText to summarize:\n{content_to_summarize}\n\nSummary:"
                        }
                    ],
                    max_tokens=max_length * 3,  # Rough estimate for tokens
                    temperature=0.3
                )
                
                ai_summary = response.choices[0].message.content.strip()
                summary_length = len(ai_summary.split())
                
                return {
                    "summary": ai_summary,
                    "original_length": len(content.split()),
                    "summary_length": summary_length,
                    "summary_type": summary_type,
                    "content": content,  # Include original content for reference
                    "type": "text",
                    "ai_powered": True
                }
                
            except Exception as e:
                # Fallback if OpenAI fails
                fallback_summary = f"AI summarization failed ({str(e)}). Fallback summary: " + " ".join(content.split()[:max_length])
                return {
                    "summary": fallback_summary,
                    "original_length": len(content.split()),
                    "summary_length": len(fallback_summary.split()),
                    "summary_type": summary_type,
                    "content": content,
                    "type": "text",
                    "ai_powered": False,
                    "error": str(e)
                }
        else:
            # Mock summary when OpenAI is not available
            mock_summary = f"Mock {summary_type} summary (OpenAI not configured): " + " ".join(content.split()[:max_length//2])
            return {
                "summary": mock_summary,
                "original_length": len(content.split()),
                "summary_length": len(mock_summary.split()),
                "summary_type": summary_type,
                "content": content,
                "type": "text",
                "ai_powered": False,
                "note": "OpenAI API key not configured - using mock summary"
            }
    elif node_type == "ai.classify":
        categories = config.get("categories", "business\ntechnology\nother").split("\n")
        return {
            "category": categories[0] if categories else "unknown",
            "confidence": 0.85,
            "all_categories": {cat: 0.8 if cat == categories[0] else 0.2 for cat in categories},
            "type": "classification"
        }
    elif node_type == "text.transform":
        operation = config.get("operation", "uppercase")
        if operation == "uppercase":
            transformed = content.upper()
        elif operation == "lowercase":
            transformed = content.lower()
        else:
            transformed = f"Transformed content: {content}"
        
        return {
            "transformed_text": transformed,
            "operation": operation,
            "type": "text"
        }
    
    return {"error": "Unknown AI node type"}

async def execute_action_node(run_id: str, node_id: str, node_type: str, config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Execute action node synchronously for testing"""
    if node_type == "act.slack":
        channel = config.get("channel", "#general")
        message = config.get("message", inputs.get("content", "Test message"))
        return {
            "timestamp": f"test_{uuid.uuid4().hex[:8]}",
            "channel": channel,
            "message": message,
            "type": "slack_post"
        }
    elif node_type == "act.email":
        to_email = config.get("to", "test@example.com")
        subject = config.get("subject", "Test Subject")
        return {
            "message_id": f"email_{uuid.uuid4().hex[:8]}",
            "to": to_email,
            "subject": subject,
            "type": "email"
        }
    elif node_type == "act.sheets":
        spreadsheet_id = config.get("spreadsheetId", "test_sheet_id")
        return {
            "spreadsheet_id": spreadsheet_id,
            "range": config.get("range", "A:A"),
            "rows_added": 1,
            "type": "sheets"
        }
    
    return {"error": "Unknown action node type"}

@router.get("/sample-inputs/{node_type}")
async def get_sample_inputs(node_type: str):
    """Get sample inputs for a node type"""
    sample_inputs = {
        "ingest.pdf": {},
        "ingest.url": {},
        "ingest.webhook": {"data": {"message": "Sample webhook payload"}},
        "ai.rag_qa": {"content": "Sample document content to query", "query": "What is this document about?"},
        "ai.summarize": {"content": "This is a longer piece of text that needs to be summarized. It contains multiple sentences and ideas that should be condensed into a shorter format."},
        "ai.classify": {"content": "This is a business-related document discussing quarterly revenue and market analysis."},
        "text.transform": {"content": "sample text to transform"},
        "act.slack": {"content": "Message to post to Slack"},
        "act.email": {"content": "Email body content"},
        "act.sheets": {"content": "Data to add to spreadsheet"}
    }
    
    return {"inputs": sample_inputs.get(node_type, {})} 