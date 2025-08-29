import os
import uuid
import requests
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException
from bs4 import BeautifulSoup
import PyPDF2
import io
from ..database import Database

class IngestService:
    def __init__(self):
        self.db = Database()
    
    async def upload_file(self, file: UploadFile) -> Dict[str, Any]:
        """Upload and process a file"""
        try:
            # Generate document ID
            doc_id = str(uuid.uuid4())
            
            # Read file content
            content = await file.read()
            
            # Process based on file type
            if file.content_type == "application/pdf":
                text_content = self._extract_pdf_text(content)
            elif file.content_type.startswith("text/"):
                text_content = content.decode('utf-8')
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
            
            # Chunk the content
            chunks = self._chunk_text(text_content)
            
            # Store document in MongoDB
            document = {
                "id": doc_id,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(content),
                "content": text_content,
                "chunks": chunks,
                "created_at": datetime.utcnow(),
                "type": "upload"
            }
            
            await self.db.documents.insert_one(document)
            
            return {
                "document_id": doc_id,
                "filename": file.filename,
                "size": len(content),
                "content_type": file.content_type,
                "chunks": len(chunks),
                "created_at": document["created_at"]
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    async def fetch_url(self, url: str, extract_text: bool = True, chunk_size: int = 1000, chunk_overlap: int = 200) -> Dict[str, Any]:
        """Fetch and process content from URL"""
        try:
            # Generate document ID
            doc_id = str(uuid.uuid4())
            
            # Fetch URL content
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Extract text if requested
            if extract_text:
                soup = BeautifulSoup(response.content, 'html.parser')
                title = soup.find('title')
                title_text = title.get_text().strip() if title else None
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                text_content = soup.get_text()
                # Clean up text
                lines = (line.strip() for line in text_content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text_content = ' '.join(chunk for chunk in chunks if chunk)
            else:
                text_content = response.text
                title_text = None
            
            # Chunk the content
            chunks = self._chunk_text(text_content, chunk_size, chunk_overlap)
            
            # Store document in MongoDB
            document = {
                "id": doc_id,
                "url": url,
                "title": title_text,
                "content": text_content,
                "chunks": chunks,
                "created_at": datetime.utcnow(),
                "type": "url"
            }
            
            await self.db.documents.insert_one(document)
            
            return {
                "document_id": doc_id,
                "url": url,
                "title": title_text,
                "content": text_content[:500] + "..." if len(text_content) > 500 else text_content,
                "chunks": len(chunks),
                "created_at": document["created_at"]
            }
            
        except requests.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")
    
    async def process_webhook(self, data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Process webhook data"""
        try:
            # Generate document ID
            doc_id = str(uuid.uuid4())
            
            # Convert data to text
            text_content = self._dict_to_text(data)
            
            # Chunk the content
            chunks = self._chunk_text(text_content)
            
            # Store document in MongoDB
            document = {
                "id": doc_id,
                "source": source,
                "data": data,
                "content": text_content,
                "chunks": chunks,
                "created_at": datetime.utcnow(),
                "type": "webhook"
            }
            
            await self.db.documents.insert_one(document)
            
            return {
                "document_id": doc_id,
                "source": source,
                "processed": True,
                "created_at": document["created_at"]
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")
    
    def _extract_pdf_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error extracting PDF text: {str(e)}")
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                if break_point > start + chunk_size // 2:
                    chunk = text[start:start + break_point + 1]
                    end = start + break_point + 1
            
            chunks.append({
                "id": len(chunks),
                "text": chunk.strip(),
                "start": start,
                "end": end
            })
            
            start = end - chunk_overlap
            if start >= len(text):
                break
        
        return chunks
    
    def _dict_to_text(self, data: Dict[str, Any]) -> str:
        """Convert dictionary to text representation"""
        def format_value(value, indent=0):
            if isinstance(value, dict):
                lines = []
                for k, v in value.items():
                    lines.append("  " * indent + f"{k}: {format_value(v, indent + 1)}")
                return "\n".join(lines)
            elif isinstance(value, list):
                lines = []
                for i, item in enumerate(value):
                    lines.append("  " * indent + f"[{i}]: {format_value(item, indent + 1)}")
                return "\n".join(lines)
            else:
                return str(value)
        
        return format_value(data) 