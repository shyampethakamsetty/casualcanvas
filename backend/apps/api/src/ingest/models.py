from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    size: int
    content_type: str
    chunks: int
    created_at: datetime

class FetchRequest(BaseModel):
    url: HttpUrl
    extract_text: bool = True
    chunk_size: int = 1000
    chunk_overlap: int = 200

class FetchResponse(BaseModel):
    document_id: str
    url: str
    title: Optional[str] = None
    content: Optional[str] = None
    chunks: int
    created_at: datetime

class WebhookRequest(BaseModel):
    data: Dict[str, Any]
    source: str
    timestamp: Optional[datetime] = None

class WebhookResponse(BaseModel):
    document_id: str
    source: str
    processed: bool
    created_at: datetime 