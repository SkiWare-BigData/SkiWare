from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator


SkillLevel = Literal["beginner", "intermediate", "advanced", "expert"]
EquipmentPreference = Literal["skis", "snowboard", "both"]
TerrainPreference = Literal["groomers", "park", "powder", "backcountry", "hybrid"]
SnowSport = Literal["Skier", "Snowboarder"]


class UserWrite(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    sport: SnowSport = "Skier"
    skillLevel: SkillLevel = "intermediate"
    preferredEquipment: EquipmentPreference = "skis"
    preferredTerrain: TerrainPreference = "hybrid"
    skierType: int | None = Field(default=None, ge=1, le=3)
    birthday: date | None = None
    weightKg: float | None = Field(default=None, gt=0, le=300)
    heightCm: float | None = Field(default=None, gt=0, le=300)
    bootSoleLengthMm: int | None = Field(default=None, ge=200, le=400)

    @field_validator("name", "email")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("value must not be blank")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email_shape(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("value must be a valid email address")
        return value.lower()

    @field_validator("skierType", "birthday", "weightKg", "heightCm", "bootSoleLengthMm", mode="before")
    @classmethod
    def empty_profile_value_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @field_validator("birthday")
    @classmethod
    def validate_birthday(cls, value: date | None) -> date | None:
        if value is None:
            return value
        if value >= date.today():
            raise ValueError("birthday must be in the past")
        return value


class UserResponse(UserWrite):
    id: str
    DIN: float
    createdAt: datetime
    updatedAt: datetime


class UserListResponse(BaseModel):
    users: list[UserResponse]
