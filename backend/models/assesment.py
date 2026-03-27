from typing import Literal

from pydantic import BaseModel, Field, field_validator

from backend.models.recommendation import Recommendation


class AssessmentRequest(BaseModel):
    equipmentType: Literal["skis", "snowboard"] = "skis"
    brand: str = ""
    length: int | None = None
    age: str = "1-2 years"
    terrain: str = "hybrid"
    style: str = "both"
    daysSinceWax: int = Field(default=5, ge=0, le=30)
    daysSinceEdgeWork: int = Field(default=10, ge=0, le=30)
    coreShots: int = Field(default=0, ge=0, le=10)
    height: int | None = None
    weight: int | None = None
    issueDescription: str = ""

    @field_validator("length", "height", "weight", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class AssessmentResponse(BaseModel):
    equipmentType: Literal["skis", "snowboard"]
    brand: str
    terrain: str
    style: str
    daysSinceWax: int
    daysSinceEdgeWork: int
    recommendations: list[Recommendation]
    tips: list[str]
