from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Slack Models
class SlackMessageRequest(BaseModel):
    channel: str
    text: str
    blocks: Optional[List[Dict[str, Any]]] = None

class SlackMessageResponse(BaseModel):
    ts: str
    channel: str
    message: str
    sent_at: datetime

# Google Sheets Models
class SheetsAppendRequest(BaseModel):
    spreadsheet_id: str
    range: str
    values: List[List[str]]

class SheetsAppendResponse(BaseModel):
    updated_range: str
    updated_rows: int
    updated_columns: int
    updated_cells: int
    updated_at: datetime

# Email Models
class EmailSendRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    body: str
    html_body: Optional[str] = None

class EmailSendResponse(BaseModel):
    message_id: str
    to: List[str]
    subject: str
    sent_at: datetime

# Notion Models
class NotionUpsertRequest(BaseModel):
    database_id: str
    properties: Dict[str, Any]

class NotionUpsertResponse(BaseModel):
    page_id: str
    database_id: str
    properties: Dict[str, Any]
    created_at: datetime

# Twilio Models
class TwilioSMSRequest(BaseModel):
    to: str
    from_: str
    body: str

class TwilioSMSResponse(BaseModel):
    sid: str
    to: str
    from_: str
    body: str
    sent_at: datetime 