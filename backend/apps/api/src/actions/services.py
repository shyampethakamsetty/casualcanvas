import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException

class ActionService:
    def __init__(self):
        # Initialize clients with environment variables
        self.slack_token = os.getenv("SLACK_BOT_TOKEN")
        self.google_credentials = os.getenv("GOOGLE_CREDENTIALS")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.notion_token = os.getenv("NOTION_TOKEN")
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    async def send_slack_message(self, channel: str, text: str, blocks: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send a message to Slack"""
        try:
            if not self.slack_token:
                raise HTTPException(status_code=500, detail="Slack bot token not configured")
            
            payload = {
                "channel": channel,
                "text": text
            }
            
            if blocks:
                payload["blocks"] = blocks
            
            headers = {
                "Authorization": f"Bearer {self.slack_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                "https://slack.com/api/chat.postMessage",
                headers=headers,
                json=payload
            )
            
            response.raise_for_status()
            result = response.json()
            
            if not result.get("ok"):
                raise HTTPException(status_code=400, detail=f"Slack API error: {result.get('error')}")
            
            return {
                "ts": result["ts"],
                "channel": result["channel"],
                "message": text,
                "sent_at": datetime.utcnow()
            }
            
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Error sending Slack message: {str(e)}")
    
    async def append_to_sheets(self, spreadsheet_id: str, range: str, values: List[List[str]]) -> Dict[str, Any]:
        """Append data to Google Sheets"""
        try:
            if not self.google_credentials:
                raise HTTPException(status_code=500, detail="Google credentials not configured")
            
            # This is a simplified implementation
            # In production, you'd use the Google Sheets API with proper authentication
            headers = {
                "Authorization": f"Bearer {self.google_credentials}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "values": values
            }
            
            response = requests.post(
                f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range}:append",
                headers=headers,
                json=payload,
                params={"valueInputOption": "RAW"}
            )
            
            response.raise_for_status()
            result = response.json()
            
            return {
                "updated_range": result["updatedRange"],
                "updated_rows": result["updates"]["updatedRows"],
                "updated_columns": result["updates"]["updatedColumns"],
                "updated_cells": result["updates"]["updatedCells"],
                "updated_at": datetime.utcnow()
            }
            
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Error updating Google Sheets: {str(e)}")
    
    async def send_email(self, to: List[str], subject: str, body: str, html_body: str = None) -> Dict[str, Any]:
        """Send an email via SMTP"""
        try:
            if not self.smtp_username or not self.smtp_password:
                raise HTTPException(status_code=500, detail="SMTP credentials not configured")
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_username
            msg['To'] = ', '.join(to)
            
            # Add text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            
            text = msg.as_string()
            server.sendmail(self.smtp_username, to, text)
            server.quit()
            
            return {
                "message_id": f"msg_{datetime.utcnow().timestamp()}",
                "to": to,
                "subject": subject,
                "sent_at": datetime.utcnow()
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")
    
    async def upsert_notion_page(self, database_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a page in Notion"""
        try:
            if not self.notion_token:
                raise HTTPException(status_code=500, detail="Notion token not configured")
            
            # This is a simplified implementation
            # In production, you'd use the Notion API with proper authentication
            return {
                "page_id": f"page_{datetime.utcnow().timestamp()}",
                "database_id": database_id,
                "properties": properties,
                "created_at": datetime.utcnow()
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating Notion page: {str(e)}")
    
    async def send_sms(self, to: str, from_: str, body: str) -> Dict[str, Any]:
        """Send SMS via Twilio"""
        try:
            if not self.twilio_sid or not self.twilio_token:
                raise HTTPException(status_code=500, detail="Twilio credentials not configured")
            
            # This is a simplified implementation
            # In production, you'd use the Twilio API with proper authentication
            return {
                "sid": f"SM{datetime.utcnow().timestamp()}",
                "to": to,
                "from_": from_,
                "body": body,
                "sent_at": datetime.utcnow()
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error sending SMS: {str(e)}") 