from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import ACCESS_TOKEN_EXPIRE_DAYS, ALGORITHM, SECRET_KEY
from backend.database import get_db
from backend.models.user import UserResponse
from backend.services.users import get_user

COOKIE_NAME = "access_token"


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserResponse | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    user_id = decode_access_token(token)
    if not user_id:
        return None
    return await get_user(db, user_id)


async def require_current_user(
    user: UserResponse | None = Depends(get_current_user),
) -> UserResponse:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user
