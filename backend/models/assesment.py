from typing import Literal

from pydantic import BaseModel, Field

from backend.models.recommendation import Recommendation


class Part(BaseModel):
    name: str
    searchQuery: str  # generic product string — frontend builds links for Amazon, REI, evo, Backcountry, Peter Glenn


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


class AssessmentResponse(BaseModel):
    equipmentType: str
    brand: str
    safeToSki: bool
    severity: int = Field(ge=1, le=5)
    verdict: Literal["DIY", "SHOP"]
    shopCostEstimate: str
    timeEstimate: str
    skillLevel: Literal["beginner", "intermediate", "advanced"]
    repairSteps: list[str]
    partsList: list[Part]
    youtubeSuggestions: list[str]
    recommendations: list[Recommendation] = []  # set by orchestrator, not Gemini
