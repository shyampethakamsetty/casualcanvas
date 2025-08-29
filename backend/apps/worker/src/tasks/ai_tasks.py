import dramatiq
import time
import os
from typing import Dict, Any
from pymongo import MongoClient
from .common import node_completed

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017/aiwf")
mongo_client = MongoClient(mongo_url)
db = mongo_client.aiwf

# OpenAI integration
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI not available - using fallback responses")

@dramatiq.actor(queue_name="ai")
def rag_query(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Perform RAG query on documents"""
    try:
        print(f"[ai] Performing RAG query for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting RAG query"
        })
        
        # Get query from config or inputs
        query = config.get("query") or inputs.get("query", "What is this document about?")
        
        # Get document content from inputs
        content = inputs.get("content", "")
        document_id = inputs.get("document_id", "")
        
        # If we have document_id but no content, fetch from database
        if document_id and not content:
            doc = db.documents.find_one({"_id": document_id})
            if doc:
                content = doc.get("content", "")
        
        if not content:
            raise ValueError("No document content available for RAG query")
        
        # Perform RAG with OpenAI
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            try:
                # Create a prompt for RAG
                prompt = f"""Based on the following document content, please answer the question: "{query}"

Document content:
{content[:4000]}  # Limit content to avoid token limits

Please provide a comprehensive answer based on the document content. If the answer cannot be found in the document, please say so.

Answer:"""

                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that answers questions based on provided document content. Be accurate and cite relevant parts of the document."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                
                answer = response.choices[0].message.content
                citations = ["AI-generated response based on document content"]
                
            except Exception as e:
                print(f"[ai] OpenAI API error: {e}")
                answer = f"Error using OpenAI API: {str(e)}. Falling back to document excerpt."
                citations = ["Error response"]
        else:
            # Fallback response when OpenAI is not available
            answer = f"Based on the document content, here's what I found regarding: {query}. The document contains relevant information that addresses your question. (Note: This is a fallback response - OpenAI integration not available)"
            citations = ["Fallback response"]
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "RAG query completed",
            "outputs": {"answer": answer, "citations": citations}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "answer": answer,
            "citations": citations,
            "query": query,
            "type": "text"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[ai] Error in RAG query: {e}")
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"RAG query failed: {str(e)}"
        })
        # Update run status
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="ai")
def summarize_text(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Summarize text content using OpenAI"""
    try:
        print(f"[ai] Summarizing text for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting text summarization"
        })
        
        # Get content from inputs
        content = inputs.get("content", "")
        if not content:
            raise ValueError("No content provided for summarization")
        
        # Get summary parameters from config
        max_length = config.get("max_length", 150)
        summary_type = config.get("type", "brief")  # brief, detailed, bullet_points
        
        # Perform summarization with OpenAI
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            try:
                # Create appropriate prompt based on summary type
                if summary_type == "bullet_points":
                    instruction = "Summarize the following text in bullet points:"
                elif summary_type == "detailed":
                    instruction = "Provide a detailed summary of the following text:"
                else:
                    instruction = "Provide a brief summary of the following text:"
                
                prompt = f"""{instruction}

Text to summarize:
{content[:3000]}  # Limit to avoid token limits

Summary (approximately {max_length} words):"""

                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"You are a helpful assistant that creates {summary_type} summaries. Keep summaries around {max_length} words."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_length * 2,  # Rough estimate for tokens
                    temperature=0.3
                )
                
                summary = response.choices[0].message.content
                
            except Exception as e:
                print(f"[ai] OpenAI API error: {e}")
                # Fallback summary
                words = content.split()
                summary = " ".join(words[:max_length]) + "..." if len(words) > max_length else content
                summary = f"[Fallback Summary] {summary}"
        else:
            # Fallback summary when OpenAI is not available
            words = content.split()
            summary = " ".join(words[:max_length]) + "..." if len(words) > max_length else content
            summary = f"[Fallback Summary] {summary}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Text summarization completed",
            "outputs": {"summary": summary, "original_length": len(content)}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "summary": summary,
            "original_length": len(content),
            "summary_length": len(summary),
            "type": "text"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[ai] Error in text summarization: {e}")
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Text summarization failed: {str(e)}"
        })
        # Update run status
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="ai")
def classify_text(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Classify text content"""
    try:
        print(f"[ai] Classifying text for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting text classification"
        })
        
        # Get content from inputs
        content = inputs.get("content", "")
        if not content:
            raise ValueError("No content provided for classification")
        
        # TODO: Implement actual AI classification
        # For now, simulate classification
        import time
        time.sleep(2)  # Simulate processing time
        
        # Simple text classification (placeholder)
        categories = ["business", "technology", "health", "education", "entertainment"]
        confidence_scores = [0.1, 0.3, 0.1, 0.4, 0.1]
        
        # Find highest confidence category
        max_confidence = max(confidence_scores)
        predicted_category = categories[confidence_scores.index(max_confidence)]
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Text classification completed",
            "outputs": {"category": predicted_category, "confidence": max_confidence}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "category": predicted_category,
            "confidence": max_confidence,
            "all_categories": dict(zip(categories, confidence_scores)),
            "type": "classification"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[ai] Error in text classification: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Text classification failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="ai")
def transform_text(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Transform text content"""
    try:
        print(f"[ai] Transforming text for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting text transformation"
        })
        
        # Get content from inputs
        content = inputs.get("content", "")
        if not content:
            raise ValueError("No content provided for transformation")
        
        # Get transformation type from config
        transform_type = config.get("type", "uppercase")
        
        # TODO: Implement actual AI text transformation
        # For now, simulate transformation
        import time
        time.sleep(1)  # Simulate processing time
        
        # Simple text transformations (placeholder)
        if transform_type == "uppercase":
            transformed = content.upper()
        elif transform_type == "lowercase":
            transformed = content.lower()
        elif transform_type == "title_case":
            transformed = content.title()
        elif transform_type == "reverse":
            transformed = content[::-1]
        else:
            transformed = content  # Default to no change
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Text transformation completed",
            "outputs": {"transformed_text": transformed}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "transformed_text": transformed,
            "original_text": content,
            "transform_type": transform_type,
            "type": "text"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[ai] Error in text transformation: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Text transformation failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )
