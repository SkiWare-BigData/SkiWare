from datetime import date
from datetime import UTC, datetime
from typing import Any

from pydantic import ValidationError

from backend.models.user import UserListResponse, UserResponse, UserWrite
from backend.services.calculate_DIN import calculate_din

_USER_STORE: dict[str, UserResponse] = {}


def list_users() -> UserListResponse:
    return UserListResponse(users=list(_USER_STORE.values()))


def get_user(user_id: str) -> UserResponse | None:
    return _USER_STORE.get(user_id)


def upsert_user(user_id: str, payload: UserWrite, din: float) -> tuple[UserResponse, bool]:
    existing_user = _USER_STORE.get(user_id)
    timestamp = datetime.now(UTC)
    created_at = timestamp if existing_user is None else existing_user.createdAt

    updated_user = UserResponse(
        id=user_id,
        DIN=din,
        createdAt=created_at,
        updatedAt=timestamp,
        **payload.model_dump(),
    )
    _USER_STORE[user_id] = updated_user
    return updated_user, existing_user is None


def delete_user(user_id: str) -> bool:
    return _USER_STORE.pop(user_id, None) is not None

def _calculate_age(birthday: date) -> int:
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))

def reset_user_store() -> None:
    _USER_STORE.clear()

def serialize_validation_error(exc: ValidationError) -> list[dict[str, Any]]:
    return [
        {
            "type": error["type"],
            "loc": error["loc"],
            "msg": error["msg"],
            "input": error.get("input"),
        }
        for error in exc.errors()
    ]


def validate_user_write(payload: dict[str, Any]) -> tuple[UserWrite | None, list[dict[str, Any]] | None]:
    try:
        return UserWrite.model_validate(payload), None
    except ValidationError as exc:
        return None, serialize_validation_error(exc)
    

def assign_din(user: UserWrite) -> tuple[float | None, str | None]:
    if (
        user.skierType is None
        or user.birthday is None
        or user.weightKg is None
        or user.heightCm is None
        or user.bootSoleLengthMm is None
    ):
        return (
            None,
            (
                "DIN requires skierType, birthday, weightKg, heightCm, "
                "and bootSoleLengthMm."
            ),
        )

    try:
        return (
            calculate_din(
            weight=user.weightKg,
            boot_sole_length_mm=user.bootSoleLengthMm,
            age=_calculate_age(user.birthday),
            skier_type=user.skierType,
            ),
            None,
        )
    except ValueError as exc:
        return None, str(exc)
