from fastapi import APIRouter, HTTPException, Response, status

from backend.models.user import CreateUserRequest, UpdateUserRequest, UserListResponse, UserResponse
from backend.services.users import create_user, delete_user, get_user, list_users, update_user


router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def get_users() -> UserListResponse:
    return list_users()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_record(payload: CreateUserRequest) -> UserResponse:
    return create_user(payload)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_record(user_id: str) -> UserResponse:
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user_record(user_id: str, payload: UpdateUserRequest) -> UserResponse:
    user = update_user(user_id, payload)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_record(user_id: str) -> Response:
    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
