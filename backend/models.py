from typing import Literal

from pydantic import BaseModel, Field, field_validator


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


class Recommendation(BaseModel):
    title: str
    severity: Literal["LOW", "MEDIUM", "HIGH"]
    description: str


class AssessmentResponse(BaseModel):
    equipmentType: Literal["skis", "snowboard"]
    brand: str
    terrain: str
    style: str
    daysSinceWax: int
    daysSinceEdgeWork: int
    recommendations: list[Recommendation]
    tips: list[str]


class ShopResult(BaseModel):
    name: str
    address: str
    phone: str | None = None
    rating: float | None = None
    open_now: bool | None = None
    google_maps_url: str
    distance_miles: float
    lat: float
    lng: float


class ShopsResponse(BaseModel):
    origin_lat: float
    origin_lng: float
    radius_miles: int
    shops: list[ShopResult]


class GeocodeResponse(BaseModel):
    lat: float
    lng: float
    formatted_address: str
