from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


SkillLevel = Literal["beginner", "intermediate", "advanced", "expert"]
EquipmentPreference = Literal["skis", "snowboard", "both"]
TerrainPreference = Literal["groomers", "park", "powder", "backcountry", "hybrid"]


class UserContractBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    skillLevel: SkillLevel = "intermediate"
    preferredEquipment: EquipmentPreference = "skis"
    preferredTerrain: TerrainPreference = "hybrid"

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


class CreateUserRequest(UserContractBase):
    pass


class UpdateUserRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, min_length=5, max_length=254)
    skillLevel: SkillLevel | None = None
    preferredEquipment: EquipmentPreference | None = None
    preferredTerrain: TerrainPreference | None = None

    @field_validator("name", "email")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("value must not be blank")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_optional_email_shape(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("value must be a valid email address")
        return value.lower()


class UserResponse(UserContractBase):
    id: str
    createdAt: datetime
    updatedAt: datetime


class UserListResponse(BaseModel):
    users: list[UserResponse]
