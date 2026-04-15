from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import ACCESS_TOKEN_EXPIRE_DAYS
from backend.database import get_db
from backend.models.user import UserResponse
from backend.services.auth import COOKIE_NAME, create_access_token, get_current_user
from backend.services.users import authenticate_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 3600,
        secure=False,  # set True behind HTTPS in production
    )


@router.post("/login", response_model=UserResponse, response_model_exclude_none=True)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    _set_auth_cookie(response, create_access_token(user.id))
    return user


@router.get("/me", response_model=UserResponse, response_model_exclude_none=True)
async def me(
    user: UserResponse | None = Depends(get_current_user),
) -> UserResponse:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}
