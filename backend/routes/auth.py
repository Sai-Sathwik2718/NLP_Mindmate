import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.database.connection import get_db
from backend.models.models import User, ActivityLog, UserSession
from backend.models.schemas import UserRegister, UserResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest
from backend.services.auth_service import get_password_hash, verify_password, create_access_token, create_refresh_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if username exists
    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
        
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create user
    # First user registered is an admin, others are normal users (for placement setup demo ease)
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log activity
    log = ActivityLog(user_id=new_user.id, action="register", details=f"User {new_user.username} registered.")
    db.add(log)
    db.commit()
    
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate a user, issue access and refresh tokens, and track user sessions."""
    # Lookup user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
        
    if user.is_suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is suspended")
        
    # Create tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Store refresh token in user_sessions table
    from backend.config.config import settings
    expires_at = datetime.datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=expires_at
    )
    db.add(session)
    
    # Log activity
    log = ActivityLog(user_id=user.id, action="login", details=f"User {user.username} logged in with session.")
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh(token_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Validates refresh token, invalidates old ones, and returns new access/refresh credentials."""
    from jose import JWTError, jwt
    from backend.config.config import settings
    
    try:
        payload = jwt.decode(token_in.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id_str is None or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token details")
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        
    # Check if session exists in DB and is active/not revoked
    db_session = db.query(UserSession).filter(
        UserSession.refresh_token == token_in.refresh_token,
        UserSession.user_id == user_id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.datetime.utcnow()
    ).first()
    
    if not db_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or revoked")
        
    # Revoke old session
    db_session.is_revoked = True
    db_session.expires_at = datetime.datetime.utcnow() # Expire immediately
    
    # Generate new pair
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active or user.is_suspended:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account status blocked")
         
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    # Save new session
    new_expires_at = datetime.datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_db_session = UserSession(
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=new_expires_at
    )
    db.add(new_db_session)
    
    # Log activity
    log = ActivityLog(user_id=user.id, action="token_refresh", details=f"User {user.username} rotated token credentials.")
    db.add(log)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@router.get("/verify-email/{user_id}")
def verify_email(user_id: int, db: Session = Depends(get_db)):
    """Simulates verifying user email after user registration."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Mark as active
    user.is_active = True
    
    log = ActivityLog(user_id=user.id, action="email_verified", details=f"User {user.username} verified email.")
    db.add(log)
    db.commit()
    return {"message": f"Email verified successfully for user {user.username}."}

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiates a password reset (mocked for demo purposes)."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    
    # In a full app, we would send a token via email. Here, we confirm trigger.
    return {"message": "Password reset email sent (simulation)."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password to new value (directly updates in DB for demo purposes)."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    # Log activity
    log = ActivityLog(user_id=user.id, action="password_reset", details=f"User {user.username} reset their password.")
    db.add(log)
    db.commit()
    
    return {"message": "Password has been reset successfully."}
