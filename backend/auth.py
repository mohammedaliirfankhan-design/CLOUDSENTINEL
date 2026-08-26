import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()

# Password hashing using Argon2
password_hash = PasswordHash.recommended()


# JWT configuration
SECRET_KEY = os.getenv(
    "CLOUDSENTINEL_SECRET_KEY",
    "cloudsentinel-development-secret-change-me"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored password hash."""
    return password_hash.verify(password, hashed_password)

def create_access_token(
    username: str,
    role: str,
    expires_delta: timedelta | None = None
) -> str:
    """Create a signed JWT access token."""

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": username,
        "role": role,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate the bearer token and return the authenticated user."""

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    username = payload.get("sub")
    role = payload.get("role")

    if not username or not role:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    return {
        "username": username,
        "role": role
    }

def require_role(required_role: str):
    """Require the authenticated user to have a specific role."""

    def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:

        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return current_user

    return role_checker

def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Require the authenticated user to have SOC_ADMIN privileges."""

    if current_user["role"] != "SOC_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    return current_user