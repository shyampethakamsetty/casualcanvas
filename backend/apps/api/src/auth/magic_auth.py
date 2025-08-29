import os
import random
import string
import smtplib
from datetime import datetime, timedelta
from typing import Dict, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# In-memory storage for magic codes (in production, use Redis or database)
magic_codes: Dict[str, Dict] = {}

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@aiwf.local")
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"

def generate_magic_code() -> str:
    """Generate a 6-digit magic code"""
    return ''.join(random.choices(string.digits, k=6))

def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email using SMTP"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print(f"[EMAIL] No SMTP credentials configured, skipping email to {to_email}")
            return False
            
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, to_email, text)
        server.quit()
        
        print(f"[EMAIL] Magic code sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False

def send_magic_code(email: str) -> str:
    """Send magic code to email"""
    code = generate_magic_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    magic_codes[email] = {
        "code": code,
        "expires_at": expires_at,
        "attempts": 0
    }
    
    if DEV_MODE:
        # In development mode, print to console for easy access
        print(f"[DEV] Magic code for {email}: {code}")
        # Also store it for the dev endpoint
        magic_codes[email]["dev_visible"] = True
    else:
        # In production mode, send via email
        subject = "Your AI Workflow Builder Login Code"
        body = f"""
Hello,

Your login code for AI Workflow Builder is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
AI Workflow Builder Team
        """
        
        email_sent = send_email(email, subject, body)
        if not email_sent:
            # Fallback to dev mode if email fails
            print(f"[FALLBACK] Magic code for {email}: {code}")
    
    return code

def get_dev_magic_code(email: str) -> Optional[str]:
    """Get magic code for development mode (only works in DEV_MODE)"""
    if not DEV_MODE:
        return None
        
    if email not in magic_codes:
        return None
        
    stored_data = magic_codes[email]
    
    # Check if expired
    if datetime.utcnow() > stored_data["expires_at"]:
        return None
        
    return stored_data.get("code")

def verify_magic_code(email: str, code: str) -> bool:
    """Verify magic code"""
    if email not in magic_codes:
        return False
    
    stored_data = magic_codes[email]
    
    # Check if expired
    if datetime.utcnow() > stored_data["expires_at"]:
        del magic_codes[email]
        return False
    
    # Check attempts
    if stored_data["attempts"] >= 3:
        del magic_codes[email]
        return False
    
    # Increment attempts
    stored_data["attempts"] += 1
    
    # Check code
    if stored_data["code"] == code:
        del magic_codes[email]  # Remove code after successful verification
        return True
    
    return False

def cleanup_expired_codes():
    """Remove expired magic codes"""
    current_time = datetime.utcnow()
    expired_emails = [
        email for email, data in magic_codes.items()
        if current_time > data["expires_at"]
    ]
    
    for email in expired_emails:
        del magic_codes[email] 