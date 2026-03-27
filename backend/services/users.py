from datetime import UTC, datetime
from uuid import uuid4

from backend.models.user import CreateUserRequest, UpdateUserRequest, UserListResponse, UserResponse


_USER_STORE: dict[str, UserResponse] = {}


def list_users() -> UserListResponse:
    return UserListResponse(users=list(_USER_STORE.values()))


def create_user(payload: CreateUserRequest) -> UserResponse:
    timestamp = datetime.now(UTC)
    user = UserResponse(
        id=str(uuid4()),
        createdAt=timestamp,
        updatedAt=timestamp,
        **payload.model_dump(),
    )
    _USER_STORE[user.id] = user
    return user


def get_user(user_id: str) -> UserResponse | None:
    return _USER_STORE.get(user_id)


def update_user(user_id: str, payload: UpdateUserRequest) -> UserResponse | None:
    user = _USER_STORE.get(user_id)
    if user is None:
        return None

    updates = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    updated_user = user.model_copy(
        update={
            **updates,
            "updatedAt": datetime.now(UTC),
        }
    )
    _USER_STORE[user_id] = updated_user
    return updated_user


def delete_user(user_id: str) -> bool:
    return _USER_STORE.pop(user_id, None) is not None


def reset_user_store() -> None:
    _USER_STORE.clear()
