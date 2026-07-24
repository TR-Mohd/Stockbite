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
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from .database import get_db
from .models import User, RoleEnum, AuditLog
from .schemas import TokenData, PinAuthRequest, RefreshTokenRequest, InitialSetupRequest
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
        is_super_admin: bool = payload.get("is_super_admin", False)
        if username is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials: Username is None")
        token_data = TokenData(username=username, role=role, is_super_admin=is_super_admin)
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

@router.get("/setup-status")
async def get_setup_status(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(func.count(User.id)))
    user_count = res.scalar() or 0
    return {"setup_required": user_count == 0}

@router.post("/setup")
@limiter.limit("5/minute")
async def initial_setup(request: Request, setup_data: InitialSetupRequest, db: AsyncSession = Depends(get_db)):
    res_count = await db.execute(select(func.count(User.id)))
    user_count = res_count.scalar() or 0
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Initial setup has already been completed"
        )

    res_user = await db.execute(select(User).where(User.username == setup_data.username))
    if res_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")

    from datetime import datetime, timezone
    year = str(datetime.now(timezone.utc).year)[-2:]
    res_seq = await db.execute(
        select(User.id)
        .where(User.id.like(f"EMP-%-{year}%"))
        .order_by(User.id.desc())
    )
    max_id = res_seq.scalars().first()
    if max_id:
        try:
            seq = int(max_id[-3:])
            init_id = f"EMP-MGR-{year}{seq + 1:03d}"
        except ValueError:
            init_id = f"EMP-MGR-{year}100"
    else:
        init_id = f"EMP-MGR-{year}100"

    new_user = User(
        id=init_id,
        name=setup_data.name,
        username=setup_data.username,
        role=RoleEnum.Manager,
        hashed_password=get_password_hash(setup_data.password),
        phone_number=setup_data.phone_number,
        email=setup_data.email,
        is_active=True,
        is_super_admin=True
    )

    db.add(new_user)
    
    audit_entry = AuditLog(
        user_id=new_user.id,
        action="initial_setup",
        resource=f"users/{new_user.id}",
        outcome="success",
        details={"username": new_user.username, "role": new_user.role.value, "is_super_admin": True}
    )
    db.add(audit_entry)
    
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Initial setup has already been completed or username already exists")

    return {
        "id": new_user.id,
        "name": new_user.name,
        "username": new_user.username,
        "role": new_user.role.value,
        "is_super_admin": new_user.is_super_admin,
        "message": "Initial setup completed successfully"
    }

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
        data={"sub": user.username, "role": user.role.value, "is_super_admin": user.is_super_admin}, expires_delta=access_token_expires
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
        "user": {"username": user.name, "role": user.role.value, "is_super_admin": user.is_super_admin}
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
        data={"sub": user.username, "role": user.role.value, "is_super_admin": user.is_super_admin}, expires_delta=access_token_expires
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
