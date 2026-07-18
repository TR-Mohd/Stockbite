import os
import logging
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .database import get_db
from .models import User, RoleEnum, AuditLog
from .schemas import TokenData, PinAuthRequest, RefreshTokenRequest
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable not set")
ALGORITHM = "HS256"
logger = logging.getLogger(__name__)
ACCESS_TOKEN_EXPIRE_MINUTES = 15 # 15 minutes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials: Username is None")
        token_data = TokenData(username=username, role=role)
    except JWTError as e:
        logger.error(f"JWTError: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Exception during token validation: {str(e)}")
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.username == token_data.username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

def role_required(required_roles: list[RoleEnum]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles and current_user.role != RoleEnum.Manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token")
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account deactivated. Please contact your manager.",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(hours=24)
    refresh_token = create_access_token(
        data={"sub": user.username, "type": "refresh"}, expires_delta=refresh_token_expires
    )
    
    # Record login activity
    audit_log = AuditLog(
        user_id=user.id,
        action="login",
        resource="auth",
        outcome="success"
    )
    db.add(audit_log)
    await db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"username": user.name, "role": user.role.value}
    }

@router.post("/refresh")
@limiter.limit("5/minute")
async def refresh_token(request: Request, refresh_request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if user is None or not user.is_active:
        raise credentials_exception

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/pin-auth")
@limiter.limit("5/minute")
async def authorize_manager_pin(request: Request, pin_request: PinAuthRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == RoleEnum.Manager, User.is_active == True))
    managers = result.scalars().all()
    
    authorized_manager = None
    for manager in managers:
        if manager.hashed_pin and verify_password(pin_request.pin, manager.hashed_pin):
            authorized_manager = manager
            break
            
    if not authorized_manager:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid manager PIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=5)
    access_token = create_access_token(
        data={"sub": authorized_manager.username, "role": authorized_manager.role.value, "scopes": ["void", "refund"]},
        expires_delta=access_token_expires
    )
    
    audit_log = AuditLog(
        user_id=authorized_manager.id,
        action="pin_auth",
        resource="auth",
        outcome="success"
    )
    db.add(audit_log)
    await db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": authorized_manager.name, "role": authorized_manager.role.value}
    }
