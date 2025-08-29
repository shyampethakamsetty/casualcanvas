from fastapi import APIRouter, Depends, HTTPException
from .models import (
    SlackMessageRequest, SlackMessageResponse,
    SheetsAppendRequest, SheetsAppendResponse,
    EmailSendRequest, EmailSendResponse,
    NotionUpsertRequest, NotionUpsertResponse,
    TwilioSMSRequest, TwilioSMSResponse
)
from .services import ActionService
from ..auth.router import get_current_user
from ..auth.models import User

router = APIRouter()
action_service = ActionService()

@router.post("/slack.postMessage", response_model=SlackMessageResponse)
async def slack_post_message(
    request: SlackMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a message to Slack"""
    result = await action_service.send_slack_message(
        request.channel,
        request.text,
        request.blocks
    )
    return SlackMessageResponse(**result)

@router.post("/sheets.append", response_model=SheetsAppendResponse)
async def sheets_append(
    request: SheetsAppendRequest,
    current_user: User = Depends(get_current_user)
):
    """Append data to Google Sheets"""
    result = await action_service.append_to_sheets(
        request.spreadsheet_id,
        request.range,
        request.values
    )
    return SheetsAppendResponse(**result)

@router.post("/email.send", response_model=EmailSendResponse)
async def email_send(
    request: EmailSendRequest,
    current_user: User = Depends(get_current_user)
):
    """Send an email"""
    result = await action_service.send_email(
        request.to,
        request.subject,
        request.body,
        request.html_body
    )
    return EmailSendResponse(**result)

@router.post("/notion.upsert", response_model=NotionUpsertResponse)
async def notion_upsert(
    request: NotionUpsertRequest,
    current_user: User = Depends(get_current_user)
):
    """Create or update a page in Notion"""
    result = await action_service.upsert_notion_page(
        request.database_id,
        request.properties
    )
    return NotionUpsertResponse(**result)

@router.post("/twilio.sms", response_model=TwilioSMSResponse)
async def twilio_sms(
    request: TwilioSMSRequest,
    current_user: User = Depends(get_current_user)
):
    """Send SMS via Twilio"""
    result = await action_service.send_sms(
        request.to,
        request.from_,
        request.body
    )
    return TwilioSMSResponse(**result)
