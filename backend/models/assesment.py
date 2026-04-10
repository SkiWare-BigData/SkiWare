from typing import Literal

from pydantic import BaseModel, Field, field_validator

from backend.models.recommendation import Recommendation


EquipmentType = Literal["skis", "snowboard"]
EquipmentAge = Literal["0-1 years", "1-2 years", "2-5 years", "5+ years"]
SnowCondition = Literal["powder", "ice", "hybrid"]
TerrainType = Literal["groomed", "ungroomed", "hybrid"]
SkillLevel = Literal["beginner", "intermediate", "advanced", "expert", "park"]


class AssessmentRequest(BaseModel):
    equipmentType: EquipmentType
    brand: str = Field(default="", max_length=60)
    model: str = Field(default="", max_length=60)
    lengthCm: int | None = Field(default=None, ge=80, le=220)
    age: EquipmentAge = "1-2 years"

    snowCondition: SnowCondition = "hybrid"
    terrainType: TerrainType = "hybrid"
    skillLevel: SkillLevel = "intermediate"

    heightIn: float | None = Field(default=None, gt=0, le=96)
    weightLbs: float | None = Field(default=None, gt=0, le=500)

    daysSinceWax: int = Field(default=5, ge=0, le=60)
    daysSinceEdgeWork: int = Field(default=10, ge=0, le=60)
    coreShots: int = Field(default=0, ge=0, le=20)

    issueDescription: str = Field(default="", max_length=1000)

    @field_validator("lengthCm", "heightIn", "weightLbs", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @field_validator("brand", "model", "issueDescription", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AssessmentResponse(BaseModel):
    equipmentType: EquipmentType
    brand: str
    snowCondition: SnowCondition
    terrainType: TerrainType
    skillLevel: SkillLevel
    daysSinceWax: int
    daysSinceEdgeWork: int
    recommendations: list[Recommendation]
    tips: list[str]
