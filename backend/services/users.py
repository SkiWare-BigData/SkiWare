from datetime import date
from typing import Any

from pydantic import ValidationError

from backend.db.connection import get_db
from backend.models.user import UserListResponse, UserResponse, UserWrite
from backend.services.calculate_DIN import calculate_din

_SELECT_COLS = (
    "id, name, email, sport, skill_level, preferred_equipment, preferred_terrain, "
    "skier_type, birthday, weight_kg, height_cm, boot_sole_length_mm, din, "
    "created_at, updated_at"
)


def _row_to_user_response(col_names: list[str], row: tuple) -> UserResponse:
    d = dict(zip(col_names, row))
    return UserResponse(
        id=d["id"],
        name=d["name"],
        email=d["email"],
        sport=d["sport"],
        skillLevel=d["skill_level"],
        preferredEquipment=d["preferred_equipment"],
        preferredTerrain=d["preferred_terrain"],
        skierType=d.get("skier_type"),
        birthday=d.get("birthday"),
        weightKg=float(d["weight_kg"]) if d.get("weight_kg") is not None else None,
        heightCm=float(d["height_cm"]) if d.get("height_cm") is not None else None,
        bootSoleLengthMm=d.get("boot_sole_length_mm"),
        DIN=float(d["din"]),
        createdAt=d["created_at"],
        updatedAt=d["updated_at"],
    )


def list_users() -> UserListResponse:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {_SELECT_COLS} FROM users")
    rows = cursor.fetchall()
    col_names = [col[0] for col in cursor.description]
    cursor.close()
    return UserListResponse(users=[_row_to_user_response(col_names, row) for row in rows])


def get_user(user_id: str) -> UserResponse | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {_SELECT_COLS} FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    col_names = [col[0] for col in cursor.description]
    cursor.close()
    if row is None:
        return None
    return _row_to_user_response(col_names, row)


def upsert_user(user_id: str, payload: UserWrite, din: float) -> tuple[UserResponse, bool]:
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    is_new = cursor.fetchone() is None

    if is_new:
        cursor.execute(
            f"""INSERT INTO users (id, name, email, sport, skill_level, preferred_equipment,
                preferred_terrain, skier_type, birthday, weight_kg, height_cm,
                boot_sole_length_mm, din, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING {_SELECT_COLS}""",
            (
                user_id, payload.name, payload.email, payload.sport, payload.skillLevel,
                payload.preferredEquipment, payload.preferredTerrain, payload.skierType,
                payload.birthday, payload.weightKg, payload.heightCm,
                payload.bootSoleLengthMm, din,
            ),
        )
    else:
        cursor.execute(
            f"""UPDATE users
                SET name=%s, email=%s, sport=%s, skill_level=%s,
                    preferred_equipment=%s, preferred_terrain=%s, skier_type=%s,
                    birthday=%s, weight_kg=%s, height_cm=%s, boot_sole_length_mm=%s,
                    din=%s, updated_at=NOW()
                WHERE id=%s
                RETURNING {_SELECT_COLS}""",
            (
                payload.name, payload.email, payload.sport, payload.skillLevel,
                payload.preferredEquipment, payload.preferredTerrain, payload.skierType,
                payload.birthday, payload.weightKg, payload.heightCm,
                payload.bootSoleLengthMm, din, user_id,
            ),
        )

    row = cursor.fetchone()
    col_names = [col[0] for col in cursor.description]
    conn.commit()
    cursor.close()
    return _row_to_user_response(col_names, row), is_new


def delete_user(user_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
    deleted = cursor.fetchone() is not None
    conn.commit()
    cursor.close()
    return deleted


def reset_user_store() -> None:
    """Truncate users table. Used by tests to reset state between test cases."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE users")
    conn.commit()
    cursor.close()


def _calculate_age(birthday: date) -> int:
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))


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
