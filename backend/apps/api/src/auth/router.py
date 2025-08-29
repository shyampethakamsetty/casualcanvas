from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import os
from .models import (
    LoginRequest, RegisterRequest, LoginResponse,
    RefreshRequest, RefreshResponse, User, UserResponse, UserUpdateRequest
)
from .jwt_utils import create_access_token, create_refresh_token, verify_token
from .db_operations import (
    authenticate_user, create_user, get_user_by_id, update_user, 
    list_users, delete_user, email_exists
)

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """Register a new user"""
    try:
        # Check if email already exists
        if email_exists(request.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user = create_user(request.email, request.password, request.name)
        
        # Create user data for tokens
        user_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }
        
        # Generate tokens
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                role=user.role,
                created_at=user.created_at,
                last_login=user.last_login,
                preferences=user.preferences,
                profile=user.profile
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    try:
        # Authenticate user
        user = authenticate_user(request.email, request.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create user data for tokens
        user_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }
        
        # Generate tokens
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                role=user.role,
                created_at=user.created_at,
                last_login=user.last_login,
                preferences=user.preferences,
                profile=user.profile
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: RefreshRequest):
    """Refresh access token using refresh token"""
    payload = verify_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Get updated user data from database
    user = get_user_by_id(payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Create new access token with updated user data
    user_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(user_data)
    
    return RefreshResponse(access_token=access_token)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user from database using ID from token
    user_id = payload.get("sub")
    user = get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        preferences=current_user.preferences,
        profile=current_user.profile
    )

@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user profile and preferences"""
    update_dict = {}
    if update_data.preferences is not None:
        update_dict["preferences"] = update_data.preferences
    if update_data.profile is not None:
        update_dict["profile"] = update_data.profile
    if update_data.password is not None:
        update_dict["password"] = update_data.password
    
    updated_user = update_user(current_user.id, update_dict)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user")
    
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        is_active=updated_user.is_active,
        role=updated_user.role,
        created_at=updated_user.created_at,
        last_login=updated_user.last_login,
        preferences=updated_user.preferences,
        profile=updated_user.profile
    )

# Admin endpoints
@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """List all users (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = list_users(skip=skip, limit=limit)
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            role=user.role,
            created_at=user.created_at,
            last_login=user.last_login,
            preferences=user.preferences,
            profile=user.profile
        )
        for user in users
    ]

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user by ID (admin only or own profile)"""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        last_login=user.last_login,
        preferences=user.preferences,
        profile=user.profile
    )

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_admin(
    user_id: str,
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {}
    if update_data.preferences is not None:
        update_dict["preferences"] = update_data.preferences
    if update_data.profile is not None:
        update_dict["profile"] = update_data.profile
    if update_data.is_active is not None:
        update_dict["is_active"] = update_data.is_active
    if update_data.password is not None:
        update_dict["password"] = update_data.password
    
    updated_user = update_user(user_id, update_dict)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        is_active=updated_user.is_active,
        role=updated_user.role,
        created_at=updated_user.created_at,
        last_login=updated_user.last_login,
        preferences=updated_user.preferences,
        profile=updated_user.profile
    )

@router.delete("/users/{user_id}")
async def delete_user_admin(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}
