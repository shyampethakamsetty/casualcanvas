from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ..auth.router import get_current_user
from ..auth.models import User
import os
import shutil
import uuid
from datetime import datetime

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "/tmp/aiwf_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and store file for processing"""
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        stored_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, stored_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store file metadata in database
        from ..database import Database
        db = Database.get_sync_db()
        
        file_doc = {
            "file_id": file_id,
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "content_type": file.content_type,
            "uploaded_by": current_user.id,
            "uploaded_at": datetime.utcnow(),
            "status": "uploaded"
        }
        
        result = db.uploaded_files.insert_one(file_doc)
        
        return {
            "document_id": file_id,
            "filename": file.filename,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "status": "uploaded"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("/fetch")
async def fetch(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """Fetch content from URL for processing"""
    try:
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Store URL fetch request in database
        from ..database import Database
        db = Database.get_sync_db()
        
        fetch_doc = {
            "document_id": doc_id,
            "url": url,
            "requested_by": current_user.id,
            "requested_at": datetime.utcnow(),
            "status": "pending"
        }
        
        db.url_fetches.insert_one(fetch_doc)
        
        return {
            "document_id": doc_id,
            "url": url,
            "status": "pending"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL fetch request failed: {str(e)}")

@router.get("/status/{document_id}")
async def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the status of a document processing request"""
    from ..database import Database
    db = Database.get_sync_db()
    
    # Check uploaded files
    file_doc = db.uploaded_files.find_one({"file_id": document_id})
    if file_doc:
        return {
            "document_id": document_id,
            "type": "file",
            "status": file_doc.get("status", "uploaded"),
            "filename": file_doc.get("original_filename")
        }
    
    # Check URL fetches
    url_doc = db.url_fetches.find_one({"document_id": document_id})
    if url_doc:
        return {
            "document_id": document_id,
            "type": "url",
            "status": url_doc.get("status", "pending"),
            "url": url_doc.get("url")
        }
    
    raise HTTPException(status_code=404, detail="Document not found")

@router.get("/files")
async def list_uploaded_files(
    current_user: User = Depends(get_current_user)
):
    """List uploaded files for the current user"""
    from ..database import Database
    db = Database.get_sync_db()
    
    # Get uploaded files for the current user
    files = list(db.uploaded_files.find(
        {"uploaded_by": current_user.id}, 
        {"_id": 0}
    ).sort("uploaded_at", -1).limit(50))
    
    return {"files": files}

@router.delete("/files/{file_id}")
async def delete_uploaded_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an uploaded file"""
    from ..database import Database
    db = Database.get_sync_db()
    
    # Find the file owned by the current user
    file_doc = db.uploaded_files.find_one({
        "file_id": file_id,
        "uploaded_by": current_user.id
    })
    
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Delete the physical file
        file_path = file_doc.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from database
        result = db.uploaded_files.delete_one({
            "file_id": file_id,
            "uploaded_by": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
