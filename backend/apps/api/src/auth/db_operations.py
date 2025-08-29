import os
from datetime import datetime
from typing import Optional, List
from pymongo import MongoClient
from bson import ObjectId
from .models import UserDB, User, user_db_to_user, user_db_to_user_response
from .password_utils import hash_password, verify_password

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "aiwf")

def get_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email from database"""
    db = get_db()
    user_doc = db.users.find_one({"email": email})
    if user_doc:
        return user_db_to_user(user_doc)
    return None

def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID from database"""
    db = get_db()
    try:
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            return user_db_to_user(user_doc)
    except:
        pass
    return None

def create_user(email: str, password: str, name: Optional[str] = None) -> User:
    """Create a new user in database"""
    db = get_db()
    now = datetime.utcnow()
    
    # Hash the password
    password_hash = hash_password(password)
    
    # Set initial profile
    profile = {}
    if name:
        profile["name"] = name
    
    user_data = {
        "email": email,
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
        "is_active": True,
        "role": "admin" if email == "admin@aiwf.local" else "user",
        "preferences": {},
        "profile": profile
    }
    
    result = db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    
    return user_db_to_user(user_data)

def authenticate_user(email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password"""
    db = get_db()
    user_doc = db.users.find_one({"email": email})
    
    if not user_doc:
        return None
    
    if not user_doc.get("is_active", True):
        return None
    
    if not verify_password(password, user_doc["password_hash"]):
        return None
    
    # Update last login
    now = datetime.utcnow()
    db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login": now, "updated_at": now}}
    )
    
    # Return updated user
    user_doc["last_login"] = now
    user_doc["updated_at"] = now
    return user_db_to_user(user_doc)

def update_user_login(email: str) -> Optional[User]:
    """Update user's last login time"""
    db = get_db()
    now = datetime.utcnow()
    
    result = db.users.update_one(
        {"email": email},
        {"$set": {"last_login": now, "updated_at": now}}
    )
    
    if result.matched_count > 0:
        return get_user_by_email(email)
    return None

def update_user(user_id: str, update_data: dict) -> Optional[User]:
    """Update user data"""
    db = get_db()
    update_data["updated_at"] = datetime.utcnow()
    
    # Handle password update
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data["password"])
        del update_data["password"]
    
    try:
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count > 0:
            return get_user_by_id(user_id)
    except:
        pass
    return None

def list_users(skip: int = 0, limit: int = 50) -> List[User]:
    """List all users with pagination"""
    db = get_db()
    users = []
    
    cursor = db.users.find().skip(skip).limit(limit).sort("created_at", -1)
    for user_doc in cursor:
        users.append(user_db_to_user(user_doc))
    
    return users

def delete_user(user_id: str) -> bool:
    """Delete user (soft delete by setting is_active=False)"""
    db = get_db()
    try:
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return result.matched_count > 0
    except:
        return False

def email_exists(email: str) -> bool:
    """Check if email already exists in database"""
    db = get_db()
    return db.users.find_one({"email": email}) is not None 