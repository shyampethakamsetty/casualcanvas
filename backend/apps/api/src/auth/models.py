from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Database User Model (for MongoDB storage)
class UserDB(BaseModel):
    email: str
    password_hash: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True
    role: str = "user"  # "user" or "admin"
    preferences: dict = {}
    profile: dict = {}

# API User Model (for responses)
class User(BaseModel):
    id: str
    email: str
    is_active: bool = True
    role: str = "user"
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    preferences: dict = {}
    profile: dict = {}

class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    role: str
    created_at: datetime
    last_login: Optional[datetime]
    preferences: dict
    profile: dict

class UserUpdateRequest(BaseModel):
    preferences: Optional[dict] = None
    profile: Optional[dict] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

# Helper function to convert MongoDB document to User model
def user_db_to_user(user_doc: dict) -> User:
    return User(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        is_active=user_doc.get("is_active", True),
        role=user_doc.get("role", "user"),
        created_at=user_doc.get("created_at"),
        last_login=user_doc.get("last_login"),
        preferences=user_doc.get("preferences", {}),
        profile=user_doc.get("profile", {})
    )

def user_db_to_user_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        is_active=user_doc.get("is_active", True),
        role=user_doc.get("role", "user"),
        created_at=user_doc.get("created_at"),
        last_login=user_doc.get("last_login"),
        preferences=user_doc.get("preferences", {}),
        profile=user_doc.get("profile", {})
    ) 