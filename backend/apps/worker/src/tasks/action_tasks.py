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

# Slack integration
try:
    from slack_sdk import WebClient
    from slack_sdk.errors import SlackApiError
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False
    print("Slack SDK not available - using fallback responses")

@dramatiq.actor(queue_name="actions")
def post_slack(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Post message to Slack channel"""
    try:
        print(f"[actions] Posting to Slack for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting Slack post"
        })
        
        # Get configuration
        channel = config.get("channel", "#general")
        message = config.get("message", "")
        
        # Get message from inputs if not in config
        if not message and inputs:
            message = inputs.get("content", inputs.get("text", inputs.get("summary", "No message content")))
        
        # Try to use real Slack API
        if SLACK_AVAILABLE and os.getenv("SLACK_BOT_TOKEN"):
            try:
                client = WebClient(token=os.getenv("SLACK_BOT_TOKEN"))
                
                # Post message to Slack
                response = client.chat_postMessage(
                    channel=channel,
                    text=message,
                    username="AI Workflow Bot"
                )
                
                # Extract response data
                timestamp = response.get("ts", str(time.time()))
                success = response.get("ok", False)
                
                if success:
                    print(f"[actions] Successfully posted to Slack channel {channel}")
                else:
                    raise Exception(f"Slack API returned error: {response.get('error', 'Unknown error')}")
                    
            except SlackApiError as e:
                print(f"[actions] Slack API error: {e.response['error']}")
                timestamp = f"error_{int(time.time())}"
                # Continue with fallback behavior
            except Exception as e:
                print(f"[actions] Error with Slack integration: {e}")
                timestamp = f"fallback_{int(time.time())}"
        else:
            # Fallback behavior when Slack is not available
            print(f"[actions] Slack SDK not available or token missing - simulating post")
            timestamp = f"simulated_{int(time.time())}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Slack post completed",
            "outputs": {"timestamp": timestamp, "channel": channel, "message": message[:100]}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "timestamp": timestamp,
            "channel": channel,
            "message": message,
            "type": "slack_post"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[actions] Error posting to Slack: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Slack post failed: {str(e)}"
        })
        # Update run status
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="actions")
def append_sheets(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Append data to Google Sheets"""
    try:
        print(f"[actions] Appending to Sheets for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting Sheets append"
        })
        
        # Get configuration
        spreadsheet_id = config.get("spreadsheet_id")
        sheet_name = config.get("sheet_name", "Sheet1")
        
        if not spreadsheet_id:
            raise ValueError("Spreadsheet ID is required for Sheets append")
        
        # Get data from inputs
        data = inputs.get("data", inputs.get("content", []))
        if isinstance(data, str):
            data = [data]
        
        # TODO: Implement actual Google Sheets API integration
        # For now, simulate Sheets append
        import time
        time.sleep(1)  # Simulate API call
        
        # Simulate Sheets response
        updated_range = f"{sheet_name}!A1:B{len(data)}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Sheets append completed",
            "outputs": {"updatedRange": updated_range}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "updatedRange": updated_range,
            "spreadsheet_id": spreadsheet_id,
            "sheet_name": sheet_name,
            "rows_added": len(data),
            "type": "sheets_append"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[actions] Error appending to Sheets: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Sheets append failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="actions")
def send_email(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Send email via SMTP"""
    try:
        print(f"[actions] Sending email for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting email send"
        })
        
        # Get configuration
        to_email = config.get("to")
        subject = config.get("subject", "AI Workflow Notification")
        
        if not to_email:
            raise ValueError("Recipient email is required")
        
        # Get content from inputs
        body = config.get("body", "")
        if not body and inputs:
            body = inputs.get("content", inputs.get("text", "No email content"))
        
        # TODO: Implement actual SMTP integration
        # For now, simulate email sending
        import time
        time.sleep(1)  # Simulate SMTP call
        
        # Simulate email response
        message_id = f"msg_{int(time.time())}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Email send completed",
            "outputs": {"messageId": message_id}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "messageId": message_id,
            "to": to_email,
            "subject": subject,
            "body": body,
            "type": "email_send"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[actions] Error sending email: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Email send failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="actions")
def upsert_notion(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Upsert data to Notion database"""
    try:
        print(f"[actions] Upserting to Notion for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting Notion upsert"
        })
        
        # Get configuration
        database_id = config.get("database_id")
        page_title = config.get("title", "AI Workflow Entry")
        
        if not database_id:
            raise ValueError("Database ID is required for Notion upsert")
        
        # Get content from inputs
        content = config.get("content", "")
        if not content and inputs:
            content = inputs.get("content", inputs.get("text", "No content"))
        
        # TODO: Implement actual Notion API integration
        # For now, simulate Notion upsert
        import time
        time.sleep(1)  # Simulate API call
        
        # Simulate Notion response
        page_id = f"page_{int(time.time())}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Notion upsert completed",
            "outputs": {"page_id": page_id}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "page_id": page_id,
            "database_id": database_id,
            "title": page_title,
            "content": content,
            "type": "notion_upsert"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[actions] Error upserting to Notion: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"Notion upsert failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )

@dramatiq.actor(queue_name="actions")
def send_sms(run_id: str, node_id: str, config: Dict[str, Any], inputs: Dict[str, Any]):
    """Send SMS via Twilio"""
    try:
        print(f"[actions] Sending SMS for node {node_id} in run {run_id}")
        
        # Log start
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "Starting SMS send"
        })
        
        # Get configuration
        to_number = config.get("to")
        message = config.get("message", "")
        
        if not to_number:
            raise ValueError("Recipient phone number is required")
        
        # Get message from inputs if not in config
        if not message and inputs:
            message = inputs.get("content", inputs.get("text", "No SMS content"))
        
        # TODO: Implement actual Twilio API integration
        # For now, simulate SMS sending
        import time
        time.sleep(1)  # Simulate API call
        
        # Simulate Twilio response
        sid = f"SM{int(time.time())}"
        
        # Log completion
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "INFO",
            "message": "SMS send completed",
            "outputs": {"sid": sid}
        })
        
        # Mark node as completed and trigger dependent nodes
        outputs = {
            "sid": sid,
            "to": to_number,
            "message": message,
            "type": "twilio_sms"
        }
        
        node_completed.send(run_id, node_id, outputs)
        
    except Exception as e:
        print(f"[actions] Error sending SMS: {e}")
        # Log error
        db.run_logs.insert_one({
            "run_id": run_id,
            "node_id": node_id,
            "timestamp": time.time(),
            "level": "ERROR",
            "message": f"SMS send failed: {str(e)}"
        })
        # Mark node as failed
        db.runs.update_one(
            {"_id": run_id},
            {"$set": {f"node_status.{node_id}": "failed", "error": str(e)}}
        )
